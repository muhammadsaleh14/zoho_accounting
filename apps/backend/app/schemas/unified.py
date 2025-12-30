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
    # --- NEW: Carry the raw text guess ---
    account_guess: Optional[str] = None

class ExtractedData(BaseModel):
    category: str = Field(..., description="bill, invoice, or bank_statement")
    confidence_score: float = 0.0
    warning_message: Optional[str] = None
    vendor: Optional[VendorDraft] = None
    
    date: Optional[str] = None
    invoice_number: Optional[str] = None
    reference_number: Optional[str] = None 
    notes: Optional[str] = None 
    
    discount: float = 0.0                  
    currency: str = "AED"
    total_amount: float = 0.0
    tax_amount: float = 0.0
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
    # --- NEW: Return the raw guess to UI ---
    account_guess: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class InvoiceResponse(BaseModel):
    id: int
    vendor_id: Optional[int] = None
    vendor_name_raw: Optional[str] = None
    
    date: Optional[dt_date] = None
    due_date: Optional[dt_date] = None
    
    amount: float
    currency: str
    tax_amount: float
    
    invoice_number: Optional[str] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None 
    
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