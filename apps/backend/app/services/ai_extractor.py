import json
from sqlalchemy.orm import Session
from google import genai
from google.genai import types

from app.core.config import settings
from app.schemas.unified import ExtractedData, VendorDraft, LineItemBase, ComplianceChecklist
from app.crud import crud_account

# Initialize Client
try:
    client = genai.Client(api_key=settings.GOOGLE_API_KEY)
except Exception as e:
    print(f"Warning: Gemini Client failed to initialize. Error: {e}")
    client = None

# --- MODIFIED: Enhanced System Prompt for Compliance Details ---
SYSTEM_PROMPT = """
You are an expert AI Accountant specializing in UAE VAT compliance. Analyze this document meticulously.

STEP 1: CLASSIFY the document into one of these categories: "bill", "invoice", "bank_statement".

STEP 2: EXTRACT standard fields:
- vendor_name, vendor_trn, vendor_address
- date, invoice_number, reference_number, currency
- total_amount, tax_amount, discount_amount

STEP 3: LINE ITEMS & CATEGORIZATION
For each line item, extract:
- description, quantity, rate
- expense_category: Predict the accounting category (e.g. "Meals and Entertainment", "Travel Expense", "Office Supplies", "IT Equipment", "Cost of Goods Sold").

STEP 4: COMPLIANCE AUDIT: Perform a detailed check for mandatory fields on a tax invoice. Return a boolean for each. The fields are:
- taxInvoiceLabel: Is the document clearly marked "Tax Invoice"?
- supplierName: Is the supplier's name present?
- supplierTRN: Is a 15-digit Tax Registration Number (TRN) present?
- invoiceDate: Is the date of issue present?
- lineItemsDetailed: Are there item descriptions, quantities, and prices?
- vatAmountShown: Is the total VAT amount explicitly shown?
- totalAmountMatch: Does the math (subtotal + tax) add up to the total?

RETURN JSON ONLY. The structure MUST be:
{
  "category": "string",
  "confidence_score": float,
  "vendor_data": {"name": str, "trn": str, "address": str},
  "header": {
    "date": "YYYY-MM-DD", 
    "invoice_number": str, 
    "reference_number": str, 
    "currency": str, 
    "total": float, 
    "tax": float, 
    "discount": float,
    "opening_balance": float, 
    "closing_balance": float
  },
  "lines": [
    {
      "description": str, 
      "quantity": float, 
      "rate": float, 
      "expense_category": str 
    }
  ],
  "compliance": {"missing_fields": [], "details": {}}
}
"""

def normalize_float(val):
    if val is None: return 0.0
    if isinstance(val, (float, int)): return float(val)
    try:
        return float(str(val).replace(",", "").replace("$", "").replace("AED", "").strip())
    except:
        return 0.0

async def analyze_document(file_bytes: bytes, db: Session, mime_type: str = "image/jpeg") -> ExtractedData:
    if not client:
        return ExtractedData(category="error", warning_message="AI Server Disconnected")

    try:
        response = client.models.generate_content(
            model="gemini-2.5-pro",
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_text(text=SYSTEM_PROMPT),
                        types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
                    ],
                )
            ],
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )

        raw_text = response.text.replace("```json", "").replace("```", "").strip()
        raw_data = json.loads(raw_text)

        raw_vendor = raw_data.get("vendor_data", {})
        vendor_obj = VendorDraft(
            name=raw_vendor.get("name") or "Unknown Vendor",
            trn=raw_vendor.get("trn"),
            address=raw_vendor.get("address"),
            is_new=True
        )
        raw_header = raw_data.get("header", {})

        raw_lines = raw_data.get("lines", [])
        clean_lines = []
        for item in raw_lines:
            qty = normalize_float(item.get("quantity", 1))
            rate = normalize_float(item.get("rate", 0))
            if qty == 0: qty = 1.0
            ai_category_guess = item.get("expense_category")
            matched_account_id = None
            if ai_category_guess:
                account = crud_account.get_account_by_name_match(db, ai_category_guess)
                if account:
                    matched_account_id = account.zoho_id
            clean_lines.append(LineItemBase(
                description=item.get("description") or "Item",
                quantity=qty,
                rate=rate,
                accountId=matched_account_id
            ))

        # --- MODIFIED: Map the detailed compliance object ---
        raw_comp = raw_data.get("compliance", {})
        comp_obj = ComplianceChecklist(
            isCompliant=raw_comp.get("isCompliant", False),
            missingFields=raw_comp.get("missingFields", []),
            details=raw_comp.get("details", {}) # Pass the whole details object
        )

        result = ExtractedData(
            category=raw_data.get("category", "misc"),
            confidence_score=raw_data.get("confidence_score", 0.0),
            vendor=vendor_obj,
            date=raw_header.get("date"),
            invoice_number=raw_header.get("invoice_number"),
            reference_number=raw_header.get("reference_number"),
            discount=normalize_float(raw_header.get("discount")),
            currency=raw_header.get("currency", "AED"),
            total_amount=normalize_float(raw_header.get("total")),
            tax_amount=normalize_float(raw_header.get("tax")),
            line_items=clean_lines,
            compliance=comp_obj
        )
        return result

    except Exception as e:
        print(f"Processing Error: {e}")
        return ExtractedData(
            category="error",
            warning_message=f"Failed to process document: {str(e)}"
        )
