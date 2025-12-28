import {
  Bell,
  ScanLine,
  PlusCircle,
  FileText,
  RefreshCw,
  ChevronDown,
} from "lucide-react";

export function HomeHeader() {
  return (
    <div className="bg-gradient-to-b from-brand-950 to-brand-900 text-white pt-12 pb-8 px-6 rounded-b-[32px] shadow-lg relative z-10">
      {/* Top Bar */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-400 to-brand-600 border-2 border-white/20 shadow-inner flex items-center justify-center font-bold text-sm">
            MA
          </div>
          <div>
            <p className="text-brand-200 text-xs font-medium">Welcome back,</p>
            <div className="flex items-center gap-1 cursor-pointer">
              <h1 className="text-lg font-bold">Muhammad Afaq</h1>
              <ChevronDown size={14} className="text-brand-300" />
            </div>
          </div>
        </div>

        <button className="relative p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/10">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-brand-900"></span>
        </button>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-4 gap-2">
        <QuickAction icon={ScanLine} label="Scan" active />
        <QuickAction icon={PlusCircle} label="Add Exp" />
        <QuickAction icon={FileText} label="Report" />
        <QuickAction icon={RefreshCw} label="Sync" />
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  active = false,
}: {
  icon: any;
  label: string;
  active?: boolean;
}) {
  return (
    <button className="flex flex-col items-center gap-2 group">
      <div
        className={`
        w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all active:scale-95
        ${
          active
            ? "bg-gradient-to-br from-brand-400 to-brand-600 border border-white/20 shadow-glow"
            : "bg-white/5 border border-white/10 hover:bg-white/10"
        }
      `}
      >
        <Icon size={20} />
      </div>
      <span className="text-[10px] font-medium text-brand-100 opacity-80 group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}
