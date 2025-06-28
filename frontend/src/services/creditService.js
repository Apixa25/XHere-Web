import { getEnvironmentConfig } from '../config/environments.js';

const config = getEnvironmentConfig();
const API_URL = config.API_URL;

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.message || 'API request failed');
  }
  return response.json();
};

const creditService = {
  // Get user's credit balance
  getBalance: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/credits/balance`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return handleResponse(response);
  },

  // Get user's transaction history
  getTransactions: async (options = {}) => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.offset) params.append('offset', options.offset);
    if (options.type) params.append('type', options.type);

    const response = await fetch(`${API_URL}/api/credits/transactions?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return handleResponse(response);
  },

  // Get credit statistics
  getStats: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/credits/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return handleResponse(response);
  },

  // Get credit summary (balance + stats + recent transactions)
  getSummary: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/credits/summary`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return handleResponse(response);
  },

  // Get available credit packages
  getPackages: async () => {
    const response = await fetch(`${API_URL}/api/credits/packages`);
    return handleResponse(response);
  },

  // Create Stripe payment intent for purchasing credits
  createPaymentIntent: async (credits) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/credits/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ credits })
    });
    return handleResponse(response);
  },

  // Get Stripe publishable key
  getStripeKey: async () => {
    const response = await fetch(`${API_URL}/api/credits/stripe-key`);
    return handleResponse(response);
  },

  // Validate if user has sufficient credits
  validateCredits: async (amount) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/credits/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount })
    });
    return handleResponse(response);
  },

  // Spend credits (for future use when implementing location trading)
  spendCredits: async (amount, description, metadata = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/credits/spend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount, description, metadata })
    });
    return handleResponse(response);
  }
};

export default creditService; 