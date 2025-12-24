import shutil
import os
import time
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.ai_extractor import analyze_document
from app.crud import crud_vendor
from app.schemas.unified import ExtractedData

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=ExtractedData)
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form(...), # User's intended category (bill, invoice, bank_statement)
    db: Session = Depends(get_db)
):
    """
    The Main Entry Point.
    1. Saves file temporarily.
    2. Runs AI extraction.
    3. Enriches data (Vendor Matching).
    4. Validates Category Intent.
    """
    
    # 1. Save File Locally
    # We use a timestamp to avoid name collisions
    filename = f"{int(time.time())}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Read bytes for AI
    with open(file_path, "rb") as f:
        file_bytes = f.read()
    
    mime_type = file.content_type or "image/jpeg"

    # 2. Call AI Service (The "Single-Shot" Analysis)
    print(f"--- Analyzing {filename} with Gemini ---")
    extracted_data = await analyze_document(file_bytes, db,mime_type)
    
    # 3. Category Validation (The "Guardrail")
    # If user selected "bank_statement" but AI sees "bill", warn them.
    ai_category = extracted_data.category.lower()
    user_category = category.lower()
    
    # Simple normalization map
    # (AI might return 'receipt', we map it to 'bill')
    cat_map = {"receipt": "bill", "invoice": "bill", "tax invoice": "bill"}
    normalized_ai_cat = cat_map.get(ai_category, ai_category)
    
    if normalized_ai_cat != user_category:
        # We don't stop the process, but we attach a warning
        extracted_data.warning_message = (
            f"Category Mismatch: You selected '{user_category}', "
            f"but this document looks like a '{normalized_ai_cat}'."
        )

    # 4. Vendor Enrichment (The "Smart Match")
    # If the AI found a vendor name, let's see if it exists in our DB
    if extracted_data.vendor and extracted_data.vendor.name:
        vendor_name_query = extracted_data.vendor.name
        
        # Call CRUD Layer
        existing_vendor = crud_vendor.get_vendor_by_name(db, vendor_name_query)
        
        if existing_vendor:
            print(f"✅ Found existing vendor: {existing_vendor.name} (ID: {existing_vendor.id})")
            extracted_data.vendor.is_new = False
            extracted_data.vendor.existing_id = existing_vendor.id
            # We can also overwrite the AI's address/trn with our trusted DB data if we want
            extracted_data.vendor.trn = existing_vendor.trn or extracted_data.vendor.trn
        else:
            print(f"🆕 New Vendor detected: {vendor_name_query}")
            extracted_data.vendor.is_new = True
            extracted_data.vendor.existing_id = None

    # 5. Account Prediction (Placeholder Logic)
    # In a real app, you would query your 'LineItem' history to see 
    # what account you used last time for this vendor.
    for line in extracted_data.line_items:
        desc = line.description.lower()
        if "coffee" in desc or "meal" in desc:
            line.accountId = "6001" # Mock Account Code for Meals
        elif "laptop" in desc or "software" in desc:
            line.accountId = "7001" # Mock Account Code for IT

    return extracted_data