import { useState, useEffect, useRef } from 'react';
import { api } from './api';
import { Modal, ModalActions, Btn, Field, Input, Select, useToast } from './components';

const SUB_DAYS = { monthly: 30, quarterly: 90, yearly: 365 };

const todayStr = () => new Date().toISOString().split('T')[0];

function calcDueDate(joinDate, subType) {
  if (!joinDate) return '';
  const d = new Date(joinDate);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + (SUB_DAYS[subType] || 30));
  return d.toISOString().split('T')[0];
}

export default function AddMemberModal({ onClose, onAdded }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [photo, setPhoto] = useState('');
  const fileRef = useRef();

  function handlePhotoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  }

  const [form, setForm] = useState(() => {
    const today = todayStr();
    return {
      name: '',
      phone: '',
      email: '',
      subscription_type: 'monthly',
      join_date: today,
      due_date: calcDueDate(today, 'monthly'),
      notes: '',
    };
  });

  // Auto-recalculate due_date when join_date or subscription_type changes
  const { join_date, subscription_type } = form;
  useEffect(() => {
    const calculated = calcDueDate(join_date, subscription_type);
    if (calculated) {
      setForm(prev => ({ ...prev, due_date: calculated }));
    }
  }, [join_date, subscription_type]);

  function set(field, value) {
    if (field === 'phone') setPhoneError('');
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return toast('Name is required', 'error');
    if (!form.phone.trim()) {
      setPhoneError('Phone number is required');
      return;
    }
    if (!form.due_date) return toast('Due date is required', 'error');

    setLoading(true);
    try {
      await api.addMember({ ...form, photo: photo || undefined });
      toast('Member added successfully');
      onAdded();
    } catch (err) {
      toast(err.message || 'Failed to add member', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Add New Member" onClose={onClose}>
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
              position: 'relative',
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
            <div style={{ display: 'flex', gap: 6 }}>
              <Btn type="button" variant="ghost" size="sm" onClick={() => fileRef.current.click()}>Upload</Btn>
              {photo && <Btn type="button" variant="ghost" size="sm" onClick={() => setPhoto('')} style={{ color: 'var(--danger)' }}>Remove</Btn>}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoFile} />
        </div>

        <Field label="Full Name" required>
          <Input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Arjun Mehta"
            autoFocus
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Phone" required>
            <Input
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="9876543210"
              type="tel"
              style={{ borderColor: phoneError ? 'var(--danger)' : undefined }}
            />
            {phoneError && (
              <span style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '2px' }}>
                {phoneError}
              </span>
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

        <Field label="Subscription Type" required>
          <Select
            value={form.subscription_type}
            onChange={e => set('subscription_type', e.target.value)}
          >
            <option value="monthly">Monthly (30 days)</option>
            <option value="quarterly">Quarterly (90 days)</option>
            <option value="yearly">Yearly (365 days)</option>
          </Select>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Join Date" required>
            <Input
              type="date"
              value={form.join_date}
              onChange={e => set('join_date', e.target.value)}
            />
          </Field>
          <Field label="Due Date" required>
            <Input
              type="date"
              value={form.due_date}
              onChange={e => set('due_date', e.target.value)}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Auto-calculated · editable
            </span>
          </Field>
        </div>

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
