import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS, SIZES } from '../../constants/theme';
import { 
  useNotifications, 
  useCommunicationNotificationPreferences, 
  useCommunicationActions, 
  BusinessNotification as ApiNotification,
  CommunicationNotificationPreferences as ApiPreferences 
} from '@stylemate/core';

type NotificationCategory = 'all' | 'appointments' | 'payments' | 'reviews' | 'system';

interface Notification {
  id: string;
  type: 'appointment' | 'payment' | 'review' | 'system' | 'reminder' | 'booking' | 'cancellation';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  clientName?: string;
  amount?: string;
}

interface NotificationPreference {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 2) return 'Yesterday';
  return `${diffDays} days ago`;
}

function mapApiNotification(apiNotification: ApiNotification): Notification {
  return {
    id: apiNotification.id,
    type: apiNotification.type as Notification['type'],
    title: apiNotification.title,
    message: apiNotification.message,
    timestamp: formatTimestamp(apiNotification.timestamp),
    isRead: apiNotification.isRead,
    actionUrl: apiNotification.actionUrl,
    clientName: apiNotification.clientName,
    amount: apiNotification.amount,
  };
}

function mapApiPreferences(apiPrefs: ApiPreferences): NotificationPreference[] {
  return [
    { key: 'new_bookings', label: 'New Bookings', description: 'Get notified when a client books an appointment', enabled: apiPrefs.newBookings },
    { key: 'cancellations', label: 'Cancellations', description: 'Get notified when a client cancels', enabled: apiPrefs.cancellations },
    { key: 'reminders', label: 'Appointment Reminders', description: '30-minute reminders before appointments', enabled: apiPrefs.reminders },
    { key: 'payments', label: 'Payment Updates', description: 'Get notified about payments and pending dues', enabled: apiPrefs.payments },
    { key: 'reviews', label: 'Reviews & Ratings', description: 'Get notified when clients leave reviews', enabled: apiPrefs.reviews },
    { key: 'marketing', label: 'Marketing & Promotions', description: 'Tips and promotional suggestions', enabled: apiPrefs.marketing },
    { key: 'system', label: 'System Updates', description: 'Low stock alerts, reports, and updates', enabled: apiPrefs.system },
  ];
}

function getNotificationStyle(type: Notification['type']) {
  switch (type) {
    case 'booking':
      return { bg: COLORS.violet + '30', icon: '📅', iconBg: COLORS.violet };
    case 'appointment':
      return { bg: COLORS.violet + '30', icon: '📅', iconBg: COLORS.violet };
    case 'payment':
      return { bg: COLORS.green + '30', icon: '💳', iconBg: COLORS.green };
    case 'review':
      return { bg: COLORS.amber + '30', icon: '⭐', iconBg: COLORS.amber };
    case 'reminder':
      return { bg: COLORS.blue + '30', icon: '⏰', iconBg: COLORS.blue };
    case 'cancellation':
      return { bg: COLORS.red + '30', icon: '❌', iconBg: COLORS.red };
    case 'system':
      return { bg: COLORS.textMuted + '30', icon: '🔔', iconBg: COLORS.textMuted };
    default:
      return { bg: COLORS.cardBorder + '30', icon: '📣', iconBg: COLORS.cardBorder };
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface NotificationCardProps {
  notification: Notification;
  onPress: () => void;
  onMarkRead: () => void;
}

function NotificationCard({ notification, onPress, onMarkRead }: NotificationCardProps) {
  const style = getNotificationStyle(notification.type);

  return (
    <TouchableOpacity
      style={[styles.notificationCard, !notification.isRead && styles.notificationCardUnread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.notificationIcon, { backgroundColor: style.bg }]}>
        <Text style={styles.notificationIconText}>{style.icon}</Text>
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, !notification.isRead && styles.notificationTitleUnread]}>
            {notification.title}
          </Text>
          {!notification.isRead && <View style={styles.unreadDot} />}
        </View>
        
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {notification.message}
        </Text>
        
        <View style={styles.notificationFooter}>
          <Text style={styles.notificationTime}>{notification.timestamp}</Text>
          {notification.clientName && (
            <View style={styles.clientTag}>
              <View style={styles.clientTagAvatar}>
                <Text style={styles.clientTagAvatarText}>{getInitials(notification.clientName)}</Text>
              </View>
              <Text style={styles.clientTagName}>{notification.clientName}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'notifications' | 'preferences'>('notifications');
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const [localNotificationOverrides, setLocalNotificationOverrides] = useState<Record<string, boolean>>({});
  
  const { data: notificationsData, loading: loadingNotifications, error: notificationsError, refetch: refetchNotifications } = useNotifications();
  const { data: preferencesData, loading: loadingPreferences, error: preferencesError, refetch: refetchPreferences } = useCommunicationNotificationPreferences();
  const { markNotificationRead, markAllNotificationsRead, updateNotificationPreferences, isSubmitting } = useCommunicationActions();
  
  const [refreshing, setRefreshing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const notifications = useMemo(() => {
    const rawNotifications = notificationsData?.notifications || [];
    const mapped = rawNotifications.map(mapApiNotification);
    return mapped.map(n => ({
      ...n,
      isRead: localNotificationOverrides[n.id] ?? n.isRead,
    }));
  }, [notificationsData, localNotificationOverrides]);

  const preferences = useMemo(() => {
    if (preferencesData) {
      return mapApiPreferences(preferencesData);
    }
    return [];
  }, [preferencesData]);

  const stats = notificationsData?.stats;
  const unreadCount = stats?.unread ?? notifications.filter(n => !n.isRead).length;

  const categoryFilters = useMemo(() => {
    return [
      { key: 'all' as NotificationCategory, label: 'All', count: stats?.total ?? notifications.length },
      { key: 'appointments' as NotificationCategory, label: 'Appointments', count: stats?.appointments ?? 0 },
      { key: 'payments' as NotificationCategory, label: 'Payments', count: stats?.payments ?? 0 },
      { key: 'reviews' as NotificationCategory, label: 'Reviews', count: stats?.reviews ?? 0 },
      { key: 'system' as NotificationCategory, label: 'System', count: stats?.system ?? 0 },
    ];
  }, [stats, notifications.length]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      if (activeCategory === 'all') return true;
      if (activeCategory === 'appointments') {
        return ['booking', 'appointment', 'reminder', 'cancellation'].includes(notification.type);
      }
      if (activeCategory === 'payments') {
        return notification.type === 'payment';
      }
      if (activeCategory === 'reviews') {
        return notification.type === 'review';
      }
      if (activeCategory === 'system') {
        return notification.type === 'system';
      }
      return true;
    });
  }, [notifications, activeCategory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchNotifications();
    await refetchPreferences();
    setRefreshing(false);
  }, [refetchNotifications, refetchPreferences]);

  const handleMarkAllRead = async () => {
    setActionError(null);
    const previousOverrides = { ...localNotificationOverrides };
    const newOverrides = notifications.reduce((acc, n) => ({ ...acc, [n.id]: true }), {});
    setLocalNotificationOverrides(prev => ({ ...prev, ...newOverrides }));
    try {
      await markAllNotificationsRead();
      await refetchNotifications();
    } catch (error) {
      setLocalNotificationOverrides(previousOverrides);
      setActionError('Failed to mark all as read');
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    setActionError(null);
    const previousValue = localNotificationOverrides[notification.id];
    setLocalNotificationOverrides(prev => ({ ...prev, [notification.id]: true }));
    try {
      await markNotificationRead(notification.id);
    } catch (error) {
      if (previousValue !== undefined) {
        setLocalNotificationOverrides(prev => ({ ...prev, [notification.id]: previousValue }));
      } else {
        setLocalNotificationOverrides(prev => {
          const { [notification.id]: _, ...rest } = prev;
          return rest;
        });
      }
      setActionError('Failed to mark as read');
    }
  };

  const handleTogglePreference = async (key: string) => {
    setActionError(null);
    try {
      await updateNotificationPreferences({ [key]: !preferences.find(p => p.key === key)?.enabled });
      await refetchPreferences();
    } catch (error) {
      await refetchPreferences();
      setActionError('Failed to update preference');
    }
  };
  
  const displayError = notificationsError || preferencesError || actionError;
  
  const loading = loadingNotifications || loadingPreferences;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <Text style={styles.headerSubtitle}>{unreadCount} unread</Text>
              )}
            </View>
          </View>

          {activeTab === 'notifications' && unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead}>
              <Text style={styles.markAllRead}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'notifications' && styles.tabActive]}
            onPress={() => setActiveTab('notifications')}
          >
            <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>
              Notifications
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'preferences' && styles.tabActive]}
            onPress={() => setActiveTab('preferences')}
          >
            <Text style={[styles.tabText, activeTab === 'preferences' && styles.tabTextActive]}>
              Preferences
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'notifications' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContainer}
          >
            {categoryFilters.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                onPress={() => setActiveCategory(filter.key)}
                activeOpacity={0.7}
              >
                {activeCategory === filter.key ? (
                  <LinearGradient
                    colors={GRADIENTS.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.filterButtonActive}
                  >
                    <Text style={styles.filterTextActive}>{filter.label}</Text>
                    <View style={styles.filterCountActive}>
                      <Text style={styles.filterCountTextActive}>{filter.count}</Text>
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={styles.filterButton}>
                    <Text style={styles.filterText}>{filter.label}</Text>
                    <View style={styles.filterCount}>
                      <Text style={styles.filterCountText}>{filter.count}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {displayError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorText}>{displayError}</Text>
          {(notificationsError || preferencesError) ? (
            <TouchableOpacity 
              style={styles.errorRetryBtn}
              onPress={onRefresh}
            >
              <Text style={styles.errorRetryText}>Retry</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setActionError(null)}>
              <Text style={styles.errorDismiss}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {activeTab === 'notifications' ? (
        <FlatList
          style={styles.content}
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: Notification }) => (
            <View style={styles.listItemPadding}>
              <NotificationCard
                notification={item}
                onPress={() => handleNotificationPress(item)}
                onMarkRead={() => handleNotificationPress(item)}
              />
            </View>
          )}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={refreshing}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          ListHeaderComponent={
            filteredNotifications.length > 0 ? (
              <View style={styles.sectionHeaderContainer}>
                <Text style={styles.sectionTitle}>Recent</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            loadingNotifications ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.violet} />
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🔔</Text>
                <Text style={styles.emptyTitle}>No notifications</Text>
                <Text style={styles.emptySubtitle}>
                  You're all caught up! We'll notify you when something important happens.
                </Text>
              </View>
            )
          }
          ListFooterComponent={<View style={styles.bottomSpacer} />}
          contentContainerStyle={filteredNotifications.length === 0 ? styles.emptyListContent : undefined}
        />
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.preferencesSection}>
            <Text style={styles.preferencesSectionTitle}>Push Notifications</Text>
            <Text style={styles.preferencesSectionSubtitle}>
              Choose which notifications you want to receive
            </Text>

            <View style={styles.preferencesCard}>
              {preferences.map((preference, index) => (
                <View
                  key={preference.key}
                  style={[
                    styles.preferenceItem,
                    index < preferences.length - 1 && styles.preferenceItemBorder,
                  ]}
                >
                  <View style={styles.preferenceInfo}>
                    <Text style={styles.preferenceLabel}>{preference.label}</Text>
                    <Text style={styles.preferenceDescription}>{preference.description}</Text>
                  </View>
                  <Switch
                    value={preference.enabled}
                    onValueChange={() => handleTogglePreference(preference.key)}
                    trackColor={{ false: COLORS.cardBorder, true: COLORS.violet + '60' }}
                    thumbColor={preference.enabled ? COLORS.violet : COLORS.textMuted}
                  />
                </View>
              ))}
            </View>
          </View>

          <View style={styles.preferencesSection}>
            <Text style={styles.preferencesSectionTitle}>Notification Sound</Text>
            
            <View style={styles.preferencesCard}>
              <TouchableOpacity style={styles.soundOption}>
                <View style={styles.soundInfo}>
                  <Text style={styles.soundLabel}>Sound</Text>
                  <Text style={styles.soundValue}>Default</Text>
                </View>
                <Text style={styles.soundArrow}>→</Text>
              </TouchableOpacity>
              
              <View style={[styles.preferenceItem, styles.preferenceItemBorder]}>
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceLabel}>Vibration</Text>
                  <Text style={styles.preferenceDescription}>Vibrate for notifications</Text>
                </View>
                <Switch
                  value={true}
                  onValueChange={() => {}}
                  trackColor={{ false: COLORS.cardBorder, true: COLORS.violet + '60' }}
                  thumbColor={COLORS.violet}
                />
              </View>
            </View>
          </View>

          <View style={styles.preferencesSection}>
            <Text style={styles.preferencesSectionTitle}>Quiet Hours</Text>
            
            <View style={styles.preferencesCard}>
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceLabel}>Do Not Disturb</Text>
                  <Text style={styles.preferenceDescription}>Mute notifications during specific hours</Text>
                </View>
                <Switch
                  value={false}
                  onValueChange={() => {}}
                  trackColor={{ false: COLORS.cardBorder, true: COLORS.violet + '60' }}
                  thumbColor={COLORS.textMuted}
                />
              </View>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: COLORS.textSecondary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.violet,
  },
  markAllRead: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.violet,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  tabActive: {
    backgroundColor: COLORS.violet,
  },
  tabText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  filterScroll: {
    maxHeight: 44,
    marginBottom: SPACING.md,
  },
  filterContainer: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    flexDirection: 'row',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.sm,
  },
  filterButtonActive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.sm,
  },
  filterText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.white,
  },
  filterCount: {
    backgroundColor: COLORS.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  filterCountActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  filterCountText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    color: COLORS.white,
  },
  filterCountTextActive: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    color: COLORS.white,
  },
  content: {
    flex: 1,
  },
  listItemPadding: {
    paddingHorizontal: SPACING.lg,
  },
  sectionHeaderContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.md,
  },
  notificationCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.violet,
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIconText: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  notificationTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
  },
  notificationTitleUnread: {
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.violet,
  },
  notificationMessage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  clientTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  clientTagAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.violet,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientTagAvatarText: {
    fontSize: 8,
    fontWeight: '600',
    color: COLORS.white,
  },
  clientTagName: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    padding: SPACING.xxl * 2,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 3,
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomSpacer: {
    height: SIZES.listPaddingBottom,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.red + '15',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.red + '30',
  },
  errorIcon: {
    fontSize: FONT_SIZES.md,
    color: COLORS.red,
    fontWeight: '700',
    marginRight: SPACING.sm,
  },
  errorText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.red,
  },
  errorDismiss: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.red,
    fontWeight: '300',
    marginLeft: SPACING.sm,
  },
  errorRetryBtn: {
    backgroundColor: COLORS.red,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  errorRetryText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  preferencesSection: {
    padding: SPACING.lg,
  },
  preferencesSectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  preferencesSectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
  },
  preferencesCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  preferenceItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  preferenceInfo: {
    flex: 1,
    marginRight: SPACING.lg,
  },
  preferenceLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  preferenceDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  soundOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  soundInfo: {
    flex: 1,
  },
  soundLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  soundValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  soundArrow: {
    fontSize: 18,
    color: COLORS.textMuted,
  },
});
