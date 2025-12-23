import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  UserCheck,
  Play,
  ShoppingBag,
  CreditCard,
  Eye,
  X,
  CheckCircle,
  Clock,
  UserX,
  MoreHorizontal,
  Move,
  Package
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DisplayStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'arrived' 
  | 'in_service' 
  | 'pending_checkout' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show';

interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingDate: string;
  bookingTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalAmountPaisa: number;
  currency: string;
  notes?: string;
  serviceName?: string;
  staffName?: string;
  staffId?: string;
  serviceDuration?: number;
  jobCardId?: string | null;
  jobCardStatus?: 'open' | 'in_service' | 'pending_checkout' | 'completed' | 'cancelled' | 'no_show' | null;
}

interface AppointmentQuickMenuProps {
  booking: Booking;
  salonId: string;
  displayStatus: DisplayStatus;
  onViewDetails: () => void;
  onOpenJobCard?: (jobCardId: string) => void;
  onMoveBooking?: () => void;
  onAddProduct?: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
  compact?: boolean;
}

export function AppointmentQuickMenu({
  booking,
  salonId,
  displayStatus,
  onViewDetails,
  onOpenJobCard,
  onMoveBooking,
  onAddProduct,
  position = 'top',
  compact = false
}: AppointmentQuickMenuProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          bookingId: booking.id,
          customerName: booking.customerName, 
          customerPhone: booking.customerPhone,
          checkInMethod: 'manual'
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to check in');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'job-cards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'bookings'] });
      toast({
        title: "Checked In",
        description: `Job card ${data.jobCard.jobCardNumber} created`
      });
      if (onOpenJobCard && data.jobCard?.id) {
        onOpenJobCard(data.jobCard.id);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Check-in Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateJobCardStatus = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      const response = await fetch(`/api/salons/${salonId}/job-cards/${booking.jobCardId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update status');
      }
      return response.json();
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'job-cards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'bookings'] });
      const statusMessages: Record<string, string> = {
        'in_service': 'Service started',
        'pending_checkout': 'Ready for checkout',
        'completed': 'Service completed',
        'no_show': 'Marked as no-show'
      };
      toast({
        title: "Status Updated",
        description: statusMessages[status] || 'Status updated successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateBookingStatus = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      const response = await fetch(`/api/salons/${salonId}/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update booking');
      }
      return response.json();
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'bookings'] });
      const statusMessages: Record<string, string> = {
        'confirmed': 'Booking confirmed',
        'cancelled': 'Booking cancelled',
        'completed': 'Booking completed'
      };
      toast({
        title: "Booking Updated",
        description: statusMessages[status] || 'Booking updated successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleAction = async (action: string) => {
    setIsLoading(action);
    try {
      switch (action) {
        case 'check-in':
          await checkInMutation.mutateAsync();
          break;
        case 'start-service':
          await updateJobCardStatus.mutateAsync({ status: 'in_service' });
          break;
        case 'ready-checkout':
          await updateJobCardStatus.mutateAsync({ status: 'pending_checkout' });
          break;
        case 'complete':
          if (booking.jobCardId) {
            await updateJobCardStatus.mutateAsync({ status: 'completed' });
          } else {
            await updateBookingStatus.mutateAsync({ status: 'completed' });
          }
          break;
        case 'confirm':
          await updateBookingStatus.mutateAsync({ status: 'confirmed' });
          break;
        case 'cancel':
          await updateBookingStatus.mutateAsync({ status: 'cancelled' });
          break;
        case 'no-show':
          if (booking.jobCardId) {
            await updateJobCardStatus.mutateAsync({ status: 'no_show' });
          }
          break;
        case 'move':
          if (onMoveBooking) {
            onMoveBooking();
          }
          break;
        case 'add-product':
          if (onAddProduct) {
            onAddProduct();
          } else if (booking.jobCardId && onOpenJobCard) {
            onOpenJobCard(booking.jobCardId);
            toast({
              title: "Add Product",
              description: "Opening job card to add products..."
            });
          }
          break;
      }
    } finally {
      setIsLoading(null);
    }
  };

  const getAvailableActions = () => {
    const actions: { id: string; icon: typeof UserCheck; label: string; variant?: 'default' | 'destructive' }[] = [];
    const isDraggable = ['pending', 'confirmed'].includes(booking.status) && !booking.jobCardId;
    const canAddProduct = onAddProduct || (booking.jobCardId && onOpenJobCard);
    
    switch (displayStatus) {
      case 'pending':
        actions.push({ id: 'confirm', icon: CheckCircle, label: 'Confirm' });
        actions.push({ id: 'check-in', icon: UserCheck, label: 'Check-in' });
        if (isDraggable && onMoveBooking) {
          actions.push({ id: 'move', icon: Move, label: 'Reschedule' });
        }
        actions.push({ id: 'cancel', icon: X, label: 'Cancel', variant: 'destructive' });
        break;
      case 'confirmed':
        actions.push({ id: 'check-in', icon: UserCheck, label: 'Check-in' });
        if (isDraggable && onMoveBooking) {
          actions.push({ id: 'move', icon: Move, label: 'Reschedule' });
        }
        actions.push({ id: 'cancel', icon: X, label: 'Cancel', variant: 'destructive' });
        break;
      case 'arrived':
        actions.push({ id: 'start-service', icon: Play, label: 'Start Service' });
        if (canAddProduct) {
          actions.push({ id: 'add-product', icon: Package, label: 'Add Product' });
        }
        actions.push({ id: 'no-show', icon: UserX, label: 'No-show', variant: 'destructive' });
        break;
      case 'in_service':
        if (canAddProduct) {
          actions.push({ id: 'add-product', icon: Package, label: 'Add Product' });
        }
        actions.push({ id: 'ready-checkout', icon: CreditCard, label: 'Ready for Checkout' });
        break;
      case 'pending_checkout':
        if (canAddProduct) {
          actions.push({ id: 'add-product', icon: Package, label: 'Add Product' });
        }
        actions.push({ id: 'complete', icon: CheckCircle, label: 'Complete' });
        break;
    }
    
    return actions;
  };

  const actions = getAvailableActions();
  const isPending = checkInMutation.isPending || updateJobCardStatus.isPending || updateBookingStatus.isPending;

  if (compact) {
    return (
      <TooltipProvider delayDuration={100}>
        <div 
          className="absolute -top-2 -right-2 flex items-center gap-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-lg shadow-xl border-2 border-white dark:border-slate-800 px-2 py-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 scale-95 group-hover:scale-100"
          onClick={(e) => e.stopPropagation()}
        >
          {actions.slice(0, 2).map((action) => (
            <Tooltip key={action.id}>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-7 w-7 p-0 rounded-md text-white ${
                    action.variant === 'destructive' 
                      ? 'hover:bg-red-500/30' 
                      : 'hover:bg-white/20'
                  }`}
                  onClick={() => handleAction(action.id)}
                  disabled={isPending}
                >
                  <action.icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs font-medium">
                {action.label}
              </TooltipContent>
            </Tooltip>
          ))}
          
          {(actions.length > 2 || displayStatus !== 'completed') && (
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 rounded-md text-white hover:bg-white/20"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  More actions
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="min-w-[140px]">
                <DropdownMenuItem onClick={onViewDetails}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {actions.slice(2).map((action) => (
                  <DropdownMenuItem 
                    key={action.id}
                    onClick={() => handleAction(action.id)}
                    className={action.variant === 'destructive' ? 'text-red-600 focus:text-red-600' : ''}
                  >
                    <action.icon className="h-4 w-4 mr-2" />
                    {action.label}
                  </DropdownMenuItem>
                ))}
                {actions.length <= 2 && displayStatus !== 'completed' && displayStatus !== 'cancelled' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleAction('cancel')}
                      className="text-red-600 focus:text-red-600"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel Booking
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div 
        className={`absolute ${
          position === 'top' ? '-top-10 left-1/2 -translate-x-1/2' :
          position === 'bottom' ? '-bottom-10 left-1/2 -translate-x-1/2' :
          position === 'left' ? 'left-0 -translate-x-full top-1/2 -translate-y-1/2 mr-2' :
          'right-0 translate-x-full top-1/2 -translate-y-1/2 ml-2'
        } flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-50`}
        onClick={(e) => e.stopPropagation()}
      >
        {actions.map((action) => (
          <Tooltip key={action.id}>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={action.variant === 'destructive' ? 'ghost' : 'ghost'}
                className={`h-8 w-8 p-0 rounded-md ${
                  action.variant === 'destructive' 
                    ? 'hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30' 
                    : 'hover:bg-violet-100 hover:text-violet-600 dark:hover:bg-violet-900/30'
                }`}
                onClick={() => handleAction(action.id)}
                disabled={isPending}
              >
                {isLoading === action.id ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <action.icon className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs font-medium">
              {action.label}
            </TooltipContent>
          </Tooltip>
        ))}
        
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={onViewDetails}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs font-medium">
            View Details
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export default AppointmentQuickMenu;
