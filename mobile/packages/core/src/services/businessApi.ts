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

  /**
   * Get business waitlist entries
   */
  getWaitlist: async (status?: string, limit?: number): Promise<ApiResponse<WaitlistResponse>> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<WaitlistResponse>(`/api/mobile/business/waitlist${query}`);
  },

  /**
   * Notify waitlist client about available slot
   */
  notifyWaitlistClient: async (
    entryId: string,
    slotDate: string,
    slotTime: string
  ): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return apiRequest(`/api/mobile/business/waitlist/${entryId}/notify`, {
      method: 'POST',
      body: JSON.stringify({ slotDate, slotTime }),
    });
  },

  /**
   * Remove entry from waitlist
   */
  removeFromWaitlist: async (entryId: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return apiRequest(`/api/mobile/business/waitlist/${entryId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get appointment details for checkout
   */
  getCheckoutAppointment: async (bookingId: string): Promise<ApiResponse<CheckoutAppointmentResponse>> => {
    return apiRequest<CheckoutAppointmentResponse>(`/api/mobile/business/checkout/appointment/${bookingId}`);
  },

  /**
   * Process checkout transaction
   */
  processCheckout: async (params: CheckoutParams): Promise<ApiResponse<CheckoutResponse>> => {
    return apiRequest<CheckoutResponse>('/api/mobile/business/checkout', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // ============================================
  // TEAM MANAGEMENT API METHODS
  // ============================================

  /**
   * Get staff detail profile
   */
  getStaffDetail: async (staffId: string): Promise<ApiResponse<StaffDetailResponse>> => {
    return apiRequest<StaffDetailResponse>(`/api/mobile/business/staff/${staffId}`);
  },

  /**
   * Get available roles for staff
   */
  getStaffRoles: async (): Promise<ApiResponse<{ roles: StaffRole[] }>> => {
    return apiRequest<{ roles: StaffRole[] }>('/api/mobile/business/staff/roles');
  },

  /**
   * Create new staff member
   */
  createStaff: async (params: CreateStaffParams): Promise<ApiResponse<StaffMutationResponse>> => {
    return apiRequest<StaffMutationResponse>('/api/mobile/business/staff', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Update staff member
   */
  updateStaff: async (params: UpdateStaffParams): Promise<ApiResponse<StaffMutationResponse>> => {
    return apiRequest<StaffMutationResponse>(`/api/mobile/business/staff/${params.id}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  },

  /**
   * Get staff schedule for a date range
   */
  getStaffSchedule: async (staffId: string, date: string): Promise<ApiResponse<StaffScheduleResponse>> => {
    return apiRequest<StaffScheduleResponse>(`/api/mobile/business/staff/${staffId}/schedule?date=${date}`);
  },

  /**
   * Update staff shifts
   */
  updateStaffShifts: async (params: UpdateShiftParams): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return apiRequest(`/api/mobile/business/staff/${params.staffId}/shifts`, {
      method: 'PATCH',
      body: JSON.stringify({ shifts: params.shifts }),
    });
  },

  /**
   * Create time block for staff
   */
  createTimeBlock: async (params: CreateBlockParams): Promise<ApiResponse<{ success: boolean; block: TimeBlock }>> => {
    return apiRequest(`/api/mobile/business/staff/${params.staffId}/blocks`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Delete time block
   */
  deleteTimeBlock: async (staffId: string, blockId: string): Promise<ApiResponse<{ success: boolean }>> => {
    return apiRequest(`/api/mobile/business/staff/${staffId}/blocks/${blockId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get leave requests with balance
   */
  getLeaveRequests: async (status?: string): Promise<ApiResponse<LeaveListResponse>> => {
    const query = status ? `?status=${status}` : '';
    return apiRequest<LeaveListResponse>(`/api/mobile/business/staff/leave${query}`);
  },

  /**
   * Get leave balance for specific staff
   */
  getStaffLeaveBalance: async (staffId: string): Promise<ApiResponse<{ balance: LeaveBalance }>> => {
    return apiRequest<{ balance: LeaveBalance }>(`/api/mobile/business/staff/${staffId}/leave/balance`);
  },

  /**
   * Create leave request
   */
  createLeaveRequest: async (params: CreateLeaveParams): Promise<ApiResponse<LeaveMutationResponse>> => {
    return apiRequest<LeaveMutationResponse>('/api/mobile/business/staff/leave', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Review (approve/reject) leave request
   */
  reviewLeaveRequest: async (params: ReviewLeaveParams): Promise<ApiResponse<LeaveMutationResponse>> => {
    return apiRequest<LeaveMutationResponse>(`/api/mobile/business/staff/leave/${params.leaveId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: params.action, note: params.note }),
    });
  },

  /**
   * Get commission summary for staff
   */
  getCommissionSummary: async (staffId: string): Promise<ApiResponse<CommissionSummaryResponse>> => {
    return apiRequest<CommissionSummaryResponse>(`/api/mobile/business/staff/${staffId}/commission/summary`);
  },

  /**
   * Get commission history for a month
   */
  getCommissionHistory: async (staffId: string, month: string): Promise<ApiResponse<CommissionHistoryResponse>> => {
    return apiRequest<CommissionHistoryResponse>(`/api/mobile/business/staff/${staffId}/commission?month=${month}`);
  },

  /**
   * Process commission payout
   */
  processCommissionPayout: async (params: ProcessPayoutParams): Promise<ApiResponse<PayoutResponse>> => {
    return apiRequest<PayoutResponse>(`/api/mobile/business/staff/${params.staffId}/commission/payout`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Export commission report
   */
  exportCommissionReport: async (staffId: string, month: string): Promise<ApiResponse<{ url: string }>> => {
    return apiRequest<{ url: string }>(`/api/mobile/business/staff/${staffId}/commission/export?month=${month}`);
  },
};

// Waitlist Types
export interface WaitlistEntry {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  staffName?: string;
  staffId?: string;
  requestedDate: string;
  timeWindow: string;
  flexibilityDays: number;
  priority: 'diamond' | 'platinum' | 'gold' | 'regular';
  position: number;
  status: string;
  notifiedAt?: string;
  responseDeadline?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface WaitlistStats {
  total: number;
  waiting: number;
  notified: number;
  highValue: number;
}

export interface WaitlistResponse {
  entries: WaitlistEntry[];
  stats: WaitlistStats;
}

// Checkout Types
export interface CheckoutCartItem {
  id: string;
  type: 'service' | 'product';
  name: string;
  price: number;
  quantity: number;
  duration?: number;
  staffName?: string;
  icon?: string;
}

export interface CheckoutAppointmentResponse {
  booking: {
    id: string;
    date: string;
    time: string;
    status: string;
  };
  client: {
    name: string;
    phone: string;
    email?: string;
  };
  cartItems: CheckoutCartItem[];
  staff?: {
    id: string;
    name: string;
  };
}

export interface CheckoutDiscount {
  type: 'percentage' | 'fixed';
  value: number;
  code?: string;
  reason?: string;
}

export interface CheckoutParams {
  bookingId?: string;
  clientId?: string;
  clientName: string;
  clientPhone: string;
  items: CheckoutCartItem[];
  paymentMethod: string;
  discount?: CheckoutDiscount;
  tipAmount?: number;
  notes?: string;
}

export interface CheckoutTransaction {
  id: string;
  salonId: string;
  bookingId?: string;
  clientName: string;
  clientPhone: string;
  items: CheckoutCartItem[];
  subtotal: number;
  discount: number;
  discountDetails?: CheckoutDiscount;
  gst: number;
  tip: number;
  total: number;
  paymentMethod: string;
  notes?: string;
  status: string;
  processedBy: number;
  processedAt: string;
}

export interface CheckoutResponse {
  success: boolean;
  transaction: CheckoutTransaction;
  message: string;
}

// ============================================
// TEAM MANAGEMENT TYPES
// ============================================

// Staff Detail Types
export interface StaffRole {
  id: string;
  name: string;
  icon: string;
}

export interface StaffSpecialty {
  id: string;
  name: string;
  category: string;
}

export interface StaffDetailProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  gender: 'male' | 'female' | 'other' | null;
  photoUrl: string | null;
  role: string;
  roleId: string;
  specialties: string[];
  baseSalaryInPaisa: number;
  commissionRate: number;
  isActive: boolean;
  joinedDate: string;
  todayStats: {
    appointments: number;
    completed: number;
    revenueInPaisa: number;
  };
  monthStats: {
    appointments: number;
    revenueInPaisa: number;
    commissionInPaisa: number;
    rating: number;
  };
  status: 'available' | 'busy' | 'break' | 'off' | 'leave';
}

export interface StaffDetailResponse {
  staff: StaffDetailProfile;
  roles: StaffRole[];
  availableSpecialties: StaffSpecialty[];
}

export interface CreateStaffParams {
  name: string;
  email?: string;
  phone: string;
  gender?: 'male' | 'female' | 'other';
  roleId: string;
  specialties: string[];
  baseSalaryInPaisa: number;
  commissionRate: number;
  isActive: boolean;
}

export interface UpdateStaffParams extends Partial<CreateStaffParams> {
  id: string;
}

export interface StaffMutationResponse {
  success: boolean;
  staff: StaffDetailProfile;
  message: string;
}

// Staff Schedule Types
export interface StaffShift {
  day: string;
  isWorking: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
}

export interface ScheduleAppointment {
  id: string;
  time: string;
  endTime: string;
  duration: number;
  clientName: string;
  clientPhone: string;
  service: string;
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
}

export interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  reason: string;
  isRecurring: boolean;
}

export interface StaffScheduleResponse {
  staffId: string;
  staffName: string;
  date: string;
  shifts: StaffShift[];
  appointments: ScheduleAppointment[];
  blocks: TimeBlock[];
  todayShift: StaffShift | null;
}

export interface UpdateShiftParams {
  staffId: string;
  shifts: StaffShift[];
}

export interface CreateBlockParams {
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  isRecurring?: boolean;
}

// Leave Management Types
export interface LeaveBalance {
  sick: { total: number; used: number; available: number };
  casual: { total: number; used: number; available: number };
  earned: { total: number; used: number; available: number };
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  type: 'sick' | 'casual' | 'earned' | 'unpaid' | 'half_day';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface LeaveListResponse {
  requests: LeaveRequest[];
  balance: LeaveBalance;
  stats: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

export interface CreateLeaveParams {
  staffId: string;
  type: 'sick' | 'casual' | 'earned' | 'unpaid' | 'half_day';
  startDate: string;
  endDate: string;
  reason: string;
}

export interface ReviewLeaveParams {
  leaveId: string;
  action: 'approve' | 'reject';
  note?: string;
}

export interface LeaveMutationResponse {
  success: boolean;
  request: LeaveRequest;
  message: string;
}

// Commission Types
export interface CommissionProfile {
  staffId: string;
  staffName: string;
  staffRole: string;
  baseSalaryInPaisa: number;
  defaultCommissionRate: number;
  totalEarnedThisMonthInPaisa: number;
  totalEarnedAllTimeInPaisa: number;
  pendingPayoutInPaisa: number;
}

export interface CommissionEntry {
  id: string;
  date: string;
  bookingId: string;
  clientName: string;
  service: string;
  serviceAmountInPaisa: number;
  commissionRate: number;
  commissionAmountInPaisa: number;
  status: 'earned' | 'paid' | 'pending';
}

export interface CommissionBreakdown {
  service: string;
  icon: string;
  count: number;
  totalAmountInPaisa: number;
}

export interface CommissionSummaryResponse {
  profile: CommissionProfile;
  currentMonth: {
    earnedInPaisa: number;
    paidInPaisa: number;
    serviceRevenueInPaisa: number;
    count: number;
  };
  breakdown: CommissionBreakdown[];
  trend: { month: string; amountInPaisa: number }[];
}

export interface CommissionHistoryResponse {
  entries: CommissionEntry[];
  total: number;
  month: string;
}

export interface ProcessPayoutParams {
  staffId: string;
  amountInPaisa: number;
  month: string;
  notes?: string;
}

export interface PayoutResponse {
  success: boolean;
  payoutId: string;
  amountInPaisa: number;
  message: string;
}

// Client Management Types
export interface Client {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  gender: 'male' | 'female' | 'other' | null;
  birthday: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  isVIP: boolean;
  marketingOptIn: boolean;
  smsOptIn: boolean;
  whatsappOptIn: boolean;
  totalVisits: number;
  totalSpentInPaisa: number;
  lastVisitDate: string | null;
  preferredStaffId: string | null;
  preferredStaffName: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientParams {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  gender?: 'male' | 'female' | 'other';
  birthday?: string;
  address?: string;
  city?: string;
  notes?: string;
  isVIP?: boolean;
  marketingOptIn?: boolean;
  smsOptIn?: boolean;
  whatsappOptIn?: boolean;
  preferredStaffId?: string;
  tags?: string[];
}

export interface UpdateClientParams extends Partial<CreateClientParams> {
  id: string;
}

export interface ClientMutationResponse {
  success: boolean;
  client: Client;
  message: string;
}

export interface ClientDetailResponse {
  client: Client;
  stats: {
    totalVisits: number;
    totalSpentInPaisa: number;
    averageSpendInPaisa: number;
    lastVisitDate: string | null;
    upcomingAppointments: number;
  };
  recentVisits: {
    id: string;
    date: string;
    services: string[];
    staffName: string;
    amountInPaisa: number;
    rating: number | null;
  }[];
  activePackages: {
    id: string;
    name: string;
    remainingSessions: number;
    expiryDate: string | null;
  }[];
  preferredServices: string[];
}

// CSV Import Types (Fresha-style)
export interface CSVColumnMapping {
  csvColumn: string;
  targetField: string | null;
  sampleValues: string[];
}

export interface CSVParseResult {
  headers: string[];
  rows: string[][];
  totalRows: number;
  sampleRows: string[][];
}

export interface ImportValidationResult {
  valid: ImportClientRow[];
  invalid: InvalidClientRow[];
  duplicates: DuplicateClientRow[];
  summary: {
    totalRows: number;
    validCount: number;
    invalidCount: number;
    duplicateCount: number;
  };
}

export interface ImportClientRow {
  rowIndex: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  gender: string | null;
  birthday: string | null;
  notes: string | null;
  marketingOptIn: boolean;
}

export interface InvalidClientRow {
  rowIndex: number;
  data: Record<string, string>;
  errors: string[];
}

export interface DuplicateClientRow {
  rowIndex: number;
  data: ImportClientRow;
  existingClientId: string;
  existingClientName: string;
  matchField: 'email' | 'phone';
}

export interface ImportJobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  successCount: number;
  failedCount: number;
  skippedDuplicates: number;
  errors: { rowIndex: number; error: string }[];
  createdAt: string;
  completedAt: string | null;
}

export interface StartImportParams {
  clients: ImportClientRow[];
  skipDuplicates: boolean;
  sendWelcomeMessage: boolean;
}

export interface ImportResponse {
  success: boolean;
  jobId: string;
  message: string;
}

// Campaign Assignment Types
export interface MarketingCampaign {
  id: string;
  name: string;
  description: string;
  type: 'sms' | 'email' | 'whatsapp' | 'push';
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused';
  scheduledAt: string | null;
  sentCount: number;
  targetCount: number;
  openRate: number | null;
  clickRate: number | null;
  createdAt: string;
}

export interface CampaignTarget {
  clientId: string;
  clientName: string;
  phone: string;
  email: string | null;
  isAssigned: boolean;
}

export interface CampaignAssignmentResponse {
  campaign: MarketingCampaign;
  targets: CampaignTarget[];
  filters: {
    totalClients: number;
    vipClients: number;
    newClients: number;
    inactiveClients: number;
  };
}

export interface AssignClientsToCampaignParams {
  campaignId: string;
  clientIds: string[];
  action: 'add' | 'remove';
}

export interface CampaignMutationResponse {
  success: boolean;
  campaign: MarketingCampaign;
  assignedCount: number;
  message: string;
}

// Client Management API Methods
const clientManagementApi = {
  // Get client details
  async getClientDetails(clientId: string): Promise<ApiResponse<ClientDetailResponse>> {
    return apiRequest<ClientDetailResponse>(`/api/business/clients/${clientId}`);
  },

  // Create client
  async createClient(params: CreateClientParams): Promise<ApiResponse<ClientMutationResponse>> {
    return apiRequest<ClientMutationResponse>('/api/business/clients', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Update client
  async updateClient(params: UpdateClientParams): Promise<ApiResponse<ClientMutationResponse>> {
    return apiRequest<ClientMutationResponse>(`/api/business/clients/${params.id}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  },

  // Delete client (soft delete)
  async deleteClient(clientId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest(`/api/business/clients/${clientId}`, {
      method: 'DELETE',
    });
  },

  // Validate CSV for import
  async validateClientImport(
    columnMapping: Record<string, string>,
    rows: string[][]
  ): Promise<ApiResponse<ImportValidationResult>> {
    return apiRequest<ImportValidationResult>('/api/business/clients/import/validate', {
      method: 'POST',
      body: JSON.stringify({ columnMapping, rows }),
    });
  },

  // Start client import
  async startClientImport(params: StartImportParams): Promise<ApiResponse<ImportResponse>> {
    return apiRequest<ImportResponse>('/api/business/clients/import/start', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Get import job status
  async getImportStatus(jobId: string): Promise<ApiResponse<ImportJobStatus>> {
    return apiRequest<ImportJobStatus>(`/api/business/clients/import/${jobId}/status`);
  },

  // Get campaigns for assignment
  async getCampaigns(): Promise<ApiResponse<{ campaigns: MarketingCampaign[] }>> {
    return apiRequest('/api/business/marketing/campaigns');
  },

  // Get campaign assignment details
  async getCampaignAssignment(campaignId: string): Promise<ApiResponse<CampaignAssignmentResponse>> {
    return apiRequest<CampaignAssignmentResponse>(`/api/business/marketing/campaigns/${campaignId}/assignment`);
  },

  // Assign/remove clients from campaign
  async updateCampaignAssignment(params: AssignClientsToCampaignParams): Promise<ApiResponse<CampaignMutationResponse>> {
    return apiRequest<CampaignMutationResponse>(
      `/api/business/marketing/campaigns/${params.campaignId}/assignment`,
      {
        method: 'POST',
        body: JSON.stringify({ clientIds: params.clientIds, action: params.action }),
      }
    );
  },
};

// Merge into businessApi
Object.assign(businessApi, clientManagementApi);

// ============================================
// SERVICES MANAGEMENT TYPES
// ============================================

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface ServiceStats {
  total: number;
  active: number;
  inactive: number;
  categoryCount: number;
  featuredCount: number;
  avgPrice: number;
  avgDuration: number;
}

export interface ServiceListItem {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  subCategory: string | null;
  gender: 'male' | 'female' | 'unisex' | null;
  priceInPaisa: number;
  specialPricePaisa: number | null;
  durationMinutes: number;
  isActive: number;
  priceType: 'fixed' | 'variable' | 'starting_from';
  approvalStatus: 'approved' | 'pending' | 'rejected';
  isCustomService: number;
  isComboService: number;
  isFeatured?: number;
  bookingCount?: number;
  rating?: number;
  imageUrl?: string | null;
  staffCount?: number;
  createdAt: string;
}

export interface ServicesManagementResponse {
  services: ServiceListItem[];
  byCategory: Record<string, ServiceListItem[]>;
  categories: ServiceCategory[];
  stats: ServiceStats;
  total: number;
}

export interface ServiceDetailResponse {
  service: ServiceListItem;
  assignedStaff: {
    id: string;
    name: string;
    photoUrl: string | null;
    customPrice?: number;
    customDuration?: number;
    commissionPercentage?: number;
  }[];
  relatedServices: ServiceListItem[];
  bookingStats: {
    totalBookings: number;
    last30Days: number;
    revenueInPaisa: number;
    avgRating: number;
  };
}

export interface CreateServiceParams {
  name: string;
  description?: string;
  category: string;
  subCategory?: string;
  gender?: 'male' | 'female' | 'unisex';
  priceInPaisa: number;
  durationMinutes: number;
  priceType?: 'fixed' | 'variable' | 'starting_from';
  specialPricePaisa?: number;
  productCostPaisa?: number;
  imageUrl?: string;
  staffIds?: string[];
}

export interface UpdateServiceParams extends Partial<CreateServiceParams> {
  id: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface ServiceMutationResponse {
  success: boolean;
  service: ServiceListItem;
  message: string;
}

// Services Management API
export const servicesManagementApi = {
  // Get all services with stats and categories
  async getServicesManagement(
    category?: string,
    search?: string
  ): Promise<ApiResponse<ServicesManagementResponse>> {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<ServicesManagementResponse>(`/api/mobile/business/services/management${query}`);
  },

  // Get service detail
  async getServiceDetail(serviceId: string): Promise<ApiResponse<ServiceDetailResponse>> {
    return apiRequest<ServiceDetailResponse>(`/api/mobile/business/services/${serviceId}`);
  },

  // Create new service
  async createService(params: CreateServiceParams): Promise<ApiResponse<ServiceMutationResponse>> {
    return apiRequest<ServiceMutationResponse>('/api/mobile/business/services', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Update service
  async updateService(params: UpdateServiceParams): Promise<ApiResponse<ServiceMutationResponse>> {
    return apiRequest<ServiceMutationResponse>(`/api/mobile/business/services/${params.id}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  },

  // Toggle service active status
  async toggleServiceStatus(
    serviceId: string,
    isActive: boolean
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest(`/api/mobile/business/services/${serviceId}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },

  // Delete service
  async deleteService(serviceId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest(`/api/mobile/business/services/${serviceId}`, {
      method: 'DELETE',
    });
  },

  // Get service categories
  async getServiceCategories(): Promise<ApiResponse<{ categories: ServiceCategory[] }>> {
    return apiRequest('/api/mobile/business/services/categories');
  },
};

// Merge services API into businessApi
Object.assign(businessApi, servicesManagementApi);

// ============================================
// PACKAGES MANAGEMENT API TYPES & METHODS
// ============================================

export interface PackageService {
  id: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  durationMinutes: number;
  category: string;
  extraTimeMinutes?: number;
  extraTimeType?: 'processing' | 'blocked';
}

export interface Package {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  scheduleType: 'sequential' | 'parallel';
  pricingType: 'service_pricing' | 'custom' | 'percentage_discount' | 'free';
  regularPriceInPaisa: number;
  packagePriceInPaisa: number;
  discountPercentage: number;
  totalDurationMinutes: number;
  taxRatePercentage: number;
  validityDays: number | null;
  isOnlineBookingEnabled: number;
  genderAvailability: 'everyone' | 'women' | 'men';
  isActive: number;
  soldCount: number;
  monthlyRevenue: number;
  services: PackageService[];
  createdAt: string;
  updatedAt: string;
}

export interface PackageStats {
  total: number;
  active: number;
  inactive: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export interface PackagesListResponse {
  packages: Package[];
  stats: PackageStats;
  total: number;
}

export interface PackageDetailResponse {
  package: Package;
  availableServices: ServiceListItem[];
}

export interface CreatePackageParams {
  name: string;
  description?: string;
  category?: string;
  scheduleType: 'sequential' | 'parallel';
  pricingType: 'service_pricing' | 'custom' | 'percentage_discount' | 'free';
  customPriceInPaisa?: number;
  discountPercentage?: number;
  taxRatePercentage?: number;
  validityDays?: number;
  isOnlineBookingEnabled?: boolean;
  genderAvailability?: 'everyone' | 'women' | 'men';
  services: {
    serviceId: string;
    extraTimeMinutes?: number;
    extraTimeType?: 'processing' | 'blocked';
  }[];
}

export interface UpdatePackageParams extends Partial<CreatePackageParams> {
  id: string;
  isActive?: boolean;
}

export interface PackageMutationResponse {
  success: boolean;
  package: Package;
  message: string;
}

// Packages Management API
export const packagesManagementApi = {
  // Get all packages with stats
  async getPackages(
    status?: 'all' | 'active' | 'inactive',
    search?: string
  ): Promise<ApiResponse<PackagesListResponse>> {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<PackagesListResponse>(`/api/mobile/business/packages${query}`);
  },

  // Get package detail with available services
  async getPackageDetail(packageId: string): Promise<ApiResponse<PackageDetailResponse>> {
    return apiRequest<PackageDetailResponse>(`/api/mobile/business/packages/${packageId}`);
  },

  // Get available services for package creation
  async getAvailableServicesForPackage(): Promise<ApiResponse<{ services: ServiceListItem[]; byCategory: Record<string, ServiceListItem[]> }>> {
    return apiRequest(`/api/mobile/business/packages/available-services`);
  },

  // Create new package
  async createPackage(params: CreatePackageParams): Promise<ApiResponse<PackageMutationResponse>> {
    return apiRequest<PackageMutationResponse>('/api/mobile/business/packages', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Update package
  async updatePackage(params: UpdatePackageParams): Promise<ApiResponse<PackageMutationResponse>> {
    return apiRequest<PackageMutationResponse>(`/api/mobile/business/packages/${params.id}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  },

  // Toggle package active status
  async togglePackageStatus(
    packageId: string,
    isActive: boolean
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest(`/api/mobile/business/packages/${packageId}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },

  // Delete package
  async deletePackage(packageId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest(`/api/mobile/business/packages/${packageId}`, {
      method: 'DELETE',
    });
  },

  // Duplicate package
  async duplicatePackage(packageId: string): Promise<ApiResponse<PackageMutationResponse>> {
    return apiRequest<PackageMutationResponse>(`/api/mobile/business/packages/${packageId}/duplicate`, {
      method: 'POST',
    });
  },
};

// Merge packages API into businessApi
Object.assign(businessApi, packagesManagementApi);

export default businessApi;
