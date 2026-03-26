import { useEffect, useState } from 'react';
import { getSummary, getApplicationStats } from '../../api/reports.api';
import StatCard from '../../components/reports/StatCard';
import ApplicationsByStatusChart from '../../components/reports/ApplicationsByStatusChart';
import PageHeader from '../../components/layout/PageHeader';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import { formatCurrency } from '../../utils/formatters';

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getSummary(), getApplicationStats()])
      .then(([s, st]) => { setSummary(s); setStats(st); })
      .catch(() => setError('Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (error) return <div className="p-4"><Alert variant="error" message={error} /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Applications" value={summary?.totalApplications || 0} />
        <StatCard label="Total Donated" value={formatCurrency(summary?.totalDonated)} colorClass="text-green-700" />
        <StatCard label="Total Disbursed" value={formatCurrency(summary?.totalDisbursed)} colorClass="text-red-700" />
        <StatCard label="Net Balance" value={formatCurrency(summary?.balance)} colorClass={summary?.balance >= 0 ? 'text-green-700' : 'text-red-700'} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-6">Applications by Status</h3>
        <ApplicationsByStatusChart data={stats} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Application Breakdown</h3>
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2 text-gray-500 font-medium">Status</th>
              <th className="text-right py-2 text-gray-500 font-medium">Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stats.map((s) => (
              <tr key={s.status}>
                <td className="py-2 text-gray-700">{s.status.replace(/_/g, ' ')}</td>
                <td className="py-2 text-right font-medium text-gray-900">{s.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
