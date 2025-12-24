from pydantic import BaseModel, Field
from typing import List, Optional

# 1. Line Item (Updated with Customer Details)
class BillLineCreate(BaseModel):
    description: str
    rate: float
    quantity: float
    account_id: str = Field(..., description="The Zoho Ledger Account ID")
    
    # NEW: For associating an expense with a customer (Billable)
    customer_id: Optional[str] = None 

# 2. The Main Request Object (Updated with "New Bill" fields)
class BillApproveRequest(BaseModel):
    # Vendor Info
    vendor_name: str
    zoho_vendor_id: Optional[str] = None 
    vendor_trn: Optional[str] = None 
    vendor_address: Optional[str] = None

    # Core Bill Info
    bill_number: str
    date: str           # YYYY-MM-DD
    due_date: str       # YYYY-MM-DD
    
    # NEW: Full Zoho Fields
    order_number: Optional[str] = None # Maps to reference_number
    subject: Optional[str] = None      # Maps to notes (or part of notes)
    
    # Financials
    adjustment: float = 0.0            # +/- Adjustment
    discount: float = 0.0              # Global Discount Amount
    
    # Note: TDS/TCS are complex tax objects. 
    # We omit them from the strict schema for now to avoid validation errors, 
    # but the logic allows expanding later.

    line_items: List[BillLineCreate]
    
    # Attachments
    temp_file_path: Optional[str] = None