// --- File: apps/web-plugin/src/services/api.ts ---

import axios from "axios";
import type { Invoice, LedgerAccount } from "@receipt-app/shared";

export const API_BASE_URL = "https://polemoniaceous-disclamatory-brett.ngrok-free.dev/api/v1";


const axiosConfig = {
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
};

export const api = {
  getInvoices: async (): Promise<Invoice[]> => {
    const response = await axios.get(
      `${API_BASE_URL}/documents/invoices`,
      axiosConfig
    );
    return response.data;
  },

  getInvoiceById: async (id: string): Promise<Invoice> => {
    const response = await axios.get(
      `${API_BASE_URL}/documents/invoices/${id}`,
      axiosConfig
    );
    return response.data;
  },

  uploadReceipt: async (
    file: File,
    category: string = "bill"
  ): Promise<Invoice> => {
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
      `${API_BASE_URL}/documents/upload`,
      formData,
      uploadConfig
    );
    return response.data;
  },

  getCustomers: async (): Promise<any[]> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/accounting/customers`,
        axiosConfig
      );
      return response.data;
    } catch (err) {
      console.error("Failed to fetch customers", err);
      return [];
    }
  },

  // --- NEW: Get Vendors ---
  getVendors: async (): Promise<any[]> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/accounting/vendors`,
        axiosConfig
      );
      return response.data;
    } catch (err) {
      console.error("Failed to fetch vendors", err);
      return [];
    }
  },

  getNotifications: async (): Promise<any[]> => {
    const response = await axios.get(
      `${API_BASE_URL}/documents/notifications`,
      axiosConfig
    );
    return response.data;
  },

  getChartOfAccounts: async (): Promise<LedgerAccount[]> => {
    const response = await axios.get(
      `${API_BASE_URL}/accounting/accounts`,
      axiosConfig
    );
    return response.data;
  },

  approveInvoice: async (data: any) => {
    const response = await axios.post(
      `${API_BASE_URL}/accounting/approve`,
      data,
      axiosConfig
    );
    return response.data;
  },
};
