/**
 * @stylemate/core
 * 
 * Shared core functionality for Stylemate mobile apps
 */

// Auth
export * from './auth';

// API Services
export { businessApi } from './services/businessApi';
export type {
  DashboardData,
  DashboardStats,
  RevenueChartData,
  Appointment,
  AppointmentService,
  AppointmentStaff,
  TodayAppointmentsResponse,
  DateAppointmentsResponse,
  CalendarResponse,
  TimelineSlot,
  StaffMember,
  StaffListResponse,
  Service,
  ServicesListResponse,
  Client,
  ClientsListResponse,
  CreateBookingParams,
  CreateBookingResponse,
  WaitlistEntry,
  WaitlistStats,
  WaitlistResponse,
  CheckoutCartItem,
  CheckoutAppointmentResponse,
  CheckoutDiscount,
  CheckoutParams,
  CheckoutTransaction,
  CheckoutResponse,
  StaffRole,
  StaffSpecialty,
  StaffDetailProfile,
  StaffDetailResponse,
  CreateStaffParams,
  UpdateStaffParams,
  StaffMutationResponse,
  StaffShift,
  ScheduleAppointment,
  TimeBlock,
  StaffScheduleResponse,
  UpdateShiftParams,
  CreateBlockParams,
  LeaveBalance,
  LeaveRequest,
  LeaveListResponse,
  CreateLeaveParams,
  ReviewLeaveParams,
  LeaveMutationResponse,
  CommissionProfile,
  CommissionEntry,
  CommissionBreakdown,
  CommissionSummaryResponse,
  CommissionHistoryResponse,
  ProcessPayoutParams,
  PayoutResponse,
} from './services/businessApi';

// Hooks
export {
  useDashboard,
  useTodayAppointments,
  useAppointmentsByDate,
  useCalendar,
  useStaff,
  useServices,
  useClients,
  useWaitlist,
  useWaitlistActions,
  useCheckoutAppointment,
  useCheckout,
  useStaffDetail,
  useStaffRoles,
  useStaffMutations,
  useStaffSchedule,
  useScheduleActions,
  useLeaveRequests,
  useStaffLeaveBalance,
  useLeaveActions,
  useCommissionSummary,
  useCommissionHistory,
  useCommissionActions,
} from './hooks/useBusinessApi';

// Preferences
export {
  preferencesStorage,
  type NotificationPreferences,
  type AppPreferences,
  type SecurityPreferences,
} from './services/preferencesStorage';
export {
  useNotificationPreferences,
  useAppPreferences,
  useSecurityPreferences,
} from './hooks/usePreferences';
