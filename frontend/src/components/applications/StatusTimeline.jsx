import { STATUS_LABELS } from '../../utils/statusHelpers';

const STEPS = ['SUBMITTED', 'UNDER_REVIEW', 'COMPLIANCE_REVIEW', 'PENDING_DECISION', 'APPROVED', 'DISBURSEMENT', 'COMPLETED'];

// Side-states that live off the main linear path. Map each to the last main-path
// step that was reached before the side-state was entered so the timeline still
// shows meaningful progress (e.g. PENDING_INFO is entered from PENDING_DECISION).
const SIDE_STATE_ANCHOR = {
  PENDING_INFO: 'PENDING_DECISION',
  REJECTED: 'PENDING_DECISION',
};

export default function StatusTimeline({ status }) {
  const anchor = SIDE_STATE_ANCHOR[status];
  const currentIdx = STEPS.indexOf(anchor ?? status);
  const isRejected = status === 'REJECTED';
  const isPendingInfo = status === 'PENDING_INFO';

  return (
    <div className="w-full">
      {(isRejected || isPendingInfo) && (
        <div className={`mb-3 text-sm font-medium px-3 py-1 rounded-full inline-block ${isRejected ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}>
          Status: {STATUS_LABELS[status]}
        </div>
      )}
      <ol className="flex items-center w-full">
        {STEPS.map((step, idx) => {
          const done = currentIdx > idx;
          const active = currentIdx === idx;
          return (
            <li key={step} className={`flex items-center ${idx < STEPS.length - 1 ? 'w-full' : ''}`}>
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  done || active ? 'bg-primary-600 border-primary-600 text-white'
                  : 'border-gray-300 text-gray-400'
                }`}>
                  {done || active ? '✓' : idx + 1}
                </div>
                <span className={`mt-1 text-xs text-center w-16 ${active ? 'text-primary-700 font-semibold' : done ? 'text-gray-600' : 'text-gray-400'}`}>
                  {STATUS_LABELS[step]}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mb-5 ${done ? 'bg-primary-600' : 'bg-gray-200'}`} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
