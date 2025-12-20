import { ArrowDown, ArrowUp } from "lucide-react";

interface StatCardProps {
  title: string;
  amount: number;
  icon: "receivable" | "payable";
}

function StatCard({ title, amount, icon }: StatCardProps) {
  const isReceivable = icon === "receivable";
  return (
    <div
      className={`p-4 rounded-2xl flex items-start gap-4 ${
        isReceivable ? "bg-green-500 text-white" : "bg-red-500 text-white"
      }`}
    >
      <div className="bg-white/20 p-2 rounded-lg">
        {isReceivable ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
          {title}
        </p>
        <p className="text-xl font-bold mt-1">${amount.toLocaleString()}</p>
      </div>
    </div>
  );
}

export function StatsGrid() {
  // For the MVP, we use MOCK data.
  // In production, you would fetch this from Zoho's 'dashboard' or 'reports' API.
  const totalReceivables = 45500;
  const totalPayables = 12750;

  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard
        title="Receivables"
        amount={totalReceivables}
        icon="receivable"
      />
      <StatCard title="Payables" amount={totalPayables} icon="payable" />
    </div>
  );
}
