import { useState, useEffect, useCallback, createContext, useContext } from 'react';

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
    <svg width="16" height="16" viewBox="0 0 24 24">
      <text x="3" y="18" fontSize="16" fontWeight="700" fill="currentColor" fontFamily="'DM Sans',sans-serif">₹</text>
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
  receipt: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <line x1="10" y1="9" x2="8" y2="9"/>
    </svg>
  ),
  edit: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  camera: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
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
      color: '#ffffff',
      border: 'none',
      boxShadow: '0 2px 8px rgba(255,107,53,0.35)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-dim)',
      border: '1px solid var(--border)',
    },
    danger: {
      background: 'var(--danger-dim)',
      color: 'var(--danger)',
      border: '1px solid rgba(220,53,69,0.25)',
    },
    green: {
      background: 'var(--green-dim)',
      color: 'var(--green)',
      border: '1px solid rgba(25,135,84,0.25)',
    },
  };

  const sizeStyles = {
    default: { padding: '9px 18px', fontSize: '14px', borderRadius: 'var(--radius-sm)' },
    sm: { padding: '5px 10px', fontSize: '12px', borderRadius: '6px' },
  };

  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: 600,
        transition: 'opacity 0.15s, transform 0.1s, box-shadow 0.15s',
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
  monthly:    { bg: '#dbeafe',    color: '#1d4ed8',  label: 'Monthly' },
  quarterly:  { bg: '#ffedd5',    color: '#c2410c',  label: '3 Months' },
  '6_months': { bg: '#e0f2fe',    color: '#0369a1',  label: '6 Months' },
  yearly:     { bg: '#dcfce7',    color: '#15803d',  label: 'Annual' },
  annual:     { bg: '#dcfce7',    color: '#15803d',  label: 'Annual' },
  active:     { bg: '#dcfce7',    color: '#15803d',  label: 'Active' },
  cancelled:  { bg: '#f3f4f6',    color: '#6b7280',  label: 'Cancelled' },
  overdue:    { bg: '#fee2e2',    color: '#dc2626',  label: 'Overdue' },
  'due-soon': { bg: '#ffedd5',    color: '#c2410c',  label: 'Due Soon' },
  ok:         { bg: '#dcfce7',    color: '#15803d',  label: 'OK' },
  Cash:       { bg: '#dcfce7',    color: '#15803d',  label: 'Cash' },
  UPI:        { bg: '#dbeafe',    color: '#1d4ed8',  label: 'UPI' },
  Card:       { bg: '#ede9fe',    color: '#6d28d9',  label: 'Card' },
};

export function Badge({ type }) {
  const cfg = badgeConfig[type] || { bg: '#f3f4f6', color: '#6b7280', label: type };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 9px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 600,
      background: cfg.bg,
      color: cfg.color,
      textTransform: 'capitalize',
      whiteSpace: 'nowrap',
      letterSpacing: '0.1px',
    }}>
      {cfg.label}
    </span>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon, accent = false, color }) {
  const iconBg = accent
    ? 'rgba(255,107,53,0.12)'
    : color === 'var(--green)' ? 'rgba(25,135,84,0.10)'
    : color === 'var(--danger)' ? 'rgba(220,53,69,0.10)'
    : color === 'var(--orange)' ? 'rgba(253,126,20,0.10)'
    : '#f0f4ff';

  const iconColor = accent ? 'var(--accent)' : color || '#4b6cb7';

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${accent ? 'rgba(255,107,53,0.25)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      borderLeft: accent ? '3px solid var(--accent)' : undefined,
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </span>
        {icon && (
          <span style={{
            width: 34,
            height: 34,
            borderRadius: '9px',
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: iconColor,
          }}>
            <Icon name={icon} />
          </span>
        )}
      </div>
      <div style={{
        fontSize: '28px',
        fontWeight: 800,
        color: accent ? 'var(--accent)' : 'var(--navy)',
        letterSpacing: '-0.5px',
        lineHeight: 1,
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
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text)',
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

export function Input({ style, ...props }) {
  return (
    <input
      style={{ ...inputStyle, ...style }}
      onFocus={e => {
        e.target.style.borderColor = 'var(--accent)';
        e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)';
      }}
      onBlur={e => {
        e.target.style.borderColor = style?.borderColor || 'var(--border)';
        e.target.style.boxShadow = 'none';
      }}
      {...props}
    />
  );
}

export function Select({ children, ...props }) {
  return (
    <select
      style={{ ...inputStyle, cursor: 'pointer' }}
      onFocus={e => {
        e.target.style.borderColor = 'var(--accent)';
        e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)';
      }}
      onBlur={e => {
        e.target.style.borderColor = 'var(--border)';
        e.target.style.boxShadow = 'none';
      }}
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
      className="modal-overlay"
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15, 31, 61, 0.55)',
        backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal-inner"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          width: '100%',
          maxWidth: width,
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface2)',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)' }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'var(--surface3)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              color: 'var(--text-dim)',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-dim)'; e.currentTarget.style.color = 'var(--danger)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface3)'; e.currentTarget.style.color = 'var(--text-dim)'; }}
          >
            <Icon name="x" />
          </button>
        </div>
        <div style={{ padding: '22px' }}>
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
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderLeft: `4px solid ${t.type === 'error' ? 'var(--danger)' : 'var(--green)'}`,
            color: t.type === 'error' ? 'var(--danger)' : 'var(--green)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: 'var(--shadow-md)',
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
export function Avatar({ name, size = 36, photo }) {
  const initials = name
    ? name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?';
  const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        style={{
          width: size, height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: `2px solid ${color}50`,
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: color + '20',
      border: `2px solid ${color}50`,
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
      <div style={{
        width: 56, height: 56,
        borderRadius: '14px',
        background: 'var(--surface2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--border-strong)',
      }}>
        <Icon name={icon} size={24} />
      </div>
      <p style={{ fontSize: '14px', fontWeight: 500 }}>{message}</p>
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
