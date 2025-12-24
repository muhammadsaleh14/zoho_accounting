import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import axios from "axios";
import type { ExtractedData, Account, LineItem } from "../types";
import { API_BASE_URL } from "../config";

interface AppContextType {
  isLoading: boolean;
  accounts: Account[];
  extractedData: ExtractedData | null;
  setExtractedData: React.Dispatch<React.SetStateAction<ExtractedData | null>>;
  handleFileUpload: (file: File, category: string) => Promise<void>;
  handleApproveBill: () => Promise<void>;
  updateLineItem: (index: number, updatedLine: Partial<LineItem>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(
    null
  );

  // --- DATA FETCHING ---
  const fetchAccounts = async () => {
    try {
      console.log("Fetching accounts...");
      const response = await axios.get<Account[]>(
        `${API_BASE_URL}/accounting/accounts`
      );
      setAccounts(response.data);
      console.log(`Fetched ${response.data.length} accounts.`);
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
      alert("Error: Could not fetch accounting codes from the server.");
    }
  };

  // Fetch accounts when the app loads
  useEffect(() => {
    fetchAccounts();
  }, []);

  // --- CORE ACTIONS ---
  const handleFileUpload = async (file: File, category: string) => {
    setIsLoading(true);
    setExtractedData(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    try {
      const response = await axios.post<ExtractedData>(
        `${API_BASE_URL}/documents/upload`,
        formData
      );
      // Set the due date to be the same as the invoice date by default
      const dataWithDefaults = {
        ...response.data,
        due_date: response.data.date,
        subject: `Bill #${response.data.invoice_number || ""}`,
        adjustment: 0,
        temp_file_path: response.data.image_url, // Store image URL for attachment
      };
      setExtractedData(dataWithDefaults);
    } catch (error) {
      console.error("Upload and extraction failed:", error);
      alert("An error occurred during file processing.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveBill = async () => {
    if (!extractedData || !extractedData.vendor) {
      alert("Cannot approve: Missing data.");
      return;
    }
    setIsLoading(true);

    // Construct the payload according to the new `BillApproveRequest` schema
    const payload = {
      vendor_name: extractedData.vendor.name,
      zoho_vendor_id: extractedData.vendor.zoho_contact_id,
      vendor_trn: extractedData.vendor.trn,
      vendor_address: extractedData.vendor.address,
      bill_number: extractedData.invoice_number,
      date: extractedData.date,
      due_date: extractedData.due_date,
      // NEW MAPPINGS
      order_number: extractedData.reference_number || "",
      subject: extractedData.subject || "",
      adjustment: extractedData.adjustment || 0.0,
      discount: extractedData.discount || 0.0,
      // ---
      line_items: extractedData.line_items.map((line) => ({
        ...line,
        account_id: line.accountId, // Ensure accountId is mapped correctly
      })),
      temp_file_path: extractedData.temp_file_path,
    };

    try {
      await axios.post(`${API_BASE_URL}/accounting/approve`, payload);
      alert("Bill approved and sent to Zoho successfully!");
      setExtractedData(null); // Reset UI
    } catch (error: any) {
      console.error("Failed to approve bill:", error);
      const errorMsg =
        error.response?.data?.detail || "An unknown error occurred.";
      alert(`Approval Failed: ${JSON.stringify(errorMsg)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- STATE UPDATERS ---
  const updateLineItem = (index: number, updatedLine: Partial<LineItem>) => {
    if (!extractedData) return;
    const newLines = [...extractedData.line_items];
    newLines[index] = { ...newLines[index], ...updatedLine };
    setExtractedData({ ...extractedData, line_items: newLines });
  };

  return (
    <AppContext.Provider
      value={{
        isLoading,
        accounts,
        extractedData,
        setExtractedData,
        handleFileUpload,
        handleApproveBill,
        updateLineItem,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
