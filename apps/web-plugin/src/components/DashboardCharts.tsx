// File: apps/web-plugin/src/components/DashboardCharts.tsx
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total Assets / Cash Snapshot */}
      <div className="glass-card p-6 flex flex-col justify-between overflow-hidden relative group">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-500/5 rounded-full blur-2xl group-hover:bg-brand-500/10 transition-all"></div>
        <div className="flex justify-between items-start mb-4">
          <div className="bg-brand-50 p-3 rounded-2xl">
            <TrendingUp size={24} className="text-brand-600" />
          </div>
          <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
            <ArrowUpRight size={14} /> +12.5%
          </span>
        </div>
        <div>
          <p className="zoho-label">Available Cash</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            AED 124,550.00
          </h3>
          <p className="text-[10px] text-slate-400 font-medium mt-1">
            Updated 2 mins ago
          </p>
        </div>
      </div>

      {/* Payables Snapshot */}
      <div className="glass-card p-6 flex flex-col justify-between overflow-hidden relative group">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all"></div>
        <div className="flex justify-between items-start mb-4">
          <div className="bg-rose-50 p-3 rounded-2xl">
            <TrendingDown size={24} className="text-rose-600" />
          </div>
          <span className="flex items-center gap-1 text-rose-600 text-xs font-bold bg-rose-50 px-2 py-1 rounded-lg">
            <ArrowDownRight size={14} /> -5.2%
          </span>
        </div>
        <div>
          <p className="zoho-label">Accounts Payable</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            AED 42,300.25
          </h3>
          <p className="text-[10px] text-slate-400 font-medium mt-1">
            Pending approval: 8 docs
          </p>
        </div>
      </div>

      {/* Compliance / Activity Health */}
      <div className="glass-card p-6 flex flex-col justify-between overflow-hidden relative group">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
        <div className="flex justify-between items-start mb-4">
          <div className="bg-emerald-50 p-3 rounded-2xl">
            <Activity size={24} className="text-emerald-600" />
          </div>
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg">
            Healthy
          </span>
        </div>
        <div>
          <p className="zoho-label">Compliance Health</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            94%
          </h3>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
              style={{ width: "94%" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
