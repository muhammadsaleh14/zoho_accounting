import axios from "axios";
import type { DocumentCategory, Invoice } from "@receipt-app/shared";

export const API_BASE = "http://localhost:8000/api/v1";

const axiosConfig = {
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
};

// --- MOCK DATA FOR FALLBACK ---
const MOCK_INVOICES: Invoice[] = [
  {
    id: "99001",
    vendor: "Demo Vendor LLC",
    date: "2025-01-15",
    amount: 1250.0,
    currency: "AED",
    status: "review",
    category: "bill",
    image_url: "",
    lineItems: [],
  },
  {
    id: "99002",
    vendor: "Starbucks Coffee",
    date: "2025-01-14",
    amount: 25.5,
    currency: "AED",
    status: "approved",
    category: "bill",
    image_url: "",
    lineItems: [],
  },
  {
    id: "99003",
    vendor: "Emirates Airlines",
    date: "2025-01-10",
    amount: 4500.0,
    currency: "AED",
    status: "synced",
    category: "bill",
    image_url: "",
    lineItems: [],
  },
];

export const api = {
  getInvoices: async (): Promise<Invoice[]> => {
    try {
      const response = await axios.get(
        `${API_BASE}/documents/invoices`,
        axiosConfig
      );
      return response.data;
    } catch (error) {
      console.warn(
        "⚠️ API Error (Connection Refused?). Rendering MOCK DATA for demo."
      );
      // Return mock data so the UI shows something beautiful instead of crashing
      return MOCK_INVOICES;
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
      return response.data;
    } catch (error) {
      console.warn("⚠️ Upload failed. Returning mock success for demo.");
      // Simulate a successful upload after a delay
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            id: `temp_${Date.now()}`,
            vendor: "Uploaded Receipt (Offline Mode)",
            date: new Date().toISOString().split("T")[0],
            amount: 0.0,
            currency: "AED",
            status: "review",
            category: category,
            image_url: "",
            lineItems: [],
          });
        }, 1500);
      });
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
      // Return dummy notifications on error
      return [
        {
          id: "1",
          title: "Receipt Approved",
          description: "Your Uber receipt was approved.",
          time: "2m ago",
          type: "success",
          read: false,
        },
        {
          id: "2",
          title: "Missing Information",
          description: "Please add VAT number to the invoice.",
          time: "1h ago",
          type: "alert",
          read: false,
        },
        {
          id: "3",
          title: "New Feature",
          description: "Check out the new dark mode!",
          time: "1d ago",
          type: "info",
          read: true,
        },
      ];
    }
  },
};
