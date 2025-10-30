/**
 * @fileoverview API service utilities for frontend
 * @description Centralized API configuration and utilities for making HTTP requests
 */

import axios, { AxiosResponse } from 'axios';

/**
 * API configuration constants
 */
export const API_CONFIG = {
  BASE_URL: (typeof process !== 'undefined' && process.env?.REACT_APP_API_BASE_URL) || 'http://localhost:5000/api',
  TIMEOUT: parseInt((typeof process !== 'undefined' && process.env?.REACT_APP_API_TIMEOUT) || '30000', 10),
};

/**
 * API endpoints configuration
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/users/me',
  },
  // Flows
  FLOWS: {
    BASE: '/flows',
    CREATE: '/flows/create',
    LIST_WORKBOOKS: '/flows/list-workbooks',
    SELECT_VERSION: '/flows/select-version',
    REGENERATE: (savedRunId: string) => `/flows/regenerate/${savedRunId}`,
    COMBINED_REPORT: (runId: string) => `/flows/combined-report/${runId}`,
    SUBFLOW_VERSIONS: (runId: string) => `/flows/subflow-versions/${runId}`,
    BY_ID: (runId: string) => `/flows/${runId}`,
  },
};

/**
 * Create axios instance with default configuration
 */
export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor to add auth token
 */
apiClient.interceptors.request.use(
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

/**
 * Response interceptor for error handling
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common error scenarios
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

/**
 * API service methods
 */
export const apiService = {
  /**
   * Authentication methods
   */
  auth: {
    /**
     * User login
     */
    login: (credentials: { email: string; password: string }): Promise<AxiosResponse<any>> => 
      apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
    
    /**
     * User registration
     */
    register: (userData: any): Promise<AxiosResponse<any>> => 
      apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData),
    
    /**
     * Get current user
     */
    getMe: (): Promise<AxiosResponse<any>> => 
      apiClient.get(API_ENDPOINTS.AUTH.ME),
  },

  /**
   * Flow management methods
   */
  flows: {
    /**
     * Get all user flows
     */
    getAll: (): Promise<AxiosResponse<any>> => 
      apiClient.get(API_ENDPOINTS.FLOWS.BASE),
    
    /**
     * Get flow by ID
     */
    getById: (runId: string): Promise<AxiosResponse<any>> => 
      apiClient.get(API_ENDPOINTS.FLOWS.BY_ID(runId)),
    
    /**
     * Create new flow
     */
    create: (flowData: any): Promise<AxiosResponse<any>> => 
      apiClient.post(API_ENDPOINTS.FLOWS.CREATE, flowData),
    
    /**
     * Get workbooks list
     */
    getWorkbooks: (): Promise<AxiosResponse<any>> => 
      apiClient.get(API_ENDPOINTS.FLOWS.LIST_WORKBOOKS),
    
    /**
     * Select version for workbook
     */
    selectVersion: (selectionData: any): Promise<AxiosResponse<any>> => 
      apiClient.post(API_ENDPOINTS.FLOWS.SELECT_VERSION, selectionData),
    
    /**
     * Regenerate workbook version
     */
    regenerate: (savedRunId: string, regenerationData: any): Promise<AxiosResponse<any>> => 
      apiClient.post(API_ENDPOINTS.FLOWS.REGENERATE(savedRunId), regenerationData),
    
    /**
     * Get combined report
     */
    getCombinedReport: (runId: string): Promise<AxiosResponse<any>> => 
      apiClient.get(API_ENDPOINTS.FLOWS.COMBINED_REPORT(runId)),
    
    /**
     * Get subflow versions
     */
    getSubflowVersions: (runId: string): Promise<AxiosResponse<any>> => 
      apiClient.get(API_ENDPOINTS.FLOWS.SUBFLOW_VERSIONS(runId)),
  },
};

/**
 * Utility function to handle API errors
 */
export const getErrorMessage = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.response?.status === 400) {
    return 'Invalid request. Please check your input.';
  }
  
  if (error.response?.status === 401) {
    return 'Authentication required. Please log in.';
  }
  
  if (error.response?.status === 403) {
    return 'Access denied. You do not have permission.';
  }
  
  if (error.response?.status === 404) {
    return 'Resource not found.';
  }
  
  if (error.response?.status >= 500) {
    return 'Server error. Please try again later.';
  }
  
  return 'An unexpected error occurred. Please try again.';
};

export default apiService;