// apps/web-plugin/src/components/ComplianceChecklist.tsx
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

const ComplianceChecklist = ({ data }: { data: any }) => {
  if (!data?.details) return null;

  // Added "invoiceNumberPresent" to this list
  const checks = [
    { key: "taxInvoiceLabel", label: "Label" },
    { key: "supplierTRN", label: "TRN" },
    { key: "invoiceNumberPresent", label: "Inv #" }, // <-- NEW BADGE
    { key: "vatAmountShown", label: "VAT Breakdown" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {checks.map((c) => {
        const passed = data.details[c.key];
        return (
          <div
            key={c.key}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold border transition-all ${
              passed
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
            }`}
          >
            {passed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {c.label}
          </div>
        );
      })}
    </div>
  );
};