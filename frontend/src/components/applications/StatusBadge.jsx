import Badge from '../ui/Badge';
import { STATUS_LABELS, STATUS_COLORS } from '../../utils/statusHelpers';

export default function StatusBadge({ status }) {
  return <Badge label={STATUS_LABELS[status] || status} className={STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'} />;
}
