import os
import httpx # We need 'pip install httpx'
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("ZOHO_CLIENT_ID")
CLIENT_SECRET = os.getenv("ZOHO_CLIENT_SECRET")
REFRESH_TOKEN = os.getenv("ZOHO_REFRESH_TOKEN")
ORG_ID = os.getenv("ZOHO_ORG_ID")

async def get_access_token():
    """Exchanges the permanent Refresh Token for a temporary Access Token."""
    url = f"https://accounts.zoho.com/oauth/v2/token?refresh_token={REFRESH_TOKEN}&client_id={CLIENT_ID}&client_secret={CLIENT_SECRET}&grant_type=refresh_token"
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(url)
        data = resp.json()
        if "access_token" not in data:
            print(f"Zoho Auth Error: {data}")
            return None
        return data["access_token"]

DEMO_VENDOR_ID = "8057096000000098003" # John Vendor 
async def create_bill_in_zoho(invoice_data: dict):
    """Creates a Bill in Zoho Books."""
    
    token = await get_access_token()
    if not token:
        return {"error": "Failed to authenticate with Zoho"}

    # --- THE FIX: USE A REAL ID ---
    zoho_payload = {
        "bill_number": invoice_data.get("invoiceNumber", "INV-MISSING"),
        "date": invoice_data.get("date"),
        
        # CRITICAL CHANGE: Use vendor_id, NOT vendor_name
        "vendor_id": DEMO_VENDOR_ID, 
        
        # Optional: You can put the real name in notes/description
        "notes": f"Original Vendor: {invoice_data.get('vendor')}",
        
        "line_items": [
            {
                "account_id": invoice_data.get("accountId"),
                "rate": invoice_data.get("amount"),
                "description": "Uploaded via Receipt Portal"
            }
        ]
    }

    headers = {
        "Authorization": f"Zoho-oauthtoken {token}",
        "Content-Type": "application/json"
    }
    
    # Debug Print to verify payload
    print(f"Sending to Zoho: {zoho_payload}")
    
    url = f"https://www.zohoapis.com/books/v3/bills?organization_id={ORG_ID}"
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=zoho_payload, headers=headers)
        return resp.json()  
    
async def fetch_chart_of_accounts():
    """Fetches the list of Expense accounts from Zoho."""
    
    token = await get_access_token()
    if not token:
        return []

    headers = {
        "Authorization": f"Zoho-oauthtoken {token}",
        "Content-Type": "application/json"
    }
    
    # Filter for 'Expense' accounts only to keep the dropdown clean
    url = f"https://www.zohoapis.com/books/v3/chartofaccounts?organization_id={ORG_ID}&filter_by=AccountType.Expense"
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers)
        data = resp.json()
        
        if data.get("code") == 0:
            # Map it to a clean format for the frontend
            return [
                {"account_id": acc["account_id"], "account_name": acc["account_name"]} 
                for acc in data.get("chartofaccounts", [])
            ]
        else:
            print(f"Zoho Fetch Error: {data}")
            return []