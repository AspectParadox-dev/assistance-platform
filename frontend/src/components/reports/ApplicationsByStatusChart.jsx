import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { STATUS_LABELS } from '../../utils/statusHelpers';

const COLORS = ['#6b7280', '#3b82f6', '#eab308', '#f97316', '#22c55e', '#ef4444', '#a855f7', '#14b8a6', '#10b981'];

export default function ApplicationsByStatusChart({ data }) {
  const chartData = data.map((d) => ({ name: STATUS_LABELS[d.status] || d.status, count: d.count }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
        <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => [v, 'Applications']} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, i) => <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
