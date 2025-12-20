import { useRef, useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Camera, RefreshCw, Plus, Home, Settings } from "lucide-react";
import { api } from "./services/api";
import { ReceiptCard } from "./components/ReceiptCard";

const queryClient = new QueryClient();

function MobileWallet() {
  const client = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("home");

  // Fetch Data
  const {
    data: invoices,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["invoices"],
    queryFn: api.getInvoices,
    refetchInterval: 5000, // Auto-refresh every 5s to see approval updates
  });

  // Upload Logic
  const uploadMutation = useMutation({
    mutationFn: api.uploadReceipt,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      uploadMutation.mutate(e.target.files[0]);
    }
  };

  // Stats Calculation
  const totalSpent =
    invoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
  const pendingCount =
    invoices?.filter((i) => i.status === "queue" || i.status === "review")
      .length || 0;

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
      {/* 1. HEADER & STATS */}
      <div className="bg-[#0f172a] text-white pt-12 pb-24 px-6 rounded-b-[40px] shadow-xl relative z-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Total Expenses
            </p>
            <h1 className="text-3xl font-bold mt-1">
              ${totalSpent.toLocaleString()}
            </h1>
          </div>
          <div className="bg-slate-800 p-2 rounded-full">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500"></div>
          </div>
        </div>
      </div>

      {/* 2. FLOATING ACTION CARD (Overlap) */}
      <div className="px-6 -mt-12 relative z-10">
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

      {/* 3. SCROLLABLE LIST */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg text-gray-800">Recent Activity</h2>
          {isLoading && (
            <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
          )}
        </div>

        {isError && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center mb-4 border border-red-100">
            ⚠️ Cannot connect to server.
            <br />
            Check IP configuration.
          </div>
        )}

        <div className="space-y-1">
          {uploadMutation.isPending && (
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 mb-3 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-blue-100 rounded w-1/2"></div>
                  <div className="h-3 bg-blue-50 rounded w-1/3"></div>
                </div>
              </div>
              <div className="mt-3 text-xs text-blue-600 font-bold text-center">
                ✨ AI Analyzing Receipt...
              </div>
            </div>
          )}

          {invoices?.map((inv) => (
            <ReceiptCard key={inv.id} invoice={inv} />
          ))}

          {!isLoading && invoices?.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <p>No receipts yet.</p>
              <p className="text-sm">Tap + to add one.</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. BOTTOM NAVIGATION & FAB */}
      <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 pb-safe pt-2 px-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-end pb-4">
          {/* Tab 1 */}
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === "home" ? "text-blue-600" : "text-gray-400"}`}
          >
            <Home size={24} strokeWidth={activeTab === "home" ? 3 : 2} />
            <span className="text-[10px] font-bold">Home</span>
          </button>

          {/* BIG FAB (Center) */}
          <div className="relative -top-6">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFile}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="w-16 h-16 bg-blue-600 rounded-full shadow-xl shadow-blue-600/30 flex items-center justify-center text-white active:scale-95 transition-transform"
            >
              <Plus size={32} strokeWidth={3} />
            </button>
          </div>

          {/* Tab 2 */}
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
