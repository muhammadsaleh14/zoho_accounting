from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import date, datetime

# 1. SHARED COMPONENTS
class ComplianceChecklist(BaseModel):
    isCompliant: bool
    missingFields: List[str] = []
    # Key-value pairs for specific checks (e.g., "tax_label": true)
    details: Dict[str, bool] = {}

class VendorDraft(BaseModel):
    name: str = "Unknown Vendor"
    trn: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    # Enrichment fields (filled by Backend, not AI)
    is_new: bool = True 
    existing_id: Optional[int] = None 

class LineItemBase(BaseModel):
    """
    Standardized Row.
    For Bills: Description = Item Name, Rate = Unit Price
    For Bank: Description = Narrative, Rate = Amount (+/-)
    """
    description: str
    quantity: float = 1.0
    rate: float = 0.0
    # The Backend's predicted Category/Account for this line
    accountId: Optional[str] = None 


class ExtractedData(BaseModel):
    """
    Updated Contract with new fields.
    """
    category: str = Field(..., description="bill, invoice, or bank_statement")
    confidence_score: float = 0.0
    warning_message: Optional[str] = None
    
    vendor: Optional[VendorDraft] = None
    
    date: Optional[str] = None
    invoice_number: Optional[str] = None
    
    # NEW FIELDS ---
    reference_number: Optional[str] = None # PO Number / Order Number
    discount: float = 0.0                  # Total Discount Amount
    # ----------------
    
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
    model_config = ConfigDict(from_attributes=True)

class InvoiceResponse(BaseModel):
    id: int
    vendor_id: Optional[int] = None
    vendor_name_raw: Optional[str] = None
    # --- MODIFIED: Revert date fields to simple strings ---
    date: Optional[str] = None
    due_date: Optional[str] = None
    # ---
    amount: float
    currency: str
    tax_amount: float
    invoice_number: Optional[str] = None
    status: str
    category: str
    image_url: str
    compliance_data: Optional[Dict[str, Any]] = None
    zoho_bill_id: Optional[str] = None
    created_at: datetime
    
    line_items: List[LineItemResponse] = []

    # --- MODIFIED: Remove the json_encoders config ---
    model_config = ConfigDict(from_attributes=True)
