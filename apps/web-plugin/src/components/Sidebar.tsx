import {
  Bell,
  Search,
  HelpCircle,
  Menu,
  ShieldCheck,
  Upload
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronRight,
  Package,
  X // Import X for close button
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Package, label: "Document Vault", path: "/vault" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed lg:sticky top-0 h-screen w-72 glass-panel flex flex-col z-50 transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0 " : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Brand Section */}
        <div className="p-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5 px-3 py-3 rounded-2xl bg-slate-900 shadow-xl shadow-slate-900/10 text-white transition-all hover:scale-[1.02] border border-white/10 w-full lg:w-auto">
            <div className="bg-brand-500 p-2 rounded-xl">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-black leading-none tracking-tight">Zoho<span className="text-brand-400">Vault</span></h1>
              <p className="text-[8px] text-slate-400 font-bold tracking-[0.1em] uppercase mt-0.5 opacity-80">Compliance Intelligence</p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 py-8 space-y-2 overflow-y-auto">
          <p className="zoho-label px-4 text-black mb-4">Main Menu</p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => onClose()} // Close on navigation (mobile)
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                  ? "bg-brand-50 text-brand-600 shadow-sm shadow-brand-100"
                  : "text-black hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    size={20}
                    className={`transition-colors ${isActive ? "text-brand-600" : "text-slate-400 group-hover:text-slate-900"}`}
                  />
                  <span className="text-sm font-semibold">{item.label}</span>
                </div>
                {isActive && <ChevronRight size={14} className="text-brand-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Account Info */}
        <div className="p-6 mt-auto">
          <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 mb-4 items-center flex gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-500 font-bold">
              MS
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">Muhammad Afaq </p>
              <p className="text-[10px] text-slate-500 font-medium truncate italic">Premium Client</p>
            </div>
          </div>

          <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all font-semibold text-sm">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
