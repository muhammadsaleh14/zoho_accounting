import { useState, useRef } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Camera, Upload, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { api } from "./services/api";
import type { Invoice } from "@receipt-app/shared";

// Setup Query Client
const queryClient = new QueryClient();

function MobileWallet() {
  const client = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch Data
  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: api.getInvoices,
  });

  // 2. Upload Mutation
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

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-gray-50 relative">
      {/* App Header */}
      <header className="bg-blue-600 p-4 pt-12 pb-6 shadow-lg rounded-b-3xl z-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-white text-2xl font-bold">My Receipts</h1>
            <p className="text-blue-100 text-sm">Abdullah Construction Ltd</p>
          </div>
          <div className="bg-white/20 p-2 rounded-full">
            <span className="text-white font-bold">3</span>
          </div>
        </div>
      </header>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {isLoading && (
          <p className="text-center text-gray-400 mt-10">Syncing...</p>
        )}

        {/* Upload Loading State */}
        {uploadMutation.isPending && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 animate-pulse flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Upload className="w-6 h-6 text-blue-500 animate-bounce" />
            </div>
            <div>
              <p className="font-bold text-gray-800">Scanning Receipt...</p>
              <p className="text-xs text-blue-500">AI is analyzing...</p>
            </div>
          </div>
        )}

        {invoices?.map((inv: Invoice) => (
          <div
            key={inv.id}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4"
          >
            {/* Status Icon */}
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                inv.status === "review" ? "bg-yellow-50" : "bg-green-50"
              }`}
            >
              {inv.status === "review" ? (
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-600" />
              )}
            </div>

            {/* Details */}
            <div className="flex-1">
              <h3 className="font-bold text-gray-800">{inv.vendor}</h3>
              <p className="text-xs text-gray-500">{inv.date}</p>
            </div>

            {/* Amount */}
            <div className="text-right">
              <p className="font-bold text-gray-900">
                ${inv.amount.toFixed(2)}
              </p>
              <span className="text-[10px] uppercase font-bold text-gray-400">
                {inv.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Button (FAB) */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <input
          type="file"
          accept="image/*"
          capture="environment" // This triggers camera on mobile
          ref={fileInputRef}
          className="hidden"
          onChange={handleFile}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
          className="bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2 px-6"
        >
          <Camera className="w-6 h-6" />
          <span className="font-bold">Scan Receipt</span>
        </button>
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
