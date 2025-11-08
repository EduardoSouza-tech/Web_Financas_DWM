import { useAuth } from '@/providers/auth-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Merge any additional headers
  if (fetchOptions.headers) {
    const additionalHeaders = new Headers(fetchOptions.headers);
    additionalHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  }

  // Add auth token if required
  if (requiresAuth && typeof window !== 'undefined') {
    try {
      const token = await (window as any).__getAuthToken?.();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

export const api = {
  overview: {
    get: (householdId: string, month: string) =>
      apiRequest(`/api/overview?householdId=${householdId}&month=${month}`),
  },
  
  transactions: {
    list: (householdId: string, filters?: any) =>
      apiRequest(`/api/transactions?householdId=${householdId}`, {
        method: 'POST',
        body: JSON.stringify(filters || {}),
      }),
    create: (data: any) =>
      apiRequest('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      apiRequest(`/api/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest(`/api/transactions/${id}`, {
        method: 'DELETE',
      }),
  },

  budgets: {
    list: (householdId: string) =>
      apiRequest(`/api/budgets?householdId=${householdId}`),
    create: (data: any) =>
      apiRequest('/api/budgets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  goals: {
    list: (householdId: string) =>
      apiRequest(`/api/goals?householdId=${householdId}`),
    create: (data: any) =>
      apiRequest('/api/goals', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};

// Helper to set auth token getter
if (typeof window !== 'undefined') {
  (window as any).__setAuthTokenGetter = (getter: () => Promise<string | null>) => {
    (window as any).__getAuthToken = getter;
  };
}
