import { useState, useEffect } from "react";
import type { Invoice } from "@receipt-app/shared";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { ComplianceChecklist } from "./ComplianceChecklist";
import { Maximize2, Minimize2, Pin, PinOff, Trash2, Plus } from "lucide-react";

interface Props {
  invoice: Invoice;
  onSuccess: () => void;
}

export function ComplianceWorkspace({ invoice, onSuccess }: Props) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSticky, setIsSticky] = useState(true);
  const queryClient = useQueryClient();

  // --- STATE ---
  const [header, setHeader] = useState({
    vendor: invoice.vendor,
    billNumber: invoice.invoiceNumber || "",
    orderNumber: "",
    billDate: invoice.date,
    dueDate: invoice.date,
    subject: "",
    adjustment: 0,
  });

  // Dynamic Line Items
  const [lines, setLines] = useState([
    {
      description: "Extracted Item",
      accountId: "",
      quantity: 1,
      rate: invoice.amount,
      customerId: "",
    },
  ]);

  // Reset when invoice changes
  useEffect(() => {
    setHeader({
      vendor: invoice.vendor,
      billNumber: invoice.invoiceNumber || "",
      orderNumber: "",
      billDate: invoice.date,
      dueDate: invoice.date,
      subject: `Bill from ${invoice.vendor}`,
      adjustment: 0,
    });
    setLines([
      {
        description: "Extracted Item",
        accountId: "",
        quantity: 1,
        rate: invoice.amount,
        customerId: "",
      },
    ]);
  }, [invoice]);

  // --- DATA FETCHING ---
  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: api.getChartOfAccounts,
  });
  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: api.getCustomers,
  });

  // --- MATH ---
  const subTotal = lines.reduce(
    (sum, line) => sum + line.quantity * line.rate,
    0
  );
  const total = subTotal + parseFloat((header.adjustment as any) || 0);

  // --- ACTIONS ---
  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const addLine = () => {
    setLines([
      ...lines,
      { description: "", accountId: "", quantity: 1, rate: 0, customerId: "" },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

 const approveMutation = useMutation({
   mutationFn: api.approveInvoice,
   onSuccess: (data) => {
     if (data.status === "success") {
       // Success Alert (Optional, maybe replace with a Toast later)
       alert(
         `✅ Bill Created in Zoho! ID: ${data.details?.bill?.bill_id || "Success"}`
       );

       // Refresh Data
       queryClient.invalidateQueries({ queryKey: ["invoices"] });

       // CLEAR THE SCREEN
       onSuccess();
     } else {
       alert(`❌ Zoho Error: ${data.message}`);
     }
   },
 });

  const handleApprove = () => {
    if (!header.billNumber) return alert("Bill Number is required");
    // Validate Accounts
    if (lines.some((l) => !l.accountId))
      return alert("All lines must have an Account selected");

    approveMutation.mutate({
      id: invoice.id,
      ...header,
      amount: total,
      lineItems: lines,
    });
  };

  return (
    <div
      className={`h-full w-full flex flex-col relative bg-gray-50 ${isSticky ? "overflow-hidden" : "overflow-auto"}`}
    >
      {/* IMAGE VIEWER */}
      <div
        className={`bg-gray-900 border-b border-gray-700 transition-all duration-300 relative group ${isSticky ? "h-[40vh] flex-shrink-0" : "h-[500px] flex-shrink-0"}`}
      >
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <button
            onClick={() => setIsSticky(!isSticky)}
            className="bg-black/50 text-white p-2 rounded"
          >
            <Pin size={16} />
          </button>
          <button
            onClick={() => setIsFullscreen(true)}
            className="bg-black/50 text-white p-2 rounded"
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

      <div className="flex-shrink-0 z-10 bg-white">
        <ComplianceChecklist data={invoice.compliance.checklist} />
      </div>

      {/* ZOHO STYLE FORM */}
      <div
        className={`flex-1 bg-white p-8 ${isSticky ? "overflow-y-auto" : ""}`}
      >
        <div className="max-w-6xl mx-auto">
          {/* 1. Header Fields */}
          <div className="grid grid-cols-12 gap-6 mb-6">
            <div className="col-span-4">
              <label className="zoho-label">Vendor</label>
              <input
                type="text"
                value={header.vendor}
                readOnly
                className="zoho-input bg-gray-100"
              />
            </div>
            <div className="col-span-8">
              <label className="zoho-label">Subject</label>
              <input
                type="text"
                value={header.subject}
                onChange={(e) =>
                  setHeader({ ...header, subject: e.target.value })
                }
                className="zoho-input"
                placeholder="Enter a subject"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6 mb-8 bg-gray-50 p-4 rounded border border-gray-200">
            <div>
              <label className="zoho-label">
                Bill# <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={header.billNumber}
                onChange={(e) =>
                  setHeader({ ...header, billNumber: e.target.value })
                }
                className={`zoho-input ${!header.billNumber ? "border-yellow-400 bg-yellow-50" : ""}`}
              />
            </div>
            <div>
              <label className="zoho-label">Order #</label>
              <input
                type="text"
                value={header.orderNumber}
                onChange={(e) =>
                  setHeader({ ...header, orderNumber: e.target.value })
                }
                className="zoho-input"
              />
            </div>
            <div>
              <label className="zoho-label">Bill Date</label>
              <input
                type="date"
                value={header.billDate}
                onChange={(e) =>
                  setHeader({ ...header, billDate: e.target.value })
                }
                className="zoho-input"
              />
            </div>
            <div>
              <label className="zoho-label">Due Date</label>
              <input
                type="date"
                value={header.dueDate}
                onChange={(e) =>
                  setHeader({ ...header, dueDate: e.target.value })
                }
                className="zoho-input"
              />
            </div>
          </div>

          {/* 2. Dynamic Item Table */}
          <div className="border border-gray-300 rounded mb-4 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                <tr>
                  <th className="p-3 w-[25%]">Description</th>
                  <th className="p-3 w-[25%]">
                    Account <span className="text-red-500">*</span>
                  </th>
                  <th className="p-3 w-[10%] text-right">Qty</th>
                  <th className="p-3 w-[15%] text-right">Rate</th>
                  <th className="p-3 w-[20%]">Customer (Billable)</th>
                  <th className="p-3 w-[5%]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lines.map((line, i) => (
                  <tr key={i} className="hover:bg-gray-50 group">
                    <td className="p-2">
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) =>
                          updateLine(i, "description", e.target.value)
                        }
                        className="zoho-input border-0 bg-transparent focus:bg-white"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={line.accountId}
                        onChange={(e) =>
                          updateLine(i, "accountId", e.target.value)
                        }
                        className="zoho-input"
                      >
                        <option value="" disabled>
                          Select Account
                        </option>
                        {accounts?.map((a) => (
                          <option key={a.account_id} value={a.account_id}>
                            {a.account_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(i, "quantity", parseFloat(e.target.value))
                        }
                        className="zoho-input text-right"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={line.rate}
                        onChange={(e) =>
                          updateLine(i, "rate", parseFloat(e.target.value))
                        }
                        className="zoho-input text-right"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={line.customerId}
                        onChange={(e) =>
                          updateLine(i, "customerId", e.target.value)
                        }
                        className="zoho-input text-xs"
                      >
                        <option value="">-- None --</option>
                        {customers?.map((c) => (
                          <option key={c.contact_id} value={c.contact_id}>
                            {c.contact_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td
                      className="p-2 text-center text-gray-400 hover:text-red-500 cursor-pointer"
                      onClick={() => removeLine(i)}
                    >
                      <Trash2 size={16} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={addLine}
              className="m-2 text-xs font-bold text-blue-600 flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded"
            >
              <Plus size={14} /> Add Line
            </button>
          </div>

          {/* 3. Totals */}
          <div className="flex justify-end">
            <div className="w-1/3 bg-gray-50 p-4 rounded border border-gray-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sub Total</span>
                <span>{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Adjustment</span>
                <input
                  type="number"
                  value={header.adjustment}
                  onChange={(e) =>
                    setHeader({ ...header, adjustment: e.target.value })
                  }
                  className="w-20 text-right border rounded p-1"
                />
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                <span>Total</span>
                <span>{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 flex justify-end gap-3 pb-10">
            <button className="px-6 py-2 border rounded hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={approveMutation.isPending}
              className="px-6 py-2 bg-[#22a6f2] text-white rounded font-bold hover:bg-blue-600 shadow-sm disabled:opacity-50"
            >
              {approveMutation.isPending ? "Processing..." : "Save as Open"}
            </button>
          </div>
        </div>
      </div>

      {/* LIGHTBOX */}
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
