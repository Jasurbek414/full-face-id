SYSTEM_ROLE_PERMISSION_MAP = {
    'OWNER': ['*'],
    'ADMIN': [
        'attendance.view_own', 'attendance.view_dept', 'attendance.view_all',
        'attendance.manual_edit', 'attendance.export', 'attendance.live_view',
        'employees.view', 'employees.create', 'employees.edit', 'employees.delete',
        'employees.assign_role', 'reports.daily', 'reports.monthly', 'reports.analytics',
        'settings.roles', 'settings.company'
    ],
    'MANAGER': [
        'attendance.view_own', 'attendance.view_dept', 'reports.daily'
    ],
    'HR': [
        'employees.view', 'employees.create', 'employees.edit', 'employees.delete',
        'employees.assign_role', 'employees.view_salary', 'leaves.request',
        'leaves.approve_dept', 'leaves.approve_all'
    ],
    'ACCOUNTANT': [
        'payroll.view_own', 'payroll.view_all', 'payroll.calculate',
        'payroll.approve', 'payroll.export', 'reports.monthly'
    ],
    'EMPLOYEE': [
        'attendance.view_own', 'payroll.view_own', 'leaves.request'
    ],
    'GUARD': [
        'attendance.live_view', 'attendance.view_all'
    ],
}
