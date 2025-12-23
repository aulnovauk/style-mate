/**
 * Business Mobile App API Service
 * 
 * Provides methods to interact with the backend business APIs
 * for dashboard, calendar, appointments, staff, services, and clients.
 */

import { getAuthToken } from '../auth';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://stylemate.replit.app';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.error || `Request failed: ${response.status}` };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('API request error:', error);
    return { error: 'Network error. Please check your connection.' };
  }
}

// Dashboard Types
export interface DashboardStats {
  todayAppointments: {
    value: number;
    change: { value: number; isPositive: boolean };
    completed: number;
    pending: number;
  };
  todayRevenue: {
    value: number;
    formatted: string;
    change: { value: number; isPositive: boolean };
  };
  weeklyRevenue: {
    value: number;
    formatted: string;
    change: { value: number; isPositive: boolean };
  };
  todayClients: {
    value: number;
    change: { value: number; isPositive: boolean };
  };
}

export interface RevenueChartData {
  day: string;
  revenue: number;
  date: string;
}

export interface DashboardData {
  salon: {
    id: string;
    name: string;
    logo: string | null;
  };
  stats: DashboardStats;
  revenueChart: RevenueChartData[];
  todayDate: string;
}

// Appointment Types
export interface AppointmentService {
  id: string;
  name: string;
  duration: number;
  category?: string;
  price?: number;
}

export interface AppointmentStaff {
  id: string;
  name: string;
  photoUrl: string | null;
  roles?: string[];
}

export interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  bookingDate: string;
  bookingTime: string;
  endTime?: string;
  status: string;
  totalAmount: number;
  finalAmount: number;
  notes: string | null;
  staffId: string | null;
  serviceId: string;
  service: AppointmentService | null;
  staff: AppointmentStaff | null;
  amountFormatted?: string;
}

export interface TodayAppointmentsResponse {
  date: string;
  total: number;
  appointments: Appointment[];
  byHour: Record<string, Appointment[]>;
}

export interface TimelineSlot {
  time: string;
  appointments: Appointment[];
}

export interface DateAppointmentsResponse {
  date: string;
  stats: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    revenue: number;
  };
  appointments: Appointment[];
  timeline: TimelineSlot[];
}

export interface CalendarResponse {
  startDate: string;
  endDate: string;
  total: number;
  appointments: Appointment[];
  byDate: Record<string, Appointment[]>;
  dateCounts: Record<string, number>;
}

// Staff Types
export interface StaffMember {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  roles: string[] | null;
  gender: string | null;
  photoUrl: string | null;
  specialties: string[] | null;
  isActive: number;
  todayAppointments: number;
  completedToday: number;
  isAvailable: boolean;
  currentClient: string | null;
}

export interface StaffListResponse {
  staff: StaffMember[];
  total: number;
}

// Service Types
export interface Service {
  id: string;
  name: string;
  description: string | null;
  priceInPaisa: number;
  durationMinutes: number;
  category: string | null;
  isActive: number;
  priceFormatted: string;
}

export interface ServicesListResponse {
  services: Service[];
  byCategory: Record<string, Service[]>;
  categories: string[];
  total: number;
}

// Client Types
export interface Client {
  name: string;
  phone: string;
  email: string | null;
  userId: string | null;
  visits: number;
  lastVisit: string;
  completedVisits: number;
  tag: 'VIP' | 'Regular' | 'New';
}

export interface ClientsListResponse {
  clients: Client[];
  total: number;
}

// Create Booking Types
export interface CreateBookingParams {
  clientId?: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  serviceIds: string[];
  staffId?: string;
  date: string;
  time: string;
  notes?: string;
  paymentMethod?: 'cash' | 'card' | 'upi';
  isWalkIn?: boolean;
}

export interface CreateBookingResponse {
  success: boolean;
  booking: Appointment & {
    services: { id: string; name: string; price: number }[];
    totalDuration: number;
    amountFormatted: string;
  };
}

// API Methods
export const businessApi = {
  /**
   * Get dashboard overview stats
   */
  getDashboard: async (): Promise<ApiResponse<DashboardData>> => {
    return apiRequest<DashboardData>('/api/mobile/business/dashboard');
  },

  /**
   * Get today's appointments
   */
  getTodayAppointments: async (): Promise<ApiResponse<TodayAppointmentsResponse>> => {
    return apiRequest<TodayAppointmentsResponse>('/api/mobile/business/appointments/today');
  },

  /**
   * Get appointments for a specific date
   */
  getAppointmentsByDate: async (date: string): Promise<ApiResponse<DateAppointmentsResponse>> => {
    return apiRequest<DateAppointmentsResponse>(`/api/mobile/business/appointments/${date}`);
  },

  /**
   * Get calendar data for a date range
   */
  getCalendar: async (startDate?: string, endDate?: string): Promise<ApiResponse<CalendarResponse>> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<CalendarResponse>(`/api/mobile/business/calendar${query}`);
  },

  /**
   * Create a new booking (staff-created)
   */
  createBooking: async (params: CreateBookingParams): Promise<ApiResponse<CreateBookingResponse>> => {
    return apiRequest<CreateBookingResponse>('/api/mobile/business/appointments', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Update appointment status
   */
  updateAppointmentStatus: async (
    appointmentId: string,
    status: string,
    notes?: string
  ): Promise<ApiResponse<{ success: boolean; booking: Appointment }>> => {
    return apiRequest(`/api/mobile/business/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  /**
   * Get staff list
   */
  getStaff: async (): Promise<ApiResponse<StaffListResponse>> => {
    return apiRequest<StaffListResponse>('/api/mobile/business/staff');
  },

  /**
   * Get services list
   */
  getServices: async (): Promise<ApiResponse<ServicesListResponse>> => {
    return apiRequest<ServicesListResponse>('/api/mobile/business/services');
  },

  /**
   * Get clients list
   */
  getClients: async (search?: string, limit?: number): Promise<ApiResponse<ClientsListResponse>> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (limit) params.append('limit', limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<ClientsListResponse>(`/api/mobile/business/clients${query}`);
  },
};

export default businessApi;
