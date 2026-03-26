import { useState } from 'react';
import { AuthAPI, setToken, setUser } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

/* ---- Icons ----------------------------------------- */
const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/><polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/></svg>
);
const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2"/></svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/></svg>
);
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
);
const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2"/></svg>
);
const LogoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="#fff" opacity="0.9"/><path d="M12 2v20M2 7l10 5 10-5" stroke="#fff" strokeWidth="1.5" opacity="0.5"/></svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.2)"/><polyline points="9 12 11 14 15 10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

/* ---- Password Field --------------------------------- */
function PasswordField({ id, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-wrap">
      <span className="input-icon"><LockIcon /></span>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        className="form-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required
      />
      <button type="button" className="eye-btn" onClick={() => setShow(s => !s)} tabIndex={-1}>
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

/* ---- Login Form ------------------------------------- */
function LoginForm({ onSuccess }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await AuthAPI.login({ email, password });
      setToken(data.token);
      const userData = { id: data.userId, email: data.email, role: data.role || 'user' };
      setUser(userData);
      toast(data.role === 'superadmin' ? 'Welcome, Super Admin! 🛡️' : 'Welcome back! 👋', 'success');
      onSuccess(userData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label" htmlFor="login-email">Email</label>
        <div className="input-wrap">
          <span className="input-icon"><EmailIcon /></span>
          <input id="login-email" type="email" className="form-input"
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" required autoComplete="email" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="login-pass">Password</label>
        <PasswordField id="login-pass" value={password} onChange={setPassword} placeholder="••••••••" />
      </div>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 4 }}>
        {loading ? <span className="btn-spinner" /> : 'Sign In →'}
      </button>
    </form>
  );
}

/* ---- Register Form ---------------------------------- */
function RegisterForm({ onSwitch }) {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await AuthAPI.register({ email, password, name });
      setSuccess('Account created! Redirecting to sign in…');
      setTimeout(() => onSwitch('login'), 1400);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label" htmlFor="reg-name">Full Name</label>
        <div className="input-wrap">
          <span className="input-icon"><UserIcon /></span>
          <input id="reg-name" type="text" className="form-input"
            value={name} onChange={e => setName(e.target.value)}
            placeholder="John Doe" autoComplete="name" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="reg-email">Email</label>
        <div className="input-wrap">
          <span className="input-icon"><EmailIcon /></span>
          <input id="reg-email" type="email" className="form-input"
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" required autoComplete="email" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="reg-pass">Password</label>
        <PasswordField id="reg-pass" value={password} onChange={setPassword} placeholder="At least 6 characters" />
      </div>
      {error   && <p className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}
      <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 4 }}>
        {loading ? <span className="btn-spinner" /> : 'Create Account →'}
      </button>
    </form>
  );
}

/* ---- Auth Page -------------------------------------- */
export default function AuthPage({ onLogin }) {
  const [tab, setTab] = useState('login');

  return (
    <div className="auth-page">

      {/* Left decorative panel */}
      <div className="auth-panel">
        <div className="auth-panel-blob auth-panel-blob-1" />
        <div className="auth-panel-blob auth-panel-blob-2" />
        <div className="auth-panel-blob auth-panel-blob-3" />
        <div className="auth-panel-content">
          <div className="auth-panel-logo">
            <div className="auth-panel-logo-icon"><LogoIcon /></div>
            <span className="auth-panel-logo-text">NoteHub</span>
          </div>
          <h2 className="auth-panel-headline">Your notes,<br />organised and secure.</h2>
          <p className="auth-panel-sub">The smart notepad built for alumni to capture ideas, share knowledge, and stay connected.</p>
          <div className="auth-feature-list">
            {[
              'Create and organise unlimited notes',
              'Share privately or make notes public',
              'Access anywhere, anytime',
              'Secure JWT-based authentication',
            ].map(f => (
              <div className="auth-feature-item" key={f}>
                <CheckIcon />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <h1 className="auth-card-heading">
            {tab === 'login' ? 'Sign in to NoteHub' : 'Create your account'}
          </h1>
          <p className="auth-card-sub">
            {tab === 'login'
              ? 'Welcome back! Enter your details to continue.'
              : 'Get started for free — no credit card required.'}
          </p>

          <div className="auth-tabs">
            <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Sign In</button>
            <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Sign Up</button>
          </div>

          {tab === 'login'
            ? <LoginForm onSuccess={onLogin} />
            : <RegisterForm onSwitch={setTab} />
          }

          <p className="auth-switch" style={{ marginTop: 20 }}>
            {tab === 'login'
              ? <>Don&apos;t have an account? <a onClick={() => setTab('register')}>Sign Up</a></>
              : <>Already have an account? <a onClick={() => setTab('login')}>Sign In</a></>}
          </p>
        </div>
      </div>
    </div>
  );
}
