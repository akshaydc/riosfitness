import { useState } from 'react';
import { api } from './api';
import { Modal, ModalActions, Btn, Field, Input, Select, Badge, fmtDate, fmtCurrency, useToast } from './components';

const AMOUNTS = {
  monthly: 1200,
  quarterly: 3200,
  yearly: 11000,
};

export default function PaymentModal({ member, user, onClose, onPaid }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);
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
      setReceipt({
        memberName: member.name,
        memberId: member.id,
        amount,
        payment_method: form.payment_method,
        note: form.note,
        date: new Date().toISOString(),
        new_due_date: result.new_due_date,
        recorded_by: user?.name || 'Staff',
      });
      onPaid();
    } catch (err) {
      toast(err.message || 'Payment failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (receipt) {
    return (
      <Modal title="Payment Receipt" onClose={onClose}>
        <div className="print-receipt" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {/* Header */}
          <div style={{
            textAlign: 'center',
            padding: '16px 0 20px',
            borderBottom: '2px solid var(--border)',
            marginBottom: '20px',
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48, height: 48,
              borderRadius: '12px',
              background: '#0f1f3d',
              marginBottom: 10,
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ff6b35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                <line x1="6" y1="1" x2="6" y2="4"/>
                <line x1="10" y1="1" x2="10" y2="4"/>
                <line x1="14" y1="1" x2="14" y2="4"/>
              </svg>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f1f3d', letterSpacing: 1, fontFamily: "'Bebas Neue', sans-serif" }}>
              RIOS FITNESS
            </div>
            <div style={{ fontSize: '12px', color: '#6c757d', marginTop: 2 }}>Payment Receipt</div>
          </div>

          {/* Success badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#dcfce7',
            border: '1px solid #bbf7d0',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 20,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#15803d' }}>Payment recorded successfully</span>
          </div>

          {/* Receipt rows */}
          {[
            ['Member', receipt.memberName],
            ['Member ID', `#${String(receipt.memberId).padStart(4, '0')}`],
            ['Amount Paid', fmtCurrency(receipt.amount)],
            ['Payment Method', receipt.payment_method],
            ['Date', fmtDate(receipt.date)],
            ['New Due Date', fmtDate(receipt.new_due_date)],
            ['Recorded By', receipt.recorded_by],
            ...(receipt.note ? [['Note', receipt.note]] : []),
          ].map(([label, value]) => (
            <div key={label} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '9px 0',
              borderBottom: '1px solid var(--border)',
              gap: 12,
            }}>
              <span style={{ fontSize: '13px', color: '#6c757d', fontWeight: 500 }}>{label}</span>
              <span style={{
                fontSize: '13px',
                fontWeight: label === 'Amount Paid' ? 800 : 600,
                color: label === 'Amount Paid' ? '#0f1f3d' : '#212529',
                textAlign: 'right',
              }}>{value}</span>
            </div>
          ))}

          <ModalActions>
            <Btn
              type="button"
              variant="ghost"
              onClick={() => {
                const rows = [
                  ['Member', receipt.memberName],
                  ['Member ID', `#${String(receipt.memberId).padStart(4, '0')}`],
                  ['Amount Paid', `Rs. ${receipt.amount}`],
                  ['Payment Method', receipt.payment_method],
                  ['Date', new Date(receipt.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
                  ['New Due Date', new Date(receipt.new_due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
                  ['Recorded By', receipt.recorded_by],
                  ...(receipt.note ? [['Note', receipt.note]] : []),
                ];
                const w = window.open('', '_blank', 'width=420,height=600');
                w.document.write(`<!DOCTYPE html><html><head><title>Receipt</title>
                  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet"/>
                  <style>
                    body{font-family:'DM Sans',sans-serif;padding:32px;color:#212529;background:#fff;max-width:380px;margin:auto;}
                    h1{font-size:22px;font-weight:800;color:#0f1f3d;letter-spacing:1px;margin:0;}
                    .sub{font-size:12px;color:#6c757d;margin-top:2px;}
                    .logo{width:44px;height:44px;background:#0f1f3d;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:10px;}
                    .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #dee2e6;}
                    .label{font-size:13px;color:#6c757d;}
                    .val{font-size:13px;font-weight:600;color:#212529;text-align:right;}
                    .amount .val{font-weight:800;font-size:15px;color:#0f1f3d;}
                    .success{background:#dcfce7;border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;margin:16px 0;font-size:13px;font-weight:700;color:#15803d;}
                    @media print{body{padding:16px;}}
                  </style>
                </head><body>
                  <div style="text-align:center;padding-bottom:16px;border-bottom:2px solid #dee2e6;margin-bottom:16px;">
                    <div class="logo" style="margin:0 auto 10px;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff6b35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg></div>
                    <h1>RIOS FITNESS</h1>
                    <div class="sub">Payment Receipt</div>
                  </div>
                  <div class="success">✓ Payment recorded successfully</div>
                  ${rows.map(([l,v]) => `<div class="row ${l==='Amount Paid'?'amount':''}"><span class="label">${l}</span><span class="val">${v}</span></div>`).join('')}
                  <div style="text-align:center;margin-top:24px;font-size:11px;color:#adb5bd;">Thank you for your payment!</div>
                </body></html>`);
                w.document.close();
                w.focus();
                setTimeout(() => w.print(), 400);
              }}
            >
              Print Receipt
            </Btn>
            <Btn type="button" variant="primary" onClick={onClose}>Close</Btn>
          </ModalActions>
        </div>
      </Modal>
    );
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
