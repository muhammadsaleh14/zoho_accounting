import type { BankStatementData } from "@receipt-app/shared";
// Dummy component for now
export const BankStatementView = ({ data }: { data: any }) => <div className="p-4">Bank Statement View Placeholder</div>;
// File: apps/web-plugin/src/components/NgrokImage.tsx
// File: apps/web-plugin/src/components/NgrokImage.tsx
import type { ImgHTMLAttributes } from 'react';
// This is a simplified version. For a production app with ngrok,
// you would need a more complex fetch-and-blob-URL solution
// to bypass browser security warnings. For local dev, this is fine.
export function NgrokImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  // Your backend should serve images from a static directory.
  // E.g., FastAPI's StaticFiles mount.
  // The `image_url` from the backend should be a relative path like `/images/filename.jpg`
  const fullSrc = `http://localhost:8000${props.src}`;
  return <img {...props} src={fullSrc} alt={props.alt || "Document Image"} />;
}
