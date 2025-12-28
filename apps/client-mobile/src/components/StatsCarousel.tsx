import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

// Mock data for sparklines
const dataIncome = [
  { v: 10 },
  { v: 15 },
  { v: 12 },
  { v: 20 },
  { v: 25 },
  { v: 22 },
  { v: 30 },
];
const dataExpense = [
  { v: 20 },
  { v: 18 },
  { v: 25 },
  { v: 15 },
  { v: 10 },
  { v: 12 },
  { v: 8 },
];
const dataNet = [
  { v: 5 },
  { v: 8 },
  { v: 15 },
  { v: 12 },
  { v: 20 },
  { v: 25 },
  { v: 35 },
];

export function StatsCarousel() {
  return (
    <div className="flex overflow-x-auto gap-4 px-6 pb-6 -mt-4 no-scrollbar snap-x relative z-20">
      <StatCard
        title="Total Expenses"
        amount="$12,450"
        trend="+12%"
        isPositive={false}
        data={dataExpense}
        color="#ef4444"
      />
      <StatCard
        title="Net Cash Flow"
        amount="$8,200"
        trend="+5.4%"
        isPositive={true}
        data={dataNet}
        color="#10b981"
      />
      <StatCard
        title="Receivables"
        amount="$45,900"
        trend="+22%"
        isPositive={true}
        data={dataIncome}
        color="#0ea5e9"
      />
    </div>
  );
}

function StatCard({ title, amount, trend, isPositive, data, color }: any) {
  return (
    <div className="snap-center shrink-0 w-64 p-4 bg-surface-card rounded-2xl shadow-soft border border-surface-200 flex flex-col justify-between h-32 relative overflow-hidden">
      <div className="flex justify-between items-start z-10">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-surface-300">
            {title}
          </p>
          <h3 className="text-xl font-bold text-slate-900 mt-1">{amount}</h3>
        </div>
        <div
          className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
        >
          {isPositive ? (
            <ArrowUpRight size={10} />
          ) : (
            <ArrowDownRight size={10} />
          )}
          {trend}
        </div>
      </div>

      {/* Sparkline */}
      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              fill={color}
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
