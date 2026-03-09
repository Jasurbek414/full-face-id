import axios from 'axios';

// SA client needs base URL without /api/v1 prefix (SA routes are at /_sa/api/)
const _apiUrl = import.meta.env.VITE_API_URL || '';
const BASE_URL = _apiUrl.replace(/\/api\/v\d+\/?$/, '');

export const saClient = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

saClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('sa_token') || localStorage.getItem('sa_access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

saClient.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('sa_access_token');
            window.location.href = '/sa/login';
        }
        return Promise.reject(error);
    }
);

export const saAPI = {
    // Auth
    login: (data: any) => saClient.post('/_sa/api/auth/login/', data),

    // Dashboard & analytics
    dashboard: () => saClient.get('/_sa/api/dashboard/'),
    revenue: () => saClient.get('/_sa/api/revenue/'),
    expiring: (days = 7) => saClient.get(`/_sa/api/expiring/?days=${days}`),
    auditLog: (params?: { company_id?: string; action?: string }) =>
        saClient.get('/_sa/api/audit-log/', { params }),
    allPayments: (params?: { company_id?: string }) =>
        saClient.get('/_sa/api/payments/', { params }),

    // Company management
    companies: (params?: { search?: string; status?: string }) =>
        saClient.get('/_sa/api/companies/', { params }),
    getCompany: (id: string) => saClient.get(`/_sa/api/companies/${id}/`),
    blockCompanyAction: (id: string, action: 'block' | 'unblock') =>
        saClient.post(`/_sa/api/companies/${id}/${action}/`),
    activatePlan: (id: string, data: { plan_id?: string; days: number; notes?: string }) =>
        saClient.post(`/_sa/api/companies/${id}/activate-plan/`, data),
    setPrice: (id: string, monthly_price: number) =>
        saClient.post(`/_sa/api/companies/${id}/set-price/`, { monthly_price }),
    setGrace: (id: string, grace_period_days: number) =>
        saClient.post(`/_sa/api/companies/${id}/set-grace/`, { grace_period_days }),
    recordPayment: (id: string, data: {
        amount: number;
        days?: number;
        payment_method?: string;
        transaction_id?: string;
        note?: string;
    }) => saClient.post(`/_sa/api/companies/${id}/record-payment/`, data),
    getCompanyPayments: (id: string) => saClient.get(`/_sa/api/companies/${id}/payments/`),
    extendSubscription: (id: string, days: number) =>
        saClient.post(`/_sa/api/companies/${id}/extend/`, { days }),
    updateNotes: (id: string, notes: string) =>
        saClient.patch(`/_sa/api/companies/${id}/update-notes/`, { notes }),

    // Plan management
    plans: () => saClient.get('/_sa/api/plans/'),
    createPlan: (data: any) => saClient.post('/_sa/api/plans/', data),
    updatePlan: (id: string, data: any) => saClient.patch(`/_sa/api/plans/${id}/`, data),
    deletePlan: (id: string) => saClient.delete(`/_sa/api/plans/${id}/`),

    // Company details
    getCompanyEmployees: (id: string) => saClient.get(`/_sa/api/companies/${id}/employees/`),
    getCompanyDevices: (id: string) => saClient.get(`/_sa/api/companies/${id}/devices/`),
    getCompanyRoles: (id: string) => saClient.get(`/_sa/api/companies/${id}/roles/`),
    getCompanyAttendanceStats: (id: string) => saClient.get(`/_sa/api/companies/${id}/attendance-stats/`),
    toggleAutoRenew: (id: string) => saClient.post(`/_sa/api/companies/${id}/toggle-auto-renew/`),

    // Aliases for dashboard compatibility
    getCompanies: (params?: { search?: string; status?: string }) =>
        saClient.get('/_sa/api/companies/', { params }),
    getStats: () => saClient.get('/_sa/api/dashboard/'),
    getPlans: () => saClient.get('/_sa/api/plans/'),
    getPayments: (params?: any) => saClient.get('/_sa/api/payments/', { params }),
    getAuditLogs: (params?: any) => saClient.get('/_sa/api/audit-log/', { params }),
    blockCompany: (id: number | string) => saClient.post(`/_sa/api/companies/${id}/block/`),
    unblockCompany: (id: number | string) => saClient.post(`/_sa/api/companies/${id}/unblock/`),
    assignPlan: (id: number | string, data: { plan_id: number; days: number }) =>
        saClient.post(`/_sa/api/companies/${id}/activate-plan/`, data),
};
