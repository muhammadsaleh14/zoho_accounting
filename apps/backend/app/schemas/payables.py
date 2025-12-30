# --- File: apps/backend/app/schemas/payables.py ---

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
    # --- FIXED: ADDED ID and CATEGORY FOR CONTEXT ---
    id: int # The local database ID of the document being processed
    category: str # "bill" or "invoice"
    
    # Vendor/Customer Info - Renamed for generic use
    contact_name: str 
    zoho_contact_id: Optional[str] = None 
    contact_trn: Optional[str] = None 
    contact_address: Optional[str] = None

    # Core Bill/Invoice Info
    bill_number: str
    date: str           # YYYY-MM-DD
    due_date: str       # YYYY-MM-DD
    
    # Full Zoho Fields
    order_number: Optional[str] = None # Maps to reference_number
    subject: Optional[str] = None      # Maps to notes
    
    # Financials
    adjustment: float = 0.0
    discount: float = 0.0
    tax_amount: float = 0.0 # Added tax amount for payload
    
    line_items: List[BillLineCreate]
    
    # Attachments
    temp_file_path: Optional[str] = None
