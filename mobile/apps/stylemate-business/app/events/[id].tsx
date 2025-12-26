import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, FlatList, ListRenderItem, Share, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS, SIZES } from '../../constants/theme';
import { useEventDetail, useEventsActions, useEventRegistrations, EventTicket, EventSpeaker, EventScheduleItem, EventRegistration } from '@stylemate/core';

type TabType = 'overview' | 'tickets' | 'waitlist' | 'speakers' | 'schedule' | 'registrations';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { 
    weekday: 'short',
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

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function TicketCard({ ticket }: { ticket: EventTicket }) {
  const percentage = ticket.salesPercentage || 0;
  
  return (
    <View style={styles.ticketCard}>
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketEmoji}>🎫</Text>
        <Text style={styles.ticketName}>{ticket.name}</Text>
      </View>
      <Text style={styles.ticketPrice}>Price: {ticket.priceFormatted}</Text>
      {ticket.earlyBirdPrice && (
        <Text style={styles.earlyBirdText}>
          🕐 Early bird: ₹{(ticket.earlyBirdPrice / 100).toLocaleString()} until {ticket.earlyBirdEndDate}
        </Text>
      )}
      <View style={styles.ticketProgress}>
        <Text style={styles.ticketProgressLabel}>
          Sold: {ticket.soldCount}/{ticket.quantity} • {percentage.toFixed(0)}%
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percentage}%` }]} />
        </View>
      </View>
      <Text style={styles.ticketRevenue}>Revenue: {ticket.revenueFormatted}</Text>
      {ticket.perks && ticket.perks.length > 0 && (
        <Text style={styles.ticketPerks}>
          Includes: {ticket.perks.join(', ')}
        </Text>
      )}
    </View>
  );
}

function SpeakerCard({ speaker }: { speaker: EventSpeaker }) {
  return (
    <View style={styles.speakerCard}>
      <View style={styles.speakerAvatar}>
        <Text style={styles.speakerAvatarText}>
          {speaker.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </Text>
      </View>
      <View style={styles.speakerInfo}>
        <Text style={styles.speakerName}>{speaker.name}</Text>
        {speaker.title && <Text style={styles.speakerTitle}>{speaker.title}</Text>}
        {speaker.bio && <Text style={styles.speakerBio} numberOfLines={2}>{speaker.bio}</Text>}
        {speaker.socialLinks && speaker.socialLinks.length > 0 && (
          <Text style={styles.speakerSocial}>
            🔗 {speaker.socialLinks.map(l => l.platform).join(', ')}
          </Text>
        )}
      </View>
    </View>
  );
}

function ScheduleCard({ item }: { item: EventScheduleItem }) {
  const typeEmoji = item.type === 'break' ? '☕' : item.type === 'registration' ? '📝' : item.type === 'networking' ? '🤝' : '📚';
  
  return (
    <View style={styles.scheduleCard}>
      <View style={styles.scheduleTime}>
        <Text style={styles.scheduleTimeText}>{formatTime(item.startTime)}</Text>
        <Text style={styles.scheduleTimeDivider}>-</Text>
        <Text style={styles.scheduleTimeText}>{formatTime(item.endTime)}</Text>
      </View>
      <View style={styles.scheduleContent}>
        <Text style={styles.scheduleTitle}>{typeEmoji} {item.title}</Text>
        {item.speakerName && <Text style={styles.scheduleSpeaker}>👤 {item.speakerName}</Text>}
        {item.description && <Text style={styles.scheduleDesc} numberOfLines={2}>{item.description}</Text>}
        {item.location && <Text style={styles.scheduleLocation}>📍 {item.location}</Text>}
      </View>
    </View>
  );
}

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const eventId = id as string;
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [refreshing, setRefreshing] = useState(false);
  
  const { data: event, loading, error, refetch } = useEventDetail(eventId);
  const { data: registrations, loading: regLoading, refetch: refetchRegistrations } = useEventRegistrations(eventId);
  const { publishEvent, exportAttendees, isSubmitting } = useEventsActions();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchRegistrations()]);
    setRefreshing(false);
  }, [refetch, refetchRegistrations]);

  const handleExport = async () => {
    const result = await exportAttendees(eventId, 'csv');
    if (result.success && result.url) {
      const url = result.url;
      Alert.alert(
        'Export Ready',
        'Your CSV file has been generated.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open', 
            onPress: async () => {
              try {
                await Linking.openURL(url);
              } catch (e) {
                Alert.alert('Error', 'Unable to open the download link.');
              }
            }
          },
        ]
      );
    } else if (result.success) {
      Alert.alert('Export Ready', 'CSV file has been generated. Check your email.');
    } else {
      Alert.alert('Export Failed', 'Unable to generate export. Please try again.');
    }
  };

  const handleEdit = () => {
    router.push(`/events/create?editId=${eventId}`);
  };

  const handleCheckIn = () => {
    router.push(`/events/${eventId}/check-in`);
  };

  const handleAnalytics = () => {
    router.push(`/events/${eventId}/analytics`);
  };

  const handleShare = async () => {
    if (!event) return;
    try {
      const eventUrl = `https://stylemate.app/events/${event.slug || eventId}`;
      const shareMessage = `Check out "${event.title}" at ${event.venueName}, ${event.city}!\n\n${event.shortDescription || ''}\n\n${eventUrl}`;
      await Share.share({
        message: shareMessage,
        title: event.title || 'Event',
      });
    } catch (error: any) {
      if (error.message !== 'User cancelled') {
        Alert.alert('Share Failed', error.message || 'Unable to share event');
      }
    }
  };

  const handlePublish = async () => {
    const result = await publishEvent(eventId);
    if (result.success) {
      refetch();
    }
  };

  const statusStyle = event ? getStatusStyle(event.status) : null;

  const tabs: { key: TabType; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'tickets', label: 'Tickets' },
    { key: 'waitlist', label: 'Waitlist' },
    { key: 'speakers', label: 'Speakers' },
    { key: 'schedule', label: 'Schedule' },
    { key: 'registrations', label: 'Registrations' },
  ];

  if (loading && !event) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading event...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error || 'Event not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <View style={styles.sectionCard}>
          <Text style={styles.descriptionText}>
            {event.fullDescription || event.shortDescription || 'No description available'}
          </Text>
        </View>
      </View>

      {event.whatToBring && event.whatToBring.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What to Bring 📋</Text>
          <View style={styles.sectionCard}>
            {event.whatToBring.map((item, index) => (
              <Text key={index} style={styles.listItem}>• {item}</Text>
            ))}
          </View>
        </View>
      )}

      {event.includedItems && event.includedItems.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Included in Event ✅</Text>
          <View style={styles.sectionCard}>
            {event.includedItems.map((item, index) => (
              <Text key={index} style={styles.listItem}>• {item}</Text>
            ))}
          </View>
        </View>
      )}

      {event.cancellationPolicy && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cancellation Policy ⚠️</Text>
          <View style={styles.sectionCard}>
            <Text style={styles.listItem}>
              • {event.cancellationPolicy.fullRefundHours}+ hours: Full refund
            </Text>
            <Text style={styles.listItem}>
              • {event.cancellationPolicy.partialRefundHours}-{event.cancellationPolicy.fullRefundHours} hours: {event.cancellationPolicy.partialRefundPercentage}% refund
            </Text>
            <Text style={styles.listItem}>
              • Less than {event.cancellationPolicy.partialRefundHours} hours: No refund
            </Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Venue</Text>
        <View style={styles.sectionCard}>
          <Text style={styles.venueTitle}>📍 {event.venueName}</Text>
          <Text style={styles.venueAddress}>{event.venueAddress}</Text>
          <Text style={styles.venueAddress}>{event.city}</Text>
          {event.venuePhone && (
            <TouchableOpacity style={styles.venueAction}>
              <Text style={styles.venueActionText}>📞 Call Venue</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );

  const renderTicketsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Ticket Types ({event.tickets?.length || 0})</Text>
        <TouchableOpacity>
          <Text style={styles.addText}>➕ Add</Text>
        </TouchableOpacity>
      </View>
      {event.tickets?.map(ticket => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </ScrollView>
  );

  const renderWaitlistTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.emptyTabState}>
        <Text style={styles.emptyTabIcon}>⏳</Text>
        <Text style={styles.emptyTabTitle}>Waitlist</Text>
        <Text style={styles.emptyTabText}>
          {event.waitlistCount > 0 
            ? `${event.waitlistCount} people on waitlist`
            : 'No one on the waitlist yet'
          }
        </Text>
        {event.waitlistCount > 0 && (
          <TouchableOpacity onPress={handleCheckIn} activeOpacity={0.8}>
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.checkInBtn}
            >
              <Text style={styles.checkInBtnText}>Manage Waitlist</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderSpeakersTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Speakers ({event.speakers?.length || 0})</Text>
        <TouchableOpacity>
          <Text style={styles.addText}>➕ Add</Text>
        </TouchableOpacity>
      </View>
      {event.speakers?.length === 0 ? (
        <View style={styles.emptyTabState}>
          <Text style={styles.emptyTabIcon}>👤</Text>
          <Text style={styles.emptyTabText}>No speakers added yet</Text>
        </View>
      ) : (
        event.speakers?.map(speaker => (
          <SpeakerCard key={speaker.id} speaker={speaker} />
        ))
      )}
    </ScrollView>
  );

  const renderScheduleTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Event Schedule</Text>
        <TouchableOpacity>
          <Text style={styles.addText}>➕ Add</Text>
        </TouchableOpacity>
      </View>
      {event.schedule?.length === 0 ? (
        <View style={styles.emptyTabState}>
          <Text style={styles.emptyTabIcon}>📅</Text>
          <Text style={styles.emptyTabText}>No schedule added yet</Text>
        </View>
      ) : (
        event.schedule?.map(item => (
          <ScheduleCard key={item.id} item={item} />
        ))
      )}
    </ScrollView>
  );

  const renderRegistrationsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.registrationsHeader}>
        <Text style={styles.sectionTitle}>
          Registrations ({registrations?.length || 0})
        </Text>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <Text style={styles.exportBtnText}>📤 Export</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleCheckIn} activeOpacity={0.8} style={styles.checkInBtnWrapper}>
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.checkInBtn}
        >
          <Text style={styles.checkInBtnIcon}>📱</Text>
          <Text style={styles.checkInBtnText}>Start Check-In</Text>
        </LinearGradient>
      </TouchableOpacity>

      {regLoading && !registrations?.length ? (
        <View style={styles.emptyTabState}>
          <ActivityIndicator size="small" color={COLORS.violet} />
          <Text style={styles.emptyTabText}>Loading registrations...</Text>
        </View>
      ) : !registrations?.length ? (
        <View style={styles.emptyTabState}>
          <Text style={styles.emptyTabIcon}>👥</Text>
          <Text style={styles.emptyTabTitle}>No Registrations</Text>
          <Text style={styles.emptyTabText}>No one has registered yet</Text>
        </View>
      ) : (
        registrations.slice(0, 20).map(reg => {
          const statusStyle = reg.checkInStatus === 'checked_in' 
            ? { bg: COLORS.green + '30', text: COLORS.green, label: '✓ In' }
            : reg.checkInStatus === 'late'
            ? { bg: COLORS.amber + '30', text: COLORS.amber, label: 'Late' }
            : reg.checkInStatus === 'no_show'
            ? { bg: COLORS.red + '30', text: COLORS.red, label: 'No Show' }
            : { bg: COLORS.cardBorder + '30', text: COLORS.textSecondary, label: 'Pending' };

          return (
            <View key={reg.id} style={styles.attendeeRow}>
              <View style={styles.attendeeAvatar}>
                <Text style={styles.attendeeInitial}>
                  {reg.attendeeName?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <View style={styles.attendeeInfo}>
                <Text style={styles.attendeeName}>{reg.attendeeName}</Text>
                <Text style={styles.attendeeEmail}>{reg.attendeeEmail}</Text>
                <Text style={styles.attendeeMeta}>{reg.ticketTypeName}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
              </View>
            </View>
          );
        })
      )}
      {(registrations?.length || 0) > 20 && (
        <TouchableOpacity onPress={handleCheckIn} style={styles.viewMoreBtn}>
          <Text style={styles.viewMoreText}>View all {registrations?.length} attendees →</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'tickets':
        return renderTicketsTab();
      case 'waitlist':
        return renderWaitlistTab();
      case 'speakers':
        return renderSpeakersTab();
      case 'schedule':
        return renderScheduleTab();
      case 'registrations':
        return renderRegistrationsTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleEdit}>
            <Text style={styles.headerBtnIcon}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Text style={styles.headerBtnIcon}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.violet}
          />
        }
        stickyHeaderIndices={[2]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.coverImage}>
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.coverGradient}
          >
            <Text style={styles.coverEmoji}>📅</Text>
            {statusStyle && (
              <View style={[styles.coverStatus, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.coverStatusText, { color: statusStyle.text }]}>
                  {statusStyle.label}
                </Text>
              </View>
            )}
          </LinearGradient>
        </View>

        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventType}>
            🏷️ {event.eventType} • {event.isRecurring ? `🔄 ${event.recurringType}` : '🔄 One-time'}
          </Text>

          <View style={styles.infoChips}>
            <View style={styles.infoChip}>
              <Text style={styles.infoChipIcon}>📅</Text>
              <Text style={styles.infoChipText}>{formatDate(event.startDate)}</Text>
            </View>
            <View style={styles.infoChip}>
              <Text style={styles.infoChipIcon}>⏰</Text>
              <Text style={styles.infoChipText}>{formatTime(event.startTime)}</Text>
            </View>
            <View style={styles.infoChip}>
              <Text style={styles.infoChipIcon}>📍</Text>
              <Text style={styles.infoChipText}>{event.city}</Text>
            </View>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.statsScroll}
            contentContainerStyle={styles.statsContainer}
          >
            <StatCard icon="💰" label="Revenue" value={event.revenueFormatted} />
            <StatCard icon="👥" label="Registered" value={event.currentRegistrations} />
            <StatCard icon="🎫" label="Spots Left" value={event.spotsLeft} />
            <StatCard icon="⏳" label="Waitlisted" value={event.waitlistCount} />
          </ScrollView>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCheckIn}>
              <Text style={styles.actionBtnIcon}>📱</Text>
              <Text style={styles.actionBtnText}>Check-In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleAnalytics}>
              <Text style={styles.actionBtnIcon}>📊</Text>
              <Text style={styles.actionBtnText}>Stats</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionBtnIcon}>📩</Text>
              <Text style={styles.actionBtnText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Text style={styles.actionBtnIcon}>🔗</Text>
              <Text style={styles.actionBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContainer}
        >
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {renderTabContent()}
      </ScrollView>
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
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnIcon: {
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
  },
  retryText: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  coverImage: {
    height: 180,
  },
  coverGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverEmoji: {
    fontSize: 64,
  },
  coverStatus: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  coverStatusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  eventInfo: {
    padding: SPACING.lg,
  },
  eventTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  eventType: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.md,
  },
  infoChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  infoChipIcon: {
    fontSize: FONT_SIZES.md,
  },
  infoChipText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
  },
  statsScroll: {
    marginHorizontal: -SPACING.lg,
    marginBottom: SPACING.md,
  },
  statsContainer: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  statCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statIcon: {
    fontSize: FONT_SIZES.xl,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    marginBottom: SPACING.xs,
  },
  statValue: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.xs,
  },
  actionBtnIcon: {
    fontSize: FONT_SIZES.lg,
  },
  actionBtnText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  tabsScroll: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  tabsContainer: {
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
  tabContent: {
    flex: 1,
    padding: SPACING.lg,
    minHeight: 400,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  addText: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  descriptionText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
  },
  listItem: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  venueTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  venueAddress: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: 2,
  },
  venueAction: {
    marginTop: SPACING.sm,
  },
  venueActionText: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  ticketCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  ticketEmoji: {
    fontSize: FONT_SIZES.xl,
  },
  ticketName: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  ticketPrice: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  earlyBirdText: {
    color: COLORS.amber,
    fontSize: FONT_SIZES.xs,
    marginBottom: SPACING.sm,
  },
  ticketProgress: {
    marginBottom: SPACING.sm,
  },
  ticketProgressLabel: {
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
  ticketRevenue: {
    color: COLORS.green,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  ticketPerks: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
  },
  speakerCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    flexDirection: 'row',
    gap: SPACING.md,
  },
  speakerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.violet + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerAvatarText: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  speakerInfo: {
    flex: 1,
  },
  speakerName: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  speakerTitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  speakerBio: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  speakerSocial: {
    color: COLORS.blue,
    fontSize: FONT_SIZES.xs,
  },
  scheduleCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    flexDirection: 'row',
    gap: SPACING.md,
  },
  scheduleTime: {
    alignItems: 'center',
    minWidth: 60,
  },
  scheduleTimeText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  scheduleTimeDivider: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  scheduleSpeaker: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  scheduleDesc: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  scheduleLocation: {
    color: COLORS.blue,
    fontSize: FONT_SIZES.xs,
  },
  registrationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  exportBtn: {
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  exportBtnText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  emptyTabState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTabIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTabTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  emptyTabText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  checkInBtnWrapper: {
    marginBottom: SPACING.lg,
  },
  checkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  checkInBtnIcon: {
    fontSize: FONT_SIZES.lg,
  },
  checkInBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  attendeeRow: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  attendeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.violet + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendeeInitial: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  attendeeEmail: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: 2,
  },
  attendeeMeta: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  viewMoreBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  viewMoreText: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
});
