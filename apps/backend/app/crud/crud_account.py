from sqlalchemy.orm import Session
from app.models.accounting import Account
from typing import List, Dict, Any

def get_all_accounts(db: Session):
    """Returns list for Frontend Dropdown"""
    return db.query(Account).filter(Account.is_active == True).all()

def get_account_by_name_match(db: Session, keyword: str):
    """
    Simple fuzzy search for AI Prediction.
    e.g. keyword="Hotel" -> returns Account("Lodging")
    """
    if not keyword:
        return None
    # Case insensitive search ('%keyword%')
    return db.query(Account).filter(Account.name.ilike(f"%{keyword}%")).first()

def bulk_upsert_accounts(db: Session, zoho_accounts: List[Dict[str, Any]]):
    """
    Syncs Zoho Chart of Accounts -> Local DB.
    """
    count = 0
    for acc in zoho_accounts:
        z_id = acc.get("account_id")
        
        # Check existence
        existing = db.query(Account).filter(Account.zoho_id == z_id).first()
        
        if existing:
            # Update details
            existing.name = acc.get("account_name")
            existing.code = acc.get("account_code", "")
            existing.account_type = acc.get("account_type", "expense")
            existing.is_active = acc.get("is_active", True)
        else:
            # Insert new
            new_acc = Account(
                zoho_id=z_id,
                name=acc.get("account_name"),
                code=acc.get("account_code", ""),
                account_type=acc.get("account_type", "expense"),
                is_active=acc.get("is_active", True)
            )
            db.add(new_acc)
        count += 1
        
    db.commit()
    return count