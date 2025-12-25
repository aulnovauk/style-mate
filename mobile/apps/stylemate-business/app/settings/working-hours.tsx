import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  Modal,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from '../../constants/theme';
import { useSettings } from '@stylemate/core/hooks/useBusinessApi';
import { settingsApi } from '@stylemate/core/services/businessApi';

interface DaySchedule {
  open: boolean;
  start: string;
  end: string;
  breakStart?: string;
  breakEnd?: string;
}

interface BusinessHours {
  [key: string]: DaySchedule;
}

const DAYS = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30',
];

const DEFAULT_SCHEDULE: DaySchedule = {
  open: true,
  start: '09:00',
  end: '18:00',
};

function formatTime(time24: string): string {
  const [hours, minutes] = time24.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

export default function WorkingHoursScreen() {
  const router = useRouter();
  const { data: settings, isLoading, refetch } = useSettings();
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<'start' | 'end' | 'breakStart' | 'breakEnd'>('start');

  const [businessHours, setBusinessHours] = useState<BusinessHours>(() => {
    const initial: BusinessHours = {};
    DAYS.forEach(day => {
      initial[day.key] = { ...DEFAULT_SCHEDULE };
    });
    initial['sunday'] = { ...DEFAULT_SCHEDULE, open: false };
    return initial;
  });

  useEffect(() => {
    if (settings?.salon?.businessHours) {
      const savedHours = settings.salon.businessHours as BusinessHours;
      const merged: BusinessHours = {};
      DAYS.forEach(day => {
        merged[day.key] = savedHours[day.key] || { ...DEFAULT_SCHEDULE };
      });
      setBusinessHours(merged);
    }
  }, [settings]);

  const handleBack = useCallback(() => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() }
        ]
      );
      return true;
    }
    router.back();
    return true;
  }, [hasChanges, router]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => backHandler.remove();
  }, [handleBack]);

  const toggleDay = (dayKey: string) => {
    setBusinessHours(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        open: !prev[dayKey].open,
      }
    }));
    setHasChanges(true);
  };

  const openTimePicker = (dayKey: string, field: 'start' | 'end' | 'breakStart' | 'breakEnd') => {
    setSelectedDay(dayKey);
    setSelectedField(field);
    setShowTimePicker(true);
  };

  const selectTime = (time: string) => {
    if (selectedDay) {
      setBusinessHours(prev => ({
        ...prev,
        [selectedDay]: {
          ...prev[selectedDay],
          [selectedField]: time,
        }
      }));
      setHasChanges(true);
    }
    setShowTimePicker(false);
  };

  const toggleBreak = (dayKey: string) => {
    setBusinessHours(prev => {
      const current = prev[dayKey];
      if (current.breakStart) {
        const { breakStart, breakEnd, ...rest } = current;
        return { ...prev, [dayKey]: rest };
      } else {
        return {
          ...prev,
          [dayKey]: {
            ...current,
            breakStart: '13:00',
            breakEnd: '14:00',
          }
        };
      }
    });
    setHasChanges(true);
  };

  const applyToAllDays = (sourceDayKey: string) => {
    Alert.alert(
      'Apply to All Days',
      `Copy ${DAYS.find(d => d.key === sourceDayKey)?.label}'s schedule to all other open days?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: () => {
            const sourceSchedule = businessHours[sourceDayKey];
            setBusinessHours(prev => {
              const updated: BusinessHours = {};
              DAYS.forEach(day => {
                if (prev[day.key].open) {
                  updated[day.key] = { ...sourceSchedule };
                } else {
                  updated[day.key] = prev[day.key];
                }
              });
              return updated;
            });
            setHasChanges(true);
          }
        }
      ]
    );
  };

  const validateSchedule = (): string[] => {
    const errors: string[] = [];
    
    DAYS.forEach(day => {
      const schedule = businessHours[day.key];
      if (!schedule.open) return;
      
      const startMinutes = parseInt(schedule.start.split(':')[0]) * 60 + parseInt(schedule.start.split(':')[1]);
      const endMinutes = parseInt(schedule.end.split(':')[0]) * 60 + parseInt(schedule.end.split(':')[1]);
      
      if (endMinutes <= startMinutes) {
        errors.push(`${day.label}: Closing time must be after opening time`);
      }
      
      if (schedule.breakStart && schedule.breakEnd) {
        const breakStartMinutes = parseInt(schedule.breakStart.split(':')[0]) * 60 + parseInt(schedule.breakStart.split(':')[1]);
        const breakEndMinutes = parseInt(schedule.breakEnd.split(':')[0]) * 60 + parseInt(schedule.breakEnd.split(':')[1]);
        
        if (breakEndMinutes <= breakStartMinutes) {
          errors.push(`${day.label}: Break end must be after break start`);
        }
        if (breakStartMinutes < startMinutes || breakEndMinutes > endMinutes) {
          errors.push(`${day.label}: Break must be within working hours`);
        }
      }
    });
    
    return errors;
  };

  const handleSave = async () => {
    const validationErrors = validateSchedule();
    if (validationErrors.length > 0) {
      Alert.alert('Validation Error', validationErrors.slice(0, 3).join('\n') + (validationErrors.length > 3 ? `\n...and ${validationErrors.length - 3} more issues` : ''));
      return;
    }
    
    setSaving(true);
    try {
      const result = await settingsApi.updateBusinessHours({ businessHours });
      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        setHasChanges(false);
        Alert.alert('Success', 'Working hours updated successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        refetch();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update working hours');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = settings?.isOwner ?? false;

  if (!isOwner) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Working Hours</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.restrictedContainer}>
          <Text style={styles.restrictedIcon}>🔒</Text>
          <Text style={styles.restrictedTitle}>Owner Access Only</Text>
          <Text style={styles.restrictedSubtitle}>
            Only salon owners can edit working hours. Contact your salon owner for changes.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Working Hours</Text>
        <TouchableOpacity 
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={[styles.saveButtonText, !hasChanges && styles.saveButtonTextDisabled]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>⏰</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Business Hours</Text>
            <Text style={styles.infoText}>
              Set your opening hours for each day. These times are displayed on your profile and affect booking availability.
            </Text>
          </View>
        </View>

        {DAYS.map((day) => {
          const schedule = businessHours[day.key];
          return (
            <View key={day.key} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <View style={styles.dayLeft}>
                  <Text style={styles.dayLabel}>{day.label}</Text>
                  {schedule.open && (
                    <Text style={styles.dayHours}>
                      {formatTime(schedule.start)} - {formatTime(schedule.end)}
                    </Text>
                  )}
                </View>
                <Switch
                  value={schedule.open}
                  onValueChange={() => toggleDay(day.key)}
                  trackColor={{ false: COLORS.cardBorder, true: COLORS.success }}
                  thumbColor={COLORS.white}
                />
              </View>

              {schedule.open && (
                <View style={styles.dayDetails}>
                  <View style={styles.timeRow}>
                    <View style={styles.timeGroup}>
                      <Text style={styles.timeLabel}>Opens</Text>
                      <TouchableOpacity 
                        style={styles.timeButton}
                        onPress={() => openTimePicker(day.key, 'start')}
                      >
                        <Text style={styles.timeButtonText}>{formatTime(schedule.start)}</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.timeSeparator}>—</Text>
                    <View style={styles.timeGroup}>
                      <Text style={styles.timeLabel}>Closes</Text>
                      <TouchableOpacity 
                        style={styles.timeButton}
                        onPress={() => openTimePicker(day.key, 'end')}
                      >
                        <Text style={styles.timeButtonText}>{formatTime(schedule.end)}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={styles.breakToggle}
                    onPress={() => toggleBreak(day.key)}
                  >
                    <Text style={styles.breakToggleText}>
                      {schedule.breakStart ? '☕ Remove Break' : '☕ Add Break Time'}
                    </Text>
                  </TouchableOpacity>

                  {schedule.breakStart && schedule.breakEnd && (
                    <View style={styles.breakRow}>
                      <Text style={styles.breakLabel}>Break:</Text>
                      <TouchableOpacity 
                        style={styles.breakTimeButton}
                        onPress={() => openTimePicker(day.key, 'breakStart')}
                      >
                        <Text style={styles.breakTimeText}>{formatTime(schedule.breakStart)}</Text>
                      </TouchableOpacity>
                      <Text style={styles.breakSeparator}>-</Text>
                      <TouchableOpacity 
                        style={styles.breakTimeButton}
                        onPress={() => openTimePicker(day.key, 'breakEnd')}
                      >
                        <Text style={styles.breakTimeText}>{formatTime(schedule.breakEnd)}</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <TouchableOpacity 
                    style={styles.applyButton}
                    onPress={() => applyToAllDays(day.key)}
                  >
                    <Text style={styles.applyButtonText}>Apply to all days</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Weekly Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Open Days</Text>
            <Text style={styles.summaryValue}>
              {DAYS.filter(d => businessHours[d.key].open).length} days
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Closed Days</Text>
            <Text style={styles.summaryValue}>
              {DAYS.filter(d => !businessHours[d.key].open).map(d => d.short).join(', ') || 'None'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowTimePicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Time</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.timeList}>
              {TIME_OPTIONS.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeOption,
                    selectedDay && businessHours[selectedDay]?.[selectedField] === time && styles.timeOptionSelected
                  ]}
                  onPress={() => selectTime(time)}
                >
                  <Text style={[
                    styles.timeOptionText,
                    selectedDay && businessHours[selectedDay]?.[selectedField] === time && styles.timeOptionTextSelected
                  ]}>{formatTime(time)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
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
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.white,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  saveButton: {
    backgroundColor: COLORS.violet,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 70,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.cardBorder,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: FONT_SIZES.md,
  },
  saveButtonTextDisabled: {
    color: COLORS.textMuted,
  },
  placeholder: {
    width: 70,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  dayCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayLeft: {
    flex: 1,
  },
  dayLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  dayHours: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  dayDetails: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  timeGroup: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  timeButton: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  timeButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    fontWeight: '500',
  },
  timeSeparator: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textMuted,
    marginHorizontal: SPACING.lg,
  },
  breakToggle: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  breakToggleText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.violet,
  },
  breakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  breakLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  breakTimeButton: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  breakTimeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },
  breakSeparator: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginHorizontal: SPACING.sm,
  },
  applyButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  applyButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },
  summaryTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: '500',
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  restrictedIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  restrictedTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  restrictedSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  modalClose: {
    fontSize: 20,
    color: COLORS.textMuted,
  },
  timeList: {
    padding: SPACING.md,
  },
  timeOption: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
  },
  timeOptionSelected: {
    backgroundColor: COLORS.violet,
  },
  timeOptionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    textAlign: 'center',
  },
  timeOptionTextSelected: {
    fontWeight: '600',
  },
});
