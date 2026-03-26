import { useState } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { ALL_STATUSES, STATUS_LABELS } from '../../utils/statusHelpers';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  ...ALL_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
];

export default function ApplicationFilters({ onFilter, users = [], showAssigneeFilter = false }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [assignedCaseManagerId, setAssignedCaseManagerId] = useState('');

  function apply() {
    onFilter({ search, status, assignedCaseManagerId });
  }

  function reset() {
    setSearch(''); setStatus(''); setAssignedCaseManagerId('');
    onFilter({});
  }

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-40">
        <Input
          label="Search"
          placeholder="Name, email, or reference…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
        />
      </div>
      <div className="w-44">
        <Select label="Status" options={statusOptions} value={status} onChange={(e) => setStatus(e.target.value)} />
      </div>
      {showAssigneeFilter && (
        <div className="w-44">
          <Select
            label="Case Manager"
            options={[{ value: '', label: 'All' }, ...users.map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }))]}
            value={assignedCaseManagerId}
            onChange={(e) => setAssignedCaseManagerId(e.target.value)}
          />
        </div>
      )}
      <Button onClick={apply}>Filter</Button>
      <Button variant="secondary" onClick={reset}>Reset</Button>
    </div>
  );
}
