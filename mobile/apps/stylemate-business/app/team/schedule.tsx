import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useMemo, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import {
  useStaffSchedule,
  useScheduleActions,
  StaffShift,
  ScheduleAppointment,
  TimeBlock,
} from '@stylemate/core';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface TimeSlotData {
  time: string;
  endTime?: string;
  type: 'available' | 'appointment' | 'block' | 'break';
  appointment?: ScheduleAppointment;
  block?: TimeBlock;
}

const parseTime = (timeStr: string): number => {
  const parts = timeStr.split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1] || '0');
};

const formatMinutes = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const buildTimelineFromAPI = (
  shift: StaffShift | undefined,
  appointments: ScheduleAppointment[],
  blocks: TimeBlock[]
): TimeSlotData[] => {
  if (!shift?.isWorking) return [];
  
  const shiftStart = parseTime(shift.startTime);
  const shiftEnd = parseTime(shift.endTime);
  const breakStart = shift.breakStart ? parseTime(shift.breakStart) : null;
  const breakEnd = shift.breakEnd ? parseTime(shift.breakEnd) : null;
  
  interface ClampedEvent {
    id: string;
    clampedStart: number;
    clampedEnd: number;
    type: 'appointment' | 'block' | 'break';
    appointment?: ScheduleAppointment;
    block?: TimeBlock;
  }
  
  const clampedEvents: ClampedEvent[] = [];
  
  if (breakStart !== null && breakEnd !== null) {
    const cs = Math.max(breakStart, shiftStart);
    const ce = Math.min(breakEnd, shiftEnd);
    if (cs < ce) {
      clampedEvents.push({ id: 'break', clampedStart: cs, clampedEnd: ce, type: 'break' });
    }
  }
  
  appointments.forEach((apt, idx) => {
    const start = parseTime(apt.startTime);
    const end = start + (apt.duration || 30);
    const cs = Math.max(start, shiftStart);
    const ce = Math.min(end, shiftEnd);
    if (cs < ce) {
      clampedEvents.push({ id: `apt-${idx}`, clampedStart: cs, clampedEnd: ce, type: 'appointment', appointment: apt });
    }
  });
  
  blocks.forEach((blk, idx) => {
    const start = parseTime(blk.startTime);
    const end = parseTime(blk.endTime);
    const cs = Math.max(start, shiftStart);
    const ce = Math.min(end, shiftEnd);
    if (cs < ce) {
      clampedEvents.push({ id: `blk-${idx}`, clampedStart: cs, clampedEnd: ce, type: 'block', block: blk });
    }
  });
  
  const boundaries = new Set<number>([shiftStart, shiftEnd]);
  clampedEvents.forEach(e => {
    boundaries.add(e.clampedStart);
    boundaries.add(e.clampedEnd);
  });
  const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);
  
  const availabilityGaps: Array<{ start: number; end: number }> = [];
  
  for (let i = 0; i < sortedBoundaries.length - 1; i++) {
    const spanStart = sortedBoundaries[i];
    const spanEnd = sortedBoundaries[i + 1];
    
    if (spanStart < shiftStart || spanEnd > shiftEnd) continue;
    
    const activeEvents = clampedEvents.filter(e => 
      e.clampedStart <= spanStart && e.clampedEnd > spanStart
    );
    
    if (activeEvents.length === 0) {
      if (availabilityGaps.length > 0 && 
          availabilityGaps[availabilityGaps.length - 1].end === spanStart) {
        availabilityGaps[availabilityGaps.length - 1].end = spanEnd;
      } else {
        availabilityGaps.push({ start: spanStart, end: spanEnd });
      }
    }
  }
  
  clampedEvents.sort((a, b) => {
    if (a.clampedStart !== b.clampedStart) return a.clampedStart - b.clampedStart;
    const duration1 = a.clampedEnd - a.clampedStart;
    const duration2 = b.clampedEnd - b.clampedStart;
    return duration2 - duration1;
  });
  
  const timeline: TimeSlotData[] = [];
  
  let gapIdx = 0;
  let eventIdx = 0;
  
  while (gapIdx < availabilityGaps.length || eventIdx < clampedEvents.length) {
    const gap = availabilityGaps[gapIdx];
    const event = clampedEvents[eventIdx];
    
    const gapStart = gap ? gap.start : Infinity;
    const eventStart = event ? event.clampedStart : Infinity;
    
    if (gapStart <= eventStart && gap) {
      timeline.push({
        time: formatMinutes(gap.start),
        endTime: formatMinutes(gap.end),
        type: 'available',
      });
      gapIdx++;
    } else if (event) {
      if (event.type === 'appointment' && event.appointment) {
        timeline.push({
          time: formatMinutes(event.clampedStart),
          endTime: formatMinutes(event.clampedEnd),
          type: 'appointment',
          appointment: event.appointment,
        });
      } else if (event.type === 'block' && event.block) {
        timeline.push({
          time: formatMinutes(event.clampedStart),
          endTime: formatMinutes(event.clampedEnd),
          type: 'block',
          block: event.block,
        });
      } else if (event.type === 'break') {
        timeline.push({
          time: formatMinutes(event.clampedStart),
          endTime: formatMinutes(event.clampedEnd),
          type: 'break',
        });
      }
      eventIdx++;
    } else {
      break;
    }
  }
  
  return timeline;
};

export default function StaffScheduleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const staffId = params.staffId as string | undefined;
  const staffName = params.name as string || 'Staff Member';
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockStartTime, setBlockStartTime] = useState('');
  const [blockEndTime, setBlockEndTime] = useState('');
  
  const dateString = format(selectedDate, 'yyyy-MM-dd');
  
  const { 
    data: scheduleData, 
    loading: isLoading, 
    error,
    refetch 
  } = useStaffSchedule(staffId, dateString);
  
  const { 
    createBlock, 
    deleteBlock, 
    isCreatingBlock,
    isDeletingBlock 
  } = useScheduleActions();

  const shifts = scheduleData?.shifts || [];
  const appointments = scheduleData?.appointments || [];
  const blocks = scheduleData?.blocks || [];
  const hasShiftData = shifts.length > 0;
  
  const weekDates = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);
  
  const todayShift = useMemo(() => {
    const dayName = format(selectedDate, 'EEE');
    return shifts.find(s => s.day === dayName);
  }, [selectedDate, shifts]);

  const timelineSlots = useMemo(() => 
    buildTimelineFromAPI(todayShift, appointments, blocks),
    [todayShift, appointments, blocks]
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return COLORS.blue;
      case 'in_progress': return COLORS.amber;
      case 'completed': return COLORS.green;
      case 'cancelled': return COLORS.red;
      case 'no_show': return COLORS.textMuted;
      default: return COLORS.textMuted;
    }
  };

  const handleCreateBlock = async () => {
    if (!staffId || !blockStartTime || !blockEndTime) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const result = await createBlock({
      staffId,
      date: dateString,
      startTime: blockStartTime,
      endTime: blockEndTime,
      reason: blockReason || 'Blocked time',
    });

    if (result.success) {
      Alert.alert('Success', 'Time block created');
      setShowBlockModal(false);
      setBlockReason('');
      setBlockStartTime('');
      setBlockEndTime('');
      refetch();
    } else {
      Alert.alert('Error', result.error || 'Failed to create block');
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!staffId) return;
    
    Alert.alert('Delete Block', 'Are you sure you want to remove this blocked time?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteBlock(staffId, blockId);
          if (result.success) {
            refetch();
          } else {
            Alert.alert('Error', result.error || 'Failed to delete block');
          }
        },
      },
    ]);
  };

  const renderDayView = () => (
    <ScrollView style={styles.scheduleList} showsVerticalScrollIndicator={false}>
      {hasShiftData && todayShift && (
        <View style={styles.shiftSummary}>
          <LinearGradient colors={GRADIENTS.info} style={styles.shiftGradient}>
            <View style={styles.shiftInfo}>
              <Text style={styles.shiftLabel}>Today's Shift</Text>
              {todayShift.isWorking ? (
                <Text style={styles.shiftTime}>
                  {todayShift.startTime} - {todayShift.endTime}
                </Text>
              ) : (
                <Text style={styles.shiftOff}>Day Off</Text>
              )}
            </View>
            {todayShift.breakStart && (
              <View style={styles.breakInfo}>
                <Text style={styles.breakLabel}>Break</Text>
                <Text style={styles.breakTime}>{todayShift.breakStart} - {todayShift.breakEnd}</Text>
              </View>
            )}
          </LinearGradient>
        </View>
      )}

      {!hasShiftData ? (
        <View style={styles.noShiftContainer}>
          <Text style={styles.noShiftIcon}>⚙️</Text>
          <Text style={styles.noShiftText}>No Shift Configured</Text>
          <Text style={styles.noShiftSubtext}>Working hours have not been set up for this staff member</Text>
        </View>
      ) : !todayShift?.isWorking ? (
        <View style={styles.dayOffContainer}>
          <Text style={styles.dayOffIcon}>🌴</Text>
          <Text style={styles.dayOffText}>Day Off</Text>
          <Text style={styles.dayOffSubtext}>No appointments scheduled</Text>
        </View>
      ) : timelineSlots.length === 0 ? (
        <View style={styles.emptySchedule}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyText}>No appointments for today</Text>
        </View>
      ) : (
        timelineSlots.map((slot, index) => (
          <View key={`${slot.time}-${index}`} style={styles.timeSlotRow}>
            <View style={styles.timeColumn}>
              <Text style={styles.timeText}>{slot.time}</Text>
              {slot.endTime && slot.type !== 'available' && (
                <Text style={styles.timeEndText}>{slot.endTime}</Text>
              )}
            </View>
            <View style={styles.slotContent}>
              {slot.type === 'break' ? (
                <View style={styles.breakSlot}>
                  <Text style={styles.breakSlotIcon}>☕</Text>
                  <View>
                    <Text style={styles.breakSlotText}>Break</Text>
                    {slot.endTime && (
                      <Text style={styles.breakSlotDuration}>{slot.time} - {slot.endTime}</Text>
                    )}
                  </View>
                </View>
              ) : slot.type === 'block' && slot.block ? (
                <TouchableOpacity 
                  style={styles.blockCard}
                  onLongPress={() => handleDeleteBlock(slot.block!.id)}
                >
                  <Text style={styles.blockIcon}>⛔</Text>
                  <View>
                    <Text style={styles.blockText}>{slot.block.reason}</Text>
                    {slot.endTime && (
                      <Text style={styles.blockDuration}>{slot.time} - {slot.endTime}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ) : slot.type === 'appointment' && slot.appointment ? (
                <TouchableOpacity 
                  style={[styles.appointmentCard, { borderLeftColor: getStatusColor(slot.appointment.status) }]}
                  onPress={() => router.push(`/appointments/${slot.appointment!.id}`)}
                >
                  <View style={styles.appointmentHeader}>
                    <Text style={styles.clientName}>{slot.appointment.clientName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(slot.appointment.status)}20` }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(slot.appointment.status) }]}>
                        {slot.appointment.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.serviceName}>{slot.appointment.service}</Text>
                  <Text style={styles.duration}>
                    {slot.appointment.duration} min ({slot.time} - {slot.endTime})
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.availableSlot}
                  onPress={() => router.push(`/booking/new?staffId=${staffId}&date=${dateString}&time=${slot.time}`)}
                >
                  <Text style={styles.availableText}>Available</Text>
                  {slot.endTime && (
                    <Text style={styles.availableDuration}>{slot.time} - {slot.endTime}</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderWeekView = () => (
    <View style={styles.weekContainer}>
      <View style={styles.weekHeader}>
        {weekDates.map((date, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.weekDay,
              isSameDay(date, selectedDate) && styles.weekDayActive,
            ]}
            onPress={() => setSelectedDate(date)}
          >
            <Text style={[
              styles.weekDayName,
              isSameDay(date, selectedDate) && styles.weekDayNameActive,
            ]}>
              {format(date, 'EEE')}
            </Text>
            <Text style={[
              styles.weekDayNum,
              isSameDay(date, selectedDate) && styles.weekDayNumActive,
            ]}>
              {format(date, 'd')}
            </Text>
            {shifts.find(s => s.day === format(date, 'EEE'))?.isWorking && (
              <View style={[
                styles.workIndicator,
                isSameDay(date, selectedDate) && styles.workIndicatorActive,
              ]} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.weekSchedule}>
        <View style={styles.shiftsSection}>
          <Text style={styles.sectionTitle}>Weekly Schedule</Text>
          {shifts.map((shift, index) => (
            <View key={index} style={styles.shiftRow}>
              <Text style={styles.shiftDayName}>{shift.day}</Text>
              {shift.isWorking ? (
                <View style={styles.shiftTimes}>
                  <Text style={styles.shiftTimeText}>{shift.startTime} - {shift.endTime}</Text>
                  {shift.breakStart && (
                    <Text style={styles.shiftBreakText}>Break: {shift.breakStart}-{shift.breakEnd}</Text>
                  )}
                </View>
              ) : (
                <Text style={styles.dayOffText}>Day Off</Text>
              )}
              <TouchableOpacity style={styles.editShiftBtn}>
                <Text style={styles.editShiftIcon}>✏️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Failed to Load Schedule</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.staffInfo}>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarSmallText}>
              {staffName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </Text>
          </View>
          <Text style={styles.staffNameHeader}>{staffName}</Text>
        </View>
        
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'day' && styles.toggleBtnActive]}
            onPress={() => setViewMode('day')}
          >
            <Text style={[styles.toggleText, viewMode === 'day' && styles.toggleTextActive]}>Day</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'week' && styles.toggleBtnActive]}
            onPress={() => setViewMode('week')}
          >
            <Text style={[styles.toggleText, viewMode === 'week' && styles.toggleTextActive]}>Week</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.dateSelector}>
        <TouchableOpacity 
          style={styles.dateNavBtn}
          onPress={() => setSelectedDate(prev => addDays(prev, -1))}
        >
          <Text style={styles.dateNavIcon}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateDisplay}>
          <Text style={styles.dateText}>{format(selectedDate, 'EEEE, MMM d, yyyy')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.dateNavBtn}
          onPress={() => setSelectedDate(prev => addDays(prev, 1))}
        >
          <Text style={styles.dateNavIcon}>→</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'day' ? renderDayView() : renderWeekView()}

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.addBlockBtn}
          onPress={() => setShowBlockModal(true)}
        >
          <LinearGradient colors={GRADIENTS.warning} style={styles.footerBtnGradient}>
            <Text style={styles.footerBtnText}>⛔ Block Time</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.addBookingBtn}
          onPress={() => router.push(`/booking/new?staffId=${staffId}&date=${dateString}`)}
        >
          <LinearGradient colors={GRADIENTS.primary} style={styles.footerBtnGradient}>
            <Text style={styles.footerBtnText}>📅 Add Booking</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Modal visible={showBlockModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Block Time</Text>
            
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Start Time</Text>
                <TextInput
                  style={styles.input}
                  value={blockStartTime}
                  onChangeText={setBlockStartTime}
                  placeholder="e.g., 14:00"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>End Time</Text>
                <TextInput
                  style={styles.input}
                  value={blockEndTime}
                  onChangeText={setBlockEndTime}
                  placeholder="e.g., 15:00"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reason (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={blockReason}
                  onChangeText={setBlockReason}
                  placeholder="e.g., Personal break"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelBtn}
                onPress={() => setShowBlockModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmBtn}
                onPress={handleCreateBlock}
                disabled={isCreatingBlock}
              >
                <LinearGradient colors={GRADIENTS.warning} style={styles.modalConfirmGradient}>
                  {isCreatingBlock ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.modalConfirmText}>Block Time</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    gap: SPACING.lg,
  },
  loadingText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  errorMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  retryBtn: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    backgroundColor: COLORS.violet,
    borderRadius: BORDER_RADIUS.md,
  },
  retryText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.violet,
  },
  avatarSmallText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  staffNameHeader: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.sm,
    padding: 2,
  },
  toggleBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm - 2,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.violet,
  },
  toggleText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: COLORS.white,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.lg,
  },
  dateNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateNavIcon: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
  },
  dateDisplay: {
    paddingHorizontal: SPACING.lg,
  },
  dateText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  scheduleList: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  shiftSummary: {
    marginBottom: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  shiftGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  shiftInfo: {},
  shiftLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textOnGradient,
  },
  shiftTime: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: SPACING.xs,
  },
  shiftOff: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: SPACING.xs,
  },
  breakInfo: {
    alignItems: 'flex-end',
  },
  breakLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textOnGradient,
  },
  breakTime: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: SPACING.xs,
  },
  noShiftContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
    paddingHorizontal: SPACING.xl,
  },
  noShiftIcon: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  noShiftText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  noShiftSubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  dayOffContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  dayOffIcon: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  dayOffText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dayOffSubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  emptySchedule: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
  breakSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: `${COLORS.purple}15`,
    borderRadius: BORDER_RADIUS.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.purple,
  },
  breakSlotIcon: {
    fontSize: FONT_SIZES.md,
  },
  breakSlotText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.purple,
    fontWeight: '500',
  },
  breakSlotDuration: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.purple,
    opacity: 0.7,
  },
  blockDuration: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.amber,
    opacity: 0.8,
    marginTop: 2,
  },
  availableSlot: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: `${COLORS.green}10`,
    borderRadius: BORDER_RADIUS.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.green,
    borderStyle: 'dashed',
  },
  availableText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.green,
    fontWeight: '500',
  },
  availableDuration: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  timeSlotRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  timeColumn: {
    width: 60,
    paddingTop: SPACING.sm,
  },
  timeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  timeEndText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  slotContent: {
    flex: 1,
    minHeight: 50,
  },
  appointmentCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    borderLeftWidth: 3,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  clientName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  serviceName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  duration: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  blockCard: {
    backgroundColor: `${COLORS.amber}20`,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.amber,
  },
  blockIcon: {
    fontSize: FONT_SIZES.md,
  },
  blockText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.amber,
    fontWeight: '500',
  },
  emptySlot: {
    height: 30,
    justifyContent: 'center',
    paddingLeft: SPACING.sm,
  },
  emptyLine: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
  },
  weekContainer: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  weekDayActive: {
    backgroundColor: COLORS.violet,
  },
  weekDayName: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  weekDayNameActive: {
    color: COLORS.textOnGradient,
  },
  weekDayNum: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  weekDayNumActive: {
    color: COLORS.white,
  },
  workIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.green,
    marginTop: SPACING.xs,
  },
  workIndicatorActive: {
    backgroundColor: COLORS.white,
  },
  weekSchedule: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  shiftsSection: {},
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  shiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  shiftDayName: {
    width: 50,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  shiftTimes: {
    flex: 1,
  },
  shiftTimeText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  shiftBreakText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  dayOffText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.amber,
  },
  editShiftBtn: {
    padding: SPACING.sm,
  },
  editShiftIcon: {
    fontSize: FONT_SIZES.lg,
  },
  footer: {
    flexDirection: 'row',
    padding: SPACING.xl,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  addBlockBtn: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  addBookingBtn: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  footerBtnGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  footerBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.md,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  modalBody: {
    padding: SPACING.xl,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    padding: SPACING.xl,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalConfirmBtn: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  modalConfirmGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
});
