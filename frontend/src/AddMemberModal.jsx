import { useState, useEffect, useRef } from 'react';
import { api } from './api';
import { Modal, ModalActions, Btn, Field, Input, Select, Icon, useToast } from './components';
import ReceiptView from './ReceiptView';

const SUB_DAYS = { monthly: 30, quarterly: 90, '6_months': 180, yearly: 365 };
const DEFAULT_FEES = { monthly: 1000, quarterly: 2700, '6_months': 5000, yearly: 9000 };

const TIMINGS = [
  '5AM','6AM','7AM','8AM','9AM','10AM','11AM','12PM',
  '1PM','2PM','3PM','4PM','5PM','6PM','7PM','8PM','9PM','10PM',
];

const todayStr = () => new Date().toISOString().split('T')[0];

function calcDueDate(joinDate, subType) {
  if (!joinDate) return '';
  const d = new Date(joinDate);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + (SUB_DAYS[subType] || 30));
  return d.toISOString().split('T')[0];
}

async function compressImage(dataUrl) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 400;
      let { width: w, height: h } = img;
      const ratio = Math.min(maxDim / w, maxDim / h, 1);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.src = dataUrl;
  });
}

export default function AddMemberModal({ onClose, onAdded }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [photo, setPhoto] = useState('');
  const [receipt, setReceipt] = useState(null);
  const fileRef = useRef();
  const cameraRef = useRef();

  async function handlePhotoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const compressed = await compressImage(ev.target.result);
      setPhoto(compressed);
    };
    reader.readAsDataURL(file);
  }

  const [form, setForm] = useState(() => {
    const today = todayStr();
    const sub = 'monthly';
    return {
      name: '',
      phone: '',
      email: '',
      subscription_type: sub,
      join_date: today,
      due_date: calcDueDate(today, sub),
      notes: '',
      timing: '',
      subscription_fee: String(DEFAULT_FEES[sub]),
      amount_paid: String(DEFAULT_FEES[sub]),
      balance_pending: '0',
      payment_method: 'Cash',
    };
  });

  const { join_date, subscription_type } = form;

  useEffect(() => {
    const calculated = calcDueDate(join_date, subscription_type);
    const defaultFee = DEFAULT_FEES[subscription_type] || 1000;
    if (calculated) {
      setForm(prev => ({
        ...prev,
        due_date: calculated,
        subscription_fee: String(defaultFee),
        amount_paid: String(defaultFee),
      }));
    }
  }, [join_date, subscription_type]);

  function set(field, value) {
    if (field === 'phone') setPhoneError('');
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return toast('Name is required', 'error');
    if (!form.phone.trim()) { setPhoneError('Phone number is required'); return; }
    if (!form.due_date) return toast('Due date is required', 'error');

    setLoading(true);
    try {
      const payload = {
        ...form,
        photo: photo || undefined,
        subscription_fee: parseInt(form.subscription_fee) || undefined,
        amount_paid: parseFloat(form.amount_paid) || 0,
        balance_pending: parseInt(form.balance_pending) || 0,
        timing: form.timing || undefined,
      };
      const result = await api.addMember(payload);
      onAdded();

      if (result.receipt_id) {
        setReceipt({
          id: result.receipt_id,
          member_name: result.name,
          membership_id: result.membership_id,
          subscription_type: form.subscription_type,
          amount: parseFloat(form.amount_paid),
          method: form.payment_method,
          paid_date: new Date().toISOString().split('T')[0],
          recorded_by: result.recorded_by || 'Staff',
          new_due_date: result.new_due_date || result.due_date,
          note: null,
          balance_pending: parseInt(form.balance_pending) || 0,
        });
      } else {
        toast('Member added successfully');
        onClose();
      }
    } catch (err) {
      toast(err.message || 'Failed to add member', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (receipt) {
    return <ReceiptView receipt={receipt} onClose={onClose} />;
  }

  return (
    <Modal title="Add New Member" onClose={onClose} width={520}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Photo upload */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            onClick={() => fileRef.current.click()}
            style={{
              width: 72, height: 72,
              borderRadius: '50%',
              border: '2px dashed var(--border-strong)',
              cursor: 'pointer',
              overflow: 'hidden',
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--surface2)',
            }}
          >
            {photo ? (
              <img src={photo} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3, padding: '0 6px' }}>
                Add<br/>Photo
              </span>
            )}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4 }}>Member Photo</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 8 }}>Optional · JPG or PNG</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Btn type="button" variant="ghost" size="sm" onClick={() => fileRef.current.click()}>
                Upload Photo
              </Btn>
              <Btn type="button" variant="ghost" size="sm" onClick={() => cameraRef.current.click()}>
                <Icon name="camera" />
                Take Photo
              </Btn>
              {photo && (
                <Btn type="button" variant="ghost" size="sm" onClick={() => setPhoto('')} style={{ color: 'var(--danger)' }}>
                  Remove
                </Btn>
              )}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoFile} />
          <input ref={cameraRef} type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={handlePhotoFile} />
        </div>

        <Field label="Full Name" required>
          <Input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Arjun Mehta"
            autoFocus
          />
        </Field>

        <div className="form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Phone" required>
            <Input
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="9876543210"
              type="tel"
              style={{ borderColor: phoneError ? 'var(--danger)' : undefined }}
            />
            {phoneError && (
              <span style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '2px' }}>{phoneError}</span>
            )}
          </Field>
          <Field label="Email">
            <Input
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="member@example.com"
              type="email"
            />
          </Field>
        </div>

        <div className="form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Subscription Type" required>
            <Select value={form.subscription_type} onChange={e => set('subscription_type', e.target.value)}>
              <option value="monthly">Monthly</option>
              <option value="quarterly">3 Months</option>
              <option value="6_months">6 Months</option>
              <option value="yearly">Annual</option>
            </Select>
          </Field>
          <Field label="Timing">
            <Select value={form.timing} onChange={e => set('timing', e.target.value)}>
              <option value="">Select timing…</option>
              {TIMINGS.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
        </div>

        <div className="form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Join Date" required>
            <Input type="date" value={form.join_date} onChange={e => set('join_date', e.target.value)} />
          </Field>
          <Field label="Due Date" required>
            <Input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Auto-calculated · editable</span>
          </Field>
        </div>

        <div className="form-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Membership Fee (₹)">
            <Input
              type="number" min="0"
              value={form.subscription_fee}
              onChange={e => set('subscription_fee', e.target.value)}
              placeholder="1000"
            />
          </Field>
          <Field label="Amount Paid Now (₹)">
            <Input
              type="number" min="0"
              value={form.amount_paid}
              onChange={e => set('amount_paid', e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>

        <Field label="Balance Pending (₹)">
          <Input
            type="number" min="0"
            value={form.balance_pending}
            onChange={e => set('balance_pending', e.target.value)}
            placeholder="0"
          />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Enter any remaining balance the member owes
          </span>
        </Field>

        {parseFloat(form.amount_paid) > 0 && (
          <Field label="Payment Method">
            <Select value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </Select>
          </Field>
        )}

        <Field label="Notes">
          <Input
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Any additional notes…"
          />
        </Field>

        <ModalActions>
          <Btn type="button" variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" variant="primary" disabled={loading}>
            {loading ? 'Adding…' : 'Add Member'}
          </Btn>
        </ModalActions>
      </form>
    </Modal>
  );
}
