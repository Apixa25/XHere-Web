import { getEnvironmentConfig } from '../config/environments.js';

const config = getEnvironmentConfig();
const API_URL = config.API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }
  return response.json();
};

const locationTradingService = {
  /**
   * Purchase a location
   * @param {string} locationId - Location ID to purchase
   * @returns {Promise<Object>} Purchase result
   */
  purchaseLocation: async (locationId) => {
    const response = await fetch(`${API_URL}/api/ownership/purchase`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ locationId })
    });
    return handleResponse(response);
  },

  /**
   * Get location ownership information
   * @param {string} locationId - Location ID
   * @returns {Promise<Object>} Ownership information
   */
  getLocationOwnership: async (locationId) => {
    const response = await fetch(`${API_URL}/api/ownership/${locationId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  /**
   * Get location price information
   * @param {string} locationId - Location ID
   * @returns {Promise<Object>} Price information
   */
  getLocationPriceInfo: async (locationId) => {
    const response = await fetch(`${API_URL}/api/ownership/${locationId}/price`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  /**
   * Validate if user can purchase location
   * @param {string} locationId - Location ID
   * @returns {Promise<Object>} Validation result
   */
  validatePurchase: async (locationId) => {
    const response = await fetch(`${API_URL}/api/ownership/${locationId}/validate`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  /**
   * Make a location official
   * @param {string} locationId - Location ID
   * @returns {Promise<Object>} Result
   */
  makeLocationOfficial: async (locationId) => {
    const response = await fetch(`${API_URL}/api/ownership/${locationId}/official`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  /**
   * Get purchase history for a location
   * @param {string} locationId - Location ID
   * @returns {Promise<Object>} Purchase history
   */
  getPurchaseHistory: async (locationId) => {
    const response = await fetch(`${API_URL}/api/ownership/${locationId}/history`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  /**
   * Get user's owned locations
   * @returns {Promise<Object>} Owned locations
   */
  getUserOwnedLocations: async () => {
    const response = await fetch(`${API_URL}/api/ownership/user/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  /**
   * Get specific user's owned locations
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Owned locations
   */
  getUserOwnedLocationsById: async (userId) => {
    const response = await fetch(`${API_URL}/api/ownership/user/${userId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

export default locationTradingService; 