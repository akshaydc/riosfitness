import { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import {
  Btn, Icon, StatCard, Badge, Avatar, Spinner, EmptyState,
  fmtDate, fmtCurrency, dueDateStatus, useToast,
} from './components';
import AddMemberModal from './AddMemberModal';
import PaymentModal from './PaymentModal';
import MemberDetailModal from './MemberDetailModal';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'due_soon', label: 'Due Soon' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function MembersView({ user }) {
  const toast = useToast();
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [paymentMember, setPaymentMember] = useState(null);
  const [detailMemberId, setDetailMemberId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search: search || undefined,
        status: activeTab !== 'all' ? activeTab : undefined,
      };
      const [m, s] = await Promise.all([api.getMembers(params), api.getStats()]);
      setMembers(m);
      setStats(s);
    } catch (err) {
      toast(err.message || 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, activeTab]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load]);

  function getDueStatusBadge(member) {
    const s = dueDateStatus(member);
    return <Badge type={s} />;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Members</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Btn variant="ghost" size="sm" onClick={load}>
            <Icon name="refresh" />
            Refresh
          </Btn>
          <Btn variant="primary" onClick={() => setShowAdd(true)}>
            <Icon name="plus" />
            Add Member
          </Btn>
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <StatCard label="Total Members" value={stats.total} icon="users" />
          <StatCard label="Active" value={stats.active} icon="check" color="var(--green)" />
          <StatCard label="Overdue" value={stats.overdue} icon="alert" color="var(--danger)" />
          <StatCard label="Due This Week" value={stats.due_soon} icon="calendar" color="var(--orange)" />
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

      <div className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="controls-row">
        <div className="search-wrap">
          <Icon name="search" />
          <input
            className="search-input"
            placeholder="Search by name, phone, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrap">
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id} onClick={() => setDetailMemberId(m.id)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Avatar name={m.name} size={32} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{m.name}</div>
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
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>
                      {fmtCurrency(m.total_paid)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                      <Btn
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailMemberId(m.id)}
                        title="View details"
                      >
                        <Icon name="eye" />
                      </Btn>
                      {m.status !== 'cancelled' && (
                        <Btn
                          variant="green"
                          size="sm"
                          onClick={() => setPaymentMember(m)}
                          title="Record payment"
                        >
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

      {showAdd && (
        <AddMemberModal
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); load(); }}
        />
      )}

      {paymentMember && (
        <PaymentModal
          member={paymentMember}
          onClose={() => setPaymentMember(null)}
          onPaid={() => { setPaymentMember(null); load(); }}
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
