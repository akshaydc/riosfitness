import { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import {
  Btn, Icon, StatCard, Badge, Avatar, Spinner, EmptyState,
  fmtDate, fmtCurrency, dueDateStatus, useToast,
} from './components';
import AddMemberModal from './AddMemberModal';
import PaymentModal from './PaymentModal';
import MemberDetailModal from './MemberDetailModal';

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
  const [showAdd, setShowAdd] = useState(false);
  const [paymentMember, setPaymentMember] = useState(null);
  const [detailMemberId, setDetailMemberId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search: search || undefined,
        subscription_type: filterSub || undefined,
      };
      if (filterStatus === 'overdue') {
        params.due_filter = 'overdue';
      } else if (filterStatus === 'due_soon') {
        params.due_filter = 'due_soon';
      } else if (filterStatus) {
        params.status = filterStatus;
      }
      const [m, s] = await Promise.all([api.getMembers(params), api.getStats()]);
      setMembers(m);
      setStats(s);
    } catch (err) {
      toast(err.message || 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filterSub, filterStatus]);

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

      {/* Unified toolbar: search + filters + refresh */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
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
          value={filterSub}
          onChange={e => setFilterSub(e.target.value)}
          style={dropdownStyle(!!filterSub)}
        >
          <option value="">All Types</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={dropdownStyle(!!filterStatus)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="overdue">Overdue</option>
          <option value="due_soon">Due Soon</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <Btn variant="ghost" size="sm" onClick={load} style={{ height: '40px', whiteSpace: 'nowrap', flexShrink: 0 }}>
          <Icon name="refresh" />
          Refresh
        </Btn>
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
                          title="Add payment"
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
