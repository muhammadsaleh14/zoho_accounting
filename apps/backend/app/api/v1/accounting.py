# --- File: apps/backend/app/api/v1/accounting.py ---

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.payables import BillApproveRequest
from app.services.zoho import create_zoho_contact, create_zoho_bill_or_invoice, upload_attachment_to_bill, fetch_all_contacts
from app.crud import crud_account, crud_vendor, crud_invoice

from app.core.config import settings
from app.services.mock_factory import mock_service

router = APIRouter()

@router.get("/customers")
async def get_customers_from_zoho():
    if settings.DEMO_MODE:
        return await mock_service.get_customers()
    try:
        customers = await fetch_all_contacts(contact_type="customer")
        return customers
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/accounts")
async def get_accounts(db: Session = Depends(get_db)):
    if settings.DEMO_MODE:
        return await mock_service.get_accounts()

    accounts = crud_account.get_all_accounts(db)
    return [
        {
            "account_id": acc.zoho_id,
            "account_name": acc.name,
            "account_code": acc.code,
            "type": acc.account_type
        } for acc in accounts
    ]

@router.post("/approve")
async def approve_document(
    data: BillApproveRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    if settings.DEMO_MODE:
        # Simulate a successful Zoho sync for the demo
        return await mock_service.approve_invoice(data.bill_number)

    # Differentiate between sales invoice and vendor bill
    is_sales_invoice = data.category == "invoice"
    
    # 1. CONTACT HANDLING (Vendor or Customer)
    final_contact_id = data.zoho_contact_id
    if not final_contact_id:
        contact_type_str = "Customer" if is_sales_invoice else "Vendor"
        print(f"🆕 Creating new {contact_type_str} in Zoho: {data.contact_name}")
        try:
            new_contact = await create_zoho_contact(name=data.contact_name, trn=data.contact_trn, address=data.contact_address)
            final_contact_id = new_contact["contact_id"]
            # You would also save this new contact to your local DB here
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to create {contact_type_str}: {str(e)}")

    # 2. CONSTRUCT ZOHO PAYLOAD
    zoho_lines = []
    for item in data.line_items:
        line_obj = {
            "account_id": item.account_id,
            "description": item.description,
            "rate": item.rate,
            "quantity": item.quantity,
            # FIXED: Add tax ID if tax amount exists.
            # NOTE: Replace 'YOUR_ZOHO_VAT_5_ID' with the actual ID from your Zoho settings for 5% VAT.
            "tax_id": "YOUR_ZOHO_VAT_5_ID" if data.tax_amount > 0 else ""
        }
        if is_sales_invoice and item.customer_id:
             line_obj["customer_id"] = item.customer_id
        zoho_lines.append(line_obj)
        
    payload = {
        "line_items": zoho_lines,
        "date": data.date,
        "due_date": data.due_date,
        "reference_number": data.order_number or "",
        "notes": data.subject or "",
        "adjustment": data.adjustment,
        "discount": data.discount,
    }

    if is_sales_invoice:
        payload["customer_id"] = final_contact_id
        payload["invoice_number"] = data.bill_number # Zoho calls it invoice_number
    else:
        payload["vendor_id"] = final_contact_id
        payload["bill_number"] = data.bill_number

    # 3. CREATE DOCUMENT IN ZOHO
    try:
        print(f"🚀 Pushing {data.category} {data.bill_number} to Zoho...")
        created_doc = await create_zoho_bill_or_invoice(payload, data.category)
        doc_id_key = "invoice_id" if is_sales_invoice else "bill_id"
        zoho_doc_id = created_doc[doc_id_key]
        print(f"✅ Document Created! ID: {zoho_doc_id}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 4. ATTACHMENT (Background Task)
    if data.temp_file_path:
        background_tasks.add_task(upload_attachment_to_bill, zoho_doc_id, data.temp_file_path)

    # 5. SAVE/UPDATE LOCAL DB
    # Find the local invoice and update its status and Zoho ID
    local_invoice = crud_invoice.get_invoice(db, invoice_id=data.id) # Assuming frontend sends local DB id
    if local_invoice:
        local_invoice.status = "synced"
        local_invoice.zoho_bill_id = zoho_doc_id # Use one field for both IDs
        db.commit()

    return {
        "status": "success",
        "message": f"{data.category.capitalize()} synced to Zoho",
        "zoho_id": zoho_doc_id,
        "contact_id": final_contact_id
    }
