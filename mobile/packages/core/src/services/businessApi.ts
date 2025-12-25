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

// ============================================
// MEMBERSHIP MANAGEMENT TYPES
// ============================================

export type MembershipPlanType = 'discount' | 'credit' | 'packaged';
export type MembershipBillingType = 'one_time' | 'recurring';
export type MembershipStatus = 'active' | 'paused' | 'cancelled' | 'expired' | 'pending_payment';

export interface MembershipPlanService {
  id: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  quantityPerMonth: number;
  isUnlimited: boolean;
}

export interface MembershipPlan {
  id: string;
  salonId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  planType: MembershipPlanType;
  durationMonths: number;
  priceInPaisa: number;
  billingType: MembershipBillingType;
  monthlyPriceInPaisa: number | null;
  discountPercentage: number | null;
  discountAppliesTo: 'all' | 'services' | 'products' | null;
  creditAmountInPaisa: number | null;
  bonusPercentage: number | null;
  creditsRollover: number;
  priorityBooking: number;
  freeCancellation: number;
  birthdayBonusInPaisa: number | null;
  referralBonusInPaisa: number | null;
  additionalPerks: string[] | null;
  maxMembers: number | null;
  maxUsesPerMonth: number | null;
  isActive: number;
  validFrom: string | null;
  validUntil: string | null;
  sortOrder: number;
  memberCount: number;
  totalRevenue: number;
  includedServices?: MembershipPlanService[];
  planColor?: string;
  isOnlineSalesEnabled?: boolean;
  isRedemptionEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipStats {
  totalPlans: number;
  activePlans: number;
  inactivePlans: number;
  totalMembers: number;
  activeMembers: number;
  recurringRevenue: number;
  churnRate: number;
}

export interface MembershipsListResponse {
  plans: MembershipPlan[];
  stats: MembershipStats;
  total: number;
}

export interface MembershipAnalytics {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  recurringRevenue: number;
  churnRate: number;
  retentionRate: number;
  avgMemberLifetime: number;
  revenueByPlan: { planId: string; planName: string; revenue: number }[];
  membersByStatus: { status: string; count: number }[];
}

export interface MembershipMember {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerAvatar: string | null;
  planId: string;
  planName: string;
  planType: MembershipPlanType;
  planColor: string;
  status: MembershipStatus;
  startDate: string;
  endDate: string;
  nextBillingDate: string | null;
  creditBalanceInPaisa: number;
  totalPaidInPaisa: number;
  autoRenew: number;
  pausedAt: string | null;
  cancelledAt: string | null;
  sessionsUsed?: number;
  sessionsRemaining?: number;
  createdAt: string;
}

export interface MembersListResponse {
  members: MembershipMember[];
  stats: {
    total: number;
    active: number;
    paused: number;
    expiringSoon: number;
    expired: number;
    cancelled: number;
  };
  total: number;
}

export interface CreateMembershipPlanParams {
  name: string;
  description?: string;
  planType: MembershipPlanType;
  durationMonths: number;
  priceInPaisa: number;
  billingType: MembershipBillingType;
  monthlyPriceInPaisa?: number;
  discountPercentage?: number;
  discountAppliesTo?: 'all' | 'services' | 'products';
  creditAmountInPaisa?: number;
  bonusPercentage?: number;
  creditsRollover?: boolean;
  priorityBooking?: boolean;
  freeCancellation?: boolean;
  birthdayBonusInPaisa?: number;
  referralBonusInPaisa?: number;
  additionalPerks?: string[];
  maxMembers?: number;
  maxUsesPerMonth?: number;
  isActive?: boolean;
  validFrom?: string;
  validUntil?: string;
  planColor?: string;
  isOnlineSalesEnabled?: boolean;
  isRedemptionEnabled?: boolean;
  includedServices?: {
    serviceId: string;
    quantityPerMonth: number;
    isUnlimited?: boolean;
  }[];
}

export interface UpdateMembershipPlanParams extends Partial<CreateMembershipPlanParams> {
  id: string;
}

export interface MembershipPlanMutationResponse {
  success: boolean;
  plan: MembershipPlan;
  message: string;
}

// Membership Management API
export const membershipsManagementApi = {
  // Get all membership plans with stats (for management)
  async getMembershipPlans(
    status?: 'all' | 'active' | 'inactive',
    search?: string
  ): Promise<ApiResponse<MembershipsListResponse>> {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('active', status === 'active' ? 'true' : 'false');
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<MembershipsListResponse>(`/api/mobile/business/membership-plans/manage${query}`);
  },

  // Get single membership plan detail
  async getMembershipPlanDetail(planId: string): Promise<ApiResponse<{ plan: MembershipPlan }>> {
    return apiRequest<{ plan: MembershipPlan }>(`/api/membership-plans/${planId}`);
  },

  // Get membership analytics
  async getMembershipAnalytics(): Promise<ApiResponse<MembershipAnalytics>> {
    return apiRequest<MembershipAnalytics>(`/api/mobile/business/membership-analytics`);
  },

  // Get members list
  async getMembers(
    status?: string,
    planId?: string,
    search?: string,
    limit?: number,
    offset?: number
  ): Promise<ApiResponse<MembersListResponse>> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (planId) params.append('planId', planId);
    if (search) params.append('search', search);
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<MembersListResponse>(`/api/mobile/business/members${query}`);
  },

  // Create new membership plan
  async createMembershipPlan(params: CreateMembershipPlanParams): Promise<ApiResponse<MembershipPlanMutationResponse>> {
    return apiRequest<MembershipPlanMutationResponse>('/api/mobile/business/membership-plans', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Update membership plan
  async updateMembershipPlan(params: UpdateMembershipPlanParams): Promise<ApiResponse<MembershipPlanMutationResponse>> {
    return apiRequest<MembershipPlanMutationResponse>(`/api/membership-plans/${params.id}`, {
      method: 'PUT',
      body: JSON.stringify(params),
    });
  },

  // Toggle plan active status
  async togglePlanStatus(
    planId: string,
    isActive: boolean
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest(`/api/membership-plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive: isActive ? 1 : 0 }),
    });
  },

  // Delete membership plan
  async deleteMembershipPlan(planId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest(`/api/membership-plans/${planId}`, {
      method: 'DELETE',
    });
  },

  // Duplicate membership plan
  async duplicateMembershipPlan(planId: string): Promise<ApiResponse<MembershipPlanMutationResponse>> {
    return apiRequest<MembershipPlanMutationResponse>(`/api/membership-plans/${planId}/duplicate`, {
      method: 'POST',
    });
  },

  // Pause member's membership
  async pauseMembership(membershipId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest(`/api/mobile/business/memberships/${membershipId}/pause`, {
      method: 'POST',
    });
  },

  // Resume member's membership
  async resumeMembership(membershipId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest(`/api/mobile/business/memberships/${membershipId}/resume`, {
      method: 'POST',
    });
  },

  // Cancel member's membership
  async cancelMembership(membershipId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest(`/api/mobile/business/memberships/${membershipId}/cancel`, {
      method: 'POST',
    });
  },

  // Send renewal reminder
  async sendRenewalReminder(membershipId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest(`/api/mobile/business/memberships/${membershipId}/send-reminder`, {
      method: 'POST',
    });
  },

  // Get available services for membership (packaged type)
  async getAvailableServicesForMembership(): Promise<ApiResponse<{ services: ServiceListItem[]; byCategory: Record<string, ServiceListItem[]> }>> {
    return apiRequest(`/api/mobile/business/membership-plans/available-services`);
  },
};

// Merge memberships API into businessApi
Object.assign(businessApi, membershipsManagementApi);

// ===== INVENTORY MANAGEMENT TYPES =====

export interface InventoryStats {
  totalProducts: number;
  activeProducts: number;
  totalStockValue: number;
  totalStockValueFormatted: string;
  lowStockCount: number;
  outOfStockCount: number;
  reorderNeededCount: number;
  expiringCount: number;
  categoryCount: number;
  vendorCount: number;
  pendingOrdersCount: number;
}

export interface InventoryProduct {
  id: string;
  salonId: string;
  categoryId?: string;
  vendorId?: string;
  sku: string;
  name: string;
  description?: string;
  brand?: string;
  size?: string;
  unit: string;
  costPriceInPaisa: number;
  sellingPriceInPaisa?: number;
  currency: string;
  currentStock: string;
  minimumStock: string;
  maximumStock?: string;
  reorderPoint?: string;
  reorderQuantity?: string;
  leadTimeDays: number;
  expiryDate?: string;
  batchNumber?: string;
  barcode?: string;
  location?: string;
  isActive: number;
  isRetailItem: number;
  trackStock: number;
  lowStockAlert: number;
  availableForRetail?: number;
  retailPriceInPaisa?: number;
  retailDescription?: string;
  retailStockAllocated?: number;
  featured?: number;
  notes?: string;
  tags: string[];
  metadata?: { imageUrl?: string };
  createdAt: string;
  updatedAt: string;
  categoryName?: string;
  vendorName?: string;
  stockStatus: 'out' | 'low' | 'good' | 'overstock';
  costPriceFormatted: string;
  sellingPriceFormatted?: string;
  retailPriceFormatted?: string;
}

export interface ProductCategory {
  id: string;
  salonId: string;
  name: string;
  description?: string;
  parentCategoryId?: string;
  isActive: number;
  sortOrder: number;
  createdAt: string;
  productCount: number;
}

export interface Vendor {
  id: string;
  salonId: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
  website?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'suspended';
  rating: string;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
  orderCount?: number;
  totalOrdered?: number;
  totalOrderedFormatted?: string;
}

export interface StockMovement {
  id: string;
  salonId: string;
  productId: string;
  type: 'receive' | 'usage' | 'adjustment' | 'transfer' | 'damage' | 'return' | 'expired';
  quantity: string;
  unit: string;
  unitCostInPaisa?: number;
  totalCostInPaisa?: number;
  previousStock: string;
  newStock: string;
  reason?: string;
  reference?: string;
  referenceId?: string;
  referenceType?: string;
  staffId?: string;
  staffName?: string;
  notes?: string;
  batchNumber?: string;
  expiryDate?: string;
  createdAt: string;
  createdAtFormatted?: string;
  productName?: string;
  productSku?: string;
}

export interface PurchaseOrder {
  id: string;
  salonId: string;
  vendorId: string;
  orderNumber: string;
  status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  subtotalInPaisa: number;
  taxInPaisa: number;
  shippingInPaisa: number;
  discountInPaisa: number;
  totalInPaisa: number;
  currency: string;
  paymentTerms?: string;
  paymentStatus?: string;
  notes?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
  vendorName?: string;
  vendorEmail?: string;
  vendorPhone?: string;
  totalFormatted?: string;
  subtotalFormatted?: string;
  orderDateFormatted?: string;
  expectedDeliveryFormatted?: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  quantity: string;
  unit: string;
  unitCostInPaisa: number;
  totalCostInPaisa: number;
  receivedQuantity?: string;
  notes?: string;
  createdAt: string;
  productName?: string;
  productSku?: string;
  productUnit?: string;
  unitCostFormatted?: string;
  totalCostFormatted?: string;
}

export interface ReorderSuggestion {
  productId: string;
  productName: string;
  sku: string;
  vendorId?: string;
  vendorName?: string;
  currentStock: number;
  reorderPoint: number;
  suggestedQuantity: number;
  estimatedCost: number;
  estimatedCostFormatted: string;
  leadTimeDays?: number;
  urgency: 'critical' | 'low';
}

export interface CreateProductParams {
  categoryId?: string;
  vendorId?: string;
  sku: string;
  name: string;
  description?: string;
  brand?: string;
  size?: string;
  unit?: string;
  costPriceInPaisa: number;
  sellingPriceInPaisa?: number;
  currentStock?: number;
  minimumStock?: number;
  maximumStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  leadTimeDays?: number;
  expiryDate?: string;
  batchNumber?: string;
  barcode?: string;
  location?: string;
  isActive?: number;
  isRetailItem?: number;
  trackStock?: number;
  lowStockAlert?: number;
  availableForRetail?: number;
  retailPriceInPaisa?: number;
  retailDescription?: string;
  retailStockAllocated?: number;
  featured?: number;
  notes?: string;
  tags?: string[];
  imageUrl?: string;
}

export interface StockAdjustmentParams {
  productId: string;
  type: 'receive' | 'usage' | 'adjustment' | 'transfer' | 'damage' | 'return' | 'expired';
  quantity: number;
  reason?: string;
  notes?: string;
  batchNumber?: string;
  expiryDate?: string;
  unitCostInPaisa?: number;
}

export interface CreatePurchaseOrderParams {
  vendorId: string;
  expectedDeliveryDate?: string;
  notes?: string;
  internalNotes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitCostInPaisa: number;
  }>;
}

export interface ReceiveItemsParams {
  items: Array<{
    itemId: string;
    receivedQuantity: number;
    batchNumber?: string;
    expiryDate?: string;
  }>;
  notes?: string;
}

export interface StocktakeParams {
  items: Array<{
    productId: string;
    countedQuantity: number;
    notes?: string;
  }>;
  notes?: string;
}

// ===== INVENTORY MANAGEMENT API =====

export const inventoryManagementApi = {
  // Get inventory stats
  async getInventoryStats(): Promise<ApiResponse<{ stats: InventoryStats }>> {
    return apiRequest('/api/mobile/business/inventory/stats');
  },

  // Get products list
  async getProducts(params?: {
    search?: string;
    categoryId?: string;
    vendorId?: string;
    stockStatus?: 'out' | 'low' | 'good' | 'overstock';
    isActive?: number;
    isRetail?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ products: InventoryProduct[] }>> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.set('search', params.search);
    if (params?.categoryId) queryParams.set('categoryId', params.categoryId);
    if (params?.vendorId) queryParams.set('vendorId', params.vendorId);
    if (params?.stockStatus) queryParams.set('stockStatus', params.stockStatus);
    if (params?.isActive !== undefined) queryParams.set('isActive', String(params.isActive));
    if (params?.isRetail) queryParams.set('isRetail', params.isRetail);
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.offset) queryParams.set('offset', String(params.offset));
    
    const query = queryParams.toString();
    return apiRequest(`/api/mobile/business/inventory/products${query ? `?${query}` : ''}`);
  },

  // Get single product
  async getProduct(productId: string): Promise<ApiResponse<{ product: InventoryProduct; movements: StockMovement[] }>> {
    return apiRequest(`/api/mobile/business/inventory/products/${productId}`);
  },

  // Create product
  async createProduct(params: CreateProductParams): Promise<ApiResponse<{ product: InventoryProduct }>> {
    return apiRequest('/api/mobile/business/inventory/products', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Update product
  async updateProduct(productId: string, params: Partial<CreateProductParams>): Promise<ApiResponse<{ product: InventoryProduct }>> {
    return apiRequest(`/api/mobile/business/inventory/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(params),
    });
  },

  // Delete product
  async deleteProduct(productId: string): Promise<ApiResponse<{ message: string }>> {
    return apiRequest(`/api/mobile/business/inventory/products/${productId}`, {
      method: 'DELETE',
    });
  },

  // Get categories
  async getCategories(): Promise<ApiResponse<{ categories: ProductCategory[] }>> {
    return apiRequest('/api/mobile/business/inventory/categories');
  },

  // Create category
  async createCategory(params: { name: string; description?: string; parentCategoryId?: string }): Promise<ApiResponse<{ category: ProductCategory }>> {
    return apiRequest('/api/mobile/business/inventory/categories', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Update category
  async updateCategory(categoryId: string, params: { name?: string; description?: string; isActive?: number }): Promise<ApiResponse<{ category: ProductCategory }>> {
    return apiRequest(`/api/mobile/business/inventory/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(params),
    });
  },

  // Delete category
  async deleteCategory(categoryId: string): Promise<ApiResponse<{ message: string }>> {
    return apiRequest(`/api/mobile/business/inventory/categories/${categoryId}`, {
      method: 'DELETE',
    });
  },

  // Get vendors
  async getVendors(params?: { search?: string; status?: string }): Promise<ApiResponse<{ vendors: Vendor[] }>> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.set('search', params.search);
    if (params?.status) queryParams.set('status', params.status);
    
    const query = queryParams.toString();
    return apiRequest(`/api/mobile/business/inventory/vendors${query ? `?${query}` : ''}`);
  },

  // Get single vendor
  async getVendor(vendorId: string): Promise<ApiResponse<{ vendor: Vendor; products: InventoryProduct[]; recentOrders: PurchaseOrder[] }>> {
    return apiRequest(`/api/mobile/business/inventory/vendors/${vendorId}`);
  },

  // Create vendor
  async createVendor(params: Omit<Vendor, 'id' | 'salonId' | 'createdAt' | 'updatedAt' | 'productCount' | 'orderCount' | 'totalOrdered' | 'totalOrderedFormatted'>): Promise<ApiResponse<{ vendor: Vendor }>> {
    return apiRequest('/api/mobile/business/inventory/vendors', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Update vendor
  async updateVendor(vendorId: string, params: Partial<Vendor>): Promise<ApiResponse<{ vendor: Vendor }>> {
    return apiRequest(`/api/mobile/business/inventory/vendors/${vendorId}`, {
      method: 'PUT',
      body: JSON.stringify(params),
    });
  },

  // Adjust stock
  async adjustStock(params: StockAdjustmentParams): Promise<ApiResponse<{ movement: StockMovement; previousStock: number; newStock: number }>> {
    return apiRequest('/api/mobile/business/inventory/stock-adjustment', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Get stock movements
  async getStockMovements(params?: {
    productId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<ApiResponse<{ movements: StockMovement[] }>> {
    const queryParams = new URLSearchParams();
    if (params?.productId) queryParams.set('productId', params.productId);
    if (params?.type) queryParams.set('type', params.type);
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    
    const query = queryParams.toString();
    return apiRequest(`/api/mobile/business/inventory/stock-movements${query ? `?${query}` : ''}`);
  },

  // Get purchase orders
  async getPurchaseOrders(params?: { status?: string; vendorId?: string; limit?: number }): Promise<ApiResponse<{ orders: PurchaseOrder[] }>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.vendorId) queryParams.set('vendorId', params.vendorId);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    
    const query = queryParams.toString();
    return apiRequest(`/api/mobile/business/inventory/purchase-orders${query ? `?${query}` : ''}`);
  },

  // Get single purchase order
  async getPurchaseOrder(orderId: string): Promise<ApiResponse<{ order: PurchaseOrder; items: PurchaseOrderItem[] }>> {
    return apiRequest(`/api/mobile/business/inventory/purchase-orders/${orderId}`);
  },

  // Create purchase order
  async createPurchaseOrder(params: CreatePurchaseOrderParams): Promise<ApiResponse<{ order: PurchaseOrder }>> {
    return apiRequest('/api/mobile/business/inventory/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Update purchase order status
  async updatePurchaseOrderStatus(orderId: string, status: PurchaseOrder['status']): Promise<ApiResponse<{ order: PurchaseOrder }>> {
    return apiRequest(`/api/mobile/business/inventory/purchase-orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Receive items from purchase order
  async receiveItems(orderId: string, params: ReceiveItemsParams): Promise<ApiResponse<{ message: string }>> {
    return apiRequest(`/api/mobile/business/inventory/purchase-orders/${orderId}/receive`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Submit stocktake
  async submitStocktake(params: StocktakeParams): Promise<ApiResponse<{ message: string; adjustments: any[] }>> {
    return apiRequest('/api/mobile/business/inventory/stocktake', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Get reorder suggestions
  async getReorderSuggestions(): Promise<ApiResponse<{ suggestions: ReorderSuggestion[] }>> {
    return apiRequest('/api/mobile/business/inventory/reorder-suggestions');
  },

  // Get inventory analytics (top selling, stock trends, recent changes)
  async getInventoryAnalytics(period: 'week' | 'month' = 'week'): Promise<ApiResponse<InventoryAnalytics>> {
    return apiRequest(`/api/mobile/business/inventory/analytics?period=${period}`);
  },
};

// Inventory Analytics Types
export interface InventoryAnalytics {
  topSellingProducts: TopSellingProduct[];
  stockTrends: StockTrend[];
  recentChanges: StockChange[];
  trendSummary: TrendSummary;
}

export interface TopSellingProduct {
  id: string;
  name: string;
  unitsSold: number;
  revenue: number;
  category: string;
  imageUrl?: string;
}

export interface StockTrend {
  day: string;
  inbound: number;
  outbound: number;
}

export interface StockChange {
  id: string;
  type: 'added' | 'used' | 'adjusted' | 'delivery';
  title: string;
  productName: string;
  quantity: number;
  by: string;
  timestamp: string;
}

export interface TrendSummary {
  stockIn: number;
  stockOut: number;
  turnoverRate: number;
}

// Merge inventory API into businessApi
Object.assign(businessApi, inventoryManagementApi);

// ============================================
// SETTINGS MANAGEMENT TYPES AND API
// ============================================

export interface SalonSettings {
  id: string;
  name: string;
  description: string | null;
  shopNumber: string | null;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string | null;
  category: string;
  priceRange: string;
  venueType: string | null;
  instantBooking: number;
  offerDeals: number;
  acceptGroup: number;
  imageUrl: string | null;
  imageUrls: string[] | null;
  openTime: string | null;
  closeTime: string | null;
  businessHours: Record<string, { open: boolean; start: string; end: string; breakStart?: string; breakEnd?: string }> | null;
  membershipEnabled: number | null;
  latitude: string | null;
  longitude: string | null;
}

export interface UserProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  profileImage: string | null;
  role: string | null;
}

export interface NotificationPreferences {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  bookingReminders: boolean;
  paymentAlerts: boolean;
  marketingUpdates: boolean;
}

export interface AppPreferences {
  language: string;
  theme: string;
  dateFormat: string;
  timeFormat: string;
  soundEffects: boolean;
  hapticFeedback: boolean;
}

export interface SettingsResponse {
  profile: UserProfile;
  salon: SalonSettings;
  notificationPreferences: NotificationPreferences;
  appPreferences: AppPreferences;
  staffRole: string;
  isOwner: boolean;
}

export interface BusinessHours {
  [day: string]: {
    open: boolean;
    start: string;
    end: string;
    breakStart?: string;
    breakEnd?: string;
  };
}

// Payroll Types
export interface PayrollStats {
  totalStaff: number;
  activePayrollCycle: { id: string; status: string } | null;
  pendingLeaveRequests: number;
  pendingOnboarding: number;
  pendingExits: number;
  totalPayablePaisa: number;
  lastPayrollDate: string | null;
}

export interface StaffWithSalary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  roles: string[];
  employmentProfile: {
    id: string;
    employmentType: string;
    compensationModel: string;
    status: string;
    joiningDate: string | null;
    onboardingStatus: string;
  } | null;
  salaryComponent: {
    id: string;
    baseSalaryPaisa: number;
    hourlyRatePaisa: number | null;
    hraAllowancePaisa: number | null;
    travelAllowancePaisa: number | null;
    mealAllowancePaisa: number | null;
    otherAllowancesPaisa: number | null;
    pfDeductionPaisa: number | null;
    esiDeductionPaisa: number | null;
    professionalTaxPaisa: number | null;
    tdsDeductionPaisa: number | null;
    effectiveFrom: string | null;
  } | null;
}

export interface PayrollCycle {
  id: string;
  periodYear: number;
  periodMonth: number;
  periodStartDate: string;
  periodEndDate: string;
  status: string;
  totalStaffCount: number;
  totalGrossSalaryPaisa: number;
  totalCommissionsPaisa: number;
  totalDeductionsPaisa: number;
  totalNetPayablePaisa: number;
  processedAt: string | null;
  approvedAt: string | null;
}

export interface PayrollEntry {
  id: string;
  staffId: string;
  staffName: string;
  baseSalaryPaisa: number;
  hraAllowancePaisa: number;
  travelAllowancePaisa: number;
  mealAllowancePaisa: number;
  otherAllowancesPaisa: number;
  commissionsPaisa: number;
  bonusPaisa: number;
  overtimePaisa: number;
  tipsPaisa: number;
  grossEarningsPaisa: number;
  pfDeductionPaisa: number;
  esiDeductionPaisa: number;
  professionalTaxPaisa: number;
  tdsDeductionPaisa: number;
  advanceDeductionPaisa: number;
  otherDeductionsPaisa: number;
  totalDeductionsPaisa: number;
  netPayablePaisa: number;
  status: string;
  paidAt: string | null;
  workingDays: number;
  presentDays: number;
  leaveDays: number;
  absentDays: number;
}

export interface CommissionStructure {
  id: string;
  name: string;
  type: 'flat' | 'percentage' | 'tiered';
  serviceCategory: string | null;
  baseFlatAmount: number | null;
  basePercentage: number | null;
  tiers: { min: number; max: number; rate: number }[];
  isActive: boolean;
}

export interface CreatePayrollCycleParams {
  periodYear: number;
  periodMonth: number;
  staffIds: string[];
}

export interface ProcessPayrollParams {
  cycleId: string;
  adjustments?: {
    staffId: string;
    bonusPaisa?: number;
    deductionPaisa?: number;
    notes?: string;
  }[];
}

export const payrollApi = {
  async getStats(): Promise<ApiResponse<PayrollStats>> {
    return apiRequest('/api/mobile/business/payroll/stats');
  },

  async getStaffWithSalary(): Promise<ApiResponse<StaffWithSalary[]>> {
    return apiRequest('/api/mobile/business/payroll/staff');
  },

  async getPayrollCycles(year?: number): Promise<ApiResponse<PayrollCycle[]>> {
    const params = year ? `?year=${year}` : '';
    return apiRequest(`/api/mobile/business/payroll/cycles${params}`);
  },

  async getPayrollCycleDetails(cycleId: string): Promise<ApiResponse<{ cycle: PayrollCycle; entries: PayrollEntry[] }>> {
    return apiRequest(`/api/mobile/business/payroll/cycles/${cycleId}`);
  },

  async getStaffPayrollDetails(staffId: string, year?: number, month?: number): Promise<ApiResponse<{
    staff: StaffWithSalary;
    currentEntry: PayrollEntry | null;
    history: PayrollEntry[];
    attendance: { workingDays: number; presentDays: number; leaveDays: number; absentDays: number };
  }>> {
    let params = '';
    if (year) params += `?year=${year}`;
    if (month) params += params ? `&month=${month}` : `?month=${month}`;
    return apiRequest(`/api/mobile/business/payroll/staff/${staffId}${params}`);
  },

  async createPayrollCycle(params: CreatePayrollCycleParams): Promise<ApiResponse<{ id: string; message: string }>> {
    return apiRequest('/api/mobile/business/payroll/cycles', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async processPayroll(params: ProcessPayrollParams): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest(`/api/mobile/business/payroll/cycles/${params.cycleId}/process`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async markEntryPaid(entryId: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest(`/api/mobile/business/payroll/entries/${entryId}/pay`, {
      method: 'POST',
    });
  },

  async getCommissionStructures(): Promise<ApiResponse<CommissionStructure[]>> {
    return apiRequest('/api/mobile/business/payroll/commission-structures');
  },

  async createCommissionStructure(params: Omit<CommissionStructure, 'id'>): Promise<ApiResponse<{ id: string }>> {
    return apiRequest('/api/mobile/business/payroll/commission-structures', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async updateCommissionStructure(id: string, params: Partial<CommissionStructure>): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest(`/api/mobile/business/payroll/commission-structures/${id}`, {
      method: 'PUT',
      body: JSON.stringify(params),
    });
  },

  async getStaffCommissions(staffId: string, month?: number, year?: number): Promise<ApiResponse<{
    total: number;
    breakdown: { serviceId: string; serviceName: string; count: number; amount: number }[];
  }>> {
    let params = '';
    if (year) params += `?year=${year}`;
    if (month) params += params ? `&month=${month}` : `?month=${month}`;
    return apiRequest(`/api/mobile/business/payroll/staff/${staffId}/commissions${params}`);
  },

  async getStaffTips(staffId: string, month?: number, year?: number): Promise<ApiResponse<{
    total: number;
    transactions: { id: string; amount: number; date: string; source: string }[];
  }>> {
    let params = '';
    if (year) params += `?year=${year}`;
    if (month) params += params ? `&month=${month}` : `?month=${month}`;
    return apiRequest(`/api/mobile/business/payroll/staff/${staffId}/tips${params}`);
  },

  async exportPayrollReport(cycleId: string, format: 'pdf' | 'excel'): Promise<ApiResponse<{ downloadUrl: string }>> {
    return apiRequest(`/api/mobile/business/payroll/cycles/${cycleId}/export?format=${format}`);
  },
};

export const settingsApi = {
  async getSettings(): Promise<ApiResponse<SettingsResponse>> {
    return apiRequest('/api/mobile/business/settings');
  },

  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return apiRequest('/api/mobile/business/settings/profile');
  },

  async updateProfile(params: Partial<UserProfile>): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest('/api/mobile/business/settings/profile', {
      method: 'PUT',
      body: JSON.stringify(params),
    });
  },

  async getSalon(): Promise<ApiResponse<SalonSettings>> {
    return apiRequest('/api/mobile/business/settings/salon');
  },

  async updateSalon(params: Partial<SalonSettings>): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest('/api/mobile/business/settings/salon', {
      method: 'PUT',
      body: JSON.stringify(params),
    });
  },

  async updateBusinessHours(params: { businessHours: BusinessHours; breakTime?: { start: string; end: string } }): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest('/api/mobile/business/settings/business-hours', {
      method: 'PUT',
      body: JSON.stringify(params),
    });
  },

  async updateBookingSettings(params: { instantBooking?: boolean; offerDeals?: boolean; acceptGroup?: boolean }): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest('/api/mobile/business/settings/booking', {
      method: 'PUT',
      body: JSON.stringify(params),
    });
  },

  async changePassword(params: { currentPassword: string; newPassword: string }): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiRequest('/api/mobile/business/settings/password', {
      method: 'PUT',
      body: JSON.stringify(params),
    });
  },
};

Object.assign(businessApi, settingsApi);

export default businessApi;
