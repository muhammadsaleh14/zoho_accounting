# --- File: apps/backend/app/api/v1/documents.py ---

import shutil
import json
import os
import time
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from pdf2image import convert_from_path

from app.db.session import get_db
from app.services.ai_extractor import analyze_document
from app.crud import crud_vendor, crud_invoice
from app.schemas.unified import ExtractedData, InvoiceResponse 
from app.models.accounting import Invoice

# --- NEW IMPORTS FOR MOCK MODE ---
from app.core.config import settings
from app.services.mock_factory import mock_service

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/invoices", response_model=List[InvoiceResponse])
def get_all_invoices(db: Session = Depends(get_db)):
    # --- DEMO MODE CHECK ---
    if settings.DEMO_MODE:
        return mock_service.get_all_invoices()
    # -----------------------

    # Return SQLAlchemy objects directly. 
    # Pydantic (InvoiceResponse) will handle validation and serialization.
    return crud_invoice.get_invoices(db)

@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
def get_invoice_by_id(invoice_id: int, db: Session = Depends(get_db)):
    """
    Fetches a single invoice by its database ID.
    """
    # --- DEMO MODE CHECK ---
    if settings.DEMO_MODE:
        invoice = mock_service.get_invoice_by_id(invoice_id)
        if not invoice:
            raise HTTPException(status_code=404, detail="Mock Invoice not found")
        return invoice
    # -----------------------

    db_invoice = crud_invoice.get_invoice(db, invoice_id=invoice_id)
    if db_invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Return SQLAlchemy object directly
    return db_invoice

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
    category: str = Form(...), # We rely on this for Sales vs Purchase distinction
    db: Session = Depends(get_db)
):
    """
    MODIFIED WORKFLOW:
    1. Saves file (Shared).
    2. CHECK: If Demo Mode -> Use Mock Factory -> Return.
    3. If Real Mode -> Run AI extraction -> Force Category -> DB Save -> Return.
    """
    
    # --- SHARED: FILE SAVING LOGIC (Must happen for both modes) ---
    original_filename = f"{int(time.time())}_{file.filename}"
    original_filepath = os.path.join(UPLOAD_DIR, original_filename)
    
    # Save the original file first
    with open(original_filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # PDF to Image Conversion Logic (Shared)
    preview_image_filename = original_filename
    
    if file.content_type == "application/pdf":
        print("🖼️  PDF detected. Converting first page to JPEG for preview...")
        try:
            # Generate a new filename for the JPEG preview
            jpeg_filename = os.path.splitext(original_filename)[0] + "_preview.jpeg"
            jpeg_filepath = os.path.join(UPLOAD_DIR, jpeg_filename)
            
            # Convert the first page of the PDF to a JPEG image
            images = convert_from_path(original_filepath, first_page=1, last_page=1, fmt='jpeg')
            if images:
                images[0].save(jpeg_filepath, 'JPEG')
                preview_image_filename = jpeg_filename # Use the new JPEG as the preview
                print(f"✅  Conversion successful. Preview saved to {jpeg_filename}")
        except Exception as e:
            print(f"⚠️ PDF conversion failed: {e}. Using original file path.")
    
    # The URL for the database and frontend will always point to an image now
    image_url_for_db = f"/images/{preview_image_filename}"
    # --- END SHARED LOGIC ---

    # --- DEMO MODE CHECK ---
    if settings.DEMO_MODE:
        print("🤖 [DEMO MODE] Using ai_extractor mock data for accuracy.")
        with open(original_filepath, "rb") as f:
            file_bytes = f.read()

        extracted_data = await analyze_document(file_bytes, db, file.content_type, filename=file.filename)
        
        # Override Category in Demo Mode too
        extracted_data.category = category 

        # Simulate vendor check
        if extracted_data.vendor:
            extracted_data.vendor.is_new = False
            extracted_data.vendor.existing_id = 123 # Mock existing ID
        
        # Manually construct a valid InvoiceResponse object from extracted data
        response_data = {
            "id": int(time.time()),
            "vendor_id": extracted_data.vendor.existing_id if extracted_data.vendor else None,
            "vendor_name_raw": extracted_data.vendor.name if extracted_data.vendor else "Unknown",
            "date": extracted_data.date,
            "due_date": extracted_data.date, # Default due date
            "amount": extracted_data.total_amount,
            "currency": extracted_data.currency,
            "tax_amount": extracted_data.tax_amount,
            "invoice_number": extracted_data.invoice_number,
            "reference_number": extracted_data.reference_number,
            "discount": extracted_data.discount,
            "adjustment": 0.0,
            "status": "review",
            "category": category, # Force category
            "image_url": image_url_for_db,
            "compliance_data": extracted_data.compliance.model_dump() if extracted_data.compliance else None,
            "zoho_bill_id": None,
            "created_at": datetime.now(),
            "line_items": [
                {
                    "id": item_idx + 1,
                    "description": item.description,
                    "quantity": item.quantity,
                    "rate": item.rate,
                    "zoho_account_id": item.accountId
                } for item_idx, item in enumerate(extracted_data.line_items)
            ]
        }
        
        # Add to the in-memory DB for the GET /invoices call to work
        mock_service.get_all_invoices().insert(0, response_data)

        return response_data
    # -----------------------

    # --- EXISTING REAL LOGIC ---
    with open(original_filepath, "rb") as f:
        file_bytes = f.read()
    
    mime_type = file.content_type or "application/pdf"

    print(f"--- Analyzing {original_filename} with Gemini (Real Flow) ---")
    extracted_data = await analyze_document(file_bytes, db, mime_type, filename=file.filename)

    # **CRITICAL**: Override category with user selection
    extracted_data.category = category

    
    # ... (Category Validation and Vendor Enrichment logic remains the same) ...
    if extracted_data.vendor and extracted_data.vendor.name:
        existing_vendor = crud_vendor.get_vendor_by_name(db, extracted_data.vendor.name)
        if existing_vendor:
            extracted_data.vendor.is_new = False
            extracted_data.vendor.existing_id = existing_vendor.id

    # --- Save the result to the database ---
    try:
        invoice_data_for_db = {
            "vendor_id": extracted_data.vendor.existing_id if extracted_data.vendor else None,
            "vendor_name_raw": extracted_data.vendor.name if extracted_data.vendor else "Unknown",
            "date": extracted_data.date,
            "invoice_number": extracted_data.invoice_number,
            "reference_number": extracted_data.reference_number, # Ensure this is mapped
            
            # --- NEW: Save the AI Summary ---
            "notes": extracted_data.notes, 
            
            "amount": extracted_data.total_amount,
            "tax_amount": extracted_data.tax_amount,
            "currency": extracted_data.currency,
            "status": "review",
            "category": category, 
            "image_url": image_url_for_db,
            "compliance_data": extracted_data.compliance.model_dump() if extracted_data.compliance else None,
        }
        
        line_items_for_db = [item.model_dump() for item in extracted_data.line_items]

        db_invoice = crud_invoice.create_invoice_with_lines(
            db=db,
            invoice_data=invoice_data_for_db,
            line_items_data=line_items_for_db
        )
        print(f"✅ Saved new invoice to Real DB with ID: {db_invoice.id}")

        # CHANGED: Return the DB object directly.
        # Pydantic will validate this against InvoiceResponse (which now expects date objects).
        return db_invoice

    except Exception as e:
        print(f"❌ DATABASE ERROR during upload: {e}")
        # Import traceback to see the actual error in console if needed
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to save extracted data to the database.")