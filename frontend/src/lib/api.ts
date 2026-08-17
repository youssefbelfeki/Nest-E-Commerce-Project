import {  ApiErrorResponse, ApiResponse } from "@/types";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Try localStorage first
  const token = localStorage.getItem('accessToken');
  if (token) return token;

  // Fallback to reading token from cookie if set
  const match = document.cookie.match(/(?:^|; )accessToken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function setAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return;

  if (token) {
    localStorage.setItem('accessToken', token);
    // Set httpOnly-simulated browser cookie for credentials: 'include' compliance
    document.cookie = `accessToken=${encodeURIComponent(token)}; path=/; max-age=86400; SameSite=Lax`;
  } else {
    localStorage.removeItem('accessToken');
    document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    // REQUIREMENT: Always send credentials: 'include'
    credentials: 'include',
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  let data;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    return {} as T;
  }

  if (!response.ok) {
    const errorRes = data as ApiErrorResponse;
    const message = Array.isArray(errorRes.message)
      ? errorRes.message.join(', ')
      : errorRes.message || 'An error occurred during API call';
    throw new Error(message);
  }

  // Handle NestJS TransformInterceptor response envelope { status: 'success', data: ... }
  if (data && typeof data === 'object' && 'status' in data && data.status === 'success' && 'data' in data) {
    return (data as ApiResponse<T>).data;
  }

  return data as T;
}
