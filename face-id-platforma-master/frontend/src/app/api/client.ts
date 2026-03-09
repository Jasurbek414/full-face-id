import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Har so'rovga JWT token qo'shish
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    const companyId = localStorage.getItem('company_id');
    if (companyId) {
        config.headers['X-Company-ID'] = companyId;
    }
    return config;
});

// 401 bo'lsa token refresh qilish
apiClient.interceptors.response.use(
    (res) => res,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refresh = localStorage.getItem('refresh_token');
                const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh/`, { refresh });
                localStorage.setItem('access_token', data.access);
                if (data.user?.company?.id) {
                    localStorage.setItem('company_id', data.user.company.id);
                }
                originalRequest.headers.Authorization = `Bearer ${data.access}`;
                return apiClient(originalRequest);
            } catch {
                localStorage.clear();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);
