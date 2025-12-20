import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";

// Mock data to make the client look "Healthy" for the demo
const data = [
  { name: "Jan", amount: 4000 },
  { name: "Feb", amount: 3000 },
  { name: "Mar", amount: 2000 },
  { name: "Apr", amount: 2780 },
  { name: "May", amount: 1890 },
  { name: "Jun", amount: 2390 },
  { name: "Jul", amount: 3490 },
];

export function ExpenseChart() {
  return (
    <div className="w-full h-40 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#fff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            interval={0}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
            }}
            itemStyle={{ color: "#fff" }}
            cursor={{ stroke: "rgba(255,255,255,0.2)" }}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#fff"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorAmount)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
