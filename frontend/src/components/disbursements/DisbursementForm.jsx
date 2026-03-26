import { useState } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import { createDisbursement } from '../../api/disbursements.api';

const METHOD_OPTIONS = [
  { value: 'CHECK', label: 'Check' },
  { value: 'ZELLE', label: 'Zelle' },
  { value: 'ACH', label: 'ACH' },
  { value: 'CASH', label: 'Cash' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'OTHER', label: 'Other' },
];

export default function DisbursementForm({ applicationId, onCreated }) {
  const [form, setForm] = useState({ amount: '', method: 'CHECK', scheduledDate: '', referenceNumber: '', notes: '' });
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
      const scheduledDate = new Date(form.scheduledDate);
      if (isNaN(scheduledDate.getTime())) {
        setError('Please enter a valid scheduled date.');
        setLoading(false);
        return;
      }
      const data = { ...form, amount, scheduledDate: scheduledDate.toISOString() };
      const d = await createDisbursement(applicationId, data);
      setForm({ amount: '', method: 'CHECK', scheduledDate: '', referenceNumber: '', notes: '' });
      onCreated?.(d);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule disbursement');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Amount ($)" type="number" min="0.01" step="0.01" value={form.amount} onChange={set('amount')} required />
      <Select label="Payment Method" options={METHOD_OPTIONS} value={form.method} onChange={set('method')} />
      <Input label="Scheduled Date" type="date" value={form.scheduledDate} onChange={set('scheduledDate')} required />
      <Input label="Reference Number (optional)" value={form.referenceNumber} onChange={set('referenceNumber')} />
      <Textarea label="Notes (optional)" rows={2} value={form.notes} onChange={set('notes')} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" loading={loading}>Schedule Disbursement</Button>
    </form>
  );
}
