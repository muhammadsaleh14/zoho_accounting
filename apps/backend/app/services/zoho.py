import httpx
import time
from typing import List, Dict, Any
from app.core.config import settings
import os # Ensure os is imported if not already

CACHED_ACCESS_TOKEN = None
TOKEN_EXPIRY_TIME = 0


# This function might not be directly in this file in your structure, but the logic is what's important
async def get_access_token():
    global CACHED_ACCESS_TOKEN, TOKEN_EXPIRY_TIME
    current_time = time.time()
    
    if CACHED_ACCESS_TOKEN and current_time < (TOKEN_EXPIRY_TIME - 60):
        return CACHED_ACCESS_TOKEN

    # exchange refresh token for access token
    url = "https://accounts.zoho.com/oauth/v2/token"
    params = {
        "refresh_token": settings.ZOHO_REFRESH_TOKEN,
        "client_id": settings.ZOHO_CLIENT_ID,
        "client_secret": settings.ZOHO_CLIENT_SECRET,
        "grant_type": "refresh_token"
    }
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, params=params)
        data = resp.json()
        
        if "access_token" in data:
            CACHED_ACCESS_TOKEN = data["access_token"]
            TOKEN_EXPIRY_TIME = current_time + data.get("expires_in", 3600)
            return CACHED_ACCESS_TOKEN
        else:
            print(f"❌ Auth Error: {data}")
            return None


# 1. Generic Fetcher (Handles Pagination)
async def fetch_all_contacts(contact_type: str = "vendor") -> List[Dict[str, Any]]:
    """
    Fetches ALL contacts of a specific type from Zoho (handling pagination).
    """
    token = await get_access_token()
    if not token:
        print("❌ Sync Aborted: No Access Token")
        return []

    base_url = "https://www.zohoapis.com/books/v3/contacts"
    headers = {"Authorization": f"Zoho-oauthtoken {token}"}
    
    all_contacts = []
    page = 1
    has_more = True
    
    print(f"🔄 Starting Zoho Sync for {contact_type}s...")
    
    async with httpx.AsyncClient() as client:
        while has_more:
            params = {
                "organization_id": settings.ZOHO_ORG_ID,
                "contact_type": contact_type,
                "page": page,
                "per_page": 200
            }
            try:
                resp = await client.get(base_url, headers=headers, params=params)
                data = resp.json()
                if data.get("code") != 0:
                    print(f"❌ Zoho Error on page {page}: {data.get('message')}")
                    break
                contacts = data.get("contacts", [])
                all_contacts.extend(contacts)
                page_context = data.get("page_context", {})
                has_more = page_context.get("has_more_page", False)
                page += 1
            except Exception as e:
                print(f"❌ Network Error: {e}")
                break
                
    print(f"✅ Fetched {len(all_contacts)} {contact_type}s from Zoho.")
    return all_contacts

async def create_zoho_contact(name: str, trn: str = None, address: str = None) -> dict:
    """
    Creates a new Vendor or Customer in Zoho Books.
    """
    token = await get_access_token()
    url = f"https://www.zohoapis.com/books/v3/contacts?organization_id={settings.ZOHO_ORG_ID}"
    headers = {"Authorization": f"Zoho-oauthtoken {token}"}
    
    payload = {
        "contact_name": name,
        "contact_type": "vendor",
        "billing_address": { "address": address or "" }
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload, headers=headers)
        data = resp.json()
        if data.get("code") == 0:
            return data["contact"]
        else:
            raise Exception(f"Zoho Contact Creation Failed: {data.get('message')}")

async def create_zoho_bill_or_invoice(payload: dict, category: str):
    token = await get_access_token()
    endpoint = "bills" if category == "bill" else "invoices"
    
    # URL must include organization_id
    url = f"https://www.zohoapis.com/books/v3/{endpoint}"
    params = {"organization_id": settings.ZOHO_ORG_ID} # <-- Ensure this is sent
    
    headers = {
        "Authorization": f"Zoho-oauthtoken {token}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload, headers=headers, params=params)
        data = resp.json()
        if data.get("code") == 0:
            return data.get("bill") or data.get("invoice")
        else:
            raise Exception(f"Zoho {category} Creation Failed: {data.get('message')}")



async def upload_attachment_to_bill(bill_id: str, file_path: str):
    token = await get_access_token()
    url = f"https://www.zohoapis.com/books/v3/bills/{bill_id}/attachment?organization_id={settings.ZOHO_ORG_ID}"
    headers = {"Authorization": f"Zoho-oauthtoken {token}"}
    
    if not file_path: return

    try:
        # Assuming file_path is relative to the 'uploads' directory
        full_path = os.path.join("uploads", os.path.basename(file_path))
        with open(full_path, 'rb') as f:
            files = {'attachment': (os.path.basename(file_path), f)}
            async with httpx.AsyncClient() as client:
                await client.post(url, headers=headers, files=files)
                print(f"📎 Attached file to Bill {bill_id}")
    except Exception as e:
        print(f"⚠️ Failed to attach file: {e}")
        
async def fetch_chart_of_accounts() -> List[Dict[str, Any]]:
    token = await get_access_token()
    if not token: return []

    base_url = "https://www.zohoapis.com/books/v3/chartofaccounts"
    headers = {"Authorization": f"Zoho-oauthtoken {token}"}
    
    # Fetching more types to accommodate Sales accounts
    target_types = ["Income", "Expense", "Other Expense", "Cost of Goods Sold", "Fixed Asset"]
    all_accounts = []
    
    async with httpx.AsyncClient() as client:
        params = {"organization_id": settings.ZOHO_ORG_ID, "per_page": 200, "filter_by": "Status.Active"}
        page = 1
        has_more = True
        
        while has_more:
            params["page"] = page
            try:
                resp = await client.get(base_url, headers=headers, params=params)
                data = resp.json()
                if data.get("code") != 0:
                    print(f"❌ Zoho CoA Error: {data.get('message')}")
                    break
                
                accounts = data.get("chartofaccounts", [])
                for acc in accounts:
                    if acc.get("account_type_formatted") in target_types:
                        all_accounts.append(acc)
                
                page_context = data.get("page_context", {})
                has_more = page_context.get("has_more_page", False)
                page += 1
            except Exception as e:
                print(f"❌ Network Error fetching CoA: {e}")
                break
    
    print(f"✅ Fetched {len(all_accounts)} relevant accounts from Zoho.")
    return all_accounts
