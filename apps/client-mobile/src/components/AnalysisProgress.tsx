import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Scan,
  FileSearch,
  ShieldCheck,
  CloudUpload,
} from "lucide-react";

const steps = [
  { id: 1, label: "Uploading securely...", icon: CloudUpload },
  { id: 2, label: "Scanning document (OCR)", icon: Scan },
  { id: 3, label: "Extracting line items", icon: FileSearch },
  { id: 4, label: "Verifying VAT compliance", icon: ShieldCheck },
];

export function AnalysisProgress() {
  const [currentStep, setCurrentStep] = useState(1);

  // Simulate progress for the visual effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < 5 ? prev + 1 : prev));
    }, 800); // Change step every 800ms
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-all duration-500" />

      <div className="relative w-full max-w-sm bg-surface-card/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4 relative">
            <div className="absolute inset-0 border-4 border-brand-100 rounded-full animate-ping opacity-20"></div>
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            AI Analysis Running
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Processing your document...
          </p>
        </div>

        <div className="space-y-6 relative pl-4">
          {/* Vertical Line */}
          <div className="absolute left-[27px] top-2 bottom-4 w-0.5 bg-surface-200" />

          {steps.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className="relative flex items-center gap-4 z-10"
              >
                <div
                  className={`
                  w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500
                  ${
                    isCompleted
                      ? "bg-green-500 border-green-500 text-white"
                      : isCurrent
                        ? "bg-white border-brand-500 text-brand-600 shadow-glow scale-110"
                        : "bg-surface-100 border-surface-200 text-surface-300"
                  }
                `}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Icon size={14} />
                  )}
                </div>
                <span
                  className={`text-sm font-medium transition-colors duration-300 ${isCurrent || isCompleted ? "text-slate-800" : "text-slate-400"}`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
