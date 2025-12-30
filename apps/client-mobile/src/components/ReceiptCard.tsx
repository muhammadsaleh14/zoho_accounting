import type { Invoice } from "@receipt-app/shared";
import { Calendar, FileText, MoreHorizontal } from "lucide-react";

interface Props {
  invoice: Invoice;
  onClick?: (invoice: Invoice) => void;
}

export function ReceiptCard({ invoice, onClick }: Props) {
  // Logic to determine progress bar width
  const progress =
    invoice.status === "approved" || invoice.status === "synced"
      ? 100
      : invoice.status === "review"
        ? 60
        : invoice.status === "rejected"
          ? 100
          : 30; // queue or other

  const statusColor =
    invoice.status === "approved" || invoice.status === "synced"
      ? "bg-green-500"
      : invoice.status === "rejected"
        ? "bg-red-500"
        : "bg-amber-500";

  const displayId =
    String(invoice.id || "")
      .slice(-4)
      .toUpperCase() || "---";

  return (
    <div
      onClick={() => onClick && onClick(invoice)}
      className="bg-white dark:bg-slate-800 p-4 mx-6 mb-3 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex gap-4 active:scale-[0.98] transition-all cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 relative overflow-hidden">
        {invoice.image_url ? (
          <img
            src={invoice.image_url}
            alt=""
            className="w-full h-full object-cover opacity-80"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ) : (
          <FileText size={20} className="text-slate-400" />
        )}
        <div
          className={`absolute top-1 right-1 w-2 h-2 rounded-full ${statusColor} border border-white dark:border-slate-800`}
        ></div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate pr-2">
              {invoice.vendor}
            </h3>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              #{displayId}
            </p>
          </div>
          <p className="text-sm font-black text-slate-900 dark:text-white">
            {invoice.currency} {(invoice.amount || 0).toFixed(2)}
          </p>
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
            <Calendar size={10} />
            <span>{invoice.date || "No Date"}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${statusColor} transition-all duration-500`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <button
              className="text-slate-300"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
