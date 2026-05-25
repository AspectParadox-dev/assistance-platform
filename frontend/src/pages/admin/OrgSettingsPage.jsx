import { useEffect, useState } from 'react';
import { getMyOrg, updateMyOrg } from '../../api/organizations.api';
import PageHeader from '../../components/layout/PageHeader';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';

export default function OrgSettingsPage() {
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getMyOrg()
      .then((data) => { setOrg(data); setName(data.name); })
      .catch(() => setError('Failed to load organization settings.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await updateMyOrg({ name: name.trim() });
      setOrg(updated);
      setSuccess('Organization name updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Organization Settings" subtitle="Manage your organization's details" />

      <div className="max-w-lg">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {error && <Alert variant="error" message={error} className="mb-4" />}
            {success && <Alert variant="success" message={success} className="mb-4" />}

            <form onSubmit={handleSave} className="space-y-5">
              <Input
                label="Organization Name"
                value={name}
                onChange={(e) => { setName(e.target.value); setSuccess(''); }}
                required
              />

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">Intake URL</p>
                <p className="text-sm text-gray-500 font-mono bg-gray-50 border border-gray-200 rounded px-3 py-2 break-all">
                  {window.location.origin}/apply/{org?.slug}
                </p>
                <p className="text-xs text-gray-400">Share this link with applicants. The URL identifier cannot be changed after creation.</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">Status Check URL</p>
                <p className="text-sm text-gray-500 font-mono bg-gray-50 border border-gray-200 rounded px-3 py-2 break-all">
                  {window.location.origin}/status/{org?.slug}
                </p>
              </div>

              <div className="pt-2">
                <Button type="submit" loading={saving} disabled={!name.trim() || name.trim() === org?.name}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
