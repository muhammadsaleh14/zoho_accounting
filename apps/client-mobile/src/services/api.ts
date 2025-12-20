import axios from "axios";
import type { Invoice } from "@receipt-app/shared";

const API_BASE = "http://localhost:8000";

export const api = {
  getInvoices: async (): Promise<Invoice[]> => {
    const response = await axios.get(`${API_BASE}/invoices`);
    return response.data;
  },
  uploadReceipt: async (file: File): Promise<Invoice> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axios.post(`${API_BASE}/upload`, formData);
    return response.data;
  },
};
