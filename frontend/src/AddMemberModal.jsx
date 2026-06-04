import { useState } from 'react';
import { api } from './api';
import { Modal, ModalActions, Btn, Field, Input, Select, useToast } from './components';

const defaultDueDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
};

const todayStr = () => new Date().toISOString().split('T')[0];

export default function AddMemberModal({ onClose, onAdded }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    subscription_type: 'monthly',
    due_date: defaultDueDate(),
    joined_date: todayStr(),
    notes: '',
  });

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return toast('Name is required', 'error');
    if (!form.due_date) return toast('Due date is required', 'error');

    setLoading(true);
    try {
      await api.addMember(form);
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
        <Field label="Full Name" required>
          <Input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Arjun Mehta"
            autoFocus
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Phone">
            <Input
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="9876543210"
              type="tel"
            />
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
          <Select value={form.subscription_type} onChange={e => set('subscription_type', e.target.value)}>
            <option value="monthly">Monthly (30 days)</option>
            <option value="quarterly">Quarterly (90 days)</option>
            <option value="yearly">Yearly (365 days)</option>
          </Select>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Due Date" required>
            <Input
              type="date"
              value={form.due_date}
              onChange={e => set('due_date', e.target.value)}
            />
          </Field>
          <Field label="Joined Date">
            <Input
              type="date"
              value={form.joined_date}
              onChange={e => set('joined_date', e.target.value)}
            />
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
