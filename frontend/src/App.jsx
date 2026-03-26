import { useState, useMemo } from 'react';
import { getUser, removeToken, AuthAPI } from './services/api.js';
import { ToastProvider } from './context/ToastContext.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import SharedNotePage from './pages/SharedNotePage.jsx';
import './index.css';
import './App.css';

export default function App() {
  const [user, setUser] = useState(() => getUser());

  const shareId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('shareId');
    if (id) window.history.replaceState({}, '', window.location.pathname);
    return id || null;
  }, []);

  const handleLogin  = (userData) => setUser(userData);

  // Call backend logout first so last_active_at is cleared immediately
  const handleLogout = async () => {
    try { await AuthAPI.logout(); } catch (_) { /* token may be gone already – that's ok */ }
    removeToken();
    setUser(null);
  };

  // If URL had ?shareId=, always show shared note page
  if (shareId) {
    return (
      <ToastProvider>
        <SharedNotePage shareId={shareId} currentUser={user} onClose={user ? () => window.location.href = '/' : null} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      {!user
        ? <AuthPage onLogin={handleLogin} />
        : user.role === 'superadmin'
          ? <AdminPanel user={user} onLogout={handleLogout} />
          : <Dashboard user={user} onLogout={handleLogout} />
      }
    </ToastProvider>
  );
}
