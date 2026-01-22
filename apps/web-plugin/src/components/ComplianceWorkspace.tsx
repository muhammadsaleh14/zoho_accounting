// --- File: apps/web-plugin/src/components/ComplianceWorkspace.tsx ---

import { useEffect, useState } from "react";
import type { Invoice, LineItem } from "../types"; // Import LineItem type
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
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
  UserCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Check,
  X as XIcon,
} from "lucide-react";
import { NgrokImage } from "./NgrokImage";
import { BankStatementView } from "./BankStatementView";
import { useNavigate } from "react-router-dom";

interface Props {
  invoice: Invoice;
  onSuccess: () => void;
}

interface Contact {
  contact_id: string;
  contact_name: string;
}

// --- COMPLIANCE BADGES COMPONENT ---
const ComplianceChecklist = ({ data }: { data: any }) => {
  if (!data?.details) return null;

  const checks = [
    { key: "invoiceNumberPresent", label: "Invoice #" },
    { key: "taxInvoiceLabel", label: "Tax Label" },
    { key: "supplierTRN", label: "Supplier TRN" },
    { key: "supplierAddress", label: "Supplier Address" },
    { key: "vatAmountShown", label: "VAT Breakdown" },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {checks.map((c) => {
        const passed = data.details[c.key];
        return (
          <div
            key={c.key}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shadow-sm
              ${
                passed
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }
            `}
          >
            {passed ? (
              <div className="bg-blue-600 text-white rounded-full p-0.5">
                <Check size={10} strokeWidth={3} />
              </div>
            ) : (
              <div className="bg-red-600 text-white rounded-full p-0.5">
                <XIcon size={10} strokeWidth={3} />
              </div>
            )}
            {c.label}
          </div>
        );
      })}
    </div>
  );
};


export function ComplianceWorkspace({ invoice, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // 1. DETERMINE TYPE
  const isSalesInvoice = invoice.category === "invoice";
  console.log("Invoice category:", invoice.category, "Is sales invoice:", isSalesInvoice);

  const [scale, setScale] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageCollapsed, setIsImageCollapsed] = useState(false);

    // Initialize Header State with VAT fields - AUTO-POPULATED
    const [header, setHeader] = useState({
      contactName:
        invoice.vendor_name_raw ||
        invoice.vendorNameRaw ||
        "",  // For invoices, customer info would be in vendor fields
      billNumber: invoice.invoice_number || "",
      date: invoice.date || "",
      dueDate: invoice.due_date || "",
      orderNumber: invoice.reference_number || "",
      subject: invoice.notes || "",
      // --- VAT Fields Auto-Populated ---
      taxPercentage: invoice.tax_percentage || null,
      isReverseCharge: invoice.is_reverse_charge || false,
      supplierTrn: invoice.supplier_trn || invoice.vendor?.trn || "",
      supplierAddress: invoice.supplier_address || invoice.vendor?.address || "",
      customerTrn: invoice.customer_trn || "",
      customerAddress: invoice.customer_address || "",
      dateOfSupply: invoice.date_of_supply || invoice.date || "",
      placeOfSupply: "UAE",  // Default to UAE
      // --- Additional fields for calculations ---
      adjustment: 0,
      discount: 0,
    });

  const rawLines = invoice.line_items || invoice.lineItems || [];

  const [lines, setLines] = useState<LineItem[]>(
    rawLines.map((line: any) => ({
      description: line.description || "",
      accountId: line.accountId || line.zoho_account_id || "",
      quantity: line.quantity || 1,
      rate: line.rate || 0,
      customerId: line.customerId || line.customer_id || "",
      account_guess: line.account_guess || null,
      // --- NEW: VAT fields ---
      tax_rate: line.tax_rate || null,
      tax_amount: line.tax_amount || null,
      is_reverse_charge: line.is_reverse_charge || false,
    }))
  );

  // Data Fetching
  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: api.getChartOfAccounts,
  });

  const { data: customers } = useQuery<Contact[]>({
    queryKey: ["customers"],
    queryFn: api.getCustomers,
  });

  const { data: vendors } = useQuery<Contact[]>({
    queryKey: ["vendors"],
    queryFn: api.getVendors,
  });

  // --- NEW: AUTO-SELECT DROPDOWN BASED ON GUESS ---
  useEffect(() => {
    if (!accounts || accounts.length === 0) return;

    setLines((currentLines) => {
      let hasChanges = false;

      const updatedLines = currentLines.map((line) => {
        // If an account is already selected, skip
        if (line.accountId) return line;
        // If there is no AI guess to work with, skip
        if (!line.account_guess) return line;

        // Try to find a match in the loaded accounts
        // We check if the AI guess is contained in the Account Name (case-insensitive)
        const guess = line.account_guess.toLowerCase();
        const match = accounts.find(
          (acc) =>
            acc.account_name.toLowerCase().includes(guess) ||
            guess.includes(acc.account_name.toLowerCase())
        );

        if (match) {
          hasChanges = true;
          return { ...line, accountId: match.account_id };
        }
        return line;
      });

      return hasChanges ? updatedLines : currentLines;
    });
  }, [accounts]);
  // ------------------------------------------------

  // 2. CONTEXT LOGIC
  const activeContacts = isSalesInvoice ? customers : vendors;

  const filteredAccounts = accounts?.filter((acc) => {
    const t = (acc.type || "").toLowerCase();
    if (isSalesInvoice) {
      return t.includes("income");
    } else {
      return t.includes("expense") || t.includes("cost") || t.includes("asset");
    }
  });

  // ... (Rest of logic: subTotal, updateLine, approveMutation, handlers) ...
  const subTotal = lines.reduce(
    (sum, line) => sum + line.quantity * line.rate,
    0
  );
  const total =
    subTotal +
    Number(header.adjustment) -
    Number(header.discount) +
    Number(invoice.tax_amount || 0);

  const updateLine = (index: number, field: keyof LineItem, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const addLine = () =>
    setLines([
      ...lines,
      {
        description: "",
        accountId: "",
        quantity: 1,
        rate: 0,
        customerId: "",
        account_guess: null,
        // --- NEW: VAT fields ---
        tax_rate: null,
        tax_amount: null,
        is_reverse_charge: false,
      },
    ]);
  const removeLine = (index: number) => {
    if (lines.length > 1) setLines(lines.filter((_, i) => i !== index));
  };

  const approveMutation = useMutation({
    mutationFn: api.approveInvoice,
    onSuccess: (data) => {
      alert(`✅ ${data.message}\n(Fake Zoho ID: ${data.zoho_id})`);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      onSuccess();
    },
    onError: (error: any) => alert(`❌ Sync Error: ${error.message}`),
  });

  const handleApprove = () => {
    if (!header.billNumber) return alert("Document Number is required.");
    if (lines.some((l) => !l.accountId))
      return alert("All line items must have an Account selected.");

    const matchedContact = activeContacts?.find(
      (c) => c.contact_name === header.contactName
    );

    approveMutation.mutate({
      id: invoice.id,
      category: invoice.category,
      contact_name: header.contactName,
      zoho_contact_id: matchedContact?.contact_id || null,
      contact_trn: isSalesInvoice ? header.customerTrn : invoice.vendor?.trn,
      contact_address: isSalesInvoice ? header.customerAddress : invoice.vendor?.address,
      invoiceNumber: header.billNumber,
      invoiceDate: header.date,
      due_date: header.dueDate,
      date_of_supply: header.dateOfSupply,
      order_number: header.orderNumber,
      subject: header.subject,
      adjustment: header.adjustment,
      discount: header.discount,
      tax_amount: invoice.tax_amount || 0,
      tax_percentage: header.taxPercentage,
      is_reverse_charge: header.isReverseCharge,
      supplier_trn: isSalesInvoice ? null : header.supplierTrn,
      supplier_address: isSalesInvoice ? null : header.supplierAddress,
      customer_trn: isSalesInvoice ? header.customerTrn : null,
      customer_address: isSalesInvoice ? header.customerAddress : null,
      line_items: lines.map((l) => ({ 
        ...l, 
        account_id: l.accountId,
        tax_rate: l.tax_rate,
        tax_amount: l.tax_amount,
        is_reverse_charge: l.is_reverse_charge
      })),
      temp_file_path: invoice.image_url,
    });
  };

  if (invoice.category === "bank_statement") {
    return <BankStatementView data={invoice.bankStatementData} />;
  }

  // ... (JSX Return - exactly as before) ...
  return (
    <>
      {/* ... (Modals, Image Preview - Unchanged) ... */}
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

      <div className="h-full w-full flex flex-col bg-slate-100 overflow-hidden">
        {/* ... (Top Bar - Unchanged) ... */}
        <div
          className={`w-full bg-slate-900 flex flex-col transition-all duration-300 ease-in-out border-b-4 border-brand-500 ${isImageCollapsed ? "h-12 shrink-0" : "h-[40vh] shrink-0"}`}
        >
          <div className="p-2 bg-slate-800 border-b border-slate-700 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-xs font-bold hover:text-brand-400 bg-white/5 px-3 py-1.5 rounded-md"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <span className="text-xs text-slate-400 border-l border-slate-600 pl-3">
                {header.contactName} • {header.invoiceDate}
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
              >
                {isImageCollapsed ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronUp size={16} />
                )}
              </button>
            </div>
          </div>
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

        {/* ... (Main Content) ... */}
        <div className="flex-1 bg-white flex flex-col min-h-0 overflow-hidden relative z-10">
          <div className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24">
            <div className="max-w-5xl mx-auto space-y-4">
              {/* Compliance Badges */}
              {/* ... (Unchanged) ... */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-4 overflow-hidden">
                <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Compliance Scan
                    </h3>
                    <ComplianceChecklist data={invoice.compliance_data} />
                  </div>
                  <div className="text-right hidden sm:block">
                    <p
                      className={`text-xs font-bold ${invoice.compliance_data?.isCompliant ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {invoice.compliance_data?.isCompliant
                        ? "Passed Checks"
                        : "Action Required"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div className="md:col-span-4">
                  <label className="zoho-label flex items-center justify-between">
                    {isSalesInvoice ? "Customer Name" : "Vendor Name"}
                    <span className="text-[9px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <UserCheck size={10} />
                      {activeContacts?.some(
                        (c) => c.contact_name === header.contactName
                      )
                        ? "MATCHED"
                        : "AI GUESS"}
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      value={header.contactName}
                      onChange={(e) => {
                        const selectedName = e.target.value;
                        setHeader({ ...header, contactName: selectedName });
                      }}
                      className="zoho-input appearance-none cursor-pointer font-semibold text-slate-700"
                    >
                      {!activeContacts?.some(
                        (c) => c.contact_name === header.contactName
                      ) && (
                        <option value={header.contactName}>
                          {header.contactName} (New / Extracted)
                        </option>
                      )}
                      {activeContacts?.map((c) => (
                        <option key={c.contact_id} value={c.contact_name}>
                          {c.contact_name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      size={14}
                    />
                  </div>
                </div>
                <div className="md:col-span-8">
                  <label className="zoho-label">Subject / Notes</label>
                  <input
                    type="text"
                    value={header.subject}
                    onChange={(e) =>
                      setHeader({ ...header, subject: e.target.value })
                    }
                    className="zoho-input"
                    placeholder="Notes..."
                  />
                </div>
                {/* --- NEW: VAT Compliance Fields --- */}
                <div className="md:col-span-6 border-t border-slate-200 pt-4">
                  <label className="zoho-label text-brand-600">
                    {isSalesInvoice ? "Customer TRN" : "Supplier TRN"}
                  </label>
                  <input
                    type="text"
                    value={isSalesInvoice ? header.customerTrn : header.supplierTrn}
                    onChange={(e) => 
                      setHeader({ 
                        ...header, 
                        ...(isSalesInvoice 
                          ? { customerTrn: e.target.value }
                          : { supplierTrn: e.target.value }
                        )
                      })
                    }
                    className="zoho-input font-mono text-sm"
                    placeholder="Tax Registration Number"
                  />
                </div>
                <div className="md:col-span-6 border-t border-slate-200 pt-4">
                  <label className="zoho-label text-brand-600">
                    {isSalesInvoice ? "Customer Address" : "Supplier Address"}
                  </label>
                  <input
                    type="text"
                    value={isSalesInvoice ? header.customerAddress : header.supplierAddress}
                    onChange={(e) => 
                      setHeader({ 
                        ...header, 
                        ...(isSalesInvoice 
                          ? { customerAddress: e.target.value }
                          : { supplierAddress: e.target.value }
                        )
                      })
                    }
                    className="zoho-input text-sm"
                    placeholder="Address"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="zoho-label text-brand-600">
                    {isSalesInvoice ? "Invoice #" : "Bill Number"} *
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
                <div className="md:col-span-3">
                  <label className="zoho-label">Date of Supply</label>
                  <input
                    type="date"
                    value={header.dateOfSupply}
                    onChange={(e) =>
                      setHeader({ ...header, dateOfSupply: e.target.value })
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
                {/* --- NEW: VAT Settings --- */}
                <div className="md:col-span-4 border-t border-slate-200 pt-4">
                  <label className="zoho-label text-brand-600">VAT Rate (%)</label>
                  <select
                    value={header.isReverseCharge ? "reverse" : (header.taxPercentage ?? "")}
                    onChange={(e) => {
                      const value = e.target.value;
                      setHeader({ 
                        ...header, 
                        taxPercentage: value === "reverse" ? null : parseFloat(value) || null,
                        isReverseCharge: value === "reverse"
                      });
                    }}
                    className="zoho-input font-mono text-sm"
                  >
                    <option value="">Select Rate</option>
                    <option value="0">0% (Exempt)</option>
                    <option value="0">0% (Zero Rated)</option>
                    <option value="5">5% (Standard VAT)</option>
                    <option value="reverse">Reverse Charge</option>
                  </select>
                </div>
                <div className="md:col-span-8 border-t border-slate-200 pt-4">
                  <label className="zoho-label flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={header.isReverseCharge}
                      onChange={(e) =>
                        setHeader({ ...header, isReverseCharge: e.target.checked })
                      }
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    Reverse Charge Mechanism Applicable
                  </label>
                  <p className="text-xs text-slate-500 mt-1">
                    Applies to services imported from outside GCC
                  </p>
                </div>
              </div>

              {/* Table Area */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-4 text-left w-[30%]">Item Details</th>
                      <th className="p-4 text-left w-[20%]">
                        {isSalesInvoice ? "Income Account" : "Expense Account"}{" "}
                        <span className="text-red-500">*</span>
                      </th>
                      <th className="p-4 text-right w-[8%]">Qty</th>
                      <th className="p-4 text-right w-[10%]">Rate</th>
                      <th className="p-4 text-right w-[10%]">VAT %</th>
                      <th className="p-4 text-right w-[10%]">VAT Amt</th>
                      <th className="p-4 text-left w-[7%]">
                        {!isSalesInvoice && "Customer"}
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
                            className="w-full bg-transparent p-2 outline-none font-medium text-slate-700"
                          />
                        </td>
                        <td className="p-2">
                          <div
                            className={`w-full p-2 rounded-lg border text-xs font-semibold
                              ${
                                line.account_guess
                                  ? "bg-slate-50 border-slate-200 text-slate-900"
                                  : "bg-red-50 border-red-200 text-red-600"
                              }`}
                          >
                            {line.account_guess || "No account"}
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
                            value={line.tax_rate ?? ""}
                            onChange={(e) =>
                              updateLine(i, "tax_rate", parseFloat(e.target.value) || null)
                            }
                            className="w-full bg-transparent p-1 outline-none text-right font-mono text-slate-700 text-xs"
                          >
                            <option value="">Auto</option>
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={line.tax_amount || ""}
                            onChange={(e) =>
                              updateLine(i, "tax_amount", parseFloat(e.target.value) || null)
                            }
                            className="w-full bg-transparent p-2 outline-none text-right font-mono text-slate-700 text-xs"
                            placeholder="Auto"
                            disabled={line.is_reverse_charge}
                          />
                        </td>
                        <td className="p-2">
                          {!isSalesInvoice && (
                            <select
                              value={line.customerId || ""}
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
                          )}
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

              {/* Enhanced Totals Area with VAT Breakdown */}
              <div className="flex justify-end">
                <div className="w-full md:w-1/2 bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Sub Total</span>
                    <span className="font-mono">{subTotal.toFixed(2)}</span>
                  </div>
                  
                  {/* VAT Breakdown */}
                  <div className="border-t border-slate-200 pt-3 space-y-2">
                    <div className="flex justify-between items-center text-sm text-slate-600">
                      <span className="flex items-center gap-2">
                        Tax (VAT)
                        {header.isReverseCharge && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold">
                            REVERSE CHARGE
                          </span>
                        )}
                      </span>
                      <span className="font-mono">
                        {Number(invoice.tax_amount || 0).toFixed(2)}
                      </span>
                    </div>
                    
                    {header.taxPercentage && (
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>VAT Rate Applied</span>
                        <span className="font-mono">
                          {header.isReverseCharge ? "Reverse Charge" : (header.taxPercentage ? `${header.taxPercentage}%` : "Not set")}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-slate-600">
                    <span>Discount</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">(-)</span>
                      <input
                        type="number"
                        value={header.discount}
                        onChange={(e) =>
                          setHeader({
                            ...header,
                            discount: parseFloat(e.target.value) || 0,
                          })
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
                        setHeader({
                          ...header,
                          adjustment: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-20 text-right bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-brand-400"
                    />
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="font-bold text-lg text-slate-900">
                        Total ({invoice.currency})
                      </span>
                      {header.isReverseCharge && (
                        <p className="text-xs text-amber-600 font-medium mt-1">
                          VAT accounted via reverse charge mechanism
                        </p>
                      )}
                    </div>
                    <span className="font-black text-2xl text-slate-900">
                      {total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                ? "Simulating Sync..."
                : isSalesInvoice
                  ? "Approve & Send Invoice"
                  : "Approve & Push Bill"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
