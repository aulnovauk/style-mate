import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS, SIZES } from '../../constants/theme';
import { useEventDetail, useEventsActions, CloneEventParams } from '@stylemate/core';

interface CloneOptions {
  cloneBasicInfo: boolean;
  cloneTickets: boolean;
  cloneSpeakers: boolean;
  cloneSchedule: boolean;
  clonePolicies: boolean;
  cloneWhatToBring: boolean;
  cloneVenue: boolean;
  cloneCoverImage: boolean;
  clonePromoCodes: boolean;
}

function OptionToggle({ label, description, icon, value, onValueChange }: {
  label: string;
  description: string;
  icon: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.optionRow}>
      <Text style={styles.optionIcon}>{icon}</Text>
      <View style={styles.optionInfo}>
        <Text style={styles.optionLabel}>{label}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: COLORS.cardBorder, true: COLORS.violet + '60' }}
        thumbColor={value ? COLORS.violet : COLORS.textMuted}
      />
    </View>
  );
}

export default function CloneEventScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const sourceId = params.sourceId as string;

  const [newStartDate, setNewStartDate] = useState('');
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueAddress, setNewVenueAddress] = useState('');
  const [newCity, setNewCity] = useState('');
  const [options, setOptions] = useState<CloneOptions>({
    cloneBasicInfo: true,
    cloneTickets: true,
    cloneSpeakers: true,
    cloneSchedule: true,
    clonePolicies: true,
    cloneWhatToBring: true,
    cloneVenue: true,
    cloneCoverImage: true,
    clonePromoCodes: false,
  });

  const { data: sourceEvent, loading: eventLoading, error: eventError } = useEventDetail(sourceId);
  const { cloneEvent, isSubmitting } = useEventsActions();

  const updateOption = useCallback((key: keyof CloneOptions, value: boolean) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleClone = async () => {
    if (!newStartDate) {
      Alert.alert('Missing Date', 'Please select a new start date for the cloned event.');
      return;
    }

    const cloneParams: CloneEventParams = {
      ...options,
      newStartDate,
      newVenueName: newVenueName || undefined,
      newVenueAddress: newVenueAddress || undefined,
      newCity: newCity || undefined,
    };

    const result = await cloneEvent(sourceId, cloneParams);

    if (result.success) {
      Alert.alert(
        'Event Cloned',
        'Your event has been cloned successfully. Would you like to edit it now?',
        [
          { text: 'Later', onPress: () => router.replace('/events/list') },
          { text: 'Edit Now', onPress: () => router.replace(`/events/create?editId=${result.id}`) },
        ]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to clone event');
    }
  };

  const selectAllOptions = () => {
    setOptions({
      cloneBasicInfo: true,
      cloneTickets: true,
      cloneSpeakers: true,
      cloneSchedule: true,
      clonePolicies: true,
      cloneWhatToBring: true,
      cloneVenue: true,
      cloneCoverImage: true,
      clonePromoCodes: true,
    });
  };

  const deselectAllOptions = () => {
    setOptions({
      cloneBasicInfo: true,
      cloneTickets: false,
      cloneSpeakers: false,
      cloneSchedule: false,
      clonePolicies: false,
      cloneWhatToBring: false,
      cloneVenue: false,
      cloneCoverImage: false,
      clonePromoCodes: false,
    });
  };

  if (eventLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Clone Event</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading event...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (eventError || !sourceEvent) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Clone Event</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{eventError || 'Event not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryText}>Go Back</Text>
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
        <Text style={styles.headerTitle}>Clone Event</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sourceEventCard}>
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sourceEventGradient}
          >
            <Text style={styles.sourceEventEmoji}>📅</Text>
          </LinearGradient>
          <View style={styles.sourceEventInfo}>
            <Text style={styles.sourceEventLabel}>Cloning from:</Text>
            <Text style={styles.sourceEventTitle} numberOfLines={1}>{sourceEvent.title}</Text>
            <Text style={styles.sourceEventMeta}>
              📅 {sourceEvent.startDate} • 📍 {sourceEvent.city}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>New Event Date</Text>
          <Text style={styles.sectionDescription}>When will this new event take place?</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Start Date <Text style={styles.requiredStar}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={newStartDate}
              onChangeText={setNewStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.dateHint}>Format: 2025-03-15 (Year-Month-Day)</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>What to Clone</Text>
              <Text style={styles.sectionDescription}>Select which elements to copy</Text>
            </View>
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickActionBtn} onPress={selectAllOptions}>
                <Text style={styles.quickActionText}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionBtn} onPress={deselectAllOptions}>
                <Text style={styles.quickActionText}>None</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.optionsCard}>
            <OptionToggle
              label="Basic Info"
              description="Title, description, visibility"
              icon="📝"
              value={options.cloneBasicInfo}
              onValueChange={(val) => updateOption('cloneBasicInfo', val)}
            />
            <OptionToggle
              label="Tickets"
              description="Ticket types and pricing"
              icon="🎫"
              value={options.cloneTickets}
              onValueChange={(val) => updateOption('cloneTickets', val)}
            />
            <OptionToggle
              label="Speakers"
              description="Speaker profiles and bios"
              icon="👤"
              value={options.cloneSpeakers}
              onValueChange={(val) => updateOption('cloneSpeakers', val)}
            />
            <OptionToggle
              label="Schedule"
              description="Event timeline and sessions"
              icon="📅"
              value={options.cloneSchedule}
              onValueChange={(val) => updateOption('cloneSchedule', val)}
            />
            <OptionToggle
              label="Policies"
              description="Cancellation and refund policies"
              icon="⚖️"
              value={options.clonePolicies}
              onValueChange={(val) => updateOption('clonePolicies', val)}
            />
            <OptionToggle
              label="What to Bring"
              description="Attendee requirements list"
              icon="📋"
              value={options.cloneWhatToBring}
              onValueChange={(val) => updateOption('cloneWhatToBring', val)}
            />
            <OptionToggle
              label="Venue"
              description="Location and address"
              icon="📍"
              value={options.cloneVenue}
              onValueChange={(val) => updateOption('cloneVenue', val)}
            />
            <OptionToggle
              label="Cover Image"
              description="Event banner/cover"
              icon="🖼️"
              value={options.cloneCoverImage}
              onValueChange={(val) => updateOption('cloneCoverImage', val)}
            />
            <OptionToggle
              label="Promo Codes"
              description="Discount codes"
              icon="🏷️"
              value={options.clonePromoCodes}
              onValueChange={(val) => updateOption('clonePromoCodes', val)}
            />
          </View>
        </View>

        {!options.cloneVenue && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>New Venue (Optional)</Text>
            <Text style={styles.sectionDescription}>Leave blank to edit later</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Venue Name</Text>
              <TextInput
                style={styles.input}
                value={newVenueName}
                onChangeText={setNewVenueName}
                placeholder="e.g., Grand Ballroom"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Venue Address</Text>
              <TextInput
                style={styles.input}
                value={newVenueAddress}
                onChangeText={setNewVenueAddress}
                placeholder="Full address"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.input}
                value={newCity}
                onChangeText={setNewCity}
                placeholder="City"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>
        )}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Clone Summary</Text>
          <Text style={styles.summaryText}>
            {Object.values(options).filter(Boolean).length} elements will be cloned from "{sourceEvent.title}"
          </Text>
          <Text style={styles.summaryNote}>
            The cloned event will be saved as a draft. You can edit and publish it later.
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleClone} 
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.cloneBtn, isSubmitting && styles.cloneBtnDisabled]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.cloneBtnIcon}>📋</Text>
                <Text style={styles.cloneBtnText}>Clone Event</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  sourceEventCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sourceEventGradient: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  sourceEventEmoji: {
    fontSize: 32,
  },
  sourceEventInfo: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'center',
  },
  sourceEventLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    marginBottom: 2,
  },
  sourceEventTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: 4,
  },
  sourceEventMeta: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionDescription: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quickActionBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.sm,
  },
  quickActionText: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  requiredStar: {
    color: COLORS.red,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  optionsCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  optionIcon: {
    fontSize: FONT_SIZES.xl,
    marginRight: SPACING.md,
  },
  optionInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  optionLabel: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  optionDescription: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: COLORS.violet + '15',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.violet + '30',
  },
  summaryTitle: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  summaryText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  summaryNote: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
  },
  bottomPadding: {
    height: SPACING.xxl,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    backgroundColor: COLORS.background,
  },
  cancelBtn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  cloneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  cloneBtnDisabled: {
    opacity: 0.6,
  },
  cloneBtnIcon: {
    fontSize: FONT_SIZES.md,
  },
  cloneBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  dateHint: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
  },
});
