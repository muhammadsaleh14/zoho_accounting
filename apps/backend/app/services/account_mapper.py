# --- File: apps/backend/app/services/account_mapper.py ---

from typing import Optional, Dict, Any
import re
from app.core.config import settings
from app.services.zoho import create_zoho_account, fetch_chart_of_accounts
from app.crud import crud_account
from sqlalchemy.orm import Session

class AccountMapper:
    """
    Enhanced account mapping service with Zoho integration.
    Automatically creates accounts in Zoho if they don't exist.
    """
    
    # --- ACCOUNT MAPPING RULES ---
    EXPENSE_ACCOUNT_MAPPING = {
        # Software & Technology
        "software": "Software Subscriptions",
        "saas": "Software Subscriptions", 
        "subscription": "Software Subscriptions",
        "cloud": "Software Subscriptions",
        "aws": "Cloud Services",
        "azure": "Cloud Services",
        "google cloud": "Cloud Services",
        
        # Professional Services
        "consulting": "Professional Fees",
        "legal": "Legal Fees",
        "accounting": "Professional Fees",
        "audit": "Professional Fees",
        "advisor": "Professional Fees",
        
        # Office & Utilities
        "rent": "Office Rent",
        "lease": "Office Rent",
        "utilities": "Utilities",
        "electricity": "Utilities",
        "water": "Utilities",
        "internet": "Internet Services",
        "phone": "Telephone Expenses",
        
        # Marketing & Advertising
        "marketing": "Marketing Expenses",
        "advertising": "Advertising",
        "social media": "Marketing Expenses",
        "google ads": "Advertising",
        "facebook": "Advertising",
        
        # Travel & Entertainment
        "travel": "Travel Expenses",
        "hotel": "Travel Expenses",
        "flight": "Travel Expenses",
        "meal": "Meals & Entertainment",
        "restaurant": "Meals & Entertainment",
        "consulting": "Consulting Services",
        "software development": "Software Development", 
        "design": "Design Services",
        "support": "Technical Support",
        "maintenance": "Maintenance Services",
        "software": "Software Sales",
        "license": "License Revenue",
        "subscription": "Subscription Revenue",
        "service": "Service Revenue",
        "professional services": "Professional Fees",
        
        # Expense Accounts (fallback for bills)
        "subscriptions": "Software Subscriptions",
        "professional fees": "Professional Fees", 
        "rent": "Office Rent",
        "utilities": "Utilities",
        "marketing": "Marketing Expenses",
        "travel": "Travel Expenses",
        "office supplies": "Office Supplies",
        "bank charges": "Bank Charges",
        "insurance": "Insurance Expense",
        "miscellaneous": "Miscellaneous Expenses"
    }
    
    # --- REVERSE CHARGE KEYWORDS ---
    REVERSE_CHARGE_KEYWORDS = [
        "international", "foreign", "overseas", "abroad",
        "usa", "europe", "asia", "uk", "us",
        "cross border", "import", "export",
        "global", "worldwide"
    ]
    
    # --- VAT RATE MAPPING ---
    VAT_RATES = {
        "standard": 0.05,  # 5% Standard VAT
        "zero": 0.0,      # 0% Zero-rated
        "exempt": 0.0,     # 0% Exempt
        "reverse": 0.0     # 0% Reverse charge
    }
    
    @classmethod
    def map_account(cls, description: str, vendor_name: str, transaction_type: str = 'expense') -> str:
        """
        Map description and vendor to appropriate account
        
        Args:
            description: Line item description
            vendor_name: Vendor/customer name
            transaction_type: 'expense' or 'income'
        
        Returns:
            Mapped account name
        """
        if not description and not vendor_name:
            return cls.EXPENSE_ACCOUNT_MAPPING['default'] if transaction_type == 'expense' else cls.INCOME_ACCOUNT_MAPPING['default']
        
        # Combine description and vendor for better matching
        search_text = f"{description} {vendor_name}".lower()
        
        # Choose appropriate mapping
        mapping = cls.EXPENSE_ACCOUNT_MAPPING if transaction_type == 'expense' else cls.INCOME_ACCOUNT_MAPPING
        
        # Try to find matches based on keywords
        for keyword, account in mapping.items():
            if keyword != 'default' and keyword in search_text:
                return account
        
        # Try regex patterns for specific cases
        if transaction_type == 'expense':
            # Check for UAE-specific vendors
            uae_patterns = {
                r'\b(etisalat|du)\b': 'Utilities',
                r'\b(emaar|nakheel|damac)\b': 'Rent & Maintenance',
                r'\b(carrefour|lulu|waitrose)\b': 'Office Supplies',
                r'\b(adnoc|enoc|epco)\b': 'Travel Expenses',
            }
            
            for pattern, account in uae_patterns.items():
                if re.search(pattern, search_text, re.IGNORECASE):
                    return account
        
        return mapping['default']
    
    @classmethod
    async def ensure_account_exists(
        cls, 
        account_name: str, 
        account_type: str,
        db: Session
    ) -> Optional[str]:
        """
        Ensure account exists in both local DB and Zoho.
        Returns Zoho account ID.
        """
        # Check local DB first
        local_account = crud_account.get_account_by_name_match(db, account_name)
        if local_account:
            return local_account.zoho_id
        
        # Check if Zoho is configured
        if not cls.is_zoho_configured():
            print(f"⚠️ Zoho not configured, using local account only: {account_name}")
            # Create local account without Zoho ID
            new_account = crud_account.create_account(
                db=db,
                name=account_name,
                account_type=account_type,
                code="AUTO",  # Auto-generated code
                zoho_id=None
            )
            return new_account.zoho_id
        
        # Try to find account in Zoho
        try:
            zoho_accounts = await fetch_chart_of_accounts()  # Use correct function
            zoho_account = next(
                (acc for acc in zoho_accounts if acc.get("account_name", "").lower() == account_name.lower()),
                None
            )
            
            if zoho_account:
                # Create local reference to Zoho account
                new_account = crud_account.create_account(
                    db=db,
                    name=account_name,
                    account_type=account_type,
                    code=zoho_account.get("account_code", "AUTO"),
                    zoho_id=zoho_account["account_id"]
                )
                return zoho_account["account_id"]
            else:
                # Create new account in Zoho
                print(f"🔧 Creating new Zoho account: {account_name}")
                new_zoho_account = await create_zoho_account(
                    account_name=account_name,
                    account_type=account_type
                )
                
                # Create local reference
                new_account = crud_account.create_account(
                    db=db,
                    name=account_name,
                    account_type=account_type,
                    code="AUTO",
                    zoho_id=new_zoho_account["account_id"]
                )
                return new_zoho_account["account_id"]
                
        except Exception as e:
            print(f"❌ Error ensuring account exists: {e}")
            # Fallback: create local account only
            new_account = crud_account.create_account(
                db=db,
                name=account_name,
                account_type=account_type,
                code="AUTO",
                zoho_id=None
            )
            return new_account.zoho_id
    
    @classmethod
    def is_zoho_configured(cls) -> bool:
        """Check if Zoho credentials are properly configured"""
        return bool(
            settings.ZOHO_CLIENT_ID and
            settings.ZOHO_CLIENT_SECRET and
            settings.ZOHO_REFRESH_TOKEN and
            settings.ZOHO_ORG_ID
        )
    
    @classmethod
    def detect_reverse_charge(cls, description: str, vendor_name: str, vendor_country: Optional[str] = None) -> bool:
        """
        Detect if reverse charge mechanism applies
        
        Args:
            description: Service description
            vendor_name: Vendor name
            vendor_country: Vendor's country (if available)
        
        Returns:
            True if reverse charge applies
        """
        # GCC countries for reverse charge detection
        gcc_countries = ['uae', 'saudi arabia', 'qatar', 'kuwait', 'bahrain', 'oman']
        
        # Keywords indicating services from outside GCC
        outside_gcc_keywords = [
            'international', 'foreign', 'overseas', 'global', 'worldwide',
            'europe', 'usa', 'uk', 'america', 'asia'
        ]
        
        search_text = f"{description} {vendor_name}".lower()
        
        # Check if vendor is from outside GCC
        if vendor_country and vendor_country.lower() not in gcc_countries:
            return True
        
        # Check for international service keywords
        for keyword in outside_gcc_keywords:
            if keyword in search_text:
                return True
        
        # Check for specific international service providers
        international_providers = [
            'aws', 'microsoft azure', 'google cloud', 'adobe creative cloud',
            'salesforce', 'zoom', 'slack', 'microsoft 365'
        ]
        
        for provider in international_providers:
            if provider in search_text:
                return True
        
        return False
    
    @classmethod
    def get_vat_rate(cls, description: str, vendor_name: str, is_reverse_charge: bool = False) -> float:
        """
        Determine VAT rate based on transaction details
        
        Args:
            description: Service description
            vendor_name: Vendor name
            is_reverse_charge: Whether reverse charge applies
        
        Returns:
            VAT rate (0.0, 0.05, or 0.0 for reverse charge)
        """
        if is_reverse_charge:
            return 0.0  # Reverse charge - no VAT collected
        
        # Exempt items
        exempt_keywords = [
            'residential rent', 'educational', 'healthcare', 'medical',
            'public transport', 'financial services'
        ]
        
        search_text = f"{description} {vendor_name}".lower()
        
        for keyword in exempt_keywords:
            if keyword in search_text:
                return 0.0
        
        # Zero-rated items (exports, international services)
        zero_rated_keywords = [
            'export', 'international delivery', 'freight', 'shipping'
        ]
        
        for keyword in zero_rated_keywords:
            if keyword in search_text:
                return 0.0
        
        # Default UAE VAT rate
        return 0.05
