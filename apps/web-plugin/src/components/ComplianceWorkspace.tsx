import { useState, useEffect } from "react";
import type { Invoice } from "@receipt-app/shared";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { ComplianceChecklist } from "./ComplianceChecklist";
import {
  Maximize2,
  Minimize2,
  Pin,
  PinOff,
  Calendar,
  FileText,
  Info,
} from "lucide-react";

interface Props {
  invoice: Invoice;
}

export function ComplianceWorkspace({ invoice }: Props) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSticky, setIsSticky] = useState(true); // Default to sticky for better UX
  const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
    vendor: invoice.vendor,
    billNumber: invoice.invoiceNumber || "", 
    orderNumber: "", 
    billDate: invoice.date,
    dueDate: invoice.date,
    paymentTerms: "Due on Receipt",
    amount: invoice.amount,
    accountId: "",
    notes: "",
  });
  

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: api.getChartOfAccounts,
  });

  const approveMutation = useMutation({
    mutationFn: api.approveInvoice,
    onSuccess: (data) => {
      if (data.status === "success") {
        alert(
          `✅ Bill Created in Zoho! ID: ${data.details?.bill?.bill_id || "Success"}`
        );
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
      } else {
        alert(`❌ Zoho Error: ${data.message}`);
      }
    },
  });

  const handleApprove = () => {
    if (!formData.billNumber || !formData.accountId) {
      alert("Please enter Bill Number and select an Account.");
      return;
    }
    // Convert our form data to the API payload
    approveMutation.mutate({
      id: invoice.id,
      vendor: formData.vendor,
      date: formData.billDate,
      amount: formData.amount,
      invoiceNumber: formData.billNumber,
      accountId: formData.accountId,
    });
  };

  return (
    <div
      className={`h-full w-full flex flex-col relative bg-gray-50 ${isSticky ? "overflow-hidden" : "overflow-auto"}`}
    >
      {/* --- TOP SECTION: IMAGE VIEWER --- */}
      <div
        className={`bg-gray-900 border-b border-gray-700 transition-all duration-300 relative group 
          ${isSticky ? "h-[45vh] flex-shrink-0" : "h-[500px] flex-shrink-0"}`}
      >
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <button
            onClick={() => setIsSticky(!isSticky)}
            className="bg-black/50 text-white p-2 rounded hover:bg-black/80"
            title="Toggle Sticky Header"
          >
            {isSticky ? <PinOff size={16} /> : <Pin size={16} />}
          </button>
          <button
            onClick={() => setIsFullscreen(true)}
            className="bg-black/50 text-white p-2 rounded hover:bg-black/80"
            title="Fullscreen"
          >
            <Maximize2 size={16} />
          </button>
        </div>

        <div className="w-full h-full flex items-center justify-center p-4">
          <img
            src={invoice.imageUrl}
            className="max-w-full max-h-full object-contain shadow-2xl"
          />
        </div>
      </div>

      {/* --- MIDDLE: HORIZONTAL COMPLIANCE --- */}
      <div className="flex-shrink-0 z-10 bg-white">
        <ComplianceChecklist data={invoice.compliance.checklist} />
      </div>

      {/* --- BOTTOM SECTION: ZOHO STYLE FORM --- */}
      <div
        className={`flex-1 bg-white p-8 ${isSticky ? "overflow-y-auto" : ""}`}
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">New Bill</h2>

          {/* SECTION 1: VENDOR */}
          <div className="grid grid-cols-12 gap-6 mb-6">
            <div className="col-span-12 md:col-span-4">
              <label className="zoho-label">
                Vendor Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) =>
                    setFormData({ ...formData, vendor: e.target.value })
                  }
                  className="zoho-input text-blue-600 font-medium"
                />
                {/* Fake Search Icon */}
                <div className="absolute right-2 top-2.5 text-gray-400">
                  <FileText size={14} />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: BILL DETAILS GRID */}
          <div className="grid grid-cols-12 gap-6 mb-8 bg-gray-50 p-6 rounded border border-gray-100">
            <div className="col-span-6 md:col-span-3">
              <label className="zoho-label">
                Bill# <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.billNumber}
                onChange={(e) =>
                  setFormData({ ...formData, billNumber: e.target.value })
                }
                className={`zoho-input ${!formData.billNumber ? "border-yellow-400 bg-yellow-50" : ""}`}
              />
            </div>
            <div className="col-span-6 md:col-span-3">
              <label className="zoho-label">Order Number</label>
              <input
                type="text"
                value={formData.orderNumber}
                onChange={(e) =>
                  setFormData({ ...formData, orderNumber: e.target.value })
                }
                className="zoho-input"
              />
            </div>
            <div className="col-span-6 md:col-span-3">
              <label className="zoho-label">Bill Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.billDate}
                  onChange={(e) =>
                    setFormData({ ...formData, billDate: e.target.value })
                  }
                  className="zoho-input"
                />
              </div>
            </div>
            <div className="col-span-6 md:col-span-3">
              <label className="zoho-label">Due Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  className="zoho-input"
                />
              </div>
            </div>
            <div className="col-span-6 md:col-span-3">
              <label className="zoho-label">Payment Terms</label>
              <select className="zoho-input bg-white">
                <option>Due on Receipt</option>
                <option>Net 15</option>
                <option>Net 30</option>
                <option>Net 45</option>
              </select>
            </div>
          </div>

          {/* SECTION 3: ITEM TABLE (THE ZOHO TABLE LOOK) */}
          <div className="mb-8 border border-gray-200 rounded overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-xs uppercase text-gray-500 font-bold border-b border-gray-200">
                  <th className="p-3 w-1/3">Item Details</th>
                  <th className="p-3 w-1/4">
                    Account <span className="text-red-500">*</span>
                  </th>
                  <th className="p-3 w-24 text-right">Quantity</th>
                  <th className="p-3 w-32 text-right">Rate</th>
                  <th className="p-3 w-32 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-gray-100">
                  <td className="p-3">
                    <input
                      type="text"
                      disabled
                      value="Extracted Items (Combined)"
                      className="w-full bg-transparent outline-none text-gray-600 italic"
                    />
                  </td>
                  <td className="p-3">
                    <select
                      value={formData.accountId}
                      onChange={(e) =>
                        setFormData({ ...formData, accountId: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded bg-white focus:border-blue-500 outline-none"
                    >
                      <option value="" disabled>
                        Select Account
                      </option>
                      {accounts?.map((acc) => (
                        <option key={acc.account_id} value={acc.account_id}>
                          {acc.account_name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-right text-gray-600">1.00</td>
                  <td className="p-3 text-right">
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          amount: parseFloat(e.target.value),
                        })
                      }
                      className="w-full text-right bg-transparent outline-none border-b border-transparent focus:border-blue-500 hover:border-gray-300"
                    />
                  </td>
                  <td className="p-3 text-right font-bold text-gray-800">
                    {formData.amount?.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="bg-gray-50 p-2 text-xs text-blue-600 font-medium cursor-pointer hover:underline px-4">
              + Add another line
            </div>
          </div>

          {/* SECTION 4: FOOTER & TOTALS */}
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
            <div className="w-full md:w-1/2">
              <label className="zoho-label">Customer Notes</label>
              <textarea
                className="zoho-input h-24 resize-none"
                placeholder="Will be displayed on the bill"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              ></textarea>
            </div>

            <div className="w-full md:w-1/3 bg-gray-50 p-6 rounded border border-gray-200">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Sub Total</span>
                <span>{formData.amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Discount</span>
                <span>0.00</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-4 pb-4 border-b border-gray-200">
                <span>VAT (Included)</span>
                <span>{(formData.amount * 0.05).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-gray-800">
                <span>Total</span>
                <span>{formData.amount?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* BOTTOM ACTIONS */}
          <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-lg z-20 flex justify-end gap-3 md:absolute md:relative md:shadow-none md:p-0 md:bg-transparent md:border-0">
            <button className="px-6 py-2 border border-gray-300 rounded text-gray-700 font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={approveMutation.isPending || !formData.billNumber}
              className="px-6 py-2 bg-[#22a6f2] text-white rounded font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {approveMutation.isPending ? "Saving..." : "Save as Open"}
            </button>
          </div>

          {/* Spacer for fixed bottom bar on mobile */}
          <div className="h-16 md:hidden"></div>
        </div>
      </div>

      {/* LIGHTBOX OVERLAY */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4">
          <img
            src={invoice.imageUrl}
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <Minimize2 size={32} />
          </button>
        </div>
      )}
    </div>
  );
}
