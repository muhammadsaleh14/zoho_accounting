import { Building2, Bell, UserCircle } from "lucide-react";

export function Header() {
  return (
    <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-6 shadow-md z-30 flex-shrink-0">
      {/* Brand / Logo */}
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-tight">
            <span className="text-blue-400">Finance</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            Client Portal Admin
          </p>
        </div>
      </div>

      {/* Right Side Tools */}
      <div className="flex items-center gap-4">
        {/* Org Switcher (Visual Only) */}
        <div className="hidden md:flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-medium text-slate-300">
            Sandbox Environment
          </span>
        </div>

        <button className="p-2 hover:bg-slate-800 rounded-full transition-colors relative">
          <Bell className="w-5 h-5 text-slate-300" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900"></span>
        </button>

        <div className="flex items-center gap-2 pl-4 border-l border-slate-700">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-200">Accountant View</p>
            <p className="text-xs text-slate-500">Admin Role</p>
          </div>
          <UserCircle className="w-9 h-9 text-slate-400" />
        </div>
      </div>
    </header>
  );
}
