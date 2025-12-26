import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { format, subMonths, addMonths, startOfMonth, endOfMonth, getDaysInMonth, getDate } from 'date-fns';
import { usePayrollStats, useStaffPayrollBreakdown, usePayrollActions } from '@stylemate/core';
import {
  COLORS,
  GRADIENTS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SIZES,
} from '../../constants/theme';

interface PayrollStats {
  totalPayroll: number;
  paidAmount: number;
  pendingAmount: number;
  totalStaff: number;
  baseSalaryTotal: number;
  commissionTotal: number;
  bonusTotal: number;
  deductionsTotal: number;
}

interface StaffPayrollItem {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  employmentType: 'full_time' | 'part_time' | 'contract';
  employeeId: string;
  baseSalary: number;
  commission: number;
  bonus: number;
  totalEarnings: number;
  deductions: {
    tds: number;
    pf: number;
    other: number;
    total: number;
  };
  netPayable: number;
  status: 'paid' | 'pending' | 'processing';
}

interface PaymentHistoryItem {
  id: string;
  month: string;
  year: number;
  processedAt: string;
  status: 'completed' | 'partial' | 'pending';
  totalAmount: number;
  staffCount: number;
}

interface PayrollAnalytics {
  annualPayroll: number;
  payrollToRevenue: number;
  avgPerStaff: number;
  avgDaysToPay: number;
  trendData: { month: string; amount: number }[];
}

interface DeductionBreakdown {
  tds: number;
  pfContributions: number;
  insurancePremium: number;
  otherDeductions: number;
  total: number;
}

interface CommissionRule {
  id: string;
  category: string;
  description: string;
  rate: number;
  icon: string;
  gradient: [string, string];
  totalServicesThisMonth: number;
  commissionEarned: number;
}

interface BonusIncentive {
  id: string;
  type: 'performance' | 'attendance' | 'referral' | 'target';
  title: string;
  description: string;
  totalAmount: number;
  recipients: { name: string; amount: number }[];
  progress?: { current: number; target: number };
}

const formatCurrency = (amountInPaisa: number): string => {
  const amount = amountInPaisa / 100;
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toLocaleString()}`;
};

const formatFullCurrency = (amountInPaisa: number): string => {
  return `₹${(amountInPaisa / 100).toLocaleString('en-IN')}`;
};

const EMPLOYMENT_TYPE_CONFIG = {
  full_time: { label: 'Full-time', color: COLORS.green, bgColor: `${COLORS.green}20` },
  part_time: { label: 'Part-time', color: COLORS.blue, bgColor: `${COLORS.blue}20` },
  contract: { label: 'Contract', color: COLORS.amber, bgColor: `${COLORS.amber}20` },
};

const STATUS_CONFIG = {
  paid: { label: 'Paid', color: COLORS.green, bgColor: `${COLORS.green}20` },
  pending: { label: 'Pending', color: COLORS.amber, bgColor: `${COLORS.amber}20` },
  processing: { label: 'Processing', color: COLORS.blue, bgColor: `${COLORS.blue}20` },
  completed: { label: 'Completed', color: COLORS.green, bgColor: `${COLORS.green}20` },
  partial: { label: 'Partial', color: COLORS.amber, bgColor: `${COLORS.amber}20` },
};

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  gradient: [string, string];
  change?: { value: number; isPositive: boolean };
  onPress?: () => void;
}

function StatCard({ label, value, icon, gradient, change, onPress }: StatCardProps) {
  const content = (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <LinearGradient colors={gradient} style={styles.statIconContainer}>
          <Text style={styles.statIcon}>{icon}</Text>
        </LinearGradient>
        {change && (
          <View style={[styles.changeBadge, { backgroundColor: change.isPositive ? `${COLORS.green}20` : `${COLORS.red}20` }]}>
            <Text style={[styles.changeText, { color: change.isPositive ? COLORS.green : COLORS.red }]}>
              {change.isPositive ? '↑' : '↓'} {Math.abs(change.value)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
  }
  return content;
}

function BreakdownCard({ label, value, percentage, color }: { label: string; value: string; percentage: string; color: string }) {
  return (
    <View style={styles.breakdownCard}>
      <View style={styles.breakdownHeader}>
        <View style={[styles.breakdownDot, { backgroundColor: color }]} />
        <Text style={styles.breakdownLabel}>{label}</Text>
      </View>
      <Text style={styles.breakdownValue}>{value}</Text>
      <Text style={styles.breakdownPercentage}>{percentage}</Text>
    </View>
  );
}

export default function PayrollOverview() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'monthly' | 'quarterly'>('monthly');
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'status'>('name');
  
  const { data: apiStats, loading: statsLoading, error: statsError, refetch: refetchStats } = usePayrollStats();
  const { data: apiStaffBreakdown, loading: staffLoading, refetch: refetchStaff } = useStaffPayrollBreakdown();
  const { payEntry, isSubmitting } = usePayrollActions();
  
  const loading = statsLoading || staffLoading;

  const stats = useMemo<PayrollStats>(() => {
    let baseSalaryTotal = 0;
    let commissionTotal = 0;
    let bonusTotal = 0;
    let deductionsTotal = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    
    if (apiStaffBreakdown && apiStaffBreakdown.length > 0) {
      apiStaffBreakdown.forEach((entry: any) => {
        const netPayable = entry.netPayablePaisa || 0;
        baseSalaryTotal += entry.baseSalaryPaisa || 0;
        commissionTotal += entry.commissionEarningsPaisa || 0;
        bonusTotal += entry.bonusesPaisa || 0;
        deductionsTotal += entry.totalDeductionsPaisa || 0;
        
        if (entry.paymentStatus === 'paid') {
          paidAmount += netPayable;
        } else {
          pendingAmount += netPayable;
        }
      });
    }
    
    const totalPayroll = paidAmount + pendingAmount;
    const totalStaff = apiStats?.totalStaff || apiStaffBreakdown?.length || 0;
    
    return {
      totalPayroll,
      paidAmount,
      pendingAmount,
      totalStaff,
      baseSalaryTotal,
      commissionTotal,
      bonusTotal,
      deductionsTotal,
    };
  }, [apiStats, apiStaffBreakdown]);

  const staffPayroll = useMemo<StaffPayrollItem[]>(() => {
    if (!apiStaffBreakdown || apiStaffBreakdown.length === 0) {
      return [];
    }
    return apiStaffBreakdown.map((entry: any) => {
      const baseSalary = entry.baseSalaryPaisa || 0;
      const commission = entry.commissionEarningsPaisa || 0;
      const bonus = entry.bonusesPaisa || 0;
      const totalDeductions = entry.totalDeductionsPaisa || 0;
      const netPayable = entry.netPayablePaisa || 0;
      const grossEarnings = entry.grossEarningsPaisa || 0;
      
      const tds = entry.tdsDeductionPaisa ?? entry.tdsPaisa ?? 0;
      const pf = entry.pfDeductionPaisa ?? entry.pfPaisa ?? 0;
      const esi = entry.esiDeductionPaisa ?? entry.esiPaisa ?? 0;
      const otherDeductions = entry.otherDeductionsPaisa ?? 0;
      const calculatedOther = totalDeductions > 0 ? Math.max(0, totalDeductions - tds - pf - esi) : otherDeductions;
      
      return {
        id: entry.entryId || entry.staffId,
        name: entry.staffName || 'Staff Member',
        role: entry.staffRole || entry.role || entry.designation || 'Staff',
        avatar: entry.avatarUrl || entry.avatar || null,
        employmentType: (entry.employmentType || entry.staffEmploymentType || 'full_time') as 'full_time' | 'part_time' | 'contract',
        employeeId: entry.employeeId || entry.staffEmployeeId || entry.staffId,
        baseSalary,
        commission,
        bonus,
        totalEarnings: grossEarnings,
        deductions: {
          tds: tds || Math.round(totalDeductions * 0.5),
          pf: pf || Math.round(totalDeductions * 0.35),
          other: calculatedOther || Math.round(totalDeductions * 0.15),
          total: totalDeductions,
        },
        netPayable,
        status: entry.paymentStatus === 'paid' ? 'paid' as const : 'pending' as const,
      };
    });
  }, [apiStaffBreakdown]);

  const [paymentHistory] = useState<PaymentHistoryItem[]>([]);

  const [analytics] = useState<PayrollAnalytics>({
    annualPayroll: 0,
    payrollToRevenue: 0,
    avgPerStaff: 0,
    avgDaysToPay: 0,
    trendData: [],
  });

  const [deductionBreakdown] = useState<DeductionBreakdown>({
    tds: 0,
    pfContributions: 0,
    insurancePremium: 0,
    otherDeductions: 0,
    total: 0,
  });

  const [commissionRules] = useState<CommissionRule[]>([
    {
      id: '1',
      category: 'Hair Services',
      description: 'Cut, style, color, treatment',
      rate: 15,
      icon: '✂️',
      gradient: GRADIENTS.primary as [string, string],
      totalServicesThisMonth: 0,
      commissionEarned: 0,
    },
    {
      id: '2',
      category: 'Makeup Services',
      description: 'Bridal, party, regular',
      rate: 20,
      icon: '💄',
      gradient: ['#EC4899', '#F43F5E'] as [string, string],
      totalServicesThisMonth: 0,
      commissionEarned: 0,
    },
  ]);

  const [bonusIncentives] = useState<BonusIncentive[]>([]);

  const [showFilterModal, setShowFilterModal] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchStaff()]);
    setRefreshing(false);
  };

  const navigateToPreviousMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1));
  };

  const navigateToNextMonth = () => {
    const nextMonth = addMonths(selectedMonth, 1);
    if (nextMonth <= new Date()) {
      setSelectedMonth(nextMonth);
    }
  };

  const currentDay = getDate(new Date());
  const daysInMonth = getDaysInMonth(selectedMonth);
  const progressPercentage = (currentDay / daysInMonth) * 100;

  const handlePayStaff = (staff: StaffPayrollItem) => {
    Alert.alert(
      'Process Payment',
      `Are you sure you want to pay ${formatFullCurrency(staff.netPayable)} to ${staff.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Now',
          onPress: async () => {
            const result = await payEntry(staff.id);
            if (result.success) {
              Alert.alert('Success', `Payment of ${formatFullCurrency(staff.netPayable)} processed for ${staff.name}`);
              handleRefresh();
            } else {
              Alert.alert('Error', result.error || 'Failed to process payment');
            }
          },
        },
      ]
    );
  };

  const handleRunPayroll = () => {
    router.push('/payroll/run-wizard');
  };

  const handleViewStaffDetails = (staffId: string) => {
    router.push(`/payroll/${staffId}`);
  };

  const sortedStaff = useMemo(() => {
    return [...staffPayroll].sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.netPayable - a.netPayable;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [staffPayroll, sortBy]);

  const breakdownPercentages = useMemo(() => {
    const total = stats.baseSalaryTotal + stats.commissionTotal + stats.bonusTotal;
    if (total === 0) {
      return { baseSalary: '0.0', commission: '0.0', bonus: '0.0' };
    }
    return {
      baseSalary: ((stats.baseSalaryTotal / total) * 100).toFixed(1),
      commission: ((stats.commissionTotal / total) * 100).toFixed(1),
      bonus: ((stats.bonusTotal / total) * 100).toFixed(1),
    };
  }, [stats]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading payroll data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (statsError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Failed to load payroll data</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Payroll Overview</Text>
          <Text style={styles.headerSubtitle}>{format(selectedMonth, 'MMMM yyyy')}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => Alert.alert(
              'Filter Payroll',
              'Select filter options',
              [
                { text: 'All Staff', onPress: () => {} },
                { text: 'Pending Only', onPress: () => {} },
                { text: 'Paid Only', onPress: () => {} },
                { text: 'Cancel', style: 'cancel' },
              ]
            )}
          >
            <Text style={styles.iconButtonText}>🔽</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => Alert.alert(
              'Options',
              'Select an action',
              [
                { text: 'Export Report', onPress: () => {} },
                { text: 'Print Payslips', onPress: () => {} },
                { text: 'Payroll Settings', onPress: () => router.push('/payroll/settings/payment-schedule') },
                { text: 'Cancel', style: 'cancel' },
              ]
            )}
          >
            <Text style={styles.iconButtonText}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.violet} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.periodSelector}>
          <View style={styles.periodHeader}>
            <View>
              <Text style={styles.periodLabel}>Current Pay Period</Text>
              <Text style={styles.periodValue}>
                {format(startOfMonth(selectedMonth), 'MMM d')} - {format(endOfMonth(selectedMonth), 'MMM d, yyyy')}
              </Text>
            </View>
            <View style={styles.monthNavigation}>
              <TouchableOpacity style={styles.navButton} onPress={navigateToPreviousMonth}>
                <Text style={styles.navButtonText}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.calendarButton}>
                <Text style={styles.calendarIcon}>📅</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.navButton, addMonths(selectedMonth, 1) > new Date() && styles.navButtonDisabled]} 
                onPress={navigateToNextMonth}
                disabled={addMonths(selectedMonth, 1) > new Date()}
              >
                <Text style={[styles.navButtonText, addMonths(selectedMonth, 1) > new Date() && styles.navButtonTextDisabled]}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progressPercentage}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{currentDay} of {daysInMonth} days</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.statsGrid}>
            <StatCard
              label="Total Payroll"
              value={formatCurrency(stats.totalPayroll)}
              icon="₹"
              gradient={GRADIENTS.primary}
              change={{ value: 8, isPositive: true }}
            />
            <StatCard
              label="Active Staff"
              value={stats.totalStaff.toString()}
              icon="👥"
              gradient={GRADIENTS.info}
              change={{ value: 2, isPositive: true }}
            />
            <StatCard
              label="Paid Amount"
              value={formatCurrency(stats.paidAmount)}
              icon="✓"
              gradient={GRADIENTS.success}
            />
            <StatCard
              label="Pending"
              value={formatCurrency(stats.pendingAmount)}
              icon="⏱"
              gradient={GRADIENTS.warning}
              change={{ value: 12, isPositive: false }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payroll Breakdown</Text>
            <View style={styles.viewModeToggle}>
              <TouchableOpacity
                style={[styles.viewModeButton, viewMode === 'monthly' && styles.viewModeButtonActive]}
                onPress={() => setViewMode('monthly')}
              >
                <Text style={[styles.viewModeText, viewMode === 'monthly' && styles.viewModeTextActive]}>Monthly</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewModeButton, viewMode === 'quarterly' && styles.viewModeButtonActive]}
                onPress={() => setViewMode('quarterly')}
              >
                <Text style={[styles.viewModeText, viewMode === 'quarterly' && styles.viewModeTextActive]}>Quarterly</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.breakdownGrid}>
            <BreakdownCard
              label="Base Salary"
              value={formatCurrency(stats.baseSalaryTotal)}
              percentage={`${breakdownPercentages.baseSalary}%`}
              color={COLORS.violet}
            />
            <BreakdownCard
              label="Commission"
              value={formatCurrency(stats.commissionTotal)}
              percentage={`${breakdownPercentages.commission}%`}
              color={COLORS.green}
            />
            <BreakdownCard
              label="Bonus"
              value={formatCurrency(stats.bonusTotal)}
              percentage={`${breakdownPercentages.bonus}%`}
              color={COLORS.amber}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Staff Payroll Details</Text>
            <TouchableOpacity style={styles.sortButton} onPress={() => {
              const options = ['name', 'amount', 'status'] as const;
              const currentIndex = options.indexOf(sortBy);
              setSortBy(options[(currentIndex + 1) % options.length]);
            }}>
              <Text style={styles.sortButtonText}>Sort ▼</Text>
            </TouchableOpacity>
          </View>

          {sortedStaff.map((staff) => {
            const empConfig = EMPLOYMENT_TYPE_CONFIG[staff.employmentType];
            const statusConfig = STATUS_CONFIG[staff.status];
            
            return (
              <View key={staff.id} style={styles.staffCard}>
                <View style={styles.staffHeader}>
                  <View style={styles.staffInfo}>
                    <View style={styles.staffAvatar}>
                      <Text style={styles.staffAvatarText}>{staff.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.staffDetails}>
                      <Text style={styles.staffName}>{staff.name}</Text>
                      <Text style={styles.staffRole}>{staff.role}</Text>
                      <View style={styles.staffMeta}>
                        <View style={[styles.badge, { backgroundColor: empConfig.bgColor }]}>
                          <Text style={[styles.badgeText, { color: empConfig.color }]}>{empConfig.label}</Text>
                        </View>
                        <Text style={styles.employeeId}>ID: {staff.employeeId}</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.chevronButton} onPress={() => handleViewStaffDetails(staff.id)}>
                    <Text style={styles.chevronText}>›</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.earningsGrid}>
                  <View style={styles.earningsItem}>
                    <Text style={styles.earningsLabel}>Base Salary</Text>
                    <Text style={styles.earningsValue}>{formatFullCurrency(staff.baseSalary)}</Text>
                  </View>
                  <View style={styles.earningsItem}>
                    <Text style={styles.earningsLabel}>Commission</Text>
                    <Text style={[styles.earningsValue, { color: COLORS.green }]}>{formatFullCurrency(staff.commission)}</Text>
                  </View>
                  <View style={styles.earningsItem}>
                    <Text style={styles.earningsLabel}>Bonus</Text>
                    <Text style={[styles.earningsValue, { color: COLORS.amber }]}>{formatFullCurrency(staff.bonus)}</Text>
                  </View>
                </View>

                <View style={styles.totalRow}>
                  <View>
                    <Text style={styles.totalLabel}>Total Earnings</Text>
                    <Text style={styles.totalValue}>{formatFullCurrency(staff.totalEarnings)}</Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.detailsButton} onPress={() => handleViewStaffDetails(staff.id)}>
                      <Text style={styles.detailsButtonText}>View Details</Text>
                    </TouchableOpacity>
                    {staff.status === 'pending' && (
                      <TouchableOpacity onPress={() => handlePayStaff(staff)}>
                        <LinearGradient colors={GRADIENTS.primary} style={styles.payButton}>
                          <Text style={styles.payButtonText}>💸 Pay</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                    {staff.status === 'paid' && (
                      <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                        <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>✓ {statusConfig.label}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.deductionsSection}>
                  <View style={styles.deductionsHeader}>
                    <Text style={styles.deductionsLabel}>Deductions</Text>
                    <Text style={styles.deductionsTotal}>-{formatFullCurrency(staff.deductions.total)}</Text>
                  </View>
                  <View style={styles.deductionsList}>
                    <View style={styles.deductionItem}>
                      <Text style={styles.deductionName}>Tax (TDS)</Text>
                      <Text style={styles.deductionValue}>{formatFullCurrency(staff.deductions.tds)}</Text>
                    </View>
                    <View style={styles.deductionItem}>
                      <Text style={styles.deductionName}>PF Contribution</Text>
                      <Text style={styles.deductionValue}>{formatFullCurrency(staff.deductions.pf)}</Text>
                    </View>
                    <View style={styles.deductionItem}>
                      <Text style={styles.deductionName}>Other</Text>
                      <Text style={styles.deductionValue}>{formatFullCurrency(staff.deductions.other)}</Text>
                    </View>
                  </View>
                  <View style={styles.netPayableRow}>
                    <Text style={styles.netPayableLabel}>Net Payable</Text>
                    <Text style={styles.netPayableValue}>{formatFullCurrency(staff.netPayable)}</Text>
                  </View>
                </View>
              </View>
            );
          })}

          <TouchableOpacity style={styles.loadMoreButton}>
            <Text style={styles.loadMoreText}>+ Load More Staff</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            <TouchableOpacity onPress={() => router.push('/payroll/history')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {paymentHistory.map((payment) => {
            const statusConfig = STATUS_CONFIG[payment.status];
            return (
              <TouchableOpacity key={payment.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <View style={[styles.historyIcon, { backgroundColor: statusConfig.bgColor }]}>
                    <Text style={styles.historyIconText}>✓</Text>
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyTitle}>{payment.month} {payment.year} Payroll</Text>
                    <Text style={styles.historyDate}>Processed on {payment.processedAt}</Text>
                    <View style={styles.historyMeta}>
                      <View style={[styles.badge, { backgroundColor: statusConfig.bgColor }]}>
                        <Text style={[styles.badgeText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                      </View>
                      <Text style={styles.historyStaffCount}>{payment.staffCount} staff members</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.chevronButton}>
                    <Text style={styles.chevronText}>›</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.historyFooter}>
                  <View>
                    <Text style={styles.historyAmountLabel}>Total Amount</Text>
                    <Text style={[styles.historyAmount, { color: COLORS.green }]}>{formatFullCurrency(payment.totalAmount)}</Text>
                  </View>
                  <TouchableOpacity style={styles.downloadButton}>
                    <Text style={styles.downloadButtonText}>📥 Download</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payroll Analytics</Text>
          
          <View style={styles.trendChartContainer}>
            <View style={styles.chartPlaceholder}>
              <View style={styles.chartBars}>
                {analytics.trendData.map((item, index) => {
                  const maxAmount = Math.max(...analytics.trendData.map(d => d.amount));
                  const height = (item.amount / maxAmount) * 100;
                  return (
                    <View key={index} style={styles.chartBarWrapper}>
                      <LinearGradient
                        colors={GRADIENTS.primary}
                        style={[styles.chartBar, { height: `${height}%` }]}
                      />
                      <Text style={styles.chartBarLabel}>{item.month}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.analyticsGrid}>
            <View style={styles.analyticsCard}>
              <View style={styles.analyticsCardHeader}>
                <Text style={styles.analyticsIcon}>📈</Text>
                <View style={[styles.changeBadge, { backgroundColor: `${COLORS.green}20` }]}>
                  <Text style={[styles.changeText, { color: COLORS.green }]}>↑ 15%</Text>
                </View>
              </View>
              <Text style={styles.analyticsValue}>{formatCurrency(analytics.annualPayroll)}</Text>
              <Text style={styles.analyticsLabel}>Annual Payroll</Text>
            </View>

            <View style={styles.analyticsCard}>
              <View style={styles.analyticsCardHeader}>
                <Text style={styles.analyticsIcon}>📊</Text>
                <View style={[styles.changeBadge, { backgroundColor: `${COLORS.amber}20` }]}>
                  <Text style={[styles.changeText, { color: COLORS.amber }]}>↑ 2%</Text>
                </View>
              </View>
              <Text style={styles.analyticsValue}>{analytics.payrollToRevenue}%</Text>
              <Text style={styles.analyticsLabel}>Payroll to Revenue</Text>
            </View>

            <View style={styles.analyticsCard}>
              <View style={styles.analyticsCardHeader}>
                <Text style={styles.analyticsIcon}>👤</Text>
                <View style={[styles.changeBadge, { backgroundColor: `${COLORS.green}20` }]}>
                  <Text style={[styles.changeText, { color: COLORS.green }]}>↑ 8%</Text>
                </View>
              </View>
              <Text style={styles.analyticsValue}>{formatCurrency(analytics.avgPerStaff)}</Text>
              <Text style={styles.analyticsLabel}>Avg per Staff</Text>
            </View>

            <View style={styles.analyticsCard}>
              <View style={styles.analyticsCardHeader}>
                <Text style={styles.analyticsIcon}>⏱️</Text>
                <View style={[styles.changeBadge, { backgroundColor: `${COLORS.green}20` }]}>
                  <Text style={[styles.changeText, { color: COLORS.green }]}>↓ 5%</Text>
                </View>
              </View>
              <Text style={styles.analyticsValue}>{analytics.avgDaysToPay}</Text>
              <Text style={styles.analyticsLabel}>Avg Days to Pay</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Deduction Breakdown</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>Details</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.deductionBreakdownCard}>
            <View style={styles.deductionBreakdownItem}>
              <View style={styles.deductionBreakdownLeft}>
                <View style={[styles.deductionBreakdownIcon, { backgroundColor: `${COLORS.red}20` }]}>
                  <Text style={styles.deductionBreakdownIconText}>📋</Text>
                </View>
                <View>
                  <Text style={styles.deductionBreakdownTitle}>Tax Deductions (TDS)</Text>
                  <Text style={styles.deductionBreakdownSubtitle}>All staff combined</Text>
                </View>
              </View>
              <Text style={[styles.deductionBreakdownAmount, { color: COLORS.red }]}>{formatFullCurrency(deductionBreakdown.tds)}</Text>
            </View>

            <View style={styles.deductionDivider} />

            <View style={styles.deductionBreakdownItem}>
              <View style={styles.deductionBreakdownLeft}>
                <View style={[styles.deductionBreakdownIcon, { backgroundColor: `${COLORS.blue}20` }]}>
                  <Text style={styles.deductionBreakdownIconText}>🏦</Text>
                </View>
                <View>
                  <Text style={styles.deductionBreakdownTitle}>PF Contributions</Text>
                  <Text style={styles.deductionBreakdownSubtitle}>Employee + Employer</Text>
                </View>
              </View>
              <Text style={[styles.deductionBreakdownAmount, { color: COLORS.blue }]}>{formatFullCurrency(deductionBreakdown.pfContributions)}</Text>
            </View>

            <View style={styles.deductionDivider} />

            <View style={styles.deductionBreakdownItem}>
              <View style={styles.deductionBreakdownLeft}>
                <View style={[styles.deductionBreakdownIcon, { backgroundColor: `${COLORS.amber}20` }]}>
                  <Text style={styles.deductionBreakdownIconText}>🛡️</Text>
                </View>
                <View>
                  <Text style={styles.deductionBreakdownTitle}>Insurance Premium</Text>
                  <Text style={styles.deductionBreakdownSubtitle}>Health insurance</Text>
                </View>
              </View>
              <Text style={[styles.deductionBreakdownAmount, { color: COLORS.amber }]}>{formatFullCurrency(deductionBreakdown.insurancePremium)}</Text>
            </View>

            <View style={styles.deductionDivider} />

            <View style={styles.deductionBreakdownItem}>
              <View style={styles.deductionBreakdownLeft}>
                <View style={[styles.deductionBreakdownIcon, { backgroundColor: `${COLORS.violet}20` }]}>
                  <Text style={styles.deductionBreakdownIconText}>⋯</Text>
                </View>
                <View>
                  <Text style={styles.deductionBreakdownTitle}>Other Deductions</Text>
                  <Text style={styles.deductionBreakdownSubtitle}>Advances, loans, etc.</Text>
                </View>
              </View>
              <Text style={[styles.deductionBreakdownAmount, { color: COLORS.violet }]}>{formatFullCurrency(deductionBreakdown.otherDeductions)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Commission Structure</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>Edit Rules</Text>
            </TouchableOpacity>
          </View>

          {commissionRules.map((rule) => (
            <View key={rule.id} style={styles.commissionCard}>
              <View style={styles.commissionHeader}>
                <View style={styles.commissionLeft}>
                  <LinearGradient colors={rule.gradient} style={styles.commissionIcon}>
                    <Text style={styles.commissionIconText}>{rule.icon}</Text>
                  </LinearGradient>
                  <View>
                    <Text style={styles.commissionCategory}>{rule.category}</Text>
                    <Text style={styles.commissionDescription}>{rule.description}</Text>
                  </View>
                </View>
                <Text style={styles.commissionRate}>{rule.rate}%</Text>
              </View>
              <View style={styles.commissionFooter}>
                <View style={styles.commissionStat}>
                  <Text style={styles.commissionStatLabel}>
                    {rule.id === '4' ? 'Total Sales This Month' : 'Total Services This Month'}
                  </Text>
                  <Text style={styles.commissionStatValue}>
                    {rule.id === '4' ? formatFullCurrency(rule.totalServicesThisMonth) : rule.totalServicesThisMonth.toString()}
                  </Text>
                </View>
                <View style={styles.commissionStat}>
                  <Text style={styles.commissionStatLabel}>Commission Earned</Text>
                  <Text style={[styles.commissionStatValue, { color: COLORS.green }]}>{formatFullCurrency(rule.commissionEarned)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bonus & Incentives</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>Manage</Text>
            </TouchableOpacity>
          </View>

          {bonusIncentives.map((bonus) => (
            <View key={bonus.id} style={styles.bonusCard}>
              <View style={styles.bonusHeader}>
                <View style={styles.bonusLeft}>
                  <View style={[styles.bonusIcon, { backgroundColor: bonus.type === 'performance' ? `${COLORS.amber}20` : `${COLORS.green}20` }]}>
                    <Text style={styles.bonusIconText}>{bonus.type === 'performance' ? '🏆' : '📅'}</Text>
                  </View>
                  <View>
                    <Text style={styles.bonusTitle}>{bonus.title}</Text>
                    <Text style={styles.bonusDescription}>{bonus.description}</Text>
                  </View>
                </View>
                <Text style={[styles.bonusAmount, { color: bonus.type === 'performance' ? COLORS.amber : COLORS.green }]}>
                  {formatFullCurrency(bonus.totalAmount)}
                </Text>
              </View>

              {bonus.progress && (
                <View style={styles.bonusProgressContainer}>
                  <View style={styles.bonusProgressBar}>
                    <LinearGradient
                      colors={GRADIENTS.success}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.bonusProgressFill, { width: `${(bonus.progress.current / bonus.progress.target) * 100}%` }]}
                    />
                  </View>
                  <Text style={styles.bonusProgressText}>{bonus.progress.current}/{bonus.progress.target} staff qualified</Text>
                </View>
              )}

              <View style={styles.bonusRecipients}>
                {bonus.recipients.map((recipient, index) => (
                  <View key={index} style={styles.bonusRecipientItem}>
                    <Text style={styles.bonusRecipientName}>{recipient.name}</Text>
                    <Text style={styles.bonusRecipientAmount}>{formatFullCurrency(recipient.amount)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payroll Settings</Text>
          <View style={styles.settingsGrid}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/payroll/settings/payment-schedule')}
            >
              <View style={[styles.settingIcon, { backgroundColor: `${COLORS.violet}20` }]}>
                <Text style={styles.settingIconText}>📅</Text>
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Payment Schedule</Text>
                <Text style={styles.settingSubtitle}>Monthly - 1st of every month</Text>
              </View>
              <Text style={styles.settingChevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/payroll/settings/tax-configuration')}
            >
              <View style={[styles.settingIcon, { backgroundColor: `${COLORS.amber}20` }]}>
                <Text style={styles.settingIconText}>📋</Text>
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Tax Configuration</Text>
                <Text style={styles.settingSubtitle}>TDS rates and slabs</Text>
              </View>
              <Text style={styles.settingChevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/payroll/settings/pf-settings')}
            >
              <View style={[styles.settingIcon, { backgroundColor: `${COLORS.blue}20` }]}>
                <Text style={styles.settingIconText}>🏦</Text>
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>PF Settings</Text>
                <Text style={styles.settingSubtitle}>Provident fund contribution</Text>
              </View>
              <Text style={styles.settingChevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/payroll/settings/bank-accounts')}
            >
              <View style={[styles.settingIcon, { backgroundColor: `${COLORS.green}20` }]}>
                <Text style={styles.settingIconText}>💳</Text>
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Bank Account Details</Text>
                <Text style={styles.settingSubtitle}>Payment transfer accounts</Text>
              </View>
              <Text style={styles.settingChevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/payroll/settings/salary-structure')}
            >
              <View style={[styles.settingIcon, { backgroundColor: `${COLORS.pink}20` }]}>
                <Text style={styles.settingIconText}>📊</Text>
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Salary Structure</Text>
                <Text style={styles.settingSubtitle}>Components and allowances</Text>
              </View>
              <Text style={styles.settingChevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <View style={styles.floatingActionBar}>
        <TouchableOpacity style={styles.exportButton}>
          <Text style={styles.exportButtonText}>📊 Export Report</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRunPayroll}>
          <LinearGradient colors={GRADIENTS.primary} style={styles.runPayrollButton}>
            <Text style={styles.runPayrollButtonText}>▶ Run Payroll</Text>
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
  errorText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  retryButton: {
    backgroundColor: COLORS.violet,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
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
  headerTitleContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  periodSelector: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.lg,
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  periodLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  periodValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginTop: 4,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: COLORS.textMuted,
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarIcon: {
    fontSize: FONT_SIZES.xxl,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  progressText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIcon: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
  },
  changeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  changeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: 4,
  },
  viewModeToggle: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  viewModeButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.cardBorder,
  },
  viewModeButtonActive: {
    backgroundColor: COLORS.violet,
  },
  viewModeText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  viewModeTextActive: {
    color: COLORS.white,
  },
  breakdownGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  breakdownCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  breakdownDot: {
    width: 12,
    height: 12,
    borderRadius: BORDER_RADIUS.full,
  },
  breakdownLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  breakdownValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  breakdownPercentage: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    marginTop: 4,
  },
  sortButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  sortButtonText: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.md,
  },
  staffCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  staffAvatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.violet,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  staffAvatarText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
  },
  staffDetails: {
    flex: 1,
  },
  staffName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  staffRole: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    marginTop: 2,
  },
  staffMeta: {
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
  chevronButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xl,
  },
  earningsGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: SPACING.md,
  },
  earningsItem: {
    flex: 1,
  },
  earningsLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: 4,
  },
  earningsValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: SPACING.md,
    marginTop: SPACING.md,
  },
  totalLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  totalValue: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  detailsButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
  },
  detailsButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  payButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  payButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  statusBadgeText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  deductionsSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: SPACING.md,
    marginTop: SPACING.md,
  },
  deductionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  deductionsLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  deductionsTotal: {
    color: COLORS.red,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  deductionsList: {
    gap: 4,
  },
  deductionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deductionName: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
  },
  deductionValue: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  netPayableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: SPACING.sm,
    marginTop: SPACING.sm,
  },
  netPayableLabel: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  netPayableValue: {
    color: COLORS.green,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  loadMoreButton: {
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
  },
  loadMoreText: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  viewAllText: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.md,
  },
  historyCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  historyIconText: {
    color: COLORS.green,
    fontSize: FONT_SIZES.xl,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  historyDate: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: 4,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  historyStaffCount: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: SPACING.md,
  },
  historyAmountLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  historyAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  downloadButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
  },
  downloadButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
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
  exportButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
  },
  exportButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  runPayrollButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  runPayrollButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  settingsGrid: {
    gap: SPACING.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingIconText: {
    fontSize: FONT_SIZES.xl,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  settingSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  settingChevron: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xxl,
  },
  trendChartContainer: {
    marginBottom: SPACING.lg,
  },
  chartPlaceholder: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    height: 200,
    justifyContent: 'flex-end',
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    paddingBottom: SPACING.md,
  },
  chartBarWrapper: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: 24,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  chartBarLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  analyticsCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  analyticsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  analyticsIcon: {
    fontSize: FONT_SIZES.xl,
  },
  analyticsValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
  },
  analyticsLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: 4,
  },
  deductionBreakdownCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  deductionBreakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deductionBreakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  deductionBreakdownIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deductionBreakdownIconText: {
    fontSize: FONT_SIZES.lg,
  },
  deductionBreakdownTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  deductionBreakdownSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  deductionBreakdownAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  deductionDivider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SPACING.md,
  },
  commissionCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  commissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  commissionLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  commissionIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commissionIconText: {
    fontSize: FONT_SIZES.lg,
  },
  commissionCategory: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  commissionDescription: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  commissionRate: {
    color: COLORS.green,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  commissionFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  commissionStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commissionStatLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  commissionStatValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  bonusCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  bonusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  bonusLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  bonusIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bonusIconText: {
    fontSize: FONT_SIZES.lg,
  },
  bonusTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  bonusDescription: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  bonusAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  bonusProgressContainer: {
    marginBottom: SPACING.md,
  },
  bonusProgressBar: {
    height: 8,
    backgroundColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  bonusProgressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  bonusProgressText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  bonusRecipients: {
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  bonusRecipientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bonusRecipientName: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  bonusRecipientAmount: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
});
