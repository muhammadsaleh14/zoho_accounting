// File: apps/web-plugin/src/types/index.ts

// 1. Vendor Structure
export interface Vendor {
  name: string;
  trn?: string | null;
  address?: string | null;
  phone?: string | null;
  is_new: boolean;
  existing_id?: number | null;
  zoho_contact_id?: string | null;
}

// 2. Line Item (Supporting both camelCase and snake_case for safety)
export interface LineItem {
  id?: number;
  description: string;
  quantity: number;
  rate: number;

  // Backend might return either, so we type both
  accountId?: string | null;
  zoho_account_id?: string | null;

  customerId?: string | null;
}

// 3. Compliance Data
export interface ComplianceDetails {
  taxInvoiceLabel?: boolean;
  vatAmountShown?: boolean;
  [key: string]: boolean | undefined;
}

export interface ComplianceData {
  isCompliant: boolean;
  missingFields: string[];
  details: ComplianceDetails;
}

// 4. Main Invoice Object (The Data Contract)
export interface Invoice {
  id: string; // ID is usually string in frontend URL params

  // Status & Meta
  status: "review" | "approved" | "rejected" | "synced" | "queue";
  category: "bill" | "invoice" | "bank_statement";
  image_url: string;
  created_at?: string;

  // Vendor Info (Handle mapping variations)
  vendor?: Vendor; // Vendor Object
  vendor_id?: number | null;
  vendor_name_raw?: string; // Raw string from OCR
  vendorNameRaw?: string; // CamelCase alternative

  // Dates
  date: string; // YYYY-MM-DD
  due_date?: string; // snake_case from DB
  dueDate?: string; // camelCase alternative

  // Header Fields
  invoice_number?: string;
  invoiceNumber?: string;

  reference_number?: string; // Order Number
  referenceNumber?: string;

  // Financials
  amount: number;
  total_amount?: number;
  tax_amount: number;
  currency: string;

  discount?: number;
  adjustment?: number;

  // Details
  line_items?: LineItem[]; // Backend usually sends snake_case
  lineItems?: LineItem[]; // Frontend components might expect camelCase

  // Compliance
  compliance_data?: ComplianceData;
  compliance?: { checklist: ComplianceData }; // Legacy structure support

  // Bank Specific
  bankStatementData?: any;
}

// 5. Chart of Accounts (Dropdown)
export interface Account {
  account_id: string;
  account_name: string;
  account_code: string;
  type: string;
}

// 6. Customer (Dropdown)
export interface Customer {
  contact_id: string;
  contact_name: string;
}
