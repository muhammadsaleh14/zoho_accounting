import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, Loader2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Progress } from '../components/ui/Progress';
import { Badge } from '../components/ui/Badge';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/Alert';
import { Separator } from '../components/ui/Separator';

type Step = 'upload' | 'analyzing' | 'result';

export function CompliancePage() {
    const [step, setStep] = useState<Step>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [progress, setProgress] = useState(0);
    const [analysisStatus, setAnalysisStatus] = useState("Initializing...");

    // Simulated Simulation Data
    const [resultType, setResultType] = useState<'success' | 'fail' | null>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            // For demo: If filename contains "fail", trigger fail scenario
            if (e.target.files[0].name.toLowerCase().includes('fail')) {
                setResultType('fail');
            } else {
                setResultType('success');
            }
            startAnalysis();
        }
    };

    const startAnalysis = () => {
        setStep('analyzing');
        setProgress(0);

        // Animate progress
        const stages = [
            { p: 10, msg: "Uploading document..." },
            { p: 30, msg: "OCR: Extracting text..." },
            { p: 50, msg: "Reading vendor details..." },
            { p: 70, msg: "Validating TRN against Federal Tax Authority..." },
            { p: 85, msg: "Checking VAT calculation logic..." },
            { p: 100, msg: "Compliance verification complete." }
        ];

        let currentStage = 0;

        // Simulate steps
        const interval = setInterval(() => {
            if (currentStage >= stages.length) {
                clearInterval(interval);
                setTimeout(() => setStep('result'), 500);
                return;
            }

            const stage = stages[currentStage];
            setProgress(stage.p);
            setAnalysisStatus(stage.msg);
            currentStage++;
        }, 1000);
    };

    const reset = () => {
        setFile(null);
        setStep('upload');
        setProgress(0);
        setResultType(null);
    };

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 animate-fade-in-up">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <ShieldCheck className="text-brand-600" size={32} />
                    Compliance Check
                </h1>
                <p className="text-slate-500 mt-2 text-lg">
                    Upload invoices to verify GCC VAT compliance before pushing to Zoho.
                </p>
            </div>

            {/* STAGE 1: UPLOAD */}
            {step === 'upload' && (
                <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="bg-white p-6 rounded-full shadow-sm mb-6">
                            <Upload className="text-brand-600 w-12 h-12" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Upload Invoice or Bill</h3>
                        <p className="text-slate-500 max-w-md mb-8">
                            Drag and drop your PDF or Image here, or click to browse.
                            We support UAE & KSA tax invoices.
                        </p>

                        <div className="relative">
                            <input
                                type="file"
                                onChange={handleFile}
                                accept=".pdf,.png,.jpg,.jpeg"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Button size="lg" className="nav-item-active">
                                Select Document
                            </Button>
                        </div>
                        <p className="text-xs text-slate-400 mt-4">
                            Tip: Rename file to include "fail" to test rejection scenario.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* STAGE 2: ANALYZING */}
            {step === 'analyzing' && (
                <Card>
                    <CardContent className="py-20 max-w-xl mx-auto text-center space-y-6">
                        <div className="relative w-20 h-20 mx-auto">
                            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-brand-600 rounded-full border-t-transparent animate-spin"></div>
                            <ShieldCheck className="absolute inset-0 m-auto text-brand-600 w-8 h-8 animate-pulse" />
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Analyzing Document</h3>
                            <p className="text-brand-600 font-medium">{analysisStatus}</p>
                        </div>

                        <Progress value={progress} className="h-2" />

                        <p className="text-sm text-slate-400">
                            AI Engine v2.1 • Local Processing
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* STAGE 3: RESULT */}
            {step === 'result' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Left: Document Preview (Simplified) */}
                    <Card className="h-fit">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText size={18} /> {file?.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 bg-slate-100/50 min-h-[400px] flex items-center justify-center">
                            <div className="text-center text-slate-400">
                                <FileText size={64} className="mx-auto mb-4 opacity-20" />
                                <p>Document Preview</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right: Extraction & Validation */}
                    <div className="space-y-6">

                        {/* Status Banner */}
                        {resultType === 'success' ? (
                            <Alert variant="success" className="bg-emerald-50 border-emerald-200">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                <AlertTitle className="text-emerald-800 font-bold">Compliance Verified</AlertTitle>
                                <AlertDescription className="text-emerald-700">
                                    This document meets all UAE VAT requirements. Data extracted successfully.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Alert variant="destructive" className="bg-red-50 border-red-200">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                <AlertTitle className="text-red-800 font-bold">Compliance Issues Detected</AlertTitle>
                                <AlertDescription className="text-red-700">
                                    This document is missing specific mandatory fields required for tax claims.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Extracted Data Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Extracted Data</CardTitle>
                                <CardDescription>AI-identified fields for Zoho Books</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Vendor</label>
                                        <div className="font-semibold text-slate-900 border p-2 rounded-md bg-white">
                                            {resultType === 'success' ? 'Emirates Telecommunications' : 'Unknown Vendor'}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Date</label>
                                        <div className="font-semibold text-slate-900 border p-2 rounded-md bg-white">
                                            Dec 24, 2025
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Tax Registration Number (TRN)</label>
                                    <div className={`font-semibold text-slate-900 border p-2 rounded-md flex justify-between items-center ${resultType === 'fail' ? 'border-red-300 bg-red-50' : 'bg-white'}`}>
                                        {resultType === 'success' ? '100293847560003' : 'MISSING / UNREADABLE'}
                                        {resultType === 'fail' && <Badge variant="destructive">REQUIRED</Badge>}
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase">Subtotal</label>
                                        <div className="font-medium">AED 450.00</div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase">VAT (5%)</label>
                                        <div className="font-medium">AED 22.50</div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase">Total</label>
                                        <div className="font-bold text-lg text-emerald-600">AED 472.50</div>
                                    </div>
                                </div>

                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <Button variant="outline" className="flex-1" onClick={reset}>
                                <X size={16} className="mr-2" /> Discard
                            </Button>
                            <Button className="flex-1 bg-brand-600 hover:bg-brand-700" disabled={resultType === 'fail'}>
                                Push to Zoho Books <ArrowRight size={16} className="ml-2" />
                            </Button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
