import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  COLORS,
  GRADIENTS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from '../../../constants/theme';

type PayCycle = 'monthly' | 'bi_weekly' | 'weekly';

interface PaymentScheduleConfig {
  payCycle: PayCycle;
  payDay: number;
  cutoffDay: number;
  processBeforeDays: number;
  autoProcess: boolean;
}

const PAY_CYCLE_OPTIONS = [
  { value: 'monthly' as PayCycle, label: 'Monthly', description: 'Once per month' },
  { value: 'bi_weekly' as PayCycle, label: 'Bi-weekly', description: 'Every 2 weeks' },
  { value: 'weekly' as PayCycle, label: 'Weekly', description: 'Every week' },
];

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function PaymentScheduleSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<PaymentScheduleConfig>({
    payCycle: 'monthly',
    payDay: 1,
    cutoffDay: 25,
    processBeforeDays: 3,
    autoProcess: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setConfig({
        payCycle: 'monthly',
        payDay: 1,
        cutoffDay: 25,
        processBeforeDays: 3,
        autoProcess: true,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load payment schedule settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Payment schedule updated successfully');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save payment schedule');
    } finally {
      setSaving(false);
    }
  };

  const getOrdinalSuffix = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Schedule</Text>
          <View style={styles.placeholder} />
        </View>
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
        <Text style={styles.headerTitle}>Payment Schedule</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pay Cycle</Text>
          <Text style={styles.sectionSubtitle}>How often do you process payroll?</Text>
          <View style={styles.optionsGrid}>
            {PAY_CYCLE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionCard,
                  config.payCycle === option.value && styles.optionCardSelected,
                ]}
                onPress={() => setConfig({ ...config, payCycle: option.value })}
              >
                <View style={styles.radioCircle}>
                  {config.payCycle === option.value && (
                    <View style={styles.radioFilled} />
                  )}
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pay Day</Text>
          <Text style={styles.sectionSubtitle}>Which day of the month should salaries be paid?</Text>
          <View style={styles.daySelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {DAY_OPTIONS.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    config.payDay === day && styles.dayButtonSelected,
                  ]}
                  onPress={() => setConfig({ ...config, payDay: day })}
                >
                  <Text
                    style={[
                      styles.dayButtonText,
                      config.payDay === day && styles.dayButtonTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <Text style={styles.helperText}>
            Salaries will be paid on the {getOrdinalSuffix(config.payDay)} of every month
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cutoff Day</Text>
          <Text style={styles.sectionSubtitle}>Last day to record attendance/hours for the pay period</Text>
          <View style={styles.daySelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {DAY_OPTIONS.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    config.cutoffDay === day && styles.dayButtonSelected,
                  ]}
                  onPress={() => setConfig({ ...config, cutoffDay: day })}
                >
                  <Text
                    style={[
                      styles.dayButtonText,
                      config.cutoffDay === day && styles.dayButtonTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auto-Process</Text>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setConfig({ ...config, autoProcess: !config.autoProcess })}
          >
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Automatic Payroll Processing</Text>
              <Text style={styles.toggleDescription}>
                Automatically process payroll {config.processBeforeDays} days before pay day
              </Text>
            </View>
            <View style={[styles.toggle, config.autoProcess && styles.toggleActive]}>
              <View style={[styles.toggleKnob, config.autoProcess && styles.toggleKnobActive]} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          <LinearGradient colors={GRADIENTS.primary} style={styles.saveButtonGradient}>
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xxl,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.md,
  },
  optionsGrid: {
    gap: SPACING.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  optionCardSelected: {
    borderColor: COLORS.violet,
    backgroundColor: `${COLORS.violet}10`,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  radioFilled: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.violet,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  optionDescription: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  daySelector: {
    marginBottom: SPACING.sm,
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  dayButtonSelected: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  dayButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  dayButtonTextSelected: {
    color: COLORS.white,
  },
  helperText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    fontStyle: 'italic',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  toggleInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  toggleLabel: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  toggleDescription: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.cardBorder,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.violet,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  toggleKnobActive: {
    transform: [{ translateX: 22 }],
  },
  bottomPadding: {
    height: 100,
  },
  footer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cancelButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
