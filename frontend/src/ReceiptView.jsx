import { useEffect } from 'react';
import { fmtDate, fmtCurrency, Icon } from './components';

const SUB_LABELS = {
  monthly: 'Monthly', quarterly: '3 Months',
  '6_months': '6 Months', yearly: 'Annual', annual: 'Annual',
};

function GymLogo() {
  return (
    <img
      src="/logo.png"
      alt="Rios Fitness"
      style={{
        width: 52, height: 52,
        borderRadius: '50%',
        objectFit: 'cover',
        flexShrink: 0,
        boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
      }}
    />
  );
}

function Row({ label, value, large }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      padding: '10px 0',
      borderBottom: '1px solid #e9ecef',
      gap: 16,
    }}>
      <span style={{ fontSize: 13, color: '#6c757d', fontWeight: 500, flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: large ? 18 : 13,
        fontWeight: large ? 800 : 600,
        color: large ? '#0f1f3d' : '#212529',
        textAlign: 'right',
      }}>{value}</span>
    </div>
  );
}

export default function ReceiptView({ receipt, onClose, autoPrint = false, autoWhatsapp = false }) {
  useEffect(() => {
    if (autoPrint) {
      const t = setTimeout(() => window.print(), 350);
      return () => clearTimeout(t);
    }
  }, [autoPrint]);

  useEffect(() => {
    if (autoWhatsapp && receipt.whatsapp_link) {
      window.open(receipt.whatsapp_link, '_blank');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const balancePending = receipt.balance_pending != null ? Number(receipt.balance_pending) : null;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15,31,61,0.55)',
      backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1100,
      padding: 16,
    }}>
      <div className="rf-receipt" style={{
        background: '#ffffff',
        borderRadius: 14,
        width: '100%',
        maxWidth: 440,
        boxShadow: '0 8px 40px rgba(15,31,61,0.22)',
        overflow: 'hidden',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Navy header */}
        <div style={{
          background: '#0f1f3d',
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <GymLogo />
          <div>
            <div style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: 1,
              fontFamily: "'Bebas Neue', sans-serif",
              lineHeight: 1,
            }}>RIOS FITNESS</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>Payment Receipt</div>
          </div>
        </div>

        {/* White body */}
        <div style={{ padding: '20px 28px' }}>
          {/* Success banner */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#dcfce7', border: '1px solid #bbf7d0',
            borderRadius: 8, padding: '9px 14px', marginBottom: 18,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>Receipt Generated</span>
          </div>

          {/* Receipt rows */}
          <div>
            {rows.map(({ label, value, large }) => (
              <Row key={label} label={label} value={value} large={large} />
            ))}
          </div>

          {balancePending !== null && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: 8,
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

        {/* Action buttons — hidden when printing */}
        <div className="rf-no-print" style={{
          padding: '16px 28px 24px',
          borderTop: '1px solid #e9ecef',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => window.print()}
              style={{
                flex: 1,
                padding: '10px 0',
                background: '#0f1f3d',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Print Receipt
            </button>
            <button
              onClick={() => window.print()}
              style={{
                flex: 1,
                padding: '10px 0',
                background: '#f0fdf4',
                color: '#15803d',
                border: '1px solid #bbf7d0',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Download PDF
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px 0',
                background: '#f8f9fa',
                color: '#495057',
                border: '1px solid #dee2e6',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Close
            </button>
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: '#adb5bd' }}>
            Select "Save as PDF" in the print dialog to download as PDF
          </div>
          {receipt.whatsapp_link && (
            <button
              onClick={() => window.open(receipt.whatsapp_link, '_blank')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%',
                padding: '10px 0',
                background: '#25D366',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Icon name="whatsapp" />
              {receipt.whatsapp_label || 'Send WhatsApp Message'}
            </button>
          )}
          {autoWhatsapp && receipt.whatsapp_link && (
            <div style={{ textAlign: 'center', fontSize: 11, color: '#15803d', fontWeight: 600 }}>
              WhatsApp message opened in a new tab — please click Send
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
