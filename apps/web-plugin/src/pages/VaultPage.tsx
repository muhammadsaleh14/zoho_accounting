import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Download,
  Mail,
  FileText,
  FileCheck,
  Clock,
  ChevronRight,
  Inbox,
  Send,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSearch } from "@/context/SearchContext";
import { api, type Invoice } from "@/services/api";

type VaultTab = "input" | "output";
type CategoryFilter = "all" | "invoices" | "receipts" | "statements" | "misc";

export function VaultPage() {
  const [activeTab, setActiveTab] = useState<VaultTab>("input");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const { searchQuery, setSearchQuery } = useSearch();

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: api.getInvoices,
  });

  const categories = [
    { id: "all", label: "All Files", icon: Inbox },
    { id: "invoices", label: "Invoices", icon: FileText },
    { id: "receipts", label: "Receipts", icon: FileCheck },
    { id: "statements", label: "Statements", icon: Clock },
  ];

  // Dummy data for generated reports
  const outputReports = [
    {
      name: "Monthly Profit & Loss",
      date: "Dec 2025",
      size: "1.2 MB",
      type: "PDF",
    },
    {
      name: "Balance Sheet (Q4)",
      date: "Oct-Dec 2025",
      size: "2.4 MB",
      type: "PDF",
    },
    {
      name: "Cash Flow Statement",
      date: "Dec 2025",
      size: "890 KB",
      type: "PDF",
    },
    {
      name: "AP Aging Report",
      date: "Dec 24, 2025",
      size: "1.1 MB",
      type: "XLSX",
    },
  ];

  // --- HELPER: Safely extract Vendor Name ---
  const getVendorName = (doc: any) => {
    // Check all possible variations from backend (snake_case, camelCase, or object)
    return (
      doc.vendor_name_raw ||
      doc.vendorNameRaw ||
      (typeof doc.vendor === "string" ? doc.vendor : doc.vendor?.name) ||
      "Unknown Vendor"
    );
  };

  const filteredInvoices = invoices?.filter((doc) => {
    // 1. Safely resolve Vendor Name
    const vendorName = getVendorName(doc);

    // 2. Safely resolve ID (convert number to string)
    const docId = String(doc.id || "");

    const matchesSearch =
      vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      docId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      category === "all" ||
      (category === "invoices" && doc.category === "invoice") ||
      (category === "receipts" && doc.category === "bill") ||
      (category === "statements" && doc.category === "bank_statement");

    return matchesSearch && matchesCategory;
  });

  const filteredReports = outputReports.filter((report) =>
    report.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto py-2 lg:py-4 pb-20">
      {/* Header */}
      <div className="mb-6 lg:mb-10">
        <h1 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tight">
          Document Vault
        </h1>
        <p className="text-sm lg:text-base text-slate-500 mt-2 font-medium">
          Manage your financial history and download generated reports.
        </p>
      </div>

      {/* Main Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full max-w-sm lg:w-fit mb-6 lg:mb-8 shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab("input")}
          className={`
            flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 lg:px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap
            ${
              activeTab === "input"
                ? "bg-white text-brand-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }
          `}
        >
          <Inbox size={18} />
          Input Documents
        </button>
        <button
          onClick={() => setActiveTab("output")}
          className={`
            flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 lg:px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap
            ${
              activeTab === "output"
                ? "bg-white text-brand-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }
          `}
        >
          <Send size={18} />
          Output Reports
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        {/* Left: Filters */}
        <div className="space-y-6">
          {/* Categories */}
          <div className="glass-card p-4 lg:p-6">
            <h3 className="zoho-label mb-4">Categories</h3>

            <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 lg:space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id as CategoryFilter)}
                  className={`
                    flex-shrink-0 lg:w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group border lg:border-none border-slate-100
                    ${
                      category === cat.id
                        ? "bg-brand-50 text-brand-600 shadow-sm shadow-brand-100 border-brand-100"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 bg-white"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <cat.icon
                      size={18}
                      className={
                        category === cat.id
                          ? "text-brand-600"
                          : "text-slate-400 group-hover:text-slate-900"
                      }
                    />
                    <span className="whitespace-nowrap">{cat.label}</span>
                  </div>
                  <ChevronRight
                    size={14}
                    className={`hidden lg:block ${category === cat.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-4 lg:p-6">
            <h3 className="zoho-label mb-4">Search & Sort</h3>
            <div className="relative mb-3">
              <Search
                className="absolute left-3 top-2.5 text-slate-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white outline-none transition-all"
              />
            </div>
            <button className="premium-button-secondary w-full text-xs py-2 scale-95">
              Advanced Filters
            </button>
          </div>
        </div>

        {/* Right: Content */}
        <div className="lg:col-span-3">
          {activeTab === "input" ? (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Document
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Status
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Date
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {isLoading ? (
                      Array(8)
                        .fill(0)
                        .map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td
                              colSpan={4}
                              className="px-6 py-6 h-12 bg-slate-50/50"
                            ></td>
                          </tr>
                        ))
                    ) : filteredInvoices?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Search size={40} className="mb-2 opacity-20" />
                            <p className="font-bold text-slate-600">
                              No documents found
                            </p>
                            <p className="text-xs">
                              Try adjusting your search or category filters.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices?.map((doc) => (
                        <Link
                          to={`/review/${doc.id}`}
                          key={doc.id}
                          className="contents"
                        >
                          <tr className="hover:bg-slate-50/80 transition-all group cursor-pointer">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="bg-slate-100 p-2.5 rounded-xl group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                                  <FileText size={20} />
                                </div>
                                <div>
                                  {/* USE HELPER FUNCTION HERE TOO */}
                                  <p className="text-sm font-bold text-slate-800">
                                    {getVendorName(doc)}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-medium">
                                    #{doc.id} • {doc.currency} {doc.amount}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={
                                  doc.status === "review"
                                    ? "status-badge-yellow"
                                    : "status-badge-green"
                                }
                              >
                                {doc.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                              {doc.date}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                  className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-brand-600 hover:border-brand-300 shadow-sm transition-all"
                                  title="Download"
                                >
                                  <Download size={14} />
                                </button>
                                <button
                                  className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-emerald-600 hover:border-emerald-300 shadow-sm transition-all"
                                  title="Email"
                                >
                                  <Mail size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        </Link>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReports.length === 0 ? (
                <div className="md:col-span-2 glass-card p-12 text-center">
                  <Search size={40} className="mx-auto mb-4 text-slate-200" />
                  <p className="font-bold text-slate-600">No reports found</p>
                  <p className="text-xs text-slate-400">
                    Your search didn't match any generated reports.
                  </p>
                </div>
              ) : (
                filteredReports.map((report, i) => (
                  <div
                    key={i}
                    className="glass-card p-6 flex flex-col justify-between hover:scale-[1.02] transition-all group cursor-pointer border-l-4 border-l-emerald-500"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
                        <FileCheck size={24} />
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-all">
                          <Download size={16} />
                        </button>
                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-all">
                          <Mail size={16} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1 group-hover:text-brand-600 transition-colors">
                        {report.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                        {report.date} • {report.size} •{" "}
                        <span className="text-emerald-600 font-bold tracking-widest">
                          {report.type}
                        </span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
