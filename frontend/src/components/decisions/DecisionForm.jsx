import { useState } from 'react';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import Input from '../ui/Input';
import { createDecision } from '../../api/decisions.api';
import { formatDateTime, formatCurrency } from '../../utils/formatters';

const OUTCOME_LABELS = { APPROVED: 'Approve', REJECTED: 'Reject', PENDING_INFO: 'Request More Info' };
const OUTCOME_COLORS = {
  APPROVED: 'border-green-400 bg-green-50 text-green-800',
  REJECTED: 'border-red-400 bg-red-50 text-red-800',
  PENDING_INFO: 'border-yellow-400 bg-yellow-50 text-yellow-800',
};

const TERMINAL_OUTCOMES = ['APPROVED', 'REJECTED'];

export default function DecisionForm({ applicationId, decisions = [], onDecisionMade }) {
  const [outcome, setOutcome] = useState('APPROVED');
  const [rationale, setRationale] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const terminalDecision = decisions.find((d) => TERMINAL_OUTCOMES.includes(d.outcome));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = { outcome, rationale };
      if (outcome === 'APPROVED') {
        const parsed = parseFloat(approvedAmount);
        if (!approvedAmount || isNaN(parsed) || parsed <= 0) {
          setError('Approved amount is required and must be greater than 0 when approving.');
          setLoading(false);
          return;
        }
        data.approvedAmount = parsed;
      }
      await createDecision(applicationId, data);
      setRationale('');
      setApprovedAmount('');
      onDecisionMade?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record decision');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {terminalDecision ? (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-sm text-gray-600">
            A final decision of <strong>{OUTCOME_LABELS[terminalDecision.outcome] || terminalDecision.outcome}</strong> has already been recorded for this application. No further decisions can be submitted.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="font-medium text-gray-900">Record Decision</h4>
          <div className="flex gap-3">
            {Object.entries(OUTCOME_LABELS).map(([key, label]) => (
              <label key={key} className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer text-sm font-medium transition-colors ${outcome === key ? OUTCOME_COLORS[key] : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
                <input type="radio" name="outcome" value={key} checked={outcome === key} onChange={() => setOutcome(key)} className="sr-only" />
                {label}
              </label>
            ))}
          </div>
          {outcome === 'APPROVED' && (
            <Input label="Approved Amount ($)" type="number" min="0" step="0.01" value={approvedAmount} onChange={(e) => setApprovedAmount(e.target.value)} placeholder="Enter approved amount" />
          )}
          <Textarea label="Rationale" value={rationale} onChange={(e) => setRationale(e.target.value)} placeholder="Provide reasoning for this decision…" required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" loading={loading} disabled={!rationale.trim()}>Submit Decision</Button>
        </form>
      )}

      {decisions.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Decision History</h4>
          <ul className="space-y-3">
            {decisions.map((d) => (
              <li key={d.id} className={`p-4 rounded-lg border ${OUTCOME_COLORS[d.outcome] || 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{OUTCOME_LABELS[d.outcome] || d.outcome}</span>
                  <span className="text-xs opacity-70">{formatDateTime(d.createdAt)} · {d.madeBy?.firstName} {d.madeBy?.lastName}</span>
                </div>
                {d.approvedAmount && <p className="text-sm mb-1">Approved amount: {formatCurrency(d.approvedAmount)}</p>}
                <p className="text-sm opacity-90">{d.rationale}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
