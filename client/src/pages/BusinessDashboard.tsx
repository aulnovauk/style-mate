import { useState, useEffect, useMemo } from "react";
import { BusinessIconSidebar, type SidebarSection } from "@/components/business-dashboard/BusinessIconSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useSalonSetupStatus } from "@/hooks/useSalonSetupStatus";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { 
  Building, 
  Scissors, 
  Users, 
  Settings, 
  Camera,
  CheckCircle,
  ArrowRight,
  BarChart,
  Calendar,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquare,
  Package,
  Home,
  ChevronDown,
  Menu,
  Cog,
  MapPin,
  Sparkles,
  Bell,
  Star,
  Gift,
  CalendarDays,
  Receipt,
  Tag,
  SmilePlus,
  ShoppingBag,
  UserSquare,
  Ticket,
  BarChart3,
  Megaphone,
  Zap,
  Crown,
  UserCircle,
  LogOut,
  ChevronRight,
  Plus,
  Check,
  Trash2,
  FileEdit,
  History,
  UserCog,
  Shield,
  Send,
  Upload,
  Wallet,
  Instagram,
  AlertTriangle,
  Ban,
  Clock,
  MessageCircle,
  Brain,
  Banknote,
  CalendarOff,
  UserPlus,
  UserMinus,
  FileSpreadsheet,
  PanelLeft,
  PanelLeftClose
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSalonPermissions } from "@/hooks/useSalonPermissions";
import { Link, useLocation } from "wouter";
import { useFeatureAccess } from "@/hooks/useSubscription";
import type { Salon } from "@/../../shared/schema";
import ShopAdminManagement from "@/components/business-dashboard/ShopAdminManagement";
import AdvancedAnalyticsDashboard from "@/components/AdvancedAnalyticsDashboard";
import FinancialReportingDashboard from "@/components/FinancialReportingDashboard";
import CustomerCommunicationDashboard from "@/components/CustomerCommunicationDashboard";
import InventoryManagementDashboard from "@/components/InventoryManagementDashboard";
import BeautyProductCatalog from "@/pages/BeautyProductCatalog";
import CalendarManagement from "@/pages/CalendarManagement";
import PackageManagement from "@/components/business-dashboard/PackageManagement";
import ClientProfilesManagement from "@/components/business-dashboard/ClientProfilesManagement";
import BusinessOffers from "@/pages/BusinessOffers";
import { Map } from "@/components/ui/map";
import EventDashboard from "@/pages/EventDashboard";
import CreateEvent from "@/pages/CreateEvent";
import DraftEvents from "@/pages/DraftEvents";
import PastEvents from "@/pages/PastEvents";
import CustomerImportDashboard from "@/components/business-dashboard/CustomerImportDashboard";
import CampaignDashboard from "@/components/business-dashboard/CampaignDashboard";
import CommissionManagement from "@/components/business-dashboard/CommissionManagement";
import PayrollOverview from "@/components/business-dashboard/PayrollOverview";
import SalaryManagement from "@/components/business-dashboard/SalaryManagement";
import LeaveManagement from "@/components/business-dashboard/LeaveManagement";
import PayrollRuns from "@/components/business-dashboard/PayrollRuns";
import StaffOnboarding from "@/components/business-dashboard/StaffOnboarding";
import StaffExit from "@/components/business-dashboard/StaffExit";
import { ChatInbox } from "@/components/chat/ChatInbox";
import { ChatNotificationBadge } from "@/components/chat/ChatNotificationBadge";
import { MLAnalyticsDashboard } from "@/components/business-dashboard/ml-analytics";
import MembershipManagement from "@/components/business-dashboard/MembershipManagement";

// Type definitions for completion data
interface CompletionData {
  profile: { isComplete: boolean; missingFields?: string[] };
  services: { isComplete: boolean; count: number };
  staff: { isComplete: boolean; count: number };
  settings: { isComplete: boolean; missingFields?: string[] };
  media: { isComplete: boolean; count: number };
  overallProgress: number;
  nextStep?: string;
}

// Type definitions for analytics data
interface TrendData {
  percentage: string;
  direction: 'up' | 'down' | 'neutral';
}

interface AnalyticsOverview {
  todayBookings: number;
  todayRevenuePaisa: number;
  totalRevenuePaisa: number;
  activeStaffCount: number;
  totalBookings: number;
  averageBookingValuePaisa: number;
  bookingsTrend: TrendData;
  revenueTrend: TrendData;
  averageValueTrend: TrendData;
  cancellationRate?: string;
  cancelledBookings?: number;
  completedBookings?: number;
  confirmedBookings?: number;
  arrivedBookings?: number;
  totalCustomers?: number;
  totalJobCards?: number;
  walkInCount?: number;
  walkInRevenuePaisa?: number;
  todayTotalCustomers?: number;
  todayJobCards?: number;
  todayWalkIns?: number;
  completedJobCards?: number;
  paidJobCards?: number;
  realizedRevenuePaisa?: number;
  expectedRevenuePaisa?: number;
  pendingRevenuePaisa?: number;
  todayRealizedRevenuePaisa?: number;
  todayExpectedRevenuePaisa?: number;
  todayPendingRevenuePaisa?: number;
  todayPaid?: number;
  completionRate?: string;
}

interface PopularService {
  id: string;
  name: string;
  bookingCount: number;
  revenuePaisa: number;
}

interface StaffPerformance {
  id: string;
  name: string;
  bookingCount: number;
  revenuePaisa: number;
}

interface BookingTrend {
  date: string;
  bookings: number;
  revenue: number;
}

interface AnalyticsData {
  overview: AnalyticsOverview;
  popularServices?: PopularService[];
  staffPerformance?: StaffPerformance[];
  bookingTrends?: BookingTrend[];
}

// Navigation item interface for consistent typing
interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hasAccess: boolean;
  isComplete?: boolean;
  isSetup?: boolean;
  isOptional?: boolean;
  progress?: number;
  unreadCount?: number;
}

interface NavigationSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavigationItem[];
  requiresBusinessOwner?: boolean;
  requiresAdmin?: boolean;
}

// Service type for query results
interface ServiceData {
  id: string;
  name: string;
  [key: string]: unknown;
}

// Staff type for query results
interface StaffData {
  id: string;
  name: string;
  [key: string]: unknown;
}

// Import step components - Use the same components as BusinessSetup
import BusinessInfoStep from "@/components/business-setup/BusinessInfoStep";
import LocationContactStep from "@/components/business-setup/LocationContactStep";
import { PremiumServicesStep } from "@/components/business-setup/PremiumServicesStep";
import StaffStep from "@/components/business-setup/StaffStep";
import ResourcesStep from "@/components/business-setup/ResourcesStep";
import BookingSettingsStep from "@/components/business-setup/BookingSettingsStep";
import PaymentSetupStep from "@/components/business-setup/PaymentSetupStep";
import MediaStep from "@/components/business-setup/MediaStep";
import ReviewPublishStep from "@/components/business-setup/ReviewPublishStep";

export default function BusinessDashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedSections, setExpandedSections] = useState<string[]>(["overview", "business", "operations", "financials"]);
  const [salonId, setSalonId] = useState<string | null>(() => {
    // Try to get salon ID from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedSalonId');
    }
    return null;
  });
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [salonToDelete, setSalonToDelete] = useState<Salon | null>(null);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState<string | null>(null);
  const [mobileCompactMode, setMobileCompactMode] = useState(false);
  const isMobile = useIsMobile();

  // Icon sidebar sections for Fresha-style navigation - must be before early returns
  const iconSidebarSections: SidebarSection[] = useMemo(() => [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      singleItem: true,
      items: [{ id: "overview", label: "Dashboard" }],
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: CalendarDays,
      singleItem: true,
      items: [{ id: "calendar", label: "Booking Calendar" }],
    },
    {
      id: "services",
      label: "Services",
      icon: Tag,
      items: [
        { id: "services", label: "Services & Pricing", icon: Scissors },
        { id: "packages", label: "Packages & Combos", icon: Gift },
        { id: "memberships", label: "Membership Plans", icon: Crown },
      ],
    },
    {
      id: "clients",
      label: "Clients",
      icon: SmilePlus,
      items: [
        { id: "client-profiles", label: "Client Profiles", icon: UserCog },
        { id: "customer-import", label: "Import Customers", icon: Upload },
      ],
    },
    {
      id: "shop",
      label: "Shop",
      icon: ShoppingBag,
      items: [
        { id: "beauty-catalog", label: "Product Catalog", icon: Sparkles },
        { id: "inventory", label: "Inventory", icon: Package },
      ],
    },
    {
      id: "business-setup",
      label: "Business Setup",
      icon: Building,
      items: [
        { id: "business-info", label: "Business Info", icon: Building },
        { id: "location-contact", label: "Location & Contact", icon: MapPin },
        { id: "services", label: "Services & Pricing", icon: Scissors },
        { id: "staff", label: "Staff Management", icon: Users },
        { id: "resources", label: "Resources & Equipment", icon: Settings, isOptional: true },
        { id: "booking-settings", label: "Booking Settings", icon: Cog },
        { id: "payment-setup", label: "Payment Setup", icon: CreditCard, isOptional: true },
        { id: "media", label: "Media Gallery", icon: Camera },
        { id: "publish", label: "Publish Business", icon: CheckCircle },
      ],
    },
    {
      id: "payroll",
      label: "Payroll",
      icon: Banknote,
      items: [
        { id: "payroll-overview", label: "Payroll Overview", icon: Wallet },
        { id: "salary-management", label: "Salary Management", icon: Banknote },
        { id: "leave-management", label: "Leave Management", icon: CalendarOff },
        { id: "payroll-runs", label: "Payroll Runs", icon: FileSpreadsheet },
        { id: "staff-onboarding", label: "Staff Onboarding", icon: UserPlus },
        { id: "staff-exit", label: "Exit & Settlement", icon: UserMinus },
        { id: "commissions", label: "Commission Summary", icon: CreditCard },
      ],
    },
    {
      id: "events",
      label: "Events",
      icon: Ticket,
      items: [
        { id: "events-dashboard", label: "Event Dashboard", icon: BarChart },
        { id: "create-event", label: "Create Event", icon: Plus },
        { id: "draft-events", label: "Draft Events", icon: FileEdit },
        { id: "past-events", label: "Past Events", icon: History },
      ],
    },
    {
      id: "reports",
      label: "Reports",
      icon: BarChart3,
      items: [
        { id: "analytics", label: "Analytics", icon: TrendingUp },
        { id: "ml-analytics", label: "ML Predictions", icon: Brain },
        { id: "financials", label: "Financial Reports", icon: CreditCard },
      ],
    },
    {
      id: "marketing",
      label: "Marketing",
      icon: Megaphone,
      items: [
        { id: "offers", label: "Offers & Promotions", icon: Gift },
        { id: "campaigns", label: "Campaigns", icon: Send },
        { id: "communications", label: "Customer Comms", icon: MessageSquare },
        { id: "chat-inbox", label: "Chat Inbox", icon: MessageCircle, badge: chatUnreadCount > 0 ? chatUnreadCount : undefined },
      ],
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      items: [
        { id: "shop-admins", label: "Shop Admins", icon: Shield },
        { id: "notifications-settings", label: "Notifications", icon: Bell },
        { id: "security-settings", label: "Security", icon: Shield },
        { id: "subscription-settings", label: "Subscription", icon: Crown },
        { id: "integrations-settings", label: "Integrations", icon: Cog },
        { id: "account-settings", label: "Account", icon: UserCircle },
      ],
    },
  ], [chatUnreadCount]);
  
  // Subscription feature access
  const featureAccess = useFeatureAccess(salonId);

  // Fetch user's permissions for the selected salon
  const {
    isBusinessOwner,
    isAdmin,
    canViewBookings,
    canEditBookings,
    canViewServices,
    canEditServices,
    canViewStaff,
    canEditStaff,
    canViewReports,
    canViewSettings,
    canEditSettings,
    canViewCustomers,
    canViewInventory,
    canViewFinancials,
    canViewMarketing,
    role: userRole,
  } = useSalonPermissions(salonId);

  // Fetch user's salons
  const { data: salons, isLoading: salonsLoading } = useQuery({
    queryKey: ['/api/my/salons'],
    enabled: isAuthenticated,
    staleTime: 60000
  });

  // Create new salon mutation
  const createSalonMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/salons', {
        name: 'New Salon',
        description: 'My new salon location',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        email: user?.email || '',
        category: 'hair_salon',
        priceRange: '$$'
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/my/salons'] });
      
      // Store the new salon ID and redirect to setup
      const newSalonId = data.salon?.id || data.id;
      if (newSalonId) {
        localStorage.setItem('selectedSalonId', newSalonId);
        toast({
          title: "New Salon Created",
          description: "Let's set up your new salon location",
        });
        // Small delay to ensure state is updated
        setTimeout(() => {
          setLocation('/business/setup');
        }, 100);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create new salon. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete salon mutation
  const deleteSalonMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/salons/${id}`);
    },
    onSuccess: (data, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/my/salons'] });
      
      // If we deleted the currently selected salon, switch to another one
      if (deletedId === salonId && Array.isArray(salons)) {
        const remainingSalons = salons.filter((s: Salon) => s.id !== deletedId);
        if (remainingSalons.length > 0) {
          handleSalonSwitch(remainingSalons[0].id);
        }
      }
      
      toast({
        title: "Salon Deleted",
        description: "The salon has been successfully deleted.",
      });
      
      setDeleteDialogOpen(false);
      setSalonToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete salon. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Set salon ID with localStorage persistence
  useEffect(() => {
    if (Array.isArray(salons) && salons.length > 0) {
      // Check if stored salon ID is valid (normalize to string for comparison)
      const storedId = localStorage.getItem('selectedSalonId');
      const isValidStoredId = storedId && salons.some(s => String(s.id) === String(storedId));
      
      if (!salonId) {
        // Use stored ID if valid, otherwise use first salon
        const idToUse = isValidStoredId ? storedId : String(salons[0].id);
        setSalonId(idToUse);
        localStorage.setItem('selectedSalonId', idToUse);
      } else if (!isValidStoredId && String(salonId) !== String(salons[0].id)) {
        // If current salon is not in the list, switch to first salon
        const firstSalonId = String(salons[0].id);
        setSalonId(firstSalonId);
        localStorage.setItem('selectedSalonId', firstSalonId);
      }
    }
  }, [salons, salonId]);

  // Fetch chat unread count for sidebar badge
  useEffect(() => {
    if (!salonId) return;
    
    const fetchChatUnreadCount = async () => {
      try {
        const response = await fetch(`/api/chat/conversations?salonId=${salonId}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          const convs = data.conversations || [];
          const total = convs.reduce((sum: number, c: any) => sum + (c.staffUnreadCount || 0), 0);
          setChatUnreadCount(total);
        }
      } catch (error) {
        console.error('Failed to fetch chat unread count:', error);
      }
    };

    fetchChatUnreadCount();
    const interval = setInterval(fetchChatUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [salonId]);

  // Auto-expand section containing active tab when it changes
  useEffect(() => {
    const tabToSectionMap: Record<string, string> = {
      'overview': 'overview',
      'calendar': 'operations', 'client-profiles': 'operations', 'inventory': 'operations', 
      'beauty-catalog': 'operations', 'offers': 'operations',
      'events-dashboard': 'events', 'create-event': 'events', 'draft-events': 'events', 'past-events': 'events',
      'business-info': 'business', 'location-contact': 'business', 'services': 'business', 'packages': 'business',
      'memberships': 'business', 'staff': 'business', 'resources': 'business', 'booking-settings': 'business', 'payment-setup': 'business',
      'media': 'business', 'publish': 'business',
      'shop-admins': 'admin',
      'financials': 'financials',
      'payroll-overview': 'staff-payroll', 'salary-management': 'staff-payroll', 'leave-management': 'staff-payroll',
      'payroll-runs': 'staff-payroll', 'staff-onboarding': 'staff-payroll', 'staff-exit': 'staff-payroll', 'commissions': 'staff-payroll',
      'analytics': 'analytics', 'ml-analytics': 'analytics',
      'chat-inbox': 'communications', 'communications': 'communications', 'customer-import': 'communications', 'campaigns': 'communications'
    };
    const sectionId = tabToSectionMap[activeTab];
    if (sectionId && !expandedSections.includes(sectionId)) {
      setExpandedSections(prev => [...prev, sectionId]);
    }
  }, [activeTab, expandedSections]);

  // Handler for salon switching
  const handleSalonSwitch = (value: string) => {
    if (value === '__create_new__') {
      // Create a new salon via API
      createSalonMutation.mutate();
      return;
    }
    
    setSalonId(value);
    localStorage.setItem('selectedSalonId', value);
    toast({
      title: "Salon Switched",
      description: "You're now viewing a different salon location",
    });
  };

  // Use centralized completion service
  const { data: completionData } = useQuery<CompletionData>({
    queryKey: ['/api/salons', salonId, 'dashboard-completion'],
    enabled: !!salonId,
    staleTime: 30000
  });

  // Fetch setup status from new unified API
  const { data: setupStatus, isLoading: setupStatusLoading } = useSalonSetupStatus(salonId);

  // Keep individual data queries for components that still need them
  const { data: salonData } = useQuery<Salon>({
    queryKey: ['/api/salons', salonId],
    enabled: !!salonId,
    staleTime: 30000
  });

  const { data: services } = useQuery<ServiceData[]>({
    queryKey: ['/api/salons', salonId, 'services'],
    enabled: !!salonId,
    staleTime: 30000
  });

  const { data: staff } = useQuery<StaffData[]>({
    queryKey: ['/api/salons', salonId, 'staff'],
    enabled: !!salonId,
    staleTime: 30000
  });

  const { data: bookingSettings } = useQuery({
    queryKey: ['/api/salons', salonId, 'booking-settings'],
    enabled: !!salonId,
    staleTime: 30000
  });

  const { data: mediaAssets } = useQuery({
    queryKey: ['/api/salons', salonId, 'media-assets'],
    enabled: !!salonId,
    staleTime: 30000
  });

  // Fetch real analytics data with proper query key invalidation
  const { 
    data: analyticsData, 
    isLoading: analyticsLoading, 
    error: analyticsError,
    isError: isAnalyticsError 
  } = useQuery<AnalyticsData>({
    queryKey: ['/api/salons', salonId, 'analytics', selectedPeriod],
    queryFn: async () => {
      const params = new URLSearchParams({ period: selectedPeriod });
      const response = await fetch(`/api/salons/${salonId}/analytics?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!salonId && !!selectedPeriod,
    staleTime: 30000,
    retry: 2,
    retryDelay: 1000
  });

  // Use centralized completion logic instead of ad-hoc checks
  const isProfileComplete = completionData?.profile?.isComplete ?? false;
  const hasServices = completionData?.services?.isComplete ?? false;
  const hasStaff = completionData?.staff?.isComplete ?? false;
  const hasSettings = completionData?.settings?.isComplete ?? false;
  const hasMedia = completionData?.media?.isComplete ?? false;
  const completionPercentage = completionData?.overallProgress ?? 0;
  const nextStep = completionData?.nextStep;

  // Separate completion checks for Business Info and Location & Contact
  const isBusinessInfoComplete = salonData?.name && salonData?.description && salonData?.category;
  const isLocationContactComplete = salonData?.address && salonData?.city && salonData?.state && 
                                     salonData?.zipCode && salonData?.latitude != null && salonData?.longitude != null && 
                                     salonData?.phone && salonData?.email;

  // Helper functions for formatting and trends
  const formatCurrency = (paisa: number | undefined | null) => {
    const safePaisa = typeof paisa === 'number' && !isNaN(paisa) ? paisa : 0;
    const rupees = safePaisa / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(rupees);
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Extract analytics data with fallbacks
  const overview: Partial<AnalyticsOverview> = analyticsData?.overview || {};
  const todayBookings = overview.todayBookings || 0;
  const todayRevenue = overview.todayRevenuePaisa || 0;
  const totalRevenue = overview.totalRevenuePaisa || 0;
  const activeStaff = overview.activeStaffCount || 0;
  const totalBookings = overview.totalBookings || 0;
  const averageBookingValue = overview.averageBookingValuePaisa || 0;
  
  const totalCustomers = overview.totalCustomers || 0;
  const totalJobCards = overview.totalJobCards || 0;
  const walkInCount = overview.walkInCount || 0;
  const walkInRevenue = overview.walkInRevenuePaisa || 0;
  const todayTotalCustomers = overview.todayTotalCustomers || 0;
  const todayWalkIns = overview.todayWalkIns || 0;
  
  // Revenue breakdown - the key metrics for proper lifecycle tracking
  const realizedRevenue = overview.realizedRevenuePaisa || 0;
  const expectedRevenue = overview.expectedRevenuePaisa || 0;
  const pendingRevenue = overview.pendingRevenuePaisa || 0;
  const todayRealizedRevenue = overview.todayRealizedRevenuePaisa || 0;
  const todayExpectedRevenue = overview.todayExpectedRevenuePaisa || 0;
  const todayPendingRevenue = overview.todayPendingRevenuePaisa || 0;
  const paidJobCards = overview.paidJobCards || 0;
  const completionRate = overview.completionRate || '0.0';
  const confirmedBookings = overview.confirmedBookings || 0;
  
  const bookingsTrend = overview.bookingsTrend || { percentage: '0.0', direction: 'neutral' };
  const revenueTrend = overview.revenueTrend || { percentage: '0.0', direction: 'neutral' };
  const averageValueTrend = overview.averageValueTrend || { percentage: '0.0', direction: 'neutral' };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in</h1>
          <Link href="/login/business"><Button>Log In</Button></Link>
        </div>
      </div>
    );
  }

  if (salonsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Auto-redirect to setup if no business found
  if (!Array.isArray(salons) || salons.length === 0) {
    setLocation('/business/setup');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleStepComplete = async (data?: any) => {
    // Invalidate completion cache to refresh indicators
    await queryClient.invalidateQueries({ 
      queryKey: ['/api/salons', salonId, 'dashboard-completion'] 
    });
    
    // No automatic redirect - let user control navigation
    toast({
      title: "Step Completed",
      description: "Great progress! You can now move to the next step.",
    });
  };

  // Navigation structure with grouped sections - Industry Standard Approach with RBAC
  const allNavigationSections: NavigationSection[] = [
    {
      id: "overview",
      label: "Overview",
      icon: Home,
      items: [
        { id: "overview", label: "Dashboard", icon: BarChart, hasAccess: true, isComplete: false, isSetup: false }
      ]
    },
    {
      id: "operations",
      label: "Operations",
      icon: Calendar,
      items: [
        { id: "calendar", label: "Bookings & Calendar", icon: Calendar, hasAccess: canViewBookings || isAdmin, isComplete: false, isSetup: false },
        { id: "client-profiles", label: "Client Profiles & Notes", icon: UserCog, hasAccess: canViewCustomers || isAdmin, isComplete: false, isSetup: false },
        { id: "inventory", label: "Inventory Management", icon: Package, hasAccess: canViewInventory || isAdmin, isComplete: false, isSetup: false },
        { id: "beauty-catalog", label: "Beauty Products Catalog", icon: Sparkles, hasAccess: canViewInventory || isAdmin, isComplete: false, isSetup: false },
        { id: "offers", label: "Offers & Promotions", icon: Gift, hasAccess: canViewMarketing || isAdmin, isComplete: false, isSetup: false }
      ]
    },
    {
      id: "events",
      label: "Events Management",
      icon: CalendarDays,
      requiresAdmin: true,
      items: [
        { id: "events-dashboard", label: "Event Dashboard", icon: BarChart, isComplete: false, isSetup: false, hasAccess: isAdmin },
        { id: "create-event", label: "Create Event", icon: Plus, isComplete: false, isSetup: false, hasAccess: isAdmin },
        { id: "draft-events", label: "Draft Events", icon: FileEdit, isComplete: false, isSetup: false, hasAccess: isAdmin },
        { id: "past-events", label: "Past Events", icon: History, isComplete: false, isSetup: false, hasAccess: isAdmin }
      ]
    },
    {
      id: "business",
      label: "Business Setup & Management",
      icon: Building,
      items: [
        { id: "business-info", label: "Business Info", icon: Building, isComplete: !!isBusinessInfoComplete, isSetup: true, hasAccess: canViewSettings || isAdmin },
        { id: "location-contact", label: "Location & Contact", icon: MapPin, isComplete: !!isLocationContactComplete, isSetup: true, hasAccess: canViewSettings || isAdmin },
        { id: "services", label: "Services & Pricing", icon: Scissors, isComplete: hasServices, isSetup: true, hasAccess: canViewServices || isAdmin },
        { id: "packages", label: "Package & Combos", icon: Gift, isComplete: false, isSetup: false, hasAccess: canViewServices || isAdmin },
        { id: "memberships", label: "Membership Plans", icon: Crown, isComplete: false, isSetup: false, hasAccess: canViewServices || isAdmin },
        { id: "staff", label: "Staff Management", icon: Users, isComplete: hasStaff, isSetup: true, hasAccess: canViewStaff || isAdmin },
        { id: "resources", label: "Resources & Equipment", icon: Settings, isComplete: false, isSetup: false, isOptional: true, hasAccess: canViewSettings || isAdmin },
        { id: "booking-settings", label: "Booking Settings", icon: Cog, isComplete: hasSettings, isSetup: true, hasAccess: canViewSettings || isAdmin },
        { id: "payment-setup", label: "Payment Setup", icon: CreditCard, isComplete: false, isSetup: false, isOptional: true, hasAccess: isBusinessOwner },
        { id: "media", label: "Media Gallery", icon: Camera, isComplete: hasMedia, isSetup: true, hasAccess: canEditSettings || isAdmin },
        { id: "publish", label: "Publish Business", icon: CheckCircle, progress: completionPercentage, isSetup: true, hasAccess: isBusinessOwner }
      ]
    },
    {
      id: "admin",
      label: "Administration",
      icon: Shield,
      requiresBusinessOwner: true,
      items: [
        { id: "shop-admins", label: "Shop Admin Management", icon: Shield, isComplete: false, isSetup: false, hasAccess: isBusinessOwner }
      ]
    },
    {
      id: "financials",
      label: "Financial Management",
      icon: Wallet,
      items: [
        { id: "financials", label: "Financial Dashboard", icon: CreditCard, isComplete: false, isSetup: false, hasAccess: canViewFinancials || isAdmin }
      ]
    },
    {
      id: "staff-payroll",
      label: "Staff Payroll",
      icon: Banknote,
      items: [
        { id: "payroll-overview", label: "Payroll Overview", icon: Wallet, isComplete: false, isSetup: false, hasAccess: isBusinessOwner || canViewFinancials || isAdmin },
        { id: "salary-management", label: "Salary Management", icon: Banknote, isComplete: false, isSetup: false, hasAccess: isBusinessOwner || canViewFinancials || isAdmin },
        { id: "leave-management", label: "Leave Management", icon: CalendarOff, isComplete: false, isSetup: false, hasAccess: isBusinessOwner || canViewFinancials || isAdmin },
        { id: "payroll-runs", label: "Payroll Runs", icon: FileSpreadsheet, isComplete: false, isSetup: false, hasAccess: isBusinessOwner || canViewFinancials || isAdmin },
        { id: "staff-onboarding", label: "Staff Onboarding", icon: UserPlus, isComplete: false, isSetup: false, hasAccess: isBusinessOwner || canViewFinancials || isAdmin },
        { id: "staff-exit", label: "Exit & Settlement", icon: UserMinus, isComplete: false, isSetup: false, hasAccess: isBusinessOwner || canViewFinancials || isAdmin },
        { id: "commissions", label: "Commission Summary", icon: Wallet, isComplete: false, isSetup: false, hasAccess: isBusinessOwner || canViewFinancials || isAdmin }
      ]
    },
    {
      id: "analytics",
      label: "Analytics & Reports",
      icon: BarChart,
      items: [
        { id: "analytics", label: "Advanced Analytics", icon: TrendingUp, isComplete: false, isSetup: false, hasAccess: canViewReports || isAdmin },
        { id: "ml-analytics", label: "ML Predictions", icon: Brain, isComplete: false, isSetup: false, hasAccess: canViewReports || isAdmin }
      ]
    },
    {
      id: "communications",
      label: "Communications",
      icon: MessageSquare,
      items: [
        { id: "chat-inbox", label: "Chat Inbox", icon: MessageCircle, isComplete: false, isSetup: false, hasAccess: canViewCustomers || isAdmin, unreadCount: chatUnreadCount },
        { id: "communications", label: "Customer Communications", icon: MessageSquare, isComplete: false, isSetup: false, hasAccess: canViewCustomers || isAdmin },
        { id: "customer-import", label: "Customer Import", icon: Upload, isComplete: false, isSetup: false, hasAccess: canViewCustomers || isAdmin },
        { id: "campaigns", label: "Invitation Campaigns", icon: Send, isComplete: false, isSetup: false, hasAccess: canViewCustomers || isAdmin }
      ]
    }
  ];

  // Filter navigation sections based on user permissions
  const navigationSections = allNavigationSections
    .filter(section => {
      if (section.requiresBusinessOwner && !isBusinessOwner) return false;
      if (section.requiresAdmin && !isAdmin) return false;
      return section.items.some(item => item.hasAccess);
    })
    .map(section => ({
      ...section,
      items: section.items.filter(item => item.hasAccess)
    }));

  // Handle navigation with auto-expand and scroll into view
  const handleNavigation = (tabId: string) => {
    const tabToSectionMap: Record<string, string> = {
      'overview': 'overview',
      'calendar': 'operations', 'client-profiles': 'operations', 'inventory': 'operations', 
      'beauty-catalog': 'operations', 'offers': 'operations',
      'events-dashboard': 'events', 'create-event': 'events', 'draft-events': 'events', 'past-events': 'events',
      'business-info': 'business', 'location-contact': 'business', 'services': 'business', 'packages': 'business',
      'memberships': 'business', 'staff': 'business', 'resources': 'business', 'booking-settings': 'business', 'payment-setup': 'business',
      'media': 'business', 'publish': 'business',
      'shop-admins': 'settings',
      'financials': 'financials',
      'payroll-overview': 'staff-payroll', 'salary-management': 'staff-payroll', 'leave-management': 'staff-payroll',
      'payroll-runs': 'staff-payroll', 'staff-onboarding': 'staff-payroll', 'staff-exit': 'staff-payroll', 'commissions': 'staff-payroll',
      'analytics': 'analytics', 'ml-analytics': 'analytics',
      'chat-inbox': 'communications', 'communications': 'communications', 'customer-import': 'communications', 'campaigns': 'communications',
      'notifications-settings': 'settings', 'security-settings': 'settings', 'subscription-settings': 'settings', 
      'integrations-settings': 'settings', 'account-settings': 'settings'
    };
    const sectionId = tabToSectionMap[tabId];
    if (sectionId && !expandedSections.includes(sectionId)) {
      setExpandedSections(prev => [...prev, sectionId]);
    }
    setActiveTab(tabId);
    
    // Scroll the selected menu item into view after a short delay (to allow accordion expansion)
    setTimeout(() => {
      const activeElement = document.querySelector(`[data-testid="nav-${tabId}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Stunning Sidebar navigation component with WOW factors
  const SidebarNavigation = () => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Good Morning";
      if (hour < 17) return "Good Afternoon";
      return "Good Evening";
    };

    const servicesCount = services?.length || 0;
    const staffCount = staff?.length || 0;
    const todayBookingsCount = todayBookings || 0;

    return (
      <Sidebar collapsible="icon" className="border-r-0 h-screen flex flex-col">
        {/* Premium Profile Section - Compact */}
        <SidebarHeader className="flex-shrink-0 border-none bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 p-3 pt-4 group-data-[collapsible=icon]:p-2">
          <div className="flex flex-col gap-2 group-data-[collapsible=icon]:items-center">
            {/* User Avatar & Greeting */}
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-2 ring-white/40 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
                  <UserCircle className="h-6 w-6 text-white group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 border-2 border-white group-data-[collapsible=icon]:h-2.5 group-data-[collapsible=icon]:w-2.5" />
              </div>
              
              <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="text-[10px] font-medium text-white/90">{getGreeting()}</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-white truncate">{user?.firstName || user?.email || 'Business Owner'}</p>
                  {userRole && (
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${
                      isBusinessOwner 
                        ? 'bg-amber-400/30 text-amber-100 ring-1 ring-amber-300/50' 
                        : userRole === 'shop_admin'
                          ? 'bg-blue-400/30 text-blue-100 ring-1 ring-blue-300/50'
                          : 'bg-white/20 text-white/90'
                    }`}>
                      {isBusinessOwner ? 'Owner' : userRole === 'shop_admin' ? 'Admin' : 'Staff'}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-white/80 truncate flex items-center gap-1">
                  <Building className="h-2.5 w-2.5" />
                  {salonData?.name || 'Your Business'}
                </p>
              </div>
            </div>

            {/* Quick Stats - Compact */}
            <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-white/20 group-data-[collapsible=icon]:hidden">
              <div className="text-center">
                <p className="text-base font-bold text-white">{todayBookingsCount}</p>
                <p className="text-[9px] text-white/80">Today</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-white">{servicesCount}</p>
                <p className="text-[9px] text-white/80">Services</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-white">{staffCount}</p>
                <p className="text-[9px] text-white/80">Team</p>
              </div>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="flex-1 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-1">
              {/* Quick Actions Panel - Compact */}
              <div className="mb-3 group-data-[collapsible=icon]:hidden">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-2 border border-blue-100">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Zap className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-[10px] font-semibold text-blue-900">Quick Actions</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button 
                      onClick={() => handleNavigation('calendar')}
                      className="flex items-center justify-center gap-1 px-2 py-1 bg-white hover:bg-blue-50 rounded-md border border-blue-100 transition-all text-[10px] font-medium text-blue-700 hover:shadow-sm"
                    >
                      <Calendar className="h-3 w-3" />
                      <span>Book</span>
                    </button>
                    <button 
                      onClick={() => handleNavigation('services')}
                      className="flex items-center justify-center gap-1 px-2 py-1 bg-white hover:bg-blue-50 rounded-md border border-blue-100 transition-all text-[10px] font-medium text-blue-700 hover:shadow-sm"
                    >
                      <Scissors className="h-3 w-3" />
                      <span>Services</span>
                    </button>
                  </div>
                </div>
              </div>

              <Accordion type="multiple" value={expandedSections} onValueChange={setExpandedSections} className="w-full space-y-1">
                {navigationSections.map((section) => (
                  section.items.length === 1 ? (
                    // Single item sections (no accordion)
                    <div key={section.id}>
                      <SidebarGroup>
                        <SidebarGroupContent>
                          <SidebarMenu>
                            <SidebarMenuItem>
                              <SidebarMenuButton
                                onClick={() => handleNavigation(section.items[0].id)}
                                isActive={activeTab === section.items[0].id}
                                tooltip={section.label}
                                className={`w-full justify-start h-10 rounded-lg transition-all ${
                                  activeTab === section.items[0].id 
                                    ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md hover:shadow-lg' 
                                    : 'hover:bg-violet-50 hover:text-violet-700'
                                }`}
                                data-testid={`nav-${section.items[0].id}`}
                              >
                                <section.icon className="h-4 w-4" />
                                <span className="group-data-[collapsible=icon]:hidden font-medium">{section.label}</span>
                                {activeTab === section.items[0].id && (
                                  <ChevronRight className="h-4 w-4 ml-auto group-data-[collapsible=icon]:hidden" />
                                )}
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          </SidebarMenu>
                        </SidebarGroupContent>
                      </SidebarGroup>
                    </div>
                  ) : (
                    // Multi-item sections (with accordion)
                    <AccordionItem key={section.id} value={section.id} className="border-none">
                      <AccordionTrigger className="group-data-[collapsible=icon]:justify-center px-3 py-2 hover:no-underline hover:bg-violet-50 rounded-lg transition-colors data-[state=open]:bg-violet-50">
                        <div className="flex items-center gap-2">
                          <section.icon className="h-4 w-4 text-violet-600" />
                          <span className="group-data-[collapsible=icon]:hidden text-sm font-semibold text-slate-700">
                            {section.label}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2 pt-1">
                        <SidebarGroup>
                          <SidebarGroupContent>
                            <SidebarMenu className="space-y-0.5">
                              {section.items.map((item) => {
                                const isActive = activeTab === item.id;
                                return (
                                  <SidebarMenuItem key={item.id}>
                                    <SidebarMenuButton
                                      onClick={() => handleNavigation(item.id)}
                                      isActive={isActive}
                                      tooltip={item.label}
                                      className={`w-full justify-start ml-4 group-data-[collapsible=icon]:ml-0 h-9 rounded-lg transition-all ${
                                        isActive 
                                          ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-sm' 
                                          : 'hover:bg-violet-50/50'
                                      }`}
                                      data-testid={`nav-${item.id}`}
                                    >
                                      <item.icon className="h-4 w-4" />
                                      <span className="group-data-[collapsible=icon]:hidden flex items-center justify-between w-full text-sm">
                                        <span className={isActive ? 'font-medium' : ''}>{item.label}</span>
                                        <div className="flex items-center gap-1.5">
                                          {item.unreadCount && item.unreadCount > 0 && (
                                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center">
                                              {item.unreadCount > 99 ? '99+' : item.unreadCount}
                                            </Badge>
                                          )}
                                          {item.isComplete && (
                                            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-green-500/20" title="Complete">
                                              <CheckCircle className="h-3 w-3 text-green-600" />
                                            </div>
                                          )}
                                          {item.isSetup && !item.isComplete && (
                                            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" title="Setup required" />
                                          )}
                                          {item.isOptional && (
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-blue-50 text-blue-600 border-blue-200">
                                              Optional
                                            </Badge>
                                          )}
                                          {'progress' in item && item.progress !== undefined && item.progress < 100 && (
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-amber-50 text-amber-600 border-amber-200">
                                              {Math.round(item.progress)}%
                                            </Badge>
                                          )}
                                          {'progress' in item && item.progress === 100 && (
                                            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-green-500/20">
                                              <CheckCircle className="h-3 w-3 text-green-600" />
                                            </div>
                                          )}
                                          {isActive && (
                                            <ChevronRight className="h-3 w-3 ml-1" />
                                          )}
                                        </div>
                                      </span>
                                    </SidebarMenuButton>
                                  </SidebarMenuItem>
                                );
                              })}
                            </SidebarMenu>
                          </SidebarGroupContent>
                        </SidebarGroup>
                      </AccordionContent>
                    </AccordionItem>
                  )
                ))}
              </Accordion>

              {/* Premium Features Section - Dynamic based on subscription */}
              <div className="mt-3 group-data-[collapsible=icon]:hidden">
                {featureAccess.isPremium ? (
                  <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-xl p-3 border border-emerald-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500">
                          <Crown className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-emerald-900">
                            {featureAccess.isElite ? 'Elite' : 'Growth'} Plan
                          </span>
                          {featureAccess.isTrial && (
                            <span className="text-[9px] text-amber-600 font-medium">14-day trial active</span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 h-auto border-emerald-300 text-emerald-700 bg-emerald-50">
                        Active
                      </Badge>
                    </div>
                    <div className="space-y-1.5 mb-2.5">
                      <Link href="/business/analytics">
                        <div className="flex items-center gap-2 text-xs text-emerald-800 hover:bg-emerald-100/70 rounded-md p-1.5 cursor-pointer transition-colors">
                          <div className="p-0.5 rounded bg-emerald-100">
                            <CheckCircle className="h-3 w-3 text-emerald-600" />
                          </div>
                          <span className="font-medium">Advanced Analytics</span>
                          <ChevronRight className="h-3 w-3 ml-auto text-emerald-400" />
                        </div>
                      </Link>
                      <div 
                        onClick={() => handleNavigation('loyalty-rewards')}
                        className="flex items-center gap-2 text-xs text-emerald-800 hover:bg-emerald-100/70 rounded-md p-1.5 cursor-pointer transition-colors"
                      >
                        <div className="p-0.5 rounded bg-emerald-100">
                          <CheckCircle className="h-3 w-3 text-emerald-600" />
                        </div>
                        <span className="font-medium">Loyalty Programs</span>
                        <ChevronRight className="h-3 w-3 ml-auto text-emerald-400" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-emerald-800 p-1.5">
                        <div className="p-0.5 rounded bg-emerald-100">
                          <CheckCircle className="h-3 w-3 text-emerald-600" />
                        </div>
                        <span className="font-medium">AI Recommendations</span>
                      </div>
                      <Link href={`/salon/${salonId}/settings?tab=integrations`}>
                        <div className="flex items-center gap-2 text-xs text-emerald-800 hover:bg-emerald-100/70 rounded-md p-1.5 cursor-pointer transition-colors">
                          <div className="p-0.5 rounded bg-emerald-100">
                            <CheckCircle className="h-3 w-3 text-emerald-600" />
                          </div>
                          <span className="font-medium">Social Booking</span>
                          <ChevronRight className="h-3 w-3 ml-auto text-emerald-400" />
                        </div>
                      </Link>
                      {featureAccess.isElite && (
                        <div className="flex items-center gap-2 text-xs text-emerald-800 p-1.5">
                          <div className="p-0.5 rounded bg-emerald-100">
                            <CheckCircle className="h-3 w-3 text-emerald-600" />
                          </div>
                          <span className="font-medium">Reserve with Google</span>
                        </div>
                      )}
                    </div>
                    <Link href={`/salon/${salonId}/settings?tab=subscription`}>
                      <Button size="sm" variant="outline" className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-100 h-7 text-xs font-medium">
                        Manage Subscription
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 rounded-xl p-3 border border-amber-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="p-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500">
                        <Crown className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-amber-900">Unlock Premium</span>
                        <span className="text-[9px] text-amber-600">Starting at ₹999/month</span>
                      </div>
                    </div>
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2 text-xs text-amber-800">
                        <Star className="h-3 w-3 text-amber-500" />
                        <span>Advanced Analytics & Reports</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-amber-800">
                        <Gift className="h-3 w-3 text-amber-500" />
                        <span>Loyalty & Rewards Programs</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-amber-800">
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        <span>AI-Powered Recommendations</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-amber-800">
                        <Instagram className="h-3 w-3 text-amber-500" />
                        <span>Instagram & Facebook Booking</span>
                      </div>
                    </div>
                    <Link href={`/salon/${salonId}/settings?tab=subscription`}>
                      <Button size="sm" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md h-8 text-xs font-semibold">
                        <Sparkles className="h-3 w-3 mr-1.5" />
                        Upgrade Now
                      </Button>
                    </Link>
                    <p className="text-[9px] text-center text-amber-600 mt-2">
                      14-day free trial available
                    </p>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </SidebarContent>
      </Sidebar>
    );
  };

  // Mobile navigation component - Modern Fresha-style design with compact/expanded toggle
  const MobileNavigation = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className={`p-0 bg-gradient-to-b from-slate-900 to-slate-800 transition-all duration-300 ${mobileCompactMode ? 'w-20' : 'w-80'}`}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-3 justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg">
                <Sparkles className="h-5 w-5" />
              </div>
              {!mobileCompactMode && (
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">Stylemate</span>
                  <span className="text-xs text-slate-400">
                    {salonData?.name || 'Business Dashboard'}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Navigation */}
          <ScrollArea className="flex-1 p-2">
            {mobileCompactMode ? (
              /* Compact Mode - Icon Grid */
              <div className="flex flex-col items-center gap-2">
                {iconSidebarSections.map((section) => (
                  <TooltipProvider key={section.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            if (section.items.length === 1) {
                              handleNavigation(section.items[0].id);
                              setMobileMenuOpen(false);
                            } else {
                              // For multi-item sections, expand to full mode and open submenu
                              setMobileCompactMode(false);
                              setMobileSubmenuOpen(section.id);
                            }
                          }}
                          className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all ${
                            section.items.some(item => item.id === activeTab)
                              ? 'bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg'
                              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          <section.icon className="h-5 w-5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
                        {section.label}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            ) : (
              /* Expanded Mode - Full Menu */
              <div className="space-y-2 p-2">
                {iconSidebarSections.map((section) => (
                  <div key={section.id}>
                    <button
                      onClick={() => {
                        if (section.items.length === 1) {
                          handleNavigation(section.items[0].id);
                          setMobileMenuOpen(false);
                        } else {
                          setMobileSubmenuOpen(mobileSubmenuOpen === section.id ? null : section.id);
                        }
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                        section.items.some(item => item.id === activeTab)
                          ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30'
                          : 'hover:bg-slate-700/50'
                      }`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        section.items.some(item => item.id === activeTab)
                          ? 'bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-md'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        <section.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <span className={`text-sm font-medium ${
                          section.items.some(item => item.id === activeTab) ? 'text-white' : 'text-slate-300'
                        }`}>
                          {section.label}
                        </span>
                      </div>
                      {section.items.length > 1 && (
                        <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${
                          mobileSubmenuOpen === section.id ? 'rotate-90' : ''
                        }`} />
                      )}
                    </button>
                    
                    {mobileSubmenuOpen === section.id && section.items.length > 1 && (
                      <div className="mt-2 ml-4 space-y-1 border-l-2 border-slate-700 pl-4">
                        {section.items.map((item) => {
                          const ItemIcon = item.icon;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                handleNavigation(item.id);
                                setMobileMenuOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                                activeTab === item.id
                                  ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md'
                                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                              }`}
                            >
                              {ItemIcon && <ItemIcon className="h-4 w-4" />}
                              <span className="text-sm">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          {/* Footer with Toggle and User Info */}
          <div className="p-3 border-t border-slate-700 space-y-2">
            {/* Expand/Collapse Toggle */}
            <button
              onClick={() => setMobileCompactMode(!mobileCompactMode)}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            >
              {mobileCompactMode ? (
                <>
                  <PanelLeft className="h-4 w-4" />
                  <span className="sr-only">Expand Menu</span>
                </>
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4" />
                  <span className="text-sm">Collapse Menu</span>
                </>
              )}
            </button>
            
            {/* User Info */}
            <div className={`flex items-center gap-3 p-3 rounded-xl bg-slate-700/50 ${mobileCompactMode ? 'justify-center' : ''}`}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-500 text-white flex-shrink-0">
                <UserCircle className="h-5 w-5" />
              </div>
              {!mobileCompactMode && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.firstName || 'Business Owner'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {user?.email || ''}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-600"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  const renderTabContent = () => {
    if (activeTab === "overview") {
      return (
        <div className="p-6 space-y-6">
          {/* Setup Progress - Using Unified Setup Status API */}
          {setupStatus && !setupStatus.isSetupComplete && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle className="text-blue-900 dark:text-blue-100">Complete Setup</CardTitle>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      Complete all {setupStatus.totalSteps} steps to publish your salon
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Progress: {setupStatus.completedSteps} of {setupStatus.totalSteps} steps complete ({setupStatus.progress}%)
                  </span>
                </div>
                <Progress value={setupStatus.progress} className="h-2" />
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-100">Required Steps:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      {setupStatus.steps.businessInfo.completed ? '✓' : '○'} Business Info
                    </div>
                    <div className="flex items-center gap-1">
                      {setupStatus.steps.locationContact.completed ? '✓' : '○'} Location & Contact
                    </div>
                    <div className="flex items-center gap-1">
                      {setupStatus.steps.services.completed ? '✓' : '○'} Services ({setupStatus.steps.services.count})
                    </div>
                    <div className="flex items-center gap-1">
                      {setupStatus.steps.staff.completed ? '✓' : '○'} Team Members ({setupStatus.steps.staff.count})
                    </div>
                    <div className="flex items-center gap-1">
                      {setupStatus.steps.bookingSettings.completed ? '✓' : '○'} Booking Settings
                    </div>
                    <div className="flex items-center gap-1">
                      {setupStatus.steps.paymentSetup.completed ? '✓' : '○'} Payment Setup
                    </div>
                    <div className="flex items-center gap-1">
                      {setupStatus.steps.media.completed ? '✓' : '○'} Photos ({setupStatus.steps.media.count})
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      {setupStatus.steps.resources.completed ? '✓' : '○'} Resources (optional)
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    💡 Complete all steps to publish your salon
                  </p>
                  <Link href="/business/setup">
                    <Button 
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Continue Setup
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* AI Look Advisor - Premium Feature */}
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-violet-50 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-purple-900">AI Personal Look Advisor</CardTitle>
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  </div>
                  <p className="text-purple-700 text-sm mt-1">
                    AI-powered beauty consultation with AR try-on and smart product matching
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-purple-700">
                    <Camera className="h-4 w-4" />
                    <span>Photo Analysis</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-700">
                    <Zap className="h-4 w-4" />
                    <span>AI Recommendations</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-700">
                    <Package className="h-4 w-4" />
                    <span>Inventory Matching</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-700">
                    <Star className="h-4 w-4" />
                    <span>AR Preview</span>
                  </div>
                </div>
                <Link href="/premium/ai-look">
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md"
                    size="lg"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Launch AI Look Advisor
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Location Set Successfully Alert */}
          {salonData?.latitude != null && salonData?.longitude != null && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
              <MapPin className="h-5 w-5 text-green-600" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100 mb-1">
                      Location Set Successfully
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Coordinates: {Number(salonData.latitude).toFixed(6)}, {Number(salonData.longitude).toFixed(6)}
                    </p>
                  </div>
                  <Link href="#location-contact">
                    <Button variant="outline" size="sm" onClick={() => setActiveTab("location-contact")}>
                      Update Location
                    </Button>
                  </Link>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Location on Map */}
          {salonData?.latitude != null && salonData?.longitude != null && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  <CardTitle>Location on Map</CardTitle>
                  <span className="text-xs text-muted-foreground ml-auto">
                    📍 {Number(salonData.latitude).toFixed(6)}, {Number(salonData.longitude).toFixed(6)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <Map
                  latitude={typeof salonData.latitude === 'number' ? salonData.latitude : parseFloat(salonData.latitude)}
                  longitude={typeof salonData.longitude === 'number' ? salonData.longitude : parseFloat(salonData.longitude)}
                  zoom={16}
                  className="w-full h-[300px] rounded-lg border-2 border-purple-200"
                  markerTitle={salonData.name || "Your Business Location"}
                />
                <div className="mt-3 flex items-center gap-2 text-xs text-purple-700 bg-purple-50 dark:bg-purple-950 dark:text-purple-300 p-2 rounded-md">
                  <MapPin className="h-3 w-3" />
                  <span>💡 Tip: Drag the marker to adjust your exact location</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This is where your business will appear on the map for customers
                </p>
              </CardContent>
            </Card>
          )}

          {/* Time Period Filter and Export */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
                  <p className="text-sm text-muted-foreground">Business insights and performance metrics</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!analyticsData) return;
                      const exportData = {
                        period: selectedPeriod,
                        salon: salonData?.name || 'Salon',
                        exportDate: new Date().toISOString(),
                        overview: analyticsData.overview,
                        popularServices: analyticsData.popularServices,
                        staffPerformance: analyticsData.staffPerformance,
                        bookingTrends: analyticsData.bookingTrends
                      };
                      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                        type: 'application/json'
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `salon-analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      toast({
                        title: "Analytics Exported",
                        description: "Analytics data has been downloaded as JSON file for accounting/reporting."
                      });
                    }}
                    disabled={!analyticsData || analyticsLoading || isAnalyticsError}
                    data-testid="button-export-analytics"
                  >
                    Export Data
                  </Button>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod} disabled={analyticsLoading}>
                    <SelectTrigger className="w-40" data-testid="select-period">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Error Handling */}
          {isAnalyticsError && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950" data-testid="alert-analytics-error">
              <AlertDescription className="text-red-800 dark:text-red-200">
                <div className="flex items-center gap-2">
                  <span>⚠️ Failed to load analytics data</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-0 h-auto text-red-700 dark:text-red-300 underline"
                    onClick={() => window.location.reload()}
                    data-testid="button-retry-analytics"
                  >
                    Retry
                  </Button>
                </div>
                {analyticsError && (
                  <p className="text-xs mt-1 text-red-600 dark:text-red-400">
                    {analyticsError instanceof Error ? analyticsError.message : 'Unknown error occurred'}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-blue-50 dark:bg-blue-950" data-testid="card-today-bookings">
              <CardContent className="p-6">
                {analyticsLoading ? (
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-blue-200 dark:bg-blue-800 rounded animate-pulse"></div>
                      <div className="h-8 w-16 bg-blue-300 dark:bg-blue-700 rounded animate-pulse"></div>
                      <div className="h-3 w-20 bg-blue-200 dark:bg-blue-800 rounded animate-pulse"></div>
                    </div>
                    <div className="h-8 w-8 bg-blue-300 dark:bg-blue-700 rounded animate-pulse"></div>
                  </div>
                ) : isAnalyticsError ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Today's Bookings</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">--</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Data unavailable</p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Today's Bookings</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100" data-testid="text-today-bookings">
                          {todayBookings}
                        </p>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(bookingsTrend.direction)}
                          <span className={`text-xs font-medium ${getTrendColor(bookingsTrend.direction)}`}>
                            {bookingsTrend.percentage}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Period total: {totalBookings}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-950" data-testid="card-revenue">
              <CardContent className="p-6">
                {analyticsLoading ? (
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-green-200 dark:bg-green-800 rounded animate-pulse"></div>
                      <div className="h-8 w-24 bg-green-300 dark:bg-green-700 rounded animate-pulse"></div>
                      <div className="h-3 w-20 bg-green-200 dark:bg-green-800 rounded animate-pulse"></div>
                    </div>
                    <div className="h-8 w-8 bg-green-300 dark:bg-green-700 rounded animate-pulse"></div>
                  </div>
                ) : isAnalyticsError ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Revenue
                      </p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">--</p>
                      <p className="text-xs text-green-600 dark:text-green-400">Data unavailable</p>
                    </div>
                    <BarChart className="h-8 w-8 text-green-600" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        Collected Revenue
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100" data-testid="text-revenue">
                          {formatCurrency(realizedRevenue)}
                        </p>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(revenueTrend.direction)}
                          <span className={`text-xs font-medium ${getTrendColor(revenueTrend.direction)}`}>
                            {revenueTrend.percentage}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Today: {formatCurrency(todayRealizedRevenue)}
                        {(expectedRevenue > 0 || pendingRevenue > 0) && (
                          <span className="ml-2 text-amber-600">
                            ({formatCurrency(expectedRevenue + pendingRevenue)} pending)
                          </span>
                        )}
                      </p>
                    </div>
                    <BarChart className="h-8 w-8 text-green-600" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-950" data-testid="card-staff">
              <CardContent className="p-6">
                {analyticsLoading ? (
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-purple-200 dark:bg-purple-800 rounded animate-pulse"></div>
                      <div className="h-8 w-12 bg-purple-300 dark:bg-purple-700 rounded animate-pulse"></div>
                      <div className="h-3 w-24 bg-purple-200 dark:bg-purple-800 rounded animate-pulse"></div>
                    </div>
                    <div className="h-8 w-8 bg-purple-300 dark:bg-purple-700 rounded animate-pulse"></div>
                  </div>
                ) : isAnalyticsError ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Staff</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">--</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">Data unavailable</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Staff</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100" data-testid="text-active-staff">
                        {activeStaff}
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        Available for bookings
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-950" data-testid="card-avg-value">
              <CardContent className="p-6">
                {analyticsLoading ? (
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-orange-200 dark:bg-orange-800 rounded animate-pulse"></div>
                      <div className="h-8 w-24 bg-orange-300 dark:bg-orange-700 rounded animate-pulse"></div>
                      <div className="h-3 w-20 bg-orange-200 dark:bg-orange-800 rounded animate-pulse"></div>
                    </div>
                    <div className="h-8 w-8 bg-orange-300 dark:bg-orange-700 rounded animate-pulse"></div>
                  </div>
                ) : isAnalyticsError ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Average Booking Value</p>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">--</p>
                      <p className="text-xs text-orange-600 dark:text-orange-400">Data unavailable</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-orange-600" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Average Transaction Value</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-orange-900 dark:text-orange-100" data-testid="text-avg-value">
                          {formatCurrency(averageBookingValue)}
                        </p>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(averageValueTrend.direction)}
                          <span className={`text-xs font-medium ${getTrendColor(averageValueTrend.direction)}`}>
                            {averageValueTrend.percentage}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        From {paidJobCards} paid transactions
                      </p>
                    </div>
                    <CreditCard className="h-8 w-8 text-orange-600" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Customer & Walk-in Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-indigo-50 dark:bg-indigo-950" data-testid="card-total-customers">
              <CardContent className="p-6">
                {analyticsLoading ? (
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-28 bg-indigo-200 dark:bg-indigo-800 rounded animate-pulse"></div>
                      <div className="h-8 w-16 bg-indigo-300 dark:bg-indigo-700 rounded animate-pulse"></div>
                      <div className="h-3 w-32 bg-indigo-200 dark:bg-indigo-800 rounded animate-pulse"></div>
                    </div>
                    <div className="h-8 w-8 bg-indigo-300 dark:bg-indigo-700 rounded animate-pulse"></div>
                  </div>
                ) : isAnalyticsError ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Total Customers</p>
                      <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">--</p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400">Data unavailable</p>
                    </div>
                    <UserCircle className="h-8 w-8 text-indigo-600" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Total Customers</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100" data-testid="text-total-customers">
                          {totalCustomers}
                        </p>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(bookingsTrend.direction)}
                          <span className={`text-xs font-medium ${getTrendColor(bookingsTrend.direction)}`}>
                            {bookingsTrend.percentage}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400">
                        {totalBookings} bookings + {totalJobCards} walk-ins/job cards
                      </p>
                      <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1">
                        Today: {todayTotalCustomers} customers ({todayBookings} booked, {todayWalkIns} walk-in)
                      </p>
                    </div>
                    <UserCircle className="h-8 w-8 text-indigo-600" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-teal-50 dark:bg-teal-950" data-testid="card-walkin-stats">
              <CardContent className="p-6">
                {analyticsLoading ? (
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-teal-200 dark:bg-teal-800 rounded animate-pulse"></div>
                      <div className="h-8 w-16 bg-teal-300 dark:bg-teal-700 rounded animate-pulse"></div>
                      <div className="h-3 w-28 bg-teal-200 dark:bg-teal-800 rounded animate-pulse"></div>
                    </div>
                    <div className="h-8 w-8 bg-teal-300 dark:bg-teal-700 rounded animate-pulse"></div>
                  </div>
                ) : isAnalyticsError ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-teal-700 dark:text-teal-300">Walk-in Customers</p>
                      <p className="text-2xl font-bold text-teal-900 dark:text-teal-100">--</p>
                      <p className="text-xs text-teal-600 dark:text-teal-400">Data unavailable</p>
                    </div>
                    <Users className="h-8 w-8 text-teal-600" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-teal-700 dark:text-teal-300">Walk-in Customers</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-teal-900 dark:text-teal-100" data-testid="text-walkin-count">
                          {walkInCount}
                        </p>
                        <span className="text-sm font-medium text-teal-600 dark:text-teal-400">
                          ({formatCurrency(walkInRevenue)})
                        </span>
                      </div>
                      <p className="text-xs text-teal-600 dark:text-teal-400">
                        Walk-in revenue this {selectedPeriod}
                      </p>
                      <p className="text-xs text-teal-500 dark:text-teal-400 mt-1">
                        Today: {todayWalkIns} walk-ins
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-teal-600" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card data-testid="card-cancellation-rate">
              <CardHeader>
                <CardTitle className="text-base">Cancellation Rate</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-2">
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                ) : isAnalyticsError ? (
                  <div>
                    <div className="text-2xl font-bold">--</div>
                    <p className="text-sm text-muted-foreground">Data unavailable</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl font-bold" data-testid="text-cancellation-rate">
                      {overview.cancellationRate || '0.00'}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {overview.cancelledBookings || 0} of {totalBookings} cancelled
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-completion-rate">
              <CardHeader>
                <CardTitle className="text-base">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-2">
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                ) : isAnalyticsError ? (
                  <div>
                    <div className="text-2xl font-bold">--</div>
                    <p className="text-sm text-muted-foreground">Data unavailable</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl font-bold" data-testid="text-completion-rate">
                      {totalBookings > 0 ? ((overview.completedBookings || 0) / totalBookings * 100).toFixed(1) : '0.0'}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {overview.completedBookings || 0} completed bookings
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-confirmed-bookings">
              <CardHeader>
                <CardTitle className="text-base">Confirmed Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-2">
                    <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                ) : isAnalyticsError ? (
                  <div>
                    <div className="text-2xl font-bold">--</div>
                    <p className="text-sm text-muted-foreground">Data unavailable</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl font-bold" data-testid="text-confirmed-bookings">
                      {overview.confirmedBookings || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ready for service delivery
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Popular Services and Staff Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-popular-services">
              <CardHeader>
                <CardTitle className="text-base">Popular Services</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </div>
                        <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : isAnalyticsError ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Unable to load popular services</p>
                  </div>
                ) : analyticsData?.popularServices && analyticsData.popularServices.length > 0 ? (
                  <div className="space-y-3">
                    {analyticsData.popularServices.slice(0, 5).map((service: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{service.serviceName}</p>
                          <p className="text-sm text-muted-foreground">{service.bookingCount} bookings</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(service.realizedRevenuePaisa)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No popular services data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-staff-performance">
              <CardHeader>
                <CardTitle className="text-base">Staff Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </div>
                        <div className="space-y-1">
                          <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : isAnalyticsError ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Unable to load staff performance</p>
                  </div>
                ) : analyticsData?.staffPerformance && analyticsData.staffPerformance.length > 0 ? (
                  <div className="space-y-3">
                    {analyticsData.staffPerformance.slice(0, 5).map((staff: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{staff.staffName}</p>
                          <p className="text-sm text-muted-foreground">{staff.bookingCount} bookings</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(staff.realizedRevenuePaisa)}</p>
                          <p className="text-sm text-muted-foreground">{staff.utilization}% utilization</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No staff performance data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="pt-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              ← Back to Stylemate
            </Link>
          </div>
        </div>
      );
    }

    // Render step components - Unified with BusinessSetup
    const components = {
      'business-info': BusinessInfoStep,
      'location-contact': LocationContactStep,
      'services': PremiumServicesStep,
      'staff': StaffStep,
      'resources': ResourcesStep,
      'booking-settings': BookingSettingsStep,
      'payment-setup': PaymentSetupStep,
      'media': MediaStep,
      'publish': ReviewPublishStep
    };

    // Handle analytics tab
    if (activeTab === "analytics") {
      return (
        <div className="p-6">
          <AdvancedAnalyticsDashboard salonId={salonId || ''} />
        </div>
      );
    }

    // Handle ML analytics tab
    if (activeTab === "ml-analytics") {
      return (
        <div className="p-6">
          <MLAnalyticsDashboard salonId={salonId || ''} />
        </div>
      );
    }

    // Handle financials tab
    if (activeTab === "financials") {
      return (
        <div className="p-6">
          <FinancialReportingDashboard 
            salonId={salonId || ''} 
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </div>
      );
    }

    // Handle commissions tab
    if (activeTab === "commissions") {
      return (
        <div className="p-6">
          <CommissionManagement salonId={salonId || ''} />
        </div>
      );
    }

    // Handle payroll overview tab
    if (activeTab === "payroll-overview") {
      return (
        <div className="p-6">
          <PayrollOverview salonId={salonId || ''} />
        </div>
      );
    }

    // Handle salary management tab
    if (activeTab === "salary-management") {
      return (
        <div className="p-6">
          <SalaryManagement salonId={salonId || ''} />
        </div>
      );
    }

    // Handle leave management tab
    if (activeTab === "leave-management") {
      return (
        <div className="p-6">
          <LeaveManagement salonId={salonId || ''} />
        </div>
      );
    }

    // Handle payroll runs tab
    if (activeTab === "payroll-runs") {
      return (
        <div className="p-6">
          <PayrollRuns salonId={salonId || ''} />
        </div>
      );
    }

    // Handle staff onboarding tab
    if (activeTab === "staff-onboarding") {
      return (
        <div className="p-6">
          <StaffOnboarding salonId={salonId || ''} />
        </div>
      );
    }

    // Handle staff exit tab
    if (activeTab === "staff-exit") {
      return (
        <div className="p-6">
          <StaffExit salonId={salonId || ''} />
        </div>
      );
    }

    // Handle chat inbox tab
    if (activeTab === "chat-inbox") {
      return (
        <div className="p-6 h-[calc(100vh-120px)]">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-purple-600" />
                Chat Inbox
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-60px)]">
              {user?.id && salonId ? (
                <ChatInbox
                  salonId={salonId}
                  staffId={user.id}
                  userId={user.id}
                  userName={user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email || 'Staff'}
                  authToken=""
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Loading chat inbox...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    // Handle communications tab
    if (activeTab === "communications") {
      return (
        <div className="p-6">
          <CustomerCommunicationDashboard 
            salonId={salonId || ''} 
            selectedPeriod={selectedPeriod}
          />
        </div>
      );
    }

    // Handle customer import tab
    if (activeTab === "customer-import") {
      return (
        <div className="p-6">
          <CustomerImportDashboard salonId={salonId || ''} />
        </div>
      );
    }

    // Handle invitation campaigns tab
    if (activeTab === "campaigns") {
      return (
        <div className="p-6">
          <CampaignDashboard salonId={salonId || ''} />
        </div>
      );
    }

    // Handle inventory tab
    if (activeTab === "inventory") {
      return (
        <div className="p-6">
          <InventoryManagementDashboard salonId={salonId || ''} />
        </div>
      );
    }

    // Handle beauty catalog tab
    if (activeTab === "beauty-catalog") {
      return (
        <BeautyProductCatalog salonId={salonId || ''} />
      );
    }

    // Handle packages tab
    if (activeTab === "packages") {
      return (
        <div className="p-6">
          <PackageManagement salonId={salonId || ''} />
        </div>
      );
    }

    // Handle memberships tab
    if (activeTab === "memberships") {
      return (
        <div className="p-6">
          <MembershipManagement salonId={salonId || ''} />
        </div>
      );
    }

    // Handle client profiles tab
    if (activeTab === "client-profiles") {
      return (
        <div className="p-6">
          <ClientProfilesManagement salonId={salonId || ''} />
        </div>
      );
    }

    // Handle offers tab
    if (activeTab === "offers") {
      return (
        <div className="p-6">
          <BusinessOffers salonId={salonId || ''} />
        </div>
      );
    }

    // Handle calendar tab
    if (activeTab === "calendar") {
      return (
        <div className="p-6">
          <CalendarManagement salonId={salonId || ''} />
        </div>
      );
    }

    // Handle shop admins tab - Business Owner only
    if (activeTab === "shop-admins") {
      if (!isBusinessOwner) {
        return (
          <div className="p-6">
            <Alert>
              <AlertDescription>
                You don't have permission to access this section. Only business owners can manage shop administrators.
              </AlertDescription>
            </Alert>
          </div>
        );
      }
      return (
        <div className="p-6">
          <ShopAdminManagement salonId={salonId || ''} />
        </div>
      );
    }

    // Handle notifications settings tab
    if (activeTab === "notifications-settings") {
      return (
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center">
              <Bell className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Notification Settings</h2>
              <p className="text-sm text-muted-foreground">Manage how you receive alerts and updates</p>
            </div>
          </div>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive booking confirmations via email</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">Get text alerts for new bookings</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Browser push notifications for updates</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Daily Summary Email</p>
                  <p className="text-sm text-muted-foreground">Receive a daily summary of bookings</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Handle security settings tab
    if (activeTab === "security-settings") {
      return (
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center">
              <Shield className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Security Settings</h2>
              <p className="text-sm text-muted-foreground">Protect your account and data</p>
            </div>
          </div>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add extra security to your account</p>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Change Password</p>
                  <p className="text-sm text-muted-foreground">Update your account password</p>
                </div>
                <Button variant="outline" size="sm">Change</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Active Sessions</p>
                  <p className="text-sm text-muted-foreground">Manage devices logged into your account</p>
                </div>
                <Button variant="outline" size="sm">View</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Handle subscription settings tab
    if (activeTab === "subscription-settings") {
      return (
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center">
              <Crown className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Subscription & Billing</h2>
              <p className="text-sm text-muted-foreground">Manage your plan and payment methods</p>
            </div>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium text-lg">Current Plan</p>
                  <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white mt-1">Professional</Badge>
                </div>
                <Button className="bg-gradient-to-r from-violet-500 to-purple-500">Upgrade Plan</Button>
              </div>
              <Separator className="my-4" />
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Next billing date</span>
                  <span className="font-medium">January 1, 2026</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment method</span>
                  <span className="font-medium">•••• 4242</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Handle integrations settings tab
    if (activeTab === "integrations-settings") {
      return (
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center">
              <Cog className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Integrations</h2>
              <p className="text-sm text-muted-foreground">Connect your favorite apps and services</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded bg-blue-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Google Calendar</p>
                    <p className="text-xs text-muted-foreground">Sync appointments</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded bg-green-100 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">WhatsApp</p>
                    <p className="text-xs text-muted-foreground">Send reminders</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded bg-purple-100 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Razorpay</p>
                    <p className="text-xs text-muted-foreground">Accept payments</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-700">Connected</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded bg-pink-100 flex items-center justify-center">
                    <Camera className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="font-medium">Instagram</p>
                    <p className="text-xs text-muted-foreground">Share your work</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // Handle account settings tab
    if (activeTab === "account-settings") {
      return (
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center">
              <UserCircle className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Account Settings</h2>
              <p className="text-sm text-muted-foreground">Manage your personal account information</p>
            </div>
          </div>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="account-email">Email Address</Label>
                  <Input id="account-email" defaultValue={user?.email || ''} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-phone">Phone Number</Label>
                  <Input id="account-phone" defaultValue={user?.phone || ''} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="account-firstname">First Name</Label>
                  <Input id="account-firstname" defaultValue={user?.firstName || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-lastname">Last Name</Label>
                  <Input id="account-lastname" defaultValue={user?.lastName || ''} />
                </div>
              </div>
              <div className="pt-4">
                <Button className="bg-gradient-to-r from-violet-500 to-purple-500">Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Handle event management tabs - render in sidebar layout
    if (activeTab === "events-dashboard") {
      return <EventDashboard />;
    }
    if (activeTab === "create-event") {
      return <CreateEvent />;
    }
    if (activeTab === "draft-events") {
      return <DraftEvents />;
    }
    if (activeTab === "past-events") {
      return <PastEvents />;
    }

    const Component = components[activeTab as keyof typeof components];
    if (Component && salonId) {
      return (
        <div className="p-6">
          <Component
            salonId={salonId}
            onComplete={handleStepComplete}
            isCompleted={false}
          />
        </div>
      );
    }

    return <div className="p-6">Content not found</div>;
  };

  return (
    <div className="h-screen bg-background flex w-full overflow-hidden">
      {/* Fresha-Style Icon Sidebar - Desktop */}
      <div className="hidden md:block">
        <BusinessIconSidebar
          sections={iconSidebarSections}
          activeTab={activeTab}
          onNavigate={handleNavigation}
          salonName={salonData?.name}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          user={user}
          onLogout={logout}
        />
      </div>
      
      {/* Main Content */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
        }`}
      >
        {/* Premium Header with User Name */}
        <header className="flex h-16 items-center justify-between gap-4 border-b bg-white px-4 md:px-6 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <MobileNavigation />
            </div>
            
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-gray-900">
                    {salonData?.name || 'Your Business'}
                  </h1>
                  <div className="h-2 w-2 rounded-full bg-green-500" title="Online" />
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-violet-500" />
                  {salonData?.city || 'Location'}
                </p>
              </div>
            </div>
          </div>

            {/* Salon Selector Dropdown */}
            {Array.isArray(salons) && salons.length > 0 && (
              <div className="flex items-center gap-2">
                <Select value={salonId || undefined} onValueChange={handleSalonSwitch}>
                  <SelectTrigger className="w-[200px] md:w-[280px] bg-white border-violet-200 hover:border-violet-300 focus:ring-violet-500" data-testid="dropdown-salon-selector">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-violet-500" />
                      <SelectValue placeholder="Select salon location">
                        {salonData?.name || 'Select salon...'}
                      </SelectValue>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {salons.map((salon: Salon) => (
                      <SelectItem 
                        key={salon.id} 
                        value={salon.id}
                        data-testid={`salon-option-${salon.id}`}
                      >
                        <div className="flex items-center justify-between gap-3 w-full">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-violet-500" />
                            <span className="font-medium">{salon.name}</span>
                          </div>
                          {salon.id === salonId && (
                            <Check className="h-4 w-4 text-violet-600" />
                          )}
                        </div>
                        {salon.city && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {salon.city}
                          </p>
                        )}
                      </SelectItem>
                    ))}
                    <div className="border-t my-1" />
                    <SelectItem value="__create_new__" data-testid="button-create-new-salon">
                      <div className="flex items-center gap-2 text-violet-600 font-medium">
                        <Plus className="h-4 w-4" />
                        <span>Create New Salon</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              {completionPercentage === 100 && (
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md hidden md:flex">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Setup Complete
                </Badge>
              )}
              {completionPercentage < 100 && (
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 hidden md:flex">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {Math.round(completionPercentage)}% Complete
                </Badge>
              )}
              {salonId && (
                <ChatNotificationBadge 
                  salonId={salonId}
                  onOpenChat={() => setActiveTab("chat-inbox")}
                  onSelectConversation={(convId) => {
                    setActiveTab("chat-inbox");
                  }}
                />
              )}
              
              {/* Settings Link */}
              <Link href={`/business/settings/${salonId}`}>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-violet-100" data-testid="button-settings">
                  <Settings className="h-4 w-4 text-slate-600" />
                </Button>
              </Link>
            </div>
          </header>

          {/* Disabled Salon Warning Banner */}
          {salonData?.isActive === 0 && (
            <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              <div className="text-center">
                <span className="font-semibold">Your salon has been disabled by the platform administrator.</span>
                <span className="ml-2 text-red-100">Your salon is hidden from customers and cannot receive new bookings. Please contact support for more information.</span>
              </div>
            </div>
          )}

          {/* Pending Approval Warning Banner */}
          {salonData?.approvalStatus === 'pending' && (
            <div className="bg-amber-500 text-white px-4 py-3 flex items-center justify-center gap-3">
              <Clock className="h-5 w-5" />
              <div className="text-center">
                <span className="font-semibold">Your salon is pending approval.</span>
                <span className="ml-2 text-amber-100">Your salon is not yet visible to customers. We'll notify you once it's approved.</span>
              </div>
            </div>
          )}

          {/* Rejected Salon Warning Banner */}
          {salonData?.approvalStatus === 'rejected' && (
            <div className="bg-red-700 text-white px-4 py-3 flex items-center justify-center gap-3">
              <Ban className="h-5 w-5" />
              <div className="text-center">
                <span className="font-semibold">Your salon registration was rejected.</span>
                <span className="ml-2 text-red-100">
                  {salonData?.rejectionReason || 'Please contact support for more information.'}
                </span>
              </div>
            </div>
          )}

          {/* Content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="min-h-full">
              {renderTabContent()}
            </div>
          </main>
        </div>

        {/* Delete Salon Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Salon</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{salonToDelete?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setSalonToDelete(null);
                }}
                data-testid="button-cancel-delete"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (salonToDelete) {
                    deleteSalonMutation.mutate(salonToDelete.id);
                  }
                }}
                disabled={deleteSalonMutation.isPending}
                data-testid="button-confirm-delete"
              >
                {deleteSalonMutation.isPending ? "Deleting..." : "Delete Salon"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}
