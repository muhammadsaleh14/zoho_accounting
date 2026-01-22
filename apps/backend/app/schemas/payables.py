# --- File: apps/backend/app/schemas/payables.py ---

from pydantic import BaseModel, Field
from typing import List, Optional

# 1. Line Item (Updated with Customer Details and VAT)
class BillLineCreate(BaseModel):
    description: str
    rate: float
    quantity: float
    account_id: str = Field(..., description="The Zoho Ledger Account ID")
    
    # NEW: For associating an expense with a customer (Billable)
    customer_id: Optional[str] = None 
    
    # --- VAT Fields ---
    tax_rate: Optional[float] = None
    tax_amount: Optional[float] = None
    is_reverse_charge: Optional[bool] = False

# 2. The Main Request Object (Updated with "New Bill" fields and VAT Compliance)
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
    date_of_supply: Optional[str] = None  # YYYY-MM-DD
    
    # Full Zoho Fields
    order_number: Optional[str] = None # Maps to reference_number
    subject: Optional[str] = None      # Maps to notes
    
    # Financials
    adjustment: float = 0.0
    discount: float = 0.0
    tax_amount: float = 0.0 # Added tax amount for payload
    
    # --- VAT Compliance Fields ---
    tax_percentage: Optional[float] = None
    is_reverse_charge: Optional[bool] = False
    supplier_trn: Optional[str] = None
    supplier_address: Optional[str] = None
    customer_trn: Optional[str] = None
    customer_address: Optional[str] = None
    date_of_supply: Optional[str] = None  # YYYY-MM-DD
    place_of_supply: Optional[str] = None
    
    line_items: List[BillLineCreate]
    
    # Attachments
    temp_file_path: Optional[str] = None
