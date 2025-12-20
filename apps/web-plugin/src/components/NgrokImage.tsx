import { useState, useEffect } from "react";

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

export function NgrokImage({ src, className, ...props }: Props) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true; // Prevent setting state if component unmounts

    const fetchImage = async () => {
      try {
        setLoading(true);
        setError(false);

        // 1. Fetch the image manually so we can add headers
        const response = await fetch(src, {
          headers: {
            // This tells Ngrok "I am a developer/program", skip the warning page
            "ngrok-skip-browser-warning": "69420",
            // If you added API Key auth later, add it here too:
            // "x-api-key": "your-secret"
          },
        });

        if (!response.ok) throw new Error("Failed to load");

        // 2. Convert the response to a Blob (Binary Large Object)
        const blob = await response.blob();

        // 3. Create a local URL for that blob (e.g. blob:http://localhost...)
        const objectUrl = URL.createObjectURL(blob);

        if (active) {
          setImageSrc(objectUrl);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading Ngrok image:", err);
        if (active) {
          setError(true);
          setLoading(false);
        }
      }
    };

    if (src) {
      fetchImage();
    }

    // Cleanup memory when component unmounts or src changes
    return () => {
      active = false;
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-800 text-gray-500 ${className}`}
      >
        <span className="animate-pulse">Loading Image...</span>
      </div>
    );
  }

  if (error || !imageSrc) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-800 text-red-400 ${className}`}
      >
        <span>Failed to load</span>
      </div>
    );
  }

  return <img src={imageSrc} className={className} {...props} />;
}
