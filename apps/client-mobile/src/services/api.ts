import axios from "axios";
import type { DocumentCategory, Invoice } from "@receipt-app/shared";

// --- CONFIGURATION ---
// Android Emulator: http://10.0.2.2:8000
// Physical Device: http://YOUR_PC_IP:8000
export const SERVER_ROOT = "http://localhost:8000";
export const API_BASE = `${SERVER_ROOT}/api/v1`;

const axiosConfig = {
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
};

// --- ADAPTER: Transform Backend Data to Frontend UI Format ---
const transformInvoice = (data: any): Invoice => {
  // Normalize Line Items
  const rawLines = data.line_items || data.lineItems || [];
  const normalizedLines = rawLines.map((line: any) => ({
    id: line.id,
    description: line.description,
    quantity: line.quantity,
    rate: line.rate,
    accountId: line.zoho_account_id || line.accountId || null,
    account_guess: line.account_guess || null,
  }));

  // Normalize Compliance
  const compliance = data.compliance_data || data.complianceData || null;

  return {
    id: String(data.id),
    category: data.category || "bill",

    // Vendor Logic: Priority -> data.vendor (string) -> data.vendor_name_raw -> "Unknown"
    vendor:
      data.vendor_name_raw ||
      data.vendorNameRaw ||
      (typeof data.vendor === "string" ? data.vendor : data.vendor?.name) ||
      "Unknown Vendor",
    vendor_id: data.vendor_id,

    // Dates
    date: data.date || new Date().toISOString().split("T")[0],
    created_at: data.created_at,
    dueDate: data.due_date || data.dueDate,

    // Numbers
    amount: data.amount || 0,
    taxAmount: data.tax_amount || data.taxAmount || 0,
    currency: data.currency || "AED",
    discount: data.discount || 0,

    // Meta
    invoiceNumber: data.invoice_number || data.invoiceNumber,
    referenceNumber: data.reference_number || data.referenceNumber,
    notes: data.notes || data.subject,
    status: data.status || "review",

    // Image
    image_url: data.image_url
      ? data.image_url.startsWith("http")
        ? data.image_url
        : `${SERVER_ROOT}${data.image_url}`
      : "",

    // Complex Objects
    lineItems: normalizedLines,
    complianceData: compliance,
    zohoBillId: data.zoho_bill_id,
  };
};

export const api = {
  getInvoices: async (): Promise<Invoice[]> => {
    try {
      const response = await axios.get(
        `${API_BASE}/documents/invoices`,
        axiosConfig
      );
      return response.data.map(transformInvoice);
    } catch (error) {
      console.error("API Error (getInvoices):", error);
      return [];
    }
  },

  getInvoiceById: async (id: string): Promise<Invoice | null> => {
    try {
      const response = await axios.get(
        `${API_BASE}/documents/invoices/${id}`,
        axiosConfig
      );
      return transformInvoice(response.data);
    } catch (error) {
      console.error(`API Error (getInvoiceById ${id}):`, error);
      return null;
    }
  },

  uploadReceipt: async (
    file: File,
    category: DocumentCategory
  ): Promise<Invoice> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);

      const uploadConfig = {
        headers: {
          ...axiosConfig.headers,
          "Content-Type": "multipart/form-data",
        },
      };

      const response = await axios.post(
        `${API_BASE}/documents/upload`,
        formData,
        uploadConfig
      );

      return transformInvoice(response.data);
    } catch (error) {
      console.error("Upload failed:", error);
      throw new Error("File upload failed.");
    }
  },

  getNotifications: async (): Promise<any[]> => {
    try {
      const response = await axios.get(
        `${API_BASE}/documents/notifications`,
        axiosConfig
      );
      return response.data;
    } catch (error) {
      return [];
    }
  },

  // Add Approval capability to Mobile
  approveInvoice: async (data: any) => {
    try {
      const response = await axios.post(
        `${API_BASE}/accounting/approve`,
        data,
        axiosConfig
      );
      return response.data;
    } catch (error) {
      console.error("Approval failed:", error);
      throw error;
    }
  },
};
