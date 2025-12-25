/**
 * React hooks for managing local preferences
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  preferencesStorage,
  NotificationPreferences,
  AppPreferences,
  SecurityPreferences,
} from '../services/preferencesStorage';

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    const prefs = await preferencesStorage.getNotificationPreferences();
    setPreferences(prefs);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const updatePreference = useCallback(async <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    try {
      await preferencesStorage.setNotificationPreferences({ [key]: value });
      setPreferences(prev => prev ? { ...prev, [key]: value } : null);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to save preference' };
    }
  }, []);

  return {
    preferences,
    loading,
    updatePreference,
    refetch: loadPreferences,
  };
}

export function useAppPreferences() {
  const [preferences, setPreferences] = useState<AppPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    const prefs = await preferencesStorage.getAppPreferences();
    setPreferences(prefs);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const updatePreference = useCallback(async <K extends keyof AppPreferences>(
    key: K,
    value: AppPreferences[K]
  ) => {
    try {
      await preferencesStorage.setAppPreferences({ [key]: value });
      setPreferences(prev => prev ? { ...prev, [key]: value } : null);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to save preference' };
    }
  }, []);

  return {
    preferences,
    loading,
    updatePreference,
    refetch: loadPreferences,
  };
}

export function useSecurityPreferences() {
  const [preferences, setPreferences] = useState<SecurityPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    const prefs = await preferencesStorage.getSecurityPreferences();
    setPreferences(prefs);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const updatePreference = useCallback(async <K extends keyof SecurityPreferences>(
    key: K,
    value: SecurityPreferences[K]
  ) => {
    try {
      await preferencesStorage.setSecurityPreferences({ [key]: value });
      setPreferences(prev => prev ? { ...prev, [key]: value } : null);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to save preference' };
    }
  }, []);

  return {
    preferences,
    loading,
    updatePreference,
    refetch: loadPreferences,
  };
}
