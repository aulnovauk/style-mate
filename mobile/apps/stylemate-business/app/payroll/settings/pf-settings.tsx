import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
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

interface PFConfig {
  pfEnabled: boolean;
  employeeContributionRate: number;
  employerContributionRate: number;
  epsRate: number;
  adminCharges: number;
  salaryThreshold: number;
  includeBasicOnly: boolean;
  vpfEnabled: boolean;
  vpfMaxRate: number;
}

export default function PFSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<PFConfig>({
    pfEnabled: true,
    employeeContributionRate: 12,
    employerContributionRate: 12,
    epsRate: 8.33,
    adminCharges: 0.5,
    salaryThreshold: 15000,
    includeBasicOnly: true,
    vpfEnabled: false,
    vpfMaxRate: 100,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      Alert.alert('Error', 'Failed to load PF settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'PF settings updated successfully');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save PF settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PF Settings</Text>
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
        <Text style={styles.headerTitle}>PF Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Provident Fund (EPF)</Text>
              <Text style={styles.sectionSubtitle}>Employee Provident Fund contribution</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, config.pfEnabled && styles.toggleActive]}
              onPress={() => setConfig({ ...config, pfEnabled: !config.pfEnabled })}
            >
              <View style={[styles.toggleKnob, config.pfEnabled && styles.toggleKnobActive]} />
            </TouchableOpacity>
          </View>

          {config.pfEnabled && (
            <View style={styles.configCard}>
              <View style={styles.rateRow}>
                <View style={styles.rateItem}>
                  <Text style={styles.rateLabel}>Employee Contribution</Text>
                  <View style={styles.rateInputContainer}>
                    <TextInput
                      style={styles.rateInput}
                      value={config.employeeContributionRate.toString()}
                      onChangeText={(text) => setConfig({ ...config, employeeContributionRate: parseFloat(text) || 0 })}
                      keyboardType="numeric"
                    />
                    <Text style={styles.ratePercent}>%</Text>
                  </View>
                  <Text style={styles.rateDescription}>Of basic + DA</Text>
                </View>
                <View style={styles.rateItem}>
                  <Text style={styles.rateLabel}>Employer Contribution</Text>
                  <View style={styles.rateInputContainer}>
                    <TextInput
                      style={styles.rateInput}
                      value={config.employerContributionRate.toString()}
                      onChangeText={(text) => setConfig({ ...config, employerContributionRate: parseFloat(text) || 0 })}
                      keyboardType="numeric"
                    />
                    <Text style={styles.ratePercent}>%</Text>
                  </View>
                  <Text style={styles.rateDescription}>Of basic + DA</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownTitle}>Employer Contribution Breakdown</Text>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>EPF (to employee account)</Text>
                  <Text style={styles.breakdownValue}>{(config.employerContributionRate - config.epsRate).toFixed(2)}%</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>EPS (Pension)</Text>
                  <Text style={styles.breakdownValue}>{config.epsRate}%</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Admin Charges</Text>
                  <Text style={styles.breakdownValue}>{config.adminCharges}%</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calculation Settings</Text>
          <View style={styles.optionCard}>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setConfig({ ...config, includeBasicOnly: true })}
            >
              <View style={styles.radioCircle}>
                {config.includeBasicOnly && <View style={styles.radioFilled} />}
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>Basic + DA Only</Text>
                <Text style={styles.optionDescription}>Calculate PF on basic salary and DA only</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setConfig({ ...config, includeBasicOnly: false })}
            >
              <View style={styles.radioCircle}>
                {!config.includeBasicOnly && <View style={styles.radioFilled} />}
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>Gross Salary</Text>
                <Text style={styles.optionDescription}>Calculate PF on entire gross salary</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Voluntary PF (VPF)</Text>
              <Text style={styles.sectionSubtitle}>Allow employees to contribute extra</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, config.vpfEnabled && styles.toggleActive]}
              onPress={() => setConfig({ ...config, vpfEnabled: !config.vpfEnabled })}
            >
              <View style={[styles.toggleKnob, config.vpfEnabled && styles.toggleKnobActive]} />
            </TouchableOpacity>
          </View>

          {config.vpfEnabled && (
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Maximum VPF Rate</Text>
              <View style={styles.rateInputSmall}>
                <TextInput
                  style={styles.smallInput}
                  value={config.vpfMaxRate.toString()}
                  onChangeText={(text) => setConfig({ ...config, vpfMaxRate: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                />
                <Text style={styles.ratePercent}>%</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            PF contributions are calculated as per EPFO guidelines. Current EPF interest rate is 8.15% p.a.
          </Text>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  sectionSubtitle: {
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
  configCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  rateRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  rateItem: {
    flex: 1,
  },
  rateLabel: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  rateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rateInput: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    textAlign: 'center',
  },
  ratePercent: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.lg,
    marginLeft: SPACING.sm,
  },
  rateDescription: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SPACING.lg,
  },
  breakdownSection: {
    gap: SPACING.sm,
  },
  breakdownTitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  breakdownValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  optionCard: {
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  inputLabel: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
  },
  rateInputSmall: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallInput: {
    width: 80,
    height: 40,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: `${COLORS.blue}20`,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: `${COLORS.blue}40`,
  },
  infoIcon: {
    fontSize: FONT_SIZES.lg,
    marginRight: SPACING.sm,
  },
  infoText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
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
