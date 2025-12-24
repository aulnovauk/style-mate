import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { format, subMonths } from 'date-fns';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import {
  useCommissionSummary,
  useCommissionHistory,
  useCommissionActions,
  CommissionEntry,
} from '@stylemate/core';

const { width } = Dimensions.get('window');

const formatCurrency = (amountInPaisa: number): string => {
  return `₹${(amountInPaisa / 100).toLocaleString()}`;
};

export default function CommissionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const staffId = params.staffId as string | undefined;
  
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'summary' | 'details'>('summary');
  
  const monthString = format(selectedMonth, 'yyyy-MM');
  
  const { 
    data: summaryData, 
    loading: loadingSummary,
    error: summaryError,
    refetch: refetchSummary,
  } = useCommissionSummary(staffId);
  
  const { 
    data: historyData, 
    loading: loadingHistory,
    error: historyError,
    refetch: refetchHistory,
  } = useCommissionHistory(staffId, monthString);
  
  const error = summaryError || historyError;
  const refetch = useCallback(() => {
    refetchSummary();
    refetchHistory();
  }, [refetchSummary, refetchHistory]);
  
  const { 
    processPayout, 
    exportReport,
    isProcessingPayout,
    isExporting 
  } = useCommissionActions();
  
  const isLoading = loadingSummary || loadingHistory;
  
  const profile = summaryData?.profile;
  const currentMonth = summaryData?.currentMonth;
  const breakdown = summaryData?.breakdown || [];
  const trend = summaryData?.trend || [];
  const monthlyEntries = historyData?.entries || [];

  const months = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'earned': return COLORS.green;
      case 'paid': return COLORS.blue;
      case 'pending': return COLORS.amber;
      default: return COLORS.textMuted;
    }
  };

  const handleProcessPayout = async () => {
    if (!staffId || !profile) return;
    
    Alert.alert(
      'Process Payout',
      `Are you sure you want to process payout of ${formatCurrency(profile.pendingPayoutInPaisa)} for ${profile.staffName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Process',
          onPress: async () => {
            const result = await processPayout({
              staffId,
              amountInPaisa: profile.pendingPayoutInPaisa,
              month: monthString,
            });
            
            if (result.success) {
              Alert.alert('Success', 'Payout processed successfully');
            } else {
              Alert.alert('Error', result.error || 'Failed to process payout');
            }
          },
        },
      ]
    );
  };

  const handleExportReport = async () => {
    if (!staffId) return;
    
    const result = await exportReport(staffId, monthString);
    if (result.success && result.url) {
      Alert.alert('Export Ready', 'Commission report has been generated');
    } else {
      Alert.alert('Error', result.error || 'Failed to export report');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading commission data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Failed to Load</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}>
          <LinearGradient colors={GRADIENTS.primary} style={styles.avatarGradient}>
            <Text style={styles.avatarText}>
              {profile?.staffName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
            </Text>
          </LinearGradient>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile?.staffName || 'Staff Member'}</Text>
          <Text style={styles.profileRole}>{profile?.staffRole || 'Staff'}</Text>
          <View style={styles.rateInfo}>
            <Text style={styles.rateText}>Commission Rate: </Text>
            <Text style={styles.rateValue}>{profile?.defaultCommissionRate || 0}%</Text>
          </View>
        </View>
      </View>

      <View style={styles.summaryCards}>
        <View style={styles.summaryCard}>
          <LinearGradient colors={GRADIENTS.success} style={styles.summaryGradient}>
            <Text style={styles.summaryLabel}>This Month</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(profile?.totalEarnedThisMonthInPaisa || 0)}
            </Text>
          </LinearGradient>
        </View>
        <View style={styles.summaryCard}>
          <LinearGradient colors={GRADIENTS.warning} style={styles.summaryGradient}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(profile?.pendingPayoutInPaisa || 0)}
            </Text>
          </LinearGradient>
        </View>
      </View>

      <View style={styles.allTimeCard}>
        <View style={styles.allTimeRow}>
          <Text style={styles.allTimeLabel}>All-Time Earnings</Text>
          <Text style={styles.allTimeValue}>
            {formatCurrency(profile?.totalEarnedAllTimeInPaisa || 0)}
          </Text>
        </View>
      </View>

      <View style={styles.monthSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthsContainer}>
          {months.map((month, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.monthBtn,
                format(month, 'yyyy-MM') === format(selectedMonth, 'yyyy-MM') && styles.monthBtnActive,
              ]}
              onPress={() => setSelectedMonth(month)}
            >
              <Text style={[
                styles.monthText,
                format(month, 'yyyy-MM') === format(selectedMonth, 'yyyy-MM') && styles.monthTextActive,
              ]}>
                {format(month, 'MMM yyyy')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.monthStats}>
        <View style={styles.monthStatItem}>
          <Text style={styles.monthStatValue}>{currentMonth?.count || 0}</Text>
          <Text style={styles.monthStatLabel}>Services</Text>
        </View>
        <View style={styles.monthStatDivider} />
        <View style={styles.monthStatItem}>
          <Text style={styles.monthStatValue}>
            {formatCurrency(currentMonth?.serviceRevenueInPaisa || 0)}
          </Text>
          <Text style={styles.monthStatLabel}>Revenue</Text>
        </View>
        <View style={styles.monthStatDivider} />
        <View style={styles.monthStatItem}>
          <Text style={[styles.monthStatValue, { color: COLORS.green }]}>
            {formatCurrency(currentMonth?.earnedInPaisa || 0)}
          </Text>
          <Text style={styles.monthStatLabel}>Commission</Text>
        </View>
      </View>

      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.viewBtn, viewMode === 'summary' && styles.viewBtnActive]}
          onPress={() => setViewMode('summary')}
        >
          <Text style={[styles.viewBtnText, viewMode === 'summary' && styles.viewBtnTextActive]}>Summary</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewBtn, viewMode === 'details' && styles.viewBtnActive]}
          onPress={() => setViewMode('details')}
        >
          <Text style={[styles.viewBtnText, viewMode === 'details' && styles.viewBtnTextActive]}>Details</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.entriesList} showsVerticalScrollIndicator={false}>
        {viewMode === 'summary' ? (
          <View style={styles.breakdownSection}>
            <Text style={styles.sectionTitle}>Commission Breakdown</Text>
            
            <View style={styles.breakdownCard}>
              {breakdown.length > 0 ? (
                breakdown.map((item, index) => (
                  <View key={index} style={styles.breakdownRow}>
                    <View style={styles.breakdownIcon}>
                      <Text style={styles.breakdownEmoji}>{item.icon}</Text>
                    </View>
                    <View style={styles.breakdownInfo}>
                      <Text style={styles.breakdownService}>{item.service}</Text>
                      <Text style={styles.breakdownCount}>{item.count} services</Text>
                    </View>
                    <Text style={styles.breakdownAmount}>
                      {formatCurrency(item.totalAmountInPaisa)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No breakdown data available</Text>
              )}
            </View>

            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartTitle}>Earnings Trend</Text>
              <View style={styles.barChart}>
                {trend.length > 0 ? (
                  trend.slice(-6).map((item, index) => {
                    const maxAmount = Math.max(...trend.map(t => t.amountInPaisa));
                    const height = maxAmount > 0 ? (item.amountInPaisa / maxAmount) * 100 : 20;
                    return (
                      <View key={index} style={styles.barContainer}>
                        <View style={[styles.bar, { height: Math.max(height, 20) }]}>
                          <LinearGradient 
                            colors={GRADIENTS.primary} 
                            style={[styles.barGradient, { height: Math.max(height, 20) }]}
                          />
                        </View>
                        <Text style={styles.barLabel}>{item.month.slice(5)}</Text>
                      </View>
                    );
                  })
                ) : (
                  months.slice().reverse().map((month, index) => (
                    <View key={index} style={styles.barContainer}>
                      <View style={[styles.bar, { height: 40 + Math.random() * 60 }]}>
                        <LinearGradient 
                          colors={GRADIENTS.primary} 
                          style={[styles.barGradient, { height: 40 + Math.random() * 60 }]}
                        />
                      </View>
                      <Text style={styles.barLabel}>{format(month, 'MMM')}</Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.detailsSection}>
            {monthlyEntries.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📊</Text>
                <Text style={styles.emptyText}>No commission entries for this month</Text>
              </View>
            ) : (
              monthlyEntries.map((entry: CommissionEntry) => (
                <TouchableOpacity key={entry.id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryDate}>{format(new Date(entry.date), 'MMM d')}</Text>
                    <View style={[styles.entryStatus, { backgroundColor: `${getStatusColor(entry.status)}20` }]}>
                      <Text style={[styles.entryStatusText, { color: getStatusColor(entry.status) }]}>
                        {entry.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.entryBody}>
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryClient}>{entry.clientName}</Text>
                      <Text style={styles.entryService}>{entry.service}</Text>
                    </View>
                    <View style={styles.entryAmounts}>
                      <Text style={styles.serviceAmount}>
                        {formatCurrency(entry.serviceAmountInPaisa)}
                      </Text>
                      <Text style={styles.commissionAmount}>
                        +{formatCurrency(entry.commissionAmountInPaisa)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.exportBtn}
          onPress={handleExportReport}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color={COLORS.textPrimary} />
          ) : (
            <Text style={styles.exportText}>📤 Export Report</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.payoutBtn}
          onPress={handleProcessPayout}
          disabled={isProcessingPayout || !profile?.pendingPayoutInPaisa}
        >
          <LinearGradient colors={GRADIENTS.success} style={styles.payoutGradient}>
            {isProcessingPayout ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.payoutText}>Process Payout</Text>
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
    gap: SPACING.lg,
  },
  loadingText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  errorMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  retryBtn: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    backgroundColor: COLORS.violet,
    borderRadius: BORDER_RADIUS.md,
  },
  retryText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  avatarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '600',
    color: COLORS.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  profileRole: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rateInfo: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
  },
  rateText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  rateValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.green,
  },
  summaryCards: {
    flexDirection: 'row',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  summaryCard: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  summaryGradient: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textOnGradient,
  },
  summaryValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: SPACING.xs,
  },
  allTimeCard: {
    marginHorizontal: SPACING.xl,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  allTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allTimeLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  allTimeValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.violet,
  },
  monthSelector: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  monthsContainer: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  monthBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
  },
  monthBtnActive: {
    backgroundColor: COLORS.violet,
  },
  monthText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  monthTextActive: {
    color: COLORS.white,
  },
  monthStats: {
    flexDirection: 'row',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  monthStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  monthStatDivider: {
    width: 1,
    backgroundColor: COLORS.cardBorder,
  },
  monthStatValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  monthStatLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.sm,
    padding: 2,
  },
  viewBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm - 2,
  },
  viewBtnActive: {
    backgroundColor: COLORS.violet,
  },
  viewBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  viewBtnTextActive: {
    color: COLORS.white,
  },
  entriesList: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  breakdownSection: {},
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  breakdownCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  breakdownIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  breakdownEmoji: {
    fontSize: FONT_SIZES.lg,
  },
  breakdownInfo: {
    flex: 1,
  },
  breakdownService: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  breakdownCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  breakdownAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.green,
  },
  noDataText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  chartPlaceholder: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
  },
  chartTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: 24,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  barGradient: {
    width: '100%',
  },
  barLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  detailsSection: {},
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
  entryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  entryDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  entryStatus: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  entryStatusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  entryBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryInfo: {},
  entryClient: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  entryService: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  entryAmounts: {
    alignItems: 'flex-end',
  },
  serviceAmount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  commissionAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.green,
  },
  footer: {
    flexDirection: 'row',
    padding: SPACING.xl,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  exportBtn: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  payoutBtn: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  payoutGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  payoutText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
});
