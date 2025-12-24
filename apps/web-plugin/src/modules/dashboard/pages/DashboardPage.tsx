import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { InboxTable } from "../components/InboxTable";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RefreshCw, Upload, Loader2 } from "lucide-react";
import { DashboardSidebar, type FilterType } from "@/components/DashboardSidebar";

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Filter State
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const {
    data: invoices,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["invoices"],
    queryFn: api.getInvoices,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadReceipt(file),
    onSuccess: () => {
      alert("Upload Success! Receipt is being processed.");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: () => {
      alert("Upload Failed. Check backend console.");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 2. Logic to filter invoices based on Sidebar selection
  const filteredInvoices = invoices?.filter((inv) => {
    if (activeFilter === "all") return true;
    return inv.category === activeFilter;
  });

  return (
    <div className="flex h-full w-full bg-gray-50/50">
      {/* 3. Pass Props to Sidebar */}
      <DashboardSidebar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Inbox
            </h1>
            <p className="text-muted-foreground mt-1">
              {activeFilter === "all"
                ? "Manage all financial documents."
                : `Viewing ${activeFilter.replace("_", " ")}s.`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,.pdf"
              onChange={handleFileChange}
            />
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {uploadMutation.isPending ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="border-b border-gray-100 bg-white/50 pb-4">
            <CardTitle className="text-base font-semibold">
              {activeFilter === "all"
                ? "Recent Uploads"
                : activeFilter.toUpperCase().replace("_", " ")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                Loading documents...
              </div>
            ) : (
              // 4. Pass the FILTERED list
              <InboxTable
                invoices={filteredInvoices || []}
                onReview={(id) => navigate(`/payables/review/${id}`)}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
