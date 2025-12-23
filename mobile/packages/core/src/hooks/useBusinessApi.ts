/**
 * React hooks for Business API
 * 
 * Provides easy-to-use hooks with loading states, error handling, and caching
 */

import { useState, useEffect, useCallback } from 'react';
import { businessApi, DashboardData, TodayAppointmentsResponse, DateAppointmentsResponse, CalendarResponse, StaffListResponse, ServicesListResponse, ClientsListResponse } from '../services/businessApi';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboard(): UseApiState<DashboardData> {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await businessApi.getDashboard();
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useTodayAppointments(): UseApiState<TodayAppointmentsResponse> {
  const [data, setData] = useState<TodayAppointmentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await businessApi.getTodayAppointments();
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useAppointmentsByDate(date: string): UseApiState<DateAppointmentsResponse> {
  const [data, setData] = useState<DateAppointmentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await businessApi.getAppointmentsByDate(date);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useCalendar(startDate?: string, endDate?: string): UseApiState<CalendarResponse> {
  const [data, setData] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await businessApi.getCalendar(startDate, endDate);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useStaff(): UseApiState<StaffListResponse> {
  const [data, setData] = useState<StaffListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await businessApi.getStaff();
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useServices(): UseApiState<ServicesListResponse> {
  const [data, setData] = useState<ServicesListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await businessApi.getServices();
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useClients(search?: string, limit?: number): UseApiState<ClientsListResponse> {
  const [data, setData] = useState<ClientsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await businessApi.getClients(search, limit);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, [search, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
