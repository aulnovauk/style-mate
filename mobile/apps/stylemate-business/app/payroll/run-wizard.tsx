import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
  COLORS,
  GRADIENTS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from '../../constants/theme';

type WizardStep = 1 | 2 | 3 | 4;

interface StaffPayrollEntry {
  id: string;
  name: string;
  role: string;
  selected: boolean;
  baseSalary: number;
  commission: number;
  bonus: number;
  deductions: number;
  netPayable: number;
  adjustments: number;
  adjustmentNote: string;
}

const STEPS = [
  { step: 1, title: 'Select Staff', icon: '👥' },
  { step: 2, title: 'Review Earnings', icon: '💰' },
  { step: 3, title: 'Adjustments', icon: '📝' },
  { step: 4, title: 'Confirm', icon: '✅' },
];

const formatCurrency = (amountInPaisa: number): string => {
  return `₹${(amountInPaisa / 100).toLocaleString('en-IN')}`;
};

function StepIndicator({ currentStep }: { currentStep: WizardStep }) {
  return (
    <View style={styles.stepIndicator}>
      {STEPS.map((step, index) => (
        <View key={step.step} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              currentStep >= step.step && styles.stepCircleActive,
              currentStep === step.step && styles.stepCircleCurrent,
            ]}
          >
            <Text style={styles.stepIcon}>{step.icon}</Text>
          </View>
          <Text
            style={[
              styles.stepTitle,
              currentStep >= step.step && styles.stepTitleActive,
            ]}
          >
            {step.title}
          </Text>
          {index < STEPS.length - 1 && (
            <View
              style={[
                styles.stepLine,
                currentStep > step.step && styles.stepLineActive,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );
}

export default function PayrollRunWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [processing, setProcessing] = useState(false);
  const [selectedMonth] = useState(new Date());

  const [staffEntries, setStaffEntries] = useState<StaffPayrollEntry[]>([
    { id: '1', name: 'Rahul Kumar', role: 'Senior Stylist', selected: true, baseSalary: 2800000, commission: 820000, bonus: 300000, deductions: 245000, netPayable: 3675000, adjustments: 0, adjustmentNote: '' },
    { id: '2', name: 'Anjali Reddy', role: 'Makeup Artist', selected: true, baseSalary: 3200000, commission: 1240000, bonus: 500000, deductions: 312000, netPayable: 4628000, adjustments: 0, adjustmentNote: '' },
    { id: '3', name: 'Vikram Singh', role: 'Barber', selected: true, baseSalary: 2500000, commission: 680000, bonus: 200000, deductions: 205000, netPayable: 3175000, adjustments: 0, adjustmentNote: '' },
    { id: '4', name: 'Priya Malhotra', role: 'Hair Colorist', selected: true, baseSalary: 1800000, commission: 560000, bonus: 150000, deductions: 125000, netPayable: 2385000, adjustments: 0, adjustmentNote: '' },
  ]);

  const selectedStaff = useMemo(() => staffEntries.filter(s => s.selected), [staffEntries]);
  const totalPayroll = useMemo(() => selectedStaff.reduce((sum, s) => sum + s.netPayable + s.adjustments, 0), [selectedStaff]);

  const toggleStaffSelection = (id: string) => {
    setStaffEntries(prev => prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  };

  const selectAll = () => {
    setStaffEntries(prev => prev.map(s => ({ ...s, selected: true })));
  };

  const deselectAll = () => {
    setStaffEntries(prev => prev.map(s => ({ ...s, selected: false })));
  };

  const updateAdjustment = (id: string, amount: number, note: string) => {
    setStaffEntries(prev => prev.map(s => s.id === id ? { ...s, adjustments: amount, adjustmentNote: note } : s));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      if (currentStep === 1 && selectedStaff.length === 0) {
        Alert.alert('Select Staff', 'Please select at least one staff member to proceed.');
        return;
      }
      setCurrentStep((currentStep + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
    } else {
      router.back();
    }
  };

  const handleProcessPayroll = async () => {
    Alert.alert(
      'Process Payroll',
      `Are you sure you want to process payroll of ${formatCurrency(totalPayroll)} for ${selectedStaff.length} staff members?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Process',
          onPress: async () => {
            setProcessing(true);
            await new Promise(resolve => setTimeout(resolve, 2000));
            setProcessing(false);
            Alert.alert(
              'Success',
              `Payroll processed successfully for ${selectedStaff.length} staff members!`,
              [{ text: 'OK', onPress: () => router.back() }]
            );
          },
        },
      ]
    );
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepHeaderTitle}>Select Staff Members</Text>
        <Text style={styles.stepHeaderSubtitle}>Choose who to include in this payroll run</Text>
      </View>

      <View style={styles.selectionActions}>
        <TouchableOpacity style={styles.selectionButton} onPress={selectAll}>
          <Text style={styles.selectionButtonText}>Select All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.selectionButton} onPress={deselectAll}>
          <Text style={styles.selectionButtonText}>Deselect All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.staffList}>
        {staffEntries.map((staff) => (
          <TouchableOpacity
            key={staff.id}
            style={[styles.staffSelectCard, staff.selected && styles.staffSelectCardActive]}
            onPress={() => toggleStaffSelection(staff.id)}
          >
            <View style={styles.staffSelectInfo}>
              <View style={[styles.staffAvatar, staff.selected && styles.staffAvatarActive]}>
                <Text style={styles.staffAvatarText}>{staff.name.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.staffName}>{staff.name}</Text>
                <Text style={styles.staffRole}>{staff.role}</Text>
              </View>
            </View>
            <View style={styles.staffSelectRight}>
              <Text style={styles.staffNetPay}>{formatCurrency(staff.netPayable)}</Text>
              <View style={[styles.checkbox, staff.selected && styles.checkboxActive]}>
                {staff.selected && <Text style={styles.checkboxIcon}>✓</Text>}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.selectionSummary}>
        <Text style={styles.selectionSummaryText}>
          {selectedStaff.length} of {staffEntries.length} staff selected
        </Text>
        <Text style={styles.selectionTotal}>Total: {formatCurrency(totalPayroll)}</Text>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepHeaderTitle}>Review Earnings</Text>
        <Text style={styles.stepHeaderSubtitle}>Verify earnings breakdown for each staff member</Text>
      </View>

      <View style={styles.staffList}>
        {selectedStaff.map((staff) => (
          <View key={staff.id} style={styles.earningsCard}>
            <View style={styles.earningsHeader}>
              <View style={styles.staffAvatar}>
                <Text style={styles.staffAvatarText}>{staff.name.charAt(0)}</Text>
              </View>
              <View style={styles.earningsHeaderInfo}>
                <Text style={styles.staffName}>{staff.name}</Text>
                <Text style={styles.staffRole}>{staff.role}</Text>
              </View>
            </View>
            <View style={styles.earningsGrid}>
              <View style={styles.earningsItem}>
                <Text style={styles.earningsLabel}>Base Salary</Text>
                <Text style={styles.earningsValue}>{formatCurrency(staff.baseSalary)}</Text>
              </View>
              <View style={styles.earningsItem}>
                <Text style={styles.earningsLabel}>Commission</Text>
                <Text style={[styles.earningsValue, { color: COLORS.green }]}>{formatCurrency(staff.commission)}</Text>
              </View>
              <View style={styles.earningsItem}>
                <Text style={styles.earningsLabel}>Bonus</Text>
                <Text style={[styles.earningsValue, { color: COLORS.amber }]}>{formatCurrency(staff.bonus)}</Text>
              </View>
              <View style={styles.earningsItem}>
                <Text style={styles.earningsLabel}>Deductions</Text>
                <Text style={[styles.earningsValue, { color: COLORS.red }]}>-{formatCurrency(staff.deductions)}</Text>
              </View>
            </View>
            <View style={styles.earningsFooter}>
              <Text style={styles.netPayLabel}>Net Payable</Text>
              <Text style={styles.netPayValue}>{formatCurrency(staff.netPayable)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepHeaderTitle}>Adjustments</Text>
        <Text style={styles.stepHeaderSubtitle}>Add any one-time adjustments (bonus/deductions)</Text>
      </View>

      <View style={styles.staffList}>
        {selectedStaff.map((staff) => (
          <View key={staff.id} style={styles.adjustmentCard}>
            <View style={styles.adjustmentHeader}>
              <View style={styles.staffAvatar}>
                <Text style={styles.staffAvatarText}>{staff.name.charAt(0)}</Text>
              </View>
              <View style={styles.adjustmentHeaderInfo}>
                <Text style={styles.staffName}>{staff.name}</Text>
                <Text style={styles.staffRole}>Net: {formatCurrency(staff.netPayable)}</Text>
              </View>
            </View>
            <View style={styles.adjustmentInputs}>
              <View style={styles.adjustmentInputRow}>
                <Text style={styles.adjustmentInputLabel}>Adjustment (₹)</Text>
                <TextInput
                  style={styles.adjustmentInput}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={staff.adjustments !== 0 ? (staff.adjustments / 100).toString() : ''}
                  onChangeText={(text) => {
                    const amount = parseFloat(text) * 100 || 0;
                    updateAdjustment(staff.id, amount, staff.adjustmentNote);
                  }}
                />
              </View>
              <View style={styles.adjustmentInputRow}>
                <Text style={styles.adjustmentInputLabel}>Note</Text>
                <TextInput
                  style={[styles.adjustmentInput, styles.adjustmentNoteInput]}
                  placeholder="Reason for adjustment"
                  placeholderTextColor={COLORS.textMuted}
                  value={staff.adjustmentNote}
                  onChangeText={(text) => updateAdjustment(staff.id, staff.adjustments, text)}
                />
              </View>
            </View>
            {staff.adjustments !== 0 && (
              <View style={styles.adjustedTotal}>
                <Text style={styles.adjustedTotalLabel}>Adjusted Total</Text>
                <Text style={[styles.adjustedTotalValue, { color: staff.adjustments > 0 ? COLORS.green : COLORS.red }]}>
                  {formatCurrency(staff.netPayable + staff.adjustments)}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepHeaderTitle}>Confirm Payroll</Text>
        <Text style={styles.stepHeaderSubtitle}>Review and process payroll for {format(selectedMonth, 'MMMM yyyy')}</Text>
      </View>

      <View style={styles.confirmCard}>
        <View style={styles.confirmHeader}>
          <Text style={styles.confirmTitle}>Payroll Summary</Text>
        </View>
        <View style={styles.confirmDetails}>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Pay Period</Text>
            <Text style={styles.confirmValue}>
              {format(startOfMonth(selectedMonth), 'MMM d')} - {format(endOfMonth(selectedMonth), 'MMM d, yyyy')}
            </Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Staff Members</Text>
            <Text style={styles.confirmValue}>{selectedStaff.length}</Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Total Earnings</Text>
            <Text style={styles.confirmValue}>{formatCurrency(selectedStaff.reduce((sum, s) => sum + s.baseSalary + s.commission + s.bonus, 0))}</Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Total Deductions</Text>
            <Text style={[styles.confirmValue, { color: COLORS.red }]}>-{formatCurrency(selectedStaff.reduce((sum, s) => sum + s.deductions, 0))}</Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Adjustments</Text>
            <Text style={[styles.confirmValue, { color: selectedStaff.reduce((sum, s) => sum + s.adjustments, 0) >= 0 ? COLORS.green : COLORS.red }]}>
              {formatCurrency(selectedStaff.reduce((sum, s) => sum + s.adjustments, 0))}
            </Text>
          </View>
        </View>
        <View style={styles.confirmTotal}>
          <Text style={styles.confirmTotalLabel}>Total Payroll</Text>
          <Text style={styles.confirmTotalValue}>{formatCurrency(totalPayroll)}</Text>
        </View>
      </View>

      <View style={styles.confirmStaffList}>
        <Text style={styles.confirmStaffTitle}>Staff Breakdown</Text>
        {selectedStaff.map((staff) => (
          <View key={staff.id} style={styles.confirmStaffItem}>
            <View style={styles.confirmStaffInfo}>
              <Text style={styles.confirmStaffName}>{staff.name}</Text>
              <Text style={styles.confirmStaffRole}>{staff.role}</Text>
            </View>
            <Text style={styles.confirmStaffAmount}>{formatCurrency(staff.netPayable + staff.adjustments)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.warningCard}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <Text style={styles.warningText}>
          Once processed, this action cannot be undone. Please verify all amounts before proceeding.
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Run Payroll</Text>
        <View style={styles.placeholder} />
      </View>

      <StepIndicator currentStep={currentStep} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.backStepButton} onPress={handleBack}>
            <Text style={styles.backStepButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        {currentStep < 4 ? (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <LinearGradient colors={GRADIENTS.primary} style={styles.nextButtonGradient}>
              <Text style={styles.nextButtonText}>Next →</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextButton} onPress={handleProcessPayroll} disabled={processing}>
            <LinearGradient colors={GRADIENTS.success} style={styles.nextButtonGradient}>
              {processing ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.nextButtonText}>✓ Process Payroll</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
  },
  headerTitle: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  stepItem: {
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING.sm,
  },
  stepCircleActive: {
    backgroundColor: COLORS.violet,
  },
  stepCircleCurrent: {
    borderWidth: 3,
    borderColor: COLORS.fuchsia,
  },
  stepIcon: {
    fontSize: FONT_SIZES.xl,
  },
  stepTitle: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    marginTop: 4,
  },
  stepTitleActive: {
    color: COLORS.textPrimary,
  },
  stepLine: {
    position: 'absolute',
    top: 22,
    right: -20,
    width: 24,
    height: 2,
    backgroundColor: COLORS.cardBorder,
  },
  stepLineActive: {
    backgroundColor: COLORS.violet,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  stepContent: {},
  stepHeader: {
    marginBottom: SPACING.lg,
  },
  stepHeaderTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
  },
  stepHeaderSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    marginTop: 4,
  },
  selectionActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  selectionButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  selectionButtonText: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  staffList: {
    gap: SPACING.md,
  },
  staffSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  staffSelectCardActive: {
    borderColor: COLORS.violet,
    backgroundColor: `${COLORS.violet}10`,
  },
  staffSelectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  staffAvatar: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffAvatarActive: {
    backgroundColor: COLORS.violet,
  },
  staffAvatarText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  staffName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  staffRole: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  staffSelectRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  staffNetPay: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  checkboxIcon: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  selectionSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  selectionSummaryText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  selectionTotal: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  earningsCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  earningsHeaderInfo: {
    flex: 1,
  },
  earningsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: SPACING.md,
  },
  earningsItem: {
    width: '50%',
    paddingVertical: SPACING.xs,
  },
  earningsLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  earningsValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginTop: 2,
  },
  earningsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: SPACING.md,
    marginTop: SPACING.sm,
  },
  netPayLabel: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  netPayValue: {
    color: COLORS.green,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  adjustmentCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  adjustmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  adjustmentHeaderInfo: {
    flex: 1,
  },
  adjustmentInputs: {
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: SPACING.md,
  },
  adjustmentInputRow: {
    marginBottom: SPACING.md,
  },
  adjustmentInputLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: 4,
  },
  adjustmentInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  adjustmentNoteInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  adjustedTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: SPACING.md,
  },
  adjustedTotalLabel: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  adjustedTotalValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  confirmCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  confirmHeader: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  confirmTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  confirmDetails: {
    padding: SPACING.lg,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  confirmLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  confirmValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  confirmTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: `${COLORS.violet}15`,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  confirmTotalLabel: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  confirmTotalValue: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
  },
  confirmStaffList: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.lg,
  },
  confirmStaffTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  confirmStaffItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  confirmStaffInfo: {},
  confirmStaffName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
  },
  confirmStaffRole: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  confirmStaffAmount: {
    color: COLORS.green,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: `${COLORS.amber}15`,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: `${COLORS.amber}30`,
  },
  warningIcon: {
    fontSize: FONT_SIZES.xxl,
  },
  warningText: {
    flex: 1,
    color: COLORS.amber,
    fontSize: FONT_SIZES.md,
  },
  bottomPadding: {
    height: 100,
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  backStepButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
  },
  backStepButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
  },
  nextButtonGradient: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  nextButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
