import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { usePayrollHistory } from '@stylemate/core';
import {
  COLORS,
  GRADIENTS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from '../../constants/theme';

interface PayrollCycle {
  id: string;
  month: string;
  year: number;
  periodStart: string;
  periodEnd: string;
  processedAt: string;
  status: 'completed' | 'partial' | 'pending' | 'processing';
  totalAmount: number;
  paidAmount: number;
  staffCount: number;
  paidStaffCount: number;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const formatCurrency = (amountInPaisa: number): string => {
  return `₹${(amountInPaisa / 100).toLocaleString('en-IN')}`;
};

const STATUS_CONFIG = {
  completed: { label: 'Completed', color: COLORS.green, bgColor: `${COLORS.green}20`, icon: '✓' },
  partial: { label: 'Partial', color: COLORS.amber, bgColor: `${COLORS.amber}20`, icon: '◐' },
  pending: { label: 'Pending', color: COLORS.textMuted, bgColor: `${COLORS.textMuted}20`, icon: '○' },
  processing: { label: 'Processing', color: COLORS.blue, bgColor: `${COLORS.blue}20`, icon: '⟳' },
};

export default function PayrollHistory() {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { data: apiCycles, loading, error, refetch } = usePayrollHistory(24);
  const [refreshing, setRefreshing] = useState(false);

  const allCycles: PayrollCycle[] = useMemo(() => {
    if (!apiCycles || apiCycles.length === 0) {
      return [];
    }
    return apiCycles.map((cycle: any) => {
      const monthName = MONTH_NAMES[cycle.periodMonth - 1] || 'Unknown';
      const periodStart = cycle.periodStartDate 
        ? new Date(cycle.periodStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : `${monthName.substring(0, 3)} 1`;
      const periodEnd = cycle.periodEndDate
        ? new Date(cycle.periodEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : `${monthName.substring(0, 3)} ${new Date(cycle.periodYear, cycle.periodMonth, 0).getDate()}`;
      const processedAt = cycle.processedAt 
        ? new Date(cycle.processedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';
      
      let status: 'completed' | 'partial' | 'pending' | 'processing' = 'pending';
      if (cycle.status === 'paid') status = 'completed';
      else if (cycle.status === 'approved' || cycle.status === 'processed') status = 'processing';
      else if (cycle.status === 'partial') status = 'partial';
      
      const totalAmount = cycle.totalNetPayablePaisa || 0;
      const paidAmount = cycle.status === 'paid' ? totalAmount : 0;
      
      return {
        id: cycle.id,
        month: monthName,
        year: cycle.periodYear,
        periodStart,
        periodEnd,
        processedAt,
        status,
        totalAmount,
        paidAmount,
        staffCount: cycle.totalStaffCount || 0,
        paidStaffCount: cycle.status === 'paid' ? (cycle.totalStaffCount || 0) : 0,
      };
    });
  }, [apiCycles]);

  const filteredCycles = useMemo(() => {
    return allCycles.filter(cycle => cycle.year === selectedYear);
  }, [allCycles, selectedYear]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDownload = (cycle: PayrollCycle) => {
    console.log('Download payroll report for', cycle.month, cycle.year);
  };

  const handleViewDetails = (cycle: PayrollCycle) => {
    router.push(`/payroll?month=${cycle.month}&year=${cycle.year}`);
  };

  const totalYearPayroll = useMemo(() => 
    filteredCycles.reduce((sum, c) => sum + c.paidAmount, 0), [filteredCycles]);
  const totalStaffPayments = useMemo(() => 
    filteredCycles.reduce((sum, c) => sum + c.paidStaffCount, 0), [filteredCycles]);

  const renderCycleItem = ({ item }: { item: PayrollCycle }) => {
    const statusConfig = STATUS_CONFIG[item.status];
    const progressPercentage = item.totalAmount > 0 ? (item.paidAmount / item.totalAmount) * 100 : 0;

    return (
      <TouchableOpacity style={styles.cycleCard} onPress={() => handleViewDetails(item)}>
        <View style={styles.cycleHeader}>
          <View style={[styles.statusIcon, { backgroundColor: statusConfig.bgColor }]}>
            <Text style={{ color: statusConfig.color, fontSize: FONT_SIZES.lg }}>{statusConfig.icon}</Text>
          </View>
          <View style={styles.cycleInfo}>
            <Text style={styles.cycleMonth}>{item.month} {item.year}</Text>
            <Text style={styles.cyclePeriod}>{item.periodStart} - {item.periodEnd}, {item.year}</Text>
            {item.processedAt && (
              <Text style={styles.cycleProcessed}>Processed: {item.processedAt}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.chevronButton}>
            <Text style={styles.chevronText}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cycleStats}>
          <View style={styles.cycleStat}>
            <Text style={styles.cycleStatLabel}>Total</Text>
            <Text style={styles.cycleStatValue}>{formatCurrency(item.totalAmount)}</Text>
          </View>
          <View style={styles.cycleStat}>
            <Text style={styles.cycleStatLabel}>Paid</Text>
            <Text style={[styles.cycleStatValue, { color: COLORS.green }]}>{formatCurrency(item.paidAmount)}</Text>
          </View>
          <View style={styles.cycleStat}>
            <Text style={styles.cycleStatLabel}>Staff</Text>
            <Text style={styles.cycleStatValue}>{item.paidStaffCount}/{item.staffCount}</Text>
          </View>
        </View>

        {item.status !== 'pending' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%`, backgroundColor: statusConfig.color }]} />
            </View>
            <Text style={styles.progressText}>{progressPercentage.toFixed(0)}%</Text>
          </View>
        )}

        <View style={styles.cycleActions}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
          {item.status === 'completed' && (
            <TouchableOpacity style={styles.downloadButton} onPress={() => handleDownload(item)}>
              <Text style={styles.downloadButtonText}>📥 Download</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading payment history...</Text>
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
        <Text style={styles.headerTitle}>Payment History</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <LinearGradient colors={GRADIENTS.primary} style={styles.summaryGradient}>
          <View style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Paid ({selectedYear})</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalYearPayroll)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Payments Made</Text>
              <Text style={styles.summaryValue}>{totalStaffPayments}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.yearSelector}>
        {[2024, 2023, 2022].map((year) => (
          <TouchableOpacity
            key={year}
            style={[styles.yearButton, selectedYear === year && styles.yearButtonActive]}
            onPress={() => setSelectedYear(year)}
          >
            <Text style={[styles.yearButtonText, selectedYear === year && styles.yearButtonTextActive]}>{year}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredCycles}
        renderItem={renderCycleItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.violet} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Payroll History</Text>
            <Text style={styles.emptySubtitle}>Payroll cycles will appear here once processed</Text>
          </View>
        }
      />
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
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: FONT_SIZES.xl,
  },
  summaryCard: {
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  summaryGradient: {
    padding: SPACING.lg,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    opacity: 0.8,
  },
  summaryValue: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  yearSelector: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  yearButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  yearButtonActive: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  yearButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  yearButtonTextActive: {
    color: COLORS.white,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  cycleCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  cycleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  cycleInfo: {
    flex: 1,
  },
  cycleMonth: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  cyclePeriod: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  cycleProcessed: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    marginTop: 4,
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
  cycleStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  cycleStat: {
    flex: 1,
  },
  cycleStatLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  cycleStatValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  progressBar: {
    flex: 1,
    height: 6,
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
    width: 40,
    textAlign: 'right',
  },
  cycleActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: SPACING.md,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  statusBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  downloadButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
  },
  downloadButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyIcon: {
    fontSize: FONT_SIZES.giant,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    marginTop: SPACING.xs,
  },
});
