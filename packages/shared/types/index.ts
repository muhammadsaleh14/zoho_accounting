// 1. Shared Enums
export type ReceiptStatus =
  | "review"
  | "approved"
  | "rejected"
  | "synced"
  | "queue"; // Added queue
export type DocumentCategory = "bill" | "invoice" | "bank_statement";

// 2. Sub-Objects
export interface VendorDraft {
  name: string;
  trn?: string;
  address?: string;
  is_new: boolean;
  existing_id?: number | null;
  zoho_contact_id?: string | null; // Added
}

export interface LineItem {
  id?: number; // Added optional ID
  description: string;
  quantity: number;
  rate: number;
  accountId?: string | null;
  zoho_account_id?: string | null; // Added alias for backend compatibility
  customerId?: string | null;
  account_guess?: string | null; // Added for AI hints
}

export interface ComplianceChecklist {
  isCompliant: boolean;
  missingFields: string[];
  details: Record<string, boolean>;
}

// 3. Main Data Object
export interface Invoice {
  id: string; // Changed to required string for UI keys
  category: DocumentCategory;

  // Vendor
  vendor: string; // Mobile UI expects a string name here
  vendor_id?: number | null;
  vendorNameRaw?: string;

  // Dates
  date: string;
  dueDate?: string;
  created_at?: string;

  // Header Details
  invoiceNumber?: string;
  invoice_number?: string; // Alias
  referenceNumber?: string;
  reference_number?: string; // Alias
  notes?: string;

  // Financials
  amount: number;
  taxAmount?: number;
  tax_amount?: number; // Alias
  discount?: number;
  adjustment?: number;
  currency: string;

  // Status & Media
  status: ReceiptStatus;
  image_url: string;

  // Complex Data
  lineItems: LineItem[];
  line_items?: LineItem[]; // Alias from backend
  complianceData?: ComplianceChecklist; // Mobile UI Key
  compliance_data?: ComplianceChecklist; // Backend Key
  zohoBillId?: string | null;
  zoho_bill_id?: string | null; // Backend Key
}

// 4. Account (For Dropdowns)
export interface LedgerAccount {
  account_id: string;
  account_name: string;
  account_code: string;
  type: string;
}
