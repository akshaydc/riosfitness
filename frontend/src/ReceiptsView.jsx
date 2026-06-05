import { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import {
  Btn, Icon, Spinner, EmptyState, Badge,
  fmtDate, fmtCurrency, useToast,
} from './components';
import ReceiptView from './ReceiptView';

function formatReceipt(r) {
  return {
    id: r.id,
    member_name: r.member_name,
    membership_id: r.membership_id,
    subscription_type: r.subscription_type,
    amount: r.amount,
    method: r.method,
    paid_date: r.paid_date,
    recorded_by: r.recorded_by,
    new_due_date: r.new_due_date,
    note: r.note,
    balance_pending: r.balance_pending != null ? Number(r.balance_pending) : null,
  };
}

export default function ReceiptsView() {
  const toast = useToast();
  const [receipts, setReceipts] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [autoPrint, setAutoPrint] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getReceipts({
        search: search || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        page,
      });
      setReceipts(result.receipts);
      setTotal(result.total);
      setPages(result.pages);
    } catch (err) {
      toast(err.message || 'Failed to load receipts', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, fromDate, toDate, page]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load]);

  function openReceipt(r) {
    setAutoPrint(false);
    setViewingReceipt(formatReceipt(r));
  }

  function downloadReceipt(r) {
    setAutoPrint(true);
    setViewingReceipt(formatReceipt(r));
  }

  function clearFilters() {
    setSearch('');
    setFromDate('');
    setToDate('');
    setPage(1);
  }

  const hasFilters = search || fromDate || toDate;

  const inputStyle = {
    height: '40px',
    padding: '0 10px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontFamily: 'inherit',
    outline: 'none',
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Receipts</h1>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {total} receipt{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '0 0 auto', width: '260px' }}>
          <span style={{
            position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', pointerEvents: 'none', display: 'flex', alignItems: 'center',
          }}>
            <Icon name="search" />
          </span>
          <input
            className="search-input"
            style={{ paddingLeft: '34px', height: '40px', width: '100%', boxSizing: 'border-box' }}
            placeholder="Search member, receipt ID…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>From</span>
          <input
            type="date"
            value={fromDate}
            onChange={e => { setFromDate(e.target.value); setPage(1); }}
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>To</span>
          <input
            type="date"
            value={toDate}
            onChange={e => { setToDate(e.target.value); setPage(1); }}
            style={inputStyle}
          />
        </div>

        {hasFilters && (
          <Btn variant="ghost" size="sm" onClick={clearFilters}>Clear</Btn>
        )}

        <Btn variant="ghost" size="sm" onClick={load} style={{ marginLeft: 'auto', height: '40px' }}>
          <Icon name="refresh" />
          Refresh
        </Btn>
      </div>

      {/* Desktop table */}
      <div className="table-wrap receipts-table-section">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <Spinner />
          </div>
        ) : !receipts.length ? (
          <EmptyState icon="receipt" message="No receipts found" />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Receipt ID</th>
                <th>Member</th>
                <th>Membership ID</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
                <th>Recorded By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map(r => (
                <tr key={r.id} onClick={() => openReceipt(r)}>
                  <td>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {r.id}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{r.member_name}</td>
                  <td>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {r.membership_id}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{fmtCurrency(r.amount)}</span>
                  </td>
                  <td><Badge type={r.method} /></td>
                  <td style={{ fontSize: '13px', color: 'var(--text-dim)' }}>{fmtDate(r.paid_date)}</td>
                  <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{r.recorded_by}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                      <Btn variant="ghost" size="sm" onClick={() => openReceipt(r)}>
                        <Icon name="eye" />
                        View
                      </Btn>
                      <Btn variant="ghost" size="sm" onClick={() => downloadReceipt(r)}>
                        Download
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile cards */}
      <div className="receipts-cards-section" style={{ display: 'none' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <Spinner />
          </div>
        ) : !receipts.length ? (
          <EmptyState icon="receipt" message="No receipts found" />
        ) : receipts.map(r => (
          <div
            key={r.id}
            onClick={() => openReceipt(r)}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '14px',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--navy)' }}>{r.member_name}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>{r.id}</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--navy)', flexShrink: 0, marginLeft: 8 }}>
                {fmtCurrency(r.amount)}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <Badge type={r.method} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{fmtDate(r.paid_date)}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
              <Btn variant="ghost" size="sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => openReceipt(r)}>
                <Icon name="eye" /> View
              </Btn>
              <Btn variant="ghost" size="sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => downloadReceipt(r)}>
                Download
              </Btn>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '16px' }}>
          <Btn variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            ← Prev
          </Btn>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Page {page} of {pages} ({total} total)
          </span>
          <Btn variant="ghost" size="sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}>
            Next →
          </Btn>
        </div>
      )}

      {viewingReceipt && (
        <ReceiptView
          receipt={viewingReceipt}
          onClose={() => { setViewingReceipt(null); setAutoPrint(false); }}
          autoPrint={autoPrint}
        />
      )}
    </div>
  );
}
