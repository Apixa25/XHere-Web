const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://xhere-api.herokuapp.com'
  : 'http://localhost:3000';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
  return response.json();
};

const api = {
  // Auth endpoints
  register: async (userData) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },

  login: async (credentials) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
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
    const response = await fetch(`${API_URL}/api/locations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await handleResponse(response);
    return data;
  },
  
  addLocation: async (locationData) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    
    // Append location data
    formData.append('latitude', locationData.latitude);
    formData.append('longitude', locationData.longitude);
    formData.append('text', locationData.text || '');
    formData.append('isAnonymous', locationData.isAnonymous || false);

    if (locationData.media) {
      locationData.media.forEach(file => {
        formData.append('media', file);
      });
    }

    const response = await fetch(`${API_URL}/api/locations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
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

    const response = await fetch(`${API_URL}/api/locations/${id}`, {
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
    const response = await fetch(`${API_URL}/api/locations/${id}`, {
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
    const response = await fetch(`${API_URL}/api/votes/${locationId}/vote`, {
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
    const response = await fetch(`${API_URL}/api/badges/user/badges`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return handleResponse(response);
  },

  // Check for new badges
  checkBadges: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/badges/check-badges`, {
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
    const response = await fetch(`${API_URL}/api/users/profile/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return handleResponse(response);
  }
};

export default api; 