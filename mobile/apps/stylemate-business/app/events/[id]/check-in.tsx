import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, FlatList, RefreshControl, Alert, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS, SIZES } from '../../../constants/theme';
import { useEventRegistrations, useEventsActions, EventRegistration } from '@stylemate/core';

type FilterType = 'all' | 'not_checked_in' | 'checked_in' | 'late' | 'no_show';

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function getCheckInStatusStyle(status: string) {
  switch (status) {
    case 'checked_in':
      return { bg: COLORS.green + '30', text: COLORS.green, label: 'Checked In', icon: '✅' };
    case 'late':
      return { bg: COLORS.amber + '30', text: COLORS.amber, label: 'Late', icon: '⏰' };
    case 'no_show':
      return { bg: COLORS.red + '30', text: COLORS.red, label: 'No Show', icon: '❌' };
    default:
      return { bg: COLORS.cardBorder + '30', text: COLORS.textSecondary, label: 'Not Checked In', icon: '⏳' };
  }
}

interface AttendeeCardProps {
  registration: EventRegistration;
  onCheckIn: () => void;
  onMarkLate: () => void;
  onMarkNoShow: () => void;
  isChecking: boolean;
}

function AttendeeCard({ registration, onCheckIn, onMarkLate, onMarkNoShow, isChecking }: AttendeeCardProps) {
  const statusStyle = getCheckInStatusStyle(registration.checkInStatus);
  const isCheckedIn = registration.checkInStatus === 'checked_in' || registration.checkInStatus === 'late';

  return (
    <View style={styles.attendeeCard}>
      <View style={styles.attendeeHeader}>
        <View style={styles.attendeeAvatar}>
          <Text style={styles.attendeeAvatarText}>
            {registration.attendeeName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={styles.attendeeInfo}>
          <View style={styles.attendeeNameRow}>
            <Text style={styles.attendeeName}>{registration.attendeeName}</Text>
            {registration.isBirthday && <Text style={styles.birthdayEmoji}>🎂</Text>}
            {registration.isFirstEvent && <Text style={styles.firstEventEmoji}>🆕</Text>}
          </View>
          <Text style={styles.attendeeTicket}>🎫 {registration.ticketTypeName}</Text>
          <Text style={styles.attendeeMeta}>
            Qty: {registration.ticketQuantity} • {registration.totalAmountFormatted}
          </Text>
          {registration.guests && registration.guests.length > 0 && (
            <Text style={styles.guestsText}>
              👥 +{registration.guests.length} guest{registration.guests.length > 1 ? 's' : ''}
            </Text>
          )}
          {registration.missingInfo && registration.missingInfo.length > 0 && (
            <Text style={styles.missingInfoText}>
              ⚠️ Missing: {registration.missingInfo.join(', ')}
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={styles.statusIcon}>{statusStyle.icon}</Text>
        </View>
      </View>

      {isCheckedIn ? (
        <View style={styles.checkedInInfo}>
          <Text style={styles.checkedInText}>
            {statusStyle.label} at {registration.checkedInAt ? formatTime(registration.checkedInAt) : 'N/A'}
          </Text>
        </View>
      ) : (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.checkInBtn, isChecking && styles.btnDisabled]} 
            onPress={onCheckIn}
            disabled={isChecking}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={GRADIENTS.success}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.checkInBtnGradient}
            >
              {isChecking ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.checkInBtnIcon}>✅</Text>
                  <Text style={styles.checkInBtnText}>Check In</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.lateBtn} 
            onPress={onMarkLate}
            disabled={isChecking}
          >
            <Text style={styles.lateBtnIcon}>⏰</Text>
            <Text style={styles.lateBtnText}>Late</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.noShowBtn} 
            onPress={onMarkNoShow}
            disabled={isChecking}
          >
            <Text style={styles.noShowBtnIcon}>❌</Text>
            <Text style={styles.noShowBtnText}>No Show</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function EventCheckInScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const eventId = id as string;

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const { data, loading, error, refetch } = useEventRegistrations(eventId, activeFilter, searchQuery);
  const { checkIn, markNoShow, isSubmitting } = useEventsActions();

  const registrations = useMemo(() => {
    return data?.registrations || [];
  }, [data]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCheckIn = async (registrationId: string, isLate?: boolean) => {
    setCheckingId(registrationId);
    const result = await checkIn(eventId, { registrationId, isLate });
    setCheckingId(null);

    if (result.success) {
      Vibration.vibrate(100);
      refetch();
    } else if (result.alreadyCheckedIn) {
      Alert.alert('Already Checked In', `This attendee was checked in at ${result.checkedInAt || 'earlier'}`);
    } else {
      Alert.alert('Check-In Failed', result.error || 'Please try again');
    }
  };

  const handleMarkNoShow = (registrationId: string) => {
    Alert.alert(
      'Mark as No Show',
      'Are you sure you want to mark this attendee as a no-show?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mark No Show', 
          style: 'destructive', 
          onPress: async () => {
            setCheckingId(registrationId);
            const result = await markNoShow(eventId, registrationId);
            setCheckingId(null);
            
            if (result.success) {
              Vibration.vibrate(100);
              refetch();
            } else {
              Alert.alert('Error', result.error || 'Failed to mark as no-show');
            }
          }
        },
      ]
    );
  };

  const handleScanQR = () => {
    setShowScanner(true);
  };

  const handleQRScanned = async (qrCode: string) => {
    setShowScanner(false);
    const result = await checkIn(eventId, { qrCode });
    
    if (result.success) {
      Vibration.vibrate(100);
      Alert.alert(
        'Check-In Successful',
        `${result.registration?.attendeeName} has been checked in!`,
        [{ text: 'OK' }]
      );
      refetch();
    } else if (result.alreadyCheckedIn) {
      Alert.alert('Already Checked In', `This attendee was checked in at ${result.checkedInAt || 'earlier'}`);
    } else {
      Vibration.vibrate([0, 200, 100, 200]);
      Alert.alert('Invalid QR Code', result.error || 'Please try again');
    }
  };

  const filterOptions: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: data?.total || 0 },
    { key: 'not_checked_in', label: 'Pending', count: data?.notCheckedIn || 0 },
    { key: 'checked_in', label: 'Checked In', count: data?.checkedIn || 0 },
    { key: 'late', label: 'Late', count: data?.late || 0 },
    { key: 'no_show', label: 'No Show', count: data?.noShow || 0 },
  ];

  const renderAttendeeItem = useCallback(({ item }: { item: EventRegistration }) => (
    <AttendeeCard
      registration={item}
      onCheckIn={() => handleCheckIn(item.id)}
      onMarkLate={() => handleCheckIn(item.id, true)}
      onMarkNoShow={() => handleMarkNoShow(item.id)}
      isChecking={checkingId === item.id}
    />
  ), [checkingId, eventId]);

  const keyExtractor = useCallback((item: EventRegistration) => item.id, []);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={styles.emptyTitle}>No Attendees Found</Text>
      <Text style={styles.emptyDescription}>
        {activeFilter === 'all' 
          ? 'No registrations for this event yet'
          : `No ${activeFilter.replace('_', ' ')} attendees`
        }
      </Text>
    </View>
  );

  if (showScanner) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setShowScanner(false)}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.scannerPlaceholder}>
          <View style={styles.scannerFrame}>
            <Text style={styles.scannerEmoji}>📱</Text>
            <Text style={styles.scannerText}>Camera Scanner</Text>
            <Text style={styles.scannerSubtext}>
              Point camera at attendee's QR code
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.manualEntryBtn}
            onPress={() => setShowScanner(false)}
          >
            <Text style={styles.manualEntryText}>Enter Booking ID Manually</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Check-In</Text>
          <Text style={styles.headerSubtitle}>
            {data?.checkedIn || 0}/{data?.total || 0} checked in
          </Text>
        </View>
        <TouchableOpacity onPress={handleScanQR}>
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.scanButton}
          >
            <Text style={styles.scanButtonIcon}>📱</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressStats}>
          <Text style={styles.progressText}>
            Progress: {((data?.checkedIn || 0) / Math.max(data?.total || 1, 1) * 100).toFixed(0)}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((data?.checkedIn || 0) / Math.max(data?.total || 1, 1) * 100)}%` }
            ]} 
          />
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, booking ID..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filterOptions}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setActiveFilter(item.key)}
            activeOpacity={0.7}
          >
            {activeFilter === item.key ? (
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.filterButtonActive}
              >
                <Text style={styles.filterTextActive}>{item.label}</Text>
                <View style={styles.filterBadgeActive}>
                  <Text style={styles.filterBadgeTextActive}>{item.count}</Text>
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.filterButton}>
                <Text style={styles.filterText}>{item.label}</Text>
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{item.count}</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      {loading && !data ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading attendees...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={registrations}
          renderItem={renderAttendeeItem}
          keyExtractor={keyExtractor}
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  scanButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonIcon: {
    fontSize: FONT_SIZES.lg,
  },
  progressSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  progressStats: {
    marginBottom: SPACING.xs,
  },
  progressText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.green,
    borderRadius: 4,
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
  filterScroll: {
    maxHeight: 50,
  },
  filterContainer: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.xs,
  },
  filterButtonActive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  filterTextActive: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  filterBadge: {
    backgroundColor: COLORS.cardBorder,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterBadgeActive: {
    backgroundColor: COLORS.white + '30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterBadgeText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  filterBadgeTextActive: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
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
    padding: SPACING.lg,
    paddingBottom: SIZES.listPaddingBottom,
  },
  attendeeCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  attendeeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  attendeeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.violet + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  attendeeAvatarText: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  attendeeName: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  birthdayEmoji: {
    fontSize: FONT_SIZES.sm,
  },
  firstEventEmoji: {
    fontSize: FONT_SIZES.sm,
  },
  attendeeTicket: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  attendeeMeta: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  guestsText: {
    color: COLORS.blue,
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  missingInfoText: {
    color: COLORS.amber,
    fontSize: FONT_SIZES.xs,
    marginTop: 4,
  },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIcon: {
    fontSize: FONT_SIZES.lg,
  },
  checkedInInfo: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  checkedInText: {
    color: COLORS.green,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  checkInBtn: {
    flex: 2,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  checkInBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  checkInBtnIcon: {
    fontSize: FONT_SIZES.md,
  },
  checkInBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  lateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.amber + '20',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: 4,
  },
  lateBtnIcon: {
    fontSize: FONT_SIZES.sm,
  },
  lateBtnText: {
    color: COLORS.amber,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  noShowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.red + '20',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: 4,
  },
  noShowBtnIcon: {
    fontSize: FONT_SIZES.sm,
  },
  noShowBtnText: {
    color: COLORS.red,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
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
  },
  scannerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  scannerFrame: {
    width: 280,
    height: 280,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 3,
    borderColor: COLORS.violet,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  scannerEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  scannerText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  scannerSubtext: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  manualEntryBtn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  manualEntryText: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
});
