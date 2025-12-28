// 1. Shared Enums
export type ReceiptStatus = "review" | "approved" | "rejected" | "synced";
export type DocumentCategory = "bill" | "invoice" | "bank_statement";

// 2. Sub-Objects
export interface VendorDraft {
  name: string;
  trn?: string;
  address?: string;
  is_new: boolean;
  existing_id?: number | null; // ID from Local Postgres
}

export interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  accountId?: string | null; // Prediction from Backend
  customerId?: string | null; // For Billable Expenses
}

export interface ComplianceChecklist {
  isCompliant: boolean;
  missingFields: string[];
  details: Record<string, boolean>;
}

// 3. The Main Data Object (Matches Pydantic 'ExtractedData')
export interface Invoice {
  id?: string; // Keep this optional for local state
  category: DocumentCategory;
  confidenceScore: number;
  warningMessage?: string | null;

  vendor?: VendorDraft;

  // --- MODIFIED: Ensure all keys are camelCase ---
  vendorId?: number | null;
  vendorNameRaw?: string;
  date?: string;
  dueDate?: string;
  invoiceNumber?: string;
  referenceNumber?: string;
  taxAmount: number;
  totalAmount: number; // Use totalAmount to match AI extractor
  discount: number;
  adjustment?: number;
  currency: string;
  status?: ReceiptStatus;
  image_url?: string; // This is the critical change
  complianceData?: ComplianceChecklist;
  zohoBillId?: string | null;
  createdAt?: string; // Date strings from JSON
  // --- END OF MODIFICATION ---
  
  lineItems: LineItem[];

  // Deprecated fields from old structure, can be removed if not used
  amount?: number; 
  
}

// 4. Account (For Dropdowns)
export interface LedgerAccount {
  account_id: string; // The Zoho ID
  account_name: string;
  account_code: string;
  type: string;
}
