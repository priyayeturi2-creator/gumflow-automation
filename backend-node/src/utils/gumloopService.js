/**
 * @fileoverview Gumloop API service utilities
 * @description Common utilities and constants for interacting with Gumloop API
 */

require('dotenv').config();

/**
 * Gumloop API configuration constants
 */
const GUMLOOP_CONFIG = {
  API_KEY: process.env.GUMLOOP_API_KEY,
  BASE_URL: process.env.GUMLOOP_BASE_URL,
  USER_ID: process.env.GUMLOOP_USER_ID,
  SAVED_ITEM_ID: process.env.GUMLOOP_SAVED_ITEM_ID,
};

/**
 * Standard headers for Gumloop API requests
 * @type {Object}
 */
const GUMLOOP_HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${GUMLOOP_CONFIG.API_KEY}`,
};

/**
 * Creates a standardized fetch options object for Gumloop API calls
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {Object|null} body - Request body data
 * @returns {Object} Fetch options object
 */
const createGumloopRequestOptions = (method = 'GET', body = null) => {
  const options = {
    method,
    headers: GUMLOOP_HEADERS,
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  return options;
};

/**
 * Builds a complete Gumloop API URL
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @returns {string} Complete API URL
 */
const buildGumloopUrl = (endpoint, params = {}) => {
  const url = new URL(`${GUMLOOP_CONFIG.BASE_URL}/${endpoint}`);
  
  // Add user_id as default parameter
  url.searchParams.append('user_id', GUMLOOP_CONFIG.USER_ID);
  
  // Add additional parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, value.toString());
    }
  });

  return url.toString();
};

/**
 * Makes a standardized request to the Gumloop API
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @param {string} options.method - HTTP method
 * @param {Object} options.body - Request body
 * @param {Object} options.params - Query parameters
 * @returns {Promise<Object>} API response data
 * @throws {Error} When API request fails
 */
const makeGumloopRequest = async (endpoint, { method = 'GET', body = null, params = {} } = {}) => {
  try {
    const url = buildGumloopUrl(endpoint, params);
    const options = createGumloopRequestOptions(method, body);
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`Gumloop API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Gumloop API request failed:', error);
    throw error;
  }
};

module.exports = {
  GUMLOOP_CONFIG,
  GUMLOOP_HEADERS,
  createGumloopRequestOptions,
  buildGumloopUrl,
  makeGumloopRequest,
};