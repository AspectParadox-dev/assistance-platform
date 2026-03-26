import Table from '../ui/Table';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { deleteDonation } from '../../api/donations.api';
import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

const METHOD_COLORS = {
  CHECK: 'bg-blue-100 text-blue-700',
  ZELLE: 'bg-purple-100 text-purple-700',
  ACH: 'bg-teal-100 text-teal-700',
  CASH: 'bg-green-100 text-green-700',
  ONLINE: 'bg-orange-100 text-orange-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

export default function DonationTable({ donations, onDeleted }) {
  const { user } = useAuth();
  const canEdit = ['TREASURER', 'ADMIN'].includes(user?.role);
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  async function handleDelete(id) {
    if (!confirm('Delete this donation?')) return;
    setDeleting(id);
    setDeleteError('');
    try {
      await deleteDonation(id);
      onDeleted?.(id);
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Failed to delete donation');
    } finally {
      setDeleting(null);
    }
  }

  const columns = [
    { key: 'donorName', header: 'Donor' },
    { key: 'donorEmail', header: 'Email', render: (r) => r.donorEmail || '—' },
    { key: 'amount', header: 'Amount', render: (r) => formatCurrency(r.amount) },
    { key: 'method', header: 'Method', render: (r) => <Badge label={r.method} className={METHOD_COLORS[r.method]} /> },
    { key: 'referenceNumber', header: 'Reference', render: (r) => r.referenceNumber || '—' },
    { key: 'receivedDate', header: 'Received', render: (r) => formatDate(r.receivedDate) },
    { key: 'importBatchId', header: 'Source', render: (r) => r.importBatchId ? 'CSV Import' : 'Manual' },
    {
      key: 'actions', header: '',
      render: (r) => canEdit ? (
        <Button size="sm" variant="danger" loading={deleting === r.id} onClick={() => handleDelete(r.id)}>Delete</Button>
      ) : null,
    },
  ];

  return (
    <>
      {deleteError && <div className="px-4 pt-3"><Alert variant="error" message={deleteError} /></div>}
      <Table columns={columns} data={donations} emptyMessage="No donations recorded." />
    </>
  );
}
