import { useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const data = [
  { name: "Jan", expense: 4000, income: 6000 },
  { name: "Feb", expense: 3000, income: 5500 },
  { name: "Mar", expense: 2000, income: 7000 },
  { name: "Apr", expense: 2780, income: 6800 },
  { name: "May", expense: 1890, income: 8000 },
  { name: "Jun", expense: 2390, income: 7500 },
];

export function ExpenseChart() {
  const [range, setRange] = useState("6M");

  return (
    <div className="px-6 mb-6">
      <div className="bg-surface-card p-5 rounded-3xl shadow-soft border border-surface-200">
        {/* Header & Controls */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Cash Flow Analysis
            </h3>
            <p className="text-[10px] text-slate-400">Income vs Expenses</p>
          </div>
          <div className="flex bg-surface-100 p-0.5 rounded-lg">
            {["1M", "3M", "6M", "YTD"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                  range === r
                    ? "bg-white shadow-sm text-brand-600"
                    : "text-slate-400"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                dy={10}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 10px 30px -5px rgba(0,0,0,0.1)",
                }}
                labelStyle={{
                  color: "#64748b",
                  fontSize: "12px",
                  marginBottom: "4px",
                }}
              />
              <Bar
                dataKey="expense"
                barSize={8}
                fill="#cbd5e1"
                radius={[4, 4, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#0ea5e9"
                strokeWidth={3}
                dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
