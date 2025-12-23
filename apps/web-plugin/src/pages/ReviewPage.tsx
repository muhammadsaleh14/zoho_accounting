import { useParams, useNavigate } from "react-router-dom";
import type { Invoice } from "@receipt-app/shared";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { ComplianceWorkspace } from "../components/ComplianceWorkspace";
import { ArrowLeft } from "lucide-react";

export function ReviewPage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  // We still need the full list to find the one we are reviewing
  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: api.getInvoices,
  });

  const selectedInvoice = invoices?.find((inv) => inv.id === invoiceId);

  if (!selectedInvoice) {
    return <div>Loading invoice or Invoice not found...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Custom Header for this page */}
      <div className="h-12 bg-white border-b border-gray-200 flex-shrink-0 flex items-center px-4 gap-3">
        <button
          onClick={() => navigate("/")}
          className="p-1.5 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h2 className="font-semibold text-sm text-gray-800">
            Reviewing: {selectedInvoice.vendor}
          </h2>
          <p className="text-xs text-gray-500">
            Invoice ID: {selectedInvoice.id}
          </p>
        </div>
      </div>

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
