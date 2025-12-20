import { FileText, Download } from "lucide-react";

interface ReportProps {
  title: string;
  date: string;
  url: string;
}

export function ReportCard({ title, date, url }: ReportProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3 active:bg-gray-50 transition-colors no-underline group"
    >
      {/* Icon Box */}
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-500">
        <FileText size={18} />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-800 truncate text-sm">{title}</h3>
        <p className="text-xs text-gray-400 mt-0.5">Generated: {date}</p>
      </div>

      {/* Action */}
      <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
        <Download size={18} />
      </div>
    </a>
  );
}
