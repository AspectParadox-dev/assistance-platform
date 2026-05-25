export const ROLE_LABELS = {
  CASE_MANAGER: 'Case Manager',
  COMPLIANCE_OFFICER: 'Compliance Officer',
  PRESIDENT: 'President',
  TREASURER: 'Treasurer',
  ADMIN: 'Admin',
};

export function getDefaultDashboardPath(role) {
  switch (role) {
    case 'CASE_MANAGER': return '/dashboard/home';
    case 'COMPLIANCE_OFFICER': return '/dashboard/compliance';
    case 'PRESIDENT': return '/dashboard/president';
    case 'TREASURER': return '/dashboard/treasurer';
    case 'ADMIN': return '/dashboard/admin';
    default: return '/dashboard';
  }
}

export function canAccessRoute(role, routeKey) {
  const access = {
    home: ['CASE_MANAGER'],
    cases: ['CASE_MANAGER', 'COMPLIANCE_OFFICER', 'PRESIDENT', 'TREASURER', 'ADMIN'],
    compliance: ['COMPLIANCE_OFFICER', 'ADMIN'],
    president: ['PRESIDENT', 'ADMIN'],
    disbursements: ['TREASURER', 'ADMIN', 'PRESIDENT'],
    donations: ['TREASURER', 'ADMIN', 'PRESIDENT'],
    reconciliation: ['TREASURER', 'ADMIN', 'PRESIDENT'],
    reports: ['PRESIDENT', 'TREASURER', 'ADMIN'],
    users: ['ADMIN'],
    'form-builder': ['ADMIN'],
    'org-settings': ['ADMIN'],
  };
  return (access[routeKey] || []).includes(role);
}
