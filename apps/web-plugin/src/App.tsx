import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { ReviewPage } from './pages/ReviewPage';

function App() {
  return (
    // IMPORTANT: The HashRouter is required for GitHub Pages
    <BrowserRouter basename="/zoho_accounting/">
      <div className="flex flex-col h-screen w-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
        
        <Header />

        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/review/:invoiceId" element={<ReviewPage />} />
            
            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

      </div>
    </BrowserRouter>
  );
}

export default App;