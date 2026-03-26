import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listApplications } from '../../api/applications.api';
import { useAuth } from '../../auth/AuthContext';
import ApplicationTable from '../../components/applications/ApplicationTable';
import StatCard from '../../components/reports/StatCard';
import PageHeader from '../../components/layout/PageHeader';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';

export default function CaseManagerDashboard() {
  const { user } = useAuth();
  const [myApps, setMyApps] = useState([]);
  const [myTotal, setMyTotal] = useState(0);
  const [submitted, setSubmitted] = useState(0);
  const [underReview, setUnderReview] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      listApplications({ assignedCaseManagerId: user.id, limit: 10 }),
      listApplications({ status: 'SUBMITTED', limit: 1 }),
      listApplications({ status: 'UNDER_REVIEW', limit: 1 }),
    ]).then(([mine, sub, rev]) => {
      setMyApps(mine.data);
      // Use mine.total (the full count from the server) not mine.data.length
      // (which is capped at the page limit of 10).
      setMyTotal(mine.total);
      setSubmitted(sub.total);
      setUnderReview(rev.total);
    }).catch(() => setError('Failed to load dashboard data'))
    .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (error) return <div className="p-4"><Alert variant="error" message={error} /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Case Manager Dashboard" subtitle={`Welcome, ${user.firstName}`} />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="My Assigned Cases" value={myTotal} colorClass="text-primary-700" />
        <StatCard label="New Submissions" value={submitted} colorClass="text-gray-700" />
        <StatCard label="Under Review" value={underReview} colorClass="text-blue-700" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">My Cases</h3>
          <Link to="/dashboard/cases" className="text-sm text-primary-600 hover:underline">View all</Link>
        </div>
        <ApplicationTable applications={myApps} total={myApps.length} page={1} limit={10} onPageChange={() => {}} />
      </div>
    </div>
  );
}
