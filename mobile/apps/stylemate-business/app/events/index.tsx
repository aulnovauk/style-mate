import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, RefreshControl, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS, SIZES } from '../../constants/theme';
import { useEventsDashboard, EventListItem, TodayEventAlert } from '@stylemate/core';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function getCapacityColor(spotsLeft: number, maxCapacity: number): string {
  const percentage = (maxCapacity - spotsLeft) / maxCapacity;
  if (percentage >= 1) return COLORS.red;
  if (percentage >= 0.8) return COLORS.amber;
  return COLORS.green;
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'published':
      return { bg: COLORS.green + '30', text: COLORS.green, label: 'Live' };
    case 'draft':
      return { bg: COLORS.amber + '30', text: COLORS.amber, label: 'Draft' };
    case 'cancelled':
      return { bg: COLORS.red + '30', text: COLORS.red, label: 'Cancelled' };
    case 'completed':
      return { bg: COLORS.blue + '30', text: COLORS.blue, label: 'Completed' };
    default:
      return { bg: COLORS.cardBorder + '30', text: COLORS.textSecondary, label: status };
  }
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  subValue?: string;
  onPress?: () => void;
}

function StatCard({ icon, label, value, subValue, onPress }: StatCardProps) {
  return (
    <TouchableOpacity style={styles.statCard} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {subValue && <Text style={styles.statSubValue}>{subValue}</Text>}
    </TouchableOpacity>
  );
}

interface TodayAlertCardProps {
  event: TodayEventAlert;
  onStartCheckIn: () => void;
}

function TodayAlertCard({ event, onStartCheckIn }: TodayAlertCardProps) {
  return (
    <LinearGradient
      colors={[COLORS.violet + '40', COLORS.fuchsia + '30']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.todayAlertCard}
    >
      <View style={styles.todayAlertHeader}>
        <Text style={styles.todayAlertBadge}>TODAY</Text>
        <Text style={styles.todayAlertTime}>{formatTime(event.startTime)}</Text>
      </View>
      <Text style={styles.todayAlertTitle} numberOfLines={1}>{event.title}</Text>
      <Text style={styles.todayAlertStats}>
        {event.attendees} attendees • {event.checkedIn} checked in
      </Text>
      <TouchableOpacity style={styles.startCheckInButton} onPress={onStartCheckIn} activeOpacity={0.8}>
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.startCheckInGradient}
        >
          <Text style={styles.startCheckInIcon}>📱</Text>
          <Text style={styles.startCheckInText}>Start Check-In</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}

interface EventCardProps {
  event: EventListItem;
  onPress: () => void;
}

function EventCard({ event, onPress }: EventCardProps) {
  const statusStyle = getStatusStyle(event.status);
  const capacityColor = getCapacityColor(event.spotsLeft, event.maxCapacity);
  const isSoldOut = event.spotsLeft <= 0;

  return (
    <TouchableOpacity style={styles.eventCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.eventImagePlaceholder}>
        {event.coverImage ? (
          <Text style={styles.eventImageText}>📷</Text>
        ) : (
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.eventImageGradient}
          >
            <Text style={styles.eventImageEmoji}>📅</Text>
          </LinearGradient>
        )}
      </View>

      <View style={styles.eventDetails}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
          </View>
        </View>

        <Text style={styles.eventMeta}>
          📅 {formatDate(event.startDate)} • {formatTime(event.startTime)}
        </Text>
        <Text style={styles.eventMeta}>📍 {event.city}</Text>

        <View style={styles.eventStats}>
          <View style={styles.capacityContainer}>
            <Text style={[styles.capacityStat, { color: capacityColor }]}>
              👥 {event.currentRegistrations}/{event.maxCapacity}
            </Text>
            {isSoldOut ? (
              <View style={[styles.soldOutBadge]}>
                <Text style={styles.soldOutText}>SOLD OUT</Text>
              </View>
            ) : (
              <Text style={styles.spotsText}>{event.spotsLeft} left</Text>
            )}
          </View>
          
          {event.waitlistCount > 0 && (
            <Text style={styles.waitlistStat}>⏳ {event.waitlistCount} waitlisted</Text>
          )}
        </View>

        {event.newRegistrationsToday > 0 && (
          <View style={styles.newRegistrationsBadge}>
            <Text style={styles.newRegistrationsText}>
              🆕 +{event.newRegistrationsToday} today
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function EventsDashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const { data, loading, error, refetch } = useEventsDashboard();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCreateEvent = () => {
    router.push('/events/create');
  };

  const handleViewAllEvents = () => {
    router.push('/events/list');
  };

  const handleDrafts = () => {
    router.push('/events/list?tab=drafts');
  };

  const handlePastEvents = () => {
    router.push('/events/list?tab=past');
  };

  const handleEventPress = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  const handleStartCheckIn = (eventId: string) => {
    router.push(`/events/${eventId}/check-in`);
  };

  const stats = data?.stats;
  const todayEvents = data?.todayEvents || [];
  const upcomingEvents = data?.upcomingEvents || [];
  const draftsCount = data?.draftsCount || 0;

  const renderEventItem: ListRenderItem<EventListItem> = useCallback(({ item }) => (
    <EventCard event={item} onPress={() => handleEventPress(item.id)} />
  ), []);

  const keyExtractor = useCallback((item: EventListItem) => item.id, []);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📅</Text>
      <Text style={styles.emptyTitle}>No Upcoming Events</Text>
      <Text style={styles.emptyDescription}>
        Create your first event to start engaging with customers
      </Text>
      <TouchableOpacity onPress={handleCreateEvent} activeOpacity={0.8}>
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.emptyButton}
        >
          <Text style={styles.emptyButtonIcon}>➕</Text>
          <Text style={styles.emptyButtonText}>Create Event</Text>
        </LinearGradient>
      </TouchableOpacity>
      <View style={styles.tipContainer}>
        <Text style={styles.tipText}>
          💡 Tip: Workshops and masterclasses can boost your revenue by 30%
        </Text>
      </View>
    </View>
  );

  const renderHeader = () => (
    <>
      {todayEvents.length > 0 && (
        <View style={styles.todayAlertsSection}>
          {todayEvents.map((event) => (
            <TodayAlertCard
              key={event.id}
              event={event}
              onStartCheckIn={() => handleStartCheckIn(event.id)}
            />
          ))}
        </View>
      )}

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.statsScroll}
        contentContainerStyle={styles.statsContainer}
      >
        <StatCard icon="📅" label="Active Events" value={stats?.activeEvents || 0} />
        <StatCard icon="👥" label="Registered" value={stats?.totalRegistrations || 0} />
        <StatCard icon="💰" label="Revenue" value={stats?.revenueFormatted || '₹0'} />
        <StatCard icon="⏳" label="Waitlisted" value={stats?.waitlisted || 0} />
        <StatCard icon="📊" label="Fill Rate" value={`${stats?.fillRate || 0}%`} />
        <StatCard icon="⭐" label="Avg Rating" value={stats?.avgRating?.toFixed(1) || 'N/A'} />
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        <TouchableOpacity onPress={handleViewAllEvents}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderFooter = () => (
    <View style={styles.quickActionsSection}>
      <Text style={styles.quickActionsTitle}>Quick Actions</Text>
      
      <TouchableOpacity onPress={handleCreateEvent} activeOpacity={0.8}>
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryActionButton}
        >
          <Text style={styles.actionButtonIcon}>➕</Text>
          <Text style={styles.primaryActionText}>Create New Event</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.secondaryActionsRow}>
        <TouchableOpacity style={styles.secondaryActionButton} onPress={handleDrafts} activeOpacity={0.7}>
          <Text style={styles.secondaryActionIcon}>📝</Text>
          <Text style={styles.secondaryActionText}>Drafts</Text>
          {draftsCount > 0 && (
            <View style={styles.draftsBadge}>
              <Text style={styles.draftsBadgeText}>{draftsCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryActionButton} onPress={handlePastEvents} activeOpacity={0.7}>
          <Text style={styles.secondaryActionIcon}>📊</Text>
          <Text style={styles.secondaryActionText}>Past Events</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Events</Text>
          </View>
          <TouchableOpacity onPress={handleCreateEvent}>
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addButton}
            >
              <Text style={styles.addButtonIcon}>➕</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Events</Text>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Events</Text>
        </View>
        <TouchableOpacity onPress={handleCreateEvent}>
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButton}
          >
            <Text style={styles.addButtonIcon}>➕</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <FlatList
        data={upcomingEvents}
        renderItem={renderEventItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={upcomingEvents.length > 0 ? renderFooter : null}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.violet}
            colors={[COLORS.violet]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonIcon: {
    fontSize: FONT_SIZES.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    gap: SPACING.md,
  },
  errorIcon: {
    fontSize: 48,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
  },
  retryText: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: SIZES.listPaddingBottom,
  },
  todayAlertsSection: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  todayAlertCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.violet + '40',
  },
  todayAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  todayAlertBadge: {
    backgroundColor: COLORS.violet,
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  todayAlertTime: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  todayAlertTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  todayAlertStats: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.md,
  },
  startCheckInButton: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  startCheckInGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  startCheckInIcon: {
    fontSize: FONT_SIZES.lg,
  },
  startCheckInText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  statsScroll: {
    paddingVertical: SPACING.md,
  },
  statsContainer: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  statCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    minWidth: 90,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statIcon: {
    fontSize: FONT_SIZES.xxl,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    marginBottom: SPACING.xs,
  },
  statValue: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  statSubValue: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  viewAllText: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  eventCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  eventImagePlaceholder: {
    height: 120,
    backgroundColor: COLORS.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventImageText: {
    fontSize: 40,
  },
  eventImageGradient: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventImageEmoji: {
    fontSize: 48,
  },
  eventDetails: {
    padding: SPACING.lg,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  eventTitle: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  eventMeta: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: 4,
  },
  eventStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  capacityStat: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  spotsText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
  },
  soldOutBadge: {
    backgroundColor: COLORS.red + '30',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  soldOutText: {
    color: COLORS.red,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  waitlistStat: {
    color: COLORS.amber,
    fontSize: FONT_SIZES.sm,
  },
  newRegistrationsBadge: {
    marginTop: SPACING.sm,
  },
  newRegistrationsText: {
    color: COLORS.green,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  quickActionsSection: {
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },
  quickActionsTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  actionButtonIcon: {
    fontSize: FONT_SIZES.lg,
  },
  primaryActionText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.sm,
  },
  secondaryActionIcon: {
    fontSize: FONT_SIZES.lg,
  },
  secondaryActionText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  draftsBadge: {
    backgroundColor: COLORS.amber,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  draftsBadgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    marginTop: SPACING.xxl,
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
  emptyDescription: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  emptyButtonIcon: {
    fontSize: FONT_SIZES.lg,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  tipContainer: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tipText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
});
