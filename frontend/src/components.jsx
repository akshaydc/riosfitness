import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';

// ─── Icons ────────────────────────────────────────────────────────────────────
const icons = {
  users: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  dollar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  alert: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  search: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  x: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  eye: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  calendar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  ban: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
  ),
  trending: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  history: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="12 8 12 12 14 14"/>
      <path d="M3.05 11a9 9 0 1 0 .5-4.5L1 4"/>
      <polyline points="1 9 1 4 6 4"/>
    </svg>
  ),
  refresh: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
};

export function Icon({ name, size = 16, className = '' }) {
  const el = icons[name];
  if (!el) return null;
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, flexShrink: 0 }}
    >
      {el}
    </span>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Btn({ variant = 'primary', size = 'default', children, className = '', ...props }) {
  const styles = {
    primary: {
      background: 'var(--accent)',
      color: '#09090f',
      border: 'none',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-dim)',
      border: '1px solid var(--border)',
    },
    danger: {
      background: 'var(--danger-dim)',
      color: 'var(--danger)',
      border: '1px solid rgba(255,77,77,0.3)',
    },
    green: {
      background: 'var(--green-dim)',
      color: 'var(--green)',
      border: '1px solid rgba(34,197,94,0.3)',
    },
  };

  const sizeStyles = {
    default: { padding: '8px 16px', fontSize: '14px', borderRadius: 'var(--radius-sm)' },
    sm: { padding: '5px 10px', fontSize: '12px', borderRadius: '5px' },
  };

  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: 600,
        transition: 'opacity 0.15s, transform 0.1s',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.5 : 1,
        ...styles[variant],
        ...sizeStyles[size],
      }}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
const badgeConfig = {
  monthly:    { bg: 'var(--blue-dim)',   color: 'var(--blue)',   label: 'Monthly' },
  quarterly:  { bg: 'var(--accent-dim)', color: 'var(--accent)', label: 'Quarterly' },
  yearly:     { bg: 'var(--green-dim)',  color: 'var(--green)',  label: 'Yearly' },
  active:     { bg: 'var(--green-dim)',  color: 'var(--green)',  label: 'Active' },
  cancelled:  { bg: 'rgba(100,100,120,0.2)', color: 'var(--text-muted)', label: 'Cancelled' },
  overdue:    { bg: 'var(--danger-dim)', color: 'var(--danger)', label: 'Overdue' },
  'due-soon': { bg: 'var(--orange-dim)', color: 'var(--orange)', label: 'Due Soon' },
  ok:         { bg: 'var(--green-dim)',  color: 'var(--green)',  label: 'OK' },
  Cash:       { bg: 'var(--green-dim)',  color: 'var(--green)',  label: 'Cash' },
  UPI:        { bg: 'var(--blue-dim)',   color: 'var(--blue)',   label: 'UPI' },
  Card:       { bg: 'var(--accent-dim)', color: 'var(--accent)', label: 'Card' },
};

export function Badge({ type }) {
  const cfg = badgeConfig[type] || { bg: 'rgba(100,100,120,0.2)', color: 'var(--text-dim)', label: type };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 600,
      background: cfg.bg,
      color: cfg.color,
      textTransform: 'capitalize',
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon, accent = false, color }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${accent ? 'rgba(232,255,58,0.3)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: 500 }}>{label}</span>
        {icon && (
          <span style={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            background: accent ? 'var(--accent-dim)' : 'var(--surface2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accent ? 'var(--accent)' : color || 'var(--text-dim)',
          }}>
            <Icon name={icon} />
          </span>
        )}
      </div>
      <div style={{
        fontSize: '26px',
        fontWeight: 800,
        color: accent ? 'var(--accent)' : (color || 'var(--text)'),
        letterSpacing: '-0.5px',
      }}>
        {value}
      </div>
    </div>
  );
}

// ─── Form fields ──────────────────────────────────────────────────────────────
export function Field({ label, children, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dim)' }}>
        {label}{required && <span style={{ color: 'var(--accent)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  padding: '9px 12px',
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text)',
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.15s',
};

export function Input({ ...props }) {
  return (
    <input
      style={inputStyle}
      onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
      onBlur={e => (e.target.style.borderColor = 'var(--border)')}
      {...props}
    />
  );
}

export function Select({ children, ...props }) {
  return (
    <select
      style={{ ...inputStyle, cursor: 'pointer' }}
      onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
      onBlur={e => (e.target.style.borderColor = 'var(--border)')}
      {...props}
    >
      {children}
    </select>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, width = 480 }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        width: '100%',
        maxWidth: width,
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: 'var(--shadow)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 4, borderRadius: 4, display: 'flex' }}
          >
            <Icon name="x" />
          </button>
        </div>
        <div style={{ padding: '20px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function ModalActions({ children }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'flex-end', gap: '8px',
      marginTop: '20px',
      paddingTop: '16px',
      borderTop: '1px solid var(--border)',
    }}>
      {children}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed', bottom: '20px', right: '20px',
        display: 'flex', flexDirection: 'column', gap: '8px',
        zIndex: 9999,
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.type === 'error' ? '#2a0f0f' : '#0f1f0f',
            border: `1px solid ${t.type === 'error' ? 'rgba(255,77,77,0.4)' : 'rgba(34,197,94,0.4)'}`,
            color: t.type === 'error' ? 'var(--danger)' : 'var(--green)',
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: 'var(--shadow)',
            animation: 'fadeIn 0.2s ease',
            maxWidth: '320px',
          }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

export function Toasts() { return null; }

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ name, size = 36 }) {
  const initials = name
    ? name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?';
  const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: color + '33',
      border: `2px solid ${color}66`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.35,
      fontWeight: 700,
      color,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid var(--border)`,
      borderTopColor: 'var(--accent)',
      borderRadius: '50%',
      animation: 'spin 0.6s linear infinite',
    }} />
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = 'users', message = 'No results found' }) {
  return (
    <div style={{
      padding: '48px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      color: 'var(--text-muted)',
    }}>
      <Icon name={icon} size={32} />
      <p style={{ fontSize: '14px' }}>{message}</p>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtCurrency(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

export function dueDateStatus(member) {
  if (member.status === 'cancelled') return 'cancelled';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(member.due_date);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / 86400000);
  if (diff < 0) return 'overdue';
  if (diff <= 7) return 'due-soon';
  return 'active';
}
