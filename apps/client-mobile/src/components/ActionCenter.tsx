import {
  AlertCircle,
  FileSearch,
  ChevronRight,
  HelpCircle,
} from "lucide-react";

export function ActionCenter() {
  return (
    <div className="px-6 mb-24">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
        Needs Attention
      </h3>
      <div className="bg-surface-card rounded-2xl shadow-soft border border-surface-200 divide-y divide-surface-100 overflow-hidden">
        <ActionItem
          icon={FileSearch}
          color="text-amber-600 bg-amber-50"
          title="Documents to Review"
          count={5}
        />
        <ActionItem
          icon={AlertCircle}
          color="text-red-600 bg-red-50"
          title="Compliance Warnings"
          count={2}
        />
        <ActionItem
          icon={HelpCircle}
          color="text-slate-500 bg-slate-100"
          title="Uncategorized"
          count={14}
        />
      </div>
    </div>
  );
}

function ActionItem({ icon: Icon, color, title, count }: any) {
  return (
    <button className="w-full flex items-center justify-between p-4 hover:bg-surface-50 transition-colors group">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${color}`}>
          <Icon size={18} />
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-slate-700">{title}</p>
          <p className="text-[10px] text-slate-400">{count} items pending</p>
        </div>
      </div>
      <ChevronRight
        size={16}
        className="text-slate-300 group-hover:text-brand-500 transition-colors"
      />
    </button>
  );
}
