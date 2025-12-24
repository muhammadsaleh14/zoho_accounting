from typing import List
from sqlalchemy.orm import Session
from app.models.accounting import Vendor

def get_vendor_by_name(db: Session, name: str):
    """
    Case-insensitive search for a vendor.
    Useful for checking if the AI extracted vendor already exists.
    """
    if not name:
        return None
    return db.query(Vendor).filter(Vendor.name.ilike(name)).first()

def get_vendor_by_zoho_id(db: Session, zoho_id: str):
    return db.query(Vendor).filter(Vendor.zoho_contact_id == zoho_id).first()

def create_vendor(db: Session, name: str, trn: str = None, address: str = None, zoho_id: str = None):
    """
    Creates a vendor. If 'zoho_id' is None, it's a 'Draft/New' vendor 
    that needs to be synced later.
    """
    db_obj = Vendor(
        name=name,
        trn=trn,
        address=address,
        zoho_contact_id=zoho_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def bulk_upsert_vendors(db: Session, zoho_vendors: List[dict]):
    """
    Syncs Zoho data into local DB.
    Strategy:
    1. Try to match by Zoho ID (Update).
    2. If no ID, try to match by Name (Merge Drafts).
    3. Else, Insert new.
    """
    stats = {"added": 0, "updated": 0, "merged": 0}
    
    for zv in zoho_vendors:
        z_id = zv.get("contact_id")
        z_name = zv.get("contact_name")
        
        # 1. Check if we have this Zoho ID already
        existing = db.query(Vendor).filter(Vendor.zoho_contact_id == z_id).first()
        
        if existing:
            # UPDATE
            existing.name = z_name
            existing.address = zv.get("billing_address", {}).get("address", "")
            # (Update other fields as needed)
            stats["updated"] += 1
        else:
            # 2. Check if we have a "Draft" with the same name (Case insensitive)
            draft = db.query(Vendor).filter(Vendor.name.ilike(z_name), Vendor.zoho_contact_id == None).first()
            
            if draft:
                # MERGE (Promote Draft to Synced)
                draft.zoho_contact_id = z_id
                draft.address = zv.get("billing_address", {}).get("address", "")
                stats["merged"] += 1
            else:
                # INSERT
                new_vendor = Vendor(
                    name=z_name,
                    zoho_contact_id=z_id,
                    address=zv.get("billing_address", {}).get("address", ""),
                    # Map TRN if available in custom fields usually
                )
                db.add(new_vendor)
                stats["added"] += 1
    
    db.commit()
    return stats