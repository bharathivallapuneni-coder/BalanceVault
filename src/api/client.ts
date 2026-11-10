export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  details?: Record<string, string[]>;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('bv_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401 && !window.location.pathname.includes('/login')) {
    localStorage.removeItem('bv_token');
    localStorage.removeItem('bv_user');
    window.location.href = '/login?expired=1';
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  let body: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      body = await response.json();
    } catch {
      body = null;
    }
  } else {
    body = await response.text();
  }

  if (!response.ok) {
    const errorMsg = body?.message || body?.error || `Request failed with status ${response.status}`;
    throw new ApiError(response.status, errorMsg, body);
  }

  return body as T;
}

export const api = {
  get: <T = any>(url: string) => request<T>(url, { method: 'GET' }),
  post: <T = any>(url: string, body?: any) =>
    request<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T = any>(url: string, body?: any) =>
    request<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T = any>(url: string, body?: any) =>
    request<T>(url, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T = any>(url: string) => request<T>(url, { method: 'DELETE' }),
};
