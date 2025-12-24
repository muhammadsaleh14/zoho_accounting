// Defines the structure for data received from and sent to the backend.

export interface Vendor {
  name: string;
  trn?: string | null;
  address?: string | null;
  phone?: string | null;
  is_new: boolean;
  existing_id?: number | null;
  // --- UI STATE ONLY ---
  zoho_contact_id?: string | null; // For mapping existing vendors
}

export interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  accountId?: string | null; // This is now the Zoho Account ID
}

export interface ExtractedData {
  category: string;
  warning_message?: string | null;
  vendor?: Vendor | null;
  date?: string | null;
  invoice_number?: string | null;
  reference_number?: string | null;
  discount: number;
  currency: string;
  total_amount: number;
  tax_amount: number;
  line_items: LineItem[];

  // --- FIX: Add the missing property from the backend response ---
  image_url?: string;
  // -----------------------------------------------------------

  // --- UI STATE ONLY ---
  due_date?: string | null;
  subject?: string | null;
  adjustment?: number;
  temp_file_path?: string; // Storing the image URL for the final payload
}

export interface Account {
  account_id: string; // The Zoho ID we need to send back
  account_name: string;
  account_code: string;
  type: string;
}
