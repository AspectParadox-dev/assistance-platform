import { useEffect, useState } from 'react';
import { listUsers } from '../../api/users.api';
import { getSummary } from '../../api/reports.api';
import StatCard from '../../components/reports/StatCard';
import PageHeader from '../../components/layout/PageHeader';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import { ROLE_LABELS } from '../../utils/roleHelpers';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([listUsers(), getSummary()])
      .then(([u, s]) => { setUsers(u); setSummary(s); })
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (error) return <div className="p-4"><Alert variant="error" message={error} /></div>;

  const byStatus = summary?.applicationsByStatus || {};
  const roleCount = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Applications" value={summary?.totalApplications || 0} />
        <StatCard label="Total Users" value={users.length} />
        <StatCard label="Pending Decisions" value={byStatus.PENDING_DECISION || 0} colorClass="text-orange-700" />
        <StatCard label="Completed" value={byStatus.COMPLETED || 0} colorClass="text-emerald-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Users by Role</h3>
            <Link to="/dashboard/users" className="text-sm text-primary-600 hover:underline">Manage users</Link>
          </div>
          <ul className="space-y-2">
            {Object.entries(ROLE_LABELS).map(([role, label]) => (
              <li key={role} className="flex justify-between text-sm">
                <span className="text-gray-600">{label}</span>
                <span className="font-medium">{roleCount[role] || 0}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Applications by Status</h3>
          <ul className="space-y-2">
            {Object.entries(byStatus).map(([status, count]) => (
              <li key={status} className="flex justify-between text-sm">
                <span className="text-gray-600">{status.replace(/_/g, ' ')}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
