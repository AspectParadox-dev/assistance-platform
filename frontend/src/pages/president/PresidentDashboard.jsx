import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listApplications } from '../../api/applications.api';
import { getSummary } from '../../api/reports.api';
import ApplicationTable from '../../components/applications/ApplicationTable';
import StatCard from '../../components/reports/StatCard';
import PageHeader from '../../components/layout/PageHeader';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';

export default function PresidentDashboard() {
  const [pending, setPending] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      listApplications({ status: 'PENDING_DECISION', limit: 10 }),
      getSummary(),
    ]).then(([apps, s]) => {
      setPending(apps.data);
      setSummary(s);
    }).catch(() => setError('Failed to load dashboard data'))
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (error) return <div className="p-4"><Alert variant="error" message={error} /></div>;

  const byStatus = summary?.applicationsByStatus || {};

  return (
    <div className="space-y-6">
      <PageHeader title="President Dashboard" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pending Decision" value={byStatus.PENDING_DECISION || 0} colorClass="text-orange-700" />
        <StatCard label="Approved" value={byStatus.APPROVED || 0} colorClass="text-green-700" />
        <StatCard label="Rejected" value={byStatus.REJECTED || 0} colorClass="text-red-700" />
        <StatCard label="Completed" value={byStatus.COMPLETED || 0} colorClass="text-emerald-700" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Awaiting Your Decision</h3>
          <Link to="/dashboard/cases?status=PENDING_DECISION" className="text-sm text-primary-600 hover:underline">View all</Link>
        </div>
        <ApplicationTable applications={pending} total={pending.length} page={1} limit={10} onPageChange={() => {}} />
      </div>
    </div>
  );
}
