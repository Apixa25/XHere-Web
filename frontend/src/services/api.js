const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://xhere-api.herokuapp.com'
  : 'http://localhost:3000';

const api = {
  // Auth endpoints
  register: (userData) => fetch(`${API_URL}/api/users/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData)
  }),

  login: (credentials) => fetch(`${API_URL}/api/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials)
  }),

  // Location endpoints
  getLocations: () => fetch(`${API_URL}/api/locations`),
  
  addLocation: (locationData) => fetch(`${API_URL}/api/locations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(locationData)
  }),

  deleteLocation: (id) => fetch(`${API_URL}/api/locations/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
};

export default api; 