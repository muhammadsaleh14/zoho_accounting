// File: apps/web-plugin/src/components/NgrokImage.tsx

import type { ImgHTMLAttributes } from "react";
import { API_BASE_URL } from "@/services/api";

export function NgrokImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  // 1. Log the props to see what we are receiving
  console.log("NgrokImage props:", props);

  if (!props.src) {
    console.error("NgrokImage Error: 'src' prop is missing or undefined.");
    return (
      <div
        className={`flex items-center justify-center bg-slate-800 text-yellow-400 p-4 ${props.className}`}
      >
        <span>'src' prop is missing. Check console.</span>
      </div>
    );
  }

  const serverRoot = API_BASE_URL.replace("/api/v1", "");
  const fullSrc = `${serverRoot}${props.src}`;

  // 2. Log the final URL we are trying to load
  // console.log("Attempting to load image from:", fullSrc);

  return (
    <img
      {...props}
      src={fullSrc}
      alt={props.alt || "Document Preview"}
      // 3. Add a detailed error logger
      onError={(e) => {
        console.error(`Failed to load image from: ${fullSrc}`);
        console.error("Image load error event:", e);
        (e.target as HTMLImageElement).outerHTML = `
          <div class="flex flex-col items-center justify-center bg-slate-800 text-red-400 p-4 ${props.className}">
            <span class="font-bold">Image Failed to Load</span>
            <span class="text-xs mt-2">Check browser console for errors (F12).</span>
            <span class="text-xs mt-1">URL: ${fullSrc}</span>
          </div>
        `;
      }}
    />
  );
}
