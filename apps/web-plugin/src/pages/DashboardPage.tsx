import { useState } from "react";
import type { Invoice } from "@receipt-app/shared";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { DataTableView } from "../components/DataTableView";
import { Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function DashboardPage() {
  const navigate = useNavigate();

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: api.getInvoices,
  });

  const handleSelect = (invoice: Invoice) => {
    // Navigate to the dedicated review page
    navigate(`/review/${invoice.id}`);
  };

  return (
    <div className="flex h-full">
      {/* LEFT: Smart Sidebar */}
      <nav className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col flex-shrink-0">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
          Filters
        </h2>
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search vendor..."
            className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <div className="space-y-1">
          <a
            href="#"
            className="flex justify-between items-center p-2 rounded-md bg-blue-50 text-blue-700 font-bold"
          >
            All Documents{" "}
            <span className="bg-blue-100 text-blue-700 px-2 rounded-full text-xs">
              {invoices?.length || 0}
            </span>
          </a>
          <a
            href="#"
            className="flex justify-between items-center p-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            Bills & Receipts
          </a>
          <a
            href="#"
            className="flex justify-between items-center p-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            Bank Statements
          </a>
          <a
            href="#"
            className="flex justify-between items-center p-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            Sales Invoices
          </a>
        </div>
        {/* <div className="mt-auto pt-4 border-t border-gray-100">
          <button className="w-full flex items-center justify-center gap-2 p-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700 font-semibold">
            <Filter size={14} /> Advanced Filters
          </button>
        </div> */}
      </nav>

      {/* MIDDLE: Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Inbox</h1>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <DataTableView
            invoices={invoices || []}
            selectedId={null} // No selection highlight on this page
            onSelect={handleSelect}
          />
        )}
      </main>
    </div>
  );
}
