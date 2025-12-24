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
    """
    Transactional creation: Saves Invoice AND Line Items.
    If Line Items fail, the Invoice is rolled back.
    """
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
                zoho_account_id=item.get("accountId") # Mapped from AI prediction
            )
            lines.append(line)
        
        db.add_all(lines)
        db.commit()
        db.refresh(db_invoice) # Refresh to load relationships
        return db_invoice
        
    except Exception as e:
        db.rollback()
        # Optionally delete the header if lines failed, or keep it as 'error' state
        print(f"Error creating line items: {e}")
        return db_invoice