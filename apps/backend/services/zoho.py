import os
import time
import httpx # We need 'pip install httpx'
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("ZOHO_CLIENT_ID")
CLIENT_SECRET = os.getenv("ZOHO_CLIENT_SECRET")
REFRESH_TOKEN = os.getenv("ZOHO_REFRESH_TOKEN")
ORG_ID = os.getenv("ZOHO_ORG_ID")

CACHED_ACCESS_TOKEN = None
TOKEN_EXPIRY_TIME = 0


async def get_access_token():
    global CACHED_ACCESS_TOKEN, TOKEN_EXPIRY_TIME
    
    current_time = time.time()
    
    # 1. Check if we have a valid token (Buffer of 60 seconds)
    if CACHED_ACCESS_TOKEN and current_time < (TOKEN_EXPIRY_TIME - 60):
        return CACHED_ACCESS_TOKEN

    # 2. If expired or missing, get a new one
    print("🔄 Generating NEW Zoho Access Token...")
    url = f"https://accounts.zoho.com/oauth/v2/token?refresh_token={REFRESH_TOKEN}&client_id={CLIENT_ID}&client_secret={CLIENT_SECRET}&grant_type=refresh_token"
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(url)
        data = resp.json()
        
        if "access_token" not in data:
            print(f"Zoho Auth Error: {data}")
            return None
            
        # 3. Save to Cache
        CACHED_ACCESS_TOKEN = data["access_token"]
        # Zoho tokens usually last 3600 seconds (1 hour). We set expiration.
        expires_in = data.get("expires_in", 3600) 
        TOKEN_EXPIRY_TIME = current_time + expires_in
        
        return CACHED_ACCESS_TOKEN
    
DEMO_VENDOR_ID = "8057096000000098003" # John Vendor 


async def fetch_customers():
    token = await get_access_token()
    if not token: return []
    # Filter by contact_type=customer
    url = f"https://www.zohoapis.com/books/v3/contacts?organization_id={ORG_ID}&contact_type=customer"
    headers = {"Authorization": f"Zoho-oauthtoken {token}"}
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers)
        return resp.json().get("contacts", [])
    
# --- NEW: Upload Attachment ---
async def upload_attachment_to_bill(bill_id: str, file_path: str):
    token = await get_access_token()
    url = f"https://www.zohoapis.com/books/v3/bills/{bill_id}/attachment?organization_id={ORG_ID}"
    headers = {"Authorization": f"Zoho-oauthtoken {token}"}
    
    # Check if file exists locally (in apps/backend/uploads)
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
        
    files = {'attachment': open(file_path, 'rb')}
    async with httpx.AsyncClient() as client:
        await client.post(url, headers=headers, files=files)
        print(f"Attached {file_path} to Bill {bill_id}")


async def create_bill_in_zoho(invoice_data: dict, local_image_path: str = None):
    token = await get_access_token()
    
    # 1. Map Line Items
    line_items = []
    for item in invoice_data.get("lineItems", []):
        line_items.append({
            "account_id": item.get("accountId"),
            "description": item.get("description"),
            "rate": item.get("rate"),
            "quantity": item.get("quantity"),
            "customer_id": item.get("customerId") or "" 
        })

    # 2. Map Main Fields (Updated keys)
    zoho_payload = {
        "vendor_id": DEMO_VENDOR_ID,
        
        # Updated to match new frontend keys:
        "bill_number": invoice_data.get("billNumber"), 
        "date": invoice_data.get("billDate"), 
        "due_date": invoice_data.get("dueDate"),
        "reference_number": invoice_data.get("orderNumber"),
        
        "notes": invoice_data.get("subject"), 
        "adjustment": invoice_data.get("adjustment", 0),
        "line_items": line_items
    }

    headers = {"Authorization": f"Zoho-oauthtoken {token}"}
    url = f"https://www.zohoapis.com/books/v3/bills?organization_id={ORG_ID}"
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=zoho_payload, headers=headers)
        data = resp.json()
        
        # 2. If successful, Upload Attachment
        if data.get("code") == 0 and local_image_path:
            bill_id = data["bill"]["bill_id"]
            await upload_attachment_to_bill(bill_id, local_image_path)
            
        return data
    
        
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