import { useState } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import { createDonation } from '../../api/donations.api';

const METHOD_OPTIONS = [
  { value: 'CHECK', label: 'Check' },
  { value: 'ZELLE', label: 'Zelle' },
  { value: 'ACH', label: 'ACH' },
  { value: 'CASH', label: 'Cash' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'OTHER', label: 'Other' },
];

export default function DonationForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({ donorName: '', donorEmail: '', amount: '', method: 'CHECK', referenceNumber: '', receivedDate: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const amount = parseFloat(form.amount);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount.');
        setLoading(false);
        return;
      }
      const data = { ...form, amount };
      const d = await createDonation(data);
      setForm({ donorName: '', donorEmail: '', amount: '', method: 'CHECK', referenceNumber: '', receivedDate: '', notes: '' });
      onCreated?.(d);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add donation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Donor Name" value={form.donorName} onChange={set('donorName')} required />
      <Input label="Donor Email (optional)" type="email" value={form.donorEmail} onChange={set('donorEmail')} />
      <Input label="Amount ($)" type="number" min="0.01" step="0.01" value={form.amount} onChange={set('amount')} required />
      <Select label="Method" options={METHOD_OPTIONS} value={form.method} onChange={set('method')} />
      <Input label="Reference Number (optional)" value={form.referenceNumber} onChange={set('referenceNumber')} />
      <Input label="Received Date" type="date" value={form.receivedDate} onChange={set('receivedDate')} required />
      <Textarea label="Notes (optional)" rows={2} value={form.notes} onChange={set('notes')} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" loading={loading}>Add Donation</Button>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
