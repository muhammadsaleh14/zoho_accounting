import axios from "axios";
import type { Invoice, LedgerAccount } from "@receipt-app/shared";

// This remains unchanged
export const API_BASE_URL = "http://localhost:8000/api/v1";

// --- ADDED: Common headers for all requests ---
const axiosConfig = {
    headers: {
        "ngrok-skip-browser-warning": "true",
    },
};

export const api = {
    getInvoices: async (): Promise<Invoice[]> => {
        const response = await axios.get(`${API_BASE_URL}/documents/invoices`, axiosConfig); // <- MODIFIED
        return response.data;
    },

    uploadReceipt: async (file: File, category: string = "bill"): Promise<Invoice> => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", category);

        // Combine headers for multipart form data
        const uploadConfig = {
            headers: {
                ...axiosConfig.headers,
                "Content-Type": "multipart/form-data",
            },
        };

        const response = await axios.post(`${API_BASE_URL}/documents/upload`, formData, uploadConfig); // <- MODIFIED
        return response.data;
    },

    getCustomers: async (): Promise<any[]> => {
        try {
            const response = await axios.get(`${API_BASE_URL}/accounting/customers`, axiosConfig); // <- MODIFIED
            return response.data;
        } catch (err) {
            console.error("Failed to fetch customers", err);
            return [];
        }
    },

    getNotifications: async (): Promise<any[]> => {
        const response = await axios.get(`${API_BASE_URL}/documents/notifications`, axiosConfig); // <- MODIFIED
        return response.data;
    },

    getChartOfAccounts: async (): Promise<LedgerAccount[]> => {
        const response = await axios.get(`${API_BASE_URL}/accounting/accounts`, axiosConfig); // <- MODIFIED
        return response.data;
    },

    approveInvoice: async (data: any) => {
        const response = await axios.post(`${API_BASE_URL}/accounting/approve`, data, axiosConfig); // <- MODIFIED
        return response.data;
    },
};
