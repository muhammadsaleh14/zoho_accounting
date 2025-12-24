import React from "react";
import { useAppContext } from "../context/AppContext";
import LineItems from "./LineItems";

const BillDetails = () => {
  const { extractedData, setExtractedData, handleApproveBill } =
    useAppContext();

  if (!extractedData) return null;

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setExtractedData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  return (
    <div className="bill-form">
      {extractedData.warning_message && (
        <div className="warning">{extractedData.warning_message}</div>
      )}

      {/* Vendor Section - This could be its own component */}
      <fieldset>
        <legend>Vendor Details</legend>
        <input
          name="vendor.name"
          value={extractedData.vendor?.name || ""}
          readOnly
        />
        <input
          name="vendor.trn"
          value={extractedData.vendor?.trn || ""}
          readOnly
          placeholder="TRN"
        />
      </fieldset>

      {/* Header Details Section */}
      <fieldset>
        <legend>Bill Details</legend>
        <div className="form-grid">
          <label>Bill #</label>
          <input
            name="invoice_number"
            value={extractedData.invoice_number || ""}
            onChange={handleHeaderChange}
          />
          <label>Reference #</label> {/* NEW FIELD */}
          <input
            name="reference_number"
            value={extractedData.reference_number || ""}
            onChange={handleHeaderChange}
            placeholder="e.g., PO Number"
          />
          <label>Bill Date</label>
          <input
            type="date"
            name="date"
            value={extractedData.date || ""}
            onChange={handleHeaderChange}
          />
          <label>Due Date</label>
          <input
            type="date"
            name="due_date"
            value={extractedData.due_date || ""}
            onChange={handleHeaderChange}
          />
          <label>Subject</label> {/* NEW FIELD */}
          <input
            name="subject"
            value={extractedData.subject || ""}
            onChange={handleHeaderChange}
          />
        </div>
      </fieldset>

      {/* Line Items Table */}
      <LineItems />

      {/* Totals Section */}
      <fieldset>
        <legend>Totals</legend>
        <div className="form-grid">
          <label>Discount</label> {/* NEW FIELD */}
          <input
            type="number"
            name="discount"
            value={extractedData.discount || 0}
            onChange={handleHeaderChange}
          />
          <label>Tax</label>
          <input type="number" readOnly value={extractedData.tax_amount || 0} />
          <label>Total</label>
          <input
            type="number"
            readOnly
            value={extractedData.total_amount || 0}
          />
        </div>
      </fieldset>

      {/* Action Buttons */}
      <div className="actions">
        <button className="approve-btn" onClick={handleApproveBill}>
          Approve & Sync to Zoho
        </button>
        <button className="cancel-btn" onClick={() => setExtractedData(null)}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default BillDetails;
