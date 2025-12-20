import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types

# 1. Load Secrets explicitly here to avoid KeyError on import
load_dotenv()

# 2. Get Key safely
api_key = os.environ.get("GOOGLE_API_KEY")
if not api_key:
    print("CRITICAL WARNING: GOOGLE_API_KEY not found in env variables!")

# 3. Initialize Client (New SDK Syntax)
# We handle the case where key is missing to prevent crash on start
try:
    client = genai.Client(api_key=api_key)
except Exception as e:
    print(f"Failed to initialize Gemini Client: {e}")
    client = None

def analyze_receipt_with_gemini(file_bytes: bytes):
    """
    Sends image to Gemini 1.5 Flash using the new google-genai SDK.
    """
    if not client:
        return {
            "isCompliant": False,
            "missingFields": ["Server Error: AI Key Missing"],
            "confidenceScore": 0.0
        }

    prompt = """
    You are a strict UAE VAT Compliance Officer. Analyze this receipt image against the Federal Tax Authority requirements.
    
    EXTRACT DATA:
    - Vendor Name, Date, Total Amount, Currency, Invoice Number.
    
    PERFORM COMPLIANCE CHECKLIST (True/False):
    1. marked_tax_invoice: Does it explicitly say "Tax Invoice"?
    2. supplier_name: Is the supplier's legal name visible?
    3. supplier_address: Is the supplier's address visible?
    4. supplier_trn: Is a 15-digit TRN present?
    5. customer_name: Is the buyer's name visible?
    6. customer_address: Is the buyer's address visible?
    7. invoice_date: Is the date present?
    8. invoice_number: Is a unique number present?
    9. line_items: Are description, quantity, and unit price listed?
    10. subtotal: Is the subtotal (excluding VAT) shown?
    11. vat_rate: Is the VAT rate (e.g., 5%) explicitly shown?
    12. vat_amount: Is the VAT amount explicitly shown in AED?
    13. total_math: Does Subtotal + VAT = Total?
    
    RETURN JSON ONLY:
    {
      "vendor": "string",
      "date": "YYYY-MM-DD",
      "amount": float,
      "currency": "string",
      "invoice_number": "string",
      "compliance_checklist": {
        "taxInvoiceLabel": boolean,
        "supplierName": boolean,
        "supplierAddress": boolean,
        "supplierTRN": boolean,
        "customerName": boolean,
        "customerAddress": boolean,
        "customerTRN": boolean, // Set true if B2B TRN found, true if B2C (not required)
        "invoiceDate": boolean,
        "invoiceNumber": boolean,
        "lineItemsDetailed": boolean,
        "subtotalExclVAT": boolean,
        "vatRateShown": boolean,
        "vatAmountShown": boolean,
        "totalAmountMatch": boolean
      },
      "isCompliant": boolean, // True only if CRITICAL fields (Header, Supplier TRN, Date, Total, VAT Amt) are present. Customer details can be loose.
      "missingFields": ["List of readable error messages for False items"],
      "confidenceScore": float
    }
    """
 
    try:
        # 4. Generate Content (New SDK Syntax)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_text(text=prompt),
                        types.Part.from_bytes(data=file_bytes, mime_type="image/jpeg"),
                    ],
                )
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json" # Force JSON mode
            ),
        )

        # 5. Parse Response
        # The new SDK returns a parsed object if response_mime_type is json, 
        # or we access .text and parse it.
        try:
            # Try to get the parsed structure directly if available, or parse text
            return json.loads(response.text)
        except json.JSONDecodeError:
            # Fallback cleanup if the model adds markdown backticks
            raw_text = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(raw_text)

    except Exception as e:
        print(f"Gemini API Error: {e}")
        return {
            "vendor": "AI Error",
            "date": "2025-12-19",
            "amount": 0.0,
            "currency": "AED",
            "isCompliant": False,
            "missingFields": [f"AI Processing Failed: {str(e)}"],
            "confidenceScore": 0.0
        }