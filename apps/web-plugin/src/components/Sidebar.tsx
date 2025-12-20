import { useState } from "react";
import type { Invoice } from "@receipt-app/shared";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { useRef } from "react";
import {
  LayoutList,
  History,
  UploadCloud,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface Props {
  selectedId: string | null;
  onSelect: (invoice: Invoice) => void;
}

export function Sidebar({ selectedId, onSelect }: Props) {
  const [activeTab, setActiveTab] = useState<"queue" | "history">("queue");
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: invoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: api.getInvoices,
  });

  const uploadMutation = useMutation({
    mutationFn: api.uploadReceipt,
    onSuccess: (newInvoice) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setActiveTab("queue"); // Switch to queue to see new item
      onSelect(newInvoice);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
  };

  const filteredInvoices = invoices?.filter((inv) => {
    if (activeTab === "queue")
      return inv.status === "queue" || inv.status === "review";
    if (activeTab === "history")
      return inv.status === "approved" || inv.status === "rejected";
    return false;
  });

  return (
    <aside className="w-80 bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0">
      {/* Upload Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-3">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*,.pdf"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
          className="w-full py-2.5 px-3 bg-slate-900 text-white rounded-md text-sm font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <UploadCloud size={16} />
          {uploadMutation.isPending ? "Scanning..." : "Upload Receipt"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("queue")}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${
            activeTab === "queue"
              ? "border-blue-500 text-blue-600 bg-blue-50/50"
              : "border-transparent text-slate-500 hover:bg-slate-50"
          }`}
        >
          <LayoutList size={14} /> Queue
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${
            activeTab === "history"
              ? "border-blue-500 text-blue-600 bg-blue-50/50"
              : "border-transparent text-slate-500 hover:bg-slate-50"
          }`}
        >
          <History size={14} /> History
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto bg-white">
        {/* Empty State */}
        {filteredInvoices?.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            <p className="text-sm">No receipts in {activeTab}</p>
          </div>
        )}

        {filteredInvoices?.map((invoice) => (
          <div
            key={invoice.id}
            onClick={() => onSelect(invoice)}
            className={`
              p-4 border-b border-slate-50 cursor-pointer transition-all duration-150 group
              ${selectedId === invoice.id ? "bg-blue-50 border-l-4 border-l-blue-500" : "hover:bg-slate-50 border-l-4 border-l-transparent"}
            `}
          >
            <div className="flex justify-between items-start mb-1">
              <span
                className={`font-semibold text-sm truncate pr-2 ${selectedId === invoice.id ? "text-blue-900" : "text-slate-700"}`}
              >
                {invoice.vendor}
              </span>
              {/* Status Icon */}
              {invoice.status === "review" && (
                <AlertCircle size={14} className="text-red-500" />
              )}
              {invoice.status === "approved" && (
                <CheckCircle2 size={14} className="text-green-500" />
              )}
            </div>

            <div className="flex justify-between text-xs text-slate-500 mt-1.5">
              <span>{invoice.date}</span>
              <span
                className={`font-mono font-medium ${selectedId === invoice.id ? "text-blue-700" : "text-slate-600"}`}
              >
                {invoice.currency} {invoice.amount.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
