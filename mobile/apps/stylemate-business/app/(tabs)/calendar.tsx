import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { format, addDays, subDays, startOfWeek, isSameDay } from 'date-fns';
import { useAppointmentsByDate, useStaff } from '@stylemate/core';
import { COLORS, GRADIENTS } from '../../constants/theme';

const { width } = Dimensions.get('window');

type ViewMode = 'Day' | 'Week' | 'Month' | 'Agenda';
type AppointmentStatus = 'confirmed' | 'pending' | 'cancelled' | 'break';

interface DayData {
  date: Date;
  hasConfirmed: boolean;
  hasPending: boolean;
  hasCancelled: boolean;
}

interface StaffMember {
  id: string;
  name: string;
  image: string;
  isSelected: boolean;
}

interface TimelineAppointment {
  id: string;
  time: string;
  endTime: string;
  clientName: string;
  clientImage: string;
  service: string;
  staffName: string;
  price: string;
  status: AppointmentStatus;
  accentColor: string;
}

function ViewModeTab({ label, isActive, onPress }: { label: string; isActive: boolean; onPress: () => void }) {
  if (isActive) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={[COLORS.violet, COLORS.fuchsia]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.viewTabActive}
        >
          <Text style={styles.viewTabTextActive}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity style={styles.viewTab} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.viewTabText}>{label}</Text>
    </TouchableOpacity>
  );
}

function WeekDayButton({ 
  day, 
  dayName, 
  isSelected, 
  isToday, 
  indicator, 
  onPress 
}: { 
  day: number; 
  dayName: string; 
  isSelected: boolean; 
  isToday: boolean;
  indicator?: 'green' | 'amber' | 'red';
  onPress: () => void;
}) {
  const indicatorColor = indicator === 'green' ? COLORS.green : indicator === 'amber' ? COLORS.amber : COLORS.red;

  return (
    <TouchableOpacity style={styles.weekDayContainer} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.weekDayName}>{dayName}</Text>
      {isSelected ? (
        <LinearGradient
          colors={[COLORS.violet, COLORS.fuchsia]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.weekDayButtonSelected}
        >
          <Text style={styles.weekDayNumberSelected}>{day}</Text>
          {indicator && <View style={[styles.dayIndicator, { backgroundColor: '#FFF' }]} />}
        </LinearGradient>
      ) : (
        <View style={[styles.weekDayButton, isToday && styles.weekDayButtonToday]}>
          <Text style={[styles.weekDayNumber, isToday && styles.weekDayNumberToday]}>{day}</Text>
          {indicator && <View style={[styles.dayIndicator, { backgroundColor: indicatorColor }]} />}
        </View>
      )}
    </TouchableOpacity>
  );
}

function StatCard({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StaffFilterChip({ staff, isSelected, onPress }: { staff: StaffMember; isSelected: boolean; onPress: () => void }) {
  if (isSelected) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={[COLORS.violet, COLORS.fuchsia]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.staffChipActive}
        >
          <Image source={{ uri: staff.image }} style={styles.staffChipImage} />
          <Text style={styles.staffChipTextActive}>{staff.name}</Text>
          <Text style={styles.staffCheckIcon}>✓</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity style={styles.staffChip} onPress={onPress} activeOpacity={0.7}>
      <Image source={{ uri: staff.image }} style={styles.staffChipImage} />
      <Text style={styles.staffChipText}>{staff.name}</Text>
    </TouchableOpacity>
  );
}

function TimelineSlot({ appointment }: { appointment: TimelineAppointment }) {
  const getStatusStyle = () => {
    switch (appointment.status) {
      case 'confirmed':
        return { bg: COLORS.green + '20', text: COLORS.green, label: 'Confirmed' };
      case 'pending':
        return { bg: COLORS.amber + '20', text: COLORS.amber, label: 'Pending' };
      case 'cancelled':
        return { bg: COLORS.red + '20', text: COLORS.red, label: 'Cancelled' };
      case 'break':
        return { bg: COLORS.green + '20', text: COLORS.green, label: 'Break' };
    }
  };

  const statusStyle = getStatusStyle();

  if (appointment.status === 'break') {
    return (
      <View style={styles.timelineSlot}>
        <View style={styles.timelineLabelContainer}>
          <Text style={styles.timelineLabel}>{appointment.time}</Text>
          <View style={styles.timelineLine} />
        </View>
        <View style={styles.timelineContent}>
          <View style={[styles.breakCard, { borderLeftColor: COLORS.green }]}>
            <View style={styles.breakCardContent}>
              <Text style={styles.breakIcon}>🍽️</Text>
              <Text style={styles.breakTitle}>{appointment.service}</Text>
            </View>
            <Text style={styles.breakTime}>{appointment.time} - {appointment.endTime}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.timelineSlot}>
      <View style={styles.timelineLabelContainer}>
        <Text style={styles.timelineLabel}>{appointment.time}</Text>
        <View style={styles.timelineLine} />
      </View>
      <View style={styles.timelineContent}>
        <View style={[styles.appointmentCard, { borderLeftColor: appointment.accentColor }]}>
          <View style={styles.appointmentHeader}>
            <View style={styles.appointmentClientRow}>
              <Image source={{ uri: appointment.clientImage }} style={styles.appointmentClientImage} />
              <View style={styles.appointmentClientInfo}>
                <Text style={styles.appointmentClientName}>{appointment.clientName}</Text>
                <Text style={styles.appointmentService}>{appointment.service}</Text>
              </View>
            </View>
            <View style={[styles.appointmentStatus, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.appointmentStatusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
            </View>
          </View>
          <View style={styles.appointmentMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>🕐</Text>
              <Text style={styles.metaText}>{appointment.time} - {appointment.endTime}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>👤</Text>
              <Text style={styles.metaText}>{appointment.staffName}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>₹</Text>
              <Text style={styles.metaText}>{appointment.price}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function CalendarScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('Day');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const { data: appointmentsData, loading: appointmentsLoading, error: appointmentsError, refetch: refetchAppointments } = useAppointmentsByDate(dateString);
  const { data: staffData, loading: staffLoading, refetch: refetchStaff } = useStaff();

  const refreshing = appointmentsLoading;

  const onRefresh = useCallback(() => {
    refetchAppointments();
    refetchStaff();
  }, [refetchAppointments, refetchStaff]);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      date,
      day: format(date, 'd'),
      dayName: format(date, 'EEE'),
      isToday: isSameDay(date, new Date()),
      isSelected: isSameDay(date, selectedDate),
    };
  });

  const staffMembers: StaffMember[] = useMemo(() => {
    if (!staffData?.staff?.length) {
      return [{ id: 'all', name: 'All Staff', image: 'https://i.pravatar.cc/150?img=0', isSelected: selectedStaffId === null }];
    }
    return staffData.staff.map(s => ({
      id: String(s.id),
      name: s.name,
      image: s.photoUrl || `https://i.pravatar.cc/150?u=${s.id}`,
      isSelected: selectedStaffId === String(s.id),
    }));
  }, [staffData, selectedStaffId]);

  const dayIndicators: { [key: string]: 'green' | 'amber' | 'red' } = {};

  const formatTimeToAmPm = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    const period = endHours >= 12 ? 'PM' : 'AM';
    const displayHours = endHours % 12 || 12;
    return `${displayHours}:${endMinutes.toString().padStart(2, '0')} ${period}`;
  };

  const getStatusColor = (status: string): AppointmentStatus => {
    if (status === 'confirmed' || status === 'completed') return 'confirmed';
    if (status === 'cancelled' || status === 'no_show') return 'cancelled';
    return 'pending';
  };

  const getAccentColor = (status: string) => {
    if (status === 'confirmed' || status === 'completed') return COLORS.violet;
    if (status === 'cancelled' || status === 'no_show') return COLORS.red;
    return COLORS.amber;
  };

  const appointments: TimelineAppointment[] = useMemo(() => {
    if (!appointmentsData?.appointments?.length) return [];
    
    return appointmentsData.appointments
      .filter(apt => !selectedStaffId || String(apt.staffId) === selectedStaffId)
      .map(apt => ({
        id: String(apt.id),
        time: formatTimeToAmPm(apt.bookingTime),
        endTime: getEndTime(apt.bookingTime, apt.service?.duration || 60),
        clientName: apt.customerName || 'Walk-in Customer',
        clientImage: `https://i.pravatar.cc/150?u=${apt.id}`,
        service: apt.service?.name || 'Service',
        staffName: apt.staff?.name || 'Staff',
        price: apt.amountFormatted || '₹0',
        status: getStatusColor(apt.status),
        accentColor: getAccentColor(apt.status),
      }));
  }, [appointmentsData, selectedStaffId]);

  const stats = useMemo(() => ({
    total: appointmentsData?.stats?.total || appointmentsData?.appointments?.length || 0,
    confirmed: appointmentsData?.stats?.completed || appointmentsData?.appointments?.filter(a => a.status === 'confirmed' || a.status === 'completed').length || 0,
    pending: appointmentsData?.stats?.pending || appointmentsData?.appointments?.filter(a => a.status === 'pending').length || 0,
    cancelled: appointmentsData?.stats?.cancelled || appointmentsData?.appointments?.filter(a => a.status === 'cancelled' || a.status === 'no_show').length || 0,
  }), [appointmentsData]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={[COLORS.violet, COLORS.fuchsia]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoContainer}
          >
            <Text style={styles.logoIcon}>✂️</Text>
          </LinearGradient>
          <View style={styles.salonInfo}>
            <Text style={styles.salonName}>Stylemate</Text>
            <Text style={styles.branchName}>Downtown Salon</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <Text style={styles.headerButtonIcon}>🔔</Text>
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>7</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Text style={styles.headerButtonIcon}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search appointments, clients..."
            placeholderTextColor={COLORS.textMuted}
          />
          <TouchableOpacity>
            <LinearGradient
              colors={[COLORS.violet, COLORS.fuchsia]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.filterButton}
            >
              <Text style={styles.filterIcon}>⚙️</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.viewModeContainer}
        contentContainerStyle={styles.viewModeContent}
      >
        {(['Day', 'Week', 'Month', 'Agenda'] as ViewMode[]).map((mode) => (
          <ViewModeTab
            key={mode}
            label={mode}
            isActive={viewMode === mode}
            onPress={() => setViewMode(mode)}
          />
        ))}
      </ScrollView>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.violet}
            colors={[COLORS.violet, COLORS.fuchsia]}
          />
        }
      >
        <View style={styles.dateNavigation}>
          <View style={styles.dateNavLeft}>
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={() => setSelectedDate(subDays(selectedDate, 1))}
            >
              <Text style={styles.navIcon}>‹</Text>
            </TouchableOpacity>
            <View style={styles.dateInfo}>
              <Text style={styles.dateText}>{format(selectedDate, 'MMMM d, yyyy')}</Text>
              <Text style={styles.dayText}>{format(selectedDate, 'EEEE')}</Text>
            </View>
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={() => setSelectedDate(addDays(selectedDate, 1))}
            >
              <Text style={styles.navIcon}>›</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.todayButton}
            onPress={() => setSelectedDate(new Date())}
          >
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weekStripCard}>
          <View style={styles.weekStrip}>
            {weekDays.map((day, index) => (
              <WeekDayButton
                key={index}
                day={parseInt(day.day)}
                dayName={day.dayName}
                isSelected={day.isSelected}
                isToday={day.isToday}
                indicator={dayIndicators[day.day] as 'green' | 'amber' | 'red' | undefined}
                onPress={() => setSelectedDate(day.date)}
              />
            ))}
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard value={stats.total} label="Total" />
          <StatCard value={stats.confirmed} label="Confirmed" color={COLORS.green} />
          <StatCard value={stats.pending} label="Pending" color={COLORS.amber} />
          <StatCard value={stats.cancelled} label="Cancelled" color={COLORS.red} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Filter by Staff</Text>
            <TouchableOpacity onPress={() => setSelectedStaffId(null)}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {staffMembers.map((staff) => (
              <StaffFilterChip
                key={staff.id}
                staff={staff}
                isSelected={selectedStaffId === staff.id}
                onPress={() => setSelectedStaffId(staff.id)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <View style={styles.viewToggleRow}>
              <TouchableOpacity style={styles.viewToggleButton}>
                <Text style={styles.viewToggleIcon}>☰</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <LinearGradient
                  colors={[COLORS.violet, COLORS.fuchsia]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.viewToggleButtonActive}
                >
                  <Text style={styles.viewToggleIconActive}>⊞</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.timelineContainer}>
            {appointments.map((appointment) => (
              <TimelineSlot key={appointment.id} appointment={appointment} />
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/appointments/new-booking')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[COLORS.violet, COLORS.fuchsia]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Text style={styles.fabIcon}>+</Text>
        </LinearGradient>
      </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 18,
  },
  salonInfo: {},
  salonName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  branchName: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonIcon: {
    fontSize: 18,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.violet,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  filterButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {
    fontSize: 14,
  },
  viewModeContainer: {
    maxHeight: 50,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  viewModeContent: {
    gap: 8,
  },
  viewTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    marginRight: 8,
  },
  viewTabActive: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
  },
  viewTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  viewTabTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  dateNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  dateNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 24,
    color: COLORS.textSecondary,
    marginTop: -2,
  },
  dateInfo: {},
  dateText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dayText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  todayButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  weekStripCard: {
    marginHorizontal: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDayContainer: {
    alignItems: 'center',
    flex: 1,
  },
  weekDayName: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  weekDayButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDayButtonToday: {
    borderWidth: 2,
    borderColor: COLORS.violet,
  },
  weekDayButtonSelected: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  weekDayNumberToday: {
    color: COLORS.violet,
  },
  weekDayNumberSelected: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  dayIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  clearAllText: {
    fontSize: 14,
    color: COLORS.violet,
    fontWeight: '500',
  },
  staffChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    marginRight: 12,
    gap: 8,
  },
  staffChipActive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 12,
    gap: 8,
  },
  staffChipImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  staffChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  staffChipTextActive: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
  },
  staffCheckIcon: {
    fontSize: 12,
    color: '#FFF',
  },
  viewToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  viewToggleButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewToggleButtonActive: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewToggleIcon: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  viewToggleIconActive: {
    fontSize: 14,
    color: '#FFF',
  },
  timelineContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  timelineSlot: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  timelineLabelContainer: {
    width: 70,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
    width: 60,
  },
  timelineLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginTop: 8,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 12,
  },
  appointmentCard: {
    backgroundColor: COLORS.violet + '15',
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 12,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  appointmentClientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appointmentClientImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  appointmentClientInfo: {},
  appointmentClientName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  appointmentService: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  appointmentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  appointmentStatusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  appointmentMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIcon: {
    fontSize: 12,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  breakCard: {
    backgroundColor: COLORS.green + '15',
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 12,
  },
  breakCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakIcon: {
    fontSize: 16,
  },
  breakTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  breakTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    marginLeft: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    shadowColor: COLORS.violet,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: {
    fontSize: 28,
    color: '#FFF',
    fontWeight: '300',
  },
});
