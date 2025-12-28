import type { Invoice } from "@receipt-app/shared";
import { Calendar, FileText, MoreHorizontal } from "lucide-react";

export function ReceiptCard({ invoice }: { invoice: Invoice }) {
  // Calculate progress based on status
  // 1 = Uploaded, 2 = Reviewed, 3 = Synced
  const progress =
    invoice.status === "approved" || invoice.status === "synced"
      ? 100
      : invoice.status === "review"
        ? 60
        : 30;

  const statusColor =
    invoice.status === "approved" ? "bg-green-500" : "bg-amber-500";

  return (
    <div className="bg-surface-card p-4 mx-6 mb-3 rounded-2xl shadow-sm border border-surface-200 flex gap-4 active:scale-[0.99] transition-transform">
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg bg-surface-100 border border-surface-200 flex items-center justify-center shrink-0 relative overflow-hidden">
        {invoice.image_url ? (
          <img
            src={invoice.image_url}
            alt=""
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <FileText size={20} className="text-surface-300" />
        )}
        {/* Status Indicator Dot */}
        <div
          className={`absolute top-1 right-1 w-2 h-2 rounded-full ${statusColor} border border-white`}
        ></div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-bold text-slate-900 truncate pr-2">
              {invoice.vendor}
            </h3>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              #{invoice.id?.slice(-6).toUpperCase() || "PENDING"}
            </p>
          </div>
          <p className="text-sm font-black text-slate-900">
            {invoice.currency} {invoice.amount.toFixed(2)}
          </p>
        </div>

        {/* Metadata & Progress */}
        <div className="mt-3 flex items-end justify-between">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
            <Calendar size={10} />
            <span>{invoice.date || "No Date"}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* The "Process Bar" */}
            <div className="w-16 h-1.5 bg-surface-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${statusColor} transition-all duration-500`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <button className="text-slate-300">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
