# --- File: apps/backend/app/services/ai_extractor.py ---

import json
import os
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

# --- ENHANCED SYSTEM PROMPT ---
SYSTEM_PROMPT = """
You are an expert AI Accountant. Analyze the document image provided.

STEP 1: CATEGORIZE
Determine if this is a:
1. "bill" (A purchase receipt or invoice received from a vendor).
2. "invoice" (A sales invoice issued BY the user TO a customer).
3. "bank_statement" (A ledger of transactions).

STEP 2: EXTRACT ENTITIES (Context Aware)
- If "bill": Extract the **Supplier/Vendor** details into 'counterparty'.
- If "invoice": Extract the **Customer/Client** ("Bill To") details into 'counterparty'.
- If "bank_statement": Extract the Bank Name into 'counterparty'.

STEP 3: COMPLIANCE CHECK (UAE/GCC VAT Law)
Check for these specific visual elements (return boolean):
- taxInvoiceLabel: Does it say "Tax Invoice"?
- trnPresent: Is a Tax Registration Number (TRN) visible?
- invoiceNumberPresent: Is a unique Invoice/Bill Number visible?
- vatBreakdown: Is the VAT amount explicitly shown separate from the total?
- lineItemsDetailed: Are line items clearly listed?

STEP 4: INTELLIGENT ANALYSIS
- **summary**: Generate a short, professional description of the transaction (e.g., "Office Supply Purchase", "Client Lunch Meeting", "Consulting Services for Project X").
- **account_guess**: For each line item, predict the standard accounting ledger name according to zoho books (e.g., "Travel Expense", "Meals and Entertainment", "IT Equipment", "Cost of Goods Sold", "Sales Revenue").

STEP 5: EXTRACTION
Extract standard fields: date, due_date, invoice_number, reference_number (PO#), currency, total_amount, tax_amount, discount.

RETURN JSON ONLY. Structure:
{
  "category": "bill" | "invoice" | "bank_statement",
  "confidence_score": 0.0 to 1.0,
  "summary": "string",
  "counterparty": {
    "name": "string",
    "trn": "string",
    "address": "string"
  },
  "header": {
    "date": "YYYY-MM-DD",
    "due_date": "YYYY-MM-DD",
    "invoice_number": "string",
    "reference_number": "string",
    "currency": "AED",
    "total": 0.00,
    "tax": 0.00,
    "discount": 0.00
  },
  "lines": [
    {
      "description": "string",
      "quantity": 1.0,
      "rate": 0.00,
      "account_guess": "string"
    }
  ],
  "compliance": {
    "isCompliant": boolean,
    "missingFields": ["list", "of", "strings"],
    "details": {
      "taxInvoiceLabel": boolean,
      "supplierTRN": boolean,
      "invoiceNumberPresent": boolean,
      "vatAmountShown": boolean
    }
  }
}
"""

def normalize_float(val):
    if val is None: return 0.0
    if isinstance(val, (float, int)): return float(val)
    try:
        # Remove currency symbols and commas
        clean = str(val).replace(",", "").replace("$", "").replace("AED", "").replace("SAR", "").strip()
        return float(clean)
    except:
        return 0.0

async def analyze_document(file_bytes: bytes, db: Session, mime_type: str = "image/jpeg", filename: str = "") -> ExtractedData:
    
    # 1. Check Client
    if not client:
        print("❌ AI Error: Client not initialized. Check GOOGLE_API_KEY.")
        return ExtractedData(category="error", warning_message="AI Server Disconnected (Key Missing)")

    try:
        print(f"🤖 Sending {len(file_bytes)} bytes to Gemini (Model: gemini-1.5-flash)...")

        # 2. Call Gemini
        response = client.models.generate_content(
            model="gemini-2.5-flash", 
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_text(text=SYSTEM_PROMPT),
                        types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
                    ],
                )
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1 # Low temperature for factual extraction
            ),
        )

        # 3. Parse JSON
        raw_text = response.text.strip()
        # Handle potential markdown code blocks
        if raw_text.startswith("```json"):
            raw_text = raw_text.replace("```json", "").replace("```", "")
        
        raw_data = json.loads(raw_text)
        print(f"✅ AI Analysis Complete. Summary: {raw_data.get('summary', 'No summary')}")

        # 4. Map 'Counterparty' to VendorDraft
        raw_party = raw_data.get("counterparty", {})
        vendor_obj = VendorDraft(
            name=raw_party.get("name") or "Unknown Contact",
            trn=raw_party.get("trn"),
            address=raw_party.get("address"),
            is_new=True 
        )

        raw_header = raw_data.get("header", {})

        # 5. Process Lines & Smart Account Matching
        raw_lines = raw_data.get("lines", [])
        clean_lines = []
        
        for item in raw_lines:
            qty = normalize_float(item.get("quantity", 1))
            rate = normalize_float(item.get("rate", 0))
            if qty == 0: qty = 1.0
            
            # --- ACCOUNT MATCHING LOGIC ---
            ai_account_guess = item.get("account_guess")
            matched_account_id = None
            
            if ai_account_guess:
                # Fuzzy search in local DB to see if we have a real account for this guess
                account = crud_account.get_account_by_name_match(db, ai_account_guess)
                if account:
                    print(f"   🔹 Matched '{ai_account_guess}' -> {account.name} ({account.zoho_id})")
                    matched_account_id = account.zoho_id
                else:
                    print(f"   🔸 Unmatched AI Guess: '{ai_account_guess}'")
            
            clean_lines.append(LineItemBase(
                description=item.get("description") or "Item",
                quantity=qty,
                rate=rate,
                accountId=matched_account_id,
                # Pass the raw guess so UI can show it if matching failed
                account_guess=ai_account_guess 
            ))

        # 6. Compliance Mapping
        raw_comp = raw_data.get("compliance", {})
        comp_details = raw_comp.get("details", {})
        
        comp_obj = ComplianceChecklist(
            isCompliant=raw_comp.get("isCompliant", False),
            missingFields=raw_comp.get("missingFields", []),
            details={
                "taxInvoiceLabel": comp_details.get("taxInvoiceLabel", False),
                "supplierTRN": comp_details.get("supplierTRN", False),
                "vatAmountShown": comp_details.get("vatAmountShown", False),
                "invoiceNumberPresent": comp_details.get("invoiceNumberPresent", False)
            }
        )

        # 7. Final Assembly
        result = ExtractedData(
            category=raw_data.get("category", "bill"),
            confidence_score=raw_data.get("confidence_score", 0.0),
            
            # Map the summary to notes
            notes=raw_data.get("summary"), 
            
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
        print(f"❌ AI Extraction Error: {e}")
        # Return a graceful error structure
        return ExtractedData(
            category="error",
            warning_message=f"AI Processing Failed: {str(e)}"
        )