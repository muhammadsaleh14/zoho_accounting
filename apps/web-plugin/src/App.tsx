import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Header } from "./components/Header";
import { DashboardPage } from "./modules/dashboard/pages/DashboardPage";
import { BillReviewPage } from "./modules/payables/pages/BillReviewPage";
import { Toaster } from "@/components/ui/sonner"; // <--- IMPORT THIS

function App() {
  return (
    <BrowserRouter basename="/zoho_accounting/">
      <div className="flex flex-col h-screen w-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
        <Header />
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/payables/review/:id" element={<BillReviewPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        {/* Mount the Toaster here */}
        <Toaster />
      </div>
    </BrowserRouter>
  );
}

export default App;
