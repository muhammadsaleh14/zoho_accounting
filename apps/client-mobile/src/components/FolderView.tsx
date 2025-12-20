import type { Invoice } from "@receipt-app/shared";
import { ReceiptCard } from "./ReceiptCard";
import { ChevronLeft } from "lucide-react";

interface Props {
  folderName: string;
  invoices: Invoice[];
  onBack: () => void;
}

export function FolderView({ folderName, invoices, onBack }: Props) {
  return (
    <div className="animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h2 className="font-bold text-xl text-gray-800">{folderName}</h2>
      </div>

      {/* List */}
      <div className="space-y-1">
        {invoices.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p>This folder is empty.</p>
          </div>
        ) : (
          invoices.map((inv) => <ReceiptCard key={inv.id} invoice={inv} />)
        )}
      </div>
    </div>
  );
}
