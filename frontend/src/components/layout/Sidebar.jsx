import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { canAccessRoute, ROLE_LABELS } from '../../utils/roleHelpers';

const NAV_ITEMS = [
  { key: 'home', label: 'Dashboard', path: '/dashboard/home', icon: '🏠' },
  { key: 'cases', label: 'Applications', path: '/dashboard/cases', icon: '📋' },
  { key: 'compliance', label: 'Compliance', path: '/dashboard/compliance', icon: '✅' },
  { key: 'president', label: 'Decisions', path: '/dashboard/president', icon: '⚖️' },
  { key: 'disbursements', label: 'Disbursements', path: '/dashboard/disbursements', icon: '💸' },
  { key: 'donations', label: 'Donations', path: '/dashboard/donations', icon: '🤝' },
  { key: 'reconciliation', label: 'Reconciliation', path: '/dashboard/reconciliation', icon: '📊' },
  { key: 'reports', label: 'Reports', path: '/dashboard/reports', icon: '📈' },
  { key: 'users', label: 'User Management', path: '/dashboard/users', icon: '👥' },
  { key: 'form-builder', label: 'Intake Form', path: '/dashboard/form-builder', icon: '📝' },
];

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-full bg-primary-800 text-white w-64">
      <div className="px-6 py-5 border-b border-primary-700">
        <h1 className="text-lg font-bold leading-tight">Assistance Platform</h1>
        {user && (
          <p className="text-xs text-primary-300 mt-1">{user.firstName} {user.lastName} · {ROLE_LABELS[user.role]}</p>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.filter((item) => user && canAccessRoute(user.role, item.key)).map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            end={false}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-primary-600 text-white' : 'text-primary-200 hover:bg-primary-700 hover:text-white'
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-primary-700">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-primary-200 hover:bg-primary-700 hover:text-white transition-colors"
        >
          <span>🚪</span> Sign Out
        </button>
      </div>
    </div>
  );
}
