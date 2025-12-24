import axios from "axios";
import type { Invoice } from "@receipt-app/shared";

// 1. Configuration: Localhost Backend
const API_URL = "http://localhost:8000";
// const API_URL = "https://polemoniaceous-disclamatory-brett.ngrok-free.dev";


// 2. TypeScript Definitions for Zoho SDK (UPDATED)

// Helper to get params from the iframe URL
// const getQueryParam = (param: string) => {
//   const urlParams = new URLSearchParams(window.location.search);
//   return urlParams.get(param);
// };

export const api = {
  // Fetch the list (GET /invoices)
  getInvoices: async (): Promise<Invoice[]> => {
    // Note: We use direct Axios for invoices because your backend is Localhost
    // and we enabled CORS in FastAPI.
    const response = await axios.get(`${API_URL}/invoices`, {
      headers: {
        // Option 1: ngrok skip browser warning header
        "ngrok-skip-browser-warning": "true",

        // Option 2 (optional): custom User-Agent (if you want to use this)
        // 'User-Agent': 'MyCustomAgent/1.0',
      },
    });
    console.log("Fetched invoices:", response.data);
    return response.data;
  },

  // Upload a file (POST /upload)
  uploadReceipt: async (file: File, category: string = "invoice"): Promise<Invoice> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "ngrok-skip-browser-warning": "true",
      },
    });

    console.log("Upload response:", response.data);
    return response.data;
  },

  getCustomers: async () => {
    try {
      const response = await axios.get(`${API_URL}/customers`, {
        headers: {
          // Option 1: ngrok skip browser warning header
          "ngrok-skip-browser-warning": "true",

          // Option 2 (optional): custom User-Agent (if you want to use this)
          // 'User-Agent': 'MyCustomAgent/1.0',
        },
      });
      return response.data;
    } catch (err) {
      return []; // Fallback
    }
  },

  approveInvoice: async (data: any) => {
    // Allow 'any' or define complex type
    const response = await axios.post(`${API_URL}/approve`, data, {
      headers: {
        // Option 1: ngrok skip browser warning header
        "ngrok-skip-browser-warning": "true",

        // Option 2 (optional): custom User-Agent (if you want to use this)
        // 'User-Agent': 'MyCustomAgent/1.0',
      },
    });
    return response.data;
  },

  getChartOfAccounts: async (): Promise<
    { account_id: string; account_name: string }[]
  > => {
    try {
      // Calls your FastAPI backend, which handles the Zoho Auth
      const response = await axios.get(`${API_URL}/accounts`, {
        headers: {
          // Option 1: ngrok skip browser warning header
          "ngrok-skip-browser-warning": "true",

          // Option 2 (optional): custom User-Agent (if you want to use this)
          // 'User-Agent': 'MyCustomAgent/1.0',
        },
      });
      return response.data;
    } catch (err) {
      console.error("Failed to fetch accounts via Backend", err);
      // Fail gracefully
      return [];
    }
  },

  // // Get Accounts (Dropdown)
  // getChartOfAccounts: async (): Promise<
  //   { account_id: string; account_name: string }[]
  // > => {
  //   // Logic: If inside Zoho, ask Zoho for real accounts.
  //   // If testing on localhost browser, return fake accounts.
  //   if (isZoho()) {
  //     try {
  //       // Initialize might be needed depending on SDK version, safe to await
  //       await window.ZFAPPS.extension.init();

  //       const response = await window.ZFAPPS.get("chartofaccounts");
  //       // Zoho returns object like { chartofaccounts: [...] }
  //       console.log("Fetched accounts from Zoho:", response.data);
  //       return response.chartofaccounts || [];
  //     } catch (err) {
  //       console.error("Failed to fetch accounts from Zoho", err);
  //       return [];
  //     }
  //   } else {
  //     // LOCAL MOCK DATA (For Demo/Testing outside iframe)
  //     console.log("Using Mock Accounts (Localhost)");
  //     return [
  //       { account_id: "1", account_name: "Cost of Goods Sold" },
  //       { account_id: "2", account_name: "Advertising & Marketing" },
  //       { account_id: "3", account_name: "Meals and Entertainment" },
  //       { account_id: "4", account_name: "Office Supplies" },
  //       { account_id: "5", account_name: "Travel Expense" },
  //     ];
  //   }
  // },
};
