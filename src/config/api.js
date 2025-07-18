/**
 * API Configuration
 */

export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout',
      VALIDATE: '/auth/validate-token',
    },
    PATIENTS: {
      DASHBOARD_DATA: '/patientsdb/dashboard-data',
      ALL_SESSIONS: '/patientsdb/all-sessions',
    },
    ADMIN: {
      PENDING_THERAPISTS: '/admin/pending-therapists',
      APPROVE: '/admin/approve',
      REJECT: '/admin/reject',
    },
    SENTIMENT: {
      ANALYSIS: '/sentiment/get-analysis-from-url',
    },
  },
};

/**
 * Helper function to build full API URLs
 */
export const buildApiUrl = (endpoint, params = {}) => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  if (Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  return url;
};

export default API_CONFIG;
