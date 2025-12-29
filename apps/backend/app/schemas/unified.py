from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import date, datetime

# ... (Keep ComplianceChecklist, VendorDraft, LineItemBase as they are) ...
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

# ... (Keep ExtractedData as is) ...
class ExtractedData(BaseModel):
    category: str = Field(..., description="bill, invoice, or bank_statement")
    confidence_score: float = 0.0
    warning_message: Optional[str] = None
    vendor: Optional[VendorDraft] = None
    date: Optional[str] = None
    invoice_number: Optional[str] = None
    reference_number: Optional[str] = None 
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
    
    # Allow loose matching for the mock factory data which might use 'accountId'
    # We add a validator or just ensure the backend maps it correctly. 
    # For simplicity, let's keep it strict but ensure factory produces zoho_account_id
    
    model_config = ConfigDict(from_attributes=True)

class InvoiceResponse(BaseModel):
    id: int
    vendor_id: Optional[int] = None
    vendor_name_raw: Optional[str] = None
    date: Optional[str] = None
    due_date: Optional[str] = None
    
    amount: float
    currency: str
    tax_amount: float
    
    invoice_number: Optional[str] = None
    
    # --- NEW FIELDS ADDED HERE ---
    reference_number: Optional[str] = None  # <--- This was missing!
    discount: Optional[float] = 0.0         # <--- This was missing!
    adjustment: Optional[float] = 0.0       # <--- This was missing!
    # -----------------------------

    status: str
    category: str
    image_url: str
    compliance_data: Optional[Dict[str, Any]] = None
    zoho_bill_id: Optional[str] = None
    created_at: datetime
    
    line_items: List[LineItemResponse] = []

    model_config = ConfigDict(from_attributes=True)