import { useState, useEffect, useRef } from 'react';
import { listApplications } from '../../api/applications.api';
import { listUsers } from '../../api/users.api';
import { useAuth } from '../../auth/AuthContext';
import ApplicationFilters from '../../components/applications/ApplicationFilters';
import ApplicationTable from '../../components/applications/ApplicationTable';
import PageHeader from '../../components/layout/PageHeader';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';

export default function ApplicationListPage() {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mountedRef = useRef(true);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (isAdmin) listUsers().then((u) => { if (mountedRef.current) setUsers(u); }).catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    setLoading(true);
    setError('');
    listApplications({ ...filters, page, limit: 20 })
      .then((res) => {
        if (!mountedRef.current) return;
        setApps(res.data);
        setTotal(res.total);
      })
      .catch(() => { if (mountedRef.current) setError('Failed to load applications'); })
      .finally(() => { if (mountedRef.current) setLoading(false); });
  }, [filters, page]);

  function handleFilter(f) {
    setFilters(f);
    setPage(1);
  }

  return (
    <div>
      <PageHeader title="Applications" subtitle={`${total} total`} />
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <ApplicationFilters onFilter={handleFilter} users={users} showAssigneeFilter={isAdmin} />
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : error ? (
          <div className="p-4"><Alert variant="error" message={error} /></div>
        ) : (
          <ApplicationTable applications={apps} total={total} page={page} limit={20} onPageChange={setPage} />
        )}
      </div>
    </div>
  );
}
