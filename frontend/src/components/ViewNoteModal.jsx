import { useEffect } from 'react';
import { CloseIcon, EditIcon, ShareIcon, TrashIcon } from './Icons.jsx';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ViewNoteModal({ note, isOwner, onClose, onEdit, onShare, onDelete }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  if (!note) return null;

  const badgeClass = note.is_public ? 'badge-public' : 'badge-private';
  const badgeText  = note.is_public ? 'Public' : 'Private';

  // Author chip — only shown when this note belongs to someone else
  const authorDisplay = !isOwner && (note.author_name || (note.author_email ? note.author_email.split('@')[0] : null));
  const authorInitial = authorDisplay ? authorDisplay.charAt(0).toUpperCase() : null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-lg">

        {/* Header */}
        <div className="modal-header">
          <div className="view-modal-meta">
            <span className={`note-badge ${badgeClass}`}>{badgeText}</span>
          </div>
          <div className="modal-header-actions">
            {isOwner && (
              <>
                <button className="icon-btn" title="Edit note"   onClick={onEdit}><EditIcon /></button>
                <button className="icon-btn" title="Share note"  onClick={onShare}><ShareIcon /></button>
                <button className="icon-btn danger" title="Delete note" onClick={onDelete}><TrashIcon /></button>
              </>
            )}
            <button className="modal-close-btn" onClick={onClose}><CloseIcon /></button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">

          {/* Title */}
          <h2 className="view-note-title">{note.title || 'Untitled'}</h2>

          {/* Content */}
          <div className="view-note-content">
            {note.content
              ? note.content
              : <span style={{ color: 'var(--gray-300)', fontStyle: 'italic' }}>No content</span>
            }
          </div>

          <div className="view-note-divider" />

          {/* Meta row: date + author chip */}
          <div className="view-note-meta-row">
            <span className="view-note-date">{formatDate(note.updated_at || note.created_at)}</span>
            {authorDisplay && (
              <span className="author-chip">
                <span className="author-chip-avatar">{authorInitial}</span>
                {authorDisplay}
                {note.author_email && <span className="author-chip-email">&nbsp;· {note.author_email}</span>}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
