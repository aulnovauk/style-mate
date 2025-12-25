/**
 * Mobile Settings Routes
 * Comprehensive settings management for the Stylemate Business App
 */
import type { Express, Response } from "express";
import { db } from "../db";
import { salons, users, staff } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { authenticateMobileUser } from "../middleware/authMobile";
import bcrypt from "bcryptjs";

interface SalonSettings {
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

interface UserProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  profileImage: string | null;
  role: string | null;
}

async function getUserSalonId(userId: string): Promise<string | null> {
  const staffRecord = await db.select()
    .from(staff)
    .where(eq(staff.userId, userId))
    .limit(1);
  
  return staffRecord.length > 0 ? staffRecord[0].salonId : null;
}

async function isOwner(userId: string): Promise<boolean> {
  const staffRecord = await db.select()
    .from(staff)
    .where(and(eq(staff.userId, userId), eq(staff.role, 'owner')))
    .limit(1);
  
  return staffRecord.length > 0;
}

export function registerMobileSettingsRoutes(app: Express) {
  
  /**
   * GET /api/mobile/business/settings
   * Fetch all salon settings for the authenticated user
   */
  app.get("/api/mobile/business/settings", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      
      if (!salonId) {
        return res.status(404).json({ error: "No salon found for this user" });
      }

      const staffRecord = await db.select()
        .from(staff)
        .where(eq(staff.userId, userId))
        .limit(1);

      const [salon] = await db.select()
        .from(salons)
        .where(eq(salons.id, salonId))
        .limit(1);

      if (!salon) {
        return res.status(404).json({ error: "Salon not found" });
      }

      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const profile: UserProfile = {
        id: user?.id || "",
        firstName: user?.firstName || null,
        lastName: user?.lastName || null,
        email: user?.email || null,
        phone: user?.phone || null,
        profileImage: user?.profileImage || null,
        role: staffRecord[0]?.role || "staff",
      };

      const salonSettings: SalonSettings = {
        id: salon.id,
        name: salon.name,
        description: salon.description,
        shopNumber: salon.shopNumber,
        address: salon.address,
        city: salon.city,
        state: salon.state,
        zipCode: salon.zipCode,
        phone: salon.phone,
        email: salon.email,
        website: salon.website,
        category: salon.category,
        priceRange: salon.priceRange,
        venueType: salon.venueType,
        instantBooking: salon.instantBooking,
        offerDeals: salon.offerDeals,
        acceptGroup: salon.acceptGroup,
        imageUrl: salon.imageUrl,
        imageUrls: salon.imageUrls,
        openTime: salon.openTime,
        closeTime: salon.closeTime,
        businessHours: salon.businessHours as any,
        membershipEnabled: salon.membershipEnabled,
        latitude: salon.latitude,
        longitude: salon.longitude,
      };

      const notificationPreferences = {
        pushNotifications: true,
        emailNotifications: true,
        smsNotifications: false,
        bookingReminders: true,
        paymentAlerts: true,
        marketingUpdates: false,
      };

      const appPreferences = {
        language: "en",
        theme: "dark",
        dateFormat: "dd/mm/yyyy",
        timeFormat: "12",
        soundEffects: true,
        hapticFeedback: true,
      };

      res.json({
        profile,
        salon: salonSettings,
        notificationPreferences,
        appPreferences,
        staffRole: staffRecord[0]?.role,
        isOwner: staffRecord[0]?.role === "owner",
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  /**
   * GET /api/mobile/business/settings/profile
   * Fetch user profile details
   */
  app.get("/api/mobile/business/settings/profile", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;

      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const staffRecord = await db.select()
        .from(staff)
        .where(eq(staff.userId, userId))
        .limit(1);

      res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        role: staffRecord[0]?.role || "staff",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  /**
   * PUT /api/mobile/business/settings/profile
   * Update user profile
   */
  app.put("/api/mobile/business/settings/profile", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { firstName, lastName, email, phone, profileImage } = req.body;

      await db.update(users)
        .set({
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          email: email || undefined,
          phone: phone || undefined,
          profileImage: profileImage || undefined,
        })
        .where(eq(users.id, userId));

      res.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  /**
   * GET /api/mobile/business/settings/salon
   * Fetch salon information
   */
  app.get("/api/mobile/business/settings/salon", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);

      if (!salonId) {
        return res.status(404).json({ error: "No salon found for this user" });
      }

      const [salon] = await db.select()
        .from(salons)
        .where(eq(salons.id, salonId))
        .limit(1);

      if (!salon) {
        return res.status(404).json({ error: "Salon not found" });
      }

      res.json({
        id: salon.id,
        name: salon.name,
        description: salon.description,
        shopNumber: salon.shopNumber,
        address: salon.address,
        city: salon.city,
        state: salon.state,
        zipCode: salon.zipCode,
        phone: salon.phone,
        email: salon.email,
        website: salon.website,
        category: salon.category,
        priceRange: salon.priceRange,
        venueType: salon.venueType,
        instantBooking: salon.instantBooking,
        offerDeals: salon.offerDeals,
        acceptGroup: salon.acceptGroup,
        imageUrl: salon.imageUrl,
        imageUrls: salon.imageUrls,
        openTime: salon.openTime,
        closeTime: salon.closeTime,
        businessHours: salon.businessHours,
        membershipEnabled: salon.membershipEnabled,
        latitude: salon.latitude,
        longitude: salon.longitude,
      });
    } catch (error) {
      console.error("Error fetching salon:", error);
      res.status(500).json({ error: "Failed to fetch salon" });
    }
  });

  /**
   * PUT /api/mobile/business/settings/salon
   * Update salon information
   */
  app.put("/api/mobile/business/settings/salon", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const userIsOwner = await isOwner(userId);

      if (!userIsOwner) {
        return res.status(403).json({ error: "Only salon owners can update salon settings" });
      }

      const salonId = await getUserSalonId(userId);
      if (!salonId) {
        return res.status(404).json({ error: "No salon found for this user" });
      }

      const updates = req.body;

      const allowedFields = [
        "name", "description", "shopNumber", "address", "city", "state", "zipCode",
        "phone", "email", "website", "category", "priceRange", "venueType",
        "instantBooking", "offerDeals", "acceptGroup", "imageUrl", "imageUrls",
        "openTime", "closeTime", "businessHours", "membershipEnabled",
        "latitude", "longitude"
      ];

      const filteredUpdates: Record<string, any> = {};
      for (const key of allowedFields) {
        if (updates[key] !== undefined) {
          filteredUpdates[key] = updates[key];
        }
      }

      if (Object.keys(filteredUpdates).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      await db.update(salons)
        .set(filteredUpdates)
        .where(eq(salons.id, salonId));

      res.json({ success: true, message: "Salon updated successfully" });
    } catch (error) {
      console.error("Error updating salon:", error);
      res.status(500).json({ error: "Failed to update salon" });
    }
  });

  /**
   * PUT /api/mobile/business/settings/business-hours
   * Update business hours specifically
   */
  app.put("/api/mobile/business/settings/business-hours", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const userIsOwner = await isOwner(userId);

      if (!userIsOwner) {
        return res.status(403).json({ error: "Only salon owners can update business hours" });
      }

      const salonId = await getUserSalonId(userId);
      if (!salonId) {
        return res.status(404).json({ error: "No salon found for this user" });
      }

      const { businessHours, breakTime } = req.body;

      if (!businessHours || typeof businessHours !== "object") {
        return res.status(400).json({ error: "Invalid business hours format" });
      }

      await db.update(salons)
        .set({ businessHours: { ...businessHours, breakTime } })
        .where(eq(salons.id, salonId));

      res.json({ success: true, message: "Business hours updated successfully" });
    } catch (error) {
      console.error("Error updating business hours:", error);
      res.status(500).json({ error: "Failed to update business hours" });
    }
  });

  /**
   * PUT /api/mobile/business/settings/booking
   * Update booking settings
   */
  app.put("/api/mobile/business/settings/booking", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);

      if (!salonId) {
        return res.status(404).json({ error: "No salon found for this user" });
      }

      const { instantBooking, offerDeals, acceptGroup } = req.body;

      const updates: Record<string, any> = {};
      if (instantBooking !== undefined) updates.instantBooking = instantBooking ? 1 : 0;
      if (offerDeals !== undefined) updates.offerDeals = offerDeals ? 1 : 0;
      if (acceptGroup !== undefined) updates.acceptGroup = acceptGroup ? 1 : 0;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      await db.update(salons)
        .set(updates)
        .where(eq(salons.id, salonId));

      res.json({ success: true, message: "Booking settings updated successfully" });
    } catch (error) {
      console.error("Error updating booking settings:", error);
      res.status(500).json({ error: "Failed to update booking settings" });
    }
  });

  /**
   * PUT /api/mobile/business/settings/password
   * Change user password
   */
  app.put("/api/mobile/business/settings/password", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters" });
      }

      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.password) {
        return res.status(400).json({ error: "Password change is not available for social login accounts" });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await db.update(users)
        .set({ password: hashedNewPassword })
        .where(eq(users.id, userId));

      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  console.log("✅ Mobile settings routes registered");
}
