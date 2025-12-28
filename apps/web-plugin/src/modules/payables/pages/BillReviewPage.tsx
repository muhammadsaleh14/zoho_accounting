import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { BillEditForm } from "../components/BillEditForm";
import { NgrokImage } from "@/components/NgrokImage"; // Keep this component for now, or move to shared
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BillReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: invoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: api.getInvoices,
  });

  const invoice = invoices?.find((i) => i.id === id);

  if (!invoice) return <div>Loading...</div>;

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">
      {/* Left: Image Viewer */}
      <div className="w-full md:w-1/2 bg-slate-900 flex items-center justify-center p-4 relative">
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-4 left-4 z-10"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <NgrokImage
          src={invoice.image_url}
          className="max-h-full max-w-full object-contain"
        />
      </div>

      {/* Right: Form */}
      <div className="w-full md:w-1/2 p-6 overflow-y-auto bg-gray-50">
        <h2 className="text-xl font-bold mb-6">Review Bill</h2>
        <BillEditForm invoice={invoice} onSuccess={() => navigate("/")} />
      </div>
    </div>
  );
}
