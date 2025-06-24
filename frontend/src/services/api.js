import { getEnvironmentConfig } from '../config/environments';

// Get the current environment configuration
const config = getEnvironmentConfig();
const API_URL = config.API_URL;

console.log('🚀 API Service initialized:');
console.log('   Environment:', process.env.NODE_ENV);
console.log('   API_URL:', API_URL);
console.log('   Config:', config);
console.log('   User Agent:', navigator.userAgent);
console.log('   Platform:', navigator.platform);

// Enhanced error handling for mobile debugging
const handleResponse = async (response) => {
  console.log('📡 API Response Status:', response.status);
  console.log('📡 API Response Headers:', Object.fromEntries(response.headers.entries()));
  
  // Check if response is empty
  const responseText = await response.text();
  console.log('📡 API Response Text:', responseText);
  
  if (!response.ok) {
    let errorMessage = 'API request failed';
    try {
      if (responseText) {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      }
    } catch (parseError) {
      console.error('❌ Failed to parse error response:', parseError);
      errorMessage = `HTTP ${response.status}: ${responseText || 'Empty response'}`;
    }
    throw new Error(errorMessage);
  }
  
  // Try to parse JSON response
  if (!responseText) {
    throw new Error('Empty response from server');
  }
  
  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    console.error('❌ Failed to parse JSON response:', parseError);
    console.error('❌ Response text:', responseText);
    throw new Error('Invalid JSON response from server');
  }
};

// Enhanced fetch wrapper with mobile debugging
const mobileFetch = async (url, options = {}) => {
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
  
  console.log('📡 Making API request:');
  console.log('   URL:', fullUrl);
  console.log('   Method:', options.method || 'GET');
  console.log('   Headers:', options.headers);
  console.log('   Body type:', options.body ? (options.body instanceof FormData ? 'FormData' : typeof options.body) : 'none');
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      // Add mobile-specific headers
      headers: {
        'Accept': 'application/json',
        'User-Agent': navigator.userAgent,
        ...options.headers
      }
    });
    
    return response;
  } catch (networkError) {
    console.error('❌ Network error:', networkError);
    console.error('❌ Error details:', {
      name: networkError.name,
      message: networkError.message,
      stack: networkError.stack
    });
    
    // Provide more specific error messages for mobile
    if (networkError.name === 'TypeError' && networkError.message.includes('fetch')) {
      throw new Error('Network connection failed. Please check your internet connection and try again.');
    }
    
    throw networkError;
  }
};

const api = {
  // Test API connectivity
  testConnection: async () => {
    try {
      console.log('🧪 Testing API connection...');
      const response = await mobileFetch('/api/health');
      const data = await handleResponse(response);
      console.log('✅ API connection test successful:', data);
      return data;
    } catch (error) {
      console.error('❌ API connection test failed:', error);
      throw error;
    }
  },

  // Auth endpoints
  register: async (userData) => {
    console.log('👤 Registering user:', { ...userData, password: '[REDACTED]' });
    const response = await mobileFetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },

  login: async (credentials) => {
    console.log('🔐 Logging in user:', { ...credentials, password: '[REDACTED]' });
    const response = await mobileFetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });
    return handleResponse(response);
  },

  // Location endpoints
  getLocations: async () => {
    const token = localStorage.getItem('token');
    console.log('📍 Fetching locations with token:', token ? 'Present' : 'Missing');
    const response = await mobileFetch('/api/locations', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await handleResponse(response);
    console.log('📍 Retrieved locations:', data.length);
    return data;
  },
  
  addLocation: async (formData) => {
    const token = localStorage.getItem('token');
    
    // Log the FormData contents before sending
    console.log('📤 Sending FormData contents:');
    for (let pair of formData.entries()) {
      console.log('   ' + pair[0] + ': ' + (pair[1] instanceof File ? `File(${pair[1].name}, ${pair[1].size} bytes)` : pair[1]));
    }

    const response = await mobileFetch('/api/locations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Remove Content-Type header to let browser set it with boundary for FormData
      },
      body: formData
    });

    return handleResponse(response);
  },

  updateLocation: async (id, updateData) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    
    Object.entries(updateData).forEach(([key, value]) => {
      if (key !== 'media' && key !== 'deleteMediaIndexes') {
        formData.append(key, value);
      }
    });

    if (updateData.media) {
      updateData.media.forEach(file => {
        formData.append('media', file);
      });
    }

    if (updateData.deleteMediaIndexes) {
      formData.append('deleteMediaIndexes', JSON.stringify(updateData.deleteMediaIndexes));
    }

    const response = await mobileFetch(`/api/locations/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    const data = await handleResponse(response);
    return {
      ...data,
      id: data.id
    };
  },

  deleteLocation: async (id) => {
    const token = localStorage.getItem('token');
    const response = await mobileFetch(`/api/locations/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return handleResponse(response);
  },

  // Vote on a location
  voteLocation: async (locationId, voteType) => {
    const token = localStorage.getItem('token');
    const response = await mobileFetch(`/api/votes/${locationId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ voteType })
    });
    return handleResponse(response);
  },

  // Get user badges
  getUserBadges: async () => {
    const token = localStorage.getItem('token');
    const response = await mobileFetch('/api/badges/user/badges', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return handleResponse(response);
  },

  // Check for new badges
  checkBadges: async () => {
    const token = localStorage.getItem('token');
    const response = await mobileFetch('/api/badges/check', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return handleResponse(response);
  },

  // Get user profile
  getUserProfile: async (userId) => {
    const token = localStorage.getItem('token');
    const response = await mobileFetch(`/api/users/profile/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return handleResponse(response);
  }
};

export default api; 