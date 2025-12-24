import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { DashboardCharts } from "../components/DashboardCharts";
import {
  FileCheck,
  FileClock,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import type { Invoice } from "@receipt-app/shared";

export function DashboardPage() {
  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: api.getInvoices,
  });

  const recentDocs = invoices?.slice(0, 5) || [];

  return (
    <div className="max-w-6xl mx-auto py-2 lg:py-4">

      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 lg:mb-10 gap-4">
        <div>
          <h1 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tight">Welcome back, Mohamed</h1>
          <p className="text-sm lg:text-base text-slate-500 mt-2 font-medium">Your financial ecosystem is looking healthy. <span className="text-brand-600">8 documents</span> need your attention.</p>
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <button className="premium-button-secondary bg-white flex-1 lg:flex-none justify-center">View Statistics</button>
          <button className="premium-button-primary flex-1 lg:flex-none justify-center">Create New Report</button>
        </div>
      </div>

      {/* Financial Snapshots */}
      <DashboardCharts />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mt-6">

        {/* Recent Documents Table - Left (Spans 2) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base lg:text-lg font-bold text-slate-800">Recent Document Activity</h2>
            <button className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-all">
              View All Vault <ChevronRight size={14} />
            </button>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-4 lg:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Document</th>
                    <th className="px-4 lg:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-4 lg:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-4 lg:px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={4} className="px-6 py-4 h-12 bg-slate-50/50"></td>
                      </tr>
                    ))
                  ) : recentDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-all group cursor-pointer">
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-100 p-2 rounded-xl group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                            <FileClock size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{doc.vendor}</p>
                            <p className="text-[10px] text-slate-400 font-medium">#{doc.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        {doc.status === 'review' ? (
                          <span className="status-badge-yellow flex items-center gap-1 w-fit">
                            <AlertCircle size={10} /> Pending
                          </span>
                        ) : (
                          <span className="status-badge-green flex items-center gap-1 w-fit">
                            <FileCheck size={10} /> Compliant
                          </span>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-xs font-semibold text-slate-600">{doc.date}</td>
                      <td className="px-4 lg:px-6 py-4 text-sm font-black text-slate-900 text-right">
                        {doc.currency} {doc.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Status Snapshots - Right */}
        <div className="space-y-6">
          <h2 className="text-base lg:text-lg font-bold text-slate-800">Account Health</h2>

          <div className="glass-card p-6 border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                <FileCheck size={20} />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Compliance Audit</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Direct audit of your last 50 documents shows 98% TRN compliance. No immediate action required.
            </p>
            <button className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 hover:underline">
              Download Report <ExternalLink size={12} />
            </button>
          </div>

          <div className="glass-card p-6 border-l-4 border-l-amber-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-50 p-2 rounded-lg text-amber-600">
                <FileClock size={20} />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Pending Review</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              You have 8 documents waiting for internal bookkeeping review. Estimated completion: <span className="font-bold text-slate-700">24 hours</span>.
            </p>
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                  {i}
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                +5
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
