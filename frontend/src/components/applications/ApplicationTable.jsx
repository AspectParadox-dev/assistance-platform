import { Link } from 'react-router-dom';
import Table from '../ui/Table';
import StatusBadge from './StatusBadge';
import { formatDate, formatCurrency } from '../../utils/formatters';
import Button from '../ui/Button';

export default function ApplicationTable({ applications, total, page, limit, onPageChange }) {
  const columns = [
    { key: 'referenceNumber', header: 'Reference' },
    {
      key: 'name', header: 'Applicant',
      render: (r) => `${r.firstName} ${r.lastName}`,
    },
    {
      key: 'status', header: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'assignedCaseManager', header: 'Case Manager',
      render: (r) => r.assignedCaseManager ? `${r.assignedCaseManager.firstName} ${r.assignedCaseManager.lastName}` : '—',
    },
    { key: 'requestedAmount', header: 'Requested', render: (r) => formatCurrency(r.requestedAmount) },
    { key: 'createdAt', header: 'Submitted', render: (r) => formatDate(r.createdAt) },
    {
      key: 'actions', header: '',
      render: (r) => <Link to={`/dashboard/cases/${r.id}`}><Button size="sm" variant="ghost">View</Button></Link>,
    },
  ];

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <Table columns={columns} data={applications} emptyMessage="No applications found." />
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <span className="text-sm text-gray-500">Showing {total === 0 ? 0 : (page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
            <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
