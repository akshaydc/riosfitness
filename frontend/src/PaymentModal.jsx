import { useState } from 'react';
import { api } from './api';
import { Modal, ModalActions, Btn, Field, Input, Select, Badge, fmtDate, fmtCurrency, useToast } from './components';

const AMOUNTS = {
  monthly: 1200,
  quarterly: 3200,
  yearly: 11000,
};

export default function PaymentModal({ member, onClose, onPaid }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    amount: String(AMOUNTS[member.subscription_type] || 1200),
    payment_method: 'Cash',
    note: '',
  });

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
      });
      toast(`Payment added! Due extended to ${fmtDate(result.new_due_date)}`);
      onPaid();
    } catch (err) {
      toast(err.message || 'Payment failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
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
            {[1200, 3200, 11000].map(amt => (
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
  );
}
