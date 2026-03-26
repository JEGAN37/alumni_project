import { EditIcon, TrashIcon } from './Icons.jsx';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const now = new Date();
  const diffMs  = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr  = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1)  return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr  < 24) return `${diffHr}h ago`;
  if (diffDay < 7)  return `${diffDay}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function stripHtml(str) {
  const tmp = document.createElement('div');
  tmp.innerHTML = str;
  return tmp.textContent || tmp.innerText || '';
}

function AuthorChip({ name, email, isOwner }) {
  if (isOwner) return null;  // Don't show "by you" on your own notes
  const display = name || (email ? email.split('@')[0] : null);
  if (!display) return null;
  const initial = display.charAt(0).toUpperCase();
  return (
    <div className="author-chip">
      <div className="author-chip-avatar">{initial}</div>
      <span>{display}</span>
    </div>
  );
}

export default function NoteCard({ note, isOwner, index, onClick, onEdit, onDelete }) {
  const badgeClass = note.is_public ? 'badge-public' : 'badge-private';
  const badgeText  = note.is_public ? 'Public' : 'Private';
  const content    = stripHtml(note.content || '');
  const date       = formatDate(note.updated_at || note.created_at);

  return (
    <div
      className="note-card"
      style={{ animationDelay: `${index * 0.04}s` }}
      onClick={() => onClick(note)}
    >
      <div className="note-card-accent" />

      <div className="note-card-header">
        <span className="note-card-title">{note.title || 'Untitled Note'}</span>
        <span className={`note-badge ${badgeClass}`}>{badgeText}</span>
      </div>

      <div className="note-card-content">
        {content
          ? content
          : <span style={{ color: 'var(--gray-300)', fontStyle: 'italic' }}>No content</span>
        }
      </div>

      <div className="note-card-footer">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Author chip — shown on Public and Shared-with-me views */}
          <AuthorChip
            name={note.author_name}
            email={note.author_email}
            isOwner={isOwner}
          />
          <span className="note-card-date">{date}</span>
        </div>

        {isOwner && (
          <div className="note-card-actions" onClick={e => e.stopPropagation()}>
            <button className="note-action-btn" title="Edit" onClick={() => onEdit(note)}>
              <EditIcon />
            </button>
            <button className="note-action-btn danger" title="Delete" onClick={() => onDelete(note.id)}>
              <TrashIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
