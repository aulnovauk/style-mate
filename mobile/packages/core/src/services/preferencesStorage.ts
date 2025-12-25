/**
 * Local storage for app and notification preferences
 * These are device-specific settings that don't need server sync
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_PREFS_KEY = '@stylemate/notification_preferences';
const APP_PREFS_KEY = '@stylemate/app_preferences';
const SECURITY_PREFS_KEY = '@stylemate/security_preferences';

export interface NotificationPreferences {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  bookingReminders: boolean;
  paymentAlerts: boolean;
  marketingUpdates: boolean;
}

export interface AppPreferences {
  language: string;
  theme: 'dark' | 'light' | 'system';
  dateFormat: string;
  timeFormat: '12' | '24';
  soundEffects: boolean;
  hapticFeedback: boolean;
}

export interface SecurityPreferences {
  biometricEnabled: boolean;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  pushNotifications: true,
  emailNotifications: true,
  smsNotifications: false,
  bookingReminders: true,
  paymentAlerts: true,
  marketingUpdates: false,
};

const DEFAULT_APP_PREFS: AppPreferences = {
  language: 'en',
  theme: 'dark',
  dateFormat: 'dd/mm/yyyy',
  timeFormat: '12',
  soundEffects: true,
  hapticFeedback: true,
};

const DEFAULT_SECURITY_PREFS: SecurityPreferences = {
  biometricEnabled: false,
};

export const preferencesStorage = {
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
      if (stored) {
        return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(stored) };
      }
      return DEFAULT_NOTIFICATION_PREFS;
    } catch (error) {
      console.error('Error reading notification preferences:', error);
      return DEFAULT_NOTIFICATION_PREFS;
    }
  },

  async setNotificationPreferences(prefs: Partial<NotificationPreferences>): Promise<void> {
    try {
      const current = await this.getNotificationPreferences();
      const updated = { ...current, ...prefs };
      await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      throw error;
    }
  },

  async getAppPreferences(): Promise<AppPreferences> {
    try {
      const stored = await AsyncStorage.getItem(APP_PREFS_KEY);
      if (stored) {
        return { ...DEFAULT_APP_PREFS, ...JSON.parse(stored) };
      }
      return DEFAULT_APP_PREFS;
    } catch (error) {
      console.error('Error reading app preferences:', error);
      return DEFAULT_APP_PREFS;
    }
  },

  async setAppPreferences(prefs: Partial<AppPreferences>): Promise<void> {
    try {
      const current = await this.getAppPreferences();
      const updated = { ...current, ...prefs };
      await AsyncStorage.setItem(APP_PREFS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving app preferences:', error);
      throw error;
    }
  },

  async getSecurityPreferences(): Promise<SecurityPreferences> {
    try {
      const stored = await AsyncStorage.getItem(SECURITY_PREFS_KEY);
      if (stored) {
        return { ...DEFAULT_SECURITY_PREFS, ...JSON.parse(stored) };
      }
      return DEFAULT_SECURITY_PREFS;
    } catch (error) {
      console.error('Error reading security preferences:', error);
      return DEFAULT_SECURITY_PREFS;
    }
  },

  async setSecurityPreferences(prefs: Partial<SecurityPreferences>): Promise<void> {
    try {
      const current = await this.getSecurityPreferences();
      const updated = { ...current, ...prefs };
      await AsyncStorage.setItem(SECURITY_PREFS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving security preferences:', error);
      throw error;
    }
  },
};
