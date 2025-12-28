import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/services/api"; // Correctly import the base URL

interface Props {
  src: string;
  mimeType: string | null | undefined;
  className?: string;
}

export function DocumentPreview({ src, mimeType, className }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Construct the full URL to the backend's static file server
  const fullSrc = `${API_BASE_URL.replace("/api/v1", "")}${src}`;

  useEffect(() => {
    let active = true;
    const fetchFile = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await fetch(fullSrc, {
          headers: { "ngrok-skip-browser-warning": "true" },
        });
        if (!response.ok) throw new Error("File not found");
        const blob = await response.blob();
        if (active) {
          setObjectUrl(URL.createObjectURL(blob));
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading document preview:", err);
        if (active) setError(true);
        setLoading(false);
      }
    };

    if (src) fetchFile();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, fullSrc]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-slate-800 text-slate-500 ${className}`}>
        <span className="animate-pulse">Loading Preview...</span>
      </div>
    );
  }

  if (error || !objectUrl) {
    return (
      <div className={`flex items-center justify-center bg-slate-800 text-red-400 ${className}`}>
        <span>Preview Failed</span>
      </div>
    );
  }

  // --- THIS IS THE CORE LOGIC ---
  if (mimeType?.startsWith("image/")) {
    return <img src={objectUrl} className={className} alt="Document Preview" />;
  }

  if (mimeType === "application/pdf") {
    // For PDFs, use an iframe for native browser rendering
    return <iframe src={objectUrl} className={`w-full h-full border-none ${className}`} title="PDF Preview" />;
  }
  // --- END OF CORE LOGIC ---

  return (
    <div className={`flex items-center justify-center bg-slate-800 text-yellow-400 ${className}`}>
      <span>Unsupported file type: {mimeType}</span>
    </div>
  );
}
