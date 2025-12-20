import { useRef, useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { RefreshCw, Plus, Home, Settings, Upload, Folder, Landmark, FileText, Receipt } from "lucide-react";
import { api, API_BASE } from "./services/api";
import { ReceiptCard } from "./components/ReceiptCard";
import { CategoryPicker } from "./components/CategoryPicker";
import type { DocumentCategory } from "@receipt-app/shared";
import { ExpenseChart } from "./components/ExpenseChart";
import { ReportCard } from "./components/ReportCard";
import { StatsGrid } from "./components/StatsGrid";
import { FolderGrid } from "./components/FolderGrid";
import { FolderView } from "./components/FolderView";

const queryClient = new QueryClient();

function MobileWallet() {
  const client = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [activeTab, setActiveTab] = useState("home");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<DocumentCategory>("bill");
  const [viewMode, setViewMode] = useState<"input" | "output">("input");
  const [currentFolder, setCurrentFolder] = useState<
    DocumentCategory | "all" | null
  >(null);

  // 1. Fetch Data
  const {
    data: invoices,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["invoices"],
    queryFn: api.getInvoices,
  });

  // 2. Upload Logic
  const uploadMutation = useMutation({
    mutationFn: (vars: { file: File; category: DocumentCategory }) =>
      api.uploadReceipt(vars.file, vars.category),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  const folderData = [
    {
      id: "bill",
      label: "Bills & Expenses",
      icon: Receipt,
      count: invoices?.filter((i) => i.category === "bill").length || 0,
    },
    {
      id: "invoice",
      label: "Sales Invoices",
      icon: FileText,
      count: invoices?.filter((i) => i.category === "invoice").length || 0,
    },
    {
      id: "bank_statement",
      label: "Bank Statements",
      icon: Landmark,
      count:
        invoices?.filter((i) => i.category === "bank_statement").length || 0,
    },
    {
      id: "misc",
      label: "Miscellaneous",
      icon: Folder,
      count: invoices?.filter((i) => i.category === "misc").length || 0,
    },
  ];

  const invoicesInCurrentFolder = invoices?.filter((inv) => {
    if (currentFolder === "all") return true;
    return inv.category === currentFolder;
  });

  const currentFolderName =
    folderData.find((f) => f.id === currentFolder)?.label || "All Documents";

  const MOCK_REPORTS = [
    {
      id: 1,
      title: "Profit & Loss - Nov 2025",
      date: "2025-12-01",
      url: `${API_BASE}/images/report.pdf`,
    },
    {
      id: 2,
      title: "Balance Sheet - Q3",
      date: "2025-10-01",
      url: `${API_BASE}/images/report.pdf`,
    },
    {
      id: 3,
      title: "VAT Return Filing",
      date: "2025-09-15",
      url: `${API_BASE}/images/report.pdf`,
    },
  ];

  const groupedReports = MOCK_REPORTS.reduce(
    (acc, report) => {
      // Get month name (e.g., "December 2025")
      const monthYear = new Date(report.date).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

      // Create group if it doesn't exist
      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }

      acc[monthYear].push(report);
      return acc;
    },
    {} as Record<string, typeof MOCK_REPORTS>
  );

  // Step A: User picks category -> Open File Dialog
  const handleCategorySelect = (category: DocumentCategory) => {
    setSelectedCategory(category);
    setIsPickerOpen(false); // Close the sheet

    if (fileInputRef.current) {
      // Validation: Bank Statements must be PDF
      if (category === "bank_statement") {
        fileInputRef.current.accept = "application/pdf";
      } else {
        // Others can be Image or PDF
        fileInputRef.current.accept = "image/*,application/pdf";
      }

      // Trigger the hidden input
      // Note: On mobile, this opens Camera or File Picker
      fileInputRef.current.click();
    }
  };

  // Step B: User picks file -> Upload
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      uploadMutation.mutate({
        file: e.target.files[0],
        category: selectedCategory,
      });
    }
    // Reset value so same file can be selected again if needed
    e.target.value = "";
  };

  // Stats
  const totalSpent =
    invoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
  const pendingCount =
    invoices?.filter((i) => i.status === "queue" || i.status === "review")
      .length || 0;

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
      {/* --- SCROLLABLE CONTENT AREA --- */}
      {/* Everything here scrolls together */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* 1. HEADER & STATS (Now part of the scroll view) */}
        <div className="bg-[#0f172a] text-white pt-12 pb-24 px-6 rounded-b-[40px] shadow-xl relative z-0 overflow-hidden">
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                Live Cash Flow
              </p>
              <h1 className="text-3xl font-bold mt-1">
                ${totalSpent.toLocaleString()}
              </h1>
              <p className="text-slate-500 text-xs mt-1">+12% vs last month</p>
            </div>

            <div className="bg-slate-800 p-2 rounded-full border border-slate-700">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 flex items-center justify-center text-xs font-bold">
                AC
              </div>
            </div>
          </div>

          <div className="relative z-10 -ml-4 -mr-4">
            <ExpenseChart />
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        </div>

        {/* 2. FLOATING ACTION CARD */}
        <div className="px-6 -mt-12 relative z-10 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-gray-700">Pending Review</p>
              <p className="text-xs text-gray-500">
                Requires accountant approval
              </p>
            </div>
            <div className="bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-full text-sm">
              {pendingCount}
            </div>
          </div>
        </div>

        {/* 3. LIST CONTENT */}
        <div className="px-6 pb-32">
          {" "}
          {/* Added pb-32 so list isn't hidden behind nav */}
          <div className="mb-6">
            <StatsGrid />
          </div>
          {/* View Toggle */}
          <div className="bg-gray-200 p-1 rounded-xl flex mb-6">
            <button
              onClick={() => setViewMode("input")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                viewMode === "input"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Receipts
            </button>
            <button
              onClick={() => setViewMode("output")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                viewMode === "output"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Reports
            </button>
          </div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg text-gray-800">
              {viewMode === "input" ? "Recent Uploads" : "Financial Reports"}
            </h2>
            {isLoading && viewMode === "input" && (
              <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
            )}
          </div>
          {/* Error Message */}
          {isError && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center mb-4 border border-red-100">
              ⚠️ Cannot connect to server.
            </div>
          )}
          <div className="space-y-1">
            {/* VIEW: INPUT */}
            {viewMode === "input" && (
              <>
                {/* If no folder is selected, show the Grid */}
                {!currentFolder ? (
                  <FolderGrid
                    folders={folderData}
                    onSelectFolder={setCurrentFolder}
                  />
                ) : (
                  /* If a folder is selected, show the List View */
                  <FolderView
                    folderName={currentFolderName}
                    invoices={invoicesInCurrentFolder || []}
                    onBack={() => setCurrentFolder(null)}
                  />
                )}
              </>
            )}

            {/* VIEW: OUTPUT */}
            {viewMode === "output" && (
              <div className="space-y-6">
                {Object.entries(groupedReports).map(([monthYear, reports]) => (
                  <div key={monthYear}>
                    <h3 className="font-bold text-gray-400 text-xs uppercase tracking-wider pb-2 mb-2 border-b">
                      {monthYear}
                    </h3>
                    <div className="space-y-2">
                      {reports.map((report) => (
                        <ReportCard
                          key={report.id}
                          title={report.title}
                          date={report.date}
                          url={report.url}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- FIXED BOTTOM NAVIGATION --- */}
      <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 pb-safe pt-2 px-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
        <div className="flex justify-between items-end pb-4">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === "home" ? "text-blue-600" : "text-gray-400"}`}
          >
            <Home size={24} strokeWidth={activeTab === "home" ? 3 : 2} />
            <span className="text-[10px] font-bold">Home</span>
          </button>

          <div className="relative -top-6">
            <input
              type="file"
              capture="environment"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFile}
            />

            <button
              onClick={() => setIsPickerOpen(true)}
              disabled={uploadMutation.isPending}
              className="w-16 h-16 bg-blue-600 rounded-full shadow-xl shadow-blue-600/30 flex items-center justify-center text-white active:scale-95 transition-transform"
            >
              <Plus size={32} strokeWidth={3} />
            </button>
          </div>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === "settings" ? "text-blue-600" : "text-gray-400"}`}
          >
            <Settings
              size={24}
              strokeWidth={activeTab === "settings" ? 3 : 2}
            />
            <span className="text-[10px] font-bold">Settings</span>
          </button>
        </div>
      </div>

      <CategoryPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleCategorySelect}
      />
    </div>
  );
}

export default function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <MobileWallet />
    </QueryClientProvider>
  );
}
