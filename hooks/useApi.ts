import { useState, useCallback } from 'react';

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (
    url: string, 
    init: RequestInit = {}
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...init.headers
        },
        ...init
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      setState({ data, loading: false, error: null });
      
      if (options.onSuccess) {
        options.onSuccess(data);
      }
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState({ data: null, loading: false, error: errorMessage });
      
      if (options.onError) {
        options.onError(error);
      }
      
      throw error;
    }
  }, [options]);

  const get = useCallback((url: string, init?: RequestInit) => {
    return execute(url, { ...init, method: 'GET' });
  }, [execute]);

  const post = useCallback((url: string, data?: any, init?: RequestInit) => {
    return execute(url, {
      ...init,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }, [execute]);

  const put = useCallback((url: string, data?: any, init?: RequestInit) => {
    return execute(url, {
      ...init,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }, [execute]);

  const del = useCallback((url: string, init?: RequestInit) => {
    return execute(url, { ...init, method: 'DELETE' });
  }, [execute]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    });
  }, []);

  return {
    ...state,
    execute,
    get,
    post,
    put,
    delete: del,
    reset
  };
}