export const STATUS_LABELS = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  COMPLIANCE_REVIEW: 'Compliance Review',
  PENDING_DECISION: 'Pending Decision',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PENDING_INFO: 'Pending Info',
  DISBURSEMENT: 'Disbursement',
  COMPLETED: 'Completed',
};

export const STATUS_COLORS = {
  SUBMITTED: 'bg-gray-100 text-gray-700',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700',
  COMPLIANCE_REVIEW: 'bg-yellow-100 text-yellow-700',
  PENDING_DECISION: 'bg-orange-100 text-orange-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  PENDING_INFO: 'bg-purple-100 text-purple-700',
  DISBURSEMENT: 'bg-teal-100 text-teal-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
};

const STATUS_ORDER = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'COMPLIANCE_REVIEW',
  'PENDING_DECISION',
  'APPROVED',
  'DISBURSEMENT',
  'COMPLETED',
];

export function getStatusStep(status) {
  return STATUS_ORDER.indexOf(status);
}

export const ALL_STATUSES = Object.keys(STATUS_LABELS);
