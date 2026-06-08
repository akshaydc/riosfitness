import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api';
import {
  Btn, Icon, StatCard, Badge, Avatar, Spinner, EmptyState,
  fmtDate, fmtCurrency, dueDateStatus, useToast,
} from './components';
import AddMemberModal from './AddMemberModal';
import PaymentModal from './PaymentModal';
import MemberDetailModal from './MemberDetailModal';
import ImportModal from './ImportModal';

const dropdownStyle = (active) => ({
  height: '40px',
  width: '160px',
  padding: '0 10px',
  background: active ? 'var(--navy)' : 'var(--surface)',
  color: active ? '#ffffff' : 'var(--text-dim)',
  border: `1px solid ${active ? 'var(--navy)' : 'var(--border)'}`,
  borderRadius: 'var(--radius-sm)',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  outline: 'none',
  boxShadow: 'var(--shadow-sm)',
  fontFamily: 'inherit',
  flexShrink: 0,
});

export default function MembersView({ user }) {
  const toast = useToast();
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSub, setFilterSub] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTiming, setFilterTiming] = useState('');
  const [filterBalance, setFilterBalance] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [paymentMember, setPaymentMember] = useState(null);
  const [detailMemberId, setDetailMemberId] = useState(null);

  const [dismissedBanners, setDismissedBanners] = useState({ overdue: false, dueSoon: false });
  const tableRef = useRef();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search: search || undefined,
        subscription_type: filterSub || undefined,
        timing: filterTiming || undefined,
      };
      if (filterStatus === 'overdue') {
        params.due_filter = 'overdue';
      } else if (filterStatus === 'due_soon') {
        params.due_filter = 'due_soon';
      } else if (filterStatus) {
        params.status = filterStatus;
      }
      if (filterBalance) {
        params.has_balance = 'true';
      }
      const [m, s] = await Promise.all([api.getMembers(params), api.getStats()]);
      setMembers(m);
      setStats(s);
    } catch (err) {
      toast(err.message || 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filterSub, filterStatus, filterTiming, filterBalance]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load]);

  function getDueStatusBadge(member) {
    const s = dueDateStatus(member);
    return <Badge type={s} />;
  }

  function exportCSV() {
    const headers = ['Name', 'Phone', 'Email', 'Subscription', 'Joined', 'Due Date', 'Status', 'Total Paid'];
    const rows = members.map(m => [
      m.name, m.phone || '', m.email || '', m.subscription_type,
      m.joined_date || '', m.due_date, m.status,
      m.total_paid,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'rios-fitness-members.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    const rows = members.map(m => `
      <tr>
        <td>${m.name}</td>
        <td>${m.phone || '—'}</td>
        <td>${m.subscription_type}</td>
        <td>${m.due_date}</td>
        <td>${m.status}</td>
        <td>Rs. ${Number(m.total_paid).toLocaleString('en-IN')}</td>
      </tr>`).join('');
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>Members Export</title>
      <style>
        body{font-family:sans-serif;padding:24px;color:#212529;}
        h1{font-size:20px;color:#0f1f3d;margin-bottom:4px;}
        .sub{font-size:12px;color:#6c757d;margin-bottom:20px;}
        table{width:100%;border-collapse:collapse;font-size:13px;}
        th{background:#0f1f3d;color:#fff;padding:9px 12px;text-align:left;}
        td{padding:8px 12px;border-bottom:1px solid #dee2e6;}
        tr:nth-child(even) td{background:#f8f9fa;}
        @media print{body{padding:0;}}
      </style>
    </head><body>
      <h1>RIOS FITNESS — Members</h1>
      <div class="sub">Exported ${new Date().toLocaleDateString('en-IN')} · ${members.length} members</div>
      <table>
        <thead><tr><th>Name</th><th>Phone</th><th>Subscription</th><th>Due Date</th><th>Status</th><th>Total Paid</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`);
    w.document.close(); w.focus();
    setTimeout(() => w.print(), 400);
  }

  function downloadTemplate() {
    const csv = 'name,phone,email,subscription_type,timing,join_date,due_date,notes\nArjun Mehta,9876543210,arjun@example.com,monthly,6AM,2025-06-01,2025-07-01,\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'members-template.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  const activeStatFilter = filterBalance
    ? 'balance'
    : (filterStatus === 'active' || filterStatus === 'overdue' || filterStatus === 'due_soon')
      ? filterStatus
      : null;

  function handleStatClick(cardFilter) {
    const isActive = activeStatFilter === cardFilter || (cardFilter === 'all' && !activeStatFilter);
    if (isActive && cardFilter !== 'all') {
      setFilterStatus('');
      setFilterBalance(false);
      return;
    }
    if (cardFilter === 'all') {
      setFilterStatus('');
      setFilterBalance(false);
    } else if (cardFilter === 'balance') {
      setFilterBalance(true);
      setFilterStatus('');
    } else {
      setFilterStatus(cardFilter);
      setFilterBalance(false);
    }
    setTimeout(() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  const FILTER_LABELS = {
    all: 'All Members',
    active: 'Active Members',
    overdue: 'Overdue Members',
    due_soon: 'Members Due This Week',
    balance: 'Members with Balance Due',
  };

  // Compute banner data from all members (unfiltered by tab/dropdown)
  const today = new Date(); today.setHours(0,0,0,0);
  const overdueMembers = members.filter(m => {
    if (m.status === 'cancelled') return false;
    const due = new Date(m.due_date); due.setHours(0,0,0,0);
    return due < today;
  });
  const dueSoonMembers = members.filter(m => {
    if (m.status === 'cancelled') return false;
    const due = new Date(m.due_date); due.setHours(0,0,0,0);
    const diff = Math.round((due - today) / 86400000);
    return diff >= 0 && diff <= 7;
  });

  function daysDiff(dateStr) {
    const due = new Date(dateStr); due.setHours(0,0,0,0);
    return Math.round((today - due) / 86400000);
  }

  function NotifBanner({ members: bMembers, type }) {
    const isOverdue = type === 'overdue';
    const dismissed = isOverdue ? dismissedBanners.overdue : dismissedBanners.dueSoon;
    if (!bMembers.length || dismissed) return null;
    const bg = isOverdue ? '#fff5f5' : '#fffbeb';
    const border = isOverdue ? '#fca5a5' : '#fcd34d';
    const textColor = isOverdue ? '#dc2626' : '#92400e';
    const label = isOverdue
      ? `${bMembers.length} member${bMembers.length > 1 ? 's' : ''} with overdue payments`
      : `${bMembers.length} member${bMembers.length > 1 ? 's' : ''} due this week`;
    return (
      <div style={{
        background: bg,
        border: `1px solid ${border}`,
        borderLeft: `4px solid ${isOverdue ? '#dc2626' : '#f59e0b'}`,
        borderRadius: 'var(--radius-sm)',
        padding: '12px 14px',
        marginBottom: '12px',
        animation: 'fadeIn 0.2s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '13px', color: textColor, marginBottom: '8px' }}>
              {isOverdue ? '⚠ ' : '🕐 '}{label}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {bMembers.map(m => (
                <button
                  key={m.id}
                  onClick={() => setDetailMemberId(m.id)}
                  style={{
                    background: isOverdue ? '#fee2e2' : '#fef3c7',
                    border: `1px solid ${isOverdue ? '#fca5a5' : '#fcd34d'}`,
                    borderRadius: '6px',
                    padding: '3px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: textColor,
                    cursor: 'pointer',
                  }}
                >
                  {m.name}
                  <span style={{ fontWeight: 400, marginLeft: 4 }}>
                    {isOverdue ? `· ${daysDiff(m.due_date)}d overdue` : `· due ${fmtDate(m.due_date)}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setDismissedBanners(prev => ({ ...prev, [isOverdue ? 'overdue' : 'dueSoon']: true }))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: textColor, padding: 2, flexShrink: 0 }}
          >
            <Icon name="x" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Members</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Export dropdown */}
          <div style={{ position: 'relative' }}>
            <Btn variant="ghost" size="sm" onClick={() => setShowExportMenu(v => !v)}>
              Export ▾
            </Btn>
            {showExportMenu && (
              <div
                style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: 4,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)',
                  zIndex: 200, minWidth: 160, overflow: 'hidden',
                }}
                onMouseLeave={() => setShowExportMenu(false)}
              >
                {[
                  { label: 'Export as CSV', fn: exportCSV },
                  { label: 'Export as PDF', fn: exportPDF },
                ].map(({ label, fn }) => (
                  <button
                    key={label}
                    onClick={() => { fn(); setShowExportMenu(false); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '10px 14px', fontSize: '13px', fontWeight: 500,
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-dim)',
                      borderBottom: '1px solid var(--border)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Btn variant="ghost" size="sm" onClick={downloadTemplate}>
            Template CSV
          </Btn>
          <Btn variant="ghost" size="sm" onClick={() => setShowImport(true)}>
            <Icon name="plus" />
            Import CSV
          </Btn>
          <Btn variant="primary" onClick={() => setShowAdd(true)}>
            <Icon name="plus" />
            Add Member
          </Btn>
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <StatCard
            label="Total Members" value={stats.total} icon="users"
            active={activeStatFilter === 'all'}
            onClick={() => handleStatClick('all')}
          />
          <StatCard
            label="Active" value={stats.active} icon="check" color="var(--green)"
            active={activeStatFilter === 'active'}
            onClick={() => handleStatClick('active')}
          />
          <StatCard
            label="Overdue" value={stats.overdue} icon="alert" color="var(--danger)"
            active={activeStatFilter === 'overdue'}
            onClick={() => handleStatClick('overdue')}
          />
          <StatCard
            label="Due This Week" value={stats.due_soon} icon="calendar" color="var(--orange)"
            active={activeStatFilter === 'due_soon'}
            onClick={() => handleStatClick('due_soon')}
          />
          <StatCard
            label="Balance Due" value={stats.balance_due_count ?? 0} icon="alert" color="var(--orange)"
            active={activeStatFilter === 'balance'}
            onClick={() => handleStatClick('balance')}
          />
          {user.role === 'super_admin' && (
            <StatCard
              label="Collected This Month"
              value={fmtCurrency(stats.collected_month)}
              icon="dollar"
              accent
            />
          )}
        </div>
      )}

      <NotifBanner members={overdueMembers} type="overdue" />
      <NotifBanner members={dueSoonMembers} type="due_soon" />

      {/* Filter label + toolbar */}
      <div ref={tableRef}>
      {activeStatFilter && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '10px', padding: '8px 12px',
          background: 'var(--accent-dim)',
          border: '1px solid rgba(255,107,53,0.3)',
          borderRadius: 'var(--radius-sm)',
          animation: 'fadeIn 0.2s ease',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>
            Showing: {FILTER_LABELS[activeStatFilter]}
          </span>
          <button
            onClick={() => { setFilterStatus(''); setFilterBalance(false); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--accent)', padding: '2px 6px' }}
          >
            Clear ×
          </button>
        </div>
      )}
      {/* Unified toolbar: search + filters + refresh */}
      <div className="filter-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: '0 0 auto', width: '280px' }}>
          <span style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}>
            <Icon name="search" />
          </span>
          <input
            className="search-input"
            style={{ paddingLeft: '34px', height: '40px', width: '100%', boxSizing: 'border-box' }}
            placeholder="Search by name, phone, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          className="filter-dropdown"
          value={filterSub}
          onChange={e => setFilterSub(e.target.value)}
          style={dropdownStyle(!!filterSub)}
        >
          <option value="">All Types</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">3 Months</option>
          <option value="6_months">6 Months</option>
          <option value="yearly">Annual</option>
        </select>

        <select
          className="filter-dropdown"
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setFilterBalance(false); }}
          style={dropdownStyle(!!filterStatus)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="overdue">Overdue</option>
          <option value="due_soon">Due Soon</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          className="filter-dropdown"
          value={filterTiming}
          onChange={e => setFilterTiming(e.target.value)}
          style={dropdownStyle(!!filterTiming)}
        >
          <option value="">All Timings</option>
          {['5AM','6AM','7AM','8AM','9AM','10AM','11AM','12PM','1PM','2PM','3PM','4PM','5PM','6PM','7PM','8PM','9PM','10PM'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <Btn variant="ghost" size="sm" onClick={load} style={{ height: '40px', whiteSpace: 'nowrap', flexShrink: 0 }}>
          <Icon name="refresh" />
          Refresh
        </Btn>
      </div>

      {/* Desktop table */}
      <div className="table-wrap members-table-section">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <Spinner />
          </div>
        ) : !members.length ? (
          <EmptyState icon="users" message="No members found" />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Subscription</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Total Paid</th>
                <th>Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id} onClick={() => setDetailMemberId(m.id)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Avatar name={m.name} size={32} photo={m.photo} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--navy)' }}>{m.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {m.phone || m.email || '—'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><Badge type={m.subscription_type} /></td>
                  <td>
                    <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                      {fmtDate(m.due_date)}
                    </span>
                  </td>
                  <td>{getDueStatusBadge(m)}</td>
                  <td>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>
                      {fmtCurrency(m.total_paid)}
                    </span>
                  </td>
                  <td>
                    {Number(m.balance_pending) > 0 ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: '13px', color: '#c2410c' }}>
                        ⚠ {fmtCurrency(m.balance_pending)}
                      </span>
                    ) : (
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#15803d' }}>₹0</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                      <Btn variant="ghost" size="sm" onClick={() => setDetailMemberId(m.id)} title="View details">
                        <Icon name="eye" />
                      </Btn>
                      {m.status !== 'cancelled' && (
                        <Btn variant="green" size="sm" onClick={() => setPaymentMember(m)} title="Add payment">
                          <Icon name="dollar" />
                        </Btn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile cards */}
      <div className="members-cards-section" style={{ display: 'none' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <Spinner />
          </div>
        ) : !members.length ? (
          <EmptyState icon="users" message="No members found" />
        ) : members.map(m => (
          <div
            key={m.id}
            onClick={() => setDetailMemberId(m.id)}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '14px',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <Avatar name={m.name} size={40} photo={m.photo} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
                  {m.membership_id || m.phone || '—'}
                </div>
              </div>
              {getDueStatusBadge(m)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <Badge type={m.subscription_type} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Due {fmtDate(m.due_date)}</span>
              {m.timing && (
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px' }}>
                  {m.timing}
                </span>
              )}
              {Number(m.balance_pending) > 0 && (
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#c2410c', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 4, padding: '2px 7px' }}>
                  ⚠ Balance: {fmtCurrency(m.balance_pending)}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
              <Btn variant="ghost" size="sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDetailMemberId(m.id)}>
                <Icon name="eye" /> View
              </Btn>
              {m.status !== 'cancelled' && (
                <Btn variant="green" size="sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setPaymentMember(m)}>
                  <Icon name="dollar" /> Pay
                </Btn>
              )}
            </div>
          </div>
        ))}
      </div>
      </div>{/* end tableRef wrapper */}

      {showAdd && (
        <AddMemberModal
          onClose={() => setShowAdd(false)}
          onAdded={() => load()}
        />
      )}

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={() => { setShowImport(false); load(); }}
        />
      )}

      {paymentMember && (
        <PaymentModal
          member={paymentMember}
          user={user}
          onClose={() => { setPaymentMember(null); load(); }}
          onPaid={() => load()}
        />
      )}

      {detailMemberId && (
        <MemberDetailModal
          memberId={detailMemberId}
          user={user}
          onClose={() => setDetailMemberId(null)}
          onUpdate={() => { setDetailMemberId(null); load(); }}
          onPayment={(m) => { setDetailMemberId(null); setPaymentMember(m); }}
        />
      )}
    </div>
  );
}
