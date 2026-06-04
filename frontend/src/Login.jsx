import { useState } from 'react';
import { api } from './api';
import { Btn, Input, Field, useToast } from './components';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const { token, user } = await api.login(email, password);
      localStorage.setItem('rf_token', token);
      onLogin(user);
    } catch (err) {
      toast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: '16px',
            background: 'var(--accent)',
            marginBottom: 16,
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#09090f" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
              <line x1="6" y1="1" x2="6" y2="4"/>
              <line x1="10" y1="1" x2="10" y2="4"/>
              <line x1="14" y1="1" x2="14" y2="4"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>
            Rios Fitness
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>
            Gym Management System
          </p>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '28px',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Field label="Email" required>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@rios.fit"
                autoFocus
                autoComplete="email"
              />
            </Field>
            <Field label="Password" required>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Field>
            <Btn type="submit" variant="primary" disabled={loading} style={{ marginTop: 4, justifyContent: 'center' }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Btn>
          </form>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '14px 18px',
        }}>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 600, marginBottom: 6 }}>Demo credentials</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Super Admin: <span style={{ color: 'var(--accent)' }}>super@rios.fit</span> / super123
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Admin: <span style={{ color: 'var(--blue)' }}>admin@rios.fit</span> / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
