import { useState, useEffect } from 'react';
import { api } from './api';
import { Spinner, EmptyState, Badge, fmtDate, fmtCurrency, useToast } from './components';

function BarChart({ data }) {
  if (!data?.length) return <EmptyState icon="trending" message="No revenue data yet" />;

  const max = Math.max(...data.map(d => Number(d.total)));

  return (
    <div style={{ padding: '20px 20px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '160px' }}>
        {data.map((d, i) => {
          const pct = max > 0 ? (Number(d.total) / max) * 100 : 0;
          const isLast = i === data.length - 1;
          return (
            <div
              key={d.month}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                height: '100%',
                justifyContent: 'flex-end',
              }}
            >
              <div style={{
                fontSize: '11px',
                fontWeight: 700,
                color: isLast ? 'var(--accent)' : 'var(--text-dim)',
              }}>
                {fmtCurrency(d.total)}
              </div>
              <div style={{
                width: '100%',
                height: `${Math.max(pct, 4)}%`,
                background: isLast ? 'var(--accent)' : 'var(--surface3)',
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s ease',
                minHeight: 4,
              }} />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                {d.month}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ReportsView() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getRevenue(), api.getPayments()])
      .then(([rev, pay]) => {
        setData(rev);
        setPayments(pay);
      })
      .catch(() => toast('Failed to load revenue data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
      <Spinner size={32} />
    </div>
  );

  const totalThisMonth = data?.by_type?.reduce((s, t) => s + Number(t.total), 0) || 0;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Revenue Reports</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>Monthly Revenue</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>Last 6 months</div>
          </div>
          <BarChart data={data?.monthly} />
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>This Month by Type</div>
            <div style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 700, marginTop: 2 }}>
              {fmtCurrency(totalThisMonth)}
            </div>
          </div>
          <div style={{ padding: '12px' }}>
            {!data?.by_type?.length ? (
              <EmptyState icon="dollar" message="No data this month" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.by_type.map(t => (
                  <div key={t.subscription_type} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: 'var(--surface2)',
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge type={t.subscription_type} />
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {t.count} payment{t.count !== '1' ? 's' : ''}
                      </span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>{fmtCurrency(t.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700, fontSize: '15px' }}>Recent Payments</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>Last 100 transactions</div>
        </div>
        {!payments.length ? (
          <EmptyState icon="history" message="No payments recorded" />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
                <th>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} style={{ cursor: 'default' }}>
                  <td>
                    <span style={{ fontWeight: 600 }}>{p.member_name}</span>
                    {p.note && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 1 }}>{p.note}</div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--green)' }}>{fmtCurrency(p.amount)}</span>
                  </td>
                  <td><Badge type={p.payment_method} /></td>
                  <td>
                    <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>{fmtDate(p.paid_at)}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{p.recorded_by_name || '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
