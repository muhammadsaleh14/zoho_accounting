from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

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