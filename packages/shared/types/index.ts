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
  // We map 'id' in frontend to a temp ID or use invoice_number if available
  // But for the raw response, we follow the backend structure
  category: DocumentCategory;
  confidence_score: number;
  warning_message?: string | null;

  vendor?: VendorDraft;

  date?: string; // YYYY-MM-DD
  invoice_number?: string;
  reference_number?: string; // PO Number

  currency: string;
  total_amount: number;
  tax_amount: number;
  discount: number;
  adjustment?: number; // Added for frontend state, even if AI doesn't return it yet

  line_items: LineItem[];

  opening_balance?: number;
  closing_balance?: number;

  compliance?: ComplianceChecklist;

  // Frontend specific (for displaying images)
  imageUrl?: string;
  id?: string; // We usually generate a temp ID for React keys
  status?: ReceiptStatus;
}

// 4. Account (For Dropdowns)
export interface LedgerAccount {
  account_id: string; // The Zoho ID
  account_name: string;
  account_code: string;
  type: string;
}
