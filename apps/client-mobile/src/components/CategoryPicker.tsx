import { FileText, Receipt, Landmark, FolderPlus, X } from "lucide-react";
import type { DocumentCategory } from "@receipt-app/shared";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (category: DocumentCategory) => void;
}

export function CategoryPicker({ isOpen, onClose, onSelect }: Props) {
  if (!isOpen) return null;

  const categories = [
    {
      id: "bill",
      label: "Bill / Expense",
      icon: Receipt,
      desc: "Vendor payments & receipts",
      color: "bg-blue-100 text-blue-600",
    },
    {
      id: "invoice",
      label: "Sales Invoice",
      icon: FileText,
      desc: "Revenue & client invoices",
      color: "bg-green-100 text-green-600",
    },
    {
      id: "bank_statement",
      label: "Bank Statement",
      icon: Landmark,
      desc: "Monthly PDF statements",
      color: "bg-purple-100 text-purple-600",
    },
    {
      id: "misc",
      label: "Miscellaneous",
      icon: FolderPlus,
      desc: "Other documents",
      color: "bg-gray-100 text-gray-600",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-800">Upload Document</h3>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id as DocumentCategory)}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-left"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${cat.color}`}
              >
                <cat.icon size={24} />
              </div>
              <div>
                <p className="font-bold text-gray-900">{cat.label}</p>
                <p className="text-xs text-gray-500">{cat.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
