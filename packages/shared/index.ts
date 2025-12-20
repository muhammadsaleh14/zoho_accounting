// packages/shared/index.ts

export type ReceiptStatus = "queue" | "review" | "approved" | "rejected";

// 1. The Detailed Checklist (UAE VAT Requirements)
export interface ComplianceChecklist {
  taxInvoiceLabel: boolean;
  supplierName: boolean;
  supplierAddress: boolean;
  supplierTRN: boolean;
  customerName: boolean;
  customerAddress: boolean;
  customerTRN: boolean;
  invoiceDate: boolean;
  invoiceNumber: boolean;
  lineItemsDetailed: boolean;
  subtotalExclVAT: boolean;
  vatRateShown: boolean;
  vatAmountShown: boolean;
  totalAmountMatch: boolean;
}

// 2. The Invoice Data Model
export interface Invoice {
  id: string;
  vendor: string;
  date: string;
  amount: number;
  currency: string;
  invoiceNumber: string | null;
  status: ReceiptStatus;
  imageUrl: string;

  compliance: {
    isCompliant: boolean;
    missingFields: string[];
    confidenceScore: number;
    checklist: ComplianceChecklist; // <--- NEW FIELD
  };
}

// 3. Mock Data (Updated with Checklist)
const DEFAULT_CHECKLIST: ComplianceChecklist = {
  taxInvoiceLabel: true,
  supplierName: true,
  supplierAddress: true,
  supplierTRN: true,
  customerName: true,
  customerAddress: true,
  customerTRN: true,
  invoiceDate: true,
  invoiceNumber: true,
  lineItemsDetailed: true,
  subtotalExclVAT: true,
  vatRateShown: true,
  vatAmountShown: true,
  totalAmountMatch: true,
};

export const MOCK_INVOICES: Invoice[] = [
  {
    id: "101",
    vendor: "Starbucks Coffee",
    date: "2025-12-14",
    amount: 5.5,
    currency: "USD",
    invoiceNumber: "INV-SB-99",
    status: "queue",
    imageUrl: "https://via.placeholder.com/300?text=Starbucks",
    compliance: {
      isCompliant: true,
      missingFields: [],
      confidenceScore: 0.98,
      checklist: DEFAULT_CHECKLIST,
    },
  },
  {
    id: "102",
    vendor: "Construction Co.",
    date: "2025-12-12",
    amount: 1500.0,
    currency: "AED",
    invoiceNumber: null,
    status: "review",
    imageUrl: "https://via.placeholder.com/300?text=Bad+Invoice",
    compliance: {
      isCompliant: false,
      missingFields: ["Missing Tax Invoice Header", "Missing Supplier TRN"],
      confidenceScore: 0.4,
      checklist: {
        ...DEFAULT_CHECKLIST,
        taxInvoiceLabel: false, // FAIL
        supplierTRN: false, // FAIL
      },
    },
  },
];
