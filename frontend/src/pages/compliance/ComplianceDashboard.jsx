import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listApplications } from '../../api/applications.api';
import ApplicationTable from '../../components/applications/ApplicationTable';
import StatCard from '../../components/reports/StatCard';
import PageHeader from '../../components/layout/PageHeader';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';

export default function ComplianceDashboard() {
  const [queue, setQueue] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listApplications({ status: 'COMPLIANCE_REVIEW', limit: 20 })
      .then((res) => { setQueue(res.data); setTotal(res.total); })
      .catch(() => setError('Failed to load compliance queue'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (error) return <div className="p-4"><Alert variant="error" message={error} /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Compliance Dashboard" />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Pending Review" value={total} colorClass="text-yellow-700" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Compliance Queue</h3>
          <Link to="/dashboard/cases" className="text-sm text-primary-600 hover:underline">View all applications</Link>
        </div>
        <ApplicationTable applications={queue} total={total} page={1} limit={20} onPageChange={() => {}} />
      </div>
    </div>
  );
}
