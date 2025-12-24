import { useRef, useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { RefreshCw, Plus, Home, Settings, Upload, Folder, Landmark, FileText, Receipt, Loader2, Bell, ShieldCheck } from "lucide-react";
import { api, API_BASE } from "./services/api";
import { ReceiptCard } from "./components/ReceiptCard";
import { CategoryPicker } from "./components/CategoryPicker";
import type { DocumentCategory } from "@receipt-app/shared";
import { ExpenseChart } from "./components/ExpenseChart";
import { ReportCard } from "./components/ReportCard";
import { StatsGrid } from "./components/StatsGrid";
import { FolderGrid } from "./components/FolderGrid";
import { FolderView } from "./components/FolderView";
import { SettingsPage } from "./pages/SettingsPage";
import { ThemeProvider } from "./components/ThemeProvider";
import { MobileNotificationDropdown } from "./components/MobileNotificationDropdown";


const queryClient = new QueryClient();

function MobileWallet() {
  const client = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [activeTab, setActiveTab] = useState("home");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
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
      id: "bill" as DocumentCategory,
      label: "Bills & Expenses",
      icon: Receipt,
      count: invoices?.filter((i) => i.category === "bill").length || 0,
    },
    {
      id: "invoice" as DocumentCategory,
      label: "Sales Invoices",
      icon: FileText,
      count: invoices?.filter((i) => i.category === "invoice").length || 0,
    },
    {
      id: "bank_statement" as DocumentCategory,
      label: "Bank Statements",
      icon: Landmark,
      count:
        invoices?.filter((i) => i.category === "bank_statement").length || 0,
    },
    {
      id: "misc" as DocumentCategory,
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

  // Render Content
  const renderContent = () => {
    if (activeTab === "settings") {
      return <SettingsPage onBack={() => setActiveTab("home")} />;
    }
    return (
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth bg-slate-50">
        {/* 1. HEADER & STATS - Light Blue Gradient */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white pt-6 pb-24 px-6 rounded-b-[40px] shadow-xl relative z-0 overflow-hidden">

          {/* Logo/Brand */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl border border-white/30">
                <ShieldCheck size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black leading-none tracking-tight">Zoho<span className="text-blue-200">Vault</span></h1>
                <p className="text-[8px] text-blue-200 font-bold tracking-[0.1em] uppercase mt-0.5 opacity-80">Mobile</p>
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-full border border-white/30 flex gap-2">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-all ${showNotifications ? 'bg-white/40' : 'bg-white/10 hover:bg-white/30'}`}
              >
                <Bell size={18} />
                {/* Badge */}
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="w-9 h-9 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-xs font-bold text-white">
                MA
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-2">
            <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></span>
              Live Cash Flow
            </p>
            <h1 className="text-3xl font-bold mt-1">
              ${totalSpent.toLocaleString()}
            </h1>
            <p className="text-blue-200 text-xs mt-1">+12% vs last month</p>
          </div>

          <div className="relative z-10 -ml-4 -mr-4">
            <ExpenseChart />
          </div>

          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
        </div>

        {/* 2. FLOATING ACTION CARD */}
        <div className="px-6 -mt-12 relative mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-slate-700 flex justify-between items-center transition-colors">
            <div>
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Pending Review</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Requires accountant approval
              </p>
            </div>
            <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-bold px-3 py-1 rounded-full text-sm">
              {pendingCount}
            </div>
          </div>
        </div>

        {/* 3. LIST CONTENT */}
        <div className="px-6 pb-32">
          <div className="mb-6">
            <StatsGrid />
          </div>

          <div className="bg-gray-200 dark:bg-slate-800 p-1 rounded-xl flex mb-6 transition-colors">
            <button
              onClick={() => setViewMode("input")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === "input"
                ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                }`}
            >
              Receipts
            </button>
            <button
              onClick={() => setViewMode("output")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === "output"
                ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                }`}
            >
              Reports
            </button>
          </div>

          <h2 className="font-bold text-lg text-gray-800 dark:text-white mb-4 transition-colors">
            {viewMode === "input" ? "Recent Uploads" : "Financial Reports"}
          </h2>

          {isLoading && viewMode === "input" && (
            <div className="flex justify-center p-4"><RefreshCw className="w-5 h-5 text-gray-400 animate-spin" /></div>
          )}

          {isError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-sm text-center mb-4 border border-red-100 dark:border-red-800">
              ⚠️ Cannot connect to server.
            </div>
          )}
          <div className="space-y-1">
            {viewMode === "input" && (
              <>
                {!currentFolder ? (
                  <FolderGrid
                    folders={folderData}
                    onSelectFolder={setCurrentFolder}
                  />
                ) : (
                  <FolderView
                    folderName={currentFolderName}
                    invoices={invoicesInCurrentFolder || []}
                    onBack={() => setCurrentFolder(null)}
                  />
                )}
              </>
            )}

            {viewMode === "output" && (
              <div className="space-y-6">
                {Object.entries(groupedReports).map(([monthYear, reports]) => (
                  <div key={monthYear}>
                    <h3 className="font-bold text-gray-400 text-xs uppercase tracking-wider pb-2 mb-2 border-b dark:border-slate-800">
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
      </div >
    );
  };

  return (
    <div className="min-h-screen bg-white">

      {/* FULL WIDTH CONTAINER */}
      <div className="w-full min-h-screen bg-white relative flex flex-col overflow-hidden">

        {/* The Dynamic Content */}
        {renderContent()}

        {/* Notification Dropdown - Rendered at root level for proper z-index */}
        {showNotifications && <MobileNotificationDropdown onClose={() => setShowNotifications(false)} />}

        {/* --- FIXED BOTTOM NAVIGATION --- */}
        <div className="absolute bottom-0 w-full bg-white/90 backdrop-blur-lg border-t border-slate-200 pb-safe pt-2 px-6 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-20">
          <div className="flex justify-between items-end pb-4">
            <button
              onClick={() => setActiveTab("home")}
              className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === "home" ? "text-blue-600" : "text-slate-400"}`}
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
                className="w-16 h-16 bg-blue-600 rounded-full shadow-xl shadow-blue-600/30 flex items-center justify-center text-white active:scale-95 transition-transform hover:scale-105"
              >
                <Plus size={32} strokeWidth={3} />
              </button>
            </div>

            <button
              onClick={() => setActiveTab("settings")}
              className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === "settings" ? "text-blue-600" : "text-slate-400"}`}
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

        {uploadMutation.isPending && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl w-64 text-center animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 size={24} className="animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">
                Analyzing...
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Extracting data with AI &<br />
                checking compliance.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="zoho-mobile-theme">
        <MobileWallet />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
