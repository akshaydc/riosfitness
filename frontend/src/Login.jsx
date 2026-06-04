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
      background: 'linear-gradient(135deg, #0f1f3d 0%, #1a3160 60%, #0f1f3d 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* background decoration */}
      <div style={{
        position: 'absolute', top: -120, right: -120,
        width: 400, height: 400,
        borderRadius: '50%',
        background: 'rgba(255,107,53,0.08)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -80, left: -80,
        width: 300, height: 300,
        borderRadius: '50%',
        background: 'rgba(255,107,53,0.05)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: 420,
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Branding */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src="/logo.png"
            alt="Rios Fitness"
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              objectFit: 'cover',
              marginBottom: '20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              display: 'block',
              margin: '0 auto 20px',
            }}
          />
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '42px',
            fontWeight: 400,
            letterSpacing: '3px',
            color: '#ffffff',
            marginBottom: '6px',
            lineHeight: 1,
          }}>
            RIOS FITNESS
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Management System
          </p>
        </div>

        {/* Login card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f1f3d', marginBottom: '4px' }}>
            Welcome back
          </h2>
          <p style={{ color: '#6c757d', fontSize: '13px', marginBottom: '24px' }}>
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Field label="Email Address" required>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@rios.fit"
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

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '8px',
                width: '100%',
                padding: '13px 24px',
                background: loading ? '#e9ecef' : '#ff6b35',
                color: loading ? '#6c757d' : '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '0.3px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(255,107,53,0.4)',
                transition: 'all 0.2s',
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#e55a25'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,107,53,0.5)'; } }}
              onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = '#ff6b35'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,107,53,0.4)'; } }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
