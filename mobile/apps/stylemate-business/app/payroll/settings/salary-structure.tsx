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

type ComponentType = 'earning' | 'deduction' | 'reimbursement';
type CalculationType = 'fixed' | 'percentage_of_basic' | 'percentage_of_ctc';

interface SalaryComponent {
  id: string;
  name: string;
  type: ComponentType;
  calculationType: CalculationType;
  value: number;
  isActive: boolean;
  isMandatory: boolean;
  taxable: boolean;
}

const DEFAULT_COMPONENTS: SalaryComponent[] = [
  { id: '1', name: 'Basic Salary', type: 'earning', calculationType: 'percentage_of_ctc', value: 50, isActive: true, isMandatory: true, taxable: true },
  { id: '2', name: 'HRA', type: 'earning', calculationType: 'percentage_of_basic', value: 40, isActive: true, isMandatory: false, taxable: false },
  { id: '3', name: 'Conveyance Allowance', type: 'earning', calculationType: 'fixed', value: 160000, isActive: true, isMandatory: false, taxable: false },
  { id: '4', name: 'Medical Allowance', type: 'earning', calculationType: 'fixed', value: 125000, isActive: true, isMandatory: false, taxable: false },
  { id: '5', name: 'Special Allowance', type: 'earning', calculationType: 'percentage_of_ctc', value: 10, isActive: true, isMandatory: false, taxable: true },
  { id: '6', name: 'PF Employee', type: 'deduction', calculationType: 'percentage_of_basic', value: 12, isActive: true, isMandatory: true, taxable: false },
  { id: '7', name: 'Professional Tax', type: 'deduction', calculationType: 'fixed', value: 20000, isActive: true, isMandatory: true, taxable: false },
];

const COMPONENT_TYPE_CONFIG = {
  earning: { label: 'Earnings', color: COLORS.green, icon: '💰' },
  deduction: { label: 'Deductions', color: COLORS.red, icon: '📉' },
  reimbursement: { label: 'Reimbursements', color: COLORS.blue, icon: '📋' },
};

const CALCULATION_TYPE_LABELS = {
  fixed: 'Fixed Amount',
  percentage_of_basic: '% of Basic',
  percentage_of_ctc: '% of CTC',
};

export default function SalaryStructureSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [activeTab, setActiveTab] = useState<ComponentType>('earning');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newComponent, setNewComponent] = useState<Partial<SalaryComponent>>({
    name: '',
    type: 'earning',
    calculationType: 'fixed',
    value: 0,
    isActive: true,
    isMandatory: false,
    taxable: true,
  });

  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setComponents(DEFAULT_COMPONENTS);
    } catch (error) {
      Alert.alert('Error', 'Failed to load salary structure');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Salary structure updated successfully');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save salary structure');
    } finally {
      setSaving(false);
    }
  };

  const toggleComponent = (componentId: string) => {
    setComponents(components.map(comp =>
      comp.id === componentId && !comp.isMandatory
        ? { ...comp, isActive: !comp.isActive }
        : comp
    ));
  };

  const updateComponentValue = (componentId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setComponents(components.map(comp =>
      comp.id === componentId ? { ...comp, value: numValue } : comp
    ));
  };

  const handleAddComponent = () => {
    if (!newComponent.name) {
      Alert.alert('Error', 'Please enter a component name');
      return;
    }

    const component: SalaryComponent = {
      id: Date.now().toString(),
      name: newComponent.name!,
      type: newComponent.type as ComponentType,
      calculationType: newComponent.calculationType as CalculationType,
      value: newComponent.value || 0,
      isActive: true,
      isMandatory: false,
      taxable: newComponent.taxable || false,
    };

    setComponents([...components, component]);
    setShowAddForm(false);
    setNewComponent({
      name: '',
      type: 'earning',
      calculationType: 'fixed',
      value: 0,
      isActive: true,
      isMandatory: false,
      taxable: true,
    });
  };

  const filteredComponents = components.filter(comp => comp.type === activeTab);

  const formatValue = (component: SalaryComponent) => {
    if (component.calculationType === 'fixed') {
      return `₹${(component.value / 100).toLocaleString('en-IN')}`;
    }
    return `${component.value}%`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Salary Structure</Text>
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
        <Text style={styles.headerTitle}>Salary Structure</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        {(Object.keys(COMPONENT_TYPE_CONFIG) as ComponentType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.tab, activeTab === type && styles.tabActive]}
            onPress={() => setActiveTab(type)}
          >
            <Text style={[styles.tabText, activeTab === type && styles.tabTextActive]}>
              {COMPONENT_TYPE_CONFIG[type].icon} {COMPONENT_TYPE_CONFIG[type].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {filteredComponents.map((component) => (
          <View key={component.id} style={styles.componentCard}>
            <View style={styles.componentHeader}>
              <View style={styles.componentInfo}>
                <Text style={styles.componentName}>{component.name}</Text>
                <View style={styles.componentMeta}>
                  <Text style={styles.calculationType}>
                    {CALCULATION_TYPE_LABELS[component.calculationType]}
                  </Text>
                  {component.isMandatory && (
                    <View style={styles.mandatoryBadge}>
                      <Text style={styles.mandatoryBadgeText}>Required</Text>
                    </View>
                  )}
                  {component.taxable && (
                    <View style={styles.taxableBadge}>
                      <Text style={styles.taxableBadgeText}>Taxable</Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={[styles.toggle, component.isActive && styles.toggleActive]}
                onPress={() => toggleComponent(component.id)}
                disabled={component.isMandatory}
              >
                <View style={[styles.toggleKnob, component.isActive && styles.toggleKnobActive]} />
              </TouchableOpacity>
            </View>

            {component.isActive && (
              <View style={styles.componentValue}>
                <Text style={styles.valueLabel}>Value</Text>
                <View style={styles.valueInputContainer}>
                  {component.calculationType === 'fixed' && (
                    <Text style={styles.currencySymbol}>₹</Text>
                  )}
                  <TextInput
                    style={styles.valueInput}
                    value={component.calculationType === 'fixed' 
                      ? (component.value / 100).toString() 
                      : component.value.toString()}
                    onChangeText={(text) => {
                      const val = parseFloat(text) || 0;
                      updateComponentValue(
                        component.id, 
                        component.calculationType === 'fixed' 
                          ? (val * 100).toString() 
                          : val.toString()
                      );
                    }}
                    keyboardType="numeric"
                  />
                  {component.calculationType !== 'fixed' && (
                    <Text style={styles.percentSymbol}>%</Text>
                  )}
                </View>
              </View>
            )}
          </View>
        ))}

        {filteredComponents.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{COMPONENT_TYPE_CONFIG[activeTab].icon}</Text>
            <Text style={styles.emptyTitle}>No {COMPONENT_TYPE_CONFIG[activeTab].label}</Text>
            <Text style={styles.emptyDescription}>
              Add components to define your salary structure
            </Text>
          </View>
        )}

        {showAddForm && (
          <View style={styles.addForm}>
            <Text style={styles.formTitle}>Add New Component</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Component Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Travel Allowance"
                placeholderTextColor={COLORS.textMuted}
                value={newComponent.name}
                onChangeText={(text) => setNewComponent({ ...newComponent, name: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.typeSelector}>
                {(Object.keys(COMPONENT_TYPE_CONFIG) as ComponentType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      newComponent.type === type && styles.typeButtonActive,
                    ]}
                    onPress={() => setNewComponent({ ...newComponent, type })}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        newComponent.type === type && styles.typeButtonTextActive,
                      ]}
                    >
                      {COMPONENT_TYPE_CONFIG[type].icon}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Calculation Type</Text>
              <View style={styles.calculationSelector}>
                {(Object.keys(CALCULATION_TYPE_LABELS) as CalculationType[]).map((calcType) => (
                  <TouchableOpacity
                    key={calcType}
                    style={[
                      styles.calcButton,
                      newComponent.calculationType === calcType && styles.calcButtonActive,
                    ]}
                    onPress={() => setNewComponent({ ...newComponent, calculationType: calcType })}
                  >
                    <Text
                      style={[
                        styles.calcButtonText,
                        newComponent.calculationType === calcType && styles.calcButtonTextActive,
                      ]}
                    >
                      {CALCULATION_TYPE_LABELS[calcType]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Value</Text>
              <View style={styles.valueInputRow}>
                {newComponent.calculationType === 'fixed' && (
                  <Text style={styles.currencySymbol}>₹</Text>
                )}
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Enter value"
                  placeholderTextColor={COLORS.textMuted}
                  value={newComponent.value?.toString()}
                  onChangeText={(text) => setNewComponent({ ...newComponent, value: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                />
                {newComponent.calculationType !== 'fixed' && (
                  <Text style={styles.percentSymbol}>%</Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setNewComponent({ ...newComponent, taxable: !newComponent.taxable })}
            >
              <View style={[styles.checkbox, newComponent.taxable && styles.checkboxChecked]}>
                {newComponent.taxable && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>This component is taxable</Text>
            </TouchableOpacity>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelFormButton}
                onPress={() => setShowAddForm(false)}
              >
                <Text style={styles.cancelFormButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveFormButton}
                onPress={handleAddComponent}
              >
                <LinearGradient colors={GRADIENTS.primary} style={styles.saveFormButtonGradient}>
                  <Text style={styles.saveFormButtonText}>Add Component</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.violet,
    borderRadius: BORDER_RADIUS.md,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.card,
  },
  tabActive: {
    backgroundColor: COLORS.violet,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  componentCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  componentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  componentInfo: {
    flex: 1,
  },
  componentName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  componentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  calculationType: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  mandatoryBadge: {
    backgroundColor: `${COLORS.amber}20`,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  mandatoryBadgeText: {
    color: COLORS.amber,
    fontSize: FONT_SIZES.xs,
  },
  taxableBadge: {
    backgroundColor: `${COLORS.red}20`,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  taxableBadgeText: {
    color: COLORS.red,
    fontSize: FONT_SIZES.xs,
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
  componentValue: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  valueLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  valueInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.lg,
    marginRight: SPACING.xs,
  },
  valueInput: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  percentSymbol: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.lg,
    marginLeft: SPACING.xs,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  emptyDescription: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },
  addForm: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  formTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginBottom: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  typeButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  typeButtonActive: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  typeButtonText: {
    fontSize: FONT_SIZES.xl,
  },
  typeButtonTextActive: {
    color: COLORS.white,
  },
  calculationSelector: {
    gap: SPACING.sm,
  },
  calcButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  calcButtonActive: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  calcButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  calcButtonTextActive: {
    color: COLORS.white,
    fontWeight: '500',
  },
  valueInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  checkboxChecked: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  checkboxLabel: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
  },
  formActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cancelFormButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cancelFormButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  saveFormButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  saveFormButtonGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  saveFormButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
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
