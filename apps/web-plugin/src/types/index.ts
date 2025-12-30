// File: apps/web-plugin/src/types/index.ts

export interface Vendor {
  name: string;
  trn?: string | null;
  address?: string | null;
  phone?: string | null;
  is_new: boolean;
  existing_id?: number | null;
  zoho_contact_id?: string | null;
}

export interface LineItem {
  id?: number;
  description: string;
  quantity: number;
  rate: number;
  accountId?: string | null;
  zoho_account_id?: string | null;
  customerId?: string | null;
  // --- NEW ---
  account_guess?: string | null;
}

export interface ComplianceDetails {
  taxInvoiceLabel?: boolean;
  vatAmountShown?: boolean;
  supplierTRN?: boolean;
  invoiceNumberPresent?: boolean;
  [key: string]: boolean | undefined;
}

export interface ComplianceData {
  isCompliant: boolean;
  missingFields: string[];
  details: ComplianceDetails;
}

export interface Invoice {
  id: string;
  status: "review" | "approved" | "rejected" | "synced" | "queue";
  category: "bill" | "invoice" | "bank_statement";
  image_url: string;
  created_at?: string;

  vendor?: Vendor;
  vendor_id?: number | null;
  vendor_name_raw?: string;
  vendorNameRaw?: string;

  date: string;
  due_date?: string;
  dueDate?: string;

  invoice_number?: string;
  invoiceNumber?: string;
  reference_number?: string;
  referenceNumber?: string;

  // Added Notes
  notes?: string;

  amount: number;
  total_amount?: number;
  tax_amount: number;
  currency: string;
  discount?: number;
  adjustment?: number;

  line_items?: LineItem[];
  lineItems?: LineItem[];
  compliance_data?: ComplianceData;
  bankStatementData?: any;
}

export interface Account {
  account_id: string;
  account_name: string;
  account_code: string;
  type: string;
}

export interface Customer {
  contact_id: string;
  contact_name: string;
}
