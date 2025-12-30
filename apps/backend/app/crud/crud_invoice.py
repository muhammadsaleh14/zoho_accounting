# --- File: apps/backend/app/crud/crud_invoice.py ---

from sqlalchemy.orm import Session
from typing import List, Any, Dict
from app.models.accounting import Invoice, LineItem

def get_invoices(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Invoice).offset(skip).limit(limit).all()

def get_invoice(db: Session, invoice_id: int):
    return db.query(Invoice).filter(Invoice.id == invoice_id).first()

def create_invoice_with_lines(
    db: Session, 
    invoice_data: Dict[str, Any], 
    line_items_data: List[Dict[str, Any]]
):
    # 1. Create the Invoice Header
    db_invoice = Invoice(**invoice_data)
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)

    # 2. Create Line Items
    try:
        lines = []
        for item in line_items_data:
            line = LineItem(
                invoice_id=db_invoice.id,
                description=item.get("description", "Unknown Item"),
                quantity=item.get("quantity", 1.0),
                rate=item.get("rate", 0.0),
                zoho_account_id=item.get("accountId"),
                # --- NEW: Save the raw AI guess ---
                account_guess=item.get("account_guess") 
            )
            lines.append(line)
        
        db.add_all(lines)
        db.commit()
        db.refresh(db_invoice)
        return db_invoice
        
    except Exception as e:
        db.rollback()
        print(f"Error creating line items: {e}")
        return db_invoice