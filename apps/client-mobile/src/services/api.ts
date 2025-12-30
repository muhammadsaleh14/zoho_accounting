// --- File: apps/client-mobile/src/services/api.ts ---

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
      console.error(
        "API Error: Could not connect to the backend.",
        error
      );
      // FIXED: Return an empty array on error instead of faulty mock data.
      return [];
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
        console.error("Upload failed:", error);
        // FIXED: Throw an error to let the UI handle it, rather than returning bad mock data.
        throw new Error("File upload failed. Please ensure the backend server is running.");
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
