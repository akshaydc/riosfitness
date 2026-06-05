import { useState, useEffect } from 'react';
import { api } from './api';
import { Modal, ModalActions, Btn, Field, Input, Select, Badge, fmtDate, fmtCurrency, useToast } from './components';
import ReceiptView from './ReceiptView';

const AMOUNTS = {
  monthly: 1000,
  quarterly: 2700,
  '6_months': 5000,
  yearly: 9000,
  annual: 9000,
};

export default function PaymentModal({ member, user, onClose, onPaid }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const currentBalance = parseInt(member.balance_pending) || 0;
  const defaultFee = AMOUNTS[member.subscription_type] || 1000;
  const initialAmount = AMOUNTS[member.subscription_type] || 1200;

  const [form, setForm] = useState({
    amount: String(initialAmount),
    payment_method: 'Cash',
    note: '',
  });
  const [balancePendingAfter, setBalancePendingAfter] = useState(
    () => Math.max(0, currentBalance + defaultFee - initialAmount)
  );
  const [manualBalance, setManualBalance] = useState(false);

  useEffect(() => {
    if (!manualBalance) {
      const amt = parseFloat(form.amount) || 0;
      setBalancePendingAfter(Math.max(0, currentBalance + defaultFee - amt));
    }
  }, [form.amount, manualBalance]);

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return toast('Enter a valid amount', 'error');

    setLoading(true);
    try {
      const result = await api.recordPayment({
        member_id: member.id,
        amount,
        payment_method: form.payment_method,
        note: form.note || undefined,
        balance_pending: balancePendingAfter,
      });
      onPaid();
      setReceipt({
        id: result.receipt_id || `RCT-${Date.now()}`,
        member_name: member.name,
        membership_id: member.membership_id || `#${String(member.id).padStart(4, '0')}`,
        subscription_type: member.subscription_type,
        amount,
        method: form.payment_method,
        paid_date: new Date().toISOString().split('T')[0],
        recorded_by: result.recorded_by || user?.name || 'Staff',
        new_due_date: result.new_due_date,
        note: form.note || null,
        balance_pending: balancePendingAfter,
      });
    } catch (err) {
      toast(err.message || 'Payment failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Payment form modal — hidden once receipt is shown */}
      {!receipt && (
        <Modal title="Add Payment" onClose={onClose}>
          <div style={{
            background: 'linear-gradient(135deg, #f0f4ff, #f8f9fa)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>{member.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: 2 }}>
                Due: {fmtDate(member.due_date)}
              </div>
            </div>
            <Badge type={member.subscription_type} />
          </div>

          {currentBalance > 0 && (
            <div style={{
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              borderLeft: '4px solid #f97316',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              marginBottom: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#92400e' }}>Current Balance Pending</span>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#c2410c' }}>{fmtCurrency(currentBalance)}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field label="Amount (₹)" required>
              <Input
                type="number"
                min="1"
                step="1"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
                placeholder="1200"
                autoFocus
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                {[1000, 1500, 3000, 7777].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => set('amount', String(amt))}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: '11px',
                      fontWeight: 600,
                      background: form.amount === String(amt) ? 'var(--accent-dim)' : 'var(--surface2)',
                      color: form.amount === String(amt) ? 'var(--accent)' : 'var(--text-dim)',
                      border: `1px solid ${form.amount === String(amt) ? 'rgba(255,107,53,0.35)' : 'var(--border)'}`,
                      cursor: 'pointer',
                    }}
                  >
                    {fmtCurrency(amt)}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Balance Pending After Payment (₹)">
              <Input
                type="number"
                min="0"
                step="1"
                value={String(balancePendingAfter)}
                onChange={e => { setManualBalance(true); setBalancePendingAfter(Math.max(0, parseInt(e.target.value) || 0)); }}
                placeholder="0"
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Auto-calculated · editable
              </span>
            </Field>

            <Field label="Payment Method" required>
              <Select value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
              </Select>
            </Field>

            <Field label="Note">
              <Input
                value={form.note}
                onChange={e => set('note', e.target.value)}
                placeholder="Optional note…"
              />
            </Field>

            <ModalActions>
              <Btn type="button" variant="ghost" onClick={onClose}>Cancel</Btn>
              <Btn type="submit" variant="green" disabled={loading}>
                {loading ? 'Adding…' : 'Add Payment'}
              </Btn>
            </ModalActions>
          </form>
        </Modal>
      )}

      {receipt && <ReceiptView receipt={receipt} onClose={onClose} />}
    </>
  );
}
