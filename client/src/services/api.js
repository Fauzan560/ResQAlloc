import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('resqalloc_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if invalid/expired
      localStorage.removeItem('resqalloc_token');
      localStorage.removeItem('resqalloc_user');
      // If not already on login or public page, redirect
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/emergency-sos')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
};

// Hospital endpoints
export const hospitalService = {
  getAll: (params) => api.get('/hospitals', { params }),
  getById: (id) => api.get(`/hospitals/${id}`),
  create: (hospitalData) => api.post('/hospitals', hospitalData),
  update: (id, hospitalData) => api.put(`/hospitals/${id}`, hospitalData),
  delete: (id) => api.delete(`/hospitals/${id}`),
  getAreas: () => api.get('/hospitals/metadata/areas'),
  getSpecialties: () => api.get('/hospitals/metadata/specialties'),
};

// Emergency endpoints
export const emergencyService = {
  createCase: (caseData) => api.post('/emergency', caseData),
  getCases: (params) => api.get('/emergency', { params }),
  getCaseById: (id) => api.get(`/emergency/${id}`),
  updateCaseStatus: (id, statusData) => api.put(`/emergency/${id}/status`, statusData),
  selectHospital: (id, hospitalId) => api.post(`/emergency/${id}/select-hospital`, { hospitalId }),
  submitPublicReport: (reportData) => api.post('/emergency/public-report', reportData),
  getStats: () => api.get('/emergency/stats/overview'),
};

// Resource endpoints
export const resourceService = {
  getByHospital: (hospitalId) => api.get(`/resources/${hospitalId}`),
  updateByHospital: (hospitalId, resourceData) => api.put(`/resources/${hospitalId}`, resourceData),
  getAll: () => api.get('/resources'),
};

// Referral endpoints
export const referralService = {
  getReferrals: (params) => api.get('/referrals', { params }),
  getReferralById: (id) => api.get(`/referrals/${id}`),
  respondReferral: (id, action, responseNotes) => api.put(`/referrals/${id}/respond`, { action, responseNotes }),
};

// Admin endpoints
export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
};

// System health
export const systemService = {
  getHealth: () => api.get('/health'),
};

export default api;
