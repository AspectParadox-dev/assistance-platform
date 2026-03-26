import { useState, useEffect, useRef } from 'react';
import Button from '../ui/Button';
import { updateCompliance } from '../../api/applications.api';
import axiosClient from '../../api/axiosClient';

const CHECKLIST_ITEMS = [
  { key: 'id_verified', label: 'Government ID verified' },
  { key: 'income_documented', label: 'Income documentation reviewed' },
  { key: 'hardship_confirmed', label: 'Hardship description verified' },
  { key: 'residence_verified', label: 'Residence/address confirmed' },
  { key: 'household_verified', label: 'Household size verified' },
  { key: 'assistance_type_appropriate', label: 'Assistance type appropriate' },
  { key: 'amount_reasonable', label: 'Requested amount is reasonable' },
  { key: 'no_duplicate', label: 'No duplicate application found' },
];

export default function ComplianceChecklist({ applicationId, checklistData, editable = false, onSaved }) {
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const [items, setItems] = useState(() => {
    const init = {};
    CHECKLIST_ITEMS.forEach((i) => { init[i.key] = false; });
    return { ...init, ...(checklistData || {}) };
  });
  const [autoSuggestions, setAutoSuggestions] = useState({});
  const [autoReasons, setAutoReasons] = useState({});
  const [loading, setLoading] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [autoResult, setAutoResult] = useState(null); // null | 'success' | 'error'

  const completedCount = Object.values(items).filter(Boolean).length;
  const pct = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100);

  async function handleSave() {
    setLoading(true);
    setSaveError('');
    try {
      await updateCompliance(applicationId, items);
      setSaved(true);
      onSaved?.(items);
      setTimeout(() => { if (mountedRef.current) setSaved(false); }, 2000);
    } catch {
      setSaveError('Failed to save checklist. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAutoCheck() {
    setAutoLoading(true);
    setAutoResult(null);
    try {
      const { data } = await axiosClient.get(`/applications/${applicationId}/compliance/auto-check`);
      setAutoSuggestions(data.suggestions || {});
      setAutoReasons(data.reasons || {});

      // Merge: auto-check suggested items that aren't already checked
      setItems((prev) => {
        const merged = { ...prev };
        Object.entries(data.suggestions || {}).forEach(([key, val]) => {
          if (val) merged[key] = true; // only apply positive suggestions; don't uncheck manual checks
        });
        return merged;
      });

      setAutoResult('success');
    } catch {
      setAutoResult('error');
    } finally {
      setAutoLoading(false);
    }
  }

  function isSuggested(key) {
    return autoSuggestions[key] === true && !(checklistData?.[key]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm text-gray-600">{completedCount}/{CHECKLIST_ITEMS.length} items complete</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-medium text-gray-700">{pct}%</span>
          </div>
          {editable && (
            <Button size="sm" variant="secondary" onClick={handleAutoCheck} loading={autoLoading}>
              Auto-Check
            </Button>
          )}
        </div>
      </div>

      {autoResult === 'success' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700">
          Auto-check complete. Suggested items have been pre-checked — review and save when ready.
        </div>
      )}
      {autoResult === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">
          Auto-check failed. Please try again.
        </div>
      )}

      <ul className="space-y-2">
        {CHECKLIST_ITEMS.map((item) => {
          const checked = items[item.key] || false;
          const suggested = isSuggested(item.key);
          const reason = autoReasons[item.key];

          return (
            <li
              key={item.key}
              className={`flex items-start gap-3 p-3 rounded-lg ${
                checked ? 'bg-green-50' : suggested === false && autoResult === 'success' ? 'bg-amber-50' : 'bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                id={item.key}
                checked={checked}
                onChange={(e) => editable && setItems((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                disabled={!editable}
                className="mt-0.5 h-4 w-4 rounded text-primary-600 cursor-pointer disabled:cursor-default flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <label
                  htmlFor={item.key}
                  className={`text-sm block ${editable ? 'cursor-pointer' : ''} ${checked ? 'text-green-800' : 'text-gray-700'}`}
                >
                  {item.label}
                  {suggested && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">auto</span>
                  )}
                </label>
                {reason && autoResult === 'success' && (
                  <p className="text-xs text-gray-500 mt-0.5">{reason}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {editable && (
        <div className="flex flex-col gap-2">
          {saveError && <p className="text-sm text-red-600">{saveError}</p>}
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={handleSave} loading={loading}>Save Checklist</Button>
            {saved && <span className="text-sm text-green-600">Saved!</span>}
          </div>
        </div>
      )}
    </div>
  );
}
