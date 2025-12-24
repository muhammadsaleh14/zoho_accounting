import React from "react";
import { useAppContext } from "../context/AppContext";
import type { Account } from "../types";

// This is the key component with the new dropdown
const LineItemRow = ({ index }: { index: number }) => {
  const { extractedData, accounts, updateLineItem } = useAppContext();
  const line = extractedData!.line_items[index];

  const handleLineChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const parsedValue =
      name === "rate" || name === "quantity" ? parseFloat(value) : value;
    updateLineItem(index, { [name]: parsedValue });
  };

  return (
    <tr>
      <td>
        <input
          name="description"
          value={line.description}
          onChange={handleLineChange}
        />
      </td>
      <td>
        <select
          name="accountId"
          value={line.accountId || ""}
          onChange={handleLineChange}
        >
          <option value="" disabled>
            -- Select Account --
          </option>
          {accounts.map((acc: Account) => (
            <option key={acc.account_id} value={acc.account_id}>
              {acc.account_name} ({acc.account_code})
            </option>
          ))}
        </select>
      </td>
      <td>
        <input
          type="number"
          name="quantity"
          value={line.quantity}
          onChange={handleLineChange}
        />
      </td>
      <td>
        <input
          type="number"
          name="rate"
          value={line.rate}
          onChange={handleLineChange}
        />
      </td>
      <td>{(line.quantity * line.rate).toFixed(2)}</td>
    </tr>
  );
};

const LineItems = () => {
  const { extractedData } = useAppContext();

  if (!extractedData) return null;

  return (
    <fieldset>
      <legend>Line Items</legend>
      <table className="line-items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Account</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {extractedData.line_items.map((_, index) => (
            <LineItemRow key={index} index={index} />
          ))}
        </tbody>
      </table>
    </fieldset>
  );
};

export default LineItems;
