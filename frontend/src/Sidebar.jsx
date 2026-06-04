import { Icon, Avatar } from './components';

const navItems = [
  { id: 'members',  label: 'Members',         icon: 'users',   roles: ['admin', 'super_admin'] },
  { id: 'receipts', label: 'Receipts',         icon: 'receipt', roles: ['admin', 'super_admin'] },
  { id: 'reports',  label: 'Revenue Reports',  icon: 'trending', roles: ['super_admin'] },
];

export default function Sidebar({ user, activeView, onNavigate, onLogout, isDrawerOpen }) {
  const accessible = navItems.filter(item => item.roles.includes(user?.role));
  const roleLabel = user?.role === 'super_admin' ? 'Owner' : 'Admin';

  return (
    <aside
      className={`sidebar${isDrawerOpen ? ' drawer-open' : ''}`}
      style={{
        width: 224,
        background: '#0f1f3d',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        flexShrink: 0,
      }}
    >
      {/* Brand header */}
      <div style={{
        padding: '20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '11px',
      }}>
        <div style={{
          width: 38, height: 38,
          borderRadius: '10px',
          background: '#ff6b35',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(255,107,53,0.4)',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
            <line x1="6" y1="1" x2="6" y2="4"/>
            <line x1="10" y1="1" x2="10" y2="4"/>
            <line x1="14" y1="1" x2="14" y2="4"/>
          </svg>
        </div>
        <div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontWeight: 400,
            fontSize: '18px',
            letterSpacing: '2px',
            color: '#ffffff',
            lineHeight: 1.1,
          }}>
            RIOS FITNESS
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: 2, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Management
          </div>
        </div>
      </div>

      {/* Navigation */}
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
                padding: '10px 12px',
                borderRadius: '8px',
                background: active ? 'rgba(255,107,53,0.18)' : 'transparent',
                color: active ? '#ff6b35' : 'rgba(255,255,255,0.65)',
                fontWeight: active ? 700 : 500,
                fontSize: '14px',
                border: active ? '1px solid rgba(255,107,53,0.3)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
                width: '100%',
                textAlign: 'left',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#ffffff'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; } }}
            >
              <Icon name={item.icon} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{
        padding: '12px 8px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 12px',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.05)',
        }}>
          <Avatar name={user?.name} size={30} />
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.name}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.45)',
              marginTop: 1,
            }}>
              {roleLabel}
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'transparent',
            color: 'rgba(255,255,255,0.45)',
            fontSize: '13px',
            fontWeight: 500,
            border: '1px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.15s',
            width: '100%',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(220,53,69,0.15)';
            e.currentTarget.style.color = '#ff6b6b';
            e.currentTarget.style.borderColor = 'rgba(220,53,69,0.25)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <Icon name="logout" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
