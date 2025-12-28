import axios from "axios";
import type { DocumentCategory, Invoice } from "@receipt-app/shared";

export const API_BASE = "http://localhost:8000/api/v1";

// --- ADDED: Common headers for all requests ---
const axiosConfig = {
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
};

export const api = {
  getInvoices: async (): Promise<Invoice[]> => {
    const response = await axios.get(`${API_BASE}/documents/invoices`, axiosConfig); // <- MODIFIED
    return response.data;
  },

  uploadReceipt: async (file: File, category: DocumentCategory): Promise<Invoice> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    const uploadConfig = {
      headers: {
        ...axiosConfig.headers,
        "Content-Type": "multipart/form-data",
      },
    };

    const response = await axios.post(`${API_BASE}/documents/upload`, formData, uploadConfig); // <- MODIFIED
    return response.data;
  },

  getNotifications: async (): Promise<any[]> => {
    try {
      const response = await axios.get(`${API_BASE}/documents/notifications`, axiosConfig); // <- MODIFIED
      return response.data;
    } catch (error) {
      console.warn("Failed to fetch notifications, returning dummy data.");
      return [
        { id: "1", title: "Receipt Approved", description: "Your Uber receipt was approved.", time: "2m ago", type: "success", read: false },
        { id: "2", title: "Missing Information", description: "Please add VAT number to the invoice.", time: "1h ago", type: "alert", read: false },
        { id: "3", title: "New Feature", description: "Check out the new dark mode!", time: "1d ago", type: "info", read: true },
      ];
    }
  },
};
