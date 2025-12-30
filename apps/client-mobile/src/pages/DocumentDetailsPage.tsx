import {
  ArrowLeft,
  Calendar,
  FileText,
  ShieldCheck,
  Hash,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import type { Invoice } from "@receipt-app/shared";

interface Props {
  invoice: Invoice;
  onBack: () => void;
}

export function DocumentDetailsPage({ invoice, onBack }: Props) {
  // Helper for status styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "synced":
        return "bg-green-100 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  const compliance = invoice.complianceData;
  const isCompliant = compliance?.isCompliant;

  return (
    <div className="fixed inset-0 bg-surface-50 z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
      {/* 1. Header (Sticky) */}
      <div className="bg-white/80 backdrop-blur-md border-b border-surface-200 px-4 h-16 flex items-center justify-between shrink-0 z-10 sticky top-0">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-slate-600 hover:bg-surface-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="font-bold text-slate-900">Document Details</span>
        <div className="w-8" /> {/* Spacer */}
      </div>

      {/* 2. Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Image Preview Area */}
        <div className="w-full bg-slate-900 aspect-video flex items-center justify-center relative overflow-hidden group">
          {invoice.image_url ? (
            <img
              src={invoice.image_url}
              alt="Receipt"
              className="h-full w-full object-contain"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div className="text-slate-500 flex flex-col items-center">
              <FileText size={48} />
              <p className="text-xs mt-2">No Preview Available</p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
          <div className="absolute bottom-4 left-4 text-white">
            <p className="text-xs opacity-80">Category</p>
            <p className="text-sm font-medium capitalize">
              {invoice.category.replace("_", " ")}
            </p>
          </div>
        </div>

        <div className="px-6 -mt-6 relative z-10">
          {/* Main Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-surface-200 p-5 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-xl font-black text-slate-900 mb-1">
                  {invoice.vendor}
                </h1>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${getStatusColor(invoice.status)}`}
                  >
                    {invoice.status}
                  </span>
                  <span className="text-xs text-slate-400">#{invoice.id}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                  Total
                </p>
                <p className="text-2xl font-black text-slate-900">
                  {invoice.currency} {invoice.amount?.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                  <Calendar size={12} /> Date
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {invoice.date}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                  <Hash size={12} /> Doc #
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {invoice.invoiceNumber || "---"}
                </p>
              </div>
            </div>

            {/* Compliance Banner */}
            {compliance && (
              <div
                className={`mt-2 rounded-xl p-3 flex items-start gap-3 border ${isCompliant ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}
              >
                {isCompliant ? (
                  <ShieldCheck
                    className="text-emerald-500 shrink-0 mt-0.5"
                    size={18}
                  />
                ) : (
                  <AlertTriangle
                    className="text-red-500 shrink-0 mt-0.5"
                    size={18}
                  />
                )}
                <div>
                  <p
                    className={`text-xs font-bold ${isCompliant ? "text-emerald-700" : "text-red-700"}`}
                  >
                    {isCompliant ? "VAT Compliant" : "Compliance Issues"}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">
                    {isCompliant
                      ? "Passed all AI checks for Tax Invoice validity."
                      : `Missing: ${compliance.missingFields.join(", ")}`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Line Items */}
          <h3 className="text-sm font-bold text-slate-900 mb-3 px-1">
            Line Items ({invoice.lineItems?.length || 0})
          </h3>
          <div className="bg-white rounded-2xl shadow-sm border border-surface-200 overflow-hidden mb-6">
            {!invoice.lineItems || invoice.lineItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No line items extracted.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {invoice.lineItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 flex justify-between items-center"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-slate-100 text-slate-500 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
                        {item.quantity}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 line-clamp-2">
                          {item.description}
                        </p>
                        {item.accountId ? (
                          <p className="text-[10px] text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded inline-block mt-1">
                            {item.accountId}
                          </p>
                        ) : item.account_guess ? (
                          <p className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-1">
                            AI Guess: {item.account_guess}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                      {(item.rate * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Totals Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Tax (VAT)</span>
                <span>
                  {invoice.currency} {invoice.taxAmount?.toFixed(2) || "0.00"}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total</span>
                <span>
                  {invoice.currency} {invoice.amount?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
