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
REAL_ZOHO_TAX_5_ID="8057952000000107011"

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
    print(f"🚀 Approval triggered for {data.contact_name} (Mock Data -> Real Zoho)")
    mock_service.approve_invoice(data.bill_number)

    # 1. PREPARE THE PAYLOAD
    # We use the data sent from the frontend (which is currently your hardcoded 123123)
    zoho_lines = []
    for item in data.line_items:
        zoho_lines.append({
            "account_id": item.account_id, # This will be '123123'
            "description": item.description,
            "rate": item.rate,
            "quantity": item.quantity,
            "tax_id": REAL_ZOHO_TAX_5_ID,
        })
        
    payload = {
        "date": data.date,
        "due_date": data.due_date,
        "line_items": zoho_lines,
        "notes": data.subject,
        "reference_number": data.order_number
    }

    # 2. CONTACT HANDLING
    # Important: Zoho needs a REAL internal Contact ID. 
    # If your hardcoded data doesn't have a real Zoho ID, we force a search/create.
    final_contact_id = data.zoho_contact_id
    
    # If the contact is mock (no real ID), we try to create it in Zoho so the bill doesn't fail
    if not final_contact_id or final_contact_id == "null":
        print(f"Creating real contact in Zoho for: {data.contact_name}")
        try:
            new_contact = await create_zoho_contact(
                name=data.contact_name, 
                trn=data.contact_trn, 
                address=data.contact_address
            )
            final_contact_id = new_contact["contact_id"]
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Contact error: {str(e)}")

    # 3. SET THE CORRECT CONTACT FIELD
    if data.category == "invoice":
        payload["customer_id"] = final_contact_id
        # payload["invoice_number"] = data.bill_number
    else:
        payload["vendor_id"] = final_contact_id
        payload["bill_number"] = data.bill_number

    # 4. THE REAL PUSH TO ZOHO
    # Even if settings.DEMO_MODE is True, we run this to perform the real sync
    try:
        print("📡 Communicating with Zoho APIs...")
        result = await create_zoho_bill_or_invoice(payload, data.category)
        
        return {
            "status": "success",
            "message": "Real Zoho Sync Successful using Mock Data",
            "zoho_id": result.get("bill_id") or result.get("invoice_id")
        }
    except Exception as e:
        # If it fails (likely due to invalid Account ID), we catch it here
        print(f"❌ Zoho Sync Failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
