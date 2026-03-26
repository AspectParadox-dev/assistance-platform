import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSummary } from '../../api/reports.api';
import { listDisbursements } from '../../api/disbursements.api';
import StatCard from '../../components/reports/StatCard';
import DisbursementTable from '../../components/disbursements/DisbursementTable';
import PageHeader from '../../components/layout/PageHeader';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import { formatCurrency } from '../../utils/formatters';

export default function TreasurerDashboard() {
  const [summary, setSummary] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    setError('');
    Promise.all([
      getSummary(),
      listDisbursements({ status: 'SCHEDULED', limit: 10 }),
    ]).then(([s, d]) => {
      setSummary(s);
      setPending(d.data);
    }).catch(() => setError('Failed to load dashboard data'))
    .finally(() => setLoading(false));
  }

  useEffect(load, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (error) return <div className="p-4"><Alert variant="error" message={error} /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Treasurer Dashboard" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Donated" value={formatCurrency(summary?.totalDonated)} colorClass="text-green-700" />
        <StatCard label="Total Disbursed" value={formatCurrency(summary?.totalDisbursed)} colorClass="text-red-700" />
        <StatCard label="Current Balance" value={formatCurrency(summary?.balance)} colorClass={summary?.balance >= 0 ? 'text-green-700' : 'text-red-700'} />
        <StatCard label="Pending Disbursements" value={summary?.pendingDisbursementsCount || 0} sub={formatCurrency(summary?.pendingDisbursementsAmount)} colorClass="text-orange-700" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Pending Disbursements</h3>
          <Link to="/dashboard/disbursements" className="text-sm text-primary-600 hover:underline">View all</Link>
        </div>
        <DisbursementTable disbursements={pending} onUpdated={load} />
      </div>
    </div>
  );
}
