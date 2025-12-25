import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
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
import type { BusinessHours } from '@stylemate/core/services/businessApi';

interface DaySchedule {
  open: boolean;
  start: string;
  end: string;
  breakStart?: string;
  breakEnd?: string;
}

interface TimePickerProps {
  label: string;
  value: string;
  onPress: () => void;
  disabled?: boolean;
}

function TimePicker({ label, value, onPress, disabled }: TimePickerProps) {
  return (
    <TouchableOpacity 
      style={[styles.timePicker, disabled && styles.timePickerDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.timePickerLabel, disabled && styles.textDisabled]}>{label}</Text>
      <Text style={[styles.timePickerValue, disabled && styles.textDisabled]}>{value}</Text>
    </TouchableOpacity>
  );
}

interface DayRowProps {
  day: string;
  displayName: string;
  schedule: DaySchedule;
  onToggle: (open: boolean) => void;
  onTimeChange: (field: 'start' | 'end' | 'breakStart' | 'breakEnd', time: string) => void;
  isOwner: boolean;
}

function DayRow({ day, displayName, schedule, onToggle, onTimeChange, isOwner }: DayRowProps) {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedField, setSelectedField] = useState<'start' | 'end' | 'breakStart' | 'breakEnd'>('start');

  const timeOptions = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00',
  ];

  const handleTimeSelect = (time: string) => {
    onTimeChange(selectedField, time);
    setShowTimePicker(false);
  };

  const openTimePicker = (field: 'start' | 'end' | 'breakStart' | 'breakEnd') => {
    if (!isOwner) return;
    setSelectedField(field);
    setShowTimePicker(true);
  };

  return (
    <View style={styles.dayRow}>
      <View style={styles.dayHeader}>
        <View style={styles.dayNameContainer}>
          <Text style={styles.dayName}>{displayName}</Text>
          {!schedule.open && <Text style={styles.closedBadge}>Closed</Text>}
        </View>
        <Switch
          value={schedule.open}
          onValueChange={onToggle}
          trackColor={{ false: COLORS.cardBorder, true: COLORS.violet }}
          thumbColor={COLORS.white}
          disabled={!isOwner}
        />
      </View>

      {schedule.open && (
        <View style={styles.timesContainer}>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Working Hours</Text>
            <View style={styles.timeInputs}>
              <TimePicker
                label="Start"
                value={schedule.start}
                onPress={() => openTimePicker('start')}
                disabled={!isOwner}
              />
              <Text style={styles.timeSeparator}>-</Text>
              <TimePicker
                label="End"
                value={schedule.end}
                onPress={() => openTimePicker('end')}
                disabled={!isOwner}
              />
            </View>
          </View>

          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Break Time</Text>
            <View style={styles.timeInputs}>
              <TimePicker
                label="Start"
                value={schedule.breakStart || '-'}
                onPress={() => openTimePicker('breakStart')}
                disabled={!isOwner}
              />
              <Text style={styles.timeSeparator}>-</Text>
              <TimePicker
                label="End"
                value={schedule.breakEnd || '-'}
                onPress={() => openTimePicker('breakEnd')}
                disabled={!isOwner}
              />
            </View>
          </View>
        </View>
      )}

      {showTimePicker && (
        <View style={styles.timePickerModal}>
          <View style={styles.timePickerHeader}>
            <Text style={styles.timePickerTitle}>Select Time</Text>
            <TouchableOpacity onPress={() => setShowTimePicker(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.timeOptionsScroll} showsVerticalScrollIndicator={false}>
            {timeOptions.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeOption,
                  schedule[selectedField] === time && styles.timeOptionSelected,
                ]}
                onPress={() => handleTimeSelect(time)}
              >
                <Text
                  style={[
                    styles.timeOptionText,
                    schedule[selectedField] === time && styles.timeOptionTextSelected,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const DAYS = [
  { key: 'monday', display: 'Monday' },
  { key: 'tuesday', display: 'Tuesday' },
  { key: 'wednesday', display: 'Wednesday' },
  { key: 'thursday', display: 'Thursday' },
  { key: 'friday', display: 'Friday' },
  { key: 'saturday', display: 'Saturday' },
  { key: 'sunday', display: 'Sunday' },
];

const DEFAULT_SCHEDULE: DaySchedule = {
  open: false,
  start: '09:00',
  end: '18:00',
};

export default function OperatingHoursScreen() {
  const router = useRouter();
  const { salon, isOwner, loading, refetch } = useSettings();
  const { updateBusinessHours, isSubmitting } = useSettingsActions();

  const [businessHours, setBusinessHours] = useState<Record<string, DaySchedule>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (salon?.businessHours) {
      const hours: Record<string, DaySchedule> = {};
      DAYS.forEach(({ key }) => {
        const dayData = (salon.businessHours as any)?.[key];
        hours[key] = dayData || { ...DEFAULT_SCHEDULE };
      });
      setBusinessHours(hours);
    } else {
      const hours: Record<string, DaySchedule> = {};
      DAYS.forEach(({ key }) => {
        hours[key] = { ...DEFAULT_SCHEDULE, open: key !== 'sunday' };
      });
      setBusinessHours(hours);
    }
  }, [salon]);

  const handleToggleDay = (day: string, open: boolean) => {
    if (!isOwner) return;
    setBusinessHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], open },
    }));
    setHasChanges(true);
  };

  const handleTimeChange = (day: string, field: 'start' | 'end' | 'breakStart' | 'breakEnd', time: string) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: time },
    }));
    setHasChanges(true);
  };

  const applyToAllDays = () => {
    if (!isOwner) return;
    
    Alert.alert(
      'Apply to All Days',
      'This will apply Monday\'s schedule to all weekdays (Tue-Fri). Weekend will remain unchanged.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: () => {
            const mondaySchedule = businessHours.monday;
            setBusinessHours((prev) => ({
              ...prev,
              tuesday: { ...mondaySchedule },
              wednesday: { ...mondaySchedule },
              thursday: { ...mondaySchedule },
              friday: { ...mondaySchedule },
            }));
            setHasChanges(true);
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!isOwner) {
      Alert.alert('Error', 'Only salon owners can update business hours');
      return;
    }

    const result = await updateBusinessHours({ businessHours });
    if (result.success) {
      Alert.alert('Success', 'Business hours updated successfully', [
        { text: 'OK', onPress: () => { refetch(); router.back(); } },
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to update business hours');
    }
  };

  if (loading && !salon) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Operating Hours</Text>
        <View style={styles.placeholder} />
      </View>

      {!isOwner && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>Only salon owners can modify operating hours</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isOwner && (
          <TouchableOpacity style={styles.applyAllButton} onPress={applyToAllDays}>
            <Text style={styles.applyAllIcon}>📋</Text>
            <Text style={styles.applyAllText}>Apply Monday's schedule to all weekdays</Text>
          </TouchableOpacity>
        )}

        <View style={styles.daysContainer}>
          {DAYS.map(({ key, display }) => (
            <DayRow
              key={key}
              day={key}
              displayName={display}
              schedule={businessHours[key] || DEFAULT_SCHEDULE}
              onToggle={(open) => handleToggleDay(key, open)}
              onTimeChange={(field, time) => handleTimeChange(key, field, time)}
              isOwner={isOwner}
            />
          ))}
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipIcon}>💡</Text>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Tip</Text>
            <Text style={styles.tipText}>
              Set accurate business hours to help customers know when they can book appointments.
            </Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {isOwner && hasChanges && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <LinearGradient colors={GRADIENTS.primary} style={styles.saveButtonGradient}>
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
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
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.amber}20`,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  warningIcon: {
    fontSize: 16,
  },
  warningText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.amber,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SIZES.listPaddingBottom,
  },
  applyAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.violet}20`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  applyAllIcon: {
    fontSize: 18,
  },
  applyAllText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.violet,
    fontWeight: '500',
  },
  daysContainer: {
    gap: SPACING.md,
  },
  dayRow: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dayName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  closedBadge: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.red,
    backgroundColor: `${COLORS.red}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  timesContainer: {
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  timeRow: {
    gap: SPACING.sm,
  },
  timeLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  timePicker: {
    flex: 1,
    backgroundColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  timePickerDisabled: {
    opacity: 0.6,
  },
  timePickerLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  timePickerValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  textDisabled: {
    color: COLORS.textMuted,
  },
  timeSeparator: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textMuted,
  },
  timePickerModal: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    maxHeight: 200,
  },
  timePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBg,
  },
  timePickerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  closeButton: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textMuted,
  },
  timeOptionsScroll: {
    maxHeight: 150,
  },
  timeOption: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBg,
  },
  timeOptionSelected: {
    backgroundColor: `${COLORS.violet}20`,
  },
  timeOptionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  timeOptionTextSelected: {
    color: COLORS.violet,
    fontWeight: '600',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.md,
  },
  tipIcon: {
    fontSize: 24,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  tipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 40,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  saveButton: {
    flex: 2,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
});
