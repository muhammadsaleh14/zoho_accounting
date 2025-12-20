import type { ComplianceChecklist as ChecklistType } from "@receipt-app/shared";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

const ChecklistItem = ({ label, pass }: { label: string; pass: boolean }) => (
  <div
    className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium whitespace-nowrap ${
      pass
        ? "bg-green-50 border-green-200 text-green-700"
        : "bg-red-50 border-red-200 text-red-700"
    }`}
  >
    {pass ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
    <span>{label}</span>
  </div>
);

export function ComplianceChecklist({ data }: { data: ChecklistType }) {
  if (!data) return null;

  // Group critical checks
  const criticalFailures = [
    !data.taxInvoiceLabel && "Tax Invoice Label",
    !data.supplierTRN && "Supplier TRN",
    !data.invoiceDate && "Date",
    !data.totalAmountMatch && "Math Check",
  ].filter(Boolean);

  return (
    <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            Compliance Audit
          </h4>
          {criticalFailures.length > 0 ? (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold flex items-center gap-1">
              <AlertTriangle size={12} /> {criticalFailures.length} Critical
              Errors
            </span>
          ) : (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">
              Passed
            </span>
          )}
        </div>
      </div>

      {/* Horizontal Scrollable List */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <ChecklistItem label="Tax Header" pass={data.taxInvoiceLabel} />
        <ChecklistItem label="Supplier TRN" pass={data.supplierTRN} />
        <ChecklistItem label="Date" pass={data.invoiceDate} />
        <ChecklistItem label="Inv #" pass={data.invoiceNumber} />
        <ChecklistItem label="VAT Rate" pass={data.vatRateShown} />
        <ChecklistItem label="Math" pass={data.totalAmountMatch} />
        {/* Add others as needed, but keep it concise for horizontal view */}
      </div>
    </div>
  );
}
