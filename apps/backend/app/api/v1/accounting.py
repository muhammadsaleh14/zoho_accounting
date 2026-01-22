# --- File: apps/backend/app/api/v1/accounting.py ---

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import asyncio
import random

from app.db.session import get_db
from app.schemas.payables import BillApproveRequest
from app.services.zoho import create_zoho_contact, create_zoho_bill_or_invoice, upload_attachment_to_bill, fetch_all_contacts
from app.crud import crud_account, crud_vendor, crud_invoice
from app.services.account_mapper import AccountMapper

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
        # Fallback for dev if API fails
        print(f"⚠️ Zoho API Error (Customers): {e}")
        return await mock_service.get_customers()

@router.get("/vendors")
async def get_vendors_from_zoho():
    """Fetch Vendors (for Bills/Expenses)"""
    if settings.DEMO_MODE:
        # Return a mock list of vendors if needed, or reuse customer structure
        return [
            {"contact_id": "99901", "contact_name": "Mock Vendor A"},
            {"contact_id": "99902", "contact_name": "Mock Vendor B"}
        ]
    try:
        vendors = await fetch_all_contacts(contact_type="vendor")
        return vendors
    except Exception as e:
        print(f"⚠️ Zoho API Error (Vendors): {e}")
        return []

@router.get("/accounts")
async def get_accounts(db: Session = Depends(get_db)):
    """Fetch Chart of Accounts (Income + Expense)"""
    if settings.DEMO_MODE:
        return await mock_service.get_accounts()

    accounts = crud_account.get_all_accounts(db)
    
    if not accounts:
        return await mock_service.get_accounts()

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
    """
    Simulates the full approval flow:
    1. Validates Data
    2. Constructs Zoho Payload (Distinguishing Sales vs Purchase)
    3. Fakes the submission (Does NOT hit Zoho API)
    4. Updates Local DB
    """

    # 0. DEMO MODE CHECK (Kept intact for fallback)
    if settings.DEMO_MODE:
        print(f"🚀 Approval triggered for {data.contact_name} (Mock Data -> Real Zoho)")
        mock_service.approve_invoice(data.bill_number)

        # 1. PREPARE THE PAYLOAD (Demo Logic)
        zoho_lines = []
        for item in data.line_items:
            zoho_lines.append({
                "account_id": item.account_id, 
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
            "reference_number": data.order_number,
            # --- VAT Compliance Fields ---
            "tax_percentage": data.tax_percentage,
            "is_reverse_charge": data.is_reverse_charge,
            "supplier_trn": data.supplier_trn,
            "supplier_address": data.supplier_address,
            "customer_trn": data.customer_trn,
            "customer_address": data.customer_address,
        }
        
        # Add date of supply if available
        if data.date_of_supply:
            payload["date_of_supply"] = data.date_of_supply

        # 2. CONTACT HANDLING
        final_contact_id = data.zoho_contact_id
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
        else:
            payload["vendor_id"] = final_contact_id
            payload["bill_number"] = data.bill_number

        # 4. THE REAL PUSH TO ZOHO (Demo Mode actually pushes to Zoho in your original code)
        try:
            print("📡 Communicating with Zoho APIs...")
            result = await create_zoho_bill_or_invoice(payload, data.category)
            
            return {
                "status": "success",
                "message": "Real Zoho Sync Successful using Mock Data",
                "zoho_id": result.get("bill_id") or result.get("invoice_id")
            }
        except Exception as e:
            print(f"❌ Zoho Sync Failed: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))


    # --- SIMULATED REAL MODE START (Since DEMO_MODE is False) ---
    print(f"🚀 Real Approval Flow triggered for {data.contact_name} (Category: {data.category})")

    # 1. PREPARE THE PAYLOAD & ENSURE ACCOUNTS EXIST
    zoho_lines = []
    for item in data.line_items:
        # For tax invoices, we're dealing with sales/income accounts
        account_type = "income" if data.category == "invoice" else "expense"
        
        if item.account_id and item.account_id != "null":
            # Account already has Zoho ID
            zoho_account_id = item.account_id
        else:
            # Try to create/find account based on description or account_guess
            account_name = item.account_guess or "Service Revenue"  # Default to income account for invoices
            print(f"🔧 Ensuring account exists: {account_name}")
            
            try:
                zoho_account_id = await AccountMapper.ensure_account_exists(
                    account_name=account_name,
                    account_type=account_type,
                    db=db
                )
                if not zoho_account_id:
                    print(f"⚠️ Could not create/find account: {account_name}")
                    zoho_account_id = "fallback_account_id"  # Fallback
            except Exception as e:
                print(f"❌ Error creating account {account_name}: {e}")
                zoho_account_id = "fallback_account_id"  # Fallback
        
        # Build line item with tax information
        line_item = {
            "account_id": zoho_account_id, 
            "description": item.description,
            "rate": item.rate,
            "quantity": item.quantity,
        }
        
        # Add tax information if available
        if hasattr(item, 'tax_rate') and item.tax_rate is not None:
            if item.is_reverse_charge:
                line_item["tax_id"] = None  # No tax for reverse charge
                line_item["tax_percentage"] = 0
                line_item["is_reverse_charge_applied"] = True
            else:
                # Map tax rate to Zoho tax ID (simplified for now)
                if item.tax_rate == 5.0:
                    line_item["tax_id"] = REAL_ZOHO_TAX_5_ID
                elif item.tax_rate == 0.0:
                    line_item["tax_id"] = None
                else:
                    line_item["tax_id"] = REAL_ZOHO_TAX_5_ID  # Default to 5%
        else:
            # Default tax handling
            line_item["tax_id"] = REAL_ZOHO_TAX_5_ID
        
        zoho_lines.append(line_item)
        
    payload = {
        "date": data.date,
        "due_date": data.due_date,
        "line_items": zoho_lines,
        "notes": data.subject,
        "reference_number": data.order_number
    }

    # 2. CONTACT HANDLING
    final_contact_id = data.zoho_contact_id
    
    # In a fully real app, we would create the contact in Zoho here if it didn't exist.
    # For simulation, if no ID is provided, we generate a fake one to prevent errors.
    if not final_contact_id or final_contact_id == "null":
        print(f"⚠️ No Contact ID provided. Simulating creation for: {data.contact_name}")
        # In real production, uncomment below:
        # new_contact = await create_zoho_contact(name=data.contact_name, ...)
        # final_contact_id = new_contact["contact_id"]
        final_contact_id = f"simulated_contact_{random.randint(1000, 9999)}"

    # 3. DIFFERENTIATE SALES VS PURCHASE
    api_type = ""
    if data.category == "invoice":
        # Sales Invoice Flow
        payload["customer_id"] = final_contact_id
        # Zoho Invoice usually uses 'invoice_number' or auto-generates if omitted, 
        # but we map it from the 'bill_number' field in our generic request object.
        payload["invoice_number"] = data.bill_number
        api_type = "Sales Invoice"
    else:
        # Purchase Bill Flow
        payload["vendor_id"] = final_contact_id
        payload["bill_number"] = data.bill_number
        api_type = "Purchase Bill"

    # 4. FAKE SUBMIT (The Simulation Block)
    # Instead of calling await create_zoho_bill_or_invoice(payload, data.category)
    # We print and return success.
    
    print("----------------------------------------------------------------")
    print(f"📡 [SIMULATION] Ready to push {api_type} to Zoho.")
    print(f"📦 Payload Constructed: {payload}")
    print("----------------------------------------------------------------")
    
    print("----------------------------------------------------------------")
    print(f"📡 [SIMULATION] Ready to push {api_type} to Zoho.")
    print(f"📦 Payload: {payload}")
    # ADDED THIS:
    print(f"📎 [SIMULATION] Uploading Attachment: {data.temp_file_path}") 
    print("----------------------------------------------------------------")

    # Simulate network latency
    await asyncio.sleep(1)

    # 5. UPDATE LOCAL DB
    # We need to mark the local invoice as synced so the UI updates.
    try:
        local_invoice = crud_invoice.get_invoice(db, invoice_id=data.id)
        
        fake_zoho_id = f"zb_sim_{random.randint(100000, 999999)}"
        
        if local_invoice:
            local_invoice.status = "synced"
            local_invoice.zoho_bill_id = fake_zoho_id
            db.commit()
            print(f"✅ Local Database updated: Invoice #{data.id} marked as Synced.")
        else:
            print(f"⚠️ Warning: Local invoice #{data.id} not found in DB to update status.")

        return {
            "status": "success",
            "message": f"Simulated {api_type} Sync Successful",
            "zoho_id": fake_zoho_id
        }

    except Exception as e:
        print(f"❌ Simulation Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))