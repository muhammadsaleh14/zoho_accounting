import { useState } from "react";

export function VaultFilters() {
  const [activeType, setActiveType] = useState("All");
  const [activeStatus, setActiveStatus] = useState("All");

  const types = ["All", "Invoices", "Receipts", "Statements"];
  const statuses = ["All", "In Review", "Synced", "Rejected"];

  return (
    <div className="space-y-3 mb-6 px-6">
      {/* Row 1: Document Types */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`
              px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border
              ${
                activeType === type
                  ? "bg-brand-900 text-white border-brand-900 shadow-sm"
                  : "bg-surface-50 text-slate-500 border-surface-200 hover:bg-surface-100"
              }
            `}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Row 2: Statuses */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setActiveStatus(status)}
            className={`
              px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all
              ${
                activeStatus === status
                  ? "bg-slate-200 text-slate-800"
                  : "text-slate-400 hover:bg-slate-100"
              }
            `}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
}
