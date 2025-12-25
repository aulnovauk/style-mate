import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  COLORS,
  GRADIENTS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SIZES,
} from '../../constants/theme';
import { 
  useMembershipsManagement, 
  useMembershipPlanActions,
  useMembershipAnalytics,
} from '@stylemate/core/hooks/useBusinessApi';
import type { MembershipPlan, MembershipPlanType } from '@stylemate/core/services/businessApi';

type StatusFilter = 'all' | 'active' | 'inactive';
type TabType = 'plans' | 'members' | 'analytics';

const PLAN_TYPE_CONFIG: Record<MembershipPlanType, { icon: string; label: string; color: string; bgColor: string }> = {
  discount: { icon: '🏷️', label: 'Discount', color: COLORS.blue, bgColor: `${COLORS.blue}20` },
  credit: { icon: '💰', label: 'Credit', color: COLORS.purple, bgColor: `${COLORS.purple}20` },
  packaged: { icon: '📦', label: 'Session', color: COLORS.green, bgColor: `${COLORS.green}20` },
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

interface PlanCardProps {
  plan: MembershipPlan;
  onPress: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
  isTogglingId?: string | null;
}

function PlanCard({ plan, onPress, onToggle, onDuplicate, isTogglingId }: PlanCardProps) {
  const isToggling = isTogglingId === plan.id;
  const isActive = plan.isActive === 1;
  const typeConfig = PLAN_TYPE_CONFIG[plan.planType] || PLAN_TYPE_CONFIG.discount;

  const priceFormatted = (plan.priceInPaisa / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const monthlyPriceFormatted = plan.monthlyPriceInPaisa 
    ? (plan.monthlyPriceInPaisa / 100).toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      })
    : null;

  const getBillingLabel = () => {
    if (plan.billingType === 'recurring') {
      return `${monthlyPriceFormatted || priceFormatted}/mo`;
    }
    return 'One-time';
  };

  const getPlanBenefit = () => {
    switch (plan.planType) {
      case 'discount':
        return plan.discountPercentage ? `${plan.discountPercentage}% off all services` : 'Discount on services';
      case 'credit':
        return plan.creditAmountInPaisa 
          ? `₹${(plan.creditAmountInPaisa / 100).toLocaleString('en-IN')} credits`
          : 'Wallet credits';
      case 'packaged':
        return plan.includedServices?.length 
          ? `${plan.includedServices.length} services included`
          : 'Session package';
      default:
        return '';
    }
  };

  return (
    <TouchableOpacity style={styles.planCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.planHeader}>
        <View style={styles.planTitleRow}>
          <Text style={styles.planName} numberOfLines={1}>
            {plan.name}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: typeConfig.bgColor }]}>
            <Text style={styles.typeBadgeIcon}>{typeConfig.icon}</Text>
            <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
          </View>
        </View>
        {plan.description && (
          <Text style={styles.planDescription} numberOfLines={1}>{plan.description}</Text>
        )}
      </View>

      <View style={styles.planBenefitRow}>
        <Text style={styles.planBenefit}>{getPlanBenefit()}</Text>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{plan.durationMonths} mo</Text>
        </View>
      </View>

      <View style={styles.planPricingRow}>
        <View style={styles.priceColumn}>
          <Text style={styles.planPrice}>{priceFormatted}</Text>
          <Text style={styles.billingType}>{getBillingLabel()}</Text>
        </View>
        {plan.priorityBooking === 1 && (
          <View style={styles.perkBadge}>
            <Text style={styles.perkText}>⚡ Priority</Text>
          </View>
        )}
      </View>

      <View style={styles.planStatsRow}>
        <View style={styles.planStatItem}>
          <Text style={styles.planStatValue}>{plan.memberCount || 0}</Text>
          <Text style={styles.planStatLabel}>Members</Text>
        </View>
        <View style={styles.planStatDivider} />
        <View style={styles.planStatItem}>
          <Text style={styles.planStatValue}>
            {((plan.totalRevenue || 0) / 100).toLocaleString('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 0,
              notation: 'compact',
            })}
          </Text>
          <Text style={styles.planStatLabel}>Revenue</Text>
        </View>
        {plan.isOnlineSalesEnabled && (
          <>
            <View style={styles.planStatDivider} />
            <View style={styles.planStatItem}>
              <Text style={styles.onlineBadge}>🌐</Text>
              <Text style={styles.planStatLabel}>Online</Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.planActions}>
        <TouchableOpacity
          style={styles.duplicateButton}
          onPress={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.duplicateButtonText}>📋</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.statusToggle,
            isActive ? styles.statusActive : styles.statusInactive,
            isToggling && styles.statusToggleDisabled,
          ]}
          onPress={(e) => {
            e.stopPropagation();
            if (!isToggling) onToggle();
          }}
          activeOpacity={isToggling ? 1 : 0.7}
          disabled={isToggling}
        >
          {isToggling ? (
            <ActivityIndicator size="small" color={COLORS.violet} />
          ) : (
            <>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isActive ? COLORS.green : COLORS.textMuted },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: isActive ? COLORS.green : COLORS.textMuted },
                ]}
              >
                {isActive ? 'Active' : 'Inactive'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function AnalyticsTab() {
  const { data, loading, error, refetch } = useMembershipAnalytics();

  if (loading) {
    return (
      <View style={styles.analyticsLoading}>
        <ActivityIndicator size="large" color={COLORS.violet} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.analyticsError}>
        <Text style={styles.errorIcon}>📊</Text>
        <Text style={styles.analyticsErrorText}>Unable to load analytics</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.analyticsContainer}>
      <View style={styles.analyticsGrid}>
        <View style={[styles.analyticsCard, styles.analyticsCardWide]}>
          <Text style={styles.analyticsCardValue}>
            ₹{(data.recurringRevenue / 100 / 1000).toFixed(1)}K
          </Text>
          <Text style={styles.analyticsCardLabel}>Monthly Recurring Revenue</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsCardValue}>{data.activeMembers}</Text>
          <Text style={styles.analyticsCardLabel}>Active Members</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsCardValue}>{data.newMembersThisMonth}</Text>
          <Text style={styles.analyticsCardLabel}>New This Month</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Text style={[styles.analyticsCardValue, { color: data.churnRate > 5 ? COLORS.red : COLORS.green }]}>
            {data.churnRate.toFixed(1)}%
          </Text>
          <Text style={styles.analyticsCardLabel}>Churn Rate</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Text style={[styles.analyticsCardValue, { color: COLORS.green }]}>
            {data.retentionRate.toFixed(1)}%
          </Text>
          <Text style={styles.analyticsCardLabel}>Retention Rate</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsCardValue}>{data.avgMemberLifetime.toFixed(1)}</Text>
          <Text style={styles.analyticsCardLabel}>Avg. Lifetime (mo)</Text>
        </View>
      </View>

      {data.revenueByPlan.length > 0 && (
        <View style={styles.revenueByPlanSection}>
          <Text style={styles.sectionTitle}>Revenue by Plan</Text>
          {data.revenueByPlan.map((item, index) => (
            <View key={item.planId} style={styles.revenueByPlanItem}>
              <Text style={styles.revenueByPlanName}>{item.planName}</Text>
              <Text style={styles.revenueByPlanValue}>
                ₹{(item.revenue / 100).toLocaleString('en-IN')}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function MembershipsListScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('plans');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useMembershipsManagement(statusFilter, searchQuery);
  const { togglePlanStatus, duplicatePlan } = useMembershipPlanActions();

  const plans = data?.plans || [];
  const stats = data?.stats;

  const handleToggleStatus = useCallback(async (plan: MembershipPlan) => {
    const newStatus = plan.isActive === 1 ? false : true;
    setTogglingId(plan.id);
    try {
      const result = await togglePlanStatus(plan.id, newStatus);
      if (result.success) {
        await refetch();
      } else {
        Alert.alert('Error', result.error || 'Failed to update status');
      }
    } finally {
      setTogglingId(null);
    }
  }, [togglePlanStatus, refetch]);

  const handleDuplicate = useCallback(async (plan: MembershipPlan) => {
    Alert.alert(
      'Duplicate Plan',
      `Create a copy of "${plan.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Duplicate',
          onPress: async () => {
            const result = await duplicatePlan(plan.id);
            if (result.success) {
              Alert.alert('Success', 'Plan duplicated successfully');
              await refetch();
            } else {
              Alert.alert('Error', result.error || 'Failed to duplicate plan');
            }
          },
        },
      ]
    );
  }, [duplicatePlan, refetch]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🎫</Text>
      <Text style={styles.emptyTitle}>No membership plans found</Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? 'Try adjusting your search'
          : 'Create your first membership plan to build recurring revenue'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => router.push('/memberships/add-edit')}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.emptyButtonGradient}
          >
            <Text style={styles.emptyButtonText}>Create Plan</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPlansTab = () => (
    <>
      {stats && (
        <View style={styles.statsRow}>
          <StatCard label="Plans" value={stats.totalPlans} icon="📋" color={COLORS.violet} />
          <StatCard label="Members" value={stats.totalMembers} icon="👥" color={COLORS.blue} />
          <StatCard label="MRR" value={`₹${(stats.recurringRevenue / 100 / 1000).toFixed(1)}K`} icon="💰" color={COLORS.green} />
        </View>
      )}

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search plans..."
            placeholderTextColor={COLORS.textMuted}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'active', 'inactive'] as StatusFilter[]).map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
            onPress={() => setStatusFilter(status)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === status && styles.filterChipTextActive,
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PlanCard
            plan={item}
            onPress={() => router.push(`/memberships/add-edit?id=${item.id}`)}
            onToggle={() => handleToggleStatus(item)}
            onDuplicate={() => handleDuplicate(item)}
            isTogglingId={togglingId}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            tintColor={COLORS.violet}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </>
  );

  if (loading && !data && activeTab === 'plans') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading memberships...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data && activeTab === 'plans') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Failed to load memberships</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Memberships</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/memberships/add-edit')}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButtonGradient}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        {(['plans', 'members', 'analytics'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => {
              if (tab === 'members') {
                router.push('/memberships/members');
              } else {
                setActiveTab(tab);
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'plans' ? '📋 Plans' : tab === 'members' ? '👥 Members' : '📊 Analytics'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'plans' && renderPlansTab()}
      {activeTab === 'analytics' && <AnalyticsTab />}
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
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  errorIcon: {
    fontSize: SIZES.iconXLarge,
    marginBottom: SPACING.md,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  retryButton: {
    backgroundColor: COLORS.violet,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    padding: SPACING.sm,
  },
  backIcon: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  addButton: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  addButtonGradient: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  addButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tabActive: {
    backgroundColor: `${COLORS.violet}20`,
    borderColor: COLORS.violet,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.violet,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statIcon: {
    fontSize: FONT_SIZES.lg,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  searchIcon: {
    fontSize: FONT_SIZES.lg,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    height: SIZES.inputHeight,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  clearIcon: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    padding: SPACING.sm,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  filterChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  filterChipActive: {
    backgroundColor: `${COLORS.violet}20`,
    borderColor: COLORS.violet,
  },
  filterChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.violet,
    fontWeight: '600',
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SIZES.listPaddingBottom,
  },
  planCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  planHeader: {
    marginBottom: SPACING.md,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  planName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  typeBadgeIcon: {
    fontSize: FONT_SIZES.sm,
  },
  typeBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  planDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  planBenefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  planBenefit: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  durationBadge: {
    backgroundColor: `${COLORS.amber}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  durationText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.amber,
    fontWeight: '500',
  },
  planPricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  priceColumn: {
    gap: SPACING.xs,
  },
  planPrice: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  billingType: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  perkBadge: {
    backgroundColor: `${COLORS.amber}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  perkText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.amber,
    fontWeight: '500',
  },
  planStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  planStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  planStatValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  planStatLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  planStatDivider: {
    width: 1,
    height: SPACING.xxl,
    backgroundColor: COLORS.cardBorder,
  },
  onlineBadge: {
    fontSize: FONT_SIZES.lg,
  },
  planActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  duplicateButton: {
    padding: SPACING.sm,
    backgroundColor: `${COLORS.violet}15`,
    borderRadius: BORDER_RADIUS.sm,
  },
  duplicateButtonText: {
    fontSize: FONT_SIZES.lg,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  statusActive: {
    backgroundColor: `${COLORS.green}15`,
  },
  statusInactive: {
    backgroundColor: `${COLORS.textMuted}15`,
  },
  statusToggleDisabled: {
    opacity: 0.6,
  },
  statusDot: {
    width: SPACING.sm,
    height: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyIcon: {
    fontSize: SIZES.emojiLarge,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
  },
  emptyButton: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  emptyButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  analyticsLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  analyticsError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  analyticsErrorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  analyticsContainer: {
    flex: 1,
    padding: SPACING.lg,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xxl,
  },
  analyticsCard: {
    width: '48%',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  analyticsCardWide: {
    width: '100%',
    alignItems: 'center',
  },
  analyticsCardValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  analyticsCardLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  revenueByPlanSection: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  revenueByPlanItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  revenueByPlanName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  revenueByPlanValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.green,
  },
});
