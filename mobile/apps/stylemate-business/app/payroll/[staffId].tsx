import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { format, subMonths, addMonths } from 'date-fns';
import { payrollApi } from '@stylemate/core/services/businessApi';
import {
  COLORS,
  GRADIENTS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from '../../constants/theme';

interface StaffPayrollDetail {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  employmentType: 'full_time' | 'part_time' | 'contract';
  employeeId: string;
  joiningDate: string;
  department: string;
  compensationModel: string;
  earnings: {
    baseSalary: number;
    hra: number;
    travelAllowance: number;
    mealAllowance: number;
    otherAllowances: number;
    serviceCommission: number;
    productCommission: number;
    bonus: number;
    overtime: number;
    tips: number;
    upsellBonus: number;
  };
  deductions: {
    tds: number;
    pf: number;
    esi: number;
    professionalTax: number;
    loanRecovery: number;
    advances: number;
    other: number;
  };
  attendance: {
    workingDays: number;
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    overtimeHours: number;
  };
  performance: {
    servicesCompleted: number;
    averageTicket: number;
    clientRetention: number;
    productsSold: number;
    upsellRate: number;
    rating: number;
  };
  commissionBreakdown: Array<{
    serviceId: string;
    serviceName: string;
    count: number;
    amount: number;
  }>;
  dailyEarnings: Array<{
    date: string;
    services: number;
    tips: number;
    products: number;
    total: number;
  }>;
  paymentHistory: Array<{
    id: string;
    month: string;
    year: number;
    amount: number;
    status: 'paid' | 'pending' | 'processing';
    paidAt: string | null;
    transactionId: string | null;
  }>;
}

const formatCurrency = (amountInPaisa: number): string => {
  return `₹${(amountInPaisa / 100).toLocaleString('en-IN')}`;
};

const EMPLOYMENT_TYPE_CONFIG = {
  full_time: { label: 'Full-time', color: COLORS.green, bgColor: `${COLORS.green}20` },
  part_time: { label: 'Part-time', color: COLORS.blue, bgColor: `${COLORS.blue}20` },
  contract: { label: 'Contract', color: COLORS.amber, bgColor: `${COLORS.amber}20` },
};

const STATUS_CONFIG = {
  paid: { label: 'Paid', color: COLORS.green, bgColor: `${COLORS.green}20`, icon: '✓' },
  pending: { label: 'Pending', color: COLORS.amber, bgColor: `${COLORS.amber}20`, icon: '⏳' },
  processing: { label: 'Processing', color: COLORS.blue, bgColor: `${COLORS.blue}20`, icon: '⟳' },
};

export default function StaffPayoutDetails() {
  const router = useRouter();
  const { staffId } = useLocalSearchParams<{ staffId: string }>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'earnings' | 'performance' | 'daily'>('earnings');

  const [staffData, setStaffData] = useState<StaffPayrollDetail>({
    id: staffId || '1',
    name: '',
    role: '',
    avatar: null,
    employmentType: 'full_time',
    employeeId: '',
    joiningDate: '',
    department: '',
    compensationModel: 'salary_plus_commission',
    earnings: {
      baseSalary: 0,
      hra: 0,
      travelAllowance: 0,
      mealAllowance: 0,
      otherAllowances: 0,
      serviceCommission: 0,
      productCommission: 0,
      bonus: 0,
      overtime: 0,
      tips: 0,
      upsellBonus: 0,
    },
    deductions: {
      tds: 0,
      pf: 0,
      esi: 0,
      professionalTax: 0,
      loanRecovery: 0,
      advances: 0,
      other: 0,
    },
    attendance: {
      workingDays: 0,
      presentDays: 0,
      absentDays: 0,
      leaveDays: 0,
      overtimeHours: 0,
    },
    performance: {
      servicesCompleted: 0,
      averageTicket: 0,
      clientRetention: 0,
      productsSold: 0,
      upsellRate: 0,
      rating: 0,
    },
    commissionBreakdown: [],
    dailyEarnings: [],
    paymentHistory: [],
  });

  const loadStaffData = useCallback(async () => {
    if (!staffId) return;
    setLoading(true);
    setError(null);
    
    try {
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;
      
      const [detailsRes, commissionsRes, tipsRes] = await Promise.all([
        payrollApi.getStaffPayrollDetails(staffId, year, month),
        payrollApi.getStaffCommissions(staffId, month, year).catch(() => ({ success: false, data: null })),
        payrollApi.getStaffTips(staffId, month, year).catch(() => ({ success: false, data: null })),
      ]);
      
      if (detailsRes.success && detailsRes.data) {
        const { staff, currentEntry, history, attendance } = detailsRes.data;
        
        const serviceCommission = commissionsRes.success && commissionsRes.data?.total ? commissionsRes.data.total : 0;
        const tipsAmount = tipsRes.success && tipsRes.data?.total ? tipsRes.data.total : 0;
        const commissionBreakdown = commissionsRes.success && commissionsRes.data?.breakdown ? commissionsRes.data.breakdown : [];
        const servicesCount = commissionBreakdown.reduce((sum, item) => sum + item.count, 0);
        
        setStaffData(prev => ({
          ...prev,
          id: staff.id,
          name: staff.name,
          role: staff.role || 'Staff',
          avatar: staff.avatar,
          employmentType: (staff.employmentType as 'full_time' | 'part_time' | 'contract') || 'full_time',
          employeeId: staff.employeeId || `EMP${staff.id.slice(0, 6)}`,
          joiningDate: staff.joiningDate || new Date().toISOString(),
          department: staff.department || 'General',
          compensationModel: staff.compensationModel || 'salary_plus_commission',
          earnings: {
            baseSalary: currentEntry?.baseSalaryPaisa || staff.baseSalaryPaisa || 0,
            hra: currentEntry?.hraPaisa || 0,
            travelAllowance: currentEntry?.travelAllowancePaisa || 0,
            mealAllowance: currentEntry?.mealAllowancePaisa || 0,
            otherAllowances: currentEntry?.otherAllowancesPaisa || 0,
            serviceCommission,
            productCommission: currentEntry?.productCommissionPaisa || 0,
            bonus: currentEntry?.bonusPaisa || 0,
            overtime: currentEntry?.overtimePaisa || 0,
            tips: tipsAmount,
            upsellBonus: currentEntry?.upsellBonusPaisa || 0,
          },
          deductions: {
            tds: currentEntry?.tdsPaisa || 0,
            pf: currentEntry?.pfEmployeePaisa || 0,
            esi: currentEntry?.esiEmployeePaisa || 0,
            professionalTax: currentEntry?.professionalTaxPaisa || 0,
            loanRecovery: currentEntry?.loanRecoveryPaisa || 0,
            advances: currentEntry?.advanceDeductionPaisa || 0,
            other: currentEntry?.otherDeductionsPaisa || 0,
          },
          attendance: {
            workingDays: attendance?.workingDays || 26,
            presentDays: attendance?.presentDays || 0,
            absentDays: attendance?.absentDays || 0,
            leaveDays: attendance?.leaveDays || 0,
            overtimeHours: currentEntry?.overtimeHours || 0,
          },
          performance: {
            servicesCompleted: servicesCount,
            averageTicket: servicesCount > 0 ? Math.round(serviceCommission / servicesCount) : 0,
            clientRetention: currentEntry?.clientRetentionRate || 0,
            productsSold: currentEntry?.productsSold || 0,
            upsellRate: currentEntry?.upsellRate || 0,
            rating: staff.rating || 0,
          },
          commissionBreakdown,
          dailyEarnings: [],
          paymentHistory: history?.map(h => ({
            id: h.id,
            month: format(new Date(h.periodYear, h.periodMonth - 1), 'MMMM'),
            year: h.periodYear,
            amount: h.netPayablePaisa,
            status: h.status as 'paid' | 'pending' | 'processing',
            paidAt: h.paidAt ? format(new Date(h.paidAt), 'MMM d, yyyy') : null,
            transactionId: h.transactionId,
          })) || [],
        }));
      } else {
        setError(detailsRes.error || 'Failed to load staff details');
      }
    } catch (err) {
      console.error('Error loading staff data:', err);
      setError('Failed to load staff data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [staffId, selectedMonth]);

  useEffect(() => {
    loadStaffData();
  }, [loadStaffData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStaffData();
    setRefreshing(false);
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setSelectedMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const totalEarnings = Object.values(staffData.earnings).reduce((sum, val) => sum + val, 0);
  const totalDeductions = Object.values(staffData.deductions).reduce((sum, val) => sum + val, 0);
  const netPayable = totalEarnings - totalDeductions;

  const handleProcessPayment = () => {
    Alert.alert(
      'Process Payment',
      `Are you sure you want to process payment of ${formatCurrency(netPayable)} to ${staffData.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Now',
          onPress: async () => {
            setProcessing(true);
            await new Promise(resolve => setTimeout(resolve, 1500));
            setProcessing(false);
            Alert.alert('Success', 'Payment processed successfully!');
          },
        },
      ]
    );
  };

  const handleDownloadPayslip = () => {
    Alert.alert('Download', 'Payslip will be downloaded shortly');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading staff details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const empConfig = EMPLOYMENT_TYPE_CONFIG[staffData.employmentType];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payout Details</Text>
        <TouchableOpacity style={styles.iconButton} onPress={handleDownloadPayslip}>
          <Text style={styles.iconButtonText}>📥</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{staffData.name.charAt(0)}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{staffData.name}</Text>
              <Text style={styles.profileRole}>{staffData.role}</Text>
              <View style={styles.profileMeta}>
                <View style={[styles.badge, { backgroundColor: empConfig.bgColor }]}>
                  <Text style={[styles.badgeText, { color: empConfig.color }]}>{empConfig.label}</Text>
                </View>
                <Text style={styles.employeeId}>ID: {staffData.employeeId}</Text>
              </View>
            </View>
          </View>
          <View style={styles.profileDetails}>
            <View style={styles.profileDetailItem}>
              <Text style={styles.profileDetailLabel}>Department</Text>
              <Text style={styles.profileDetailValue}>{staffData.department}</Text>
            </View>
            <View style={styles.profileDetailItem}>
              <Text style={styles.profileDetailLabel}>Joining Date</Text>
              <Text style={styles.profileDetailValue}>{format(new Date(staffData.joiningDate), 'MMM d, yyyy')}</Text>
            </View>
            <View style={styles.profileDetailItem}>
              <Text style={styles.profileDetailLabel}>Pay Structure</Text>
              <Text style={styles.profileDetailValue}>Salary + Commission</Text>
            </View>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Pay Period: {format(selectedMonth, 'MMMM yyyy')}</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Earnings</Text>
              <Text style={[styles.summaryValue, { color: COLORS.violet }]}>{formatCurrency(totalEarnings)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Deductions</Text>
              <Text style={[styles.summaryValue, { color: COLORS.red }]}>-{formatCurrency(totalDeductions)}</Text>
            </View>
          </View>
          <View style={styles.netPayableContainer}>
            <Text style={styles.netPayableLabel}>Net Payable</Text>
            <Text style={styles.netPayableValue}>{formatCurrency(netPayable)}</Text>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'earnings' && styles.tabActive]}
            onPress={() => setActiveTab('earnings')}
          >
            <Text style={[styles.tabText, activeTab === 'earnings' && styles.tabTextActive]}>Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'performance' && styles.tabActive]}
            onPress={() => setActiveTab('performance')}
          >
            <Text style={[styles.tabText, activeTab === 'performance' && styles.tabTextActive]}>Performance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'daily' && styles.tabActive]}
            onPress={() => setActiveTab('daily')}
          >
            <Text style={[styles.tabText, activeTab === 'daily' && styles.tabTextActive]}>Commission</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'earnings' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💰 Earnings Breakdown</Text>
              <Text style={styles.sectionTotal}>{formatCurrency(totalEarnings)}</Text>
            </View>
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Base Salary</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(staffData.earnings.baseSalary)}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>HRA</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(staffData.earnings.hra)}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Travel Allowance</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(staffData.earnings.travelAllowance)}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Meal Allowance</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(staffData.earnings.mealAllowance)}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Other Allowances</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(staffData.earnings.otherAllowances)}</Text>
              </View>
              <View style={styles.breakdownDivider} />
              <View style={styles.breakdownItem}>
                <Text style={[styles.breakdownLabel, { color: COLORS.green }]}>Service Commission</Text>
                <Text style={[styles.breakdownValue, { color: COLORS.green }]}>{formatCurrency(staffData.earnings.serviceCommission)}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={[styles.breakdownLabel, { color: COLORS.cyan }]}>Product Commission</Text>
                <Text style={[styles.breakdownValue, { color: COLORS.cyan }]}>{formatCurrency(staffData.earnings.productCommission)}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={[styles.breakdownLabel, { color: COLORS.amber }]}>Tips</Text>
                <Text style={[styles.breakdownValue, { color: COLORS.amber }]}>{formatCurrency(staffData.earnings.tips)}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={[styles.breakdownLabel, { color: COLORS.pink }]}>Upsell Bonus</Text>
                <Text style={[styles.breakdownValue, { color: COLORS.pink }]}>{formatCurrency(staffData.earnings.upsellBonus)}</Text>
              </View>
              <View style={styles.breakdownDivider} />
              <View style={styles.breakdownItem}>
                <Text style={[styles.breakdownLabel, { color: COLORS.amber }]}>Performance Bonus</Text>
                <Text style={[styles.breakdownValue, { color: COLORS.amber }]}>{formatCurrency(staffData.earnings.bonus)}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Overtime</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(staffData.earnings.overtime)}</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'performance' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📊 Performance Metrics</Text>
            </View>
            <View style={styles.performanceGrid}>
              <View style={styles.performanceCard}>
                <LinearGradient colors={GRADIENTS.primary} style={styles.performanceIcon}>
                  <Text style={styles.performanceIconText}>✂️</Text>
                </LinearGradient>
                <Text style={styles.performanceValue}>{staffData.performance.servicesCompleted}</Text>
                <Text style={styles.performanceLabel}>Services</Text>
              </View>
              <View style={styles.performanceCard}>
                <LinearGradient colors={GRADIENTS.success} style={styles.performanceIcon}>
                  <Text style={styles.performanceIconText}>💰</Text>
                </LinearGradient>
                <Text style={styles.performanceValue}>{formatCurrency(staffData.performance.averageTicket)}</Text>
                <Text style={styles.performanceLabel}>Avg Ticket</Text>
              </View>
              <View style={styles.performanceCard}>
                <LinearGradient colors={GRADIENTS.info} style={styles.performanceIcon}>
                  <Text style={styles.performanceIconText}>🛍️</Text>
                </LinearGradient>
                <Text style={styles.performanceValue}>{staffData.performance.productsSold}</Text>
                <Text style={styles.performanceLabel}>Products Sold</Text>
              </View>
              <View style={styles.performanceCard}>
                <LinearGradient colors={GRADIENTS.warning} style={styles.performanceIcon}>
                  <Text style={styles.performanceIconText}>⭐</Text>
                </LinearGradient>
                <Text style={styles.performanceValue}>{staffData.performance.rating.toFixed(1)}</Text>
                <Text style={styles.performanceLabel}>Rating</Text>
              </View>
            </View>
            <View style={styles.metricsCard}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Client Retention Rate</Text>
                <Text style={styles.metricValue}>{staffData.performance.clientRetention}%</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Upsell Rate</Text>
                <Text style={styles.metricValue}>{staffData.performance.upsellRate}%</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'daily' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💵 Commission Breakdown</Text>
            </View>
            {staffData.commissionBreakdown.length > 0 ? (
              <View style={styles.breakdownCard}>
                {staffData.commissionBreakdown.map((item, index) => (
                  <View key={item.serviceId || index} style={styles.commissionItem}>
                    <View style={styles.commissionInfo}>
                      <Text style={styles.commissionService}>{item.serviceName}</Text>
                      <Text style={styles.commissionCount}>{item.count} services</Text>
                    </View>
                    <Text style={styles.commissionAmount}>{formatCurrency(item.amount)}</Text>
                  </View>
                ))}
                <View style={styles.breakdownDivider} />
                <View style={styles.commissionTotal}>
                  <Text style={styles.commissionTotalLabel}>Total Commission</Text>
                  <Text style={styles.commissionTotalValue}>
                    {formatCurrency(staffData.earnings.serviceCommission + staffData.earnings.productCommission)}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📊</Text>
                <Text style={styles.emptyText}>No commission data for this period</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📉 Deductions</Text>
            <Text style={[styles.sectionTotal, { color: COLORS.red }]}>-{formatCurrency(totalDeductions)}</Text>
          </View>
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>TDS (Tax)</Text>
              <Text style={[styles.breakdownValue, { color: COLORS.red }]}>{formatCurrency(staffData.deductions.tds)}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>PF Contribution</Text>
              <Text style={[styles.breakdownValue, { color: COLORS.red }]}>{formatCurrency(staffData.deductions.pf)}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>ESI</Text>
              <Text style={[styles.breakdownValue, { color: COLORS.red }]}>{formatCurrency(staffData.deductions.esi)}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Professional Tax</Text>
              <Text style={[styles.breakdownValue, { color: COLORS.red }]}>{formatCurrency(staffData.deductions.professionalTax)}</Text>
            </View>
            {staffData.deductions.advances > 0 && (
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Advance Recovery</Text>
                <Text style={[styles.breakdownValue, { color: COLORS.red }]}>{formatCurrency(staffData.deductions.advances)}</Text>
              </View>
            )}
            {staffData.deductions.other > 0 && (
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Other Deductions</Text>
                <Text style={[styles.breakdownValue, { color: COLORS.red }]}>{formatCurrency(staffData.deductions.other)}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Attendance Summary</Text>
          <View style={styles.attendanceCard}>
            <View style={styles.attendanceGrid}>
              <View style={styles.attendanceItem}>
                <Text style={styles.attendanceValue}>{staffData.attendance.workingDays}</Text>
                <Text style={styles.attendanceLabel}>Working Days</Text>
              </View>
              <View style={styles.attendanceItem}>
                <Text style={[styles.attendanceValue, { color: COLORS.green }]}>{staffData.attendance.presentDays}</Text>
                <Text style={styles.attendanceLabel}>Present</Text>
              </View>
              <View style={styles.attendanceItem}>
                <Text style={[styles.attendanceValue, { color: COLORS.blue }]}>{staffData.attendance.leaveDays}</Text>
                <Text style={styles.attendanceLabel}>Leave</Text>
              </View>
              <View style={styles.attendanceItem}>
                <Text style={[styles.attendanceValue, { color: COLORS.amber }]}>{staffData.attendance.overtimeHours}h</Text>
                <Text style={styles.attendanceLabel}>Overtime</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📜 Payment History</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {staffData.paymentHistory.map((payment) => {
            const statusConfig = STATUS_CONFIG[payment.status];
            return (
              <View key={payment.id} style={styles.historyItem}>
                <View style={[styles.historyIcon, { backgroundColor: statusConfig.bgColor }]}>
                  <Text style={{ color: statusConfig.color }}>{statusConfig.icon}</Text>
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyMonth}>{payment.month} {payment.year}</Text>
                  <Text style={styles.historyDate}>{payment.paidAt ? `Paid on ${payment.paidAt}` : 'Pending'}</Text>
                  {payment.transactionId && (
                    <Text style={styles.historyTxn}>Txn: {payment.transactionId}</Text>
                  )}
                </View>
                <View style={styles.historyAmountContainer}>
                  <Text style={[styles.historyAmount, { color: statusConfig.color }]}>{formatCurrency(payment.amount)}</Text>
                  <View style={[styles.historyStatus, { backgroundColor: statusConfig.bgColor }]}>
                    <Text style={[styles.historyStatusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.floatingActionBar}>
        <TouchableOpacity style={styles.downloadPayslipButton} onPress={handleDownloadPayslip}>
          <Text style={styles.downloadPayslipText}>📄 Download Payslip</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleProcessPayment} disabled={processing}>
          <LinearGradient colors={GRADIENTS.primary} style={styles.payNowButton}>
            {processing ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.payNowText}>💸 Pay {formatCurrency(netPayable)}</Text>
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
    marginLeft: SPACING.md,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonText: {
    fontSize: FONT_SIZES.xl,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.violet,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '600',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
  },
  profileRole: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    marginTop: 2,
  },
  profileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  employeeId: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
  },
  profileDetails: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: SPACING.md,
  },
  profileDetailItem: {
    flex: 1,
  },
  profileDetailLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: 4,
  },
  profileDetailValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.lg,
  },
  summaryGrid: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
  },
  netPayableContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: SPACING.md,
    marginTop: SPACING.md,
  },
  netPayableLabel: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  netPayableValue: {
    color: COLORS.green,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
  },
  section: {
    marginBottom: SPACING.lg,
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
  sectionTotal: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  breakdownCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
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
  breakdownDivider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SPACING.sm,
  },
  attendanceCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  attendanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  attendanceItem: {
    alignItems: 'center',
  },
  attendanceValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
  },
  attendanceLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: 4,
  },
  viewAllText: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.md,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.sm,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  historyInfo: {
    flex: 1,
  },
  historyMonth: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  historyDate: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  historyTxn: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  historyAmountContainer: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  historyStatus: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    marginTop: 4,
  },
  historyStatusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 100,
  },
  floatingActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  downloadPayslipButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
  },
  downloadPayslipText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  payNowButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    minWidth: 150,
  },
  payNowText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  tabActive: {
    backgroundColor: COLORS.violet,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  performanceCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  performanceIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  performanceIconText: {
    fontSize: FONT_SIZES.xl,
  },
  performanceValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  performanceLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  metricsCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  metricValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  commissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  commissionInfo: {
    flex: 1,
  },
  commissionService: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  commissionCount: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  commissionAmount: {
    color: COLORS.green,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  commissionTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  commissionTotalLabel: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  commissionTotalValue: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  emptyState: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyIcon: {
    fontSize: FONT_SIZES.hero,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: `${COLORS.red}10`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.red,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  retryText: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
