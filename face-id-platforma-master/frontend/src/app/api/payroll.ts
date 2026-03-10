import { apiClient } from './client';

export const payrollAPI = {
    // Records
    records: (params?: object) => apiClient.get('/api/v1/payroll/records/', { params }),
    myRecords: () => apiClient.get('/api/v1/payroll/records/my/'),
    summary: (params?: object) => apiClient.get('/api/v1/payroll/records/summary/', { params }),

    // Calculation
    calculate: (month: string) => apiClient.post('/api/v1/payroll/records/calculate/', { month }),

    // Status
    approve: (id: number) => apiClient.post(`/api/v1/payroll/records/${id}/approve/`),
    markPaid: (id: number) => apiClient.post(`/api/v1/payroll/records/${id}/mark-paid/`),
    approveBulk: (data: { ids?: number[]; month?: string }) =>
        apiClient.post('/api/v1/payroll/records/approve-bulk/', data),

    // Update (notes, etc.)
    update: (id: number, data: object) => apiClient.patch(`/api/v1/payroll/records/${id}/`, data),

    // Salary config
    configs: () => apiClient.get('/api/v1/payroll/config/'),
    createConfig: (data: object) => apiClient.post('/api/v1/payroll/config/', data),
    updateConfig: (id: number, data: object) => apiClient.patch(`/api/v1/payroll/config/${id}/`, data),
    deleteConfig: (id: number) => apiClient.delete(`/api/v1/payroll/config/${id}/`),

    // Deductions
    getDeductions: (recordId: number) => apiClient.get(`/api/v1/payroll/records/${recordId}/deductions/`),
    addDeduction: (recordId: number, data: object) =>
        apiClient.post(`/api/v1/payroll/records/${recordId}/deductions/`, data),
    deleteDeduction: (recordId: number, itemId: number) =>
        apiClient.delete(`/api/v1/payroll/records/${recordId}/deductions/?item_id=${itemId}`),

    // Exports
    exportCsv: (params?: object) => apiClient.get('/api/v1/payroll/records/export-csv/', {
        params,
        responseType: 'blob',
    }),
    exportExcel: (params?: object) => apiClient.get('/api/v1/payroll/records/export-excel/', {
        params,
        responseType: 'blob',
    }),
};
