import shutil
import json
from typing import List
from app.crud import crud_vendor, crud_invoice
from app.models.accounting import Invoice
import os
import time
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.ai_extractor import analyze_document
from app.crud import crud_vendor
from app.schemas.unified import ExtractedData
from app.schemas.unified import ExtractedData, InvoiceResponse 

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/invoices", response_model=List[InvoiceResponse])
def get_all_invoices(db: Session = Depends(get_db)):
    """
    Fetches all processed documents and manually prepares them for the response
    to ensure correct date formatting.
    """
    db_invoices = crud_invoice.get_invoices(db)
    
    # Explicitly construct the response data to avoid serialization errors
    response_data = []
    for inv in db_invoices:
        inv_dict = {
            "id": inv.id,
            "vendor_id": inv.vendor_id,
            "vendor_name_raw": inv.vendor_name_raw,
            # This is the key fix: convert date objects to strings
            "date": inv.date.isoformat() if inv.date else None,
            "due_date": inv.due_date.isoformat() if inv.due_date else None,
            "amount": inv.amount,
            "currency": inv.currency,
            "tax_amount": inv.tax_amount,
            "invoice_number": inv.invoice_number,
            "status": inv.status,
            "category": inv.category,
            "image_url": inv.image_url,
            "compliance_data": inv.compliance_data,
            "zoho_bill_id": inv.zoho_bill_id,
            "created_at": inv.created_at,
            "line_items": inv.line_items # Nested relationships will serialize correctly from here
        }
        response_data.append(inv_dict)
        
    return response_data


@router.get("/notifications")
def get_notifications():
    """
    Serves mock notification data from db.json for the UI.
    """
    try:
        with open("data/db.json", "r") as f:
            data = json.load(f)
            return data.get("notifications", [])
    except FileNotFoundError:
        return []

@router.post("/upload", response_model=InvoiceResponse) # Return the created DB object
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    MODIFIED WORKFLOW:
    1. Saves file.
    2. Runs AI extraction.
    3. Enriches data (Vendor Matching).
    4. SAVES the initial result to the database with 'review' status.
    5. Returns the newly created database record.
    """
    
    filename = f"{int(time.time())}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    image_url_for_db = f"/images/{filename}" # Use the relative path for the DB

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    with open(file_path, "rb") as f:
        file_bytes = f.read()
    
    mime_type = file.content_type or "image/jpeg"

    print(f"--- Analyzing {filename} with Gemini ---")
    extracted_data = await analyze_document(file_bytes, db, mime_type)
    
    # ... (Category Validation and Vendor Enrichment logic remains the same) ...
    if extracted_data.vendor and extracted_data.vendor.name:
        existing_vendor = crud_vendor.get_vendor_by_name(db, extracted_data.vendor.name)
        if existing_vendor:
            extracted_data.vendor.is_new = False
            extracted_data.vendor.existing_id = existing_vendor.id

    # --- NEW: Save the result to the database ---
    try:
        invoice_data_for_db = {
            "vendor_id": extracted_data.vendor.existing_id if extracted_data.vendor else None,
            "vendor_name_raw": extracted_data.vendor.name if extracted_data.vendor else "Unknown",
            "date": extracted_data.date,
            "invoice_number": extracted_data.invoice_number,
            "amount": extracted_data.total_amount,
            "tax_amount": extracted_data.tax_amount,
            "currency": extracted_data.currency,
            "status": "review", # Initial status
            "category": extracted_data.category,
            "image_url": image_url_for_db,
            "compliance_data": extracted_data.compliance.model_dump() if extracted_data.compliance else None,
        }
        
        line_items_for_db = [item.model_dump() for item in extracted_data.line_items]

        # Use the CRUD function to create the invoice and its lines
        db_invoice = crud_invoice.create_invoice_with_lines(
            db=db,
            invoice_data=invoice_data_for_db,
            line_items_data=line_items_for_db
        )
        print(f"✅ Saved new invoice to DB with ID: {db_invoice.id}")
        return db_invoice # Return the saved object

    except Exception as e:
        print(f"❌ DATABASE ERROR during upload: {e}")
        raise HTTPException(status_code=500, detail="Failed to save extracted data to the database.")
