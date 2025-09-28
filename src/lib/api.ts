// API Client for Whitelist Token Backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Response interfaces
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface WhitelistStatusResponse {
  address: string;
  isWhitelisted: boolean;
}

interface SaleInfoResponse {
  tokenAddress: string;
  treasury: string;
  tokenPrice: string;
  minPurchase: string;
  maxPurchase: string;
  maxSupply: string;
  startTime: number;
  endTime: number;
  isPaused: boolean;
  isActive: boolean;
  totalSold: string;
  claimEnabled: boolean;
  claimStartTime: number;
}

interface PurchaseRecord {
  txHash: string;
  buyer: string;
  tokenAmount: string;
  ethAmount: string;
  timestamp: number;
  blockNumber: number;
}

// Generic API call function
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

// Health check
export const healthCheck = async (): Promise<{ status: string; service: string; version: string }> => {
  return apiCall('/health');
};

// Whitelist APIs
export const getWhitelistStatus = async (address: string): Promise<WhitelistStatusResponse> => {
  const response = await apiCall<ApiResponse<WhitelistStatusResponse>>(`/v1/whitelist/status/${address}`);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to get whitelist status');
  }
  return response.data;
};

export const verifyWhitelist = async (address: string): Promise<{ address: string; verified: boolean }> => {
  return apiCall(`/v1/whitelist/verify/${address}`);
};

// Sale APIs
export const getSaleInfo = async (): Promise<SaleInfoResponse> => {
  const response = await apiCall<ApiResponse<SaleInfoResponse>>('/v1/sale/info');
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to get sale info');
  }
  return response.data;
};

export const getUserPurchases = async (address: string): Promise<{ address: string; purchases: PurchaseRecord[] }> => {
  return apiCall(`/v1/sale/purchases/${address}`);
};

export const getSaleStats = async (): Promise<any> => {
  return apiCall('/v1/sale/stats');
};

// Analytics APIs
export const getAnalyticsOverview = async (): Promise<any> => {
  return apiCall('/v1/analytics/overview');
};

export const getSalesAnalytics = async (): Promise<any> => {
  return apiCall('/v1/analytics/sales');
};

export const getUserAnalytics = async (): Promise<any> => {
  return apiCall('/v1/analytics/user');
};

// Admin APIs (require authentication)
export const addToWhitelist = async (address: string, authToken?: string): Promise<{ success: boolean; message: string }> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return apiCall('/v1/admin/whitelist', {
    method: 'POST',
    headers,
    body: JSON.stringify({ address }),
  });
};

export const removeFromWhitelist = async (address: string, authToken?: string): Promise<{ success: boolean; message: string }> => {
  const body = JSON.stringify({ address });
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Content-Length': body.length.toString(),
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return apiCall('/v1/admin/whitelist', {
    method: 'DELETE',
    headers,
    body,
  });
};

export const batchUpdateWhitelist = async (addresses: string[], authToken?: string): Promise<any> => {
  const headers: Record<string, string> = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return apiCall('/v1/admin/whitelist/batch', {
    method: 'POST',
    headers,
    body: JSON.stringify({ addresses }),
  });
};

export const getAllUsers = async (authToken?: string): Promise<any> => {
  const headers: Record<string, string> = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return apiCall('/v1/admin/users', { headers });
};

export const updateSaleConfig = async (config: any, authToken?: string): Promise<any> => {
  const headers: Record<string, string> = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return apiCall('/v1/admin/sale/config', {
    method: 'PUT',
    headers,
    body: JSON.stringify(config),
  });
};

export const pauseSale = async (authToken?: string): Promise<any> => {
  const headers: Record<string, string> = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return apiCall('/v1/admin/sale/pause', {
    method: 'POST',
    headers,
  });
};

export const unpauseSale = async (authToken?: string): Promise<any> => {
  const headers: Record<string, string> = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return apiCall('/v1/admin/sale/unpause', {
    method: 'POST',
    headers,
  });
};

// Auth APIs
export const login = async (credentials: any): Promise<any> => {
  return apiCall('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

export const verifySignature = async (signature: any): Promise<any> => {
  return apiCall('/v1/auth/verify', {
    method: 'POST',
    body: JSON.stringify(signature),
  });
};

// Error handling utility
export class ApiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// Request interceptor for adding auth headers globally
export const setAuthToken = (token: string) => {
  // Store token in localStorage or context
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
};

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

export const clearAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
};