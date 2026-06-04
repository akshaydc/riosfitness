import { Icon, Avatar, Btn } from './components';

const navItems = [
  { id: 'members', label: 'Members', icon: 'users', roles: ['admin', 'super_admin'] },
  { id: 'reports', label: 'Revenue Reports', icon: 'trending', roles: ['super_admin'] },
];

export default function Sidebar({ user, activeView, onNavigate, onLogout }) {
  const accessible = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <aside style={{
      width: 220,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0,
    }}>
      <div style={{
        padding: '20px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{
          width: 36, height: 36,
          borderRadius: '10px',
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#09090f" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
            <line x1="6" y1="1" x2="6" y2="4"/>
            <line x1="10" y1="1" x2="10" y2="4"/>
            <line x1="14" y1="1" x2="14" y2="4"/>
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '-0.2px' }}>Rios Fitness</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 1 }}>Management</div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {accessible.map(item => {
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                background: active ? 'var(--accent-dim)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-dim)',
                fontWeight: active ? 600 : 500,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                width: '100%',
                textAlign: 'left',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface2)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon name={item.icon} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{
        padding: '12px 8px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 12px',
        }}>
          <Avatar name={user?.name} size={30} />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontSize: '13px',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s',
            width: '100%',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-dim)'; e.currentTarget.style.color = 'var(--danger)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <Icon name="logout" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
