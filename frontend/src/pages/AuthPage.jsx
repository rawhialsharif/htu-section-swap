import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AuthPage() {
  const { login } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ phone: '', name: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});

  const set = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.phone.trim()) e.phone = 'Phone number is required.';
    else if (form.phone.trim() !== 'admin' && !/^\+?[\d\s\-]{7,15}$/.test(form.phone.trim())) e.phone = 'Enter a valid phone number.';
    if (mode === 'register' && !form.name.trim()) e.name = 'Full name is required.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (mode === 'register' && form.password !== form.confirm) e.confirm = 'Passwords do not match.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login'
        ? { phone: form.phone.trim(), password: form.password }
        : { phone: form.phone.trim(), name: form.name.trim(), password: form.password };
      const data = await api.post(endpoint, payload);
      login(data.user, data.token);
      toast('Welcome to HTU Section Swap! 🎉', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🔄</div>
          <div>
            <div className="auth-logo-title">HTU Section Swap</div>
            <div className="auth-logo-sub">
              {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
            </div>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-name">Full Name</label>
              <input
                id="auth-name"
                className="form-input"
                type="text"
                placeholder="Your full name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                autoComplete="name"
              />
              {errors.name && <span className="form-error">⚠ {errors.name}</span>}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="auth-phone">Phone Number</label>
            <input
              id="auth-phone"
              className="form-input"
              type="tel"
              placeholder="+962 7X XXX XXXX"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              autoComplete="tel"
            />
            {errors.phone && <span className="form-error">⚠ {errors.phone}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-pass">Password</label>
            <input
              id="auth-pass"
              className="form-input"
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            {errors.password && <span className="form-error">⚠ {errors.password}</span>}
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-confirm">Confirm Password</label>
              <input
                id="auth-confirm"
                className="form-input"
                type="password"
                placeholder="Re-enter your password"
                value={form.confirm}
                onChange={(e) => set('confirm', e.target.value)}
                autoComplete="new-password"
              />
              {errors.confirm && <span className="form-error">⚠ {errors.confirm}</span>}
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            className="btn btn-primary btn-lg btn-full"
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : null}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <button id="switch-to-register" onClick={() => { setMode('register'); setErrors({}); }}>Sign up</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button id="switch-to-login" onClick={() => { setMode('login'); setErrors({}); }}>Sign in</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
