import type { Invoice } from "@receipt-app/shared";
import { Tag, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface Props {
  invoices: Invoice[];
  selectedId: string | null;
  onSelect: (invoice: Invoice) => void;
}

export function DataTableView({ invoices, selectedId, onSelect }: Props) {
  const getStatus = (status: string) => {
    switch (status) {
      case "review":
        return {
          icon: <AlertTriangle size={14} className="text-red-500" />,
          text: "Needs Review",
        };
      case "approved":
        return {
          icon: <CheckCircle2 size={14} className="text-green-500" />,
          text: "Approved",
        };
      default:
        return {
          icon: <Clock size={14} className="text-gray-500" />,
          text: "In Queue",
        };
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase">
          <tr>
            <th className="p-3 w-[25%]">Vendor</th>
            <th className="p-3 w-[15%]">Date</th>
            <th className="p-3 w-[15%]">Category</th>
            <th className="p-3 w-[20%]">Status</th>
            <th className="p-3 w-[15%] text-right">Amount</th>
            <th className="p-3 w-[10%]"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {invoices.map((inv) => {
            const status = getStatus(inv.status);
            return (
              <tr
                key={inv.id}
                onClick={() => onSelect(inv)}
                className={`cursor-pointer transition-colors ${selectedId === inv.id ? "bg-blue-50" : "hover:bg-gray-50"}`}
              >
                <td className="p-3 font-semibold text-gray-800">
                  {inv.vendor}
                </td>
                <td className="p-3 text-gray-600">{inv.date}</td>
                <td className="p-3 text-gray-600 capitalize">
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                    {inv.category.replace("_", " ")}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2 font-medium text-gray-700">
                    {status.icon} {status.text}
                  </div>
                </td>
                <td className="p-3 text-right font-mono text-gray-800">
                  ${inv.amount.toFixed(2)}
                </td>
                <td className="p-3 text-right text-blue-600 font-bold hover:underline">
                  View
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
