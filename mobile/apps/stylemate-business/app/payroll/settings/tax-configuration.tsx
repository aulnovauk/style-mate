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

interface TaxSlab {
  id: string;
  minAmount: number;
  maxAmount: number | null;
  rate: number;
}

interface TaxConfig {
  tdsEnabled: boolean;
  tdsSlabs: TaxSlab[];
  professionalTaxEnabled: boolean;
  professionalTaxAmount: number;
  esiEnabled: boolean;
  esiThreshold: number;
  esiEmployeeRate: number;
  esiEmployerRate: number;
}

const DEFAULT_TDS_SLABS: TaxSlab[] = [
  { id: '1', minAmount: 0, maxAmount: 250000, rate: 0 },
  { id: '2', minAmount: 250001, maxAmount: 500000, rate: 5 },
  { id: '3', minAmount: 500001, maxAmount: 1000000, rate: 20 },
  { id: '4', minAmount: 1000001, maxAmount: null, rate: 30 },
];

const formatCurrency = (amount: number): string => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

export default function TaxConfigurationSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<TaxConfig>({
    tdsEnabled: true,
    tdsSlabs: DEFAULT_TDS_SLABS,
    professionalTaxEnabled: true,
    professionalTaxAmount: 200,
    esiEnabled: true,
    esiThreshold: 21000,
    esiEmployeeRate: 0.75,
    esiEmployerRate: 3.25,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      Alert.alert('Error', 'Failed to load tax configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Tax configuration updated successfully');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save tax configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateSlabRate = (slabId: string, rate: string) => {
    const numRate = parseFloat(rate) || 0;
    setConfig({
      ...config,
      tdsSlabs: config.tdsSlabs.map(slab =>
        slab.id === slabId ? { ...slab, rate: numRate } : slab
      ),
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tax Configuration</Text>
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
        <Text style={styles.headerTitle}>Tax Configuration</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>TDS (Tax Deducted at Source)</Text>
              <Text style={styles.sectionSubtitle}>Income tax deduction slabs</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, config.tdsEnabled && styles.toggleActive]}
              onPress={() => setConfig({ ...config, tdsEnabled: !config.tdsEnabled })}
            >
              <View style={[styles.toggleKnob, config.tdsEnabled && styles.toggleKnobActive]} />
            </TouchableOpacity>
          </View>

          {config.tdsEnabled && (
            <View style={styles.slabsContainer}>
              {config.tdsSlabs.map((slab) => (
                <View key={slab.id} style={styles.slabCard}>
                  <View style={styles.slabRange}>
                    <Text style={styles.slabRangeText}>
                      {formatCurrency(slab.minAmount)} - {slab.maxAmount ? formatCurrency(slab.maxAmount) : 'Above'}
                    </Text>
                  </View>
                  <View style={styles.slabRateContainer}>
                    <TextInput
                      style={styles.rateInput}
                      value={slab.rate.toString()}
                      onChangeText={(text) => updateSlabRate(slab.id, text)}
                      keyboardType="numeric"
                      maxLength={4}
                    />
                    <Text style={styles.ratePercent}>%</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Professional Tax</Text>
              <Text style={styles.sectionSubtitle}>State-level professional tax</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, config.professionalTaxEnabled && styles.toggleActive]}
              onPress={() => setConfig({ ...config, professionalTaxEnabled: !config.professionalTaxEnabled })}
            >
              <View style={[styles.toggleKnob, config.professionalTaxEnabled && styles.toggleKnobActive]} />
            </TouchableOpacity>
          </View>

          {config.professionalTaxEnabled && (
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Monthly Amount</Text>
              <View style={styles.currencyInput}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  value={config.professionalTaxAmount.toString()}
                  onChangeText={(text) => setConfig({ ...config, professionalTaxAmount: parseInt(text) || 0 })}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>ESI (Employee State Insurance)</Text>
              <Text style={styles.sectionSubtitle}>Medical insurance contribution</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, config.esiEnabled && styles.toggleActive]}
              onPress={() => setConfig({ ...config, esiEnabled: !config.esiEnabled })}
            >
              <View style={[styles.toggleKnob, config.esiEnabled && styles.toggleKnobActive]} />
            </TouchableOpacity>
          </View>

          {config.esiEnabled && (
            <View style={styles.esiConfig}>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Salary Threshold (Monthly)</Text>
                <View style={styles.currencyInput}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={config.esiThreshold.toString()}
                    onChangeText={(text) => setConfig({ ...config, esiThreshold: parseInt(text) || 0 })}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.rateRow}>
                <View style={styles.rateItem}>
                  <Text style={styles.rateLabel}>Employee Rate</Text>
                  <View style={styles.rateInputContainer}>
                    <TextInput
                      style={styles.smallRateInput}
                      value={config.esiEmployeeRate.toString()}
                      onChangeText={(text) => setConfig({ ...config, esiEmployeeRate: parseFloat(text) || 0 })}
                      keyboardType="numeric"
                    />
                    <Text style={styles.ratePercent}>%</Text>
                  </View>
                </View>
                <View style={styles.rateItem}>
                  <Text style={styles.rateLabel}>Employer Rate</Text>
                  <View style={styles.rateInputContainer}>
                    <TextInput
                      style={styles.smallRateInput}
                      value={config.esiEmployerRate.toString()}
                      onChangeText={(text) => setConfig({ ...config, esiEmployerRate: parseFloat(text) || 0 })}
                      keyboardType="numeric"
                    />
                    <Text style={styles.ratePercent}>%</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Tax configurations comply with Indian Income Tax Act and ESI Act. Consult your CA for specific requirements.
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
  slabsContainer: {
    gap: SPACING.sm,
  },
  slabCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  slabRange: {
    flex: 1,
  },
  slabRangeText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
  },
  slabRateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rateInput: {
    width: 60,
    height: 40,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },
  ratePercent: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    marginLeft: SPACING.xs,
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
  currencyInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    marginRight: SPACING.xs,
  },
  amountInput: {
    width: 100,
    height: 40,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    textAlign: 'right',
  },
  esiConfig: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  rateRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  rateItem: {
    flex: 1,
  },
  rateLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  rateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallRateInput: {
    flex: 1,
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
