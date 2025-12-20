import { useState } from "react"; // Removed useEffect
import type { Invoice } from "@receipt-app/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { ComplianceChecklist } from "./ComplianceChecklist";

interface Props {
  invoice: Invoice;
}

export function ComplianceWorkspace({ invoice }: Props) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Local State: Initializes ONCE when the component mounts.
  // Because we will use a 'key' in the parent, this component remounts
  // whenever the invoice ID changes, so this data is always fresh.
  const [formData, setFormData] = useState({
    vendor: invoice.vendor,
    date: invoice.date,
    amount: invoice.amount,
    invoiceNumber: invoice.invoiceNumber || "",
    accountId: "",
  });

  // Fetch Accounts
  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: api.getChartOfAccounts,
    //Todo : remove below
    staleTime: 0,
    gcTime: 0,
  });

  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: api.approveInvoice,
    onSuccess: (data) => {
      if (data.status === "success") {
        alert(
          `✅ Success! Bill created in Zoho.\nBill ID: ${data.details?.bill?.bill_id || "N/A"}`
        );
        // Refresh the list to update status
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
      } else {
        alert(`❌ Zoho Error: ${data.message}`);
      }
    },
    onError: (error) => {
      alert("Failed to connect to backend.");
      console.error(error);
    },
  });

  const handleApprove = () => {
    // 1. Validation check before sending
    if (!formData.invoiceNumber || !formData.accountId) {
      alert("Please enter an Invoice Number and select an Expense Account.");
      return;
    }

    // 2. Send Data
    approveMutation.mutate({
      id: invoice.id,
      vendor: formData.vendor,
      date: formData.date,
      amount: formData.amount,
      invoiceNumber: formData.invoiceNumber,
      accountId: formData.accountId,
    });
  };

  return (
    <div className="flex h-full w-full gap-4 relative">
      {/* LEFT: Image Viewer */}
      <div className="flex-1 bg-gray-900 rounded-lg shadow-inner flex flex-col relative overflow-hidden border border-gray-700 group">
        <div
          className={`absolute top-0 left-0 w-full p-3 text-white text-xs font-bold flex justify-between z-10 ${
            invoice.compliance.isCompliant ? "bg-green-600" : "bg-red-600"
          }`}
        >
          <span>SOURCE IMAGE</span>
          <span>
            {invoice.compliance.isCompliant
              ? "✅ COMPLIANT"
              : "❌ ISSUES DETECTED"}
          </span>
        </div>
        <div
          className="flex-1 flex items-center justify-center p-8 cursor-pointer"
          onClick={() => setIsFullscreen(true)}
        >
          <img
            src={invoice.imageUrl}
            alt="Receipt"
            className="max-w-full max-h-full object-contain shadow-2xl transition-transform duration-200 group-hover:scale-105"
          />
        </div>
        {/* Hover Button */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none">
          <button
            className="absolute bottom-4 right-4 bg-white/90 text-gray-800 px-4 py-2 rounded-full font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 flex items-center gap-2 pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(true);
            }}
          >
            <span>🔍 Expand</span>
          </button>
        </div>
      </div>

      {/* RIGHT: Data Form */}
      <div className="w-96 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-700">Review & Post</h3>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <ComplianceChecklist data={invoice.compliance.checklist} />
          {/* Vendor */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Vendor
            </label>
            <input
              type="text"
              value={formData.vendor}
              onChange={(e) =>
                setFormData({ ...formData, vendor: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded text-sm bg-gray-50"
            />
          </div>

          {/* Bill # */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Bill # (Invoice No)
            </label>
            <input
              type="text"
              value={formData.invoiceNumber}
              onChange={(e) =>
                setFormData({ ...formData, invoiceNumber: e.target.value })
              }
              placeholder="e.g. INV-2023-001"
              className={`w-full p-2 border rounded text-sm ${!formData.invoiceNumber ? "border-yellow-400 bg-yellow-50" : "border-gray-300"}`}
            />
            {!formData.invoiceNumber && (
              <span className="text-xs text-yellow-600">
                ⚠️ Missing. Please enter manually.
              </span>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded text-sm"
            />
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Total Amount
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: parseFloat(e.target.value) })
              }
              className="w-full p-2 border border-gray-300 rounded text-sm font-mono"
            />
          </div>

          {/* Account Dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Expense Account
            </label>
            <select
              value={formData.accountId}
              onChange={(e) =>
                setFormData({ ...formData, accountId: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
            >
              <option value="" disabled>
                -- Select Ledger Account --
              </option>
              {accounts?.map((acc) => (
                <option key={acc.account_id} value={acc.account_id}>
                  {acc.account_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            onClick={handleApprove}
            disabled={
              !formData.invoiceNumber ||
              !formData.accountId ||
              approveMutation.isPending
            }
            className={`flex-1 text-white py-2 px-4 rounded font-semibold text-sm transition-all shadow-sm ${
              approveMutation.isPending
                ? "bg-gray-400 cursor-wait"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {approveMutation.isPending ? "Posting..." : "Approve & Post"}
          </button>
        </div>
      </div>

      {/* FULLSCREEN OVERLAY */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-10 cursor-zoom-out"
          onClick={() => setIsFullscreen(false)}
        >
          <img
            src={invoice.imageUrl}
            alt="Fullscreen Receipt"
            className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-5 right-5 text-white bg-white/20 hover:bg-white/40 rounded-full w-10 h-10 flex items-center justify-center font-bold transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
