from fastapi import FastAPI, Form, UploadFile, File
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
BASE_URL = "http://localhost:8000"  # e.g., "https://abcd1234.ngrok.io"
# BASE_URL = "https://polemoniaceous-disclamatory-brett.ngrok-free.dev"
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


class BankTransaction(BaseModel):
    date: str
    description: str
    amount: float


class BankStatementData(BaseModel):
    openingBalance: float
    closingBalance: float
    transactions: List[BankTransaction]
    
class Invoice(BaseModel):
    id: str
    vendor: str
    date: str = "Unknown Date"
    amount: float
    currency: str
    invoiceNumber: Optional[str] = None
    status: str
    imageUrl: str

    category: str

    # 🔥 THIS IS WHAT WAS DROPPING YOUR DATA
    bankStatementData: Optional[BankStatementData] = None

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


    
import json

# --- 4. PERSISTENCE SETUP ---
DB_FILE = "data/db.json"
os.makedirs("data", exist_ok=True)

def load_db():
    if not os.path.exists(DB_FILE):
        return {"invoices": [], "notifications": []}
    try:
        with open(DB_FILE, "r") as f:
            return json.load(f)
    except:
        return {"invoices": [], "notifications": []}

def save_db(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=2)

# Initialize State
db_state = load_db()
invoices_db = db_state["invoices"]
notifications_db = db_state.get("notifications", []) # Backwards compatibility

# --- 5. ENDPOINTS ---

@app.get("/")
def read_root():
    return {"status": "Backend is running"}

@app.get("/customers")
async def get_customers():
    return await fetch_customers()

@app.get("/notifications")
def get_notifications():
    response = list(reversed(notifications_db))
    # Filter out any that might be malformed
    return [n for n in response if isinstance(n, dict) and "id" in n]

@app.get("/invoices", response_model=List[Invoice])
def get_invoices():
    return list(reversed(invoices_db))

@app.post("/upload")
async def upload_invoice(
    file: UploadFile = File(...), 
    category: str = Form("bill") 
):
    # 1. Save File (Existing logic)
    filename = f"{int(time.time())}_{file.filename}"
    file_location = f"uploads/{filename}"
    
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # --- BANK STATEMENT DEMO LOGIC ---
    if category == "bank_statement":
        print("--- Bank Statement Received: Returning Mock Data ---")
        time.sleep(1) 
        
        mock_statement_data = {
            "openingBalance": 1000.00,
            "closingBalance": 2550.50,
            "transactions": [
                {"date": "2025-12-01", "description": "ACH Deposit - Client A", "amount": 2000.00},
                {"date": "2025-12-05", "description": "Withdrawal - ATM", "amount": -100.00},
                {"date": "2025-12-10", "description": "Stripe Payout", "amount": 750.50},
            ]
        }
        
        bank_statement_invoice = {
            "id": str(int(time.time())),
            "vendor": "Emirates NBD - Bank Statement",
            "date": "2025-12-31",
            "amount": mock_statement_data["closingBalance"],
            "currency": "AED",
            "invoiceNumber": None,
            "status": "review",
            "imageUrl": f"{BASE_URL}/images/report.pdf",
            "category": "bank_statement",
            "bankStatementData": mock_statement_data,
            "compliance": {
                "isCompliant": True, "missingFields": [], "confidenceScore": 1.0,
                "checklist": { "taxInvoiceLabel": True, "supplierName": True, "supplierAddress": True, "supplierTRN": True, "customerName": True, "customerAddress": True, "customerTRN": True, "invoiceDate": True, "invoiceNumber": True, "lineItemsDetailed": True, "subtotalExclVAT": True, "vatRateShown": True, "vatAmountShown": True, "totalAmountMatch": True }
            }
        }
        
        # SAVE TO DB
        invoices_db.append(bank_statement_invoice)
        
        # CREATE NOTIFICATION
        new_notification = {
            "id": str(int(time.time())),
            "title": "New Bank Statement Uploaded",
            "description": "Emirates NBD Statement ready for reconciliation.",
            "time": "Just now",
            "type": "info",
            "read": False
        }
        notifications_db.append(new_notification)
        
        save_db({"invoices": invoices_db, "notifications": notifications_db})
        
        return bank_statement_invoice

    # 2. Read for AI 
    with open(file_location, "rb") as f:
        file_bytes = f.read()
    
    file_type = file.content_type or "image/jpeg"
    
    # 3. Analyze 
    print(f"--- Processing {category.upper()} : {filename} ---")
    ai_result = analyze_receipt_with_gemini(file_bytes, file_type)
    
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

    # 4. Create Invoice Object
    is_compliant = ai_result.get("isCompliant", False)
    new_invoice = {
        "id": str(int(time.time())),
        "vendor": ai_result.get("vendor") or "Unknown Vendor",
        "date": ai_result.get("date") or "2025-01-01",
        "amount": ai_result.get("amount") or 0.0,
        "currency": ai_result.get("currency") or "AED",
        "invoiceNumber": ai_result.get("invoice_number"),
        "status": "review" if not is_compliant else "queue",
        "imageUrl": f"{BASE_URL}/images/{filename}",
        "category": category, 
        "compliance": {
            "isCompliant": is_compliant,
            "missingFields": ai_result.get("missingFields", []),
            "confidenceScore": ai_result.get("confidenceScore", 0.0),
            "checklist": checklist_obj
        }
    }
    
    # SAVE TO DB
    invoices_db.append(new_invoice)
    
    # CREATE NOTIFICATION
    vendor_name = new_invoice["vendor"]
    notif_type = 'alert' if not is_compliant else 'success'
    notif_title = "Compliance Issue Detected" if not is_compliant else "New Invoice Uploaded"
    notif_desc = f"Invoice from {vendor_name} is missing mandatory fields." if not is_compliant else f"Invoice from {vendor_name} verified successfully."
    
    new_notification = {
        "id": str(int(time.time())) + "_n",
        "title": notif_title,
        "description": notif_desc,
        "time": "Just now",
        "type": notif_type,
        "read": False
    }
    notifications_db.append(new_notification)
    
    save_db({"invoices": invoices_db, "notifications": notifications_db})

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
        
        save_db({"invoices": invoices_db, "notifications": notifications_db})
        
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