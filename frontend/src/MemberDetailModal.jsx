import { useState, useEffect } from 'react';
import { api } from './api';
import {
  Modal, ModalActions, Btn, Badge, Avatar, Spinner, EmptyState,
  Icon, fmtDate, fmtCurrency, dueDateStatus, useToast,
} from './components';

export default function MemberDetailModal({ memberId, user, onClose, onUpdate, onPayment }) {
  const toast = useToast();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.getMember(memberId)
      .then(setMember)
      .catch(() => toast('Failed to load member', 'error'))
      .finally(() => setLoading(false));
  }, [memberId]);

  async function handleCancel() {
    if (!confirm(`Cancel membership for ${member.name}? This cannot be undone.`)) return;
    setCancelling(true);
    try {
      await api.cancelMember(memberId);
      toast(`${member.name}'s membership cancelled`);
      onUpdate();
    } catch (err) {
      toast(err.message || 'Failed to cancel', 'error');
    } finally {
      setCancelling(false);
    }
  }

  const status = member ? dueDateStatus(member) : null;

  return (
    <Modal title="Member Details" onClose={onClose} width={560}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spinner />
        </div>
      ) : !member ? (
        <EmptyState message="Member not found" />
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
            <Avatar name={member.name} size={48} photo={member.photo} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{member.name}</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <Badge type={member.subscription_type} />
                <Badge type={status} />
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '20px',
          }}>
            {[
              { label: 'Phone', value: member.phone || '—', icon: 'users' },
              { label: 'Email', value: member.email || '—', icon: 'users' },
              { label: 'Joined', value: fmtDate(member.joined_date), icon: 'calendar' },
              { label: 'Due Date', value: fmtDate(member.due_date), icon: 'calendar' },
              { label: 'Total Paid', value: fmtCurrency(member.total_paid), icon: 'dollar' },
              { label: 'Status', value: member.status, icon: 'check' },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>
                  {label}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>{value}</div>
              </div>
            ))}
          </div>

          {member.notes && (
            <div style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              marginBottom: '20px',
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>
                Notes
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-dim)' }}>{member.notes}</div>
            </div>
          )}

          <div style={{ marginBottom: '4px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="history" />
              Payment History ({member.payments?.length || 0})
            </div>
            {!member.payments?.length ? (
              <EmptyState icon="dollar" message="No payments yet" />
            ) : (
              <div style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                maxHeight: 240,
                overflowY: 'auto',
                background: 'var(--surface)',
              }}>
                {member.payments.map(p => (
                  <div key={p.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--border)',
                    gap: '12px',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{fmtCurrency(p.amount)}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 1 }}>
                        {fmtDate(p.paid_at)} · {p.recorded_by_name || 'Staff'}
                      </div>
                      {p.note && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 1 }}>{p.note}</div>}
                    </div>
                    <Badge type={p.payment_method} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <ModalActions>
            {user?.role === 'super_admin' && member.status !== 'cancelled' && (
              <Btn variant="danger" size="sm" onClick={handleCancel} disabled={cancelling}>
                <Icon name="ban" />
                {cancelling ? 'Cancelling…' : 'Cancel Membership'}
              </Btn>
            )}
            <div style={{ flex: 1 }} />
            <Btn variant="ghost" onClick={onClose}>Close</Btn>
            {member.status !== 'cancelled' && (
              <Btn variant="green" onClick={() => { onClose(); onPayment(member); }}>
                <Icon name="dollar" />
                Add Payment
              </Btn>
            )}
          </ModalActions>
        </>
      )}
    </Modal>
  );
}
