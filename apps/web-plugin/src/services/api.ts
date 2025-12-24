// File: apps/web-plugin/src/services/api.ts
import axios from "axios";

// --- CONFIGURATION ---
// This should be the address of your local FastAPI backend.
const API_BASE = "http://localhost:8000";

// --- TYPES ---
// We define the types here since we don't have the shared package.
// These should match the schemas in your backend.
export interface Invoice {
  id: string;
  vendor: string;
  date: string;
  amount: number;
  currency: string;
  status: "review" | "approved" | "synced";
  category: "bill" | "invoice" | "bank_statement";
  imageUrl: string;
  compliance: any;
  line_items?: any[];
  bankStatementData?: any;
  invoiceNumber?: string;
}

export interface ExtractedData extends Invoice {
  // It can have more fields from the AI
}

// --- API SERVICE MAPPED TO YOUR BACKEND ---
export const api = {
  // Your backend doesn't have an endpoint to GET all documents yet.
  // So, we use DUMMY DATA here to make the UI work.
  getInvoices: async (): Promise<Invoice[]> => {
    console.warn(
      "Using dummy data for getInvoices. Create a GET endpoint in your backend to see real data."
    );
    return [
      {
        id: "doc1",
        vendor: "Starbucks",
        date: "2025-12-25",
        amount: 15.75,
        currency: "AED",
        status: "review",
        category: "bill",
        imageUrl: `/images/dummy.jpg`,
        compliance: { checklist: {} },
      },
      {
        id: "doc2",
        vendor: "Amazon Web Services",
        date: "2025-12-24",
        amount: 150.0,
        currency: "USD",
        status: "approved",
        category: "bill",
        imageUrl: `/images/dummy.jpg`,
        compliance: { checklist: {} },
      },
      {
        id: "doc3",
        vendor: "Client Project Alpha",
        date: "2025-12-22",
        amount: 5000.0,
        currency: "AED",
        status: "invoice",
        imageUrl: `/images/dummy.jpg`,
        compliance: { checklist: {} },
      },
    ];
  },

  // This maps directly to your backend's upload endpoint.
  uploadReceipt: async (
    file: File,
    category: string
  ): Promise<ExtractedData> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    const response = await axios.post(
      `${API_BASE}/api/v1/documents/upload`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  },

  // This maps directly to your backend's accounts endpoint for dropdowns.
  getChartOfAccounts: async (): Promise<
    { account_id: string; account_name: string }[]
  > => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/v1/accounting/accounts`
      );
      return response.data;
    } catch (err) {
      console.error("Failed to fetch accounts from backend", err);
      return [];
    }
  },

  // This maps to your backend's bill approval endpoint.
  approveInvoice: async (payload: any) => {
    const response = await axios.post(
      `${API_BASE}/api/v1/accounting/approve`,
      payload
    );
    return response.data;
  },

  // Your backend does not have a GET /customers endpoint.
  // We provide DUMMY DATA so the UI doesn't crash.
  getCustomers: async (): Promise<
    { contact_id: string; contact_name: string }[]
  > => {
    console.warn("Using dummy data for getCustomers.");
    return [
      { contact_id: "cust_1", contact_name: "Global Tech Inc." },
      { contact_id: "cust_2", contact_name: "Innovate Solutions" },
    ];
  },
};
