import { CheckCircle2, Calendar, FileText, ArrowRight } from "lucide-react";

interface Props {
  onDismiss: () => void;
  data?: any; // In a real app, type this properly
}

export function UploadSuccess({ onDismiss, data }: Props) {
  return (
    <div className="fixed inset-0 z-[70] bg-surface-50 flex flex-col animate-fade-in">
      {/* Top Section: Celebration */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-brand-50 to-surface-50">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm animate-slide-up">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2 text-center">
          Extraction Complete!
        </h2>
        <p className="text-sm text-slate-500 text-center max-w-xs">
          Our AI has successfully digitized your document with high confidence.
        </p>
      </div>

      {/* Bottom Section: The Data Card */}
      <div
        className="bg-white rounded-t-[40px] shadow-float p-8 pb-12 animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        {/* Confidence Meter */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            AI Confidence
          </span>
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
            98.5%
          </span>
        </div>

        {/* Invoice Summary Card */}
        <div className="bg-surface-50 border border-surface-200 rounded-2xl p-5 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <FileText size={80} />
          </div>

          <div className="space-y-4 relative z-10">
            <div>
              <p className="text-xs text-slate-400 mb-1">Vendor</p>
              <p className="text-lg font-bold text-slate-900">
                Uber Technologies Inc
              </p>
            </div>

            <div className="flex gap-8">
              <div>
                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                  <Calendar size={10} /> Date
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  Oct 24, 2025
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Total Amount</p>
                <p className="text-sm font-black text-slate-900">AED 45.50</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onDismiss}
          className="w-full bg-brand-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-200 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          Review & Approve <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
