import { Link } from 'react-router-dom';
import Table from '../ui/Table';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { updateDisbursement } from '../../api/disbursements.api';
import { useState, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';

const STATUS_COLORS = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function DisbursementTable({ disbursements, onUpdated }) {
  const { user } = useAuth();
  const canEdit = ['TREASURER', 'ADMIN'].includes(user?.role);
  const [updating, setUpdating] = useState(null);
  const [markPaidError, setMarkPaidError] = useState('');

  async function markPaid(id) {
    setUpdating(id);
    setMarkPaidError('');
    try {
      const updated = await updateDisbursement(id, { status: 'PAID' });
      onUpdated?.(updated);
    } catch (err) {
      setMarkPaidError(err?.response?.data?.error || 'Failed to mark disbursement as paid');
    } finally {
      setUpdating(null);
    }
  }

  const columns = [
    {
      key: 'application', header: 'Application',
      render: (r) => r.application ? (
        <Link to={`/dashboard/cases/${r.application.id}`} className="text-primary-600 hover:underline">
          {r.application.referenceNumber}
        </Link>
      ) : '—',
    },
    {
      key: 'applicant', header: 'Applicant',
      render: (r) => r.application ? `${r.application.firstName} ${r.application.lastName}` : '—',
    },
    { key: 'amount', header: 'Amount', render: (r) => formatCurrency(r.amount) },
    { key: 'method', header: 'Method', render: (r) => r.method },
    { key: 'scheduledDate', header: 'Scheduled', render: (r) => formatDate(r.scheduledDate) },
    { key: 'paidDate', header: 'Paid', render: (r) => formatDate(r.paidDate) },
    { key: 'status', header: 'Status', render: (r) => <Badge label={r.status} className={STATUS_COLORS[r.status]} /> },
    {
      key: 'actions', header: '',
      render: (r) => canEdit && r.status === 'SCHEDULED' ? (
        <Button size="sm" variant="success" loading={updating === r.id} onClick={() => markPaid(r.id)}>Mark Paid</Button>
      ) : null,
    },
  ];

  return (
    <>
      {markPaidError && <div className="px-4 pt-3"><Alert variant="error" message={markPaidError} /></div>}
      <Table columns={columns} data={disbursements} emptyMessage="No disbursements found." />
    </>
  );
}
