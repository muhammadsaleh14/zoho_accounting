// File: apps/web-plugin/src/components/ComplianceWorkspace.tsx
import { useState } from "react";
import type { Invoice } from "@receipt-app/shared";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { ComplianceChecklist } from "./ComplianceChecklist";
import { PinOff, Trash2, Plus, ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  X,
} from "lucide-react";
import { NgrokImage } from "./NgrokImage";
import { BankStatementView } from "./BankStatementView";
import { useNavigate } from "react-router-dom";

interface Props {
  invoice: Invoice;
  onSuccess: () => void;
}

interface Customer {
  contact_id: string;
  contact_name: string;
}

export function ComplianceWorkspace({ invoice, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [scale, setScale] = useState(1); // 1 = 100%
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [header, setHeader] = useState({
    vendor: invoice.vendor,
    billNumber: invoice.invoiceNumber || "",
    orderNumber: "", // From AI if available
    billDate: invoice.date,
    dueDate: invoice.date,
    subject: "",
    adjustment: 0 as number | string,
  });

  const [lines, setLines] = useState(
    invoice.line_items?.map((line) => ({
      description: line.description,
      accountId: line.accountId || "",
      quantity: line.quantity || 1,
      rate: line.rate || 0,
      customerId: "", // Default empty
    })) || [
      {
        description: "Extracted Item",
        accountId: "",
        quantity: 1,
        rate: invoice.amount,
        customerId: "",
      },
    ]
  );

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: api.getChartOfAccounts,
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: api.getCustomers, // Using dummy data for now
  });

  const subTotal = lines.reduce(
    (sum, line) => sum + line.quantity * line.rate,
    0
  );
  const adjustmentVal =
    typeof header.adjustment === "string"
      ? parseFloat(header.adjustment) || 0
      : header.adjustment;
  const total = subTotal + adjustmentVal;

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
      alert(`✅ Bill operation successful!`);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      onSuccess();
    },
    onError: (error) => {
      alert(`❌ Zoho Error: ${error.message}`);
    },
  });

  const handleApprove = () => {
    if (!header.billNumber) return alert("Bill Number is required");
    if (lines.some((l) => !l.accountId))
      return alert("All lines must have an Account selected");

    approveMutation.mutate({
      // Map state to the payload your backend's /approve endpoint expects
      vendor_name: header.vendor,
      bill_number: header.billNumber,
      date: header.billDate,
      due_date: header.dueDate,
      order_number: header.orderNumber,
      subject: header.subject,
      adjustment: adjustmentVal,
      line_items: lines.map((l) => ({ ...l, account_id: l.accountId })), // map accountId to account_id
      temp_file_path: invoice.image_url,
    });
  };

  if (invoice.category === "bank_statement" && invoice.bankStatementData) {
    return <BankStatementView data={invoice.bankStatementData} />;
  }

  return (
    <>
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-4 right-4 z-10 p-2 text-white/70 hover:text-white bg-black/20 rounded-full"
          >
            <X size={24} />
          </button>
          <div className="w-full h-full p-8 flex items-center justify-center">
            <div className="w-full h-full overflow-auto">
              <NgrokImage
                src={invoice.image_url!}
                className="max-w-none w-auto h-auto mx-auto" // Allows natural size and centering
              />
            </div>
          </div>
        </div>
      )}
        <div className="h-full w-full flex flex-col lg:flex-row relative bg-slate-100 overflow-hidden">
        {/* Left Side: Image Viewer */}
        <div className="w-full lg:w-1/2 bg-gray-900 flex flex-col">
          <div className="p-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between text-white">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-sm font-bold hover:opacity-80"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setScale((s) => s + 0.2)}
                className="p-2 rounded hover:bg-black/30" title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={() => setScale((s) => Math.max(0.2, s - 0.2))}
                className="p-2 rounded hover:bg-black/30" title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <button
                onClick={() => setScale(1)}
                className="p-2 rounded hover:bg-black/30" title="Reset Zoom"
              >
                <RotateCcw size={16} />
              </button>
              <div className="w-px h-5 bg-gray-600 mx-2"></div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="p-2 rounded hover:bg-black/30" title="Expand View"
              >
                <Maximize size={16} />
              </button>
            </div>
          </div>

            <div className="flex-1 p-4 flex justify-center overflow-y-auto"> 
            <NgrokImage
                src={invoice.image_url}
                className="max-w-full max-h-full object-contain shadow-2xl"
                style={{ transform: `scale(${scale})`, transformOrigin: "top" }}
            />
            </div>
            {invoice.compliance && (
            <ComplianceChecklist data={invoice.compliance.checklist} />
            )}
        </div>

        {/* Right Side: Zoho Form */}
        <div className="w-full lg:w-1/2 bg-white flex flex-col">
            <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
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
                    />
                </div>
                </div>
                {/* Bill Details */}
                <div className="grid grid-cols-4 gap-6 mb-8 bg-gray-50 p-4 rounded-lg border">
                <div>
                    <label className="zoho-label">Bill# *</label>
                    <input
                    type="text"
                    value={header.billNumber}
                    onChange={(e) =>
                        setHeader({ ...header, billNumber: e.target.value })
                    }
                    className="zoho-input"
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
                {/* Line Items Table */}
                <div className="border rounded-lg mb-4 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                    <tr>
                        <th className="p-3">Description</th> {/* Removed width to let it be flexible */}
                        <th className="p-3 w-48">Account *</th> {/* A fixed width for the select dropdown */}
                        <th className="p-3 w-24 text-right">Qty</th> {/* Increased to a fixed width */}
                        <th className="p-3 w-28 text-right">Rate</th> {/* Increased to a fixed width */}
                        <th className="p-3 w-40">Customer</th> {/* A fixed width for the select dropdown */}
                        <th className="p-3 w-12"></th> {/* Fixed width for the delete icon */}
                    </tr>
                    </thead>
                    <tbody>
                    {lines.map((line, i) => (
                        <tr key={i}>
                        <td className="p-2">
                            <input
                            type="text"
                            value={line.description}
                            onChange={(e) =>
                                updateLine(i, "description", e.target.value)
                            }
                            className="zoho-input border-0"
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
                            <option value="">Select Account</option>
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
                                updateLine(
                                i,
                                "quantity",
                                parseFloat(e.target.value)
                                )
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
                            className="zoho-input"
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
                    className="m-2 text-xs font-bold text-blue-600 flex items-center gap-1"
                >
                    <Plus size={14} /> Add Line
                </button>
                </div>
                {/* Totals */}
                <div className="flex justify-end">
                <div className="w-1/2 bg-gray-50 p-4 rounded-lg border space-y-2">
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
                        className="w-20 text-right zoho-input"
                    />
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                    <span>Total</span>
                    <span>{total.toFixed(2)}</span>
                    </div>
                </div>
                </div>
            </div>
            </div>
            {/* Footer Actions */}
            <div className="p-4 bg-white border-t flex justify-end gap-3">
            <button className="px-6 py-2 border rounded hover:bg-gray-50">
                Cancel
            </button>
            <button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:opacity-50"
            >
                {approveMutation.isPending ? "Processing..." : "Save as Open"}
            </button>
            </div>
        </div>
        </div>
    </>
  );
}
