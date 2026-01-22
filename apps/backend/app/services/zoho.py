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
    
    all_accounts = []
    
    async with httpx.AsyncClient() as client:
        # REMOVED "filter_by=AccountType.Expense" to get Income accounts too
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
                
                # We specifically allow Income types now
                target_types = [
                    "Income", "Other Income", 
                    "Expense", "Other Expense", 
                    "Cost of Goods Sold", "Fixed Asset"
                ]
                
                for acc in accounts:
                    # Zoho returns 'account_type_formatted' like "Cost of Goods Sold"
                    if acc.get("account_type_formatted") in target_types:
                        all_accounts.append(acc)
                
                page_context = data.get("page_context", {})
                has_more = page_context.get("has_more_page", False)
                page += 1
            except Exception as e:
                print(f"❌ Network Error fetching CoA: {e}")
                break
    
    print(f"✅ Fetched {len(all_accounts)} accounts (Income + Expense) from Zoho.")
    return all_accounts
    token = await get_access_token()
    if not token: return []

    base_url = "https://www.zohoapis.com/books/v3/chartofaccounts"
    headers = {"Authorization": f"Zoho-oauthtoken {token}"}
    
    # --- UPDATED: Fetch Income Accounts too ---
    # We remove the "filter_by=AccountType.Expense" if it existed, or ensure we get all relevant types.
    # The safest way is to fetch active accounts and filter in python or fetch everything.
    
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
                    break
                
                accounts = data.get("chartofaccounts", [])
                
                # Filter useful types
                target_types = ["Income", "Other Income", "Expense", "Other Expense", "Cost of Goods Sold", "Fixed Asset"]
                for acc in accounts:
                     # Check account_type_formatted or account_type
                    if acc.get("account_type_formatted") in target_types:
                        all_accounts.append(acc)
                
                page_context = data.get("page_context", {})
                has_more = page_context.get("has_more_page", False)
                page += 1
            except Exception:
                break
    
    return all_accounts


# --- NEW: Create Account Function ---
async def create_zoho_account(account_name: str, account_type: str) -> Dict[str, Any]:
    """
    Create a new account in Zoho Books
    
    Args:
        account_name: Name of the account
        account_type: Type of account (Income, Expense, etc.)
    
    Returns:
        Dict with account_id and details
    """
    token = await get_access_token()
    if not token:
        raise Exception("No access token available")
    
    headers = {"Authorization": f"Zoho-oauthtoken {token}"}
    
    # Map our account types to Zoho account types
    zoho_account_types = {
        "Software Subscriptions": "expense",
        "Professional Fees": "expense", 
        "Office Rent": "expense",
        "Utilities": "expense",
        "Marketing Expenses": "expense",
        "Travel Expenses": "expense",
        "Office Supplies": "expense",
        "Bank Charges": "expense",
        "Insurance Expense": "expense",
        "Miscellaneous Expenses": "expense",
        "Consulting Services": "income",
        "Software Development": "income",
        "Design Services": "income",
        "Technical Support": "income",
        "Maintenance Services": "income",
        "Software Sales": "income",
        "License Revenue": "income",
        "Subscription Revenue": "income",
        "Service Revenue": "income"
    }
    
    zoho_type = zoho_account_types.get(account_name, "expense" if "expense" in account_type.lower() else "income")
    
    payload = {
        "account_name": account_name,
        "account_type": zoho_type,
        "description": f"Auto-created account for {account_name}",
        "status": "active"
    }
    
    url = f"https://books.zoho.com/api/v3/chartofaccounts?organization_id={settings.ZOHO_ORG_ID}"
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, headers=headers, json=payload)
        data = resp.json()
        
        if data.get("code") == 0:
            account = data.get("chartofaccount", {})
            print(f"✅ Created Zoho account: {account_name} (ID: {account.get('account_id')})")
            return account
        else:
            error_msg = data.get("message", "Unknown error")
            raise Exception(f"Failed to create Zoho account: {error_msg}")