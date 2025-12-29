import { useState } from "react";
import type { Invoice } from "@receipt-app/shared";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { ComplianceChecklist } from "./ComplianceChecklist";
import {
  Trash2,
  Plus,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  X,
  ChevronDown,
  ChevronUp,
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

  const [scale, setScale] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageCollapsed, setIsImageCollapsed] = useState(false);

  const [header, setHeader] = useState({
    // 1. VENDOR FIX: Check 'vendor_name_raw' (Backend) first
    vendor: 
      invoice.vendor_name_raw || 
      invoice.vendorNameRaw || 
      invoice.vendor?.name || 
      "Unknown Vendor",
    
    // 2. BILL # FIX: Check 'invoice_number' (Backend)
    billNumber: 
      invoice.invoice_number || 
      invoice.invoiceNumber || 
      "", 
    
    // 3. ORDER # FIX: Check 'reference_number' (Backend)
    orderNumber: 
      invoice.reference_number || 
      invoice.referenceNumber || 
      "", 
    
    billDate: invoice.date || "",
    dueDate: invoice.dueDate || invoice.date || "", 
    
    // Auto-fill subject based on vendor if available
    subject: (invoice.vendor_name_raw || invoice.vendorNameRaw) 
      ? `Bill from ${invoice.vendor_name_raw || invoice.vendorNameRaw}` 
      : "",
      
    adjustment: invoice.adjustment || 0,
    discount: invoice.discount || 0,
  });

  // --- LINE ITEMS MAPPING (Ensure snake_case fallback) ---
  const rawLines = invoice.line_items || invoice.lineItems || [];

  const [lines, setLines] = useState(
    rawLines.length > 0
      ? rawLines.map((line: any) => ({
          description: line.description || "",
          // Check all possible Account ID keys
          accountId: line.accountId || line.zoho_account_id || line.account_id || "", 
          quantity: line.quantity || 1,
          rate: line.rate || 0,
          customerId: line.customerId || line.customer_id || "", 
        }))
      : [
          {
            description: "Item Description",
            accountId: "",
            quantity: 1,
            rate: invoice.amount || 0,
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
    queryFn: api.getCustomers,
  });

  // --- CALCULATIONS ---
  const subTotal = lines.reduce(
    (sum, line) => sum + line.quantity * line.rate,
    0
  );
  const total = subTotal + Number(header.adjustment) - Number(header.discount);

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
      // alert(`✅ Bill operation successful!`);
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
      vendor_name: header.vendor,
      bill_number: header.billNumber,
      date: header.billDate,
      due_date: header.dueDate,
      order_number: header.orderNumber,
      subject: header.subject,
      adjustment: header.adjustment,
      discount: header.discount,
      line_items: lines.map((l) => ({ ...l, account_id: l.accountId })),
      temp_file_path: invoice.image_url,
    });
  };

  if (invoice.category === "bank_statement" && invoice.bankStatementData) {
    return <BankStatementView data={invoice.bankStatementData} />;
  }

  return (
    <>
      {/* Fullscreen Modal for Image */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in">
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-4 right-4 z-10 p-2 text-white/70 hover:text-white bg-white/10 rounded-full"
          >
            <X size={24} />
          </button>
          <div className="w-full h-full p-4 overflow-auto flex justify-center">
            <NgrokImage
              src={invoice.image_url!}
              className="max-w-none w-auto h-auto object-contain"
            />
          </div>
        </div>
      )}

      {/* Main Layout: VERTICAL STACK */}
      <div className="h-full w-full flex flex-col bg-slate-100 overflow-hidden">
        {/* TOP SECTION: IMAGE VIEWER */}
        <div
          className={`w-full bg-slate-900 flex flex-col transition-all duration-300 ease-in-out border-b-4 border-brand-500
            ${isImageCollapsed ? "h-12 shrink-0" : "h-[40vh] shrink-0"}`}
        >
          {/* Toolbar */}
          <div className="p-2 bg-slate-800 border-b border-slate-700 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-xs font-bold hover:text-brand-400 bg-white/5 px-3 py-1.5 rounded-md"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <span className="text-xs text-slate-400 border-l border-slate-600 pl-3">
                {invoice.vendorNameRaw} • {invoice.date}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {!isImageCollapsed && (
                <>
                  <button
                    onClick={() => setScale((s) => s + 0.1)}
                    className="p-1.5 rounded hover:bg-white/10"
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button
                    onClick={() => setScale((s) => Math.max(0.2, s - 0.1))}
                    className="p-1.5 rounded hover:bg-white/10"
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <button
                    onClick={() => setScale(1)}
                    className="p-1.5 rounded hover:bg-white/10"
                    title="Reset"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <div className="w-px h-4 bg-slate-600 mx-2"></div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="p-1.5 rounded hover:bg-white/10"
                    title="Fullscreen"
                  >
                    <Maximize size={16} />
                  </button>
                </>
              )}

              <button
                onClick={() => setIsImageCollapsed(!isImageCollapsed)}
                className="p-1.5 rounded hover:bg-white/10 ml-2"
                title={isImageCollapsed ? "Show Image" : "Hide Image"}
              >
                {isImageCollapsed ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronUp size={16} />
                )}
              </button>
            </div>
          </div>

          {/* Scrollable Image Area */}
          {!isImageCollapsed && (
            <div className="flex-1 overflow-auto bg-slate-900/50 p-4 flex justify-center items-start">
              <NgrokImage
                src={invoice.image_url}
                className="shadow-2xl transition-transform duration-200 origin-top"
                style={{ transform: `scale(${scale})`, maxWidth: "100%" }}
              />
            </div>
          )}
        </div>

        {/* BOTTOM SECTION: ZOHO FORM */}
        <div className="flex-1 bg-white flex flex-col min-h-0 overflow-hidden relative z-10">
          <div className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24">
            <div className="max-w-5xl mx-auto space-y-6">
              {/* 1. Header Fields */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                {/* Vendor - Read Only */}
                <div className="md:col-span-4">
                  <label className="zoho-label">Vendor Name</label>
                  <input
                    type="text"
                    value={header.vendor}
                    readOnly
                    className="zoho-input bg-slate-200/50 text-slate-500 cursor-not-allowed font-semibold"
                  />
                  {/* Warning if unknown */}
                  {header.vendor === "Unknown Vendor" && (
                    <p className="text-[10px] text-red-500 mt-1 font-bold">
                      ⚠️ Please verify vendor in Zoho
                    </p>
                  )}
                </div>

                {/* Subject */}
                <div className="md:col-span-8">
                  <label className="zoho-label">Subject / Notes</label>
                  <input
                    type="text"
                    value={header.subject}
                    onChange={(e) =>
                      setHeader({ ...header, subject: e.target.value })
                    }
                    className="zoho-input"
                    placeholder="Enter a description for this bill..."
                  />
                </div>

                {/* Bill # */}
                <div className="md:col-span-3">
                  <label className="zoho-label text-brand-600">
                    Bill Number *
                  </label>
                  <input
                    type="text"
                    value={header.billNumber}
                    onChange={(e) =>
                      setHeader({ ...header, billNumber: e.target.value })
                    }
                    className="zoho-input font-bold"
                  />
                </div>

                {/* Order # */}
                <div className="md:col-span-3">
                  <label className="zoho-label">Order Number</label>
                  <input
                    type="text"
                    value={header.orderNumber}
                    onChange={(e) =>
                      setHeader({ ...header, orderNumber: e.target.value })
                    }
                    className="zoho-input"
                  />
                </div>

                {/* Dates */}
                <div className="md:col-span-3">
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
                <div className="md:col-span-3">
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

              {/* 2. Line Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-4 text-left w-[35%]">
                        Item Description
                      </th>
                      <th className="p-4 text-left w-[25%]">
                        Account (Category){" "}
                        <span className="text-red-500">*</span>
                      </th>
                      <th className="p-4 text-right w-[10%]">Qty</th>
                      <th className="p-4 text-right w-[10%]">Rate</th>
                      <th className="p-4 text-left w-[15%]">
                        Customer (Billable)
                      </th>
                      <th className="p-4 w-[5%]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lines.map((line, i) => (
                      <tr
                        key={i}
                        className="group hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="p-2">
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) =>
                              updateLine(i, "description", e.target.value)
                            }
                            className="w-full bg-transparent p-2 outline-none font-medium text-slate-700 placeholder:text-slate-300"
                            placeholder="Description..."
                          />
                        </td>
                        <td className="p-2">
                          <div className="relative">
                            <select
                              value={line.accountId}
                              onChange={(e) =>
                                updateLine(i, "accountId", e.target.value)
                              }
                              className={`w-full p-2 rounded-lg border text-xs font-semibold outline-none appearance-none cursor-pointer transition-all
                                ${line.accountId ? "bg-white border-slate-200 text-slate-900" : "bg-red-50 border-red-200 text-red-600"}`}
                            >
                              <option value="">-- Select Account --</option>
                              {accounts?.map((a) => (
                                <option key={a.account_id} value={a.account_id}>
                                  {a.account_name} ({a.account_code})
                                </option>
                              ))}
                            </select>
                            {/* Visual indicator for smart guess */}
                            {line.accountId && (
                              <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[9px] font-bold text-brand-600 bg-brand-50 px-1 rounded">
                                AI MATCH
                              </div>
                            )}
                          </div>
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
                            className="w-full bg-transparent p-2 outline-none text-right font-mono text-slate-700"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={line.rate}
                            onChange={(e) =>
                              updateLine(i, "rate", parseFloat(e.target.value))
                            }
                            className="w-full bg-transparent p-2 outline-none text-right font-mono text-slate-700"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={line.customerId}
                            onChange={(e) =>
                              updateLine(i, "customerId", e.target.value)
                            }
                            className="w-full bg-transparent p-2 outline-none text-slate-500 text-xs cursor-pointer"
                          >
                            <option value="">-- None --</option>
                            {customers?.map((c) => (
                              <option key={c.contact_id} value={c.contact_id}>
                                {c.contact_name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => removeLine(i)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="bg-slate-50 p-2 border-t border-slate-200">
                  <button
                    onClick={addLine}
                    className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-brand-50 transition-colors"
                  >
                    <Plus size={14} /> Add Line Item
                  </button>
                </div>
              </div>

              {/* 3. Totals Section */}
              <div className="flex justify-end">
                <div className="w-full md:w-1/3 bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Sub Total</span>
                    <span className="font-mono">{subTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm text-slate-600">
                    <span>Discount</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">(-)</span>
                      <input
                        type="number"
                        value={header.discount}
                        onChange={(e) =>
                          setHeader({ ...header, discount: e.target.value })
                        }
                        className="w-20 text-right bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-brand-400"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm text-slate-600 pb-3 border-b border-slate-200">
                    <span>Adjustment</span>
                    <input
                      type="number"
                      value={header.adjustment}
                      onChange={(e) =>
                        setHeader({ ...header, adjustment: e.target.value })
                      }
                      className="w-20 text-right bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-brand-400"
                    />
                  </div>

                  <div className="flex justify-between items-end">
                    <span className="font-bold text-lg text-slate-900">
                      Total (AED)
                    </span>
                    <span className="font-black text-2xl text-slate-900">
                      {total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] sticky bottom-0 z-20">
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={approveMutation.isPending}
              className="premium-button-primary"
            >
              {approveMutation.isPending
                ? "Syncing..."
                : "Approve & Push to Zoho"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
