import { useState, useEffect, useRef, useCallback } from 'react';
import { listDisbursements } from '../../api/disbursements.api';
import DisbursementTable from '../../components/disbursements/DisbursementTable';
import PageHeader from '../../components/layout/PageHeader';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'PAID', label: 'Paid' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const LIMIT = 20;

export default function DisbursementsPage() {
  const [disbursements, setDisbursements] = useState([]);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    listDisbursements({ status, page, limit: LIMIT })
      .then((res) => {
        if (!mountedRef.current) return;
        setDisbursements(res.data);
        setTotal(res.total);
      })
      .catch(() => { if (mountedRef.current) setError('Failed to load disbursements'); })
      .finally(() => { if (mountedRef.current) setLoading(false); });
  }, [status, page]);

  useEffect(load, [load]);

  // Reset to page 1 whenever the status filter changes
  function handleStatusChange(e) {
    setStatus(e.target.value);
    setPage(1);
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <PageHeader title="Disbursements" subtitle={`${total} total`} />
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <Select label="" options={STATUS_OPTIONS} value={status} onChange={handleStatusChange} />
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : error ? (
          <div className="p-4"><Alert variant="error" message={error} /></div>
        ) : (
          <>
            <DisbursementTable disbursements={disbursements} onUpdated={load} />
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <span className="text-sm text-gray-500">
                  Showing {total === 0 ? 0 : (page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
