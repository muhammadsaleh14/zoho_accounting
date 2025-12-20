import type { BankStatementData } from "@receipt-app/shared";
import { ArrowDown, ArrowUp } from "lucide-react";

export function BankStatementView({ data }: { data: BankStatementData }) {
  const isBalanced =
    data.openingBalance +
      data.transactions.reduce((sum, t) => sum + t.amount, 0) ===
    data.closingBalance;

  return (
    <div className="bg-white h-full flex flex-col">
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h3 className="font-bold text-gray-700">
          Bank Statement Reconciliation
        </h3>
        <span
          className={`px-2 py-1 text-xs font-bold rounded ${isBalanced ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
        >
          {isBalanced ? "BALANCED" : "UNBALANCED"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 p-4 border-b">
        <div className="text-center">
          <p className="text-xs uppercase text-gray-400">Opening</p>
          <p className="font-bold text-lg">${data.openingBalance.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase text-gray-400">Net Change</p>
          <p className="font-bold text-lg">
            ${data.transactions.reduce((s, t) => s + t.amount, 0).toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase text-gray-400">Closing</p>
          <p className="font-bold text-lg">${data.closingBalance.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white shadow-sm">
            <tr className="text-left text-xs text-gray-500 uppercase">
              <th className="p-3">Date</th>
              <th className="p-3">Description</th>
              <th className="p-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.transactions.map((tx, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="p-3 whitespace-nowrap">{tx.date}</td>
                <td className="p-3">{tx.description}</td>
                <td
                  className={`p-3 text-right font-mono font-semibold flex items-center justify-end gap-2 ${tx.amount > 0 ? "text-green-600" : "text-gray-700"}`}
                >
                  {tx.amount > 0 ? (
                    <ArrowUp size={12} />
                  ) : (
                    <ArrowDown size={12} />
                  )}
                  {Math.abs(tx.amount).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t bg-gray-50 flex gap-3">
        <button className="flex-1 bg-red-500 text-white py-2 rounded">
          Reject Statement
        </button>
        <button className="flex-1 bg-blue-500 text-white py-2 rounded">
          Post All to Zoho
        </button>
      </div>
    </div>
  );
}
