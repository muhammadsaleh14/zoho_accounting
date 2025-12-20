from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import time
import shutil
import os
from dotenv import load_dotenv
from services.gemini import analyze_receipt_with_gemini
from services.zoho import create_bill_in_zoho, fetch_chart_of_accounts # <--- Added

load_dotenv()
app = FastAPI()

# --- CONFIGURATION ---
# UPDATE THIS WITH YOUR CURRENT NGROK URL
BASE_URL = "http://localhost:8000"

# --- 1. CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. STATIC FILES ---
os.makedirs("uploads", exist_ok=True)
app.mount("/images", StaticFiles(directory="uploads"), name="images")

# --- 3. DATA MODELS (Updated for Checklist) ---
class ComplianceChecklist(BaseModel):
    taxInvoiceLabel: bool
    supplierName: bool
    supplierAddress: bool
    supplierTRN: bool
    customerName: bool
    customerAddress: bool
    customerTRN: bool
    invoiceDate: bool
    invoiceNumber: bool
    lineItemsDetailed: bool
    subtotalExclVAT: bool
    vatRateShown: bool
    vatAmountShown: bool
    totalAmountMatch: bool

class ComplianceResult(BaseModel):
    isCompliant: bool
    missingFields: List[str]
    confidenceScore: float
    checklist: ComplianceChecklist # <--- Added this

class Invoice(BaseModel):
    id: str
    vendor: str
    date: str
    amount: float
    currency: str
    invoiceNumber: Optional[str] = None
    status: str
    imageUrl: str
    compliance: ComplianceResult

# --- 4. IN-MEMORY DB ---
invoices_db = [] 

# --- 5. ENDPOINTS ---

@app.get("/")
def read_root():
    return {"status": "Backend is running"}

@app.get("/invoices", response_model=List[Invoice])
def get_invoices():
    return list(reversed(invoices_db))

@app.post("/upload")
async def upload_invoice(file: UploadFile = File(...)):
    
    # 1. Save File
    filename = f"{int(time.time())}_{file.filename}"
    file_location = f"uploads/{filename}"
    
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # 2. Read for AI
    with open(file_location, "rb") as f:
        file_bytes = f.read()
    
    print(f"--- Sending to Gemini AI: {filename} ---")
    
    # 3. Analyze
    ai_result = analyze_receipt_with_gemini(file_bytes)
    print("Gemini Result:", ai_result)

    # 4. Extract Checklist safely (handle missing keys by defaulting to False)
    checklist_data = ai_result.get("compliance_checklist", {})
    
    checklist_obj = {
        "taxInvoiceLabel": checklist_data.get("taxInvoiceLabel", False),
        "supplierName": checklist_data.get("supplierName", False),
        "supplierAddress": checklist_data.get("supplierAddress", False),
        "supplierTRN": checklist_data.get("supplierTRN", False),
        "customerName": checklist_data.get("customerName", False),
        "customerAddress": checklist_data.get("customerAddress", False),
        "customerTRN": checklist_data.get("customerTRN", False),
        "invoiceDate": checklist_data.get("invoiceDate", False),
        "invoiceNumber": checklist_data.get("invoiceNumber", False),
        "lineItemsDetailed": checklist_data.get("lineItemsDetailed", False),
        "subtotalExclVAT": checklist_data.get("subtotalExclVAT", False),
        "vatRateShown": checklist_data.get("vatRateShown", False),
        "vatAmountShown": checklist_data.get("vatAmountShown", False),
        "totalAmountMatch": checklist_data.get("totalAmountMatch", False),
    }

    # 5. Create Invoice Object
    new_invoice = {
        "id": str(int(time.time())),
        "vendor": ai_result.get("vendor", "Unknown"),
        "date": ai_result.get("date", "2025-01-01"),
        "amount": ai_result.get("amount", 0.0),
        "currency": ai_result.get("currency", "AED"),
        "invoiceNumber": ai_result.get("invoice_number"),
        "status": "review" if not ai_result.get("isCompliant") else "queue",
        "imageUrl": f"{BASE_URL}/images/{filename}",
        "compliance": {
            "isCompliant": ai_result.get("isCompliant", False),
            "missingFields": ai_result.get("missingFields", []),
            "confidenceScore": ai_result.get("confidenceScore", 0.0),
            "checklist": checklist_obj
        }
    }
    
    invoices_db.append(new_invoice)
    return new_invoice

# Add this Model
class ApproveRequest(BaseModel):
    id: str
    vendor: str
    date: str
    amount: float
    invoiceNumber: str
    accountId: str

@app.post("/approve")
async def approve_invoice_endpoint(data: ApproveRequest):
    print(f"Approving Invoice: {data.invoiceNumber}")
    
    # 1. Send to Zoho
    zoho_response = await create_bill_in_zoho(data.dict())
    
    print("Zoho Response:", zoho_response)
    
    if zoho_response.get("code") == 0:
        # Success! Update local DB status
        # (Find item in invoices_db and update status to 'approved')
        for inv in invoices_db:
            if inv["id"] == data.id:
                inv["status"] = "approved"
        
        return {"status": "success", "message": "Bill Created", "details": zoho_response}
    else:
        return {"status": "error", "message": zoho_response.get("message")}
    
@app.get("/accounts")
async def get_accounts():
    accounts = await fetch_chart_of_accounts()
    # Fallback if Zoho connection fails (so Demo doesn't break)
    if not accounts:
        return [
            {"account_id": "999", "account_name": "Uncategorized Expense (Offline Mode)"}
        ]
    return accounts