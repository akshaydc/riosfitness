import { useState, useEffect } from 'react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const SUB_LABELS = {
  monthly: 'Monthly', quarterly: '3 Months',
  '6_months': '6 Months', yearly: 'Annual', annual: 'Annual',
};

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return `${String(dt.getUTCDate()).padStart(2, '0')} ${MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
}

function fmtCurrency(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

function Row({ label, value, large }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '10px 0', borderBottom: '1px solid #e9ecef', gap: 16,
    }}>
      <span style={{ fontSize: 13, color: '#6c757d', fontWeight: 500, flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: large ? 18 : 13, fontWeight: large ? 800 : 600,
        color: large ? '#0f1f3d' : '#212529', textAlign: 'right',
      }}>{value}</span>
    </div>
  );
}

export default function ReceiptPage() {
  const receiptId = window.location.pathname.replace(/^\/receipt\//, '').split('?')[0];
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/receipts/public/${encodeURIComponent(receiptId)}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        if (!r.ok) throw new Error('Server error');
        return r.json();
      })
      .then(data => { if (data) setReceipt(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [receiptId]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
        <style>{`@keyframes rf-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#0f1f3d', borderRadius: '50%', animation: 'rf-spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (notFound || !receipt) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', gap: 12, padding: 24, textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="11" x2="12" y2="17"/>
          <line x1="9" y1="14" x2="15" y2="14"/>
        </svg>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#0f1f3d' }}>Receipt Not Found</div>
        <div style={{ fontSize: 14, color: '#6c757d', maxWidth: 320 }}>This receipt may have been deleted or the link is invalid.</div>
      </div>
    );
  }

  const balancePending = receipt.balance_pending != null ? Number(receipt.balance_pending) : null;

  const rows = [
    { label: 'Receipt No.', value: receipt.id },
    { label: 'Member', value: receipt.member_name },
    { label: 'Membership ID', value: receipt.membership_id },
    ...(receipt.subscription_type ? [{ label: 'Subscription', value: SUB_LABELS[receipt.subscription_type] || receipt.subscription_type }] : []),
    { label: 'Amount Paid', value: fmtCurrency(receipt.amount), large: true },
    { label: 'Payment Method', value: receipt.method },
    { label: 'Date', value: fmtDate(receipt.paid_date) },
    ...(receipt.new_due_date ? [{ label: 'Next Due Date', value: fmtDate(receipt.new_due_date) }] : []),
    { label: 'Recorded By', value: receipt.recorded_by },
    ...(receipt.note && receipt.note !== 'Initial payment' ? [{ label: 'Note', value: receipt.note }] : []),
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=Bebas+Neue&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0f2f5; font-family: 'DM Sans', sans-serif; }
        @media print {
          body { background: #fff !important; }
          .rp-no-print { display: none !important; }
          .rp-card { box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div className="rp-card" style={{
          background: '#ffffff', borderRadius: 14, width: '100%', maxWidth: 440,
          boxShadow: '0 8px 40px rgba(15,31,61,0.15)', overflow: 'hidden',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {/* Navy header */}
          <div style={{ background: '#0f1f3d', padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <img
              src="/logo.png"
              alt="Rios Fitness"
              style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.35)' }}
            />
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', letterSpacing: 1, fontFamily: "'Bebas Neue', sans-serif", lineHeight: 1 }}>
                RIOS FITNESS
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>Payment Receipt</div>
            </div>
          </div>

          {/* White body */}
          <div style={{ padding: '20px 28px' }}>
            {/* Success banner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 8, padding: '9px 14px', marginBottom: 18 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>Receipt Generated</span>
            </div>

            {/* Rows */}
            <div>
              {rows.map(({ label, value, large }) => (
                <Row key={label} label={label} value={value} large={large} />
              ))}
            </div>

            {/* Balance status */}
            {balancePending !== null && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: 12, padding: '10px 14px', borderRadius: 8,
                background: balancePending === 0 ? '#dcfce7' : '#fff7ed',
                border: `1px solid ${balancePending === 0 ? '#bbf7d0' : '#fed7aa'}`,
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: balancePending === 0 ? '#15803d' : '#92400e' }}>
                  {balancePending === 0 ? 'Payment Status' : 'Balance Pending'}
                </span>
                <span style={{ fontSize: 14, fontWeight: 800, color: balancePending === 0 ? '#15803d' : '#c2410c' }}>
                  {balancePending === 0 ? '✓ Fully Paid' : fmtCurrency(balancePending)}
                </span>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 18, fontSize: 11, color: '#adb5bd' }}>
              Thank you for your payment!
            </div>
          </div>

          {/* Actions */}
          <div className="rp-no-print" style={{ padding: '16px 28px 24px', borderTop: '1px solid #e9ecef', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => window.print()}
                style={{ flex: 1, padding: '10px 0', background: '#0f1f3d', color: '#ffffff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Print Receipt
              </button>
              <button
                onClick={() => window.print()}
                style={{ flex: 1, padding: '10px 0', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Download PDF
              </button>
            </div>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#adb5bd' }}>
              Select "Save as PDF" in the print dialog to download as PDF
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
