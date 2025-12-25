/**
 * React hooks for Business API
 * 
 * Provides easy-to-use hooks with loading states, error handling, and caching
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  businessApi, 
  servicesManagementApi,
  packagesManagementApi,
  inventoryManagementApi,
  settingsApi,
  payrollApi,
  DashboardData, 
  TodayAppointmentsResponse, 
  DateAppointmentsResponse, 
  CalendarResponse, 
  StaffListResponse, 
  ServicesListResponse, 
  ClientsListResponse, 
  WaitlistResponse, 
  CheckoutAppointmentResponse, 
  CheckoutParams, 
  CheckoutResponse,
  StaffDetailResponse,
  StaffRole,
  CreateStaffParams,
  UpdateStaffParams,
  StaffMutationResponse,
  StaffScheduleResponse,
  UpdateShiftParams,
  CreateBlockParams,
  TimeBlock,
  LeaveListResponse,
  LeaveBalance,
  CreateLeaveParams,
  ReviewLeaveParams,
  LeaveMutationResponse,
  CommissionSummaryResponse,
  CommissionHistoryResponse,
  ProcessPayoutParams,
  PayoutResponse,
  ServicesManagementResponse,
  ServiceDetailResponse,
  CreateServiceParams,
  UpdateServiceParams,
  ServiceMutationResponse,
  ServiceCategory,
  PackagesListResponse,
  PackageDetailResponse,
  CreatePackageParams,
  UpdatePackageParams,
  PackageMutationResponse,
  ServiceListItem,
  InventoryStats,
  InventoryProduct,
  ProductCategory,
  Vendor,
  StockMovement,
  PurchaseOrder,
  PurchaseOrderItem,
  ReorderSuggestion,
  CreateProductParams,
  StockAdjustmentParams,
  CreatePurchaseOrderParams,
  ReceiveItemsParams,
  StocktakeParams,
  InventoryAnalytics,
  SettingsResponse,
  UserProfile,
  SalonSettings,
  NotificationPreferences,
  AppPreferences,
  BusinessHours,
  PayrollStats,
  StaffWithSalary,
  PayrollCycle,
  PayrollEntry,
  CommissionStructure,
  CreatePayrollCycleParams,
  ProcessPayrollParams,
} from '../services/businessApi';

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

export function useWaitlist(status?: string, limit?: number): UseApiState<WaitlistResponse> {
  const [data, setData] = useState<WaitlistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await businessApi.getWaitlist(status, limit);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, [status, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

interface UseWaitlistActionsReturn {
  notifyClient: (entryId: string, slotDate: string, slotTime: string) => Promise<{ success: boolean; error?: string }>;
  removeEntry: (entryId: string) => Promise<{ success: boolean; error?: string }>;
  isNotifying: boolean;
  isRemoving: boolean;
}

export function useWaitlistActions(): UseWaitlistActionsReturn {
  const [isNotifying, setIsNotifying] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const notifyClient = useCallback(async (entryId: string, slotDate: string, slotTime: string) => {
    setIsNotifying(true);
    const response = await businessApi.notifyWaitlistClient(entryId, slotDate, slotTime);
    setIsNotifying(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    return { success: true };
  }, []);

  const removeEntry = useCallback(async (entryId: string) => {
    setIsRemoving(true);
    const response = await businessApi.removeFromWaitlist(entryId);
    setIsRemoving(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    return { success: true };
  }, []);

  return { notifyClient, removeEntry, isNotifying, isRemoving };
}

export function useCheckoutAppointment(bookingId?: string): UseApiState<CheckoutAppointmentResponse> {
  const [data, setData] = useState<CheckoutAppointmentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    setError(null);
    const response = await businessApi.getCheckoutAppointment(bookingId);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, [bookingId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

interface UseCheckoutReturn {
  processPayment: (params: CheckoutParams) => Promise<{ success: boolean; transaction?: CheckoutResponse['transaction']; error?: string }>;
  isProcessing: boolean;
}

export function useCheckout(): UseCheckoutReturn {
  const [isProcessing, setIsProcessing] = useState(false);

  const processPayment = useCallback(async (params: CheckoutParams) => {
    setIsProcessing(true);
    const response = await businessApi.processCheckout(params);
    setIsProcessing(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    if (response.data) {
      return { success: true, transaction: response.data.transaction };
    }
    return { success: false, error: 'Unknown error' };
  }, []);

  return { processPayment, isProcessing };
}

// ============================================
// TEAM MANAGEMENT HOOKS
// ============================================

export function useStaffDetail(staffId?: string): UseApiState<StaffDetailResponse> {
  const [data, setData] = useState<StaffDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!staffId) return;
    setLoading(true);
    setError(null);
    const response = await businessApi.getStaffDetail(staffId);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, [staffId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useStaffRoles(): UseApiState<{ roles: StaffRole[] }> {
  const [data, setData] = useState<{ roles: StaffRole[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await businessApi.getStaffRoles();
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

interface UseStaffMutationsReturn {
  createStaff: (params: CreateStaffParams) => Promise<{ success: boolean; staff?: StaffMutationResponse['staff']; error?: string }>;
  updateStaff: (params: UpdateStaffParams) => Promise<{ success: boolean; staff?: StaffMutationResponse['staff']; error?: string }>;
  isCreating: boolean;
  isUpdating: boolean;
}

export function useStaffMutations(): UseStaffMutationsReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const createStaff = useCallback(async (params: CreateStaffParams) => {
    setIsCreating(true);
    const response = await businessApi.createStaff(params);
    setIsCreating(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    if (response.data) {
      return { success: true, staff: response.data.staff };
    }
    return { success: false, error: 'Unknown error' };
  }, []);

  const updateStaff = useCallback(async (params: UpdateStaffParams) => {
    setIsUpdating(true);
    const response = await businessApi.updateStaff(params);
    setIsUpdating(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    if (response.data) {
      return { success: true, staff: response.data.staff };
    }
    return { success: false, error: 'Unknown error' };
  }, []);

  return { createStaff, updateStaff, isCreating, isUpdating };
}

export function useStaffSchedule(staffId?: string, date?: string): UseApiState<StaffScheduleResponse> {
  const [data, setData] = useState<StaffScheduleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!staffId || !date) return;
    setLoading(true);
    setError(null);
    const response = await businessApi.getStaffSchedule(staffId, date);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, [staffId, date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

interface UseScheduleActionsReturn {
  updateShifts: (params: UpdateShiftParams) => Promise<{ success: boolean; error?: string }>;
  createBlock: (params: CreateBlockParams) => Promise<{ success: boolean; block?: TimeBlock; error?: string }>;
  deleteBlock: (staffId: string, blockId: string) => Promise<{ success: boolean; error?: string }>;
  isUpdatingShifts: boolean;
  isCreatingBlock: boolean;
  isDeletingBlock: boolean;
}

export function useScheduleActions(): UseScheduleActionsReturn {
  const [isUpdatingShifts, setIsUpdatingShifts] = useState(false);
  const [isCreatingBlock, setIsCreatingBlock] = useState(false);
  const [isDeletingBlock, setIsDeletingBlock] = useState(false);

  const updateShifts = useCallback(async (params: UpdateShiftParams) => {
    setIsUpdatingShifts(true);
    const response = await businessApi.updateStaffShifts(params);
    setIsUpdatingShifts(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    return { success: true };
  }, []);

  const createBlock = useCallback(async (params: CreateBlockParams) => {
    setIsCreatingBlock(true);
    const response = await businessApi.createTimeBlock(params);
    setIsCreatingBlock(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    if (response.data) {
      return { success: true, block: response.data.block };
    }
    return { success: false, error: 'Unknown error' };
  }, []);

  const deleteBlock = useCallback(async (staffId: string, blockId: string) => {
    setIsDeletingBlock(true);
    const response = await businessApi.deleteTimeBlock(staffId, blockId);
    setIsDeletingBlock(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    return { success: true };
  }, []);

  return { updateShifts, createBlock, deleteBlock, isUpdatingShifts, isCreatingBlock, isDeletingBlock };
}

export function useLeaveRequests(status?: string): UseApiState<LeaveListResponse> {
  const [data, setData] = useState<LeaveListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await businessApi.getLeaveRequests(status);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, [status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useStaffLeaveBalance(staffId?: string): UseApiState<{ balance: LeaveBalance }> {
  const [data, setData] = useState<{ balance: LeaveBalance } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!staffId) return;
    setLoading(true);
    setError(null);
    const response = await businessApi.getStaffLeaveBalance(staffId);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, [staffId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

interface UseLeaveActionsReturn {
  createRequest: (params: CreateLeaveParams) => Promise<{ success: boolean; request?: LeaveMutationResponse['request']; error?: string }>;
  reviewRequest: (params: ReviewLeaveParams) => Promise<{ success: boolean; request?: LeaveMutationResponse['request']; error?: string }>;
  isCreating: boolean;
  isReviewing: boolean;
}

export function useLeaveActions(): UseLeaveActionsReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  const createRequest = useCallback(async (params: CreateLeaveParams) => {
    setIsCreating(true);
    const response = await businessApi.createLeaveRequest(params);
    setIsCreating(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    if (response.data) {
      return { success: true, request: response.data.request };
    }
    return { success: false, error: 'Unknown error' };
  }, []);

  const reviewRequest = useCallback(async (params: ReviewLeaveParams) => {
    setIsReviewing(true);
    const response = await businessApi.reviewLeaveRequest(params);
    setIsReviewing(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    if (response.data) {
      return { success: true, request: response.data.request };
    }
    return { success: false, error: 'Unknown error' };
  }, []);

  return { createRequest, reviewRequest, isCreating, isReviewing };
}

export function useCommissionSummary(staffId?: string): UseApiState<CommissionSummaryResponse> {
  const [data, setData] = useState<CommissionSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!staffId) return;
    setLoading(true);
    setError(null);
    const response = await businessApi.getCommissionSummary(staffId);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, [staffId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useCommissionHistory(staffId?: string, month?: string): UseApiState<CommissionHistoryResponse> {
  const [data, setData] = useState<CommissionHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!staffId || !month) return;
    setLoading(true);
    setError(null);
    const response = await businessApi.getCommissionHistory(staffId, month);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, [staffId, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

interface UseCommissionActionsReturn {
  processPayout: (params: ProcessPayoutParams) => Promise<{ success: boolean; payoutId?: string; error?: string }>;
  exportReport: (staffId: string, month: string) => Promise<{ success: boolean; url?: string; error?: string }>;
  isProcessingPayout: boolean;
  isExporting: boolean;
}

export function useCommissionActions(): UseCommissionActionsReturn {
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const processPayout = useCallback(async (params: ProcessPayoutParams) => {
    setIsProcessingPayout(true);
    const response = await businessApi.processCommissionPayout(params);
    setIsProcessingPayout(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    if (response.data) {
      return { success: true, payoutId: response.data.payoutId };
    }
    return { success: false, error: 'Unknown error' };
  }, []);

  const exportReport = useCallback(async (staffId: string, month: string) => {
    setIsExporting(true);
    const response = await businessApi.exportCommissionReport(staffId, month);
    setIsExporting(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    if (response.data) {
      return { success: true, url: response.data.url };
    }
    return { success: false, error: 'Unknown error' };
  }, []);

  return { processPayout, exportReport, isProcessingPayout, isExporting };
}

// Client Management Hooks
import type {
  ClientDetailResponse,
  CreateClientParams,
  UpdateClientParams,
  ClientMutationResponse,
  ImportValidationResult,
  ImportJobStatus,
  StartImportParams,
  MarketingCampaign,
  CampaignAssignmentResponse,
  AssignClientsToCampaignParams,
} from '../services/businessApi';

export function useClientDetails(clientId?: string): UseApiState<ClientDetailResponse> {
  const [data, setData] = useState<ClientDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    const response = await businessApi.getClientDetails(clientId);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

interface UseClientActionsReturn {
  createClient: (params: CreateClientParams) => Promise<{ success: boolean; client?: any; error?: string }>;
  updateClient: (params: UpdateClientParams) => Promise<{ success: boolean; client?: any; error?: string }>;
  deleteClient: (clientId: string) => Promise<{ success: boolean; error?: string }>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function useClientActions(): UseClientActionsReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const createClient = useCallback(async (params: CreateClientParams) => {
    setIsCreating(true);
    const response = await businessApi.createClient(params);
    setIsCreating(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    if (response.data) {
      return { success: true, client: response.data.client };
    }
    return { success: false, error: 'Unknown error' };
  }, []);

  const updateClient = useCallback(async (params: UpdateClientParams) => {
    setIsUpdating(true);
    const response = await businessApi.updateClient(params);
    setIsUpdating(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    if (response.data) {
      return { success: true, client: response.data.client };
    }
    return { success: false, error: 'Unknown error' };
  }, []);

  const deleteClient = useCallback(async (clientId: string) => {
    setIsDeleting(true);
    const response = await businessApi.deleteClient(clientId);
    setIsDeleting(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    return { success: true };
  }, []);

  return { createClient, updateClient, deleteClient, isCreating, isUpdating, isDeleting };
}

interface UseClientImportReturn {
  validateImport: (columnMapping: Record<string, string>, rows: string[][]) => Promise<{ success: boolean; result?: ImportValidationResult; error?: string }>;
  startImport: (params: StartImportParams) => Promise<{ success: boolean; jobId?: string; error?: string }>;
  getImportStatus: (jobId: string) => Promise<{ success: boolean; status?: ImportJobStatus; error?: string }>;
  isValidating: boolean;
  isImporting: boolean;
}

export function useClientImport(): UseClientImportReturn {
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const validateImport = useCallback(async (columnMapping: Record<string, string>, rows: string[][]) => {
    setIsValidating(true);
    const response = await businessApi.validateClientImport(columnMapping, rows);
    setIsValidating(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    if (response.data) {
      return { success: true, result: response.data };
    }
    return { success: false, error: 'Unknown error' };
  }, []);

  const startImport = useCallback(async (params: StartImportParams) => {
    setIsImporting(true);
    const response = await businessApi.startClientImport(params);
    setIsImporting(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    if (response.data) {
      return { success: true, jobId: response.data.jobId };
    }
    return { success: false, error: 'Unknown error' };
  }, []);

  const getImportStatus = useCallback(async (jobId: string) => {
    const response = await businessApi.getImportStatus(jobId);
    if (response.error) {
      return { success: false, error: response.error };
    }
    if (response.data) {
      return { success: true, status: response.data };
    }
    return { success: false, error: 'Unknown error' };
  }, []);

  return { validateImport, startImport, getImportStatus, isValidating, isImporting };
}

export function useCampaigns(): UseApiState<{ campaigns: MarketingCampaign[] }> {
  const [data, setData] = useState<{ campaigns: MarketingCampaign[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await businessApi.getCampaigns();
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

export function useCampaignAssignment(campaignId?: string): UseApiState<CampaignAssignmentResponse> {
  const [data, setData] = useState<CampaignAssignmentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!campaignId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const response = await businessApi.getCampaignAssignment(campaignId);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, [campaignId]);

  useEffect(() => {
    if (!campaignId) {
      setData(null);
      setError(null);
    }
    fetchData();
  }, [fetchData, campaignId]);

  return { data, loading, error, refetch: fetchData };
}

interface UseCampaignActionsReturn {
  updateAssignment: (params: AssignClientsToCampaignParams) => Promise<{ success: boolean; error?: string }>;
  isUpdating: boolean;
}

export function useCampaignActions(): UseCampaignActionsReturn {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateAssignment = useCallback(async (params: AssignClientsToCampaignParams) => {
    setIsUpdating(true);
    const response = await businessApi.updateCampaignAssignment(params);
    setIsUpdating(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    return { success: true };
  }, []);

  return { updateAssignment, isUpdating };
}

// ============================================
// SERVICES MANAGEMENT HOOKS
// ============================================

export function useServicesManagement(category?: string, search?: string): UseApiState<ServicesManagementResponse> {
  const [data, setData] = useState<ServicesManagementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await servicesManagementApi.getServicesManagement(category, search);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, [category, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useServiceDetail(serviceId?: string): UseApiState<ServiceDetailResponse> {
  const [data, setData] = useState<ServiceDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!serviceId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const response = await servicesManagementApi.getServiceDetail(serviceId);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, [serviceId]);

  useEffect(() => {
    if (!serviceId) {
      setData(null);
      setError(null);
    }
    fetchData();
  }, [fetchData, serviceId]);

  return { data, loading, error, refetch: fetchData };
}

export function useServiceCategories(): UseApiState<{ categories: ServiceCategory[] }> {
  const [data, setData] = useState<{ categories: ServiceCategory[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await servicesManagementApi.getServiceCategories();
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

interface UseServiceActionsReturn {
  createService: (params: CreateServiceParams) => Promise<{ success: boolean; service?: any; error?: string }>;
  updateService: (params: UpdateServiceParams) => Promise<{ success: boolean; error?: string }>;
  toggleServiceStatus: (serviceId: string, isActive: boolean) => Promise<{ success: boolean; error?: string }>;
  deleteService: (serviceId: string) => Promise<{ success: boolean; error?: string }>;
  isSubmitting: boolean;
}

export function useServiceActions(): UseServiceActionsReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createService = useCallback(async (params: CreateServiceParams) => {
    setIsSubmitting(true);
    const response = await servicesManagementApi.createService(params);
    setIsSubmitting(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    return { success: true, service: response.data?.service };
  }, []);

  const updateService = useCallback(async (params: UpdateServiceParams) => {
    setIsSubmitting(true);
    const response = await servicesManagementApi.updateService(params);
    setIsSubmitting(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    return { success: true };
  }, []);

  const toggleServiceStatus = useCallback(async (serviceId: string, isActive: boolean) => {
    setIsSubmitting(true);
    const response = await servicesManagementApi.toggleServiceStatus(serviceId, isActive);
    setIsSubmitting(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    return { success: true };
  }, []);

  const deleteService = useCallback(async (serviceId: string) => {
    setIsSubmitting(true);
    const response = await servicesManagementApi.deleteService(serviceId);
    setIsSubmitting(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    return { success: true };
  }, []);

  return { createService, updateService, toggleServiceStatus, deleteService, isSubmitting };
}

// ============================================
// PACKAGES MANAGEMENT HOOKS
// ============================================

export function usePackages(status?: 'all' | 'active' | 'inactive', search?: string): UseApiState<PackagesListResponse> {
  const [data, setData] = useState<PackagesListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await packagesManagementApi.getPackages(status, search);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, [status, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function usePackageDetail(packageId?: string): UseApiState<PackageDetailResponse> {
  const [data, setData] = useState<PackageDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!packageId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const response = await packagesManagementApi.getPackageDetail(packageId);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, [packageId]);

  useEffect(() => {
    if (!packageId) {
      setData(null);
      setError(null);
    }
    fetchData();
  }, [fetchData, packageId]);

  return { data, loading, error, refetch: fetchData };
}

export function useAvailableServicesForPackage(): UseApiState<{ services: ServiceListItem[]; byCategory: Record<string, ServiceListItem[]> }> {
  const [data, setData] = useState<{ services: ServiceListItem[]; byCategory: Record<string, ServiceListItem[]> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await packagesManagementApi.getAvailableServicesForPackage();
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

interface UsePackageActionsReturn {
  createPackage: (params: CreatePackageParams) => Promise<{ success: boolean; pkg?: any; error?: string }>;
  updatePackage: (params: UpdatePackageParams) => Promise<{ success: boolean; error?: string }>;
  togglePackageStatus: (packageId: string, isActive: boolean) => Promise<{ success: boolean; error?: string }>;
  deletePackage: (packageId: string) => Promise<{ success: boolean; error?: string }>;
  duplicatePackage: (packageId: string) => Promise<{ success: boolean; pkg?: any; error?: string }>;
  isSubmitting: boolean;
}

export function usePackageActions(): UsePackageActionsReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createPackage = useCallback(async (params: CreatePackageParams) => {
    setIsSubmitting(true);
    const response = await packagesManagementApi.createPackage(params);
    setIsSubmitting(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    return { success: true, pkg: response.data?.package };
  }, []);

  const updatePackage = useCallback(async (params: UpdatePackageParams) => {
    setIsSubmitting(true);
    const response = await packagesManagementApi.updatePackage(params);
    setIsSubmitting(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    return { success: true };
  }, []);

  const togglePackageStatus = useCallback(async (packageId: string, isActive: boolean) => {
    setIsSubmitting(true);
    const response = await packagesManagementApi.togglePackageStatus(packageId, isActive);
    setIsSubmitting(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    return { success: true };
  }, []);

  const deletePackage = useCallback(async (packageId: string) => {
    setIsSubmitting(true);
    const response = await packagesManagementApi.deletePackage(packageId);
    setIsSubmitting(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    return { success: true };
  }, []);

  const duplicatePackage = useCallback(async (packageId: string) => {
    setIsSubmitting(true);
    const response = await packagesManagementApi.duplicatePackage(packageId);
    setIsSubmitting(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    return { success: true, pkg: response.data?.package };
  }, []);

  return { createPackage, updatePackage, togglePackageStatus, deletePackage, duplicatePackage, isSubmitting };
}

// ============================================
// MEMBERSHIPS MANAGEMENT HOOKS
// ============================================

import {
  membershipsManagementApi,
  MembershipsListResponse,
  MembershipPlan,
  MembershipAnalytics,
  MembersListResponse,
  MembershipMember,
  CreateMembershipPlanParams,
  UpdateMembershipPlanParams,
} from '../services/businessApi';

export function useMembershipsManagement(
  status?: 'all' | 'active' | 'inactive',
  search?: string
): UseApiState<MembershipsListResponse> {
  const [data, setData] = useState<MembershipsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await membershipsManagementApi.getMembershipPlans(status, search);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, [status, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useMembershipPlanDetail(planId?: string): UseApiState<{ plan: MembershipPlan }> {
  const [data, setData] = useState<{ plan: MembershipPlan } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!planId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const response = await membershipsManagementApi.getMembershipPlanDetail(planId);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, [planId]);

  useEffect(() => {
    if (!planId) {
      setData(null);
      setError(null);
    }
    fetchData();
  }, [fetchData, planId]);

  return { data, loading, error, refetch: fetchData };
}

export function useMembershipAnalytics(): UseApiState<MembershipAnalytics> {
  const [data, setData] = useState<MembershipAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await membershipsManagementApi.getMembershipAnalytics();
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

export function useMembersList(
  status?: string,
  planId?: string,
  search?: string
): UseApiState<MembersListResponse> {
  const [data, setData] = useState<MembersListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await membershipsManagementApi.getMembers(status, planId, search);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, [status, planId, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useAvailableServicesForMembership(): UseApiState<{ services: ServiceListItem[]; byCategory: Record<string, ServiceListItem[]> }> {
  const [data, setData] = useState<{ services: ServiceListItem[]; byCategory: Record<string, ServiceListItem[]> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await membershipsManagementApi.getAvailableServicesForMembership();
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

interface UseMembershipPlanActionsReturn {
  createPlan: (params: CreateMembershipPlanParams) => Promise<{ success: boolean; plan?: MembershipPlan; error?: string }>;
  updatePlan: (params: UpdateMembershipPlanParams) => Promise<{ success: boolean; error?: string }>;
  togglePlanStatus: (planId: string, isActive: boolean) => Promise<{ success: boolean; error?: string }>;
  deletePlan: (planId: string) => Promise<{ success: boolean; error?: string }>;
  duplicatePlan: (planId: string) => Promise<{ success: boolean; plan?: MembershipPlan; error?: string }>;
  isSubmitting: boolean;
}

export function useMembershipPlanActions(): UseMembershipPlanActionsReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createPlan = useCallback(async (params: CreateMembershipPlanParams) => {
    setIsSubmitting(true);
    const response = await membershipsManagementApi.createMembershipPlan(params);
    setIsSubmitting(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    return { success: true, plan: response.data?.plan };
  }, []);

  const updatePlan = useCallback(async (params: UpdateMembershipPlanParams) => {
    setIsSubmitting(true);
    const response = await membershipsManagementApi.updateMembershipPlan(params);
    setIsSubmitting(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    return { success: true };
  }, []);

  const togglePlanStatus = useCallback(async (planId: string, isActive: boolean) => {
    setIsSubmitting(true);
    const response = await membershipsManagementApi.togglePlanStatus(planId, isActive);
    setIsSubmitting(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    return { success: true };
  }, []);

  const deletePlan = useCallback(async (planId: string) => {
    setIsSubmitting(true);
    const response = await membershipsManagementApi.deleteMembershipPlan(planId);
    setIsSubmitting(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    return { success: true };
  }, []);

  const duplicatePlan = useCallback(async (planId: string) => {
    setIsSubmitting(true);
    const response = await membershipsManagementApi.duplicateMembershipPlan(planId);
    setIsSubmitting(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    return { success: true, plan: response.data?.plan };
  }, []);

  return { createPlan, updatePlan, togglePlanStatus, deletePlan, duplicatePlan, isSubmitting };
}

interface UseMemberActionsReturn {
  pauseMembership: (membershipId: string) => Promise<{ success: boolean; error?: string }>;
  resumeMembership: (membershipId: string) => Promise<{ success: boolean; error?: string }>;
  cancelMembership: (membershipId: string) => Promise<{ success: boolean; error?: string }>;
  sendRenewalReminder: (membershipId: string) => Promise<{ success: boolean; error?: string }>;
  isSubmitting: boolean;
}

export function useMemberActions(): UseMemberActionsReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pauseMembership = useCallback(async (membershipId: string) => {
    setIsSubmitting(true);
    const response = await membershipsManagementApi.pauseMembership(membershipId);
    setIsSubmitting(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    return { success: true };
  }, []);

  const resumeMembership = useCallback(async (membershipId: string) => {
    setIsSubmitting(true);
    const response = await membershipsManagementApi.resumeMembership(membershipId);
    setIsSubmitting(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    return { success: true };
  }, []);

  const cancelMembership = useCallback(async (membershipId: string) => {
    setIsSubmitting(true);
    const response = await membershipsManagementApi.cancelMembership(membershipId);
    setIsSubmitting(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    return { success: true };
  }, []);

  const sendRenewalReminder = useCallback(async (membershipId: string) => {
    setIsSubmitting(true);
    const response = await membershipsManagementApi.sendRenewalReminder(membershipId);
    setIsSubmitting(false);
    if (response.error) {
      return { success: false, error: response.error };
    }
    return { success: true };
  }, []);

  return { pauseMembership, resumeMembership, cancelMembership, sendRenewalReminder, isSubmitting };
}

// ===== INVENTORY MANAGEMENT HOOKS =====

interface UseInventoryStatsReturn {
  stats: InventoryStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useInventoryStats(): UseInventoryStatsReturn {
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await inventoryManagementApi.getInventoryStats();
    if (response.error) {
      setError(response.error);
    } else if (response.data?.stats) {
      setStats(response.data.stats);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { stats, loading, error, refetch: fetchData };
}

interface UseInventoryProductsParams {
  search?: string;
  categoryId?: string;
  vendorId?: string;
  stockStatus?: 'out' | 'low' | 'good' | 'overstock';
  isActive?: number;
  isRetail?: string;
}

interface UseInventoryProductsReturn {
  products: InventoryProduct[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useInventoryProducts(params?: UseInventoryProductsParams): UseInventoryProductsReturn {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await inventoryManagementApi.getProducts(params);
    if (response.error) {
      setError(response.error);
    } else if (response.data?.products) {
      setProducts(response.data.products);
    }
    setLoading(false);
  }, [params?.search, params?.categoryId, params?.vendorId, params?.stockStatus, params?.isActive, params?.isRetail]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { products, loading, error, refetch: fetchData };
}

interface UseInventoryProductReturn {
  product: InventoryProduct | null;
  movements: StockMovement[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useInventoryProduct(productId: string | undefined): UseInventoryProductReturn {
  const [product, setProduct] = useState<InventoryProduct | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!productId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const response = await inventoryManagementApi.getProduct(productId);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setProduct(response.data.product);
      setMovements(response.data.movements || []);
    }
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { product, movements, loading, error, refetch: fetchData };
}

interface UseProductCategoriesReturn {
  categories: ProductCategory[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProductCategories(): UseProductCategoriesReturn {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await inventoryManagementApi.getCategories();
    if (response.error) {
      setError(response.error);
    } else if (response.data?.categories) {
      setCategories(response.data.categories);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { categories, loading, error, refetch: fetchData };
}

interface UseVendorsReturn {
  vendors: Vendor[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVendors(search?: string, status?: string): UseVendorsReturn {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await inventoryManagementApi.getVendors({ search, status });
    if (response.error) {
      setError(response.error);
    } else if (response.data?.vendors) {
      setVendors(response.data.vendors);
    }
    setLoading(false);
  }, [search, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { vendors, loading, error, refetch: fetchData };
}

interface UseVendorDetailReturn {
  vendor: Vendor | null;
  products: InventoryProduct[];
  recentOrders: PurchaseOrder[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVendorDetail(vendorId: string | undefined): UseVendorDetailReturn {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!vendorId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const response = await inventoryManagementApi.getVendor(vendorId);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setVendor(response.data.vendor);
      setProducts(response.data.products || []);
      setRecentOrders(response.data.recentOrders || []);
    }
    setLoading(false);
  }, [vendorId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { vendor, products, recentOrders, loading, error, refetch: fetchData };
}

interface UsePurchaseOrdersReturn {
  orders: PurchaseOrder[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePurchaseOrders(status?: string, vendorId?: string): UsePurchaseOrdersReturn {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await inventoryManagementApi.getPurchaseOrders({ status, vendorId });
    if (response.error) {
      setError(response.error);
    } else if (response.data?.orders) {
      setOrders(response.data.orders);
    }
    setLoading(false);
  }, [status, vendorId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { orders, loading, error, refetch: fetchData };
}

interface UsePurchaseOrderDetailReturn {
  order: PurchaseOrder | null;
  items: PurchaseOrderItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePurchaseOrderDetail(orderId: string | undefined): UsePurchaseOrderDetailReturn {
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const response = await inventoryManagementApi.getPurchaseOrder(orderId);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setOrder(response.data.order);
      setItems(response.data.items || []);
    }
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { order, items, loading, error, refetch: fetchData };
}

interface UseStockMovementsReturn {
  movements: StockMovement[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useStockMovements(productId?: string, type?: string): UseStockMovementsReturn {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await inventoryManagementApi.getStockMovements({ productId, type });
    if (response.error) {
      setError(response.error);
    } else if (response.data?.movements) {
      setMovements(response.data.movements);
    }
    setLoading(false);
  }, [productId, type]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { movements, loading, error, refetch: fetchData };
}

interface UseReorderSuggestionsReturn {
  suggestions: ReorderSuggestion[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useReorderSuggestions(): UseReorderSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<ReorderSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await inventoryManagementApi.getReorderSuggestions();
    if (response.error) {
      setError(response.error);
    } else if (response.data?.suggestions) {
      setSuggestions(response.data.suggestions);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { suggestions, loading, error, refetch: fetchData };
}

// Inventory Analytics Hook
interface UseInventoryAnalyticsReturn {
  analytics: InventoryAnalytics | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useInventoryAnalytics(period: 'week' | 'month' = 'week'): UseInventoryAnalyticsReturn {
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await inventoryManagementApi.getInventoryAnalytics(period);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setAnalytics(response.data);
    }
    setLoading(false);
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { analytics, loading, error, refetch: fetchData };
}

interface UseInventoryActionsReturn {
  createProduct: (params: CreateProductParams) => Promise<{ success: boolean; product?: InventoryProduct; error?: string }>;
  updateProduct: (productId: string, params: Partial<CreateProductParams>) => Promise<{ success: boolean; product?: InventoryProduct; error?: string }>;
  deleteProduct: (productId: string) => Promise<{ success: boolean; error?: string }>;
  adjustStock: (params: StockAdjustmentParams) => Promise<{ success: boolean; error?: string }>;
  createCategory: (params: { name: string; description?: string }) => Promise<{ success: boolean; category?: ProductCategory; error?: string }>;
  updateCategory: (categoryId: string, params: { name?: string; description?: string; isActive?: number }) => Promise<{ success: boolean; error?: string }>;
  deleteCategory: (categoryId: string) => Promise<{ success: boolean; error?: string }>;
  createVendor: (params: any) => Promise<{ success: boolean; vendor?: Vendor; error?: string }>;
  updateVendor: (vendorId: string, params: any) => Promise<{ success: boolean; error?: string }>;
  createPurchaseOrder: (params: CreatePurchaseOrderParams) => Promise<{ success: boolean; order?: PurchaseOrder; error?: string }>;
  updatePurchaseOrderStatus: (orderId: string, status: PurchaseOrder['status']) => Promise<{ success: boolean; error?: string }>;
  receiveItems: (orderId: string, params: ReceiveItemsParams) => Promise<{ success: boolean; error?: string }>;
  submitStocktake: (params: StocktakeParams) => Promise<{ success: boolean; adjustments?: any[]; error?: string }>;
  isSubmitting: boolean;
}

export function useInventoryActions(): UseInventoryActionsReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createProduct = useCallback(async (params: CreateProductParams) => {
    setIsSubmitting(true);
    const response = await inventoryManagementApi.createProduct(params);
    setIsSubmitting(false);
    if (response.error) return { success: false, error: response.error };
    return { success: true, product: response.data?.product };
  }, []);

  const updateProduct = useCallback(async (productId: string, params: Partial<CreateProductParams>) => {
    setIsSubmitting(true);
    const response = await inventoryManagementApi.updateProduct(productId, params);
    setIsSubmitting(false);
    if (response.error) return { success: false, error: response.error };
    return { success: true, product: response.data?.product };
  }, []);

  const deleteProduct = useCallback(async (productId: string) => {
    setIsSubmitting(true);
    const response = await inventoryManagementApi.deleteProduct(productId);
    setIsSubmitting(false);
    if (response.error) return { success: false, error: response.error };
    return { success: true };
  }, []);

  const adjustStock = useCallback(async (params: StockAdjustmentParams) => {
    setIsSubmitting(true);
    const response = await inventoryManagementApi.adjustStock(params);
    setIsSubmitting(false);
    if (response.error) return { success: false, error: response.error };
    return { success: true };
  }, []);

  const createCategory = useCallback(async (params: { name: string; description?: string }) => {
    setIsSubmitting(true);
    const response = await inventoryManagementApi.createCategory(params);
    setIsSubmitting(false);
    if (response.error) return { success: false, error: response.error };
    return { success: true, category: response.data?.category };
  }, []);

  const updateCategory = useCallback(async (categoryId: string, params: { name?: string; description?: string; isActive?: number }) => {
    setIsSubmitting(true);
    const response = await inventoryManagementApi.updateCategory(categoryId, params);
    setIsSubmitting(false);
    if (response.error) return { success: false, error: response.error };
    return { success: true };
  }, []);

  const deleteCategory = useCallback(async (categoryId: string) => {
    setIsSubmitting(true);
    const response = await inventoryManagementApi.deleteCategory(categoryId);
    setIsSubmitting(false);
    if (response.error) return { success: false, error: response.error };
    return { success: true };
  }, []);

  const createVendor = useCallback(async (params: any) => {
    setIsSubmitting(true);
    const response = await inventoryManagementApi.createVendor(params);
    setIsSubmitting(false);
    if (response.error) return { success: false, error: response.error };
    return { success: true, vendor: response.data?.vendor };
  }, []);

  const updateVendor = useCallback(async (vendorId: string, params: any) => {
    setIsSubmitting(true);
    const response = await inventoryManagementApi.updateVendor(vendorId, params);
    setIsSubmitting(false);
    if (response.error) return { success: false, error: response.error };
    return { success: true };
  }, []);

  const createPurchaseOrder = useCallback(async (params: CreatePurchaseOrderParams) => {
    setIsSubmitting(true);
    const response = await inventoryManagementApi.createPurchaseOrder(params);
    setIsSubmitting(false);
    if (response.error) return { success: false, error: response.error };
    return { success: true, order: response.data?.order };
  }, []);

  const updatePurchaseOrderStatus = useCallback(async (orderId: string, status: PurchaseOrder['status']) => {
    setIsSubmitting(true);
    const response = await inventoryManagementApi.updatePurchaseOrderStatus(orderId, status);
    setIsSubmitting(false);
    if (response.error) return { success: false, error: response.error };
    return { success: true };
  }, []);

  const receiveItems = useCallback(async (orderId: string, params: ReceiveItemsParams) => {
    setIsSubmitting(true);
    const response = await inventoryManagementApi.receiveItems(orderId, params);
    setIsSubmitting(false);
    if (response.error) return { success: false, error: response.error };
    return { success: true };
  }, []);

  const submitStocktake = useCallback(async (params: StocktakeParams) => {
    setIsSubmitting(true);
    const response = await inventoryManagementApi.submitStocktake(params);
    setIsSubmitting(false);
    if (response.error) return { success: false, error: response.error };
    return { success: true, adjustments: response.data?.adjustments };
  }, []);

  return {
    createProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    createCategory,
    updateCategory,
    deleteCategory,
    createVendor,
    updateVendor,
    createPurchaseOrder,
    updatePurchaseOrderStatus,
    receiveItems,
    submitStocktake,
    isSubmitting,
  };
}

// ============================================
// SETTINGS HOOKS
// ============================================

export function useSettings() {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await settingsApi.getSettings();
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setSettings(response.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    profile: settings?.profile || null,
    salon: settings?.salon || null,
    notificationPreferences: settings?.notificationPreferences || null,
    appPreferences: settings?.appPreferences || null,
    isOwner: settings?.isOwner || false,
    staffRole: settings?.staffRole || 'staff',
    loading,
    error,
    refetch: fetchSettings,
  };
}

export function useSettingsActions() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateProfile = useCallback(async (params: Partial<UserProfile>) => {
    setIsSubmitting(true);
    const response = await settingsApi.updateProfile(params);
    setIsSubmitting(false);
    if (response.error) return { success: false, error: response.error };
    return { success: true };
  }, []);

  const updateSalon = useCallback(async (params: Partial<SalonSettings>) => {
    setIsSubmitting(true);
    const response = await settingsApi.updateSalon(params);
    setIsSubmitting(false);
    if (response.error) return { success: false, error: response.error };
    return { success: true };
  }, []);

  const updateBusinessHours = useCallback(async (params: { businessHours: BusinessHours; breakTime?: { start: string; end: string } }) => {
    setIsSubmitting(true);
    const response = await settingsApi.updateBusinessHours(params);
    setIsSubmitting(false);
    if (response.error) return { success: false, error: response.error };
    return { success: true };
  }, []);

  const updateBookingSettings = useCallback(async (params: { instantBooking?: boolean; offerDeals?: boolean; acceptGroup?: boolean }) => {
    setIsSubmitting(true);
    const response = await settingsApi.updateBookingSettings(params);
    setIsSubmitting(false);
    if (response.error) return { success: false, error: response.error };
    return { success: true };
  }, []);

  return {
    updateProfile,
    updateSalon,
    updateBusinessHours,
    updateBookingSettings,
    isSubmitting,
  };
}

// ============================================
// PAYROLL HOOKS (Zylu-inspired features)
// ============================================

export function usePayrollStats(): UseApiState<PayrollStats> {
  const [data, setData] = useState<PayrollStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await payrollApi.getStats();
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

export function useStaffWithSalary(): UseApiState<StaffWithSalary[]> {
  const [data, setData] = useState<StaffWithSalary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await payrollApi.getStaffWithSalary();
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

export function usePayrollCycles(year?: number): UseApiState<PayrollCycle[]> {
  const [data, setData] = useState<PayrollCycle[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await payrollApi.getPayrollCycles(year);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setData(response.data);
    }
    setLoading(false);
  }, [year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function usePayrollCycleDetails(cycleId: string) {
  const [cycle, setCycle] = useState<PayrollCycle | null>(null);
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!cycleId) return;
    setLoading(true);
    setError(null);
    const response = await payrollApi.getPayrollCycleDetails(cycleId);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setCycle(response.data.cycle);
      setEntries(response.data.entries);
    }
    setLoading(false);
  }, [cycleId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { cycle, entries, loading, error, refetch: fetchData };
}

export function useStaffPayrollDetails(staffId: string, year?: number, month?: number) {
  const [staff, setStaff] = useState<StaffWithSalary | null>(null);
  const [currentEntry, setCurrentEntry] = useState<PayrollEntry | null>(null);
  const [history, setHistory] = useState<PayrollEntry[]>([]);
  const [attendance, setAttendance] = useState<{ workingDays: number; presentDays: number; leaveDays: number; absentDays: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!staffId) return;
    setLoading(true);
    setError(null);
    const response = await payrollApi.getStaffPayrollDetails(staffId, year, month);
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setStaff(response.data.staff);
      setCurrentEntry(response.data.currentEntry);
      setHistory(response.data.history);
      setAttendance(response.data.attendance);
    }
    setLoading(false);
  }, [staffId, year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { staff, currentEntry, history, attendance, loading, error, refetch: fetchData };
}

export function useCommissionStructures(): UseApiState<CommissionStructure[]> {
  const [data, setData] = useState<CommissionStructure[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await payrollApi.getCommissionStructures();
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

export function usePayrollActions() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createPayrollCycle = useCallback(async (params: CreatePayrollCycleParams) => {
    setIsSubmitting(true);
    const response = await payrollApi.createPayrollCycle(params);
    setIsSubmitting(false);
    if (response.error) return { success: false, error: response.error };
    return { success: true, id: response.data?.id };
  }, []);

  const processPayroll = useCallback(async (params: ProcessPayrollParams) => {
    setIsSubmitting(true);
    const response = await payrollApi.processPayroll(params);
    setIsSubmitting(false);
    if (response.error) return { success: false, error: response.error };
    return { success: true };
  }, []);

  const markEntryPaid = useCallback(async (entryId: string) => {
    setIsSubmitting(true);
    const response = await payrollApi.markEntryPaid(entryId);
    setIsSubmitting(false);
    if (response.error) return { success: false, error: response.error };
    return { success: true };
  }, []);

  const createCommissionStructure = useCallback(async (params: Omit<CommissionStructure, 'id'>) => {
    setIsSubmitting(true);
    const response = await payrollApi.createCommissionStructure(params);
    setIsSubmitting(false);
    if (response.error) return { success: false, error: response.error };
    return { success: true, id: response.data?.id };
  }, []);

  const updateCommissionStructure = useCallback(async (id: string, params: Partial<CommissionStructure>) => {
    setIsSubmitting(true);
    const response = await payrollApi.updateCommissionStructure(id, params);
    setIsSubmitting(false);
    if (response.error) return { success: false, error: response.error };
    return { success: true };
  }, []);

  const exportPayrollReport = useCallback(async (cycleId: string, format: 'pdf' | 'excel') => {
    setIsSubmitting(true);
    const response = await payrollApi.exportPayrollReport(cycleId, format);
    setIsSubmitting(false);
    if (response.error) return { success: false, error: response.error };
    return { success: true, downloadUrl: response.data?.downloadUrl };
  }, []);

  return {
    createPayrollCycle,
    processPayroll,
    markEntryPaid,
    createCommissionStructure,
    updateCommissionStructure,
    exportPayrollReport,
    isSubmitting,
  };
}
