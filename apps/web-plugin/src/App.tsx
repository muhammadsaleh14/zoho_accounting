import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ReviewPage } from './pages/ReviewPage';
import { VaultPage } from './pages/VaultPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CompliancePage } from './pages/CompliancePage';
import { DocumentUpload } from './components/DocumentUpload';
import { SearchProvider } from './context/SearchContext';

function App() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <SearchProvider>
      <BrowserRouter basename="/zoho_accounting/">
        <div className="flex h-screen bg-surface-100 font-sans text-slate-900 overflow-hidden relative">

          <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

          <div className="flex-1 flex flex-col min-w-0">
            <Header
              onUploadClick={() => setIsUploadOpen(true)}
              onMenuClick={() => setIsMobileMenuOpen(true)}
            />
            <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8 animate-fade-in scroll-smooth">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/review/:invoiceId" element={<ReviewPage />} />

                {/* Added real routes */}
                <Route path="/vault" element={<VaultPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/compliance" element={<CompliancePage />} />

                {/* Fallback Route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>

          {/* Upload Modal Overlay */}
          {isUploadOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
              <div className="max-w-xl w-full">
                <DocumentUpload onClose={() => setIsUploadOpen(false)} />
              </div>
            </div>
          )}

        </div>
      </BrowserRouter>
    </SearchProvider>
  );
}

export default App;