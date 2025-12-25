import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
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

interface BookingRulesData {
  instantBooking: boolean;
  acceptGroup: boolean;
  offerDeals: boolean;
  minAdvanceNotice: string;
  maxAdvanceBooking: string;
  cancellationPeriod: string;
  allowRescheduling: boolean;
  requireDeposit: boolean;
  depositPercentage: string;
}

const MIN_NOTICE_OPTIONS = [
  { value: 'immediate', label: 'Immediately' },
  { value: '30min', label: '30 minutes before' },
  { value: '1hour', label: '1 hour before' },
  { value: '2hours', label: '2 hours before' },
  { value: '4hours', label: '4 hours before' },
  { value: '1day', label: '24 hours before' },
  { value: '2days', label: '2 days before' },
  { value: '1week', label: '1 week before' },
];

const MAX_ADVANCE_OPTIONS = [
  { value: '1week', label: '1 week ahead' },
  { value: '2weeks', label: '2 weeks ahead' },
  { value: '1month', label: '1 month ahead' },
  { value: '2months', label: '2 months ahead' },
  { value: '3months', label: '3 months ahead' },
  { value: '6months', label: '6 months ahead' },
  { value: '1year', label: '1 year ahead' },
];

const CANCELLATION_OPTIONS = [
  { value: 'anytime', label: 'Anytime (free cancellation)' },
  { value: '1hour', label: 'Up to 1 hour before' },
  { value: '2hours', label: 'Up to 2 hours before' },
  { value: '4hours', label: 'Up to 4 hours before' },
  { value: '1day', label: 'Up to 24 hours before' },
  { value: '2days', label: 'Up to 2 days before' },
  { value: 'no_cancel', label: 'No online cancellation' },
];

const DEPOSIT_OPTIONS = [
  { value: '10', label: '10%' },
  { value: '20', label: '20%' },
  { value: '25', label: '25%' },
  { value: '50', label: '50%' },
  { value: '100', label: 'Full payment' },
];

export default function BookingRulesScreen() {
  const router = useRouter();
  const { data: settings, isLoading, refetch } = useSettings();
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [rules, setRules] = useState<BookingRulesData>({
    instantBooking: true,
    acceptGroup: false,
    offerDeals: false,
    minAdvanceNotice: '1hour',
    maxAdvanceBooking: '3months',
    cancellationPeriod: '1day',
    allowRescheduling: true,
    requireDeposit: false,
    depositPercentage: '20',
  });

  useEffect(() => {
    if (settings?.salon) {
      setRules(prev => ({
        ...prev,
        instantBooking: settings.salon.instantBooking === 1,
        acceptGroup: settings.salon.acceptGroup === 1,
        offerDeals: settings.salon.offerDeals === 1,
      }));
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

  const updateRule = <K extends keyof BookingRulesData>(key: K, value: BookingRulesData[K]) => {
    setRules(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await settingsApi.updateSalon({
        instantBooking: rules.instantBooking ? 1 : 0,
        offerDeals: rules.offerDeals ? 1 : 0,
        acceptGroup: rules.acceptGroup ? 1 : 0,
      });
      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        setHasChanges(false);
        Alert.alert('Success', 'Booking rules updated successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        refetch();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update booking rules');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading booking rules...</Text>
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
          <Text style={styles.headerTitle}>Booking Rules</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.restrictedContainer}>
          <Text style={styles.restrictedIcon}>🔒</Text>
          <Text style={styles.restrictedTitle}>Owner Access Only</Text>
          <Text style={styles.restrictedSubtitle}>
            Only salon owners can edit booking rules. Contact your salon owner for changes.
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
        <Text style={styles.headerTitle}>Booking Rules</Text>
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
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Booking Options</Text>
          
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleIcon}>⚡</Text>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleTitle}>Instant Booking</Text>
                <Text style={styles.toggleSubtitle}>
                  Allow customers to book instantly without confirmation
                </Text>
              </View>
            </View>
            <Switch
              value={rules.instantBooking}
              onValueChange={(value) => updateRule('instantBooking', value)}
              trackColor={{ false: COLORS.cardBorder, true: COLORS.success }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleIcon}>👥</Text>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleTitle}>Group Bookings</Text>
                <Text style={styles.toggleSubtitle}>
                  Accept bookings for multiple people
                </Text>
              </View>
            </View>
            <Switch
              value={rules.acceptGroup}
              onValueChange={(value) => updateRule('acceptGroup', value)}
              trackColor={{ false: COLORS.cardBorder, true: COLORS.success }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleIcon}>🏷️</Text>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleTitle}>Offer Deals</Text>
                <Text style={styles.toggleSubtitle}>
                  Enable promotional deals and discounts
                </Text>
              </View>
            </View>
            <Switch
              value={rules.offerDeals}
              onValueChange={(value) => updateRule('offerDeals', value)}
              trackColor={{ false: COLORS.cardBorder, true: COLORS.success }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Advance Booking</Text>
          
          <View style={styles.optionGroup}>
            <Text style={styles.optionLabel}>Minimum Notice Period</Text>
            <Text style={styles.optionHint}>
              How much notice do you need before an appointment?
            </Text>
            <View style={styles.chipContainer}>
              {MIN_NOTICE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.chip,
                    rules.minAdvanceNotice === option.value && styles.chipSelected
                  ]}
                  onPress={() => updateRule('minAdvanceNotice', option.value)}
                >
                  <Text style={[
                    styles.chipText,
                    rules.minAdvanceNotice === option.value && styles.chipTextSelected
                  ]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.optionGroup}>
            <Text style={styles.optionLabel}>Maximum Advance Booking</Text>
            <Text style={styles.optionHint}>
              How far in advance can customers book?
            </Text>
            <View style={styles.chipContainer}>
              {MAX_ADVANCE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.chip,
                    rules.maxAdvanceBooking === option.value && styles.chipSelected
                  ]}
                  onPress={() => updateRule('maxAdvanceBooking', option.value)}
                >
                  <Text style={[
                    styles.chipText,
                    rules.maxAdvanceBooking === option.value && styles.chipTextSelected
                  ]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Cancellation Policy</Text>

          <View style={styles.optionGroup}>
            <Text style={styles.optionLabel}>Cancellation Window</Text>
            <Text style={styles.optionHint}>
              When can customers cancel online?
            </Text>
            <View style={styles.chipContainer}>
              {CANCELLATION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.chip,
                    rules.cancellationPeriod === option.value && styles.chipSelected
                  ]}
                  onPress={() => updateRule('cancellationPeriod', option.value)}
                >
                  <Text style={[
                    styles.chipText,
                    rules.cancellationPeriod === option.value && styles.chipTextSelected
                  ]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleIcon}>🔄</Text>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleTitle}>Allow Rescheduling</Text>
                <Text style={styles.toggleSubtitle}>
                  Let customers reschedule their bookings online
                </Text>
              </View>
            </View>
            <Switch
              value={rules.allowRescheduling}
              onValueChange={(value) => updateRule('allowRescheduling', value)}
              trackColor={{ false: COLORS.cardBorder, true: COLORS.success }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>No-Show Protection</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleIcon}>💳</Text>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleTitle}>Require Deposit</Text>
                <Text style={styles.toggleSubtitle}>
                  Charge a deposit to reduce no-shows
                </Text>
              </View>
            </View>
            <Switch
              value={rules.requireDeposit}
              onValueChange={(value) => updateRule('requireDeposit', value)}
              trackColor={{ false: COLORS.cardBorder, true: COLORS.success }}
              thumbColor={COLORS.white}
            />
          </View>

          {rules.requireDeposit && (
            <>
              <View style={styles.divider} />
              <View style={styles.optionGroup}>
                <Text style={styles.optionLabel}>Deposit Amount</Text>
                <View style={styles.chipContainer}>
                  {DEPOSIT_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.chip,
                        rules.depositPercentage === option.value && styles.chipSelected
                      ]}
                      onPress={() => updateRule('depositPercentage', option.value)}
                    >
                      <Text style={[
                        styles.chipText,
                        rules.depositPercentage === option.value && styles.chipTextSelected
                      ]}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Booking rules help manage customer expectations and reduce no-shows. Changes apply immediately to new bookings.
          </Text>
        </View>
      </ScrollView>
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
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: SPACING.md,
  },
  toggleIcon: {
    fontSize: 20,
    marginRight: SPACING.md,
    marginTop: 2,
  },
  toggleContent: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.white,
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SPACING.md,
  },
  optionGroup: {
    marginBottom: SPACING.sm,
  },
  optionLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  optionHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  chipSelected: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  chipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  chipTextSelected: {
    color: COLORS.white,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: SPACING.md,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
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
});
