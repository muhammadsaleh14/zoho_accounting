# apps/backend/app/services/mock_factory.py

import random
import uuid
import asyncio
from datetime import date, timedelta
from typing import List, Dict, Any

# In-Memory Storage
MOCK_INVOICE_DB = []

class MockDataFactory:
    
    def __init__(self):
        if not MOCK_INVOICE_DB:
            self._seed_data()

    def _seed_data(self):
        # ... (Existing seed logic remains, just ensure keys match below) ...
        pass

    async def get_accounts(self):
        """Returns a static robust Chart of Accounts."""
        await asyncio.sleep(0.5) 
        return [
            {"account_id": "99001", "account_name": "Advertising & Marketing", "account_code": "6001", "type": "expense"},
            {"account_id": "99002", "account_name": "Meals & Entertainment", "account_code": "6005", "type": "expense"},
            {"account_id": "99003", "account_name": "Office Supplies", "account_code": "6010", "type": "expense"},
            {"account_id": "99004", "account_name": "Travel Expense", "account_code": "6015", "type": "expense"},
            {"account_id": "99005", "account_name": "IT & Computer Equipment", "account_code": "6020", "type": "fixed_asset"},
            {"account_id": "99006", "account_name": "Cost of Goods Sold", "account_code": "5000", "type": "cogs"},
        ]

    async def get_customers(self):
        # ... (Existing customer logic) ...
        return [
            {"contact_id": "88001", "contact_name": "Acme Corp (Client)"},
            {"contact_id": "88002", "contact_name": "Globex Inc"},
        ]

    async def process_upload(self, file_name: str, category: str):
        print(f"🔮 [MOCK] Analyzing {file_name}...")
        await asyncio.sleep(2.0) 

        # 1. SMART GUESS LOGIC
        # We determine Vendor + Account ID based on filename
        if "uber" in file_name.lower():
            vendor = "Uber Technologies"
            amount = 45.50
            acct_id = "99004" # Travel Expense
            desc = "Taxi Ride - Client Meeting"
        elif "hotel" in file_name.lower():
            vendor = "Rove Hotels"
            amount = 450.00
            acct_id = "99004" # Travel Expense
            desc = "Hotel Stay - 1 Night"
        elif "apple" in file_name.lower() or "mac" in file_name.lower():
            vendor = "Apple Store"
            amount = 8200.00
            acct_id = "99005" # IT Equipment
            desc = "MacBook Pro M3"
        elif "lunch" in file_name.lower():
            vendor = "Nandos"
            amount = 125.00
            acct_id = "99002" # Meals
            desc = "Team Lunch"
        else:
            vendor = "Carrefour Market"
            amount = round(random.uniform(100, 900), 2)
            acct_id = "99003" # Office Supplies
            desc = "General Supplies"

        new_id = 1000 + len(MOCK_INVOICE_DB) + 1
        
        # 2. GENERATE COMPLETE DATA
        mock_entry = {
            "id": new_id,
            "vendor_name_raw": vendor,
            "vendor_id": None,
            "date": date.today().isoformat(),
            "due_date": (date.today() + timedelta(days=30)).isoformat(),
            
            # --- NEW FIELDS FOR FRONTEND ---
            "invoice_number": f"INV-{random.randint(10000, 99999)}",
            "reference_number": f"PO-{random.randint(5000, 6000)}", # Order Number
            "discount": 0.0,
            "adjustment": 0.0,
            # -------------------------------
            
            "amount": amount,
            "currency": "AED",
            "tax_amount": round(amount * 0.05, 2),
            "status": "review",
            "category": category,
            "image_url": f"/images/{file_name}",
            "created_at": date.today().isoformat(),
            "zoho_bill_id": None,
            
            "line_items": [
                {
                    "id": new_id * 10,
                    "description": desc,
                    "quantity": 1.0,
                    "rate": amount,
                    "accountId": acct_id, # Frontend expects "accountId" or "zoho_account_id"
                    "zoho_account_id": acct_id 
                }
            ],
            "compliance_data": {
                "isCompliant": True,
                "missingFields": [],
                "details": {"taxInvoiceLabel": True, "vatAmountShown": True}
            }
        }
        
        MOCK_INVOICE_DB.insert(0, mock_entry)
        return mock_entry

    # ... (Keep get_all_invoices, get_invoice_by_id, approve_invoice as is) ...
    def get_all_invoices(self):
        return MOCK_INVOICE_DB
    
    def get_invoice_by_id(self, invoice_id: int):
        for inv in MOCK_INVOICE_DB:
            if inv["id"] == invoice_id:
                return inv
        return None

    async def approve_invoice(self, bill_number: str):
        await asyncio.sleep(1.5)
        for inv in MOCK_INVOICE_DB:
            if inv["invoice_number"] == bill_number:
                inv["status"] = "synced"
                inv["zoho_bill_id"] = f"zb_{random.randint(100000, 999999)}"
        return {"status": "success", "message": "Mock Bill Synced"}

mock_service = MockDataFactory()