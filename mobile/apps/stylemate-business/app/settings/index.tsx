import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  Image,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  COLORS,
  GRADIENTS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SIZES,
} from '../../constants/theme';
import {
  useSettings,
  useSettingsActions,
} from '@stylemate/core/hooks/useBusinessApi';
import {
  useNotificationPreferences,
  useAppPreferences,
  useSecurityPreferences,
} from '@stylemate/core/hooks/usePreferences';
import { clearAuthTokens } from '@stylemate/core/auth';

interface SettingsItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  iconBgColor?: string;
}

function SettingsItem({ icon, title, subtitle, onPress, rightElement, showChevron = true, iconBgColor }: SettingsItemProps) {
  return (
    <TouchableOpacity 
      style={styles.settingsItem} 
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.settingsItemIcon, iconBgColor ? { backgroundColor: iconBgColor } : null]}>
        <Text style={styles.settingsItemIconText}>{icon}</Text>
      </View>
      <View style={styles.settingsItemContent}>
        <Text style={styles.settingsItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (showChevron && <Text style={styles.chevron}>›</Text>)}
    </TouchableOpacity>
  );
}

interface ToggleItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  iconBgColor?: string;
  disabled?: boolean;
}

function ToggleItem({ icon, title, subtitle, value, onValueChange, iconBgColor, disabled, loading }: ToggleItemProps & { loading?: boolean }) {
  const isDisabled = disabled || loading;
  return (
    <View style={[styles.settingsItem, isDisabled && styles.settingsItemDisabled]}>
      <View style={[styles.settingsItemIcon, iconBgColor ? { backgroundColor: iconBgColor } : null]}>
        <Text style={styles.settingsItemIconText}>{icon}</Text>
      </View>
      <View style={styles.settingsItemContent}>
        <Text style={styles.settingsItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>}
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.violet} />
      ) : (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: COLORS.cardBorder, true: COLORS.violet }}
          thumbColor={COLORS.white}
          disabled={isDisabled}
        />
      )}
    </View>
  );
}

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function formatBusinessHours(businessHours: any): string {
  if (!businessHours) return 'Not configured';
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const weekday = businessHours[days[0]];
  if (weekday?.open) {
    return `${weekday.start || '9:00'} - ${weekday.end || '18:00'}`;
  }
  return 'Closed';
}

const TERMS_URL = 'https://stylemate.com/terms';
const PRIVACY_URL = 'https://stylemate.com/privacy';
const SUPPORT_EMAIL = 'support@stylemate.com';

export default function SettingsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  
  const { 
    settings, 
    profile, 
    salon, 
    isOwner, 
    staffRole,
    loading, 
    error, 
    refetch 
  } = useSettings();

  const { updateBookingSettings, isSubmitting } = useSettingsActions();
  
  const { 
    preferences: notificationPrefs, 
    loading: notificationPrefsLoading,
    updatePreference: updateNotificationPref,
    refetch: refetchNotifications,
  } = useNotificationPreferences();
  
  const { 
    preferences: appPrefs, 
    loading: appPrefsLoading,
    updatePreference: updateAppPref,
    refetch: refetchAppPrefs,
  } = useAppPreferences();
  
  const { 
    preferences: securityPrefs, 
    loading: securityPrefsLoading,
    updatePreference: updateSecurityPref,
    refetch: refetchSecurityPrefs,
  } = useSecurityPreferences();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchData = async () => {
        if (isActive) {
          await Promise.all([
            refetch(),
            refetchNotifications(),
            refetchAppPrefs(),
            refetchSecurityPrefs(),
          ]);
        }
      };
      fetchData();
      return () => {
        isActive = false;
      };
    }, [refetch, refetchNotifications, refetchAppPrefs, refetchSecurityPrefs])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetch(),
      refetchNotifications(),
      refetchAppPrefs(),
      refetchSecurityPrefs(),
    ]);
    setRefreshing(false);
  }, [refetch, refetchNotifications, refetchAppPrefs, refetchSecurityPrefs]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoggingOut(true);
              await clearAuthTokens();
              router.replace('/');
            } catch (err) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setLoggingOut(false);
            }
          }
        },
      ]
    );
  };

  const handleToggleBookingSetting = async (setting: 'instantBooking' | 'offerDeals' | 'acceptGroup', value: boolean) => {
    const result = await updateBookingSettings({ [setting]: value });
    if (result.success) {
      refetch();
    } else {
      Alert.alert('Error', result.error || 'Failed to update setting');
    }
  };

  const handleNotificationToggle = async (key: keyof typeof notificationPrefs, value: boolean) => {
    if (!notificationPrefs) return;
    const result = await updateNotificationPref(key, value);
    if (!result.success) {
      Alert.alert('Error', 'Failed to update notification preference');
    }
  };

  const handleAppPrefToggle = async (key: 'soundEffects' | 'hapticFeedback', value: boolean) => {
    const result = await updateAppPref(key, value);
    if (!result.success) {
      Alert.alert('Error', 'Failed to update app preference');
    }
  };

  const handleSecurityToggle = async (key: keyof typeof securityPrefs, value: boolean) => {
    if (!securityPrefs) return;
    const result = await updateSecurityPref(key, value);
    if (!result.success) {
      Alert.alert('Error', 'Failed to update security preference');
    }
  };

  const handleOpenURL = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const handleContactSupport = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Support Request - Stylemate Business`);
  };

  if (loading && !settings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
        </View>
      </SafeAreaView>
    );
  }

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'User';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.violet}
          />
        }
      >
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.profileRow}>
              <View style={styles.profileImageContainer}>
                {profile?.profileImage ? (
                  <Image source={{ uri: profile.profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Text style={styles.profileImageText}>{fullName.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <TouchableOpacity 
                  style={styles.cameraButton}
                  onPress={() => router.push('/settings/profile')}
                >
                  <Text style={styles.cameraIcon}>📷</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{fullName}</Text>
                <Text style={styles.profileRole}>{staffRole === 'owner' ? 'Owner & Manager' : staffRole}</Text>
                <Text style={styles.profileEmail}>{profile?.email || profile?.phone || 'No contact info'}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.editProfileButton}
              onPress={() => router.push('/settings/profile')}
            >
              <LinearGradient colors={GRADIENTS.primary} style={styles.editProfileGradient}>
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <SectionHeader title="Salon Information" actionLabel="Edit" onAction={() => router.push('/settings/salon')} />
        <View style={styles.sectionCard}>
          <SettingsItem
            icon="✂️"
            title="Salon Name"
            subtitle={salon?.name || 'Not set'}
            onPress={() => router.push('/settings/business-info')}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="🏢"
            title="Branch"
            subtitle={salon?.shopNumber || 'Main Branch'}
            onPress={() => router.push('/settings/business-info')}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="📍"
            title="Address"
            subtitle={salon?.address ? `${salon.address}, ${salon.city}` : 'Not set'}
            onPress={() => router.push('/settings/business-info')}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="📞"
            title="Contact"
            subtitle={salon?.phone || 'Not set'}
            onPress={() => router.push('/settings/business-info')}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="📧"
            title="Email"
            subtitle={salon?.email || 'Not set'}
            onPress={() => router.push('/settings/business-info')}
          />
          {salon?.website && (
            <>
              <View style={styles.divider} />
              <SettingsItem
                icon="🌐"
                title="Website"
                subtitle={salon.website}
                onPress={() => router.push('/settings/business-info')}
              />
            </>
          )}
        </View>

        <SectionHeader title="Operating Hours" actionLabel="Modify" onAction={() => router.push('/settings/working-hours')} />
        <View style={styles.sectionCard}>
          <SettingsItem
            icon="📅"
            title="Monday - Friday"
            subtitle={formatBusinessHours(salon?.businessHours)}
            onPress={() => router.push('/settings/working-hours')}
            iconBgColor={`${COLORS.violet}20`}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="📆"
            title="Saturday"
            subtitle={salon?.businessHours?.saturday?.open ? `${salon.businessHours.saturday.start} - ${salon.businessHours.saturday.end}` : 'Closed'}
            onPress={() => router.push('/settings/working-hours')}
            iconBgColor={`${COLORS.violet}20`}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="🗓️"
            title="Sunday"
            subtitle={salon?.businessHours?.sunday?.open ? `${salon.businessHours.sunday.start} - ${salon.businessHours.sunday.end}` : 'Closed'}
            onPress={() => router.push('/settings/working-hours')}
            iconBgColor={`${COLORS.violet}20`}
          />
          {salon?.businessHours?.breakTime && (
            <View style={styles.breakTimeCard}>
              <View style={styles.breakTimeRow}>
                <Text style={styles.breakTimeIcon}>☕</Text>
                <Text style={styles.breakTimeLabel}>Lunch Break</Text>
              </View>
              <Text style={styles.breakTimeValue}>
                {salon.businessHours.breakTime.start} - {salon.businessHours.breakTime.end}
              </Text>
            </View>
          )}
        </View>

        <SectionHeader title="Booking Settings" />
        <View style={styles.sectionCard}>
          <ToggleItem
            icon="📅"
            title="Instant Booking"
            subtitle="Allow clients to book instantly"
            value={salon?.instantBooking === 1}
            onValueChange={(v) => handleToggleBookingSetting('instantBooking', v)}
            iconBgColor={`${COLORS.violet}20`}
            disabled={!isOwner}
          />
          <View style={styles.divider} />
          <ToggleItem
            icon="🎁"
            title="Offer Deals"
            subtitle="Enable special offers and deals"
            value={salon?.offerDeals === 1}
            onValueChange={(v) => handleToggleBookingSetting('offerDeals', v)}
            iconBgColor={`${COLORS.violet}20`}
            disabled={!isOwner}
          />
          <View style={styles.divider} />
          <ToggleItem
            icon="👥"
            title="Group Bookings"
            subtitle="Accept group appointments"
            value={salon?.acceptGroup === 1}
            onValueChange={(v) => handleToggleBookingSetting('acceptGroup', v)}
            iconBgColor={`${COLORS.violet}20`}
            disabled={!isOwner}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="📋"
            title="Advanced Booking Rules"
            subtitle="Cancellation policy, deposits, limits"
            onPress={() => router.push('/settings/booking-rules')}
          />
        </View>

        <SectionHeader title="Business Management" />
        <View style={styles.sectionCard}>
          <SettingsItem
            icon="💳"
            title="Payment Methods"
            subtitle="Razorpay, UPI, cash settings"
            onPress={() => router.push('/settings/payment-methods')}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="🔐"
            title="Access Control"
            subtitle="Staff roles and permissions"
            onPress={() => router.push('/settings/access-control')}
          />
        </View>

        <SectionHeader title="Notification Preferences" />
        <View style={styles.sectionCard}>
          <ToggleItem
            icon="🔔"
            title="Push Notifications"
            subtitle="Receive push notifications"
            value={notificationPrefs?.pushNotifications ?? true}
            onValueChange={(v) => handleNotificationToggle('pushNotifications', v)}
            iconBgColor={`${COLORS.violet}20`}
            loading={notificationPrefsLoading}
          />
          <View style={styles.divider} />
          <ToggleItem
            icon="📧"
            title="Email Notifications"
            subtitle="Receive email updates"
            value={notificationPrefs?.emailNotifications ?? true}
            onValueChange={(v) => handleNotificationToggle('emailNotifications', v)}
            iconBgColor={`${COLORS.violet}20`}
            loading={notificationPrefsLoading}
          />
          <View style={styles.divider} />
          <ToggleItem
            icon="💬"
            title="SMS Notifications"
            subtitle="Receive SMS alerts"
            value={notificationPrefs?.smsNotifications ?? false}
            onValueChange={(v) => handleNotificationToggle('smsNotifications', v)}
            iconBgColor={`${COLORS.violet}20`}
            loading={notificationPrefsLoading}
          />
          <View style={styles.divider} />
          <ToggleItem
            icon="📆"
            title="Booking Reminders"
            subtitle="Send appointment reminders"
            value={notificationPrefs?.bookingReminders ?? true}
            onValueChange={(v) => handleNotificationToggle('bookingReminders', v)}
            iconBgColor={`${COLORS.violet}20`}
            loading={notificationPrefsLoading}
          />
          <View style={styles.divider} />
          <ToggleItem
            icon="💰"
            title="Payment Alerts"
            subtitle="Notify on payment received"
            value={notificationPrefs?.paymentAlerts ?? true}
            onValueChange={(v) => handleNotificationToggle('paymentAlerts', v)}
            iconBgColor={`${COLORS.violet}20`}
            loading={notificationPrefsLoading}
          />
        </View>

        <SectionHeader title="App Preferences" />
        <View style={styles.sectionCard}>
          <SettingsItem
            icon="🌐"
            title="Language"
            subtitle={appPrefs?.language === 'en' ? 'English' : appPrefs?.language || 'English'}
            onPress={() => router.push('/settings/language')}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="🎨"
            title="Theme"
            subtitle={appPrefs?.theme === 'dark' ? 'Dark Mode' : appPrefs?.theme === 'light' ? 'Light Mode' : 'System'}
            onPress={() => router.push('/settings/theme')}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="📅"
            title="Date Format"
            subtitle={appPrefs?.dateFormat?.toUpperCase() || 'DD/MM/YYYY'}
            onPress={() => router.push('/settings/date-format')}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="🕐"
            title="Time Format"
            subtitle={appPrefs?.timeFormat === '12' ? '12 Hour (AM/PM)' : '24 Hour'}
            onPress={() => router.push('/settings/time-format')}
          />
          <View style={styles.divider} />
          <ToggleItem
            icon="🔊"
            title="Sound Effects"
            subtitle="Play sounds for actions"
            value={appPrefs?.soundEffects ?? true}
            onValueChange={(v) => handleAppPrefToggle('soundEffects', v)}
            iconBgColor={`${COLORS.violet}20`}
            loading={appPrefsLoading}
          />
          <View style={styles.divider} />
          <ToggleItem
            icon="📳"
            title="Haptic Feedback"
            subtitle="Vibrate on touch"
            value={appPrefs?.hapticFeedback ?? true}
            onValueChange={(v) => handleAppPrefToggle('hapticFeedback', v)}
            iconBgColor={`${COLORS.violet}20`}
            loading={appPrefsLoading}
          />
        </View>

        <SectionHeader title="Privacy & Security" />
        <View style={styles.sectionCard}>
          <ToggleItem
            icon="🔐"
            title="Biometric Authentication"
            subtitle="Use fingerprint/face ID"
            value={securityPrefs?.biometricEnabled ?? false}
            onValueChange={(v) => handleSecurityToggle('biometricEnabled', v)}
            iconBgColor={`${COLORS.violet}20`}
            loading={securityPrefsLoading}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="🔑"
            title="Change Password"
            onPress={() => router.push('/settings/change-password')}
          />
        </View>

        <SectionHeader title="Support" />
        <View style={styles.sectionCard}>
          <SettingsItem
            icon="❓"
            title="Help Center"
            onPress={handleContactSupport}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="📄"
            title="Terms of Service"
            onPress={() => handleOpenURL(TERMS_URL)}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="🔒"
            title="Privacy Policy"
            onPress={() => handleOpenURL(PRIVACY_URL)}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="ℹ️"
            title="About"
            subtitle="Version 1.0.0"
            onPress={() => Alert.alert('Stylemate Business', 'Version 1.0.0\n\nBuilt with love for beauty professionals.\n\n© 2024 Stylemate Inc.')}
          />
        </View>

        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator color={COLORS.red} />
          ) : (
            <Text style={styles.logoutButtonText}>Logout</Text>
          )}
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  profileSection: {
    marginBottom: SPACING.lg,
  },
  profileCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: SPACING.lg,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: COLORS.violet,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.violet,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.fuchsia,
  },
  profileImageText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.violet,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  cameraIcon: {
    fontSize: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  profileRole: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  profileEmail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.violet,
  },
  editProfileButton: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  editProfileGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  sectionAction: {
    fontSize: FONT_SIZES.md,
    color: COLORS.violet,
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  settingsItemDisabled: {
    opacity: 0.6,
  },
  settingsItemIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.violet}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  settingsItemIconText: {
    fontSize: 18,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  settingsItemSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: COLORS.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginLeft: 64,
  },
  breakTimeCard: {
    backgroundColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    margin: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  breakTimeIcon: {
    fontSize: 16,
  },
  breakTimeLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  breakTimeValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  logoutButton: {
    backgroundColor: `${COLORS.red}20`,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  logoutButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.red,
  },
  bottomPadding: {
    height: SIZES.listPaddingBottom,
  },
});
