import { useState, useEffect, useCallback } from 'react';
import { NotesAPI } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import NoteCard from '../components/NoteCard.jsx';
import NoteModal from '../components/NoteModal.jsx';
import ViewNoteModal from '../components/ViewNoteModal.jsx';
import ShareModal from '../components/ShareModal.jsx';
import { SearchIcon, NoteIcon } from '../components/Icons.jsx';

const VIEW_TITLES = {
  'my-notes':       'My Notes',
  'shared-with-me': 'Shared With Me',
  'public':         'Public Notes',
};
const EMPTY = {
  'my-notes':       { title: 'No notes yet',            desc: 'Click "New Note" to capture your first idea.' },
  'shared-with-me': { title: 'Nothing shared with you', desc: 'Notes shared to your account will appear here.' },
  'public':         { title: 'No public notes',         desc: 'Public notes from all users appear here.' },
};

export default function Dashboard({ user, onLogout }) {
  const [currentView,      setCurrentView]      = useState('my-notes');
  const [notes,            setNotes]            = useState([]);
  const [counts,           setCounts]           = useState({ 'shared-with-me': 0 }); // only shared badge
  const [newSharedCount,   setNewSharedCount]   = useState(0); // unread shared notes badge
  const [loading,          setLoading]          = useState(false);
  const [mobileOpen,       setMobileOpen]       = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery,      setSearchQuery]      = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('all'); // 'all' | 'public' | 'private'

  // Modals
  const [noteModal,  setNoteModal]  = useState(null);
  const [viewNote,   setViewNote]   = useState(null);
  const [shareNote,  setShareNote]  = useState(null);

  const toast = useToast();

  /* ---- Load notes ---------------------------------- */
  const loadNotes = useCallback(async (view) => {
    setLoading(true); setNotes([]);
    try {
      let data = [];
      if (view === 'my-notes')       data = await NotesAPI.getMyNotes();
      if (view === 'shared-with-me') data = await NotesAPI.getSharedWithMe();
      if (view === 'public')         data = await NotesAPI.getPublicNotes();
      setNotes(data);
      if (view === 'shared-with-me') {
        const currentCount = data.length;
        setCounts(c => ({ ...c, 'shared-with-me': currentCount }));
        // update seen count now that user has loaded this view
        localStorage.setItem('seenSharedCount', String(currentCount));
        setNewSharedCount(0);
      }
    } catch (err) {
      toast('Failed to load: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /* ---- Silently check for new shared notes on mount -- */
  useEffect(() => {
    const checkNewShares = async () => {
      try {
        const data = await NotesAPI.getSharedWithMe();
        const currentCount = data.length;
        const seenCount = parseInt(localStorage.getItem('seenSharedCount') || '0', 10);
        const diff = Math.max(0, currentCount - seenCount);
        setNewSharedCount(diff);
        setCounts(c => ({ ...c, 'shared-with-me': currentCount }));
      } catch (_) { /* silent */ }
    };
    checkNewShares();
  }, []);

  useEffect(() => { loadNotes(currentView); }, [currentView, loadNotes]);

  /* ---- Mark shared notes as seen when tab is opened -- */
  useEffect(() => {
    if (currentView === 'shared-with-me') {
      const currentCount = counts['shared-with-me'] || 0;
      if (currentCount > 0) {
        localStorage.setItem('seenSharedCount', String(currentCount));
      }
      setNewSharedCount(0);
    }
  }, [currentView, counts]);

  /* ---- Keyboard shortcuts -------------------------- */
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); setNoteModal('create'); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  /* ---- Actions ------------------------------------- */
  const handleDelete = async (noteId) => {
    if (!window.confirm('Delete this note? This cannot be undone.')) return;
    try {
      await NotesAPI.delete(noteId);
      toast('Note deleted.', 'info');
      setViewNote(null);
      loadNotes(currentView);
    } catch (err) {
      toast('Error: ' + err.message, 'error');
    }
  };

  const handleSaved = () => { setNoteModal(null); loadNotes(currentView); };

  /* ---- Filtered notes ------------------------------ */
  const filtered = notes.filter(n => {
    // Visibility filter
    if (visibilityFilter === 'public'  && !n.is_public)  return false;
    if (visibilityFilter === 'private' &&  n.is_public)  return false;
    // Search filter
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q);
  });

  const isMyNotes    = currentView === 'my-notes';
  const emptyMsg     = EMPTY[currentView];
  const publicCount  = notes.filter(n =>  n.is_public).length;
  const privateCount = notes.filter(n => !n.is_public).length;

  const switchView = (v) => { setCurrentView(v); setMobileOpen(false); setSearchQuery(''); setVisibilityFilter('all'); };

  const toggleVisibilityFilter = (type) => {
    setVisibilityFilter(prev => prev === type ? 'all' : type);
  };

  /* ---- Sidebar width for main margin --------------- */
  const sidebarWidth = sidebarCollapsed ? 64 : 256;

  return (
    <div className="layout">

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,.3)', backdropFilter: 'blur(2px)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        user={user}
        currentView={currentView}
        newSharedCount={newSharedCount}
        mobileOpen={mobileOpen}
        collapsed={sidebarCollapsed}
        onViewChange={switchView}
        onNewNote={() => setNoteModal('create')}
        onLogout={onLogout}
        /* Desktop toggle: collapse/expand sidebar */
        onToggle={() => setSidebarCollapsed(s => !s)}
      />

      {/* Main — shifts left/right with sidebar */}
      <main
        className="main"
        style={{ marginLeft: window.innerWidth > 768 ? sidebarWidth : 0, transition: 'margin-left .18s cubic-bezier(.4,0,.2,1)' }}
      >
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            {/* Mobile: open drawer.  Desktop: already handled inside sidebar */}
            <button className="mobile-menu-btn" onClick={() => setMobileOpen(s => !s)}>
              <svg viewBox="0 0 24 24" fill="none"><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2"/></svg>
            </button>
            <h1 className="page-title">{VIEW_TITLES[currentView]}</h1>
          </div>
          <div className="search-box">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search notes…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {/* Notes */}
        <section className="notes-section">

          {/* Stats chips */}
          {isMyNotes && !loading && notes.length > 0 && (
            <div className="notes-stats">
              {/* Total — resets filter */}
              <button
                className={`stat-chip stat-chip-btn${visibilityFilter === 'all' ? ' stat-chip-active stat-chip-active--total' : ''}`}
                onClick={() => setVisibilityFilter('all')}
                title="Show all notes"
              >
                <div className="stat-chip-dot" />
                <span><strong>{notes.length}</strong> Total</span>
              </button>

              {/* Public filter */}
              {publicCount > 0 && (
                <button
                  className={`stat-chip stat-chip-btn${visibilityFilter === 'public' ? ' stat-chip-active stat-chip-active--public' : ''}`}
                  onClick={() => toggleVisibilityFilter('public')}
                  title="Show only public notes"
                >
                  <div className="stat-chip-dot" style={{ background: '#2563eb' }} />
                  <span><strong>{publicCount}</strong> Public</span>
                </button>
              )}

              {/* Private filter */}
              {privateCount > 0 && (
                <button
                  className={`stat-chip stat-chip-btn${visibilityFilter === 'private' ? ' stat-chip-active stat-chip-active--private' : ''}`}
                  onClick={() => toggleVisibilityFilter('private')}
                  title="Show only private notes"
                >
                  <div className="stat-chip-dot" style={{ background: '#9ca3af' }} />
                  <span><strong>{privateCount}</strong> Private</span>
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading notes…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-wrap"><NoteIcon /></div>
              <h3>{searchQuery ? 'No matching notes' : emptyMsg.title}</h3>
              <p>{searchQuery ? 'Try a different search term.' : emptyMsg.desc}</p>
              {isMyNotes && !searchQuery && (
                <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setNoteModal('create')}>
                  + New Note
                </button>
              )}
            </div>
          ) : (
            <div className="notes-grid">
              {filtered.map((note, i) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  index={i}
                  isOwner={isMyNotes}
                  onClick={(n) => setViewNote(n)}
                  onEdit={(n) => { setViewNote(null); setNoteModal(n); }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modals */}
      {noteModal && (
        <NoteModal
          note={noteModal === 'create' ? null : noteModal}
          onClose={() => setNoteModal(null)}
          onSaved={handleSaved}
        />
      )}
      {viewNote && !noteModal && (
        <ViewNoteModal
          note={viewNote}
          isOwner={isMyNotes}
          onClose={() => setViewNote(null)}
          onEdit={() => { setNoteModal(viewNote); setViewNote(null); }}
          onShare={() => { setShareNote(viewNote); setViewNote(null); }}
          onDelete={() => handleDelete(viewNote.id)}
        />
      )}
      {shareNote && (
        <ShareModal note={shareNote} onClose={() => setShareNote(null)} />
      )}
    </div>
  );
}
