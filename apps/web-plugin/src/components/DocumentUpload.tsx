// File: apps/web-plugin/src/components/DocumentUpload.tsx
import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { api } from "../services/api";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DocumentUploadProps {
  onClose?: () => void;
}

export function DocumentUpload({ onClose }: DocumentUploadProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("invoice"); // Default to invoice for tax invoice demo
  const [aiDetectedType, setAiDetectedType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (vars: { file: File; category: string }) =>
      api.uploadReceipt(vars.file, vars.category),
    onSuccess: (data) => {
      // Invalidate queries to refresh the dashboard/vault in the background
      queryClient.invalidateQueries({ queryKey: ["invoices"] });

      console.log("Upload successful:", data);

      // Redirect user to the review page for the newly uploaded doc
      // NOTE: Your backend needs to return the 'id' of the created document record.
      // We'll assume it does for now.
      if (data && data.id) {
        navigate(`/review/${data.id}`);
      }

      // Close the modal
      if (onClose) onClose();
    },
    onError: (error) => {
      console.error("Upload failed:", error);
      alert("Upload failed. Please check the console for details.");
    },
  });

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      
      // Auto-detect document type based on filename
      const fileName = droppedFile.name.toLowerCase();
      let detectedType = "invoice"; // Default to invoice for tax invoice demo
      
      if (fileName.includes('bill') || fileName.includes('expense')) {
        detectedType = "bill";
      } else if (fileName.includes('bank') || fileName.includes('statement')) {
        detectedType = "bank_statement";
      }
      
      setAiDetectedType(detectedType);
      // Update the document type if AI detects something different
      if (detectedType !== docType) {
        setDocType(detectedType);
      }
    }
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Auto-detect document type based on filename
      const fileName = selectedFile.name.toLowerCase();
      let detectedType = "invoice"; // Default to invoice for tax invoice demo
      
      if (fileName.includes('bill') || fileName.includes('expense')) {
        detectedType = "bill";
      } else if (fileName.includes('bank') || fileName.includes('statement')) {
        detectedType = "bank_statement";
      }
      
      setAiDetectedType(detectedType);
      // Update the document type if AI detects something different
      if (detectedType !== docType) {
        setDocType(detectedType);
      }
    }
  };

  const handleUpload = () => {
    if (!file) return;
    uploadMutation.mutate({ file, category: docType });
  };

  return (
    <div className="glass-card p-6 lg:p-8 animate-fade-in max-w-xl w-full mx-auto relative overflow-hidden">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Upload Document
        </h2>
        <p className="text-sm text-slate-500 font-medium">
          Securely submit your financial documents for processing.
        </p>
      </div>

      {!file ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer py-8 lg:py-12 border-2 border-dashed rounded-3xl transition-all duration-500 group ${dragActive ? "border-brand-500 bg-brand-50/80" : "border-slate-200 hover:border-brand-400"}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleChange}
          />
          <div className="flex flex-col items-center text-center px-6">
            <div className="p-5 rounded-2xl mb-4 bg-brand-50 text-brand-500 group-hover:scale-110 transition-transform">
              <Upload size={32} />
            </div>
            <p className="text-sm font-bold text-slate-800">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Maximum file size 50MB. PDFs preferred.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-white p-2 rounded-xl text-brand-600 shadow-sm">
                <FileText size={24} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">
                  {file.name}
                </p>
                <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={() => setFile(null)}
              className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div>
            <label className="zoho-label">Document Type</label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {["bill", "invoice", "bank_statement"].map((type) => (
                <button
                  key={type}
                  onClick={() => setDocType(type)}
                  className={`px-4 py-3 rounded-2xl text-xs font-bold capitalize transition-all duration-300 border-2 ${docType === type ? "bg-brand-600 text-white border-brand-600" : "bg-white text-slate-500 border-slate-100 hover:border-brand-200"} ${aiDetectedType === type && aiDetectedType !== docType ? "ring-2 ring-brand-400 ring-offset-2" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    {type.replace("_", " ")}
                    {aiDetectedType === type && aiDetectedType !== docType && (
                      <span className="bg-amber-100 text-amber-700 text-[9px] px-2 py-0.5 rounded font-bold">AI Detected</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={uploadMutation.isPending}
            className="w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 premium-button-primary disabled:opacity-50"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Processing...
              </>
            ) : (
              <>
                <Upload size={20} /> Initiate Document Submission
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
