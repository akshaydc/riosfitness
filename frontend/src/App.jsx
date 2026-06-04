import { useState, useEffect } from 'react';
import { api } from './api';
import { ToastProvider, Spinner } from './components';
import Login from './Login';
import Sidebar from './Sidebar';
import MembersView from './MembersView';
import ReportsView from './ReportsView';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('members');

  useEffect(() => {
    const token = localStorage.getItem('rf_token');
    if (!token) {
      setLoading(false);
      return;
    }
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

  function handleLogin(u) {
    setUser(u);
    setActiveView('members');
  }

  function handleLogout() {
    localStorage.removeItem('rf_token');
    setUser(null);
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const canViewReports = user.role === 'super_admin';

  return (
    <div className="layout">
      <Sidebar
        user={user}
        activeView={activeView}
        onNavigate={setActiveView}
        onLogout={handleLogout}
      />
      <main className="main-content">
        {activeView === 'members' && <MembersView user={user} />}
        {activeView === 'reports' && canViewReports && <ReportsView />}
        {activeView === 'reports' && !canViewReports && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Access denied.
          </div>
        )}
      </main>
    </div>
  );
}

export default function Root() {
  return (
    <ToastProvider>
      <App />
    </ToastProvider>
  );
}
