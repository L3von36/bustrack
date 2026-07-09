'use client';

import { useCallback } from 'react';

/**
 * Auth-aware fetch wrapper that automatically attaches the JWT token
 * and handles common error patterns.
 */
export function useAuthFetch() {
  const getHeaders = useCallback((): HeadersInit => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    try {
      const saved = localStorage.getItem('bustrack_session');
      if (saved) {
        const { token } = JSON.parse(saved);
        if (token) {
          (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }
      }
    } catch { /* ignore */ }
    return headers;
  }, []);

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers = getHeaders();
    const merged = { ...options, headers: { ...headers, ...(options.headers || {}) } };
    const res = await fetch(url, merged);

    // Handle 401 — session expired
    if (res.status === 401) {
      localStorage.removeItem('bustrack_session');
      window.location.reload();
      return res;
    }

    return res;
  }, [getHeaders]);

  return { authFetch, getHeaders };
}

/**
 * Simple server-side format for ETB currency display.
 * Amounts are stored in cents (integers) in the DB.
 */
export function formatETB(cents: number): string {
  return `ETB ${(cents / 100).toLocaleString('en-ET', { minimumFractionDigits: 2 })}`;
}

/**
 * Convert ETB display value to cents for API calls.
 */
export function toCents(etb: number): number {
  return Math.round(etb * 100);
}