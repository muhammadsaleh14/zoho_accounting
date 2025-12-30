import { useState, useEffect, type ImgHTMLAttributes } from "react";
import { API_BASE_URL } from "@/services/api";

export function NgrokImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Only run this effect when the src prop changes
  useEffect(() => {
    if (!props.src) {
      setLoading(false);
      setError(true);
      return;
    }

    // We need a flag to prevent state updates if the component unmounts
    // while the fetch is in progress.
    let isCancelled = false;

    const serverRoot = API_BASE_URL.replace("/api/v1", "");
    const fullSrc = `${serverRoot}${props.src}`;

    const fetchImage = async () => {
      setLoading(true);
      setError(false);

      try {
        // 1. FETCH the image using JS, which allows custom headers
        const response = await fetch(fullSrc, {
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        // 2. Convert the response data to a blob
        const imageBlob = await response.blob();

        if (!isCancelled) {
          // 3. Create a temporary local URL for the blob
          const localUrl = URL.createObjectURL(imageBlob);
          setObjectUrl(localUrl);
        }
      } catch (err) {
        console.error("NgrokImage fetch error:", err);
        if (!isCancelled) {
          setError(true);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchImage();

    // 4. CLEANUP: When the component unmounts or src changes,
    // revoke the old object URL to prevent memory leaks.
    return () => {
      isCancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
    // We add objectUrl to the dependency array to trigger cleanup correctly.
  }, [props.src]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-800 text-slate-400 ${props.className}`}
      >
        Loading...
      </div>
    );
  }

  if (error || !objectUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-800 text-red-400 ${props.className}`}
      >
        Preview Failed
      </div>
    );
  }

  // 5. RENDER the img tag with the temporary blob URL
  return (
    <img
      {...props}
      src={objectUrl} // Use the local blob URL, not the original ngrok URL
      alt={props.alt || "Document Preview"}
    />
  );
}
