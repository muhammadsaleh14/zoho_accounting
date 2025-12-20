import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { ComplianceWorkspace } from "./components/ComplianceWorkspace";
import { Header } from "./components/Header";
import type { Invoice } from "@receipt-app/shared";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

function App() {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* 1. Header */}
      <Header />

      {/* 2. Main Layout Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* LEFT DOCK (Contains Sidebar + Toggle) */}
        <div
          className={`
            flex flex-col border-r border-slate-200 bg-white shadow-xl z-20 flex-shrink-0 transition-all duration-300 ease-in-out
            ${isSidebarOpen ? "w-80" : "w-12"} 
          `}
        >
          {/* A. The Control Strip (Always Visible) */}
          <div
            className={`
            h-12 border-b border-slate-100 flex items-center 
            ${isSidebarOpen ? "justify-end px-4" : "justify-center"}
          `}
          >
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-colors"
              title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {isSidebarOpen ? (
                <PanelLeftClose size={20} />
              ) : (
                <PanelLeftOpen size={20} />
              )}
            </button>
          </div>

          {/* B. The Sidebar Content (Only visible when Open) */}
          <div
            className={`flex-1 overflow-hidden ${!isSidebarOpen && "hidden"}`}
          >
            <Sidebar
              selectedId={selectedInvoice?.id || null}
              onSelect={setSelectedInvoice}
            />
          </div>
        </div>

        {/* MAIN WORKSPACE */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-100 relative">
          {/* Note: We removed the absolute floating button from here */}

          {/* Content */}
          <div className="flex-1 overflow-hidden p-4">
            {selectedInvoice ? (
              <ComplianceWorkspace
                key={selectedInvoice.id}
                invoice={selectedInvoice}
                // NEW: Pass a callback to clear selection
                onSuccess={() => setSelectedInvoice(null)}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                  <span className="text-4xl opacity-50">👈</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-400">
                  Ready to Review
                </h2>
                <p className="font-medium text-slate-400 mt-2">
                  {isSidebarOpen
                    ? "Select a receipt from the queue."
                    : "Expand the sidebar to select a receipt."}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
