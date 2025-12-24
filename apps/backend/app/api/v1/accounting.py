from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.payables import BillApproveRequest
from app.services.zoho import create_zoho_contact, create_zoho_bill, upload_attachment_to_bill
from app.crud import crud_account, crud_vendor, crud_invoice

router = APIRouter()

@router.get("/accounts")
def get_accounts(db: Session = Depends(get_db)):
    """
    Returns the local list of accounts for the UI Dropdown.
    Fast (ms), no API limits.
    """
    accounts = crud_account.get_all_accounts(db)
    
    # Format for Frontend
    return [
        {
            "account_id": acc.zoho_id, # Frontend needs the Zoho ID to send back
            "account_name": acc.name,
            "account_code": acc.code,
            "type": acc.account_type
        }
        for acc in accounts
    ]

@router.post("/approve")
async def approve_bill(
    data: BillApproveRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    The 'Commit' Action.
    1. Ensures Vendor exists in Zoho (creates if missing).
    2. Creates Bill in Zoho.
    3. Queues Attachment Upload.
    4. Saves Audit Trail to Local DB.
    """
    
    # 1. VENDOR HANDLING
    # If the frontend didn't send a zoho_id, implies it's a NEW vendor
    final_zoho_vendor_id = data.zoho_vendor_id
    
    if not final_zoho_vendor_id:
        print(f"🆕 Creating new Vendor in Zoho: {data.vendor_name}")
        try:
            new_contact = await create_zoho_contact(
                name=data.vendor_name,
                trn=data.vendor_trn,
                address=data.vendor_address
            )
            final_zoho_vendor_id = new_contact["contact_id"]
            
            # Upsert into Local DB so next time we find it
            crud_vendor.create_vendor(
                db, 
                name=data.vendor_name, 
                zoho_id=final_zoho_vendor_id,
                trn=data.vendor_trn,
                address=data.vendor_address
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to create Vendor: {str(e)}")

    # 2. CONSTRUCT ZOHO BILL PAYLOAD
    zoho_lines = []
    for item in data.line_items:
        line_obj = {
            "account_id": item.account_id,
            "description": item.description,
            "rate": item.rate,
            "quantity": item.quantity
        }
        # NEW: Add Customer ID if present (Billable)
        if item.customer_id:
            line_obj["customer_id"] = item.customer_id
            
        zoho_lines.append(line_obj)
        
    bill_payload = {
        "vendor_id": final_zoho_vendor_id,
        "bill_number": data.bill_number,
        "date": data.date,
        "due_date": data.due_date,
        
        # NEW: Map the specific fields
        "reference_number": data.order_number or "",  # Maps "Order Number"
        "notes": data.subject or "",                  # Maps "Subject"
        "adjustment": data.adjustment,                # Maps "Adjustment"
        "discount": data.discount,                    # Maps "Discount"
        
        "line_items": zoho_lines
    }
    # 3. CREATE BILL IN ZOHO
    try:
        print(f"🚀 Pushing Bill {data.bill_number} to Zoho...")
        created_bill = await create_zoho_bill(bill_payload)
        zoho_bill_id = created_bill["bill_id"]
        print(f"✅ Bill Created! ID: {zoho_bill_id}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 4. HANDLE ATTACHMENT (Background Task)
    # We don't make the user wait for the file upload
    if data.temp_file_path:
        background_tasks.add_task(upload_attachment_to_bill, zoho_bill_id, data.temp_file_path)

    # 5. SAVE AUDIT TRAIL TO LOCAL DB
    # We store the final state
    invoice_data = {
        "vendor_name_raw": data.vendor_name, # Snapshot name
        "date": data.date,
        "due_date": data.due_date,
        "invoice_number": data.bill_number,
        "amount": created_bill.get("total", 0),
        "status": "synced",
        "category": "bill",
        "image_url": data.temp_file_path or "",
        "zoho_bill_id": zoho_bill_id
    }
    
    # We map the lines slightly differently for local storage (schema mismatch handling)
    # In a real app, you'd make schemas match perfectly.
    local_lines = []
    for item in data.line_items:
        local_lines.append({
            "description": item.description,
            "quantity": item.quantity,
            "rate": item.rate,
            "accountId": item.account_id
        })
        
    crud_invoice.create_invoice_with_lines(db, invoice_data, local_lines)

    return {
        "status": "success",
        "message": "Bill approved and synced",
        "zoho_bill_id": zoho_bill_id,
        "vendor_id": final_zoho_vendor_id
    }