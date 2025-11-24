/**
 * Centralized API Service
 * Handles all HTTP requests to the backend API
 */

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Make an API request
 * @param {string} endpoint - API endpoint (e.g., '/api/login', '/api/resources')
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Object>} - Response data
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
};

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  
  post: (endpoint, body) => apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  
  put: (endpoint, body) => apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  }),
  
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
};

export default api;
