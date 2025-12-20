import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { secureStorage } from '../utils/secureStorage';
import { api } from './api';

class FirebaseAuthService {
  private confirmationResult: FirebaseAuthTypes.ConfirmationResult | null = null;

  async sendOTP(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        if (formattedPhone.startsWith('91')) {
          formattedPhone = '+' + formattedPhone;
        } else {
          formattedPhone = '+91' + formattedPhone;
        }
      }

      console.log('[Firebase Auth] Sending OTP to:', formattedPhone);
      
      this.confirmationResult = await auth().signInWithPhoneNumber(formattedPhone);
      
      console.log('[Firebase Auth] OTP sent successfully');
      return { success: true };
    } catch (error: any) {
      console.error('[Firebase Auth] Error sending OTP:', error);
      
      let errorMessage = 'Failed to send OTP. Please try again.';
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later.';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.code === 'auth/app-not-authorized') {
        errorMessage = 'App not authorized. Please contact support.';
      } else if (error.code === 'auth/missing-client-identifier') {
        errorMessage = 'Firebase configuration error. Please contact support.';
      }
      
      return { success: false, error: errorMessage };
    }
  }

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
      await secureStorage.setUserData(user);

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
      
      let errorMessage = 'Invalid OTP. Please try again.';
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid OTP code. Please check and try again.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'OTP has expired. Please request a new one.';
      } else if (error.code === 'auth/session-expired') {
        errorMessage = 'Session expired. Please request a new OTP.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      return { success: false, error: errorMessage };
    }
  }

  async resendOTP(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    this.confirmationResult = null;
    return this.sendOTP(phoneNumber);
  }

  async signOut(): Promise<void> {
    try {
      await auth().signOut();
      await secureStorage.clearAll();
      console.log('[Firebase Auth] Signed out successfully');
    } catch (error) {
      console.error('[Firebase Auth] Error signing out:', error);
    }
  }

  getCurrentUser(): FirebaseAuthTypes.User | null {
    return auth().currentUser;
  }
}

export const firebaseAuth = new FirebaseAuthService();
