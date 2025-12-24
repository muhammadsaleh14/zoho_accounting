import axios from "axios";
import type { Invoice, LedgerAccount } from "../types";

// Update to your backend URL
const API_BASE = "http://localhost:8000/api/v1";

export const api = {
  // 1. DOCUMENTS
  uploadReceipt: async (
    file: File,
    category: string = "bill"
  ): Promise<Invoice> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    const response = await axios.post(
      `${API_BASE}/documents/upload`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    // Inject a temporary ID for React keys since the DB hasn't saved it yet
    return {
      ...response.data,
      id: `temp_${Date.now()}`,
      status: "review",
      imageUrl: URL.createObjectURL(file), // Display local blob immediately
    };
  },

  // 2. MASTER DATA (Read from Local DB)
  getChartOfAccounts: async (): Promise<LedgerAccount[]> => {
    const response = await axios.get(`${API_BASE}/accounting/accounts`);
    return response.data;
  },

  getCustomers: async () => {
    // If you haven't built this endpoint yet, return empty or implement similar to accounts
    // For now, let's assume it exists or return mock
    return [];
  },

  // 3. SYNC (Write to Local DB)
  triggerMasterSync: async () => {
    const response = await axios.post(`${API_BASE}/sync/master`);
    return response.data;
  },

  // 4. APPROVE (Write to Zoho + DB)
  approveInvoice: async (data: any) => {
    const response = await axios.post(`${API_BASE}/accounting/approve`, data);
    return response.data;
  },
};
