import { useState, useRef } from 'react';
import { api } from './api';
import { Modal, ModalActions, Btn, Icon, Badge, useToast } from './components';

const VALID_SUBS = new Set(['monthly', 'quarterly', 'yearly']);

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map((line, i) => {
    const vals = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((h, j) => { row[h] = vals[j] || ''; });
    row._rowNum = i + 2;

    const errors = [];
    if (!row.name) errors.push('Name required');
    if (row.subscription_type && !VALID_SUBS.has(row.subscription_type.toLowerCase())) {
      errors.push(`Invalid subscription_type "${row.subscription_type}"`);
    }
    if (!row.subscription_type) row.subscription_type = 'monthly';
    row._errors = errors;
    row._valid = errors.length === 0;
    return row;
  }).filter(r => r.name || r._errors.length);
}

export default function ImportModal({ onClose, onImported }) {
  const toast = useToast();
  const fileRef = useRef();
  const [rows, setRows] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(null); // { done, total, failed }
  const [done, setDone] = useState(false);

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => setRows(parseCSV(e.target.result));
    reader.readAsText(file);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  const validRows = rows ? rows.filter(r => r._valid) : [];
  const invalidRows = rows ? rows.filter(r => !r._valid) : [];

  async function handleImport() {
    if (!validRows.length) return;
    setProgress({ done: 0, total: validRows.length, failed: 0 });
    let failed = 0;
    for (let i = 0; i < validRows.length; i++) {
      try {
        const { _rowNum, _errors, _valid, ...data } = validRows[i];
        await api.addMember(data);
      } catch {
        failed++;
      }
      setProgress({ done: i + 1, total: validRows.length, failed });
    }
    setDone(true);
    onImported();
  }

  const imported = progress ? progress.done - progress.failed : 0;

  return (
    <Modal title="Import Members from CSV" onClose={onClose} width={640}>
      {done ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Icon name="check" size={28} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>Import Complete</div>
          <div style={{ fontSize: '14px', color: 'var(--text-dim)' }}>
            <span style={{ color: 'var(--green)', fontWeight: 700 }}>{imported} imported</span>
            {progress.failed > 0 && <span style={{ color: 'var(--danger)', fontWeight: 700 }}> · {progress.failed} failed</span>}
          </div>
          <ModalActions>
            <Btn variant="primary" onClick={onClose}>Done</Btn>
          </ModalActions>
        </div>
      ) : progress ? (
        <div style={{ padding: '24px 0' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dim)', marginBottom: 12 }}>
            Importing… {progress.done} / {progress.total}
          </div>
          <div style={{ background: 'var(--surface2)', borderRadius: 8, overflow: 'hidden', height: 12, marginBottom: 8 }}>
            <div style={{
              height: '100%',
              width: `${(progress.done / progress.total) * 100}%`,
              background: 'var(--accent)',
              transition: 'width 0.2s',
              borderRadius: 8,
            }} />
          </div>
          {progress.failed > 0 && (
            <div style={{ fontSize: '12px', color: 'var(--danger)' }}>{progress.failed} failed so far</div>
          )}
        </div>
      ) : rows ? (
        <>
          <div style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
              <b style={{ color: 'var(--green)' }}>{validRows.length} valid</b>
              {invalidRows.length > 0 && <span> · <b style={{ color: 'var(--danger)' }}>{invalidRows.length} with errors</b></span>}
            </span>
            <Btn variant="ghost" size="sm" onClick={() => setRows(null)}>Change file</Btn>
          </div>

          <div style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            maxHeight: 320,
            overflowY: 'auto',
            marginBottom: 16,
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  {['#', 'Name', 'Phone', 'Email', 'Subscription', 'Join Date', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--text-dim)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row._rowNum} style={{ borderBottom: '1px solid var(--border)', background: row._valid ? undefined : '#fff5f5' }}>
                    <td style={{ padding: '7px 10px', color: 'var(--text-muted)' }}>{row._rowNum}</td>
                    <td style={{ padding: '7px 10px', fontWeight: 600 }}>{row.name || <span style={{ color: 'var(--danger)' }}>—</span>}</td>
                    <td style={{ padding: '7px 10px', color: 'var(--text-dim)' }}>{row.phone || '—'}</td>
                    <td style={{ padding: '7px 10px', color: 'var(--text-dim)' }}>{row.email || '—'}</td>
                    <td style={{ padding: '7px 10px' }}>
                      {row.subscription_type ? <Badge type={row.subscription_type.toLowerCase()} /> : '—'}
                    </td>
                    <td style={{ padding: '7px 10px', color: 'var(--text-dim)' }}>{row.join_date || '—'}</td>
                    <td style={{ padding: '7px 10px' }}>
                      {row._valid
                        ? <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: 11 }}>✓ OK</span>
                        : <span style={{ color: 'var(--danger)', fontSize: 11 }} title={row._errors.join(', ')}>✗ {row._errors[0]}</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ModalActions>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn
              variant="primary"
              disabled={!validRows.length}
              onClick={handleImport}
            >
              Import {validRows.length} member{validRows.length !== 1 ? 's' : ''}
            </Btn>
          </ModalActions>
        </>
      ) : (
        <>
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current.click()}
            style={{
              border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border-strong)'}`,
              borderRadius: 'var(--radius)',
              padding: '40px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? 'var(--accent-dim)' : 'var(--surface2)',
              transition: 'all 0.15s',
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: 10 }}>📄</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>
              Drop your CSV file here
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>or click to browse</div>
            <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          </div>

          <div style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            fontSize: '12px',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}>
            <b style={{ color: 'var(--text-dim)' }}>Expected columns:</b>{' '}
            name <span style={{ color: 'var(--accent)' }}>*</span>,
            phone, email, subscription_type (monthly/quarterly/yearly), join_date (YYYY-MM-DD), due_date (YYYY-MM-DD), notes
          </div>

          <ModalActions>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          </ModalActions>
        </>
      )}
    </Modal>
  );
}
