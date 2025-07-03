import axios from 'axios';
import { getEnvironmentConfig } from '../config/environments.js';

// Use the environment configuration system
const config = getEnvironmentConfig();
const API_URL = config.API_URL;

console.log('🚀 API Service initialized:');
console.log('   Environment:', process.env.NODE_ENV);
console.log('   API_URL:', API_URL);
console.log('   Config:', config);

// Create Axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      // Handle unauthorized - could redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    throw new Error(error.response?.data?.message || error.message || 'API request failed');
  }
);

// Helper function for FormData requests
const createFormDataRequest = (data) => {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'media' && Array.isArray(value)) {
      value.forEach(file => formData.append('media', file));
    } else if (key === 'deleteMediaIndexes') {
      formData.append('deleteMediaIndexes', JSON.stringify(value));
    } else if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  
  return formData;
};

// API methods
const apiService = {
  // Auth endpoints
  register: async (userData) => {
    return api.post('/auth/register', userData);
  },

  login: async (credentials) => {
    return api.post('/auth/login', credentials);
  },

  // Location endpoints
  getLocations: async (params = {}) => {
    return api.get('/locations', { params });
  },
  
  addLocation: async (formData) => {
    // Log the FormData contents before sending
    console.log('Sending FormData contents:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }

    return api.post('/locations', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  updateLocation: async (id, updateData) => {
    const formData = createFormDataRequest(updateData);
    
    return api.put(`/locations/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteLocation: async (id) => {
    return api.delete(`/locations/${id}`);
  },

  // Vote on a location
  voteLocation: async (locationId, voteType) => {
    try {
      console.log('🔍 API - Making vote request:', { locationId, voteType });
      const response = await api.post(`/votes/${locationId}/vote`, { voteType });
      console.log('🔍 API - Vote response received:', response);
      console.log('🔍 API - Response structure:', {
        hasData: !!response,
        dataType: typeof response,
        responseKeys: response ? Object.keys(response) : [],
        fullResponse: response
      });
      
      // Handle status updates if present
      if (response && response.statusUpdate) {
        console.log('📍 Location status updated:', response.statusUpdate);
        
        // Show notification for status changes
        if (response.statusUpdate.changed) {
          const statusMessages = {
            verified: '🎉 Location verified!',
            flagged: '🚩 Location flagged for review',
            pending: '⏳ Location status updated to pending',
            removed: '🗑️ Location removed'
          };
          
          const message = statusMessages[response.statusUpdate.newStatus] || 'Location status updated';
          // You can add a toast notification here if you have a notification system
          console.log(message);
        }
      }
      
      console.log('🔍 API - Returning response:', response);
      return response;
    } catch (error) {
      console.error('🔍 API - Vote API error:', error);
      console.error('🔍 API - Error response:', error.response);
      
      // If it's a 400 error with response data, return the error data
      if (error.response && error.response.data) {
        console.log('🔍 API - Returning error response data:', error.response.data);
        return error.response.data;
      }
      
      // Otherwise throw the error
      throw error;
    }
  },

  // Get user badges
  getUserBadges: async () => {
    return api.get('/badges/user/badges');
  },

  // Check for new badges
  checkBadges: async () => {
    return api.post('/badges/check');
  },

  // Get user profile
  getUserProfile: async (userId) => {
    return api.get(`/users/profile/${userId}`);
  },

  // Search users for messaging
  searchUsers: async (query) => {
    return api.get('/users/search', { params: { query } });
  },

  // Credit system endpoints
  getCredits: async () => {
    return api.get('/credits/balance');
  },

  purchaseCredits: async (packageId) => {
    return api.post('/credits/purchase', { packageId });
  },

  getTransactionHistory: async (params = {}) => {
    return api.get('/credits/transactions', { params });
  },

  // Location trading endpoints
  buyLocation: async (locationId) => {
    return api.post(`/locations/${locationId}/buy`);
  },

  getOwnedLocations: async () => {
    return api.get('/locations/owned');
  },

  // Official location endpoints
  makeLocationOfficial: async (locationId) => {
    return api.post(`/locations/${locationId}/make-official`);
  },

  canMakeOfficial: async (locationId) => {
    return api.get(`/locations/${locationId}/can-make-official`);
  },

  getOfficialLocations: async (params = {}) => {
    return api.get('/locations/official/all', { params });
  },

  getUserOfficialLocations: async (userId) => {
    return api.get(`/locations/official/user/${userId}`);
  },

  getOfficialLocationStats: async () => {
    return api.get('/locations/official/stats');
  },

  // Admin override for making locations official
  adminMakeOfficial: async (locationId) => {
    return api.post(`/locations/${locationId}/admin-make-official`);
  },

  // Nomination system endpoints
  createNomination: async (locationId, reason) => {
    return api.post('/nominations', { locationId, reason });
  },

  getNominations: async (params = {}) => {
    return api.get('/nominations', { params });
  },

  getNomination: async (nominationId) => {
    return api.get(`/nominations/${nominationId}`);
  },

  voteOnNomination: async (nominationId, voteType) => {
    return api.post(`/nominations/${nominationId}/vote`, { voteType });
  },

  respondToNomination: async (nominationId, response) => {
    return api.post(`/nominations/${nominationId}/respond`, { response });
  },

  getLocationNominations: async (locationId) => {
    return api.get(`/locations/${locationId}/nominations`);
  },

  getUserNominations: async (userId) => {
    return api.get(`/users/${userId}/nominations`);
  },

  // Messaging endpoints
  sendMessage: async (messageData) => {
    return api.post('/messages', messageData);
  },

  getMessages: async (params = {}) => {
    return api.get('/messages', { params });
  },

  // Comments endpoints
  getComments: async (locationId) => {
    return api.get(`/locations/${locationId}/comments`);
  },

  addComment: async (locationId, commentData) => {
    return api.post(`/locations/${locationId}/comments`, commentData);
  },

  // Downvote tracking endpoints
  getDownvoteStats: async (userId) => {
    return api.get(`/downvotes/stats/${userId}`);
  },

  getPostingPermission: async () => {
    return api.get('/downvotes/posting-permission');
  },

  getUserLocations: async (userId) => {
    return api.get(`/users/profile/${userId}`);
  },

  // Generic methods for direct API access
  get: (url, config = {}) => api.get(url, config),
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),
};

export default apiService; 