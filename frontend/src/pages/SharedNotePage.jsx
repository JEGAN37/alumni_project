import { useState, useEffect } from 'react';
import { NotesAPI } from '../services/api.js';

const LogoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
    <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="#fff" opacity="0.9"/>
    <path d="M12 2v20M2 7l10 5 10-5" stroke="#fff" strokeWidth="1.5" opacity="0.5"/>
  </svg>
);
const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
    <line x1="19" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <polyline points="12 5 5 12 12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

function LoadingView() {
  return (
    <div className="snv-center">
      <div className="spinner" style={{ width: 36, height: 36 }} />
      <p style={{ color: 'var(--gray-400)', marginTop: 12 }}>Loading note…</p>
    </div>
  );
}

function ErrorView({ message, isLoggedIn }) {
  const isPrivate = message?.toLowerCase().includes('log in') ||
                    message?.toLowerCase().includes('private') ||
                    message?.toLowerCase().includes('access') ||
                    message?.toLowerCase().includes('denied');
  return (
    <div className="snv-center">
      <div className="snv-error-icon">{isPrivate ? '🔒' : '⚠️'}</div>
      <h2 className="snv-error-title">
        {isPrivate ? 'Private Note' : 'Note Not Found'}
      </h2>
      <p className="snv-error-desc">{message}</p>
      {isPrivate && !isLoggedIn && (
        <a href="/" className="btn btn-primary" style={{ marginTop: 16 }}>
          Sign in to view
        </a>
      )}
      {isPrivate && isLoggedIn && (
        <p className="snv-error-desc" style={{ marginTop: 8 }}>
          You need to be granted access by the note's owner.
        </p>
      )}
    </div>
  );
}

export default function SharedNotePage({ shareId, currentUser, onClose }) {
  const [note,    setNote]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(''); setNote(null);

    NotesAPI.getByShareId(shareId)
      .then(data => { if (!cancelled) setNote(data); })
      .catch(err  => { if (!cancelled) setError(err.message); })
      .finally(()  => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [shareId]);

  const goHome = () => { window.location.href = '/'; };

  return (
    <div className="snv-page">

      {/* Top bar */}
      <header className="snv-topbar">
        <a href="/" className="snv-brand">
          <div className="snv-brand-icon"><LogoIcon /></div>
          <span>NoteHub</span>
        </a>

        <div className="snv-topbar-right">
          {currentUser ? (
            /* Logged in: show back button */
            <button className="btn btn-secondary btn-sm" onClick={goHome} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeftIcon /> My Notes
            </button>
          ) : (
            /* Not logged in: show sign in / sign up */
            <>
              <a href="/" className="btn btn-secondary btn-sm">Sign in</a>
              <a href="/?register=1" className="btn btn-primary btn-sm">Sign up free</a>
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="snv-main">
        {loading && <LoadingView />}
        {!loading && error && <ErrorView message={error} isLoggedIn={!!currentUser} />}
        {!loading && !error && note && (
          <article className="snv-article">

            {/* Badge */}
            <div className="snv-meta-row">
              <span className={`note-badge ${note.is_public ? 'badge-public' : 'badge-private'}`}>
                {note.is_public ? 'Public Note' : 'Shared with you privately'}
              </span>
            </div>

            {/* Title */}
            <h1 className="snv-title">{note.title || 'Untitled Note'}</h1>

            {/* Author + date */}
            <div className="snv-byline">
              {(note.author_name || note.author_email) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="snv-author-avatar">
                    {(note.author_name || note.author_email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="snv-author-name">
                      {note.author_name || note.author_email.split('@')[0]}
                    </span>
                    {note.author_email && (
                      <span className="snv-author-email"> · {note.author_email}</span>
                    )}
                  </div>
                </div>
              )}
              <span className="snv-date">
                {formatDate(note.updated_at || note.created_at)}
              </span>
            </div>

            <div className="snv-divider" />

            {/* Note body */}
            <div className="snv-body">
              {note.content
                ? note.content
                : <span style={{ color: 'var(--gray-300)', fontStyle: 'italic' }}>No content</span>
              }
            </div>

            {/* Back button (for logged-in users) */}
            {currentUser && (
              <div style={{ marginTop: 48 }}>
                <button className="btn btn-secondary" onClick={goHome} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <ArrowLeftIcon /> Back to My Notes
                </button>
              </div>
            )}

          </article>
        )}
      </main>

      {/* Footer */}
      <footer className="snv-footer">
        <span>Shared via </span>
        <a href="/">NoteHub</a>
        <span> — The alumni notepad</span>
      </footer>
    </div>
  );
}
