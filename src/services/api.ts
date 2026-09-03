/// <reference types="vite/client" />

const DEFAULT_CLOUD_API = 'https://satquery-backend-9xen.onrender.com';

const getApiBase = (): string => {
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv?.VITE_API_URL) return metaEnv.VITE_API_URL;
    if (metaEnv?.PROD) return DEFAULT_CLOUD_API;
  } catch {
    // fallback
  }
  return '';
};

const API_BASE = getApiBase();

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    let errorJson: any = null;
    try {
      errorJson = await response.json();
      if (errorJson.message) errorDetail = errorJson.message;
      else if (errorJson.detail) errorDetail = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
    } catch {
      // ignore
    }
    throw new ApiError(errorDetail, response.status, errorJson);
  }

  return response.json() as Promise<T>;
}

