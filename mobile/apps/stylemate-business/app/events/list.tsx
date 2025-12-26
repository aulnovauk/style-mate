import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, FlatList, RefreshControl, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS, SIZES } from '../../constants/theme';
import { useEventsList, useEventDrafts, usePastEvents, EventListItem } from '@stylemate/core';

type TabType = 'active' | 'drafts' | 'past';

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

interface EventCardProps {
  event: EventListItem;
  tab: TabType;
  onPress: () => void;
  onManage: () => void;
  onAnalytics: () => void;
  onClone?: () => void;
  onContinueEditing?: () => void;
  onPublish?: () => void;
}

function EventCard({ event, tab, onPress, onManage, onAnalytics, onClone, onContinueEditing, onPublish }: EventCardProps) {
  const statusStyle = getStatusStyle(event.status);
  const isSoldOut = event.spotsLeft <= 0;

  if (tab === 'drafts') {
    const completionPercentage = event.completionPercentage || 0;
    const isReady = completionPercentage >= 100;
    
    return (
      <TouchableOpacity style={styles.eventCard} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.eventCardContent}>
          <View style={styles.eventImageSmall}>
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.eventImageGradient}
            >
              <Text style={styles.eventImageEmoji}>📝</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.eventDetailsSmall}>
            <View style={styles.eventHeader}>
              <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
              </View>
            </View>
            
            <Text style={styles.eventMeta}>🏷️ {event.eventType}</Text>
            <Text style={styles.eventMeta}>Created: {formatDate(event.startDate)}</Text>
            
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>Completion: {completionPercentage}%</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${completionPercentage}%` }]} />
              </View>
            </View>
            
            {isReady ? (
              <View style={styles.readyBadge}>
                <Text style={styles.readyText}>✅ Ready to publish</Text>
              </View>
            ) : (
              <View style={styles.missingBadge}>
                <Text style={styles.missingText}>
                  ⚠️ Missing: {event.missingFields?.join(', ') || 'Details'}
                </Text>
              </View>
            )}
            
            <View style={styles.actionButtons}>
              {isReady ? (
                <>
                  <TouchableOpacity style={styles.actionBtn} onPress={onContinueEditing}>
                    <Text style={styles.actionBtnIcon}>✏️</Text>
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onPublish} activeOpacity={0.8}>
                    <LinearGradient
                      colors={GRADIENTS.success}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.publishBtn}
                    >
                      <Text style={styles.publishBtnIcon}>📤</Text>
                      <Text style={styles.publishBtnText}>Publish</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.continueEditingBtn} onPress={onContinueEditing}>
                  <Text style={styles.continueEditingIcon}>✏️</Text>
                  <Text style={styles.continueEditingText}>Continue Editing</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (tab === 'past') {
    return (
      <TouchableOpacity style={styles.eventCard} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.eventCardContent}>
          <View style={styles.eventImageSmall}>
            <LinearGradient
              colors={GRADIENTS.info}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.eventImageGradient}
            >
              <Text style={styles.eventImageEmoji}>📅</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.eventDetailsSmall}>
            <View style={styles.eventHeader}>
              <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
              </View>
            </View>
            
            <Text style={styles.eventMeta}>🏷️ {event.eventType}</Text>
            <Text style={styles.eventMeta}>📅 {formatDate(event.startDate)}</Text>
            <Text style={styles.eventMeta}>📍 {event.city}</Text>
            
            <View style={styles.pastEventStats}>
              <Text style={styles.pastStatText}>👥 {event.currentRegistrations}/{event.maxCapacity}</Text>
              <Text style={styles.pastStatText}>💰 {event.revenueFormatted}</Text>
              {event.avgRating && (
                <Text style={styles.pastStatText}>⭐ {event.avgRating.toFixed(1)}</Text>
              )}
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionBtn} onPress={onAnalytics}>
                <Text style={styles.actionBtnIcon}>📊</Text>
                <Text style={styles.actionBtnText}>Analytics</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={onClone}>
                <Text style={styles.actionBtnIcon}>📋</Text>
                <Text style={styles.actionBtnText}>Clone</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.eventCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.eventCardContent}>
        <View style={styles.eventImageSmall}>
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.eventImageGradient}
          >
            <Text style={styles.eventImageEmoji}>📅</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.eventDetailsSmall}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
            </View>
          </View>
          
          <View style={styles.eventTypeBadge}>
            <Text style={styles.eventTypeText}>🏷️ {event.eventType}</Text>
            {event.isRecurring && (
              <Text style={styles.recurringText}>🔄 Recurring ({event.recurringType})</Text>
            )}
          </View>
          
          <Text style={styles.eventMeta}>📅 {formatDate(event.startDate)} • {formatTime(event.startTime)}</Text>
          <Text style={styles.eventMeta}>📍 {event.venueName}, {event.city}</Text>
          
          <View style={styles.activeEventStats}>
            <Text style={styles.activeStatText}>
              👥 {event.currentRegistrations}/{event.maxCapacity}
            </Text>
            <Text style={styles.activeStatText}>💰 {event.revenueFormatted}</Text>
            {isSoldOut ? (
              <View style={styles.soldOutBadge}>
                <Text style={styles.soldOutText}>SOLD OUT</Text>
              </View>
            ) : (
              <Text style={styles.spotsLeftText}>{event.spotsLeft} spots</Text>
            )}
          </View>
          
          {event.waitlistCount > 0 && (
            <Text style={styles.waitlistText}>⏳ {event.waitlistCount} waitlisted</Text>
          )}
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionBtn} onPress={onManage}>
              <Text style={styles.actionBtnIcon}>📋</Text>
              <Text style={styles.actionBtnText}>Manage</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={onAnalytics}>
              <Text style={styles.actionBtnIcon}>📊</Text>
              <Text style={styles.actionBtnText}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function EventsListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialTab = (params.tab as TabType) || 'active';
  
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const { data: activeData, loading: activeLoading, error: activeError, refetch: refetchActive } = useEventsList({ status: 'published', search: searchQuery });
  const { data: draftsData, loading: draftsLoading, error: draftsError, refetch: refetchDrafts } = useEventDrafts();
  const { data: pastData, loading: pastLoading, error: pastError, refetch: refetchPast } = usePastEvents();

  useEffect(() => {
    if (params.tab) {
      setActiveTab(params.tab as TabType);
    }
  }, [params.tab]);

  const currentData = useMemo(() => {
    switch (activeTab) {
      case 'drafts':
        return draftsData;
      case 'past':
        return pastData;
      default:
        return activeData;
    }
  }, [activeTab, activeData, draftsData, pastData]);

  const currentLoading = activeTab === 'active' ? activeLoading : activeTab === 'drafts' ? draftsLoading : pastLoading;
  const currentError = activeTab === 'active' ? activeError : activeTab === 'drafts' ? draftsError : pastError;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    switch (activeTab) {
      case 'drafts':
        await refetchDrafts();
        break;
      case 'past':
        await refetchPast();
        break;
      default:
        await refetchActive();
    }
    setRefreshing(false);
  }, [activeTab, refetchActive, refetchDrafts, refetchPast]);

  const handleCreateEvent = () => {
    router.push('/events/create');
  };

  const handleEventPress = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  const handleManage = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  const handleAnalytics = (eventId: string) => {
    router.push(`/events/${eventId}/analytics`);
  };

  const handleClone = (eventId: string) => {
    router.push(`/events/clone?sourceId=${eventId}`);
  };

  const handleContinueEditing = (eventId: string) => {
    router.push(`/events/create?editId=${eventId}`);
  };

  const handlePublish = (eventId: string) => {
    router.push(`/events/${eventId}?action=publish`);
  };

  const events = currentData?.events || [];
  const draftsCount = draftsData?.total || 0;

  const renderEventItem: ListRenderItem<EventListItem> = useCallback(({ item }) => (
    <EventCard
      event={item}
      tab={activeTab}
      onPress={() => handleEventPress(item.id)}
      onManage={() => handleManage(item.id)}
      onAnalytics={() => handleAnalytics(item.id)}
      onClone={() => handleClone(item.id)}
      onContinueEditing={() => handleContinueEditing(item.id)}
      onPublish={() => handlePublish(item.id)}
    />
  ), [activeTab]);

  const keyExtractor = useCallback((item: EventListItem) => item.id, []);

  const renderHeader = () => {
    if (activeTab === 'drafts') {
      const readyCount = events.filter(e => (e.completionPercentage || 0) >= 100).length;
      const needsWorkCount = events.length - readyCount;
      
      return (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>Total Drafts</Text>
            <Text style={styles.statBoxValue}>{events.length}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>Ready to Publish</Text>
            <Text style={[styles.statBoxValue, { color: COLORS.green }]}>{readyCount}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>Needs Work</Text>
            <Text style={[styles.statBoxValue, { color: COLORS.amber }]}>{needsWorkCount}</Text>
          </View>
        </View>
      );
    }
    
    if (activeTab === 'past') {
      const totalAttendees = events.reduce((sum, e) => sum + e.currentRegistrations, 0);
      const totalRevenue = events.reduce((sum, e) => sum + e.revenue, 0);
      
      return (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>Total Events</Text>
            <Text style={styles.statBoxValue}>{events.length}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>Attendees</Text>
            <Text style={styles.statBoxValue}>{totalAttendees}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>Revenue</Text>
            <Text style={[styles.statBoxValue, { color: COLORS.green }]}>₹{(totalRevenue / 100).toLocaleString()}</Text>
          </View>
        </View>
      );
    }
    
    return null;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>
        {activeTab === 'drafts' ? '📝' : activeTab === 'past' ? '📊' : '📅'}
      </Text>
      <Text style={styles.emptyTitle}>
        {activeTab === 'drafts' ? 'No Draft Events' : activeTab === 'past' ? 'No Past Events' : 'No Active Events'}
      </Text>
      <Text style={styles.emptyDescription}>
        {activeTab === 'drafts' 
          ? 'Start creating an event and save it as a draft'
          : activeTab === 'past' 
          ? 'Your completed events will appear here'
          : 'Create your first event to get started'
        }
      </Text>
      {activeTab === 'active' && (
        <TouchableOpacity onPress={handleCreateEvent} activeOpacity={0.8}>
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createButton}
          >
            <Text style={styles.createButtonIcon}>➕</Text>
            <Text style={styles.createButtonText}>Create Event</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Events</Text>
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

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'drafts' && styles.tabActive]}
          onPress={() => setActiveTab('drafts')}
        >
          <Text style={[styles.tabText, activeTab === 'drafts' && styles.tabTextActive]}>
            Drafts {draftsCount > 0 && `(${draftsCount})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>Past</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {currentLoading && !currentData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : currentError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{currentError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={renderHeader}
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  tab: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tabActive: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: SPACING.md,
  },
  searchIcon: {
    fontSize: FONT_SIZES.lg,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
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
  },
  retryText: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: SIZES.listPaddingBottom,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statBoxLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    marginBottom: SPACING.xs,
  },
  statBoxValue: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
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
  eventCardContent: {
    flexDirection: 'row',
    padding: SPACING.md,
  },
  eventImageSmall: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  eventImageGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventImageEmoji: {
    fontSize: 32,
  },
  eventDetailsSmall: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  eventTitle: {
    flex: 1,
    fontSize: FONT_SIZES.md,
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
  eventTypeBadge: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  eventTypeText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
  },
  recurringText: {
    color: COLORS.blue,
    fontSize: FONT_SIZES.xs,
  },
  eventMeta: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    marginBottom: 2,
  },
  activeEventStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
    flexWrap: 'wrap',
  },
  activeStatText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  soldOutBadge: {
    backgroundColor: COLORS.red + '30',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.sm,
  },
  soldOutText: {
    color: COLORS.red,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  spotsLeftText: {
    color: COLORS.green,
    fontSize: FONT_SIZES.xs,
  },
  waitlistText: {
    color: COLORS.amber,
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
  },
  progressContainer: {
    marginTop: SPACING.xs,
  },
  progressLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.violet,
    borderRadius: 3,
  },
  readyBadge: {
    marginTop: SPACING.xs,
  },
  readyText: {
    color: COLORS.green,
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  missingBadge: {
    marginTop: SPACING.xs,
  },
  missingText: {
    color: COLORS.amber,
    fontSize: FONT_SIZES.xs,
  },
  pastEventStats: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  pastStatText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  actionBtnIcon: {
    fontSize: FONT_SIZES.sm,
  },
  actionBtnText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  continueEditingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  continueEditingIcon: {
    fontSize: FONT_SIZES.sm,
  },
  continueEditingText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  publishBtnIcon: {
    fontSize: FONT_SIZES.sm,
  },
  publishBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  createButtonIcon: {
    fontSize: FONT_SIZES.lg,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
