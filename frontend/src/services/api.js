// =====================================================
// NoteHub – API Service
// Backend: http://localhost:5000/api
// =====================================================

const BASE_URL = 'http://localhost:5000/api';

function getToken() { return localStorage.getItem('nh_token'); }
export function setToken(t) { localStorage.setItem('nh_token', t); }
export function removeToken() { localStorage.removeItem('nh_token'); localStorage.removeItem('nh_user'); }
export function getUser() { const u = localStorage.getItem('nh_user'); return u ? JSON.parse(u) : null; }
export function setUser(u) { localStorage.setItem('nh_user', JSON.stringify(u)); }

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  let data;
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

// ---- Auth -------------------------------------------
export const AuthAPI = {
  register: ({ email, password, name }) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }),

  login: ({ email, password }) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  logout: () =>
    apiFetch('/auth/logout', { method: 'POST' }),

  getUserByEmail: (email) =>
    apiFetch(`/auth/user-by-email?email=${encodeURIComponent(email)}`),
};

// ---- Notes ------------------------------------------
export const NotesAPI = {
  create: ({ title, content, isPublic }) =>
    apiFetch('/notes/create', { method: 'POST', body: JSON.stringify({ title, content, isPublic }) }),

  getMyNotes: () => apiFetch('/notes/my-notes'),

  getSharedWithMe: () => apiFetch('/notes/shared-with-me'),

  getPublicNotes: () => apiFetch('/notes/public/all'),

  getById: (id) => apiFetch(`/notes/${id}`),

  getByShareId: (shareId) => apiFetch(`/notes/share/${shareId}`),

  update: (id, { title, content, isPublic }) =>
    apiFetch(`/notes/update/${id}`, { method: 'PUT', body: JSON.stringify({ title, content, isPublic }) }),

  delete: (id) => apiFetch(`/notes/${id}`, { method: 'DELETE' }),

  share: (noteId, { sharedWith, isPublic }) =>
    apiFetch(`/notes/share/${noteId}`, { method: 'POST', body: JSON.stringify({ sharedWith, isPublic }) }),

  getSharedUsers: (noteId) =>
    apiFetch(`/notes/share-list/${noteId}`),

  revokeShare: (noteId, targetUserId) =>
    apiFetch(`/notes/share/${noteId}/${targetUserId}`, { method: 'DELETE' }),
};

// ---- Admin (superadmin only) ------------------------
export const AdminAPI = {
  getUsers: () => apiFetch('/admin/users'),
};

