# --- File: apps/backend/app/schemas/unified.py ---

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import date as dt_date, datetime

# ... (ComplianceChecklist, VendorDraft remain unchanged) ...
class ComplianceChecklist(BaseModel):
    isCompliant: bool
    missingFields: List[str] = []
    details: Dict[str, bool] = {}

class VendorDraft(BaseModel):
    name: str = "Unknown Vendor"
    trn: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    is_new: bool = True 
    existing_id: Optional[int] = None 

class LineItemBase(BaseModel):
    description: str
    quantity: float = 1.0
    rate: float = 0.0
    accountId: Optional[str] = None
    # --- NEW: Carry raw text guess ---
    account_guess: Optional[str] = None
    # --- NEW: VAT fields ---
    tax_rate: Optional[float] = None
    tax_amount: Optional[float] = None
    is_reverse_charge: Optional[bool] = False

class ExtractedData(BaseModel):
    category: str = Field(..., description="bill, invoice, or bank_statement")
    confidence_score: float = 0.0
    warning_message: Optional[str] = None
    vendor: Optional[VendorDraft] = None
    
    date: Optional[str] = None
    due_date: Optional[str] = None
    date_of_supply: Optional[str] = None
    invoice_number: Optional[str] = None
    reference_number: Optional[str] = None 
    notes: Optional[str] = None 
    
    discount: float = 0.0                  
    currency: str = "AED"
    currency_rate: Optional[float] = 1.0
    total_amount: float = 0.0
    tax_amount: float = 0.0
    tax_percentage: Optional[float] = None
    is_reverse_charge: Optional[bool] = False
    
    # --- NEW: VAT Compliance Fields ---
    supplier_trn: Optional[str] = None
    supplier_address: Optional[str] = None
    customer_trn: Optional[str] = None
    customer_address: Optional[str] = None
    
    line_items: List[LineItemBase] = []
    opening_balance: Optional[float] = None
    closing_balance: Optional[float] = None
    compliance: Optional[ComplianceChecklist] = None

class LineItemResponse(BaseModel):
    id: int
    description: str
    quantity: float
    rate: float
    zoho_account_id: Optional[str] = None
    # --- NEW: Return raw guess to UI ---
    account_guess: Optional[str] = None
    # --- NEW: VAT fields ---
    tax_rate: Optional[float] = None
    tax_amount: Optional[float] = None
    is_reverse_charge: Optional[bool] = False
    
    model_config = ConfigDict(from_attributes=True)

class InvoiceResponse(BaseModel):
    id: int
    vendor_id: Optional[int] = None
    vendor_name_raw: Optional[str] = None
    
    date: Optional[dt_date] = None
    due_date: Optional[dt_date] = None
    date_of_supply: Optional[dt_date] = None
    
    amount: float
    currency: str
    currency_rate: Optional[float] = 1.0
    tax_amount: float
    tax_percentage: Optional[float] = None
    is_reverse_charge: Optional[bool] = False
    
    invoice_number: Optional[str] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None 
    
    # --- NEW: VAT Compliance Fields ---
    supplier_trn: Optional[str] = None
    supplier_address: Optional[str] = None
    customer_trn: Optional[str] = None
    customer_address: Optional[str] = None
    
    discount: Optional[float] = 0.0
    adjustment: Optional[float] = 0.0

    status: str
    category: str
    image_url: str
    compliance_data: Optional[Dict[str, Any]] = None
    zoho_bill_id: Optional[str] = None
    created_at: datetime
    
    line_items: List[LineItemResponse] = []

    model_config = ConfigDict(from_attributes=True)