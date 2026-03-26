import { useEffect, useState } from 'react';
import { listUsers, createUser, updateUser, deactivateUser } from '../../api/users.api';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import PageHeader from '../../components/layout/PageHeader';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import { ROLE_LABELS } from '../../utils/roleHelpers';
import { formatDate } from '../../utils/formatters';

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', role: 'CASE_MANAGER', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deactivating, setDeactivating] = useState(null);
  const [editRoleUser, setEditRoleUser] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [editRoleSubmitting, setEditRoleSubmitting] = useState(false);
  const [editRoleError, setEditRoleError] = useState('');

  function load() {
    setLoading(true);
    listUsers().then(setUsers).catch(() => setError('Failed to load users')).finally(() => setLoading(false));
  }

  useEffect(load, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      await createUser(form);
      setAddModal(false);
      setForm({ email: '', firstName: '', lastName: '', role: 'CASE_MANAGER', password: '' });
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate(id) {
    if (!confirm('Deactivate this user?')) return;
    setDeactivating(id);
    try {
      await deactivateUser(id);
      load();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to deactivate user');
    } finally {
      setDeactivating(null);
    }
  }

  function openEditRole(user) {
    setEditRoleUser(user);
    setEditRole(user.role);
    setEditRoleError('');
  }

  async function handleEditRole(e) {
    e.preventDefault();
    setEditRoleSubmitting(true);
    setEditRoleError('');
    try {
      await updateUser(editRoleUser.id, { role: editRole });
      setEditRoleUser(null);
      load();
    } catch (err) {
      setEditRoleError(err.response?.data?.message || 'Failed to update role');
    } finally {
      setEditRoleSubmitting(false);
    }
  }

  const columns = [
    { key: 'name', header: 'Name', render: (r) => `${r.firstName} ${r.lastName}` },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (r) => ROLE_LABELS[r.role] || r.role },
    {
      key: 'isActive', header: 'Status',
      render: (r) => <Badge label={r.isActive ? 'Active' : 'Inactive'} className={r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'} />,
    },
    { key: 'createdAt', header: 'Joined', render: (r) => formatDate(r.createdAt) },
    {
      key: 'actions', header: '',
      render: (r) => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="secondary" onClick={() => openEditRole(r)}>Edit Role</Button>
          {r.isActive && (
            <Button size="sm" variant="danger" loading={deactivating === r.id} onClick={() => handleDeactivate(r.id)}>Deactivate</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="User Management" subtitle={`${users.length} users`} actions={<Button onClick={() => setAddModal(true)}>Add User</Button>} />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : error ? (
          <div className="p-4"><Alert variant="error" message={error} /></div>
        ) : (
          <Table columns={columns} data={users} emptyMessage="No users found." />
        )}
      </div>

      <Modal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        title="Add New User"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button form="user-form" type="submit" loading={submitting}>Create User</Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" value={form.firstName} onChange={set('firstName')} required />
            <Input label="Last Name" value={form.lastName} onChange={set('lastName')} required />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={set('email')} required />
          <Select label="Role" options={ROLE_OPTIONS} value={form.role} onChange={set('role')} />
          <Input label="Password" type="password" value={form.password} onChange={set('password')} minLength={8} required />
          {formError && <Alert variant="error" message={formError} />}
        </form>
      </Modal>
      <Modal
        isOpen={!!editRoleUser}
        onClose={() => setEditRoleUser(null)}
        title={`Edit Role — ${editRoleUser ? `${editRoleUser.firstName} ${editRoleUser.lastName}` : ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditRoleUser(null)}>Cancel</Button>
            <Button form="edit-role-form" type="submit" loading={editRoleSubmitting}>Save</Button>
          </>
        }
      >
        <form id="edit-role-form" onSubmit={handleEditRole} className="space-y-4">
          <Select
            label="Role"
            options={ROLE_OPTIONS}
            value={editRole}
            onChange={(e) => setEditRole(e.target.value)}
          />
          {editRoleError && <Alert variant="error" message={editRoleError} />}
        </form>
      </Modal>
    </div>
  );
}
