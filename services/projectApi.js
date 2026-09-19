import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { store } from '../store/store';
import { logout } from '../store/slices/authSlice';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

console.log('🔧 [API CONFIG] Base URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Increased to 15 seconds
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    console.log('📤 [API REQUEST]', config.method?.toUpperCase(), config.url);
    console.log('📤 [API REQUEST] Data:', config.data);
    
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('📤 [API REQUEST] Token added');
      }
    } catch (error) {
      console.warn('⚠️ [API REQUEST] Could not access AsyncStorage:', error.message);
      // Continue without token - this is OK for login/register
    }
    return config;
  },
  (error) => {
    console.log(' [API REQUEST ERROR]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('📥 [API RESPONSE]', response.status, response.config.url);
    console.log('📥 [API RESPONSE] Data:', response.data);
    return response;
  },
  async (error) => {
    // Enhanced error handling
    const errorDetails = {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      code: error.code,
    };
    
    console.log('❌ [API RESPONSE ERROR]', errorDetails);
    
    // Handle different error types
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('⏱️ [API] Request timeout - backend may be down');
      error.userMessage = 'Server is taking too long to respond. Please check if the backend is running.';
    } else if (error.code === 'ERR_NETWORK' || !error.response) {
      console.error('🔌 [API] Network error - cannot reach backend');
      error.userMessage = 'Cannot connect to server. Please check your network connection and ensure the backend is running.';
    } else if (error.response?.status === 401) {
      // Token expired or invalid
      try {
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('auth_user');
        await AsyncStorage.removeItem('userData');
        console.log('🔐 [API] Token cleared due to 401 - Dispatching logout');
        store.dispatch(logout());
        try {
          router.replace('/(auth)/login');
        } catch (_) {}
        error.userMessage = 'Session expired. Please login again.';
      } catch (storageError) {
        console.warn('⚠️ [API] Could not clear storage:', storageError.message);
      }
    } else if (error.response?.status === 500) {
      error.userMessage = 'Server error. Please try again later.';
    }
    
    return Promise.reject(error);
  }
);

// Project Form APIs
export const projectFormApi = {
    createDraft: (data) => api.post('/api/v1/project-panel/form/draft', data),
    configurePropertyTypes: (projectId, data) => api.put(`/api/v1/project-panel/form/${projectId}/property-types`, data),
    createVariant: (projectId, data) => api.post(`/api/v1/project-panel/form/${projectId}/variants`, data),
    syncGridUnits: (projectId, data) => api.post(`/api/v1/project-panel/form/${projectId}/units/sync`, data),
    uploadCsvUnits: (projectId, formData) => api.post(
        `/api/v1/project-panel/form/${projectId}/units/upload-csv`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 30000 }
    ),
    finalizeStep4: (projectId, data) => api.put(`/api/v1/project-panel/form/${projectId}/step4-finalize`, data),
    finalizeStep5: (projectId, data) => api.put(`/api/v1/project-panel/form/${projectId}/step5-finalize`, data),
    finalizeStep6: (projectId, data) => api.put(`/api/v1/project-panel/form/${projectId}/step6-finalize`, data),
    updateResumeStep: (projectId, step) => api.put(`/api/v1/project-panel/form/${projectId}/resume-step`, { step }),
    uploadMedia: (projectId, formData) => api.post(
        `/api/v1/project-panel/form/${projectId}/media`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }
    ),
    getDraftStepData: (projectId) => api.get(`/api/v1/project-panel/form/${projectId}/step-data`),
    getProjectFormResume: (projectId) => api.get(`/api/v1/project-panel/form/${projectId}/resume`),
    getAvailableFieldOfficers: (projectId, search = '') => api.get('/api/project-developer/field-officers/available', {
      params: { project_id: projectId, q: search || undefined },
    }),
};

// Project Overview APIs
export const projectOverviewApi = {
    getProjectsList: () => api.get('/api/v1/project-panel/overview/list'),
    getProjectOverview: (projectId) => api.get(`/api/v1/project-panel/overview/${projectId}`),
    getDraftProjects: () => api.get('/api/v1/project-panel/overview/my-drafts'),
};

// Broker property submission APIs. Broker-created inventory is always attached
// to an existing live project; brokers never create projects from this app.
export const brokerPropertyApi = {
    sendOwnerOtp: (phone) => api.post('/auth/send-otp', { phone, purpose: 'owner_contact', role: 'broker' }),
    verifyOwnerOtp: (otp_token, otp) => api.post('/auth/verify-otp', { otp_token, otp }),
    sendCustomerOtp: (phone) => api.post('/auth/send-otp', { phone, purpose: 'owner_contact', role: 'broker' }),
    verifyCustomerOtp: (otp_token, otp) => api.post('/auth/verify-otp', { otp_token, otp }),
    getLiveProjects: () => api.get('/api/v1/broker/properties/live-projects'),
    getProperty: (propertyId) => api.get(`/api/v1/broker/properties/${propertyId}`),
    updateProperty: (propertyId, data) => api.patch(`/api/v1/broker/properties/${propertyId}`, data),
    createBasicDetails: (data) => api.post('/api/v1/broker/properties/basic-details', data),
    updateOwnerDetails: (propertyId, data) => api.put(`/api/v1/broker/properties/${propertyId}/owner-details`, data),
    updatePropertyDetails: (propertyId, data) => api.put(`/api/v1/broker/properties/${propertyId}/property-details`, data),
    updateAreaDetails: (propertyId, data) => api.put(`/api/v1/broker/properties/${propertyId}/area-details`, data),
    updatePricingDetails: (propertyId, data) => api.put(`/api/v1/broker/properties/${propertyId}/pricing-details`, data),
    uploadMedia: (propertyId, formData) => api.post(
        `/api/v1/broker/properties/${propertyId}/add-media`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }
    ),
};

export default api;
