import { useState, useEffect } from 'react';
import { AdminAPI } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

/* ── Helpers ──────────────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return isNaN(d) ? '—' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// A user is "active" if:
// 1. They logged in within the last 15 minutes, AND
// 2. Their last login is MORE RECENT than their last logout
function isActive(lastActiveAt, lastLogoutAt) {
  if (!lastActiveAt) return false;
  const activeTime  = new Date(lastActiveAt).getTime();
  const logoutTime  = lastLogoutAt ? new Date(lastLogoutAt).getTime() : 0;
  const withinWindow = Date.now() - activeTime < 15 * 60 * 1000;
  return withinWindow && activeTime > logoutTime;
}

function getLastSeen(lastActiveAt) {
  if (!lastActiveAt) return 'Never logged in';
  const diff = Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / 1000);
  if (diff < 60)         return 'Just now';
  if (diff < 3600)       return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)      return `${Math.floor(diff / 3600)}h ago`;
  return formatDate(lastActiveAt);
}

/* ── Icons ───────────────────────────────────────── */
const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2"/>
    <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2"/>
    <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
    <polyline points="23 4 23 10 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="white" opacity="0.9"/>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="white" strokeWidth="1.5" opacity="0.5"/>
  </svg>
);
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
const ActiveDotIcon = () => (
  <svg viewBox="0 0 10 10" width="10" height="10">
    <circle cx="5" cy="5" r="4" fill="#22c55e"/>
    <circle cx="5" cy="5" r="4" fill="#22c55e" opacity="0.4">
      <animate attributeName="r" from="4" to="8" dur="1.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite"/>
    </circle>
  </svg>
);

/* ── Main Component ───────────────────────────────── */
export default function AdminPanel({ user, onLogout }) {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all'); // 'all' | 'active' | 'inactive'
  const [lastRefresh, setLastRefresh] = useState(null);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await AdminAPI.getUsers();
      setUsers(data);
      setLastRefresh(new Date());
    } catch (err) {
      toast('Failed to load users: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Auto-refresh every 30 seconds
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  /* ── Derived stats ── */
  const activeCount   = users.filter(u => isActive(u.last_active_at, u.last_logout_at)).length;
  const inactiveCount = users.length - activeCount;

  /* ── Filtered list ── */
  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || (u.name  || '').toLowerCase().includes(q)
      || (u.email || '').toLowerCase().includes(q);
    const matchFilter =
      filter === 'all'      ? true
      : filter === 'active'   ? isActive(u.last_active_at, u.last_logout_at)
      : /* inactive */          !isActive(u.last_active_at, u.last_logout_at);
    return matchSearch && matchFilter;
  });

  return (
    <div className="admin-layout">

      {/* ── Top Bar ── */}
      <header className="admin-topbar">
        <div className="admin-brand">
          <div className="admin-brand-icon"><ShieldIcon /></div>
          <div>
            <div className="admin-brand-title">NoteHub Admin</div>
            <div className="admin-brand-sub">Super Admin Panel</div>
          </div>
        </div>

        <div className="admin-topbar-right">
          {lastRefresh && (
            <span className="admin-refresh-label">
              Updated {getLastSeen(lastRefresh.toISOString())}
            </span>
          )}
          <button className="admin-refresh-btn" onClick={load} disabled={loading} title="Refresh">
            <span style={{ display: 'inline-block', animation: loading ? 'spin .7s linear infinite' : 'none' }}>
              <RefreshIcon />
            </span>
          </button>
          <div className="admin-user-chip">
            <span className="admin-user-avatar">A</span>
            <span className="admin-user-email">{user.email}</span>
          </div>
          <button className="admin-logout-btn" onClick={onLogout} title="Sign out">
            <LogoutIcon />
          </button>
        </div>
      </header>

      <main className="admin-main">

        {/* ── Stat Cards ── */}
        <div className="admin-stats-row">
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon--total"><UsersIcon /></div>
            <div>
              <div className="admin-stat-value">{users.length}</div>
              <div className="admin-stat-label">Total Users</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon--active">
              <ActiveDotIcon />
            </div>
            <div>
              <div className="admin-stat-value" style={{ color: '#16a34a' }}>{activeCount}</div>
              <div className="admin-stat-label">Active Now</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon--inactive">
              <svg viewBox="0 0 10 10" width="18" height="18"><circle cx="5" cy="5" r="4" fill="#9ca3af"/></svg>
            </div>
            <div>
              <div className="admin-stat-value" style={{ color: '#6b7280' }}>{inactiveCount}</div>
              <div className="admin-stat-label">Inactive</div>
            </div>
          </div>
        </div>

        {/* ── Table Card ── */}
        <div className="admin-table-card">

          {/* Toolbar */}
          <div className="admin-toolbar">
            <h2 className="admin-table-title">All Users</h2>
            <div className="admin-toolbar-right">
              {/* Search */}
              <div className="admin-search">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search name or email…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              {/* Filter pills */}
              <div className="admin-filter-pills">
                {[
                  { id: 'all',      label: `All (${users.length})` },
                  { id: 'active',   label: `Active (${activeCount})` },
                  { id: 'inactive', label: `Inactive (${inactiveCount})` },
                ].map(f => (
                  <button
                    key={f.id}
                    className={`admin-filter-pill ${filter === f.id ? 'active' : ''} ${f.id !== 'all' ? 'admin-filter-pill--' + f.id : ''}`}
                    onClick={() => setFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          {loading && users.length === 0 ? (
            <div className="admin-loading">
              <div className="spinner" />
              <p>Loading users…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="admin-empty">
              <p>No users match your search.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Last Active</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => {
                    const active  = isActive(u.last_active_at, u.last_logout_at);
                    const initial = (u.name || u.email || '?').charAt(0).toUpperCase();
                    return (
                      <tr key={u.id} className={active ? 'admin-row--active' : ''}>
                        <td className="admin-cell-num">{i + 1}</td>
                        <td>
                          <div className="admin-user-cell">
                            <div className="admin-avatar" style={{ background: active ? '#dcfce7' : '#f3f4f6', color: active ? '#16a34a' : '#6b7280' }}>
                              {initial}
                            </div>
                            <span className="admin-name">{u.name || u.email.split('@')[0]}</span>
                          </div>
                        </td>
                        <td className="admin-email">{u.email}</td>
                        <td>
                          {active ? (
                            <span className="admin-status-badge admin-status-badge--active">
                              <ActiveDotIcon /> Active
                            </span>
                          ) : (
                            <span className="admin-status-badge admin-status-badge--inactive">
                              Offline
                            </span>
                          )}
                        </td>
                        <td className="admin-last-seen">{getLastSeen(u.last_active_at)}</td>
                        <td className="admin-joined">{formatDate(u.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {filtered.length > 0 && (
            <div className="admin-table-footer">
              Showing <strong>{filtered.length}</strong> of <strong>{users.length}</strong> users
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
