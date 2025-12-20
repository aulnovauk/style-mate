import type { Express } from "express";
import { storage } from "../storage";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
} from "../utils/jwt";
import { 
  autoApplyWelcomeOfferOnRegistration,
  checkImportedCustomerByPhone,
} from "../services/welcomeOfferService";
import { verifyFirebaseToken, getPhoneNumberFromToken } from "../firebaseAdmin";

interface OTPData {
  otp: string;
  expiresAt: number;
  attempts: number;
}

// TODO: Replace with Redis/DB persistence for production
// In-memory storage is dev-only and will lose OTPs on server restart
const otpStorage = new Map<string, OTPData>();

export function registerMobileAuthRoutes(app: Express) {
  
  app.post("/api/auth/mobile/request-otp", async (req: any, res) => {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ 
          error: "Phone number is required." 
        });
      }

      // Extract digits only and normalize phone number
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      
      // Support formats: +919689929626, 919689929626, 9689929626
      let normalizedPhone = cleanPhone;
      if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
        normalizedPhone = cleanPhone.slice(2); // Remove 91 prefix
      }
      
      // Validate Indian mobile number (10 digits starting with 6-9)
      if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
        return res.status(400).json({ 
          error: "Invalid phone number. Must be a valid 10-digit Indian mobile number." 
        });
      }

      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Store using full phone number (with country code) as key for consistency
      const storageKey = `91${normalizedPhone}`;
      otpStorage.set(storageKey, {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000,
        attempts: 0,
      });

      // Also store with the original format for compatibility
      otpStorage.set(phoneNumber, {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000,
        attempts: 0,
      });

      if (process.env.NODE_ENV === 'development') {
      // Always log OTP for now (TODO: integrate SMS service like Twilio for production)
        console.log(`📱 [DEV MODE] OTP for ${phoneNumber}: ${otp}`);
      }

      res.json({
        success: true,
        message: "OTP sent successfully",
        expiresIn: 300,
        // Include OTP in dev for testing (remove in production with real SMS)
        ...(process.env.NODE_ENV !== 'production' && { devOtp: otp }),
      });
    } catch (error) {
      console.error("Mobile OTP request error:", error);
      res.status(500).json({ error: "Failed to send OTP. Please try again." });
    }
  });

  app.post("/api/auth/mobile/verify-otp", async (req: any, res) => {
    try {
      const { phoneNumber, otp } = req.body;

      if (!phoneNumber || !otp) {
        return res.status(400).json({ error: "Phone number and OTP are required" });
      }

      const storedOTP = otpStorage.get(phoneNumber);

      if (!storedOTP) {
        return res.status(400).json({ error: "OTP expired or not found. Please request a new OTP." });
      }

      if (storedOTP.expiresAt < Date.now()) {
        otpStorage.delete(phoneNumber);
        return res.status(400).json({ error: "OTP expired. Please request a new OTP." });
      }

      if (storedOTP.attempts >= 5) {
        otpStorage.delete(phoneNumber);
        return res.status(429).json({ error: "Too many attempts. Please request a new OTP." });
      }

      if (storedOTP.otp !== otp) {
        storedOTP.attempts += 1;
        return res.status(400).json({ error: "Invalid OTP. Please try again." });
      }

      otpStorage.delete(phoneNumber);

      let user = await storage.getUserByPhone(phoneNumber);
      let isNewUser = false;
      let welcomeOffersApplied: Array<{
        offerId: string;
        offerName: string;
        salonId: string;
        expiresAt: Date;
      }> = [];

      if (!user) {
        user = await storage.createUser({
          phone: phoneNumber,
          role: "customer",
        });

        const customerRole = await storage.getRoleByName("customer");
        if (customerRole) {
          await storage.assignUserRole(user.id, customerRole.id);
        }
        
        isNewUser = true;
        console.log(`📱 [Mobile Auth] New user created: ${user.id}`);

        try {
          const offerResult = await autoApplyWelcomeOfferOnRegistration(user.id, phoneNumber);
          welcomeOffersApplied = offerResult.offersApplied;
          if (welcomeOffersApplied.length > 0) {
            console.log(`📱 [Mobile Auth] Applied ${welcomeOffersApplied.length} welcome offer(s) for user: ${user.id}`);
          }
        } catch (offerError) {
          console.error(`📱 [Mobile Auth] Failed to apply welcome offers:`, offerError);
        }
      }

      const accessToken = generateAccessToken(user.id, user.email || "");
      const deviceInfo = req.headers["user-agent"];
      const ipAddress = req.ip || req.connection.remoteAddress;
      const { token: refreshToken } = await generateRefreshToken(
        user.id,
        deviceInfo,
        ipAddress,
      );

      const { password: _, ...userResponse } = user;

      console.log(`📱 [Mobile Auth] User authenticated: ${user.id}`);

      res.json({
        success: true,
        user: userResponse,
        accessToken,
        refreshToken,
        message: "OTP verified successfully",
        isNewUser,
        welcomeOffers: welcomeOffersApplied,
      });
    } catch (error) {
      console.error("Mobile OTP verification error:", error);
      res.status(500).json({ error: "Verification failed. Please try again." });
    }
  });

  app.post("/api/auth/mobile/resend-otp", async (req: any, res) => {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Store with original format
      otpStorage.set(phoneNumber, {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000,
        attempts: 0,
      });

      // Also store normalized version
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      let normalizedPhone = cleanPhone;
      if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
        normalizedPhone = cleanPhone.slice(2);
      }
      const storageKey = `91${normalizedPhone}`;
      otpStorage.set(storageKey, {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000,
        attempts: 0,
      });
        if (process.env.NODE_ENV === 'development') {
      console.log(`📱 [OTP] Resent code for ${phoneNumber}: ${otp}`);
      }

      res.json({
        success: true,
        message: "OTP resent successfully",
        expiresIn: 300,
        ...(process.env.NODE_ENV !== 'production' && { devOtp: otp }),
      });
    } catch (error) {
      console.error("Mobile OTP resend error:", error);
      res.status(500).json({ error: "Failed to resend OTP. Please try again." });
    }
  });

  app.post("/api/auth/mobile/refresh", async (req: any, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({ error: "No refresh token provided" });
      }

      const decoded = await verifyRefreshToken(refreshToken);

      const user = await storage.getUserById(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const newAccessToken = generateAccessToken(user.id, user.email || "");

      const deviceInfo = req.headers["user-agent"];
      const ipAddress = req.ip || req.connection.remoteAddress;
      const { token: newRefreshToken } = await generateRefreshToken(
        user.id,
        deviceInfo,
        ipAddress,
      );

      await revokeRefreshToken(decoded.tokenId);

      console.log(`📱 [Mobile Auth] Token refreshed for user: ${user.id}`);

      res.json({
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        message: "Token refreshed successfully",
      });
    } catch (error: any) {
      console.error("Mobile token refresh error:", error);
      res.status(401).json({ 
        error: error.message || "Invalid or expired refresh token" 
      });
    }
  });

  app.post("/api/auth/mobile/logout", async (req: any, res) => {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        try {
          const decoded = await verifyRefreshToken(refreshToken);
          await revokeRefreshToken(decoded.tokenId);
          console.log(`📱 [Mobile Auth] User logged out: ${decoded.userId}`);
        } catch (error) {
          console.warn("Error revoking refresh token during mobile logout:", error);
        }
      }

      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      console.error("Mobile logout error:", error);
      res.status(500).json({ error: "Logout failed. Please try again." });
    }
  });

  app.post("/api/auth/mobile/firebase-login", async (req: any, res) => {
    try {
      const { firebaseToken, phoneNumber, firebaseUid } = req.body;

      if (!firebaseToken) {
        return res.status(400).json({ error: "Firebase token is required" });
      }

      // Verify Firebase token for security
      let verifiedPhone: string | null = null;
      let verifiedUid: string | null = null;
      
      try {
        const decodedToken = await verifyFirebaseToken(firebaseToken);
        if (decodedToken) {
          verifiedPhone = getPhoneNumberFromToken(decodedToken);
          verifiedUid = decodedToken.uid;
          console.log(`📱 [Firebase Auth] Token verified for phone: ${verifiedPhone}, UID: ${verifiedUid}`);
        } else {
          console.warn('📱 [Firebase Auth] Firebase Admin not configured, using client-provided phone');
          verifiedPhone = phoneNumber;
          verifiedUid = firebaseUid;
        }
      } catch (tokenError: any) {
        console.error('📱 [Firebase Auth] Token verification failed:', tokenError.message);
        return res.status(401).json({ error: tokenError.message || "Invalid Firebase token" });
      }

      if (!verifiedPhone) {
        return res.status(400).json({ error: "Phone number not found in token" });
      }

      const cleanPhone = verifiedPhone.replace(/\D/g, '');
      let normalizedPhone = cleanPhone;
      if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
        normalizedPhone = cleanPhone.slice(2);
      }

      let user = await storage.getUserByPhone(normalizedPhone);
      let isNewUser = false;
      let welcomeOffersApplied: Array<{
        offerId: string;
        offerName: string;
        salonId: string;
        expiresAt: Date;
      }> = [];

      if (!user) {
        user = await storage.createUser({
          phone: normalizedPhone,
          role: "customer",
          firebaseUid: verifiedUid || undefined,
        });

        const customerRole = await storage.getRoleByName("customer");
        if (customerRole) {
          await storage.assignUserRole(user.id, customerRole.id);
        }
        
        isNewUser = true;
        console.log(`📱 [Firebase Auth] New user created: ${user.id}`);

        try {
          const offerResult = await autoApplyWelcomeOfferOnRegistration(user.id, normalizedPhone);
          welcomeOffersApplied = offerResult.offersApplied;
          if (welcomeOffersApplied.length > 0) {
            console.log(`📱 [Firebase Auth] Applied ${welcomeOffersApplied.length} welcome offer(s) for user: ${user.id}`);
          }
        } catch (offerError) {
          console.error(`📱 [Firebase Auth] Failed to apply welcome offers:`, offerError);
        }
      } else if (verifiedUid && !user.firebaseUid) {
        await storage.updateUser(user.id, { firebaseUid: verifiedUid });
      }

      const accessToken = generateAccessToken(user.id, user.email || "");
      const deviceInfo = req.headers["user-agent"];
      const ipAddress = req.ip || req.connection.remoteAddress;
      const { token: refreshToken } = await generateRefreshToken(
        user.id,
        deviceInfo,
        ipAddress,
      );

      const { password: _, ...userResponse } = user;

      console.log(`📱 [Firebase Auth] User authenticated: ${user.id} (Firebase UID: ${verifiedUid})`);

      res.json({
        success: true,
        user: userResponse,
        accessToken,
        refreshToken,
        message: "Firebase login successful",
        isNewUser,
        welcomeOffers: welcomeOffersApplied,
      });
    } catch (error) {
      console.error("Firebase login error:", error);
      res.status(500).json({ error: "Login failed. Please try again." });
    }
  });

  console.log("✅ Mobile authentication routes registered");
}
