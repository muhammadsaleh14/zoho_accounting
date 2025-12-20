from fastapi import FastAPI, UploadFile, File
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from httpx import Request
from pydantic import BaseModel
from typing import List, Optional
import time
import shutil
import os
from dotenv import load_dotenv
from services.gemini import analyze_receipt_with_gemini
from services.zoho import create_bill_in_zoho, fetch_chart_of_accounts, fetch_customers # <--- Added

load_dotenv()
app = FastAPI()


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Get the raw body to see what the frontend actually sent
    body = await request.body()
    print(f"\n❌ 422 VALIDATION ERROR:")
    print(f"URL: {request.url}")
    print(f"Body Received: {body.decode('utf-8')}")
    print(f"Missing/Wrong Fields: {exc.errors()}\n")
    
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": body.decode('utf-8')},
    )

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
    
# --- NEW DATA MODELS ---
class LineItem(BaseModel):
    description: str
    accountId: str
    quantity: float
    rate: float
    # Optional because user might select "None"
    customerId: Optional[str] = "" 

class ApproveRequest(BaseModel):
    id: str
    vendor: str
    
    # MAPPING FIX: React sends 'billNumber', previous model expected 'invoiceNumber'
    billNumber: str 
    
    # MAPPING FIX: React sends 'billDate', previous model expected 'date'
    billDate: str   
    
    dueDate: str
    orderNumber: Optional[str] = ""
    subject: Optional[str] = ""
    
    # React sends adjustment as string or number depending on input, force float
    adjustment: float 
    
    amount: float
    lineItems: List[LineItem]

# --- 4. IN-MEMORY DB ---
invoices_db = [] 

# --- 5. ENDPOINTS ---

@app.get("/")
def read_root():
    return {"status": "Backend is running"}

@app.get("/customers")
async def get_customers():
    return await fetch_customers()

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



@app.post("/approve")
async def approve_invoice_endpoint(data: ApproveRequest):
    # 1. Find the local file path from our database
    local_path = None
    for inv in invoices_db:
        if inv["id"] == data.id:
            filename = inv["imageUrl"].split("/images/")[-1]
            local_path = f"uploads/{filename}"
            break
            
    zoho_response = await create_bill_in_zoho(data.dict(), local_image_path=local_path)
    
    print("Zoho Response:", zoho_response)
    
    if zoho_response.get("code") == 0:
        # 2. SUCCESS: Update the Local Database with the EDITED values
        for inv in invoices_db:
            if inv["id"] == data.id:
                # Update Status
                inv["status"] = "approved"
                
                # --- NEW: SAVE USER EDITS ---
                # This ensures the History tab shows what the user actually typed,
                # not what the AI originally guessed.
                inv["vendor"] = data.vendor
                inv["amount"] = data.amount
                inv["date"] = data.billDate      # Map 'billDate' to 'date'
                inv["invoiceNumber"] = data.billNumber # Map 'billNumber' to 'invoiceNumber'
                
                # We can also store the Zoho Bill ID if we want to link to it later
                inv["zohoBillId"] = zoho_response["bill"]["bill_id"]
                break
        
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