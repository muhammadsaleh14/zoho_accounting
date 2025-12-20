import type { ComplianceChecklist as ChecklistType } from "@receipt-app/shared";

// 1. Define helper component OUTSIDE the main component
const ChecklistItem = ({ label, pass }: { label: string; pass: boolean }) => (
  <div className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
    <span className="text-xs text-gray-600">{label}</span>
    <span>{pass ? "✅" : "❌"}</span>
  </div>
);

export function ComplianceChecklist({ data }: { data: ChecklistType }) {
  // Guard clause: if data is missing/undefined, don't crash
  if (!data) return null;

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 border-b border-gray-300 pb-1">
        VAT Requirements
      </h4>

      <div className="grid grid-cols-1 gap-y-1">
        <ChecklistItem label="Tax Invoice Label" pass={data.taxInvoiceLabel} />
        <ChecklistItem label="Supplier Name" pass={data.supplierName} />
        <ChecklistItem label="Supplier TRN" pass={data.supplierTRN} />
        <ChecklistItem label="Supplier Address" pass={data.supplierAddress} />

        <ChecklistItem label="Customer Name" pass={data.customerName} />
        <ChecklistItem label="Customer TRN" pass={data.customerTRN} />

        <ChecklistItem
          label="Invoice No & Date"
          pass={data.invoiceNumber && data.invoiceDate}
        />
        <ChecklistItem
          label="Line Items Details"
          pass={data.lineItemsDetailed}
        />

        <ChecklistItem label="VAT Rate (5%)" pass={data.vatRateShown} />
        <ChecklistItem label="VAT Amount (AED)" pass={data.vatAmountShown} />
        <ChecklistItem label="Math Check" pass={data.totalAmountMatch} />
      </div>
    </div>
  );
}
