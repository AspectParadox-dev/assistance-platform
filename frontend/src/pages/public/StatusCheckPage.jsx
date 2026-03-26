import { useState } from 'react';
import { Link } from 'react-router-dom';
import { checkApplicationStatus } from '../../api/public.api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

function StatusBadge({ status, label }) {
  const colors = {
    SUBMITTED: 'bg-gray-100 text-gray-700',
    UNDER_REVIEW: 'bg-blue-100 text-blue-700',
    COMPLIANCE_REVIEW: 'bg-blue-100 text-blue-700',
    PENDING_DECISION: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    PENDING_INFO: 'bg-orange-100 text-orange-700',
    DISBURSEMENT: 'bg-purple-100 text-purple-700',
    COMPLETED: 'bg-green-100 text-green-800',
  };
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {label}
    </span>
  );
}

function Timeline({ stages, currentStep, isRejected }) {
  return (
    <ol className="relative border-l-2 border-gray-200 ml-4 space-y-6">
      {stages.map((stage, i) => {
        const isDone = i < currentStep;
        const isCurrent = i === currentStep && !isRejected;
        const isFuture = i > currentStep || (isRejected && i >= currentStep);

        return (
          <li key={stage.key} className="ml-6">
            <span className={`absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-white text-xs font-bold ${
              isDone
                ? 'bg-green-500 text-white'
                : isCurrent
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-400'
            }`}>
              {isDone ? '✓' : i + 1}
            </span>
            <p className={`text-sm font-medium ${isDone ? 'text-green-700' : isCurrent ? 'text-primary-700' : 'text-gray-400'}`}>
              {stage.label}
            </p>
          </li>
        );
      })}

      {isRejected && (
        <li className="ml-6">
          <span className="absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-white bg-red-500 text-white text-xs">✕</span>
          <p className="text-sm font-medium text-red-600">Not Approved</p>
        </li>
      )}
    </ol>
  );
}

export default function StatusCheckPage() {
  const [form, setForm] = useState({ referenceNumber: '', email: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleCheck(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await checkApplicationStatus(form.referenceNumber.trim(), form.email.trim());
      setResult(data);
    } catch (err) {
      setError(
        err.response?.status === 404
          ? 'No application found with that reference number and email. Please check your information.'
          : 'An error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-800">Check Application Status</h1>
          <p className="text-gray-500 mt-2">Enter your reference number and email to see your application status.</p>
        </div>

        <div className="text-right mb-4 text-sm space-x-4">
          <Link to="/apply" className="text-primary-600 hover:underline">Submit an Application</Link>
          <Link to="/login" className="text-primary-600 hover:underline">Staff Login</Link>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8">
          <form onSubmit={handleCheck} className="space-y-4">
            <Input
              label="Reference Number"
              placeholder="APP-2026-00001"
              value={form.referenceNumber}
              onChange={set('referenceNumber')}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="The email you submitted with your application"
              value={form.email}
              onChange={set('email')}
              required
            />
            {error && <Alert variant="error" message={error} />}
            <Button type="submit" loading={loading} className="w-full">Check Status</Button>
          </form>
        </div>

        {result && (
          <div className="mt-6 bg-white rounded-xl shadow-md p-8 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-gray-500">Reference Number</p>
                <p className="text-lg font-bold font-mono text-gray-800">{result.referenceNumber}</p>
              </div>
              <StatusBadge status={result.status} label={result.statusLabel} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Applicant</p>
                <p className="font-medium text-gray-800">{result.firstName}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Submitted</p>
                <p className="font-medium text-gray-800">
                  {result.submittedAt ? new Date(result.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                </p>
              </div>
              {result.approvedAmount && (
                <div className="bg-green-50 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-green-600">Approved Amount</p>
                  <p className="font-bold text-green-800 text-lg">${Number(result.approvedAmount).toFixed(2)}</p>
                </div>
              )}
            </div>

            {result.isPendingInfo && (
              <Alert variant="warning" message="Additional information is needed for your application. A case manager will contact you with details." />
            )}

            {result.isRejected && (
              <Alert variant="error" message="Your application was not approved at this time. Please contact us if you have questions." />
            )}

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-4">Application Progress</p>
              <Timeline
                stages={result.timeline.stages}
                currentStep={result.timeline.currentStep}
                isRejected={result.isRejected}
              />
            </div>

            <p className="text-xs text-gray-400 text-center">Last updated: {result.updatedAt ? new Date(result.updatedAt).toLocaleString() : '—'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
