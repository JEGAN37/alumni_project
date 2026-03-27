import { useState, useEffect, useCallback } from 'react';
import { NotesAPI, AuthAPI, makeShareUrl } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { CloseIcon } from './Icons.jsx';

const TrashSmIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
    <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
    <polyline points="15 18 9 12 15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ShareModal({ note, onClose }) {
  const [email,        setEmail]        = useState('');
  const [foundUser,    setFoundUser]    = useState(null);
  const [lookupError,  setLookupError]  = useState('');
  const [looking,      setLooking]      = useState(false);
  const [shareSuccess, setShareSuccess] = useState('');
  const [shareError,   setShareError]   = useState('');
  const [sharing,      setSharing]      = useState(false);
  const [copied,       setCopied]       = useState(false);

  // Access list state
  const [accessList,  setAccessList]  = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [revokingId,  setRevokingId]  = useState(null);

  // Sub-panel: "manage access" drawer
  const [showManage, setShowManage] = useState(false);

  const toast = useToast();

  // Local shareLink state. Prefer canonical link returned by backend after sharing.
  const [shareLinkState, setShareLinkState] = useState(() => note ? (note.share_id ? makeShareUrl(note.share_id) : '') : '');

  // ---- Load access list -----------------------------------------------
  const loadAccessList = useCallback(async () => {
    if (!note) return;
    setLoadingList(true);
    try {
      const data = await NotesAPI.getSharedUsers(note.id);
      setAccessList(data);
    } catch {
      setAccessList([]);
    } finally {
      setLoadingList(false);
    }
  }, [note]);

  useEffect(() => { loadAccessList(); }, [loadAccessList]);

  // Esc to close
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') { if (showManage) setShowManage(false); else onClose(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, showManage]);

  // ---- Copy link -------------------------------------------------------
  const copyLink = () => {
    const link = shareLinkState || '';
    navigator.clipboard.writeText(link).catch(() => {
      const el = document.createElement('textarea');
      el.value = link; document.body.appendChild(el);
      el.select(); document.execCommand('copy'); document.body.removeChild(el);
    });
    setCopied(true);
    toast('Link copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // ---- Lookup user by email --------------------------------------------
  const lookupUser = async () => {
    setLookupError(''); setFoundUser(null); setShareSuccess(''); setShareError('');
    if (!email.trim() || !email.includes('@')) {
      setLookupError('Enter a valid email address.'); return;
    }
    setLooking(true);
    try {
      const user = await AuthAPI.getUserByEmail(email.trim());
      setFoundUser(user);
    } catch (err) {
      setLookupError(err.message);
    } finally {
      setLooking(false);
    }
  };

  const handleEmailKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); lookupUser(); } };

  // ---- Share with found user -------------------------------------------
  const doShare = async () => {
    if (!foundUser) return;
    setShareError(''); setShareSuccess(''); setSharing(true);
    try {
      const res = await NotesAPI.share(note.id, { sharedWith: foundUser.id });
      setShareSuccess(res.message || `Shared with ${foundUser.email}`);
      // If backend returned a canonical shareLink, use it
      if (res.shareLink) {
        setShareLinkState(res.shareLink);
      } else if (res.shareId) {
        setShareLinkState(makeShareUrl(res.shareId));
      }
      toast('Note shared!', 'success');
      setFoundUser(null); setEmail('');
      loadAccessList();
    } catch (err) {
      setShareError(err.message);
    } finally {
      setSharing(false);
    }
  };

  // Make note public (owner only)
  const makePublic = async () => {
    setShareError(''); setShareSuccess(''); setSharing(true);
    try {
      const res = await NotesAPI.share(note.id, { isPublic: true });
      setShareSuccess(res.message || 'Note shared publicly');
      if (res.shareLink) setShareLinkState(res.shareLink);
      else if (res.shareId) setShareLinkState(makeShareUrl(res.shareId));
      toast('Note is now public', 'success');
      loadAccessList();
    } catch (err) {
      setShareError(err.message || 'Failed to make public');
    } finally {
      setSharing(false);
    }
  };

  // ---- Revoke access ---------------------------------------------------
  const doRevoke = async (userId, userName) => {
    if (!window.confirm(`Remove ${userName}'s access to this note?`)) return;
    setRevokingId(userId);
    try {
      await NotesAPI.revokeShare(note.id, userId);
      toast(`Access removed for ${userName}`, 'info');
      loadAccessList();
    } catch (err) {
      toast('Failed to revoke: ' + err.message, 'error');
    } finally {
      setRevokingId(null);
    }
  };

  if (!note) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 500, overflow: 'hidden', position: 'relative' }}>

        {/* ══════════════════ MAIN PANEL ══════════════════ */}
        <div className={`share-panel ${showManage ? 'share-panel--hidden' : ''}`}>

          {/* Header */}
          <div className="modal-header">
            <h2>Share Note</h2>
            <button className="modal-close-btn" onClick={onClose}><CloseIcon /></button>
          </div>

          <div className="modal-body">

            {/* ── Section 1: Share Link ── */}
            <div>
              <p className="share-section-title">Share via Link</p>
              <p className="share-section-desc">
                {note.is_public
                  ? 'Public note — anyone with this link can view it.'
                  : "Private note — only users you've explicitly shared with can open this link."}
              </p>
              <div className="share-row">
                <input className="share-inp" type="text" value={shareLink} readOnly />
                <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copyLink}>
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="share-divider"><span>Share with a person</span></div>

            {/* ── Section 2: Share by email ── */}
            <div>
              <p className="share-section-title">Add people by email</p>
              <p className="share-section-desc">They must already have a NoteHub account.</p>
              <div className="share-row" style={{ marginTop: 10 }}>
                <input
                  className="share-inp"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setFoundUser(null); setLookupError(''); setShareSuccess(''); setShareError(''); }}
                  onKeyDown={handleEmailKeyDown}
                />
                <button className="btn btn-primary btn-sm" onClick={lookupUser} disabled={looking}>
                  {looking ? <span className="btn-spinner" /> : 'Find'}
                </button>
              </div>

              {lookupError && <p className="form-error" style={{ marginTop: 6 }}>{lookupError}</p>}

              {/* Found user preview */}
              {foundUser && (
                <div className="found-user-card">
                  <div className="found-user-info">
                    <div className="found-user-avatar">{foundUser.email.charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="found-user-name">{foundUser.name || foundUser.email.split('@')[0]}</div>
                      <div className="found-user-email">{foundUser.email}</div>
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={doShare} disabled={sharing}>
                    {sharing ? <span className="btn-spinner" /> : 'Share →'}
                  </button>
                </div>
              )}

              {shareSuccess && <p className="form-success" style={{ marginTop: 6 }}>✓ {shareSuccess}</p>}
              {shareError   && <p className="form-error"  style={{ marginTop: 6 }}>{shareError}</p>}
            </div>

            {/* ── Section 3: Access summary row ── */}
            <div className="access-summary-row">
              <div className="access-summary-left">
                <span className="share-section-title">Who has access</span>
                {loadingList ? (
                  <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                ) : (
                  <span className="access-count-badge">{accessList.length}</span>
                )}
              </div>
              {accessList.length > 0 && (
                <button className="access-manage-btn" onClick={() => setShowManage(true)}>
                  Manage →
                </button>
              )}
              {!loadingList && accessList.length === 0 && (
                <span className="access-none-text">Not shared yet</span>
              )}
            </div>

          </div>
        </div>

        {/* ══════════════════ MANAGE ACCESS SUB-PANEL ══════════════════ */}
        <div className={`share-panel share-manage-panel ${showManage ? 'share-panel--visible' : ''}`}>

          {/* Header */}
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className="icon-btn" onClick={() => setShowManage(false)} title="Back">
                <BackIcon />
              </button>
              <h2 style={{ margin: 0 }}>Manage Access</h2>
              <span className="access-count-badge">{accessList.length}</span>
            </div>
            <button className="modal-close-btn" onClick={onClose}><CloseIcon /></button>
          </div>

          <div className="modal-body">
            <p className="share-section-desc" style={{ margin: 0 }}>
              Click <strong>Remove</strong> next to a person to revoke their access to this note.
            </p>

            {loadingList ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gray-400)', fontSize: '.83rem' }}>
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Loading…
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {accessList.map(u => (
                  <div key={u.id} className="access-list-row">
                    <div className="access-list-avatar">{u.email.charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="access-list-name">{u.name || u.email.split('@')[0]}</div>
                      <div className="access-list-meta">{u.email} · Shared {formatDate(u.shared_at)}</div>
                    </div>
                    <button
                      className="revoke-btn"
                      title={`Remove ${u.name || u.email}'s access`}
                      onClick={() => doRevoke(u.id, u.name || u.email)}
                      disabled={revokingId === u.id}
                    >
                      {revokingId === u.id
                        ? <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2, borderTopColor: 'var(--danger)' }} />
                        : <TrashSmIcon />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
