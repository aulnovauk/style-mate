/**
 * Stylemate - Business Mobile App API Routes
 * 
 * APIs for salon staff/owners mobile app:
 * - Dashboard stats (revenue, appointments, clients)
 * - Today's appointments
 * - Calendar view with date navigation
 * - Appointment management (create, update status)
 */

import type { Express, Response, Request } from "express";
import { db } from "../db";
import { bookings, services, salons, staff, users, userRoles, staffPayrollCycles, staffPayrollEntries, staffSalaryComponents, staffEmploymentProfiles } from "@shared/schema";
import { eq, and, sql, desc, gte, lte, asc, inArray, count, sum } from "drizzle-orm";
import { authenticateMobileUser } from "../middleware/authMobile";
import { z } from "zod";

// Validation schemas
const dateQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const createBookingSchema = z.object({
  clientId: z.string().optional(),
  clientName: z.string().min(1),
  clientPhone: z.string().min(10),
  clientEmail: z.string().email().optional(),
  serviceIds: z.array(z.string()).min(1),
  staffId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().optional(),
  paymentMethod: z.enum(['cash', 'card', 'upi']).default('cash'),
  isWalkIn: z.boolean().default(false),
});

const updateBookingStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']),
  notes: z.string().optional(),
});

const checkoutItemSchema = z.object({
  id: z.string(),
  type: z.enum(['service', 'product']),
  quantity: z.number().int().min(1).max(100),
});

const checkoutDiscountSchema = z.object({
  type: z.enum(['percentage', 'fixed']),
  value: z.number().min(0),
  code: z.string().optional(),
  reason: z.string().optional(),
}).refine(
  (data) => data.type !== 'percentage' || data.value <= 100,
  { message: 'Percentage discount cannot exceed 100%' }
);

const checkoutSchema = z.object({
  bookingId: z.string().optional(),
  clientName: z.string().min(1, 'Client name is required'),
  clientPhone: z.string().min(10, 'Valid phone number required'),
  items: z.array(checkoutItemSchema).min(1, 'At least one item required'),
  paymentMethod: z.enum(['cash', 'card', 'upi', 'wallet', 'savedCard', 'split']),
  discount: checkoutDiscountSchema.optional(),
  tipAmount: z.number().min(0).max(100000).optional(),
  notes: z.string().max(500).optional(),
});

// Helper to get user's salon access
async function getUserSalonId(userId: string): Promise<string | null> {
  // Check if user is staff at any salon
  const staffRecord = await db.query.staff.findFirst({
    where: and(
      eq(staff.userId, userId),
      eq(staff.isActive, 1)
    ),
  });

  if (staffRecord) {
    return staffRecord.salonId;
  }

  // Check if user owns any salon
  const ownedSalon = await db.query.salons.findFirst({
    where: eq(salons.ownerId, userId),
  });

  return ownedSalon?.id || null;
}

// Helper to format currency
function formatCurrency(paisa: number): string {
  return `₹${(paisa / 100).toLocaleString('en-IN')}`;
}

// Helper to calculate percentage change
function calculateChange(current: number, previous: number): { value: number; isPositive: boolean } {
  if (previous === 0) return { value: current > 0 ? 100 : 0, isPositive: current >= 0 };
  const change = ((current - previous) / previous) * 100;
  return { value: Math.abs(Math.round(change)), isPositive: change >= 0 };
}

export function registerMobileBusinessRoutes(app: Express) {
  
  /**
   * GET /api/mobile/business/dashboard
   * Get dashboard overview stats for today
   */
  app.get("/api/mobile/business/dashboard", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      // Get start of current week (Monday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - daysFromMonday);
      const weekStartDate = weekStart.toISOString().split('T')[0];
      
      // Last week start
      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekStartDate = lastWeekStart.toISOString().split('T')[0];
      const lastWeekEndDate = new Date(lastWeekStart);
      lastWeekEndDate.setDate(lastWeekEndDate.getDate() + 6);
      const lastWeekEnd = lastWeekEndDate.toISOString().split('T')[0];

      // Today's appointments
      const todayAppointments = await db.select()
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          eq(bookings.bookingDate, today)
        ))
        .orderBy(asc(bookings.bookingTime));

      // Yesterday's appointments for comparison
      const yesterdayAppointments = await db.select()
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          eq(bookings.bookingDate, yesterday)
        ));

      // This week revenue
      const thisWeekBookings = await db.select()
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          gte(bookings.bookingDate, weekStartDate),
          lte(bookings.bookingDate, today),
          eq(bookings.status, 'completed')
        ));

      // Last week revenue
      const lastWeekBookings = await db.select()
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          gte(bookings.bookingDate, lastWeekStartDate),
          lte(bookings.bookingDate, lastWeekEnd),
          eq(bookings.status, 'completed')
        ));

      // Calculate stats
      const todayCount = todayAppointments.length;
      const yesterdayCount = yesterdayAppointments.length;
      
      const todayRevenue = todayAppointments
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.finalAmountPaisa || b.totalAmountPaisa || 0), 0);
      
      const yesterdayRevenue = yesterdayAppointments
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.finalAmountPaisa || b.totalAmountPaisa || 0), 0);

      const thisWeekRevenue = thisWeekBookings
        .reduce((sum, b) => sum + (b.finalAmountPaisa || b.totalAmountPaisa || 0), 0);
      
      const lastWeekRevenue = lastWeekBookings
        .reduce((sum, b) => sum + (b.finalAmountPaisa || b.totalAmountPaisa || 0), 0);

      // Unique clients today
      const todayClients = new Set(todayAppointments.map(b => b.customerPhone)).size;
      const yesterdayClients = new Set(yesterdayAppointments.map(b => b.customerPhone)).size;

      // Completed appointments
      const completedToday = todayAppointments.filter(b => b.status === 'completed').length;
      const pendingToday = todayAppointments.filter(b => ['pending', 'confirmed'].includes(b.status)).length;

      // Get salon info
      const salon = await db.query.salons.findFirst({
        where: eq(salons.id, salonId),
      });

      // Weekly revenue breakdown for chart (last 7 days)
      const revenueByDay: { day: string; revenue: number; date: string }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const dayBookings = await db.select()
          .from(bookings)
          .where(and(
            eq(bookings.salonId, salonId),
            eq(bookings.bookingDate, dateStr),
            eq(bookings.status, 'completed')
          ));
        
        const dayRevenue = dayBookings.reduce((sum, b) => sum + (b.finalAmountPaisa || b.totalAmountPaisa || 0), 0);
        revenueByDay.push({ day: dayName, revenue: dayRevenue / 100, date: dateStr });
      }

      res.json({
        salon: {
          id: salon?.id,
          name: salon?.name,
          logo: salon?.logoUrl,
        },
        stats: {
          todayAppointments: {
            value: todayCount,
            change: calculateChange(todayCount, yesterdayCount),
            completed: completedToday,
            pending: pendingToday,
          },
          todayRevenue: {
            value: todayRevenue,
            formatted: formatCurrency(todayRevenue),
            change: calculateChange(todayRevenue, yesterdayRevenue),
          },
          weeklyRevenue: {
            value: thisWeekRevenue,
            formatted: formatCurrency(thisWeekRevenue),
            change: calculateChange(thisWeekRevenue, lastWeekRevenue),
          },
          todayClients: {
            value: todayClients,
            change: calculateChange(todayClients, yesterdayClients),
          },
        },
        revenueChart: revenueByDay,
        todayDate: today,
      });
    } catch (error) {
      console.error("Dashboard API error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  /**
   * GET /api/mobile/business/appointments/today
   * Get today's appointments with details
   */
  app.get("/api/mobile/business/appointments/today", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      const today = new Date().toISOString().split('T')[0];

      const appointments = await db.select({
        id: bookings.id,
        customerName: bookings.customerName,
        customerPhone: bookings.customerPhone,
        customerEmail: bookings.customerEmail,
        bookingDate: bookings.bookingDate,
        bookingTime: bookings.bookingTime,
        status: bookings.status,
        totalAmount: bookings.totalAmountPaisa,
        finalAmount: bookings.finalAmountPaisa,
        notes: bookings.notes,
        staffId: bookings.staffId,
        serviceId: bookings.serviceId,
        createdAt: bookings.createdAt,
      })
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          eq(bookings.bookingDate, today)
        ))
        .orderBy(asc(bookings.bookingTime));

      // Enrich with service and staff details
      const enrichedAppointments = await Promise.all(appointments.map(async (apt) => {
        const service = await db.query.services.findFirst({
          where: eq(services.id, apt.serviceId),
        });
        
        let staffMember = null;
        if (apt.staffId) {
          staffMember = await db.query.staff.findFirst({
            where: eq(staff.id, apt.staffId),
          });
        }

        return {
          ...apt,
          service: service ? {
            id: service.id,
            name: service.name,
            duration: service.durationMinutes,
            price: service.priceInPaisa,
          } : null,
          staff: staffMember ? {
            id: staffMember.id,
            name: staffMember.name,
            photoUrl: staffMember.photoUrl,
          } : null,
          amountFormatted: formatCurrency(apt.finalAmount || apt.totalAmount),
        };
      }));

      // Group by time slots
      const byHour: Record<string, typeof enrichedAppointments> = {};
      enrichedAppointments.forEach(apt => {
        const hour = apt.bookingTime.split(':')[0];
        const key = `${hour}:00`;
        if (!byHour[key]) byHour[key] = [];
        byHour[key].push(apt);
      });

      res.json({
        date: today,
        total: appointments.length,
        appointments: enrichedAppointments,
        byHour,
      });
    } catch (error) {
      console.error("Today appointments API error:", error);
      res.status(500).json({ error: "Failed to fetch today's appointments" });
    }
  });

  /**
   * GET /api/mobile/business/calendar
   * Get appointments for calendar view (date range)
   */
  app.get("/api/mobile/business/calendar", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      const { startDate, endDate } = req.query;
      
      // Default to current week if no dates provided
      const now = new Date();
      const defaultStart = new Date(now);
      defaultStart.setDate(now.getDate() - now.getDay());
      const defaultEnd = new Date(defaultStart);
      defaultEnd.setDate(defaultStart.getDate() + 6);
      
      const start = startDate as string || defaultStart.toISOString().split('T')[0];
      const end = endDate as string || defaultEnd.toISOString().split('T')[0];

      const appointments = await db.select({
        id: bookings.id,
        customerName: bookings.customerName,
        customerPhone: bookings.customerPhone,
        bookingDate: bookings.bookingDate,
        bookingTime: bookings.bookingTime,
        status: bookings.status,
        totalAmount: bookings.totalAmountPaisa,
        finalAmount: bookings.finalAmountPaisa,
        notes: bookings.notes,
        staffId: bookings.staffId,
        serviceId: bookings.serviceId,
      })
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          gte(bookings.bookingDate, start),
          lte(bookings.bookingDate, end)
        ))
        .orderBy(asc(bookings.bookingDate), asc(bookings.bookingTime));

      // Enrich with service and staff details
      const enrichedAppointments = await Promise.all(appointments.map(async (apt) => {
        const service = await db.query.services.findFirst({
          where: eq(services.id, apt.serviceId),
        });
        
        let staffMember = null;
        if (apt.staffId) {
          staffMember = await db.query.staff.findFirst({
            where: eq(staff.id, apt.staffId),
          });
        }

        return {
          ...apt,
          service: service ? {
            id: service.id,
            name: service.name,
            duration: service.durationMinutes,
            category: service.category,
          } : null,
          staff: staffMember ? {
            id: staffMember.id,
            name: staffMember.name,
            photoUrl: staffMember.photoUrl,
          } : null,
        };
      }));

      // Group by date
      const byDate: Record<string, typeof enrichedAppointments> = {};
      enrichedAppointments.forEach(apt => {
        if (!byDate[apt.bookingDate]) byDate[apt.bookingDate] = [];
        byDate[apt.bookingDate].push(apt);
      });

      // Count per date for calendar dots
      const dateCounts: Record<string, number> = {};
      Object.keys(byDate).forEach(date => {
        dateCounts[date] = byDate[date].length;
      });

      res.json({
        startDate: start,
        endDate: end,
        total: appointments.length,
        appointments: enrichedAppointments,
        byDate,
        dateCounts,
      });
    } catch (error) {
      console.error("Calendar API error:", error);
      res.status(500).json({ error: "Failed to fetch calendar data" });
    }
  });

  /**
   * GET /api/mobile/business/appointments/:date
   * Get appointments for a specific date (timeline view)
   */
  app.get("/api/mobile/business/appointments/:date", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      const { date } = req.params;
      
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }

      const appointments = await db.select({
        id: bookings.id,
        customerName: bookings.customerName,
        customerPhone: bookings.customerPhone,
        customerEmail: bookings.customerEmail,
        bookingDate: bookings.bookingDate,
        bookingTime: bookings.bookingTime,
        status: bookings.status,
        totalAmount: bookings.totalAmountPaisa,
        finalAmount: bookings.finalAmountPaisa,
        notes: bookings.notes,
        staffId: bookings.staffId,
        serviceId: bookings.serviceId,
      })
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          eq(bookings.bookingDate, date)
        ))
        .orderBy(asc(bookings.bookingTime));

      // Enrich with service and staff details
      const enrichedAppointments = await Promise.all(appointments.map(async (apt) => {
        const service = await db.query.services.findFirst({
          where: eq(services.id, apt.serviceId),
        });
        
        let staffMember = null;
        if (apt.staffId) {
          staffMember = await db.query.staff.findFirst({
            where: eq(staff.id, apt.staffId),
          });
        }

        // Calculate end time based on service duration
        const [hours, minutes] = apt.bookingTime.split(':').map(Number);
        const startMinutes = hours * 60 + minutes;
        const endMinutes = startMinutes + (service?.durationMinutes || 60);
        const endHour = Math.floor(endMinutes / 60);
        const endMin = endMinutes % 60;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

        return {
          ...apt,
          endTime,
          service: service ? {
            id: service.id,
            name: service.name,
            duration: service.durationMinutes,
            category: service.category,
            price: service.priceInPaisa,
          } : null,
          staff: staffMember ? {
            id: staffMember.id,
            name: staffMember.name,
            photoUrl: staffMember.photoUrl,
            roles: staffMember.roles,
          } : null,
          amountFormatted: formatCurrency(apt.finalAmount || apt.totalAmount),
        };
      }));

      // Generate timeline slots (9 AM to 8 PM)
      const timelineSlots: { time: string; appointments: typeof enrichedAppointments }[] = [];
      for (let hour = 9; hour <= 20; hour++) {
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        const slotAppointments = enrichedAppointments.filter(apt => {
          const aptHour = parseInt(apt.bookingTime.split(':')[0]);
          return aptHour === hour;
        });
        timelineSlots.push({ time: timeStr, appointments: slotAppointments });
      }

      // Stats for the day
      const stats = {
        total: appointments.length,
        completed: appointments.filter(a => a.status === 'completed').length,
        pending: appointments.filter(a => ['pending', 'confirmed'].includes(a.status)).length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length,
        revenue: enrichedAppointments
          .filter(a => a.status === 'completed')
          .reduce((sum, a) => sum + (a.finalAmount || a.totalAmount), 0),
      };

      res.json({
        date,
        stats,
        appointments: enrichedAppointments,
        timeline: timelineSlots,
      });
    } catch (error) {
      console.error("Date appointments API error:", error);
      res.status(500).json({ error: "Failed to fetch appointments for date" });
    }
  });

  /**
   * POST /api/mobile/business/appointments
   * Create a new booking (staff-created for walk-in or VIP)
   */
  app.post("/api/mobile/business/appointments", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      const parsed = createBookingSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid booking data", details: parsed.error.flatten() });
      }

      const { clientName, clientPhone, clientEmail, serviceIds, staffId, date, time, notes, paymentMethod, isWalkIn } = parsed.data;

      // Get services
      const selectedServices = await db.select()
        .from(services)
        .where(and(
          eq(services.salonId, salonId),
          inArray(services.id, serviceIds),
          eq(services.isActive, 1)
        ));

      if (selectedServices.length === 0) {
        return res.status(400).json({ error: "No valid services found" });
      }

      // Calculate totals
      const totalAmountPaisa = selectedServices.reduce((sum, s) => sum + (s.priceInPaisa || 0), 0);
      const totalDuration = selectedServices.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

      // Get salon info
      const salon = await db.query.salons.findFirst({
        where: eq(salons.id, salonId),
      });

      // Create booking for primary service (first one)
      const primaryService = selectedServices[0];
      const bookingId = `BK${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const newBooking = await db.insert(bookings).values({
        id: bookingId,
        salonId,
        serviceId: primaryService.id,
        staffId: staffId || null,
        customerName: clientName,
        customerEmail: clientEmail || `${clientPhone}@guest.stylemate.com`,
        customerPhone: clientPhone,
        salonName: salon?.name,
        bookingDate: date,
        bookingTime: time,
        status: isWalkIn ? 'confirmed' : 'pending',
        totalAmountPaisa,
        finalAmountPaisa: totalAmountPaisa,
        currency: 'INR',
        paymentMethod,
        notes: notes || (isWalkIn ? 'Walk-in booking created by staff' : 'Booking created by staff'),
      }).returning();

      res.status(201).json({
        success: true,
        booking: {
          ...newBooking[0],
          services: selectedServices.map(s => ({ id: s.id, name: s.name, price: s.priceInPaisa })),
          totalDuration,
          amountFormatted: formatCurrency(totalAmountPaisa),
        },
      });
    } catch (error) {
      console.error("Create booking API error:", error);
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  /**
   * PATCH /api/mobile/business/appointments/:id/status
   * Update appointment status
   */
  app.patch("/api/mobile/business/appointments/:id/status", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      const { id } = req.params;
      const parsed = updateBookingStatusSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid status data", details: parsed.error.flatten() });
      }

      const { status, notes } = parsed.data;

      // Verify booking belongs to this salon
      const booking = await db.query.bookings.findFirst({
        where: and(
          eq(bookings.id, id),
          eq(bookings.salonId, salonId)
        ),
      });

      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // Update booking status
      const updatedBooking = await db.update(bookings)
        .set({ 
          status,
          notes: notes ? `${booking.notes || ''}\n[Status update] ${notes}` : booking.notes,
        })
        .where(eq(bookings.id, id))
        .returning();

      res.json({
        success: true,
        booking: updatedBooking[0],
      });
    } catch (error) {
      console.error("Update booking status API error:", error);
      res.status(500).json({ error: "Failed to update booking status" });
    }
  });

  /**
   * GET /api/mobile/business/staff
   * Get staff list for the salon
   */
  app.get("/api/mobile/business/staff", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      const staffList = await db.select()
        .from(staff)
        .where(and(
          eq(staff.salonId, salonId),
          eq(staff.isActive, 1)
        ))
        .orderBy(asc(staff.name));

      // Get today's appointments per staff member
      const today = new Date().toISOString().split('T')[0];
      const todayBookings = await db.select()
        .from(bookings)
        .where(and(
          eq(bookings.salonId, salonId),
          eq(bookings.bookingDate, today)
        ));

      const staffWithStats = staffList.map(s => {
        const staffBookings = todayBookings.filter(b => b.staffId === s.id);
        const currentBooking = staffBookings.find(b => {
          const now = new Date();
          const [hours, minutes] = b.bookingTime.split(':').map(Number);
          const bookingStart = new Date();
          bookingStart.setHours(hours, minutes, 0, 0);
          const bookingEnd = new Date(bookingStart.getTime() + 60 * 60 * 1000); // Assume 1 hour
          return now >= bookingStart && now <= bookingEnd && b.status !== 'completed' && b.status !== 'cancelled';
        });

        return {
          ...s,
          todayAppointments: staffBookings.length,
          completedToday: staffBookings.filter(b => b.status === 'completed').length,
          isAvailable: !currentBooking,
          currentClient: currentBooking?.customerName || null,
        };
      });

      res.json({
        staff: staffWithStats,
        total: staffList.length,
      });
    } catch (error) {
      console.error("Staff list API error:", error);
      res.status(500).json({ error: "Failed to fetch staff list" });
    }
  });

  /**
   * GET /api/mobile/business/services
   * Get services list for the salon (for booking creation)
   */
  app.get("/api/mobile/business/services", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      const servicesList = await db.select()
        .from(services)
        .where(and(
          eq(services.salonId, salonId),
          eq(services.isActive, 1)
        ))
        .orderBy(asc(services.category), asc(services.name));

      // Group by category
      const byCategory: Record<string, typeof servicesList> = {};
      servicesList.forEach(s => {
        const cat = s.category || 'Other';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(s);
      });

      res.json({
        services: servicesList.map(s => ({
          ...s,
          priceFormatted: formatCurrency(s.priceInPaisa || 0),
        })),
        byCategory,
        categories: Object.keys(byCategory),
        total: servicesList.length,
      });
    } catch (error) {
      console.error("Services list API error:", error);
      res.status(500).json({ error: "Failed to fetch services list" });
    }
  });

  /**
   * GET /api/mobile/business/clients
   * Get clients list for the salon
   */
  app.get("/api/mobile/business/clients", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      const { search, limit = 20 } = req.query;

      // Get unique customers from bookings
      const clientBookings = await db.select({
        customerName: bookings.customerName,
        customerPhone: bookings.customerPhone,
        customerEmail: bookings.customerEmail,
        userId: bookings.userId,
        bookingDate: bookings.bookingDate,
        status: bookings.status,
      })
        .from(bookings)
        .where(eq(bookings.salonId, salonId))
        .orderBy(desc(bookings.bookingDate));

      // Aggregate by phone number
      const clientMap: Record<string, {
        name: string;
        phone: string;
        email: string | null;
        userId: string | null;
        visits: number;
        lastVisit: string;
        completedVisits: number;
      }> = {};

      clientBookings.forEach(b => {
        const phone = b.customerPhone;
        if (!clientMap[phone]) {
          clientMap[phone] = {
            name: b.customerName,
            phone,
            email: b.customerEmail,
            userId: b.userId,
            visits: 0,
            lastVisit: b.bookingDate,
            completedVisits: 0,
          };
        }
        clientMap[phone].visits++;
        if (b.status === 'completed') {
          clientMap[phone].completedVisits++;
        }
        if (b.bookingDate > clientMap[phone].lastVisit) {
          clientMap[phone].lastVisit = b.bookingDate;
        }
      });

      let clients = Object.values(clientMap);

      // Search filter
      if (search) {
        const searchLower = (search as string).toLowerCase();
        clients = clients.filter(c => 
          c.name.toLowerCase().includes(searchLower) || 
          c.phone.includes(searchLower)
        );
      }

      // Sort by visits (most frequent first) and limit
      clients.sort((a, b) => b.visits - a.visits);
      clients = clients.slice(0, Number(limit));

      // Add tags
      const clientsWithTags = clients.map(c => ({
        ...c,
        tag: c.completedVisits >= 10 ? 'VIP' : c.completedVisits >= 3 ? 'Regular' : 'New',
      }));

      res.json({
        clients: clientsWithTags,
        total: Object.keys(clientMap).length,
      });
    } catch (error) {
      console.error("Clients list API error:", error);
      res.status(500).json({ error: "Failed to fetch clients list" });
    }
  });

  /**
   * GET /api/mobile/business/waitlist
   * Get waitlist entries for the salon (business management view)
   */
  app.get("/api/mobile/business/waitlist", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      const { status, limit = 50 } = req.query;

      // Get waitlist entries with related data
      const waitlistQuery = sql`
        SELECT 
          sw.id,
          sw.user_id,
          sw.salon_id,
          sw.service_id,
          sw.staff_id,
          sw.requested_date,
          sw.time_window_start,
          sw.time_window_end,
          sw.flexibility_days,
          sw.priority,
          sw.status,
          sw.notified_at,
          sw.response_deadline,
          sw.expires_at,
          sw.created_at,
          u.fullName as client_name,
          u.phoneNumber as client_phone,
          s.name as service_name,
          s.price as service_price,
          s.durationMinutes as service_duration,
          st.name as staff_name
        FROM slot_waitlist sw
        LEFT JOIN users u ON sw.user_id = u.id
        LEFT JOIN services s ON sw.service_id = s.id
        LEFT JOIN staff st ON sw.staff_id = st.id
        WHERE sw.salon_id = ${salonId}
        ${status ? sql`AND sw.status = ${status}` : sql``}
        ORDER BY 
          CASE sw.priority 
            WHEN 4 THEN 1 
            WHEN 3 THEN 2 
            WHEN 2 THEN 3 
            ELSE 4 
          END,
          sw.created_at ASC
        LIMIT ${Number(limit)}
      `;

      const waitlistEntries = await db.execute(waitlistQuery);

      // Calculate positions
      const entries = (waitlistEntries.rows as any[]).map((entry, idx) => ({
        id: entry.id,
        clientName: entry.client_name || 'Unknown',
        clientPhone: entry.client_phone || '',
        serviceName: entry.service_name || 'Service',
        servicePrice: entry.service_price || 0,
        serviceDuration: entry.service_duration || 30,
        staffName: entry.staff_name,
        staffId: entry.staff_id,
        requestedDate: entry.requested_date,
        timeWindow: `${entry.time_window_start} - ${entry.time_window_end}`,
        flexibilityDays: entry.flexibility_days || 1,
        priority: entry.priority === 4 ? 'diamond' : entry.priority === 3 ? 'platinum' : entry.priority === 2 ? 'gold' : 'regular',
        position: idx + 1,
        status: entry.status,
        notifiedAt: entry.notified_at,
        responseDeadline: entry.response_deadline,
        createdAt: entry.created_at,
        expiresAt: entry.expires_at,
      }));

      // Stats
      const stats = {
        total: entries.length,
        waiting: entries.filter(e => e.status === 'waiting').length,
        notified: entries.filter(e => e.status === 'notified').length,
        highValue: entries.filter(e => e.servicePrice >= 200000 && e.status === 'waiting').length, // >=2000 in rupees
      };

      res.json({
        entries,
        stats,
      });
    } catch (error) {
      console.error("Business waitlist API error:", error);
      res.status(500).json({ error: "Failed to fetch waitlist" });
    }
  });

  /**
   * POST /api/mobile/business/waitlist/:id/notify
   * Notify a waitlist entry about an available slot
   */
  app.post("/api/mobile/business/waitlist/:id/notify", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      const { id } = req.params;
      const { slotTime, slotDate } = req.body;

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      if (!slotTime || !slotDate) {
        return res.status(400).json({ error: "Slot time and date are required" });
      }

      // Update waitlist entry status
      await db.execute(sql`
        UPDATE slot_waitlist 
        SET 
          status = 'notified',
          notified_at = NOW(),
          response_deadline = NOW() + INTERVAL '12 hours'
        WHERE id = ${id} AND salon_id = ${salonId}
      `);

      res.json({
        success: true,
        message: "Client notified about available slot",
      });
    } catch (error) {
      console.error("Waitlist notify API error:", error);
      res.status(500).json({ error: "Failed to notify client" });
    }
  });

  /**
   * DELETE /api/mobile/business/waitlist/:id
   * Remove entry from waitlist
   */
  app.delete("/api/mobile/business/waitlist/:id", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      const { id } = req.params;

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      await db.execute(sql`
        DELETE FROM slot_waitlist 
        WHERE id = ${id} AND salon_id = ${salonId}
      `);

      res.json({
        success: true,
        message: "Removed from waitlist",
      });
    } catch (error) {
      console.error("Waitlist delete API error:", error);
      res.status(500).json({ error: "Failed to remove from waitlist" });
    }
  });

  /**
   * POST /api/mobile/business/checkout
   * Process a checkout/sale transaction with server-side price validation
   */
  app.post("/api/mobile/business/checkout", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      const validation = checkoutSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: validation.error.errors 
        });
      }

      const { bookingId, clientName, clientPhone, items, paymentMethod, discount, tipAmount, notes } = validation.data;

      const serviceItems = items.filter(i => i.type === 'service');
      const productItems = items.filter(i => i.type === 'product');
      
      if (productItems.length > 0) {
        return res.status(400).json({ 
          error: "Product checkout not yet supported. Please use services only." 
        });
      }
      
      if (serviceItems.length === 0) {
        return res.status(400).json({ 
          error: "At least one service is required for checkout" 
        });
      }

      const serviceIds = serviceItems.map(i => i.id);
      let verifiedItems: Array<{ id: string; type: string; name: string; pricePaise: number; quantity: number }> = [];
      
      const serviceRecords = await db.select()
        .from(services)
        .where(and(
          inArray(services.id, serviceIds),
          eq(services.salonId, salonId)
        ));
      
      if (serviceRecords.length !== serviceIds.length) {
        const foundIds = new Set(serviceRecords.map(s => s.id));
        const missingIds = serviceIds.filter(id => !foundIds.has(id));
        return res.status(400).json({ 
          error: `Services not found or not available: ${missingIds.join(', ')}` 
        });
      }
      
      const serviceMap = new Map(serviceRecords.map(s => [s.id, s]));
      
      for (const item of serviceItems) {
        const service = serviceMap.get(item.id)!;
        verifiedItems.push({
          id: service.id,
          type: 'service',
          name: service.name,
          pricePaise: service.priceInPaisa,
          quantity: item.quantity,
        });
      }

      const subtotalPaise = verifiedItems.reduce((sum, item) => sum + (item.pricePaise * item.quantity), 0);
      
      let discountPaise = 0;
      if (discount) {
        if (discount.type === 'percentage') {
          discountPaise = Math.round(subtotalPaise * (discount.value / 100));
        } else {
          discountPaise = Math.min(Math.round(discount.value * 100), subtotalPaise);
        }
      }
      
      const afterDiscountPaise = Math.max(0, subtotalPaise - discountPaise);
      const gstPaise = Math.round(afterDiscountPaise * 0.18);
      const tipPaise = Math.min(Math.round((tipAmount || 0) * 100), 10000000);
      const grandTotalPaise = afterDiscountPaise + gstPaise + tipPaise;

      const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      if (bookingId) {
        const existingBooking = await db.query.bookings.findFirst({
          where: and(
            eq(bookings.id, bookingId),
            eq(bookings.salonId, salonId)
          ),
        });
        
        if (!existingBooking) {
          return res.status(404).json({ error: "Booking not found" });
        }
        
        await db.update(bookings)
          .set({ 
            status: 'completed',
            finalAmount: grandTotalPaise,
            paymentStatus: 'paid',
          })
          .where(and(
            eq(bookings.id, bookingId),
            eq(bookings.salonId, salonId)
          ));
      }

      const transaction = {
        id: transactionId,
        salonId,
        bookingId,
        clientName,
        clientPhone,
        items: verifiedItems.map(i => ({
          id: i.id,
          type: i.type,
          name: i.name,
          price: i.pricePaise,
          quantity: i.quantity,
          priceFormatted: `₹${(i.pricePaise / 100).toFixed(2)}`,
        })),
        subtotal: subtotalPaise,
        subtotalFormatted: `₹${(subtotalPaise / 100).toFixed(2)}`,
        discount: discountPaise,
        discountFormatted: `₹${(discountPaise / 100).toFixed(2)}`,
        discountDetails: discount,
        gst: gstPaise,
        gstFormatted: `₹${(gstPaise / 100).toFixed(2)}`,
        tip: tipPaise,
        tipFormatted: `₹${(tipPaise / 100).toFixed(2)}`,
        total: grandTotalPaise,
        totalFormatted: `₹${(grandTotalPaise / 100).toFixed(2)}`,
        paymentMethod,
        notes,
        status: 'completed',
        processedBy: userId,
        processedAt: new Date().toISOString(),
      };

      console.log(`[Checkout] Transaction ${transactionId} processed for salon ${salonId}: ₹${(grandTotalPaise / 100).toFixed(2)}`);

      res.json({
        success: true,
        transaction,
        message: "Payment processed successfully",
      });
    } catch (error) {
      console.error("Checkout API error:", error);
      res.status(500).json({ error: "Failed to process checkout" });
    }
  });

  /**
   * GET /api/mobile/business/checkout/appointment/:bookingId
   * Get appointment details for checkout
   */
  app.get("/api/mobile/business/checkout/appointment/:bookingId", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      const { bookingId } = req.params;

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      // Get booking with services
      const booking = await db.query.bookings.findFirst({
        where: and(
          eq(bookings.id, bookingId),
          eq(bookings.salonId, salonId)
        ),
      });

      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // Parse services from booking
      const serviceList = booking.services as any[] || [];
      
      // Get service details
      const serviceIds = serviceList.map((s: any) => s.serviceId || s.id).filter(Boolean);
      
      const serviceDetails = serviceIds.length > 0 
        ? await db.select()
            .from(services)
            .where(inArray(services.id, serviceIds))
        : [];

      // Get staff details
      const staffMember = booking.staffId 
        ? await db.query.staff.findFirst({
            where: eq(staff.id, booking.staffId),
          })
        : null;

      // Build cart items (price in paise for consistency)
      const cartItems = serviceDetails.map(s => ({
        id: s.id,
        type: 'service' as const,
        name: s.name,
        price: s.priceInPaisa,
        priceFormatted: `₹${(s.priceInPaisa / 100).toFixed(2)}`,
        quantity: 1,
        duration: s.durationMinutes,
        staffName: staffMember?.name || undefined,
        icon: '✂️',
      }));

      res.json({
        booking: {
          id: booking.id,
          date: booking.bookingDate,
          time: booking.bookingTime,
          status: booking.status,
        },
        client: {
          name: booking.customerName,
          phone: booking.customerPhone,
          email: booking.customerEmail,
        },
        cartItems,
        staff: staffMember ? {
          id: staffMember.id,
          name: staffMember.name,
        } : null,
      });
    } catch (error) {
      console.error("Checkout appointment API error:", error);
      res.status(500).json({ error: "Failed to fetch appointment for checkout" });
    }
  });

  // ============================================
  // PAYROLL ROUTES (Zylu-inspired features)
  // ============================================

  /**
   * GET /api/mobile/business/payroll/stats
   * Get payroll statistics for the salon
   */
  app.get("/api/mobile/business/payroll/stats", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      const staffResult = await db.select({ count: count() })
        .from(staff)
        .where(eq(staff.salonId, salonId));
      const totalStaff = Number(staffResult[0]?.count || 0);

      const salaryResult = await db.select({
        total: sql<number>`COALESCE(SUM(
          COALESCE(${staffSalaryComponents.baseSalaryPaisa}, 0) + 
          COALESCE(${staffSalaryComponents.hraAllowancePaisa}, 0) + 
          COALESCE(${staffSalaryComponents.travelAllowancePaisa}, 0) + 
          COALESCE(${staffSalaryComponents.mealAllowancePaisa}, 0) + 
          COALESCE(${staffSalaryComponents.otherAllowancesPaisa}, 0)
        ), 0)`
      })
        .from(staffSalaryComponents)
        .where(and(
          eq(staffSalaryComponents.salonId, salonId),
          eq(staffSalaryComponents.isActive, 1)
        ));
      const totalPayablePaisa = Number(salaryResult[0]?.total || 0);

      const cycleResult = await db.select({
        id: staffPayrollCycles.id,
        status: staffPayrollCycles.status,
        processedAt: staffPayrollCycles.processedAt
      })
        .from(staffPayrollCycles)
        .where(eq(staffPayrollCycles.salonId, salonId))
        .orderBy(desc(staffPayrollCycles.periodYear), desc(staffPayrollCycles.periodMonth))
        .limit(1);
      
      const activePayrollCycle = cycleResult.length > 0 ? {
        id: cycleResult[0].id,
        status: cycleResult[0].status
      } : null;

      res.json({
        totalStaff,
        activePayrollCycle,
        totalPayablePaisa
      });
    } catch (error) {
      console.error("Payroll stats API error:", error);
      res.status(500).json({ error: "Failed to fetch payroll stats" });
    }
  });

  /**
   * GET /api/mobile/business/payroll/history
   * Get payroll history for the salon
   */
  app.get("/api/mobile/business/payroll/history", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      const { limit = '12', offset = '0' } = req.query;

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      const payrollHistory = await db.select({
        id: staffPayrollCycles.id,
        periodYear: staffPayrollCycles.periodYear,
        periodMonth: staffPayrollCycles.periodMonth,
        periodStartDate: staffPayrollCycles.periodStartDate,
        periodEndDate: staffPayrollCycles.periodEndDate,
        status: staffPayrollCycles.status,
        totalStaffCount: staffPayrollCycles.totalStaffCount,
        totalGrossSalaryPaisa: staffPayrollCycles.totalGrossSalaryPaisa,
        totalCommissionsPaisa: staffPayrollCycles.totalCommissionsPaisa,
        totalDeductionsPaisa: staffPayrollCycles.totalDeductionsPaisa,
        totalNetPayablePaisa: staffPayrollCycles.totalNetPayablePaisa,
        processedAt: staffPayrollCycles.processedAt,
        approvedAt: staffPayrollCycles.approvedAt
      })
        .from(staffPayrollCycles)
        .where(eq(staffPayrollCycles.salonId, salonId))
        .orderBy(desc(staffPayrollCycles.periodYear), desc(staffPayrollCycles.periodMonth))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      res.json(payrollHistory);
    } catch (error) {
      console.error("Payroll history API error:", error);
      res.status(500).json({ error: "Failed to fetch payroll history" });
    }
  });

  /**
   * GET /api/mobile/business/payroll/staff-breakdown
   * Get staff payroll breakdown
   */
  app.get("/api/mobile/business/payroll/staff-breakdown", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      const { cycleId } = req.query;

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      const whereCondition = cycleId 
        ? and(eq(staffPayrollEntries.salonId, salonId), eq(staffPayrollEntries.payrollCycleId, cycleId as string))
        : eq(staffPayrollEntries.salonId, salonId);

      const staffBreakdown = await db.select({
        entryId: staffPayrollEntries.id,
        staffId: staffPayrollEntries.staffId,
        baseSalaryPaisa: staffPayrollEntries.baseSalaryPaisa,
        allowancesPaisa: staffPayrollEntries.allowancesPaisa,
        commissionEarningsPaisa: staffPayrollEntries.commissionEarningsPaisa,
        tipsReceivedPaisa: staffPayrollEntries.tipsReceivedPaisa,
        bonusesPaisa: staffPayrollEntries.bonusesPaisa,
        grossEarningsPaisa: staffPayrollEntries.grossEarningsPaisa,
        totalDeductionsPaisa: staffPayrollEntries.totalDeductionsPaisa,
        netPayablePaisa: staffPayrollEntries.netPayablePaisa,
        paymentStatus: staffPayrollEntries.paymentStatus,
        staffName: staff.name,
        staffEmail: staff.email
      })
        .from(staffPayrollEntries)
        .leftJoin(staff, eq(staffPayrollEntries.staffId, staff.id))
        .where(whereCondition)
        .orderBy(staff.name);

      res.json(staffBreakdown);
    } catch (error) {
      console.error("Staff breakdown API error:", error);
      res.status(500).json({ error: "Failed to fetch staff breakdown" });
    }
  });

  /**
   * GET /api/mobile/business/payroll/entries/:entryId/payslip
   * Get payslip data for a specific payroll entry
   */
  app.get("/api/mobile/business/payroll/entries/:entryId/payslip", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      const { entryId } = req.params;

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      const entryResult = await db.select({
        id: staffPayrollEntries.id,
        staffId: staffPayrollEntries.staffId,
        baseSalaryPaisa: staffPayrollEntries.baseSalaryPaisa,
        allowancesPaisa: staffPayrollEntries.allowancesPaisa,
        commissionEarningsPaisa: staffPayrollEntries.commissionEarningsPaisa,
        tipsReceivedPaisa: staffPayrollEntries.tipsReceivedPaisa,
        bonusesPaisa: staffPayrollEntries.bonusesPaisa,
        grossEarningsPaisa: staffPayrollEntries.grossEarningsPaisa,
        totalDeductionsPaisa: staffPayrollEntries.totalDeductionsPaisa,
        netPayablePaisa: staffPayrollEntries.netPayablePaisa,
        paymentStatus: staffPayrollEntries.paymentStatus,
        paidAt: staffPayrollEntries.paidAt
      })
        .from(staffPayrollEntries)
        .where(and(
          eq(staffPayrollEntries.id, entryId),
          eq(staffPayrollEntries.salonId, salonId)
        ))
        .limit(1);

      if (entryResult.length === 0) {
        return res.status(404).json({ error: "Payroll entry not found" });
      }

      const entry = entryResult[0];

      const staffResult = await db.select({
        name: staff.name,
        email: staff.email,
        phone: staff.phone
      })
        .from(staff)
        .where(eq(staff.id, entry.staffId))
        .limit(1);

      const salonResult = await db.select({
        name: salons.name,
        address: salons.address,
        city: salons.city
      })
        .from(salons)
        .where(eq(salons.id, salonId))
        .limit(1);

      const payrollCycleId = await db.select({ payrollCycleId: staffPayrollEntries.payrollCycleId })
        .from(staffPayrollEntries)
        .where(eq(staffPayrollEntries.id, entryId))
        .limit(1);

      const cycleResult = payrollCycleId.length > 0 
        ? await db.select({
            periodMonth: staffPayrollCycles.periodMonth,
            periodYear: staffPayrollCycles.periodYear,
            periodStartDate: staffPayrollCycles.periodStartDate,
            periodEndDate: staffPayrollCycles.periodEndDate
          })
          .from(staffPayrollCycles)
          .where(eq(staffPayrollCycles.id, payrollCycleId[0].payrollCycleId))
          .limit(1)
        : [];

      const payslipData = {
        payslipId: `PS-${entryId.substring(0, 8).toUpperCase()}`,
        generatedAt: new Date().toISOString(),
        salon: salonResult[0] || { name: 'Salon', address: '', city: '' },
        employee: staffResult[0] || { name: 'Employee', email: '', phone: '' },
        period: cycleResult[0] || { periodMonth: new Date().getMonth() + 1, periodYear: new Date().getFullYear() },
        earnings: {
          baseSalary: (entry.baseSalaryPaisa || 0) / 100,
          allowances: (entry.allowancesPaisa || 0) / 100,
          commission: (entry.commissionEarningsPaisa || 0) / 100,
          tips: (entry.tipsReceivedPaisa || 0) / 100,
          bonus: (entry.bonusesPaisa || 0) / 100,
          grossEarnings: (entry.grossEarningsPaisa || 0) / 100
        },
        deductions: {
          totalDeductions: (entry.totalDeductionsPaisa || 0) / 100
        },
        netPayable: (entry.netPayablePaisa || 0) / 100,
        paymentStatus: entry.paymentStatus,
        paidAt: entry.paidAt
      };

      res.json(payslipData);
    } catch (error) {
      console.error("Payslip API error:", error);
      res.status(500).json({ error: "Failed to generate payslip" });
    }
  });

  /**
   * PUT /api/mobile/business/payroll/cycles/:cycleId/approve
   * Approve a payroll cycle
   */
  app.put("/api/mobile/business/payroll/cycles/:cycleId/approve", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      const { cycleId } = req.params;

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      const cycleResult = await db.select({
        id: staffPayrollCycles.id,
        status: staffPayrollCycles.status
      })
        .from(staffPayrollCycles)
        .where(and(
          eq(staffPayrollCycles.id, cycleId),
          eq(staffPayrollCycles.salonId, salonId)
        ))
        .limit(1);

      if (cycleResult.length === 0) {
        return res.status(404).json({ error: "Payroll cycle not found" });
      }

      if (cycleResult[0].status !== 'processed') {
        return res.status(400).json({ error: "Only processed payroll cycles can be approved" });
      }

      await db.update(staffPayrollCycles)
        .set({
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: userId,
          updatedAt: new Date()
        })
        .where(eq(staffPayrollCycles.id, cycleId));

      res.json({ success: true, message: 'Payroll cycle approved successfully' });
    } catch (error) {
      console.error("Approve cycle API error:", error);
      res.status(500).json({ error: "Failed to approve payroll cycle" });
    }
  });

  /**
   * PUT /api/mobile/business/payroll/cycles/:cycleId/pay
   * Mark a payroll cycle as paid
   */
  app.put("/api/mobile/business/payroll/cycles/:cycleId/pay", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      const { cycleId } = req.params;

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      const cycleResult = await db.select({
        id: staffPayrollCycles.id,
        status: staffPayrollCycles.status
      })
        .from(staffPayrollCycles)
        .where(and(
          eq(staffPayrollCycles.id, cycleId),
          eq(staffPayrollCycles.salonId, salonId)
        ))
        .limit(1);

      if (cycleResult.length === 0) {
        return res.status(404).json({ error: "Payroll cycle not found" });
      }

      if (cycleResult[0].status !== 'approved') {
        return res.status(400).json({ error: "Only approved payroll cycles can be marked as paid" });
      }

      await db.update(staffPayrollCycles)
        .set({
          status: 'paid',
          updatedAt: new Date()
        })
        .where(eq(staffPayrollCycles.id, cycleId));

      await db.update(staffPayrollEntries)
        .set({
          paymentStatus: 'paid',
          paidAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(staffPayrollEntries.payrollCycleId, cycleId));

      res.json({ success: true, message: 'Payroll cycle marked as paid successfully' });
    } catch (error) {
      console.error("Pay cycle API error:", error);
      res.status(500).json({ error: "Failed to mark payroll as paid" });
    }
  });

  /**
   * PUT /api/mobile/business/payroll/entries/:entryId/pay
   * Mark an individual payroll entry as paid
   */
  app.put("/api/mobile/business/payroll/entries/:entryId/pay", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      const { entryId } = req.params;

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      const entryResult = await db.select({
        id: staffPayrollEntries.id,
        paymentStatus: staffPayrollEntries.paymentStatus
      })
        .from(staffPayrollEntries)
        .where(and(
          eq(staffPayrollEntries.id, entryId),
          eq(staffPayrollEntries.salonId, salonId)
        ))
        .limit(1);

      if (entryResult.length === 0) {
        return res.status(404).json({ error: "Payroll entry not found" });
      }

      if (entryResult[0].paymentStatus === 'paid') {
        return res.status(400).json({ error: "This payout has already been paid" });
      }

      await db.update(staffPayrollEntries)
        .set({
          paymentStatus: 'paid',
          paidAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(staffPayrollEntries.id, entryId));

      res.json({ success: true, message: 'Staff payout marked as paid successfully' });
    } catch (error) {
      console.error("Pay entry API error:", error);
      res.status(500).json({ error: "Failed to process payout" });
    }
  });

  /**
   * Communication Module Routes
   * - Chat conversations
   * - Notifications
   */

  /**
   * GET /api/mobile/business/conversations
   * Get list of chat conversations
   */
  app.get("/api/mobile/business/conversations", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      const { filter, search, limit = '50', offset = '0' } = req.query;

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      const conversations = [
        {
          id: '1',
          clientId: 'c1',
          clientName: 'Priya Sharma',
          clientPhone: '+91 98765 43210',
          lastMessage: 'Thank you so much! The hair styling was perfect. Can I book the same slot for next month?',
          lastMessageAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          isOnline: true,
          isUnread: true,
          isPinned: true,
          messageType: 'text',
          category: 'appointment',
          unreadCount: 2,
        },
        {
          id: '2',
          clientId: 'c2',
          clientName: 'Neha Gupta',
          clientPhone: '+91 98765 43211',
          lastMessage: 'Hi! I need to reschedule my bridal makeup trial. Is Saturday available?',
          lastMessageAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          isOnline: true,
          isUnread: true,
          isPinned: true,
          messageType: 'text',
          category: 'reschedule',
          unreadCount: 1,
        },
        {
          id: '3',
          clientId: 'c3',
          clientName: 'Amit Patel',
          clientPhone: '+91 98765 43212',
          lastMessage: "Sure, I'll be there by 10:30 AM tomorrow. Thanks!",
          lastMessageAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          isOnline: false,
          isUnread: false,
          isPinned: false,
          messageType: 'text',
          category: 'confirmed',
          unreadCount: 0,
        },
      ];

      const totalCount = conversations.length;
      const unreadCount = conversations.filter(c => c.isUnread).length;
      const pinnedCount = conversations.filter(c => c.isPinned).length;

      res.json({
        conversations,
        stats: {
          total: totalCount,
          unread: unreadCount,
          pinned: pinnedCount,
          appointments: conversations.filter(c => ['appointment', 'reschedule', 'confirmed'].includes(c.category)).length,
          inquiries: conversations.filter(c => c.category === 'inquiry').length,
        },
        pagination: {
          total: totalCount,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      });
    } catch (error) {
      console.error("Conversations API error:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  /**
   * GET /api/mobile/business/conversations/:id
   * Get a specific conversation with messages
   */
  app.get("/api/mobile/business/conversations/:id", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      const { id } = req.params;

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      const conversation = {
        id,
        client: {
          id: 'c1',
          name: 'Priya Sharma',
          phone: '+91 98765 43210',
          isOnline: true,
          lastSeen: new Date().toISOString(),
        },
        messages: [
          {
            id: 'm1',
            text: 'Hello! I had a great experience at your salon yesterday. The haircut was amazing!',
            timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            isFromClient: true,
            type: 'text',
          },
          {
            id: 'm2',
            text: 'Thank you so much, Priya! We are glad you loved it. Would you like to book your next appointment?',
            timestamp: new Date(Date.now() - 58 * 60 * 1000).toISOString(),
            isFromClient: false,
            type: 'text',
            status: 'read',
          },
          {
            id: 'm3',
            text: 'Yes please! Can I get the same slot for next month?',
            timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
            isFromClient: true,
            type: 'text',
          },
        ],
      };

      res.json(conversation);
    } catch (error) {
      console.error("Conversation detail API error:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  /**
   * POST /api/mobile/business/conversations/:id/messages
   * Send a message in a conversation
   */
  app.post("/api/mobile/business/conversations/:id/messages", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      const { id } = req.params;
      const { text, type = 'text', attachmentUrl } = req.body;

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      if (!text && type === 'text') {
        return res.status(400).json({ error: "Message text is required" });
      }

      const newMessage = {
        id: `m_${Date.now()}`,
        conversationId: id,
        text,
        type,
        attachmentUrl,
        timestamp: new Date().toISOString(),
        isFromClient: false,
        status: 'sent',
      };

      res.json({ success: true, message: newMessage });
    } catch (error) {
      console.error("Send message API error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  /**
   * PUT /api/mobile/business/conversations/:id/pin
   * Pin or unpin a conversation
   */
  app.put("/api/mobile/business/conversations/:id/pin", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      const { id } = req.params;
      const { isPinned } = req.body;

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      res.json({ success: true, isPinned });
    } catch (error) {
      console.error("Pin conversation API error:", error);
      res.status(500).json({ error: "Failed to update pin status" });
    }
  });

  /**
   * PUT /api/mobile/business/conversations/:id/read
   * Mark a conversation as read
   */
  app.put("/api/mobile/business/conversations/:id/read", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      const { id } = req.params;

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Mark read API error:", error);
      res.status(500).json({ error: "Failed to mark as read" });
    }
  });

  /**
   * GET /api/mobile/business/notifications
   * Get list of notifications
   */
  app.get("/api/mobile/business/notifications", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      const { category, limit = '50', offset = '0' } = req.query;

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      const notifications = [
        {
          id: 'n1',
          type: 'booking',
          title: 'New Booking Request',
          message: 'Priya Sharma has requested an appointment for Haircut & Styling on Jan 25 at 11:00 AM',
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          isRead: false,
          clientName: 'Priya Sharma',
        },
        {
          id: 'n2',
          type: 'payment',
          title: 'Payment Received',
          message: 'Payment of ₹2,500 received from Neha Gupta for Bridal Makeup Trial',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          isRead: false,
          clientName: 'Neha Gupta',
          amount: '₹2,500',
        },
        {
          id: 'n3',
          type: 'review',
          title: 'New 5-Star Review',
          message: 'Amit Patel left a 5-star review: "Amazing service! Will definitely come back."',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          isRead: false,
          clientName: 'Amit Patel',
        },
        {
          id: 'n4',
          type: 'reminder',
          title: 'Upcoming Appointment',
          message: 'Reminder: Anjali Reddy has an appointment in 30 minutes for Hair Coloring',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          isRead: true,
          clientName: 'Anjali Reddy',
        },
        {
          id: 'n5',
          type: 'cancellation',
          title: 'Appointment Cancelled',
          message: 'Rajesh Kumar has cancelled their appointment scheduled for today at 3:00 PM',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          clientName: 'Rajesh Kumar',
        },
        {
          id: 'n6',
          type: 'system',
          title: 'Weekly Summary Ready',
          message: 'Your weekly business report is ready. You had 45 appointments and ₹1,25,000 in revenue.',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          isRead: true,
        },
      ];

      const totalCount = notifications.length;
      const unreadCount = notifications.filter(n => !n.isRead).length;

      res.json({
        notifications,
        stats: {
          total: totalCount,
          unread: unreadCount,
          appointments: notifications.filter(n => ['booking', 'reminder', 'cancellation'].includes(n.type)).length,
          payments: notifications.filter(n => n.type === 'payment').length,
          reviews: notifications.filter(n => n.type === 'review').length,
          system: notifications.filter(n => n.type === 'system').length,
        },
        pagination: {
          total: totalCount,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      });
    } catch (error) {
      console.error("Notifications API error:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  /**
   * PUT /api/mobile/business/notifications/:id/read
   * Mark a notification as read
   */
  app.put("/api/mobile/business/notifications/:id/read", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      const { id } = req.params;

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Mark notification read API error:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  /**
   * PUT /api/mobile/business/notifications/read-all
   * Mark all notifications as read
   */
  app.put("/api/mobile/business/notifications/read-all", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      console.error("Mark all read API error:", error);
      res.status(500).json({ error: "Failed to mark all as read" });
    }
  });

  /**
   * GET /api/mobile/business/notifications/preferences
   * Get notification preferences
   */
  app.get("/api/mobile/business/notifications/preferences", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      const preferences = {
        newBookings: true,
        cancellations: true,
        reminders: true,
        payments: true,
        reviews: true,
        marketing: false,
        system: true,
        sound: 'default',
        vibration: true,
        doNotDisturb: false,
        quietHoursStart: null,
        quietHoursEnd: null,
      };

      res.json(preferences);
    } catch (error) {
      console.error("Notification preferences API error:", error);
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  /**
   * PUT /api/mobile/business/notifications/preferences
   * Update notification preferences
   */
  app.put("/api/mobile/business/notifications/preferences", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      const updates = req.body;

      if (!salonId) {
        return res.status(403).json({ error: "No salon access found" });
      }

      res.json({ success: true, message: 'Preferences updated successfully' });
    } catch (error) {
      console.error("Update preferences API error:", error);
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  console.log("Mobile Business routes registered");
}
