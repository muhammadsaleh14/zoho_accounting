# --- File: apps/backend/app/services/ai_extractor.py ---

import json
import os
from sqlalchemy.orm import Session
from google import genai
from google.genai import types

from app.core.config import settings
from app.schemas.unified import ExtractedData, VendorDraft, LineItemBase, ComplianceChecklist
from app.crud import crud_account
from app.services.account_mapper import AccountMapper

# Initialize Client
try:
    client = genai.Client(api_key=settings.GOOGLE_API_KEY)
except Exception as e:
    print(f"Warning: Gemini Client failed to initialize. Error: {e}")
    client = None

# --- ENHANCED SYSTEM PROMPT FOR FULL AUTOMATION ---
SYSTEM_PROMPT = """
You are an expert AI Accountant specializing in UAE VAT compliance. Analyze the document image provided.

STEP 1: CATEGORIZE
Determine if this is:
1. "bill" (A purchase receipt or invoice received from a vendor).
2. "invoice" (A sales invoice issued BY the user TO a customer).
3. "bank_statement" (A ledger of transactions).

STEP 2: EXTRACT ENTITIES (Context Aware)
- If "bill": Extract the **Supplier/Vendor** details into 'counterparty'.
- If "invoice": Extract the **Customer/Client** ("Bill To") details into 'counterparty'.
- If "bank_statement": Extract the Bank Name into 'counterparty'.

STEP 3: COMPREHENSIVE VAT COMPLIANCE EXTRACTION
Extract ALL VAT compliance fields automatically:
- **Tax Registration Numbers (TRN)**: Look for TRN patterns like "TRN:", "VAT:", or 15-digit numbers
- **Addresses**: Extract complete addresses from header/footer
- **Date of Supply**: Look for "Date of Supply", "Supply Date", or similar
- **Invoice Date**: Extract the actual invoice date
- **Due Date**: Extract payment due date
- **Place of Supply**: Usually UAE for local transactions
- **VAT Rate**: Determine if 5%, 0%, or reverse charge
- **Reverse Charge**: Detect international services (keywords: international, foreign, overseas, USA, Europe, etc.)

STEP 4: INTELLIGENT ANALYSIS
- **summary**: Generate a short, professional description (e.g., "Consulting Services for Project X", "Software License Sale", "Professional Services")
- **account_guess**: For each line item, predict the standard accounting ledger name:
  * For INVOICES (sales): "Consulting Services", "Software Development", "Design Services", "Technical Support", "Maintenance Services", "Software Sales", "License Revenue", "Subscription Revenue", "Service Revenue"
  * For BILLS (expenses): "Software Subscriptions", "Professional Fees", "Office Rent", "Utilities", "Marketing Expenses", "Travel Expenses", "Office Supplies", "Bank Charges", "Insurance Expense", "Miscellaneous Expenses"

STEP 5: DETAILED LINE ITEM EXTRACTION
For each line item extract:
- description (service/product description)
- quantity
- rate (unit price)
- account_guess (intelligent ledger mapping)
- tax_rate (5%, 0%, or null for reverse charge)
- is_reverse_charge (boolean for international services)

STEP 6: COMPLIANCE CHECK (UAE/GCC VAT Law)
Check for these specific visual elements (return boolean):
- taxInvoiceLabel: Does it say "Tax Invoice"?
- supplierTRN: Is supplier TRN visible and complete?
- supplierAddress: Is supplier address extracted?
- customerTRN: Is customer TRN visible?
- customerAddress: Is customer address extracted?
- vatAmountShown: Is the VAT amount explicitly shown separate from the total?
- invoiceNumberPresent: Is a unique Invoice Number visible?
- dateOfSupplyPresent: Is date of supply shown?

STEP 7: FINANCIAL CALCULATIONS
Extract and calculate:
- total_amount (subtotal before VAT)
- tax_amount (VAT amount)
- currency (AED, SAR, USD, etc.)
- discount (if any)

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
    "currency": "string",
    "total": "number",
    "tax": "number",
    "discount": "number",
    "date_of_supply": "YYYY-MM-DD",
    "place_of_supply": "string"
  },
  "line_items": [
    {
      "description": "string",
      "quantity": "number",
      "rate": "number",
      "account_guess": "string",
      "tax_rate": "number",
      "is_reverse_charge": "boolean"
    }
  ],
  "compliance": {
    "isCompliant": "boolean",
    "missingFields": ["string"],
    "details": {
      "taxInvoiceLabel": "boolean",
      "supplierTRN": "boolean",
      "supplierAddress": "boolean",
      "customerTRN": "boolean",
      "customerAddress": "boolean",
      "vatAmountShown": "boolean",
      "invoiceNumberPresent": "boolean",
      "dateOfSupplyPresent": "boolean"
    }
  }
}

IMPORTANT: Extract ALL available information. Do not leave fields empty if the information is present in the document. Be thorough and accurate for full automation.

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

async def analyze_document(
    file_bytes: bytes, 
    db: Session, 
    mime_type: str = "application/pdf", 
    filename: str = "document.pdf",
    user_selected_category: str = None  # NEW: Accept user's category selection
) -> ExtractedData:
    
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
        transaction_type = 'income' if raw_data.get("category") == "invoice" else 'expense'
        
        for item in raw_lines:
            qty = normalize_float(item.get("quantity", 1))
            rate = normalize_float(item.get("rate", 0))
            if qty == 0: qty = 1.0
            
            description = item.get("description", "Item")
            vendor_name = raw_party.get("name", "")
            
            # --- ENHANCED ACCOUNT MATCHING LOGIC ---
            ai_account_guess = item.get("account_guess")
            
            # Use AccountMapper for automated mapping
            mapped_account = AccountMapper.map_account(
                description=description,
                vendor_name=vendor_name,
                transaction_type=transaction_type
            )
            
            # Detect reverse charge
            is_reverse_charge = AccountMapper.detect_reverse_charge(
                description=description,
                vendor_name=vendor_name
            )
            
            # Get VAT rate
            vat_rate = AccountMapper.get_vat_rate(
                description=description,
                vendor_name=vendor_name,
                is_reverse_charge=is_reverse_charge
            )
            
            # Calculate tax amount
            line_total = qty * rate
            tax_amount = line_total * vat_rate if not is_reverse_charge else 0.0
            
            # Try to find matching account in DB
            matched_account_id = None
            account_to_search = mapped_account or ai_account_guess
            
            if account_to_search:
                account = crud_account.get_account_by_name_match(db, account_to_search)
                if account:
                    print(f"   🔹 Matched '{account_to_search}' -> {account.name} ({account.zoho_id})")
                    matched_account_id = account.zoho_id
                else:
                    print(f"   🔸 Unmatched Account: '{account_to_search}' - will create if needed")
            
            clean_lines.append(LineItemBase(
                description=description,
                quantity=qty,
                rate=rate,
                accountId=matched_account_id,
                # Pass the mapped account as guess for UI
                account_guess=mapped_account or ai_account_guess,
                # Add tax information
                tax_rate=vat_rate,
                tax_amount=tax_amount,
                is_reverse_charge=is_reverse_charge
            ))

        raw_header = raw_data.get("header", {})
        raw_lines = raw_data.get("line_items", [])
        raw_comp = raw_data.get("compliance", {})
        comp_details = raw_comp.get("details", {})
        
        # Extract party information (supplier for bills, customer for invoices)
        raw_party = raw_data.get("counterparty", {})
        
        # --- NEW: Enhanced VAT Compliance Extraction ---
        supplier_trn = raw_party.get("trn")
        customer_trn = None  # Would need to extract from document in future
        supplier_address = raw_party.get("address")
        customer_address = None  # Would need to extract from document in future
        
        # Extract date of supply
        date_of_supply = raw_header.get("date_of_supply")
        place_of_supply = raw_header.get("place_of_supply", "UAE")
        
        # Determine overall reverse charge status
        overall_reverse_charge = any(
            AccountMapper.detect_reverse_charge(
                item.get("description", ""),
                raw_party.get("name", "")
            ) for item in raw_lines
        )
        
        # Calculate overall VAT percentage
        total_tax = normalize_float(raw_header.get("tax"))
        total_amount = normalize_float(raw_header.get("total"))
        tax_percentage = (total_tax / (total_amount - total_tax)) if total_amount > total_tax else 0.05
        
        comp_obj = ComplianceChecklist(
            isCompliant=raw_comp.get("isCompliant", False),
            missingFields=raw_comp.get("missingFields", []),
            details={
                "taxInvoiceLabel": comp_details.get("taxInvoiceLabel", False),
                "supplierTRN": bool(supplier_trn),  # Check if TRN was extracted
                "supplierAddress": bool(supplier_address),  # Check if address was extracted
                "vatAmountShown": comp_details.get("vatAmountShown", False),
                "invoiceNumberPresent": comp_details.get("invoiceNumberPresent", False)
            }
        )

        # 7. Final Assembly with Enhanced VAT Fields
        result = ExtractedData(
            category=user_selected_category or raw_data.get("category", "invoice"),  # Default to invoice for tax invoice demo
            confidence_score=raw_data.get("confidence_score", 0.0),
            
            # Map summary to notes
            notes=raw_data.get("summary"), 
            
            vendor=vendor_obj,
            date=raw_header.get("date"),
            due_date=raw_header.get("due_date"),
            invoice_number=raw_header.get("invoice_number"),
            reference_number=raw_header.get("reference_number"),
            discount=normalize_float(raw_header.get("discount")),
            currency=raw_header.get("currency", "AED"),
            total_amount=normalize_float(raw_header.get("total")),
            tax_amount=normalize_float(raw_header.get("tax")),
            
            # --- ENHANCED VAT COMPLIANCE FIELDS ---
            tax_percentage=tax_percentage,
            is_reverse_charge=overall_reverse_charge,
            supplier_trn=supplier_trn,
            supplier_address=supplier_address,
            customer_trn=customer_trn,
            customer_address=customer_address,
            date_of_supply=date_of_supply,
            place_of_supply=place_of_supply,
            
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
