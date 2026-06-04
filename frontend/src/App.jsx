import { useState, useEffect } from 'react';
import { api } from './api';
import { ToastProvider, Spinner } from './components';
import Login from './Login';
import Sidebar from './Sidebar';
import MembersView from './MembersView';
import ReportsView from './ReportsView';
import ReceiptsView from './ReceiptsView';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('members');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('rf_token');
    if (!token) { setLoading(false); return; }
    api.me()
      .then(setUser)
      .catch(() => localStorage.removeItem('rf_token'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = () => { setUser(null); localStorage.removeItem('rf_token'); };
    window.addEventListener('rf:logout', handler);
    return () => window.removeEventListener('rf:logout', handler);
  }, []);

  function handleLogin(u) { setUser(u); setActiveView('members'); }
  function handleLogout() { localStorage.removeItem('rf_token'); setUser(null); }

  function navigate(v) {
    setActiveView(v);
    setSidebarOpen(false);
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (!user) return <Login onLogin={handleLogin} />;

  const canViewReports = user.role === 'super_admin';

  return (
    <>
      {/* Mobile top bar — hidden on desktop via CSS */}
      <div className="mobile-topbar">
        <button
          onClick={() => setSidebarOpen(true)}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          aria-label="Open menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', letterSpacing: '2px', color: '#fff', lineHeight: 1 }}>
          RIOS FITNESS
        </span>
      </div>

      {/* Backdrop for sidebar drawer */}
      <div
        className={`sidebar-backdrop${sidebarOpen ? ' visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className="layout">
        <Sidebar
          user={user}
          activeView={activeView}
          onNavigate={navigate}
          onLogout={handleLogout}
          isDrawerOpen={sidebarOpen}
        />
        <main className="main-content">
          {activeView === 'members' && <MembersView user={user} />}
          {activeView === 'receipts' && <ReceiptsView user={user} />}
          {activeView === 'reports' && canViewReports && <ReportsView />}
          {activeView === 'reports' && !canViewReports && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Access denied.
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default function Root() {
  return (
    <ToastProvider>
      <App />
    </ToastProvider>
  );
}
