import axios from "axios";
import type { DocumentCategory, Invoice } from "@receipt-app/shared";

// REPLACE THIS WITH YOUR PC'S LOCAL IP (e.g., 192.168.1.5)
// Do NOT use localhost (your phone won't see it)
export const API_BASE = "http://localhost:8000";
// export const API_BASE = "https://polemoniaceous-disclamatory-brett.ngrok-free.dev";


export const api = {
  getInvoices: async (): Promise<Invoice[]> => {
    const response = await axios.get(`${API_BASE}/invoices`, {
      headers: {
        // Option 1: ngrok skip browser warning header
        "ngrok-skip-browser-warning": "true",

        // Option 2 (optional): custom User-Agent (if you want to use this)
        // 'User-Agent': 'MyCustomAgent/1.0',
      },
    });
    return response.data;
  },

  uploadReceipt: async (
    file: File,
    category: DocumentCategory
  ): Promise<Invoice> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category); // <--- Send it

    const response = await axios.post(`${API_BASE}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "ngrok-skip-browser-warning": "true",
      },
    });
    return response.data;
  },

  getNotifications: async (): Promise<any[]> => {
    try {
      const response = await axios.get(`${API_BASE}/notifications`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
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
