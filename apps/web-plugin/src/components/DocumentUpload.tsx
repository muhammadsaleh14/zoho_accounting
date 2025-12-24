import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import {
    Upload,
    FileText,
    X,
    CheckCircle2,
    FileType,
    Loader2
} from "lucide-react";

interface DocumentUploadProps {
    onClose?: () => void;
    onUploadComplete?: (doc: any) => void;
}

export function DocumentUpload({ onClose, onUploadComplete }: DocumentUploadProps) {
    const queryClient = useQueryClient();
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [docType, setDocType] = useState('invoice');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.target instanceof HTMLInputElement && e.target.files && e.target.files[0]) {
            // handled by drop
        }
        const dt = e.dataTransfer;
        if (dt.files && dt.files[0]) {
            validateAndSetFile(dt.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (f: File) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(f.type) || f.name.endsWith('.docx')) {
            setFile(f);
            setUploadStatus('idle');
        } else {
            alert("Invalid file format. Please upload PDF, JPEG, PNG, or Word.");
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);

        try {
            // Processing step 1: Real API Call
            const uploadedDoc = await api.uploadReceipt(file, docType);

            // Invalidate queries to refresh Dashboard/Vault
            queryClient.invalidateQueries({ queryKey: ["invoices"] });

            setUploadStatus('success');
            setTimeout(() => {
                if (onUploadComplete) onUploadComplete(uploadedDoc);
                if (onClose) onClose();
            }, 1000);
        } catch (err) {
            console.error("Upload failed:", err);
            setUploadStatus('error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="glass-card p-6 lg:p-8 animate-fade-in max-w-xl w-full mx-auto relative overflow-hidden">
            {onClose && (
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                </button>
            )}

            <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Upload Document</h2>
                <p className="text-sm text-slate-500 font-medium">Securely submit your financial documents for processing.</p>
            </div>

            {!file ? (
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
            relative cursor-pointer py-8 lg:py-12 border-2 border-dashed rounded-3xl transition-all duration-500 group
            ${dragActive
                            ? "border-brand-500 bg-brand-50/80 scale-[1.02] shadow-2xl shadow-brand-500/10"
                            : "border-slate-200 hover:border-brand-400 hover:bg-slate-50/80 hover:shadow-xl hover:shadow-slate-200/50"
                        }
          `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.docx"
                        onChange={handleChange}
                    />
                    <div className="flex flex-col items-center text-center px-6">
                        <div className={`
              p-5 rounded-2xl mb-4 transition-all duration-500
              ${file ? "bg-emerald-100 text-emerald-600 rotate-0 scale-110" : "bg-brand-50 text-brand-500 group-hover:scale-110 group-hover:rotate-3"}
            `}>
                            <Upload size={32} />
                        </div>
                        <p className="text-sm font-bold text-slate-800">Click to upload or drag and drop</p>
                        <p className="text-xs text-slate-400 mt-2">Maximum file size 50MB. PDFs preferred.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-xl text-brand-600 shadow-sm">
                                <FileText size={24} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{file.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1] || 'DOCX'}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setFile(null)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <div>
                        <label className="zoho-label">Document Type</label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            {['invoice', 'receipt', 'bank_statement', 'other'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setDocType(type)}
                                    className={`
                px-4 py-3 rounded-2xl text-xs font-bold capitalize transition-all duration-300 border-2 cursor-pointer
                ${docType === type
                                            ? "bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-500/30 scale-[1.02]"
                                            : "bg-white text-slate-500 border-slate-100 hover:border-brand-200 hover:text-brand-600 hover:bg-brand-50 hover:shadow-md hover:-translate-y-0.5"
                                        }
              `}
                                >
                                    {type.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className={`
              w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2
              ${uploading
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-slate-200"
                                : "premium-button-primary"
                            }
            `}
                    >
                        {uploading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Processing...
                            </>
                        ) : (
                            uploadStatus === 'success' ? (
                                <>
                                    <CheckCircle2 size={20} />
                                    Document Securely Uploaded
                                </>
                            ) : (
                                <>
                                    <Upload size={20} />
                                    Initiate Document Submission
                                </>
                            )
                        )}
                    </button>

                    {uploadStatus === 'success' && (
                        <p className="text-center text-[10px] text-emerald-600 font-bold uppercase tracking-widest animate-fade-in">
                            Verification started. You will be notified shortly.
                        </p>
                    )}
                </div>
            )}

            {/* Security Disclaimer */}
            <div className="mt-8 flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <FileType size={16} className="text-slate-400" />
                <p className="text-[10px] text-slate-500 leading-tight">
                    Your documents are encrypted and processed in compliance with UAE Federal Tax Authority requirements.
                </p>
            </div>
        </div>
    );
}
