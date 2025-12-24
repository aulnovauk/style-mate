import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { format, formatDistanceToNow, isAfter, parseISO } from 'date-fns';
import { useWaitlist, useWaitlistActions, WaitlistEntry } from '@stylemate/core';
import { COLORS, GRADIENTS } from '../../constants/theme';

type LocalWaitlistEntry = WaitlistEntry & {
  clientImage?: string;
  expiresAt?: string;
};

const PRIORITY_COLORS = {
  diamond: { bg: COLORS.cyan + '20', text: COLORS.cyan, label: 'Diamond' },
  platinum: { bg: COLORS.purple + '20', text: COLORS.purple, label: 'Platinum' },
  gold: { bg: COLORS.amber + '20', text: COLORS.amber, label: 'Gold' },
  regular: { bg: COLORS.textMuted + '20', text: COLORS.textMuted, label: 'Regular' },
};

const STATUS_CONFIG = {
  waiting: { bg: COLORS.blue + '20', text: COLORS.blue, label: 'Waiting', icon: '⏳' },
  notified: { bg: COLORS.amber + '20', text: COLORS.amber, label: 'Notified', icon: '🔔' },
  accepted: { bg: COLORS.green + '20', text: COLORS.green, label: 'Booked', icon: '✓' },
  declined: { bg: COLORS.red + '20', text: COLORS.red, label: 'Declined', icon: '✕' },
  expired: { bg: COLORS.textMuted + '20', text: COLORS.textMuted, label: 'Expired', icon: '⏰' },
  cancelled: { bg: COLORS.red + '20', text: COLORS.red, label: 'Cancelled', icon: '🚫' },
};

type FilterType = 'all' | 'waiting' | 'notified' | 'expired';
type SortType = 'priority' | 'date' | 'position';

export default function WaitlistManagementScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('priority');
  const [selectedEntry, setSelectedEntry] = useState<LocalWaitlistEntry | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<{time: string; date: string}[]>([]);

  const { data: waitlistData, loading, error, refetch } = useWaitlist();
  const { notifyClient, removeEntry, isNotifying, isRemoving } = useWaitlistActions();

  const waitlistEntries: LocalWaitlistEntry[] = waitlistData?.entries || [];
  const stats = waitlistData?.stats || { total: 0, waiting: 0, notified: 0, highValue: 0 };

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const filteredEntries = useMemo(() => {
    return waitlistEntries
      .filter(entry => {
        if (filter === 'all') return true;
        return entry.status === filter;
      })
      .filter(entry => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          entry.clientName.toLowerCase().includes(query) ||
          entry.serviceName.toLowerCase().includes(query) ||
          entry.staffName?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          const priorityOrder = { diamond: 0, platinum: 1, gold: 2, regular: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        if (sortBy === 'date') {
          return new Date(a.requestedDate).getTime() - new Date(b.requestedDate).getTime();
        }
        return a.position - b.position;
      });
  }, [waitlistEntries, filter, searchQuery, sortBy]);

  const handleNotifyClient = async (entry: LocalWaitlistEntry) => {
    setSelectedEntry(entry);
    
    const slots = waitlistData?.availableSlots?.[entry.id] || [];
    if (slots.length > 0) {
      setAvailableSlots(slots);
    } else {
      const requestedDate = entry.requestedDate || format(new Date(), 'yyyy-MM-dd');
      setAvailableSlots([
        { time: '10:00 AM', date: requestedDate },
        { time: '2:00 PM', date: requestedDate },
        { time: '4:30 PM', date: requestedDate },
      ]);
    }
    setShowNotifyModal(true);
  };

  const handleSendNotification = async (slot: { time: string; date: string }) => {
    if (!selectedEntry) return;
    
    const result = await notifyClient(selectedEntry.id, slot.date, slot.time);
    
    if (result.success) {
      setShowNotifyModal(false);
      setSelectedEntry(null);
      Alert.alert('Success', 'Notification sent to client!');
      refetch();
    } else {
      Alert.alert('Error', result.error || 'Failed to send notification');
    }
  };

  const handleRemoveFromWaitlist = (entry: LocalWaitlistEntry) => {
    Alert.alert(
      'Remove from Waitlist',
      `Are you sure you want to remove ${entry.clientName} from the waitlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await removeEntry(entry.id);
            
            if (result.success) {
              setShowActionModal(false);
              setSelectedEntry(null);
              refetch();
            } else {
              Alert.alert('Error', result.error || 'Failed to remove from waitlist');
            }
          },
        },
      ]
    );
  };

  const handleBookDirectly = (entry: LocalWaitlistEntry) => {
    setShowActionModal(false);
    router.push({
      pathname: '/appointments/new-booking',
      params: {
        clientName: entry.clientName,
        clientPhone: entry.clientPhone,
        serviceId: entry.id,
        fromWaitlist: 'true',
      },
    });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
        <Text style={styles.headerIcon}>←</Text>
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Waitlist</Text>
        <Text style={styles.headerSub}>{stats.total} clients waiting</Text>
      </View>
      <TouchableOpacity style={styles.headerBtn}>
        <Text style={styles.headerIcon}>⚙️</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: COLORS.blue }]}>
          <Text style={styles.statValue}>{stats.waiting}</Text>
          <Text style={styles.statLabel}>Waiting</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: COLORS.amber }]}>
          <Text style={styles.statValue}>{stats.notified}</Text>
          <Text style={styles.statLabel}>Notified</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: COLORS.green }]}>
          <Text style={styles.statValue}>{stats.highValue}</Text>
          <Text style={styles.statLabel}>High Value</Text>
        </View>
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search clients, services..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {(['all', 'waiting', 'notified', 'expired'] as FilterType[]).map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort:</Text>
          <TouchableOpacity
            style={styles.sortBtn}
            onPress={() => {
              const order: SortType[] = ['priority', 'date', 'position'];
              const idx = order.indexOf(sortBy);
              setSortBy(order[(idx + 1) % order.length]);
            }}
          >
            <Text style={styles.sortText}>
              {sortBy === 'priority' ? '⭐ Priority' : sortBy === 'date' ? '📅 Date' : '📊 Position'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  const renderWaitlistCard = (entry: WaitlistEntry) => {
    const priorityConfig = PRIORITY_COLORS[entry.priority];
    const statusConfig = STATUS_CONFIG[entry.status];
    const isExpiringSoon = entry.status === 'waiting' && 
      isAfter(new Date(), new Date(new Date(entry.expiresAt).getTime() - 24 * 60 * 60 * 1000));
    const hasDeadline = entry.status === 'notified' && entry.responseDeadline;
    const initials = entry.clientName.split(' ').map(n => n[0]).join('').substring(0, 2);

    return (
      <TouchableOpacity
        key={entry.id}
        style={[styles.waitlistCard, isExpiringSoon && styles.waitlistCardUrgent]}
        onPress={() => {
          setSelectedEntry(entry);
          setShowActionModal(true);
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.clientRow}>
            <View style={[styles.avatar, { borderColor: priorityConfig.text }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.clientInfo}>
              <View style={styles.clientNameRow}>
                <Text style={styles.clientName}>{entry.clientName}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.bg }]}>
                  <Text style={[styles.priorityText, { color: priorityConfig.text }]}>
                    {priorityConfig.label}
                  </Text>
                </View>
              </View>
              <Text style={styles.clientPhone}>{entry.clientPhone}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
            <Text style={[styles.statusText, { color: statusConfig.text }]}>{statusConfig.label}</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.serviceSection}>
          <View style={styles.serviceRow}>
            <LinearGradient colors={[COLORS.violet, COLORS.fuchsia]} style={styles.serviceIconBox}>
              <Text style={styles.serviceIcon}>✂️</Text>
            </LinearGradient>
            <View style={styles.serviceDetails}>
              <Text style={styles.serviceName}>{entry.serviceName}</Text>
              <Text style={styles.serviceMeta}>
                🕐 {entry.serviceDuration} mins • ₹{entry.servicePrice.toLocaleString()}
              </Text>
            </View>
          </View>
          {entry.staffName && (
            <View style={styles.staffRow}>
              <Text style={styles.staffLabel}>Preferred Staff:</Text>
              <Text style={styles.staffName}>{entry.staffName}</Text>
            </View>
          )}
        </View>

        <View style={styles.scheduleSection}>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>📅 Requested Date</Text>
              <Text style={styles.scheduleValue}>
                {format(new Date(entry.requestedDate), 'EEE, MMM d')}
              </Text>
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>⏰ Time Window</Text>
              <Text style={styles.scheduleValue}>{entry.timeWindow}</Text>
            </View>
          </View>
          <View style={styles.flexRow}>
            <Text style={styles.flexLabel}>Flexibility:</Text>
            <Text style={styles.flexValue}>±{entry.flexibilityDays} days</Text>
          </View>
        </View>

        {hasDeadline && (
          <View style={styles.deadlineSection}>
            <Text style={styles.deadlineIcon}>⏱️</Text>
            <Text style={styles.deadlineText}>
              Response deadline: {formatDistanceToNow(new Date(entry.responseDeadline!), { addSuffix: true })}
            </Text>
          </View>
        )}

        {isExpiringSoon && (
          <View style={styles.urgentBanner}>
            <Text style={styles.urgentIcon}>⚠️</Text>
            <Text style={styles.urgentText}>Expires soon - Action required!</Text>
          </View>
        )}

        <View style={styles.cardActions}>
          {entry.status === 'waiting' && (
            <>
              <TouchableOpacity
                style={styles.actionBtnSecondary}
                onPress={() => handleBookDirectly(entry)}
              >
                <Text style={styles.actionBtnSecondaryText}>📅 Book Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtnPrimary}
                onPress={() => handleNotifyClient(entry)}
              >
                <LinearGradient colors={[COLORS.violet, COLORS.fuchsia]} style={styles.actionBtnGradient}>
                  <Text style={styles.actionBtnPrimaryText}>🔔 Notify</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
          {entry.status === 'notified' && (
            <View style={styles.waitingResponse}>
              <Text style={styles.waitingResponseText}>⏳ Awaiting client response...</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>
            Position #{entry.position} • Added {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderActionModal = () => (
    <Modal visible={showActionModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Actions</Text>
          {selectedEntry && (
            <>
              <View style={styles.modalClientInfo}>
                <Text style={styles.modalClientName}>{selectedEntry.clientName}</Text>
                <Text style={styles.modalServiceName}>{selectedEntry.serviceName}</Text>
              </View>
              <TouchableOpacity style={styles.modalAction} onPress={() => handleBookDirectly(selectedEntry)}>
                <Text style={styles.modalActionIcon}>📅</Text>
                <Text style={styles.modalActionText}>Book Appointment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalAction} onPress={() => handleNotifyClient(selectedEntry)}>
                <Text style={styles.modalActionIcon}>🔔</Text>
                <Text style={styles.modalActionText}>Send Slot Notification</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalAction}>
                <Text style={styles.modalActionIcon}>📞</Text>
                <Text style={styles.modalActionText}>Call Client</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalAction}>
                <Text style={styles.modalActionIcon}>💬</Text>
                <Text style={styles.modalActionText}>Send Message</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalAction, styles.modalActionDanger]} 
                onPress={() => handleRemoveFromWaitlist(selectedEntry)}
              >
                <Text style={styles.modalActionIcon}>🗑️</Text>
                <Text style={[styles.modalActionText, { color: COLORS.red }]}>Remove from Waitlist</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={styles.modalCancel} onPress={() => setShowActionModal(false)}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderNotifyModal = () => (
    <Modal visible={showNotifyModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.notifyModalContent}>
          <Text style={styles.notifyModalTitle}>Select Available Slot</Text>
          <Text style={styles.notifyModalSub}>
            Choose a slot to offer to {selectedEntry?.clientName}
          </Text>
          {availableSlots.map((slot, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.slotOption}
              onPress={() => handleSendNotification(slot)}
              disabled={loading}
            >
              <View style={styles.slotInfo}>
                <Text style={styles.slotTime}>{slot.time}</Text>
                <Text style={styles.slotDate}>{format(new Date(slot.date), 'EEE, MMM d')}</Text>
              </View>
              <LinearGradient colors={[COLORS.green, COLORS.cyan]} style={styles.slotBtn}>
                <Text style={styles.slotBtnText}>Notify</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={COLORS.violet} size="large" />
              <Text style={styles.loadingText}>Sending notification...</Text>
            </View>
          )}
          <TouchableOpacity style={styles.notifyModalCancel} onPress={() => setShowNotifyModal(false)}>
            <Text style={styles.notifyModalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.violet} />}
        showsVerticalScrollIndicator={false}
      >
        {renderStats()}
        {renderFilters()}
        
        {filteredEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No waitlist entries</Text>
            <Text style={styles.emptyText}>
              {filter !== 'all' 
                ? `No ${filter} entries found` 
                : 'Clients will appear here when they join the waitlist'}
            </Text>
          </View>
        ) : (
          filteredEntries.map(entry => renderWaitlistCard(entry))
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {renderActionModal()}
      {renderNotifyModal()}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 18,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsContainer: {
    marginTop: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  filtersContainer: {
    marginTop: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.violet,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  sortLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginRight: 8,
  },
  sortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.cardBorder,
  },
  sortText: {
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  waitlistCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  waitlistCardUrgent: {
    borderColor: COLORS.amber,
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  clientInfo: {
    marginLeft: 12,
    flex: 1,
  },
  clientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  clientPhone: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusIcon: {
    fontSize: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 12,
  },
  serviceSection: {
    marginBottom: 12,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIcon: {
    fontSize: 18,
  },
  serviceDetails: {
    marginLeft: 12,
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  serviceMeta: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 52,
  },
  staffLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  staffName: {
    fontSize: 12,
    color: COLORS.violet,
    fontWeight: '500',
    marginLeft: 4,
  },
  scheduleSection: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scheduleItem: {
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  scheduleValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  flexLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  flexValue: {
    fontSize: 12,
    color: COLORS.green,
    fontWeight: '500',
    marginLeft: 4,
  },
  deadlineSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.amber + '15',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  deadlineIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  deadlineText: {
    fontSize: 13,
    color: COLORS.amber,
    fontWeight: '500',
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.red + '15',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  urgentIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  urgentText: {
    fontSize: 13,
    color: COLORS.red,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.cardBorder,
    alignItems: 'center',
  },
  actionBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  actionBtnPrimary: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  actionBtnGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  waitingResponse: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  waitingResponseText: {
    fontSize: 14,
    color: COLORS.amber,
    fontWeight: '500',
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalClientInfo: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  modalClientName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalServiceName: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  modalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  modalActionDanger: {
    borderBottomWidth: 0,
  },
  modalActionIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  modalActionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  modalCancel: {
    marginTop: 16,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  notifyModalContent: {
    backgroundColor: COLORS.cardBg,
    margin: 20,
    borderRadius: 20,
    padding: 24,
  },
  notifyModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  notifyModalSub: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  slotOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  slotInfo: {
    flex: 1,
  },
  slotTime: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  slotDate: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  slotBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  slotBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  notifyModalCancel: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  notifyModalCancelText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
