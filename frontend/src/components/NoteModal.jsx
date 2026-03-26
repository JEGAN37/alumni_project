import { useState, useEffect } from 'react';
import { NotesAPI } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { CloseIcon } from './Icons.jsx';

function Toggle({ checked, onChange }) {
  return (
    <div className="toggle-row" onClick={() => onChange(!checked)}>
      <div className={`toggle-track ${checked ? 'on' : ''}`}>
        <div className="toggle-thumb" />
      </div>
      <span className="toggle-label-text">Make Public</span>
    </div>
  );
}

export default function NoteModal({ note, onClose, onSaved }) {
  const [title,    setTitle]    = useState('');
  const [content,  setContent]  = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const toast = useToast();
  const isEditing = !!note;

  // Populate form when editing
  useEffect(() => {
    if (note) {
      setTitle(note.title  || '');
      setContent(note.content || '');
      setIsPublic(!!note.is_public);
    } else {
      setTitle(''); setContent(''); setIsPublic(false);
    }
    setError('');
  }, [note]);

  // Keyboard shortcut: Esc closes
  useEffect(() => {
    const handle = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [onClose]);

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required.'); return; }
    setError(''); setLoading(true);
    try {
      if (isEditing) {
        await NotesAPI.update(note.id, { title, content, isPublic });
        toast('Note updated!', 'success');
      } else {
        await NotesAPI.create({ title, content, isPublic });
        toast('Note created!', 'success');
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Note' : 'New Note'}</h2>
          <button className="modal-close-btn" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              className="note-title-inp" type="text"
              placeholder="Note title..." value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Content</label>
            <textarea
              className="note-content-inp"
              placeholder="Write your note here..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>
          <Toggle checked={isPublic} onChange={setIsPublic} />
          {error && <p className="form-error">{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? <span className="btn-spinner" /> : (isEditing ? 'Update Note' : 'Save Note')}
          </button>
        </div>
      </div>
    </div>
  );
}
