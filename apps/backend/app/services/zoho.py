import httpx
from typing import List, Dict, Any
from app.core.config import settings
from services.zoho import get_access_token

# ... (Keep your existing get_access_token and constants) ...

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
            # Zoho Pagination params
            params = {
                "organization_id": settings.ZOHO_ORG_ID,
                "contact_type": contact_type,
                "page": page,
                "per_page": 200 # Max allowed by Zoho
            }
            
            try:
                resp = await client.get(base_url, headers=headers, params=params)
                data = resp.json()
                
                if data.get("code") != 0:
                    print(f"❌ Zoho Error on page {page}: {data.get('message')}")
                    break
                
                contacts = data.get("contacts", [])
                all_contacts.extend(contacts)
                
                # Check pagination info
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
    Creates a new Vendor in Zoho Books.
    """
    token = await get_access_token()
    url = f"https://www.zohoapis.com/books/v3/contacts?organization_id={settings.ZOHO_ORG_ID}"
    headers = {"Authorization": f"Zoho-oauthtoken {token}"}
    
    # Construct Payload
    payload = {
        "contact_name": name,
        "contact_type": "vendor",
        # Zoho specific fields for TRN usually go in "tax_treatment" or custom fields
        # For simplicity, we just set the basic info
        "billing_address": {
            "address": address or ""
        }
    }
    
    # If you have VAT enabled, you might need to set tax_treatment
    # payload["tax_treatment"] = "vat_registered" if trn else "non_vat_registered"

    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload, headers=headers)
        data = resp.json()
        
        if data.get("code") == 0:
            return data["contact"] # Returns the full contact object with 'contact_id'
        else:
            raise Exception(f"Zoho Contact Creation Failed: {data.get('message')}")

async def create_zoho_bill(bill_data: dict) -> dict:
    """
    Creates a Bill (Purchase Invoice) in Zoho Books.
    """
    token = await get_access_token()
    url = f"https://www.zohoapis.com/books/v3/bills?organization_id={settings.ZOHO_ORG_ID}"
    headers = {"Authorization": f"Zoho-oauthtoken {token}"}
    
    # Zoho expects 'line_items' to be snake_case
    async with httpx.AsyncClient() as client:
        
        resp = await client.post(url, json=bill_data, headers=headers)
        data = resp.json()
        
        if data.get("code") == 0:
            return data["bill"] # Returns the created bill object
        else:
            raise Exception(f"Zoho Bill Creation Failed: {data.get('message')}")

async def upload_attachment_to_bill(bill_id: str, file_path: str):
    """
    Attaches the PDF/Image to the created bill.
    """
    token = await get_access_token()
    url = f"https://www.zohoapis.com/books/v3/bills/{bill_id}/attachment?organization_id={settings.ZOHO_ORG_ID}"
    headers = {"Authorization": f"Zoho-oauthtoken {token}"}
    
    if not file_path:
        return

    # Use 'files' parameter for multipart upload
    try:
        with open(file_path, 'rb') as f:
            files = {'attachment': (file_path.split("/")[-1], f)}
            async with httpx.AsyncClient() as client:
                await client.post(url, headers=headers, files=files)
                print(f"📎 Attached file to Bill {bill_id}")
    except Exception as e:
        print(f"⚠️ Failed to attach file: {e}")
        
        # ... existing imports ...

async def fetch_chart_of_accounts() -> List[Dict[str, Any]]:
    """
    Fetches Chart of Accounts from Zoho.
    """
    token = await get_access_token()
    if not token:
        return []

    base_url = "https://www.zohoapis.com/books/v3/chartofaccounts"
    headers = {"Authorization": f"Zoho-oauthtoken {token}"}
    
    # We want generic expenses, COGS, and other expenses.
    # Zoho allows filtering. We can fetch all and filter in Python, 
    # or rely on Zoho's 'AccountType.Expense'. 
    # For a robust dropdown, we'll fetch 'Expense' + 'Other Expense' + 'Cost of Goods Sold'.
    
    target_types = ["Expense", "Other Expense", "Cost of Goods Sold", "Fixed Asset"]
    all_accounts = []
    
    async with httpx.AsyncClient() as client:
        # We might need multiple calls if your CoA is huge, 
        # but usually filtering by type fits in one page or we iterate broadly.
        # Let's fetch all active accounts and filter in Python to be safe.
        params = {
            "organization_id": settings.ZOHO_ORG_ID,
            "per_page": 200,
            "filter_by": "Status.Active" 
        }
        
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
                
                # Filter strictly for what we need
                for acc in accounts:
                    if acc.get("account_type") in target_types:
                        all_accounts.append(acc)
                
                page_context = data.get("page_context", {})
                has_more = page_context.get("has_more_page", False)
                page += 1
                
            except Exception as e:
                print(f"❌ Network Error fetching CoA: {e}")
                break
    
    print(f"✅ Fetched {len(all_accounts)} Expense Accounts from Zoho.")
    return all_accounts