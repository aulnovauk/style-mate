import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, User, Scissors, MapPin, Loader2, AlertCircle } from "lucide-react";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: string;
    salonId: string;
    salonName: string;
    serviceId: string;
    serviceName: string;
    staffId: string;
    staffName: string;
    bookingDate: string;
    bookingTime: string;
    duration: number;
  };
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export function RescheduleModal({ isOpen, onClose, appointment }: RescheduleModalProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    if (selectedDate && appointment.salonId) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, appointment.salonId]);

  const fetchAvailableSlots = async (date: Date) => {
    setLoadingSlots(true);
    setSelectedTime(null);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const response = await fetch(
        `/api/salons/${appointment.salonId}/available-slots?date=${dateStr}&serviceId=${appointment.serviceId}${appointment.staffId ? `&staffId=${appointment.staffId}` : ""}`,
        { credentials: "include" }
      );
      
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots || []);
      } else {
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error("Error fetching available slots:", error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Select date and time",
        description: "Please select a new date and time for your appointment.",
        variant: "destructive",
      });
      return;
    }

    setRescheduling(true);
    try {
      const response = await fetch(
        `/api/customer/appointments/${appointment.id}/reschedule`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            bookingDate: format(selectedDate, "yyyy-MM-dd"),
            bookingTime: selectedTime,
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Appointment rescheduled",
          description: `Your ${appointment.serviceName} appointment has been moved to ${format(selectedDate, "EEEE, MMMM d, yyyy")} at ${formatTime12Hour(selectedTime)}.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/customer/appointments?status=upcoming"] });
        queryClient.invalidateQueries({ queryKey: ["/api/customer/appointments?status=history"] });
        queryClient.invalidateQueries({ queryKey: ["/api/customer/appointments"] });
        onClose();
      } else {
        const error = await response.json();
        toast({
          title: "Reschedule failed",
          description: error.error || "Could not reschedule your appointment. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      toast({
        title: "Reschedule failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRescheduling(false);
    }
  };

  const disabledDays = (date: Date) => {
    return isBefore(date, startOfDay(new Date()));
  };

  const formatTime12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const availableSlotsFiltered = availableSlots.filter((slot) => slot.available);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Reschedule Appointment
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 overflow-y-auto max-h-[60vh]">
          <Card className="bg-muted/50 mb-4">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Scissors className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{appointment.serviceName}</span>
                <Badge variant="secondary" className="ml-auto">{appointment.duration} min</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{appointment.salonName}</span>
              </div>
              {appointment.staffName && appointment.staffName !== "Not assigned" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>with {appointment.staffName}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1 border-t">
                <CalendarIcon className="h-4 w-4" />
                <span>Current: {appointment.bookingDate} at {appointment.bookingTime}</span>
              </div>
            </CardContent>
          </Card>

          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Select New Date</h3>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={disabledDays}
                className="rounded-md border"
                fromDate={new Date()}
                toDate={addDays(new Date(), 60)}
              />
            </div>
          </div>

          {selectedDate && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Available Times for {format(selectedDate, "EEEE, MMM d")}
              </h3>
              
              {loadingSlots ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading available times...</span>
                </div>
              ) : availableSlotsFiltered.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {availableSlotsFiltered.map((slot) => (
                    <Button
                      key={slot.time}
                      variant={selectedTime === slot.time ? "default" : "outline"}
                      size="sm"
                      className={`text-xs ${
                        selectedTime === slot.time 
                          ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" 
                          : "hover:bg-primary/10 hover:border-primary"
                      }`}
                      onClick={() => setSelectedTime(slot.time)}
                    >
                      {formatTime12Hour(slot.time)}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>No available slots on this date. Please select another date.</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 pt-4 border-t bg-background">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={onClose} 
            disabled={rescheduling}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleReschedule}
            disabled={!selectedDate || !selectedTime || rescheduling}
          >
            {rescheduling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rescheduling...
              </>
            ) : (
              "Confirm Reschedule"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
