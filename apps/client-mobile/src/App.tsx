import { useRef, useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Home, Settings, Plus, Search, FileText } from "lucide-react";
import { api } from "./services/api";
import type { DocumentCategory, Invoice } from "@receipt-app/shared"; // Import Invoice

// Components
import { HomeHeader } from "./components/HomeHeader";
import { StatsCarousel } from "./components/StatsCarousel";
import { ExpenseChart } from "./components/ExpenseChart";
import { ActionCenter } from "./components/ActionCenter";
import { AnalysisProgress } from "./components/AnalysisProgress";
import { UploadSuccess } from "./components/UploadSuccess";
import { VaultFilters } from "./components/VaultFilters";
import { ReceiptCard } from "./components/ReceiptCard";
import { CategoryPicker } from "./components/CategoryPicker";
import { ThemeProvider } from "./components/ThemeProvider";
import { SettingsPage } from "./pages/SettingsPage";
import { DocumentDetailsPage } from "./pages/DocumentDetailsPage"; // New Import

const queryClient = new QueryClient();

function MobileWallet() {
  const client = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- State ---
  const [activeTab, setActiveTab] = useState("home");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastUploadedData, setLastUploadedData] = useState<any>(null);

  // New State for View Screen
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Data
  const { data: invoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: api.getInvoices,
  });

  // Upload Logic
  const uploadMutation = useMutation({
    mutationFn: (vars: { file: File; category: DocumentCategory }) =>
      api.uploadReceipt(vars.file, vars.category),
    onSuccess: (data) => {
      // Invalidate to fetch list again from server
      client.invalidateQueries({ queryKey: ["invoices"] });

      // Store result to show Success screen
      setLastUploadedData(data);
      setShowSuccess(true);
    },
    onError: (error) => {
      alert("Upload Failed: " + error);
    },
  });

  const handleCategorySelect = (category: DocumentCategory) => {
    setIsPickerOpen(false);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      uploadMutation.mutate({
        file: e.target.files[0],
        category: "bill",
      });
    }
    e.target.value = "";
  };

  // --- RENDER LOGIC ---

  // 1. Overlays
  if (uploadMutation.isPending) return <AnalysisProgress />;

  if (showSuccess) {
    return (
      <UploadSuccess
        data={lastUploadedData}
        onDismiss={() => {
          setShowSuccess(false);
          setActiveTab("vault");
        }}
      />
    );
  }

  // 2. Detail View (Highest Priority if selected)
  if (selectedInvoice) {
    return (
      <DocumentDetailsPage
        invoice={selectedInvoice}
        onBack={() => setSelectedInvoice(null)}
      />
    );
  }

  // 3. Main Tabs
  const renderContent = () => {
    if (activeTab === "settings")
      return <SettingsPage onBack={() => setActiveTab("home")} />;

    if (activeTab === "vault") {
      return (
        <div className="pt-16 pb-32 min-h-screen">
          <div className="px-6 mb-6">
            <h1 className="text-2xl font-black text-slate-900">
              Document Vault
            </h1>
            <p className="text-sm text-slate-500">
              Manage your financial history.
            </p>
          </div>

          {/* Search */}
          <div className="px-6 mb-4 relative">
            <Search
              className="absolute left-9 top-2.5 text-surface-300"
              size={18}
            />
            <input
              type="text"
              placeholder="Search vendor, amount..."
              className="w-full pl-10 pr-4 py-2 bg-surface-card border border-surface-200 rounded-xl text-sm outline-none focus:border-brand-500 transition-colors shadow-sm"
            />
          </div>

          <VaultFilters />

          <div className="mt-2">
            {invoices?.map((inv) => (
              <ReceiptCard
                key={inv.id}
                invoice={inv}
                // Handle Click
                onClick={(clickedInv) => setSelectedInvoice(clickedInv)}
              />
            ))}
            <div className="h-12" />
          </div>
        </div>
      );
    }

    // Default: Home Dashboard
    return (
      <div className="pb-32">
        <HomeHeader />
        <StatsCarousel />
        <ExpenseChart />
        <ActionCenter />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-surface-50 font-sans">
      {renderContent()}

      {/* Navigation (Hide if viewing details, though conditional return above handles this) */}
      <div className="fixed bottom-6 left-6 right-6 h-16 bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-float flex items-center justify-between px-8 z-50">
        <button
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "home" ? "text-brand-600" : "text-surface-300"}`}
        >
          <Home size={24} strokeWidth={activeTab === "home" ? 3 : 2.5} />
        </button>

        <div className="relative -top-6">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFile}
          />

          <button
            onClick={() => setIsPickerOpen(true)}
            className="w-14 h-14 bg-brand-900 rounded-full shadow-glow flex items-center justify-center text-white active:scale-95 transition-transform"
          >
            <Plus size={28} strokeWidth={3} />
          </button>
        </div>

        <button
          onClick={() => setActiveTab("vault")}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "vault" ? "text-brand-600" : "text-surface-300"}`}
        >
          <FileText size={24} strokeWidth={activeTab === "vault" ? 3 : 2.5} />
        </button>
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
      <ThemeProvider defaultTheme="light">
        <MobileWallet />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
