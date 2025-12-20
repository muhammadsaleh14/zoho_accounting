import type { Invoice } from "@receipt-app/shared";
import { Clock, CheckCircle2, AlertTriangle } from "lucide-react";

export function ReceiptCard({ invoice }: { invoice: Invoice }) {
  const isReview = invoice.status === "review";
  const isApproved = invoice.status === "approved";

  return (
    <div className="bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center gap-4 mb-3 active:scale-[0.98] transition-transform">
      {/* Icon Box */}
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
          isReview
            ? "bg-amber-50 text-amber-600"
            : isApproved
              ? "bg-green-50 text-green-600"
              : "bg-blue-50 text-blue-600"
        }`}
      >
        {isReview && <AlertTriangle size={20} />}
        {isApproved && <CheckCircle2 size={20} />}
        {invoice.status === "queue" && <Clock size={20} />}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 truncate text-[15px]">
          {invoice.vendor}
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
          <span>{invoice.date}</span>
          <span>•</span>
          <span className="capitalize">{invoice.status}</span>
        </div>
      </div>

      {/* Amount */}
      <div className="text-right">
        <span className="block font-bold text-gray-900 text-[15px]">
          {invoice.currency} {invoice.amount.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
