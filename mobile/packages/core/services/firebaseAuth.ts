/**
 * Firebase Authentication Service
 * Updated to use React Native Firebase v22+ Modular API
 * 
 * This service handles phone number authentication using Firebase
 * with OTP verification for the Stylemate mobile app.
 */

import { getApp, FirebaseApp } from '@react-native-firebase/app';
import {
  getAuth,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
  FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import { secureStorage } from '../utils/secureStorage';
import { api } from './api';

class FirebaseAuthService {
  private app: FirebaseApp | null = null;
  private auth: FirebaseAuthTypes.Module | null = null;
  private confirmationResult: FirebaseAuthTypes.ConfirmationResult | null = null;

  /**
   * Initialize Firebase App and Auth instances
   * Uses the modular API pattern required by React Native Firebase v22+
   */
  private getFirebaseInstances(): { app: FirebaseApp; auth: FirebaseAuthTypes.Module } {
    if (!this.app || !this.auth) {
      try {
        this.app = getApp();
        this.auth = getAuth(this.app);
        console.log('[Firebase Auth] Firebase instances initialized successfully');
      } catch (error) {
        console.error('[Firebase Auth] Failed to initialize Firebase:', error);
        throw new Error('Firebase initialization failed. Please restart the app.');
      }
    }
    return { app: this.app, auth: this.auth };
  }

  /**
   * Send OTP to the provided phone number
   * @param phoneNumber - Phone number with or without country code
   * @returns Success status and optional error message
   */
  async sendOTP(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { auth } = this.getFirebaseInstances();
      
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        if (formattedPhone.startsWith('91')) {
          formattedPhone = '+' + formattedPhone;
        } else {
          formattedPhone = '+91' + formattedPhone;
        }
      }

      console.log('[Firebase Auth] Sending OTP to:', formattedPhone);
      
      this.confirmationResult = await signInWithPhoneNumber(auth, formattedPhone);
      
      console.log('[Firebase Auth] OTP sent successfully');
      return { success: true };
    } catch (error: any) {
      console.error('[Firebase Auth] Error sending OTP:', error);
      
      const errorMessage = this.getErrorMessage(error, 'send');
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Verify the OTP code entered by the user
   * @param otp - 6-digit OTP code
   * @returns Success status with user data or error message
   */
  async verifyOTP(otp: string): Promise<{
    success: boolean;
    user?: any;
    accessToken?: string;
    refreshToken?: string;
    isNewUser?: boolean;
    welcomeOffers?: any[];
    error?: string;
  }> {
    try {
      if (!this.confirmationResult) {
        return { success: false, error: 'Please request OTP first.' };
      }

      console.log('[Firebase Auth] Verifying OTP...');
      
      const userCredential = await this.confirmationResult.confirm(otp);
      const firebaseUser = userCredential.user;
      
      console.log('[Firebase Auth] OTP verified, Firebase UID:', firebaseUser.uid);
      
      const idToken = await firebaseUser.getIdToken();
      
      const response = await api.post('/api/auth/mobile/firebase-login', {
        firebaseToken: idToken,
        phoneNumber: firebaseUser.phoneNumber,
        firebaseUid: firebaseUser.uid,
      });

      const { user, accessToken, refreshToken, isNewUser, welcomeOffers } = response.data;

      await secureStorage.setAccessToken(accessToken);
      await secureStorage.setRefreshToken(refreshToken);
      await secureStorage.setUser(user);

      console.log('[Firebase Auth] Login successful, user:', user.id);

      return {
        success: true,
        user,
        accessToken,
        refreshToken,
        isNewUser,
        welcomeOffers,
      };
    } catch (error: any) {
      console.error('[Firebase Auth] Error verifying OTP:', error);
      
      const errorMessage = this.getErrorMessage(error, 'verify');
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Resend OTP to the same phone number
   * @param phoneNumber - Phone number to resend OTP to
   * @returns Success status and optional error message
   */
  async resendOTP(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    this.confirmationResult = null;
    return this.sendOTP(phoneNumber);
  }

  /**
   * Sign out the current user
   * Clears Firebase auth state and local secure storage
   */
  async signOut(): Promise<void> {
    try {
      const { auth } = this.getFirebaseInstances();
      await firebaseSignOut(auth);
      await secureStorage.clearAll();
      console.log('[Firebase Auth] Signed out successfully');
    } catch (error) {
      console.error('[Firebase Auth] Error signing out:', error);
      await secureStorage.clearAll();
    }
  }

  /**
   * Get the currently authenticated Firebase user
   * @returns Firebase User object or null
   */
  getCurrentUser(): FirebaseAuthTypes.User | null {
    try {
      const { auth } = this.getFirebaseInstances();
      return auth.currentUser;
    } catch (error) {
      console.error('[Firebase Auth] Error getting current user:', error);
      return null;
    }
  }

  /**
   * Check if a user is currently authenticated
   * @returns Boolean indicating authentication status
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  /**
   * Get user-friendly error messages based on Firebase error codes
   * @param error - Firebase error object
   * @param context - 'send' or 'verify' to provide context-specific messages
   * @returns User-friendly error message
   */
  private getErrorMessage(error: any, context: 'send' | 'verify'): string {
    const code = error.code || '';
    
    const errorMessages: Record<string, string> = {
      'auth/invalid-phone-number': 'Invalid phone number format. Please check and try again.',
      'auth/too-many-requests': 'Too many attempts. Please try again after some time.',
      'auth/quota-exceeded': 'SMS quota exceeded. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your internet connection.',
      'auth/app-not-authorized': 'App not authorized for Firebase Authentication. Please contact support.',
      'auth/missing-client-identifier': 'Firebase configuration error. Please contact support.',
      'auth/invalid-verification-code': 'Invalid OTP code. Please check and try again.',
      'auth/code-expired': 'OTP has expired. Please request a new one.',
      'auth/session-expired': 'Session expired. Please request a new OTP.',
      'auth/captcha-check-failed': 'Security verification failed. Please try again.',
      'auth/missing-phone-number': 'Phone number is required.',
      'auth/user-disabled': 'This account has been disabled. Please contact support.',
      'auth/operation-not-allowed': 'Phone authentication is not enabled. Please contact support.',
    };

    if (errorMessages[code]) {
      return errorMessages[code];
    }

    if (error.response?.data?.error) {
      return error.response.data.error;
    }

    return context === 'send' 
      ? 'Failed to send OTP. Please try again.'
      : 'Invalid OTP. Please try again.';
  }
}

export const firebaseAuth = new FirebaseAuthService();
