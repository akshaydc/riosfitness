import { useState, useEffect } from 'react';
import { api } from './api';
import {
  Modal, ModalActions, Btn, Badge, Avatar, Spinner, EmptyState,
  Field, Input, Select, Icon, fmtDate, fmtCurrency, dueDateStatus, useToast,
} from './components';
import ReceiptView from './ReceiptView';

const TIMINGS = [
  '5AM','6AM','7AM','8AM','9AM','10AM','11AM','12PM',
  '1PM','2PM','3PM','4PM','5PM','6PM','7PM','8PM','9PM','10PM',
];

function dateStr(d) {
  if (!d) return '';
  return String(d).split('T')[0];
}

export default function MemberDetailModal({ memberId, user, onClose, onUpdate, onPayment }) {
  const toast = useToast();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getMember(memberId)
      .then(setMember)
      .catch(() => toast('Failed to load member', 'error'))
      .finally(() => setLoading(false));

    api.getMemberReceipts(memberId)
      .then(setReceipts)
      .catch(() => {});
  }, [memberId]);

  function startEdit() {
    setEditForm({
      name: member.name,
      phone: member.phone || '',
      email: member.email || '',
      subscription_type: member.subscription_type,
      timing: member.timing || '',
      join_date: dateStr(member.joined_date),
      due_date: dateStr(member.due_date),
      subscription_fee: member.subscription_fee || '',
      status: member.status,
      notes: member.notes || '',
    });
    setEditing(true);
  }

  function setEdit(field, value) {
    setEditForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!editForm.name?.trim()) return toast('Name is required', 'error');
    setSaving(true);
    try {
      const updated = await api.updateMember(memberId, editForm);
      setMember(prev => ({ ...prev, ...updated }));
      setEditing(false);
      toast('Member updated');
      onUpdate();
    } catch (err) {
      toast(err.message || 'Failed to update', 'error');
    } finally {
      setSaving(false);
    }
  }

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
    <>
      <Modal title="Member Details" onClose={onClose} width={580}>
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
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Badge type={member.subscription_type} />
                  <Badge type={status} />
                  {member.membership_id && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px' }}>
                      {member.membership_id}
                    </span>
                  )}
                </div>
              </div>
              {!editing && (
                <Btn variant="ghost" size="sm" onClick={startEdit}>
                  <Icon name="edit" />
                  Edit
                </Btn>
              )}
            </div>

            {editing ? (
              /* ── Edit Form ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <Field label="Full Name" required>
                  <Input value={editForm.name} onChange={e => setEdit('name', e.target.value)} />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Field label="Phone">
                    <Input type="tel" value={editForm.phone} onChange={e => setEdit('phone', e.target.value)} placeholder="9876543210" />
                  </Field>
                  <Field label="Email">
                    <Input type="email" value={editForm.email} onChange={e => setEdit('email', e.target.value)} placeholder="member@example.com" />
                  </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Field label="Subscription Type">
                    <Select value={editForm.subscription_type} onChange={e => setEdit('subscription_type', e.target.value)}>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">3 Months</option>
                      <option value="6_months">6 Months</option>
                      <option value="yearly">Annual</option>
                    </Select>
                  </Field>
                  <Field label="Timing">
                    <Select value={editForm.timing} onChange={e => setEdit('timing', e.target.value)}>
                      <option value="">No timing</option>
                      {TIMINGS.map(t => <option key={t} value={t}>{t}</option>)}
                    </Select>
                  </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Field label="Join Date">
                    <Input type="date" value={editForm.join_date} onChange={e => setEdit('join_date', e.target.value)} />
                  </Field>
                  <Field label="Due Date">
                    <Input type="date" value={editForm.due_date} onChange={e => setEdit('due_date', e.target.value)} />
                  </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Field label="Membership Fee (₹)">
                    <Input type="number" min="0" value={editForm.subscription_fee} onChange={e => setEdit('subscription_fee', e.target.value)} placeholder="1000" />
                  </Field>
                  <Field label="Status">
                    <Select value={editForm.status} onChange={e => setEdit('status', e.target.value)}>
                      <option value="active">Active</option>
                      <option value="cancelled">Cancelled</option>
                    </Select>
                  </Field>
                </div>
                <Field label="Notes">
                  <Input value={editForm.notes} onChange={e => setEdit('notes', e.target.value)} placeholder="Any additional notes…" />
                </Field>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Btn variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>Cancel</Btn>
                  <Btn variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </Btn>
                </div>
              </div>
            ) : (
              /* ── Info Grid ── */
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '20px',
              }}>
                {[
                  { label: 'Phone', value: member.phone || '—' },
                  { label: 'Email', value: member.email || '—' },
                  { label: 'Joined', value: fmtDate(member.joined_date) },
                  { label: 'Due Date', value: fmtDate(member.due_date) },
                  { label: 'Total Paid', value: fmtCurrency(member.total_paid) },
                  { label: 'Status', value: member.status },
                  ...(member.timing ? [{ label: 'Timing', value: member.timing }] : []),
                  ...(member.subscription_fee ? [{ label: 'Fee', value: fmtCurrency(member.subscription_fee) }] : []),
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
            )}

            {!editing && member.notes && (
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

            {/* Payment History */}
            <div style={{ marginBottom: '16px' }}>
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
                  maxHeight: 180,
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
                        {p.note && p.note !== 'Initial payment' && (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 1 }}>{p.note}</div>
                        )}
                      </div>
                      <Badge type={p.payment_method} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Receipts */}
            <div style={{ marginBottom: '4px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="receipt" />
                Receipts ({receipts.length})
              </div>
              {!receipts.length ? (
                <EmptyState icon="receipt" message="No receipts yet" />
              ) : (
                <div style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  maxHeight: 180,
                  overflowY: 'auto',
                  background: 'var(--surface)',
                }}>
                  {receipts.map(r => (
                    <div key={r.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--border)',
                      gap: '12px',
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{fmtCurrency(r.amount)}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 1 }}>
                          {fmtDate(r.paid_date)} · {r.method} · <span style={{ fontFamily: 'monospace' }}>{r.id}</span>
                        </div>
                      </div>
                      <Btn
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingReceipt({
                          id: r.id,
                          member_name: r.member_name,
                          membership_id: r.membership_id,
                          amount: r.amount,
                          method: r.method,
                          paid_date: r.paid_date,
                          recorded_by: r.recorded_by,
                          new_due_date: r.new_due_date,
                          note: r.note,
                        })}
                      >
                        View Receipt
                      </Btn>
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

      {viewingReceipt && (
        <ReceiptView receipt={viewingReceipt} onClose={() => setViewingReceipt(null)} />
      )}
    </>
  );
}
