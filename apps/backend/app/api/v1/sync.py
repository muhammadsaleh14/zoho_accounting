import asyncio
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.zoho import fetch_all_contacts, fetch_chart_of_accounts
from app.crud import crud_vendor, crud_account

# --- NEW IMPORTS FOR MOCK MODE ---
from app.core.config import settings

router = APIRouter()

# --- Helper Function for Background Execution ---
async def run_full_sync_logic(db: Session):
    print("⏳ [Master Sync] Starting...")
    
    # 1. Sync Accounts (Fastest)
    print("⏳ [Master Sync] Fetching Accounts...")
    zoho_accounts = await fetch_chart_of_accounts()
    if zoho_accounts:
        acc_count = crud_account.bulk_upsert_accounts(db, zoho_accounts)
        print(f"✅ [Master Sync] Accounts Synced: {acc_count}")
    
    # 2. Sync Vendors (Slower due to pagination)
    print("⏳ [Master Sync] Fetching Vendors...")
    zoho_vendors = await fetch_all_contacts(contact_type="vendor")
    if zoho_vendors:
        vendor_stats = crud_vendor.bulk_upsert_vendors(db, zoho_vendors)
        print(f"✅ [Master Sync] Vendors Synced: {vendor_stats}")
        
    print("🎉 [Master Sync] Completed Successfully.")

# --- Endpoints ---

@router.post("/vendors")
async def sync_vendors(db: Session = Depends(get_db)):
    """Sync only Vendors"""
    if settings.DEMO_MODE:
         return {"status": "success", "details": {"added": 5, "updated": 0, "merged": 0}}

    zoho_data = await fetch_all_contacts(contact_type="vendor")
    if not zoho_data:
        return {"status": "skipped"}
    stats = crud_vendor.bulk_upsert_vendors(db, zoho_data)
    return {"status": "success", "details": stats}

@router.post("/accounts")
async def sync_accounts(db: Session = Depends(get_db)):
    """Sync only Chart of Accounts"""
    if settings.DEMO_MODE:
        return {"status": "success", "total_synced": 50}

    zoho_data = await fetch_chart_of_accounts()
    if not zoho_data:
        return {"status": "skipped"}
    count = crud_account.bulk_upsert_accounts(db, zoho_data)
    return {"status": "success", "total_synced": count}

@router.post("/master")
async def master_sync(
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    """
    Trigger a Full Sync (Accounts + Vendors) in the background.
    Returns immediately so the UI doesn't freeze.
    """
    
    # --- DEMO MODE CHECK ---
    if settings.DEMO_MODE:
        # Simulate a delay so the UI spinner spins for a bit, then return success
        await asyncio.sleep(2)
        print("✅ [MOCK] Master sync completed.")
        return {
            "status": "started",
            "message": "[DEMO] Master Sync simulated successfully."
        }
    # -----------------------

    # We pass the db session to the background task
    background_tasks.add_task(run_full_sync_logic, db)
    
    return {
        "status": "started",
        "message": "Master Sync running in background. Check console for progress."
    }