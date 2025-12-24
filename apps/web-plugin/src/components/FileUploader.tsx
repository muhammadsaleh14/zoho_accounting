import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";

const FileUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const { handleFileUpload } = useAppContext();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const onUpload = () => {
    if (file) {
      // For now, we hardcode the category to "bill"
      handleFileUpload(file, "bill");
    }
  };

  return (
    <div className="uploader">
      <h2>Upload a Bill or Receipt</h2>
      <input
        type="file"
        onChange={onFileChange}
        accept="image/*,application/pdf"
      />
      <button onClick={onUpload} disabled={!file}>
        Analyze Document
      </button>
    </div>
  );
};

export default FileUploader;
