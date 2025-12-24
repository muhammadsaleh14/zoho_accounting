import {
  Bell,
  Search,
  HelpCircle,
  Menu,
  ShieldCheck,
  Upload
} from 'lucide-react';
import { useSearch } from '../context/SearchContext';

interface HeaderProps {
  onUploadClick: () => void;
  onMenuClick: () => void;
}

export function Header({ onUploadClick, onMenuClick }: HeaderProps) {
  const { searchQuery, setSearchQuery } = useSearch();

  return (
    <header className="h-20 glass-panel bg-white/70 border-b border-slate-200/50 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">

      {/* Left: Mobile Menu & Brand (Mobile Only) */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          onClick={onMenuClick}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-brand-500 p-1 rounded-md">
            <ShieldCheck size={14} className="text-white" />
          </div>
          <span className="font-black text-slate-900 text-sm tracking-tight">Zoho<span className="text-brand-600">Vault</span></span>
        </div>
      </div>

      {/* Left: Brand (Desktop Only) */}
      <div className="hidden lg:flex items-center gap-2 group cursor-pointer transition-all hover:opacity-80">
        <div className="bg-brand-500 p-1 rounded-md">
          <ShieldCheck size={14} className="text-white" />
        </div>
        <span className="font-black text-slate-900 text-sm tracking-tight">Zoho<span className="text-brand-600">Vault</span></span>
      </div>

      {/* Global Search - Hidden on Mobile for now, or simplified */}
      <div className="max-w-md w-full relative hidden md:block mx-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-2.5 bg-slate-100/50 border border-slate-200 rounded-2xl text-sm 
                     focus:bg-white focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Mobile Search Trigger (Optional) */}
        <button className="md:hidden p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl">
          <Search size={20} />
        </button>

        <button className="p-2.5 text-slate-500 hover:bg-brand-50 hover:text-brand-600 rounded-xl transition-all relative">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>

        <button className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-all hidden sm:block">
          <HelpCircle size={20} />
        </button>

        <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>

        <button
          onClick={onUploadClick}
          className="premium-button-glassy px-3 lg:px-4 py-3 rounded-2xl text-xs font-bold capitalize transition-all duration-300 border-2 flex items-center gap-2 group/btn"
        >
          <Upload size={18} className="text-brand-600 group-hover/btn:scale-110 transition-transform" />
          <span className="font-bold hidden sm:inline">Upload Document</span>
          <span className="font-bold sm:hidden">Upload</span>
        </button>
      </div>

    </header>
  );
}
