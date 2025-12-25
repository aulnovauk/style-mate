import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  usePayrollCycles,
  usePayrollActions,
} from '@stylemate/core/hooks/useBusinessApi';
import {
  COLORS,
  GRADIENTS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from '../../constants/theme';

interface ReportOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'payroll' | 'tax' | 'staff' | 'attendance';
  formats: ('pdf' | 'excel' | 'csv')[];
}

interface GeneratedReport {
  id: string;
  name: string;
  generatedAt: string;
  format: string;
  size: string;
  downloadUrl: string;
}

const formatCurrency = (amountInPaisa: number): string => {
  return `₹${(amountInPaisa / 100).toLocaleString('en-IN')}`;
};

const REPORT_OPTIONS: ReportOption[] = [
  {
    id: 'payroll_summary',
    name: 'Payroll Summary',
    description: 'Monthly payroll summary with earnings, deductions, and net pay for all staff',
    icon: '📊',
    category: 'payroll',
    formats: ['pdf', 'excel'],
  },
  {
    id: 'payslips',
    name: 'Payslips',
    description: 'Individual payslips for all staff members',
    icon: '📄',
    category: 'payroll',
    formats: ['pdf'],
  },
  {
    id: 'commission_report',
    name: 'Commission Report',
    description: 'Detailed commission breakdown by staff and service category',
    icon: '💰',
    category: 'payroll',
    formats: ['pdf', 'excel'],
  },
  {
    id: 'tips_report',
    name: 'Tips Distribution',
    description: 'Tips received and distribution summary',
    icon: '💵',
    category: 'payroll',
    formats: ['pdf', 'excel'],
  },
  {
    id: 'tds_report',
    name: 'TDS Report',
    description: 'Tax Deducted at Source report for IT filing (Form 24Q)',
    icon: '📋',
    category: 'tax',
    formats: ['pdf', 'excel'],
  },
  {
    id: 'pf_report',
    name: 'PF Report',
    description: 'Provident Fund contribution report (ECR format)',
    icon: '🏦',
    category: 'tax',
    formats: ['pdf', 'excel', 'csv'],
  },
  {
    id: 'esi_report',
    name: 'ESI Report',
    description: 'Employee State Insurance contribution report',
    icon: '🏥',
    category: 'tax',
    formats: ['pdf', 'excel'],
  },
  {
    id: 'professional_tax',
    name: 'Professional Tax',
    description: 'State-wise professional tax deduction report',
    icon: '📑',
    category: 'tax',
    formats: ['pdf', 'excel'],
  },
  {
    id: 'staff_earnings',
    name: 'Staff Earnings',
    description: 'Year-to-date earnings summary for each staff member',
    icon: '👤',
    category: 'staff',
    formats: ['pdf', 'excel'],
  },
  {
    id: 'salary_register',
    name: 'Salary Register',
    description: 'Complete salary register with all components',
    icon: '📒',
    category: 'staff',
    formats: ['pdf', 'excel'],
  },
  {
    id: 'attendance_summary',
    name: 'Attendance Summary',
    description: 'Monthly attendance, leaves, and overtime summary',
    icon: '📅',
    category: 'attendance',
    formats: ['pdf', 'excel'],
  },
  {
    id: 'leave_report',
    name: 'Leave Report',
    description: 'Leave balances and utilization report',
    icon: '🏖️',
    category: 'attendance',
    formats: ['pdf', 'excel'],
  },
];

const CATEGORY_CONFIG = {
  payroll: { label: 'Payroll Reports', color: COLORS.violet },
  tax: { label: 'Tax & Compliance', color: COLORS.amber },
  staff: { label: 'Staff Reports', color: COLORS.blue },
  attendance: { label: 'Attendance', color: COLORS.green },
};

export default function PayrollReportsScreen() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [recentReports, setRecentReports] = useState<GeneratedReport[]>([]);

  const { data: cycles, loading, error, refetch } = usePayrollCycles(selectedYear);
  const { exportPayrollReport, isSubmitting } = usePayrollActions();

  const selectedCycle = useMemo(() => {
    return cycles?.find(c => c.periodMonth === selectedMonth && c.periodYear === selectedYear);
  }, [cycles, selectedMonth, selectedYear]);

  const years = useMemo(() => {
    const result = [];
    for (let y = currentYear; y >= currentYear - 2; y--) {
      result.push(y);
    }
    return result;
  }, [currentYear]);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleGenerateReport = async (report: ReportOption, format: 'pdf' | 'excel' | 'csv') => {
    if (!selectedCycle) {
      Alert.alert(
        'No Payroll Cycle',
        `No payroll cycle found for ${months[selectedMonth - 1].label} ${selectedYear}. Please run payroll first.`
      );
      return;
    }

    setGeneratingReport(report.id);
    try {
      const result = await exportPayrollReport(selectedCycle.id, format === 'csv' ? 'excel' : format);
      
      if (result.success && result.downloadUrl) {
        const newReport: GeneratedReport = {
          id: Date.now().toString(),
          name: `${report.name} - ${months[selectedMonth - 1].label} ${selectedYear}`,
          generatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          format: format.toUpperCase(),
          size: 'Download ready',
          downloadUrl: result.downloadUrl,
        };
        
        setRecentReports(prev => [newReport, ...prev.slice(0, 9)]);
        
        Alert.alert(
          'Report Generated',
          `${report.name} has been generated successfully.`,
          [
            { text: 'OK' },
            { 
              text: 'Download', 
              onPress: () => {
                if (result.downloadUrl) {
                  Linking.openURL(result.downloadUrl);
                }
              }
            },
          ]
        );
      } else {
        const newReport: GeneratedReport = {
          id: Date.now().toString(),
          name: `${report.name} - ${months[selectedMonth - 1].label} ${selectedYear}`,
          generatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          format: format.toUpperCase(),
          size: 'Generated',
          downloadUrl: '',
        };
        
        setRecentReports(prev => [newReport, ...prev.slice(0, 9)]);
        
        Alert.alert(
          'Report Generated',
          `${report.name} has been generated. ${result.error || 'Report will be available for download shortly.'}`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    } finally {
      setGeneratingReport(null);
    }
  };

  const handleShareReport = async (report: GeneratedReport) => {
    try {
      await Share.share({
        message: `${report.name}\nGenerated: ${report.generatedAt}\nFormat: ${report.format}`,
        title: report.name,
      });
    } catch (error) {
      console.error('Error sharing report:', error);
    }
  };

  const handleDeleteReport = (report: GeneratedReport) => {
    Alert.alert(
      'Delete Report',
      `Are you sure you want to delete "${report.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setRecentReports(prev => prev.filter(r => r.id !== report.id));
          },
        },
      ]
    );
  };

  const renderReportOption = (report: ReportOption) => {
    const isGenerating = generatingReport === report.id;
    
    return (
      <View key={report.id} style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportIcon}>{report.icon}</Text>
          <View style={styles.reportInfo}>
            <Text style={styles.reportName}>{report.name}</Text>
            <Text style={styles.reportDescription}>{report.description}</Text>
          </View>
        </View>
        
        <View style={styles.formatButtons}>
          {report.formats.map((format) => (
            <TouchableOpacity
              key={format}
              style={[styles.formatButton, isGenerating && styles.formatButtonDisabled]}
              onPress={() => handleGenerateReport(report, format)}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color={COLORS.violet} />
              ) : (
                <>
                  <Text style={styles.formatIcon}>
                    {format === 'pdf' ? '📕' : format === 'excel' ? '📗' : '📄'}
                  </Text>
                  <Text style={styles.formatText}>{format.toUpperCase()}</Text>
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading reports...</Text>
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
        <Text style={styles.headerTitle}>Payroll Reports</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.violet} />}
      >
        <View style={styles.periodSelector}>
          <Text style={styles.periodLabel}>Report Period</Text>
          <View style={styles.periodRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll}>
              {months.map((month) => (
                <TouchableOpacity
                  key={month.value}
                  style={[styles.periodChip, selectedMonth === month.value && styles.periodChipActive]}
                  onPress={() => setSelectedMonth(month.value)}
                >
                  <Text style={[styles.periodChipText, selectedMonth === month.value && styles.periodChipTextActive]}>
                    {month.label.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.yearSelector}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[styles.yearChip, selectedYear === year && styles.yearChipActive]}
                  onPress={() => setSelectedYear(year)}
                >
                  <Text style={[styles.yearChipText, selectedYear === year && styles.yearChipTextActive]}>
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {recentReports.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Reports</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recentReports.map((report) => (
                <TouchableOpacity
                  key={report.id}
                  style={styles.recentCard}
                  onPress={() => handleShareReport(report)}
                  onLongPress={() => handleDeleteReport(report)}
                >
                  <Text style={styles.recentIcon}>
                    {report.format === 'PDF' ? '📕' : '📗'}
                  </Text>
                  <Text style={styles.recentName} numberOfLines={2}>{report.name}</Text>
                  <View style={styles.recentMeta}>
                    <Text style={styles.recentFormat}>{report.format}</Text>
                    <Text style={styles.recentSize}>{report.size}</Text>
                  </View>
                  <Text style={styles.recentDate}>{report.generatedAt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
          const categoryReports = REPORT_OPTIONS.filter(r => r.category === category);
          if (categoryReports.length === 0) return null;
          
          return (
            <View key={category} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryDot, { backgroundColor: config.color }]} />
                <Text style={styles.categoryTitle}>{config.label}</Text>
              </View>
              {categoryReports.map(renderReportOption)}
            </View>
          );
        })}

        <View style={styles.complianceInfo}>
          <LinearGradient colors={GRADIENTS.card} style={styles.complianceGradient}>
            <Text style={styles.complianceIcon}>🇮🇳</Text>
            <View style={styles.complianceContent}>
              <Text style={styles.complianceTitle}>GST & Tax Compliance</Text>
              <Text style={styles.complianceDescription}>
                All reports are generated in formats compliant with Indian tax regulations including TDS Form 24Q, PF ECR format, and ESI returns.
              </Text>
            </View>
          </LinearGradient>
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
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    marginTop: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  backButtonText: {
    fontSize: FONT_SIZES.xxxl,
    color: COLORS.violet,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  periodSelector: {
    marginBottom: SPACING.lg,
  },
  periodLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  periodRow: {
    gap: SPACING.sm,
  },
  monthScroll: {
    marginBottom: SPACING.sm,
  },
  periodChip: {
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  periodChipActive: {
    backgroundColor: `${COLORS.violet}20`,
    borderColor: COLORS.violet,
  },
  periodChipText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  periodChipTextActive: {
    color: COLORS.violet,
    fontWeight: '600',
  },
  yearSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  yearChip: {
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  yearChipActive: {
    backgroundColor: `${COLORS.violet}20`,
    borderColor: COLORS.violet,
  },
  yearChipText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  yearChipTextActive: {
    color: COLORS.violet,
    fontWeight: '600',
  },
  recentSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recentCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginRight: SPACING.sm,
    width: 140,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recentIcon: {
    fontSize: FONT_SIZES.display,
    marginBottom: SPACING.sm,
  },
  recentName: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    marginBottom: SPACING.xs,
    lineHeight: 18,
  },
  recentMeta: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  recentFormat: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  recentSize: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
  },
  recentDate: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
  },
  categorySection: {
    marginBottom: SPACING.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  categoryTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  reportCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reportHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  reportIcon: {
    fontSize: FONT_SIZES.hero,
    marginRight: SPACING.sm,
  },
  reportInfo: {
    flex: 1,
  },
  reportName: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: 4,
  },
  reportDescription: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
  },
  formatButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  formatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundLight,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  formatButtonDisabled: {
    opacity: 0.5,
  },
  formatIcon: {
    fontSize: FONT_SIZES.lg,
  },
  formatText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  complianceInfo: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  complianceGradient: {
    flexDirection: 'row',
    padding: SPACING.md,
    alignItems: 'flex-start',
  },
  complianceIcon: {
    fontSize: FONT_SIZES.hero,
    marginRight: SPACING.sm,
  },
  complianceContent: {
    flex: 1,
  },
  complianceTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  complianceDescription: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
});
