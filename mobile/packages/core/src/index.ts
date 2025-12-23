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
} from './hooks/useBusinessApi';
