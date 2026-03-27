import { NoteIcon, InboxIcon, GlobeIcon, LogoIcon } from './Icons.jsx';

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2"/>
    <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2"/>
    <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <line x1="3" y1="6"  x2="21" y2="6"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const VIEWS = [
  { id: 'my-notes',       label: 'My Notes',       Icon: NoteIcon  },
  { id: 'shared-with-me', label: 'Shared With Me', Icon: InboxIcon },
  { id: 'public',         label: 'Public Notes',   Icon: GlobeIcon },
];

export default function Sidebar({
  user, currentView, newSharedCount,
  mobileOpen, collapsed,
  onViewChange, onNewNote, onLogout, onToggle,
}) {
  const avatar = (user?.email || 'U').charAt(0).toUpperCase();

  return (
    <aside className={`sidebar ${mobileOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>

      {/* ---- Header ---- */}
      <div className="sidebar-header">
        {!collapsed && (
          <div className="sidebar-logo">
            <div className="s-logo-icon"><LogoIcon /></div>
            <span className="s-logo-text">NoteHub</span>
          </div>
        )}
        <button
          className="sidebar-toggle-btn"
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <MenuIcon />
        </button>
      </div>

      {/* ---- New Note ---- */}
      <div className="sidebar-new">
        <button className="btn-new-note" onClick={onNewNote} title="New Note">
          <PlusIcon />
          <span className="new-note-text">New Note</span>
        </button>
      </div>

      {/* ---- Navigation ---- */}
      <nav className="sidebar-nav">
        {!collapsed && <div className="sidebar-section-label">Workspace</div>}
        {VIEWS.map(({ id, label, Icon }) => (
          <div
            key={id}
            className={`nav-link ${currentView === id ? 'active' : ''}`}
            data-label={label}
            onClick={() => onViewChange(id)}
          >
            <Icon />
            {!collapsed && <span className="nav-label">{label}</span>}
            {!collapsed && id === 'shared-with-me' && newSharedCount > 0 && (
              <span className="nav-badge">{newSharedCount}</span>
            )}
          </div>
        ))}
      </nav>

      {/* ---- Footer ---- */}
      <div className="sidebar-footer">
        <div className="user-avatar" title={user?.email}>{avatar}</div>
        {!collapsed && (
          <>
            <div className="user-details">
              <span className="user-email-text">{user?.email}</span>
              <span className="user-role-text">Member (all over the world)</span>
            </div>
            <button className="logout-btn" onClick={onLogout} title="Sign out">
              <LogoutIcon />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
