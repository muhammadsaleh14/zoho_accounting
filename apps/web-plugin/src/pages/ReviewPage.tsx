// File: apps/web-plugin/src/pages/ReviewPage.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { ComplianceWorkspace } from "../components/ComplianceWorkspace";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { Invoice } from "@/services/api";

export function ReviewPage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: api.getInvoices,
  });

  const selectedInvoice = invoices?.find((inv) => inv.id === invoiceId);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  if (!selectedInvoice) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <h2 className="text-lg font-bold text-slate-700">Document Not Found</h2>
        <p className="text-slate-500 text-sm">
          Could not find a document with ID: {invoiceId}
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-sm font-bold text-brand-600"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Custom Header for this page is inside the workspace */}
      <div className="flex-1 overflow-hidden">
        <ComplianceWorkspace
          key={selectedInvoice.id}
          invoice={selectedInvoice}
          onSuccess={() => navigate("/")} // Go back to dashboard on success
        />
      </div>
    </div>
  );
}
