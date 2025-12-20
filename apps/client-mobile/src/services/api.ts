import axios from "axios";
import type { Invoice } from "@receipt-app/shared";

// REPLACE THIS WITH YOUR PC'S LOCAL IP (e.g., 192.168.1.5)
// Do NOT use localhost (your phone won't see it)
const API_BASE = "http://localhost:8000";

export const api = {
  getInvoices: async (): Promise<Invoice[]> => {
    const response = await axios.get(`${API_BASE}/invoices`);
    return response.data;
  },

  uploadReceipt: async (file: File): Promise<Invoice> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axios.post(`${API_BASE}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};
