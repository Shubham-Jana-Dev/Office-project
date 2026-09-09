import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { LoginView } from './components/auth/LoginView';
import { POSView } from './components/pos/POSView';
import { ProfitView } from './components/profit/ProfitView';
import { LedgerView } from './components/ledger/LedgerView';
import { StagesView } from './components/stages/StagesView';
import { MeasurementView } from './components/measurement/MeasurementView';
import { BookingView } from './components/booking/BookingView';
import { EmployeeView } from './components/employee/EmployeeView';
import { SuperAdminView } from './components/superadmin/SuperAdminView';
import { BarcodeScannerModal } from './components/pos/BarcodeScannerModal';
import { CheckCircle2, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import './styles/index.css';
import './styles/pos.css';

export function App() {
  const { activeTab, setActiveTab, toasts, currentUser } = useApp();
  const [isGlobalScannerOpen, setIsGlobalScannerOpen] = useState(false);

  // If user is not authenticated, show the Login Screen
  if (!currentUser) {
    return (
      <>
        <LoginView />
        {/* Toast Notification Container */}
        <div className="toast-container">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast toast-${toast.type || 'info'}`}>
              {toast.type === 'success' ? (
                <CheckCircle2 size={18} color="#10B981" />
              ) : toast.type === 'danger' ? (
                <AlertCircle size={18} color="#F43F5E" />
              ) : (
                <Info size={18} color="#06B6D4" />
              )}
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  // Check Role-Based Access Control permissions
  const isAllowed =
    !currentUser.permissions ||
    currentUser.permissions.includes(activeTab) ||
    (activeTab === 'super_admin' && (currentUser.roleKey === 'super_admin' || currentUser.roleKey === 'admin'));

  // Render Active Section
  const renderActiveView = () => {
    if (!isAllowed) {
      return (
        <div className="view-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <ShieldAlert size={36} color="#FB7185" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>Access Restricted for {currentUser.role}</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '420px', marginBottom: '20px' }}>
            Your staff account doesn't have authorization to view this department. Please contact your Store Director.
          </p>
          <button className="btn btn-primary" onClick={() => setActiveTab(currentUser.permissions[0] || 'pos')}>
            Return to Authorized Workspace
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'pos':
        return <POSView />;
      case 'profit':
        return <ProfitView />;
      case 'ledger':
        return <LedgerView />;
      case 'stages':
        return <StagesView />;
      case 'measurement':
        return <MeasurementView />;
      case 'booking':
        return <BookingView />;
      case 'employee':
        return <EmployeeView />;
      case 'super_admin':
        return <SuperAdminView />;
      default:
        return <POSView />;
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Workspace */}
      <div className="main-content">
        <Header onOpenScanner={() => setIsGlobalScannerOpen(true)} />
        {renderActiveView()}
      </div>

      {/* Global Barcode Scanner Simulator Modal */}
      <BarcodeScannerModal
        isOpen={isGlobalScannerOpen}
        onClose={() => setIsGlobalScannerOpen(false)}
      />

      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type || 'info'}`}>
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} color="#10B981" />
            ) : toast.type === 'danger' ? (
              <AlertCircle size={18} color="#F43F5E" />
            ) : (
              <Info size={18} color="#06B6D4" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

