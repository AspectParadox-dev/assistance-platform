import { useState, useEffect } from 'react';
import { getReconciliation } from '../../api/reports.api';
import ReconciliationTable from '../../components/reports/ReconciliationTable';
import PageHeader from '../../components/layout/PageHeader';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';

export default function ReconciliationPage() {
  const [data, setData] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [applied, setApplied] = useState({ startDate: '', endDate: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getReconciliation({ startDate: applied.startDate, endDate: applied.endDate })
      .then(setData)
      .catch(() => setError('Failed to load reconciliation data'))
      .finally(() => setLoading(false));
  }, [applied]);

  return (
    <div>
      <PageHeader title="Financial Reconciliation" />
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <Button onClick={() => setApplied({ startDate, endDate })}>Apply</Button>
          <Button variant="secondary" onClick={() => { setStartDate(''); setEndDate(''); setApplied({ startDate: '', endDate: '' }); }}>Reset</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : error ? (
        <Alert variant="error" message={error} />
      ) : data && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <ReconciliationTable {...data} />
        </div>
      )}
    </div>
  );
}
