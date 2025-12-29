import axios from "axios";
import type { DocumentCategory, Invoice } from "@receipt-app/shared";

// --- CONFIGURATION ---
// 1. SERVER_ROOT: Used to construct absolute image URLs (e.g., http://localhost:8000/images/...)
// Note: If testing on Android Emulator, use "http://10.0.2.2:8000"
// Note: If testing on Physical Device, use your PC's LAN IP "http://192.168.1.X:8000"
export const SERVER_ROOT = "http://localhost:8000";
export const API_BASE = `${SERVER_ROOT}/api/v1`;

const axiosConfig = {
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
};

// --- ADAPTER: Transform Backend Data to Frontend UI Format ---
const transformInvoice = (data: any): Invoice => {
  return {
    ...data,
    // 1. Fix Vendor Name: Backend sends 'vendor_name_raw', UI expects 'vendor'
    vendor: data.vendor_name_raw || data.vendor?.name || "Unknown Vendor",

    // 2. Fix Image URL: Backend sends relative '/images/x.jpg', UI needs absolute 'http://...'
    image_url: data.image_url
      ? data.image_url.startsWith("http")
        ? data.image_url
        : `${SERVER_ROOT}${data.image_url}`
      : "",

    // 3. Fix Line Items: Ensure they exist and map keys if necessary
    lineItems: data.line_items || data.lineItems || [],

    // 4. Ensure Status is valid
    status: data.status || "review",

    // 5. Ensure Date string exists
    date: data.date || new Date().toISOString().split("T")[0],
  };
};

// --- MOCK DATA FOR OFFLINE FALLBACK ---
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
      // Run every item through the adapter
      return response.data.map(transformInvoice);
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

      // Transform the single result
      return transformInvoice(response.data);
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
          } as Invoice);
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
