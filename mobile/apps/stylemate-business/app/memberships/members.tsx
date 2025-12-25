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
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  COLORS,
  GRADIENTS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SIZES,
} from '../../constants/theme';
import { useMembersList, useMemberActions } from '@stylemate/core/hooks/useBusinessApi';
import type { MembershipMember, MembershipStatus, MembershipPlanType } from '@stylemate/core/services/businessApi';

type StatusFilter = 'all' | 'active' | 'paused' | 'expiring' | 'expired' | 'cancelled';

const STATUS_CONFIG: Record<MembershipStatus, { label: string; color: string; bgColor: string }> = {
  active: { label: 'Active', color: COLORS.green, bgColor: `${COLORS.green}20` },
  paused: { label: 'Paused', color: COLORS.amber, bgColor: `${COLORS.amber}20` },
  cancelled: { label: 'Cancelled', color: COLORS.red, bgColor: `${COLORS.red}20` },
  expired: { label: 'Expired', color: COLORS.textMuted, bgColor: `${COLORS.textMuted}20` },
  pending_payment: { label: 'Pending', color: COLORS.orange, bgColor: `${COLORS.orange}20` },
};

const PLAN_TYPE_CONFIG: Record<MembershipPlanType, { icon: string; color: string }> = {
  discount: { icon: '🏷️', color: COLORS.blue },
  credit: { icon: '💰', color: COLORS.purple },
  packaged: { icon: '📦', color: COLORS.green },
};

interface MemberCardProps {
  member: MembershipMember;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onSendReminder: () => void;
  isSubmitting: boolean;
}

function MemberCard({ member, onPause, onResume, onCancel, onSendReminder, isSubmitting }: MemberCardProps) {
  const statusConfig = STATUS_CONFIG[member.status] || STATUS_CONFIG.active;
  const planTypeConfig = PLAN_TYPE_CONFIG[member.planType] || PLAN_TYPE_CONFIG.discount;
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const isExpiringSoon = () => {
    const endDate = new Date(member.endDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0 && member.status === 'active';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <View style={styles.memberCard}>
      <View style={styles.memberHeader}>
        <View style={styles.memberAvatar}>
          {member.customerAvatar ? (
            <Text style={styles.avatarText}>{getInitials(member.customerName)}</Text>
          ) : (
            <Text style={styles.avatarText}>{getInitials(member.customerName)}</Text>
          )}
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.customerName}</Text>
          <Text style={styles.memberPhone}>{member.customerPhone}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
          <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      <View style={styles.planRow}>
        <View style={styles.planBadge}>
          <Text style={styles.planIcon}>{planTypeConfig.icon}</Text>
          <Text style={styles.planName}>{member.planName}</Text>
        </View>
        {isExpiringSoon() && (
          <View style={styles.expiringBadge}>
            <Text style={styles.expiringText}>⚠️ Expiring Soon</Text>
          </View>
        )}
      </View>

      <View style={styles.memberDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Started</Text>
          <Text style={styles.detailValue}>{formatDate(member.startDate)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Expires</Text>
          <Text style={styles.detailValue}>{formatDate(member.endDate)}</Text>
        </View>
        {member.nextBillingDate && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Next Billing</Text>
            <Text style={styles.detailValue}>{formatDate(member.nextBillingDate)}</Text>
          </View>
        )}
        {member.creditBalanceInPaisa > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Credit Balance</Text>
            <Text style={[styles.detailValue, { color: COLORS.green }]}>
              ₹{(member.creditBalanceInPaisa / 100).toLocaleString('en-IN')}
            </Text>
          </View>
        )}
        {member.sessionsRemaining !== undefined && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sessions Left</Text>
            <Text style={styles.detailValue}>
              {member.sessionsRemaining} / {(member.sessionsUsed || 0) + member.sessionsRemaining}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.memberActions}>
        {member.status === 'active' && (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onPause}
              disabled={isSubmitting}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>⏸️ Pause</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonDanger]}
              onPress={onCancel}
              disabled={isSubmitting}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionButtonText, styles.actionButtonDangerText]}>❌ Cancel</Text>
            </TouchableOpacity>
          </>
        )}
        {member.status === 'paused' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSuccess]}
            onPress={onResume}
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionButtonText, styles.actionButtonSuccessText]}>▶️ Resume</Text>
          </TouchableOpacity>
        )}
        {(member.status === 'active' || member.status === 'expired') && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onSendReminder}
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>📧 Remind</Text>
          </TouchableOpacity>
        )}
        {isSubmitting && (
          <ActivityIndicator size="small" color={COLORS.violet} style={{ marginLeft: SPACING.sm }} />
        )}
      </View>
    </View>
  );
}

interface StatBadgeProps {
  label: string;
  value: number;
  color: string;
  isActive: boolean;
  onPress: () => void;
}

function StatBadge({ label, value, color, isActive, onPress }: StatBadgeProps) {
  return (
    <TouchableOpacity 
      style={[styles.statBadge, isActive && { borderColor: color, backgroundColor: `${color}10` }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.statBadgeValue, { color: isActive ? color : COLORS.textPrimary }]}>
        {value}
      </Text>
      <Text style={[styles.statBadgeLabel, { color: isActive ? color : COLORS.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function MembershipMembersScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const apiStatus = statusFilter === 'all' ? undefined : statusFilter === 'expiring' ? 'active' : statusFilter;
  const { data, loading, error, refetch } = useMembersList(apiStatus, undefined, searchQuery);
  const { pauseMembership, resumeMembership, cancelMembership, sendRenewalReminder, isSubmitting } = useMemberActions();

  const members = data?.members || [];
  const stats = data?.stats;

  const filteredMembers = statusFilter === 'expiring' 
    ? members.filter(m => {
        const endDate = new Date(m.endDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
      })
    : members;

  const handlePause = useCallback(async (member: MembershipMember) => {
    Alert.alert(
      'Pause Membership',
      `Pause membership for ${member.customerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pause',
          onPress: async () => {
            setSubmittingId(member.id);
            const result = await pauseMembership(member.id);
            setSubmittingId(null);
            if (result.success) {
              Alert.alert('Success', 'Membership paused');
              await refetch();
            } else {
              Alert.alert('Error', result.error || 'Failed to pause membership');
            }
          },
        },
      ]
    );
  }, [pauseMembership, refetch]);

  const handleResume = useCallback(async (member: MembershipMember) => {
    setSubmittingId(member.id);
    const result = await resumeMembership(member.id);
    setSubmittingId(null);
    if (result.success) {
      Alert.alert('Success', 'Membership resumed');
      await refetch();
    } else {
      Alert.alert('Error', result.error || 'Failed to resume membership');
    }
  }, [resumeMembership, refetch]);

  const handleCancel = useCallback(async (member: MembershipMember) => {
    Alert.alert(
      'Cancel Membership',
      `Are you sure you want to cancel membership for ${member.customerName}? This cannot be undone.`,
      [
        { text: 'Keep Membership', style: 'cancel' },
        {
          text: 'Cancel Membership',
          style: 'destructive',
          onPress: async () => {
            setSubmittingId(member.id);
            const result = await cancelMembership(member.id);
            setSubmittingId(null);
            if (result.success) {
              Alert.alert('Success', 'Membership cancelled');
              await refetch();
            } else {
              Alert.alert('Error', result.error || 'Failed to cancel membership');
            }
          },
        },
      ]
    );
  }, [cancelMembership, refetch]);

  const handleSendReminder = useCallback(async (member: MembershipMember) => {
    setSubmittingId(member.id);
    const result = await sendRenewalReminder(member.id);
    setSubmittingId(null);
    if (result.success) {
      Alert.alert('Success', 'Renewal reminder sent');
    } else {
      Alert.alert('Error', result.error || 'Failed to send reminder');
    }
  }, [sendRenewalReminder]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={styles.emptyTitle}>No members found</Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? 'Try adjusting your search'
          : 'Members will appear here when customers subscribe to your plans'}
      </Text>
    </View>
  );

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading members...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Failed to load members</Text>
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
        <Text style={styles.headerTitle}>Members</Text>
        <View style={{ width: 50 }} />
      </View>

      {stats && (
        <View style={styles.statsRow}>
          <StatBadge 
            label="All" 
            value={stats.total} 
            color={COLORS.violet} 
            isActive={statusFilter === 'all'}
            onPress={() => setStatusFilter('all')}
          />
          <StatBadge 
            label="Active" 
            value={stats.active} 
            color={COLORS.green} 
            isActive={statusFilter === 'active'}
            onPress={() => setStatusFilter('active')}
          />
          <StatBadge 
            label="Paused" 
            value={stats.paused} 
            color={COLORS.amber} 
            isActive={statusFilter === 'paused'}
            onPress={() => setStatusFilter('paused')}
          />
          <StatBadge 
            label="Expiring" 
            value={stats.expiringSoon} 
            color={COLORS.orange} 
            isActive={statusFilter === 'expiring'}
            onPress={() => setStatusFilter('expiring')}
          />
        </View>
      )}

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search members..."
            placeholderTextColor={COLORS.textMuted}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MemberCard
            member={item}
            onPause={() => handlePause(item)}
            onResume={() => handleResume(item)}
            onCancel={() => handleCancel(item)}
            onSendReminder={() => handleSendReminder(item)}
            isSubmitting={submittingId === item.id}
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statBadge: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statBadgeValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statBadgeLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
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
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SIZES.listPaddingBottom,
  },
  memberCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  memberAvatar: {
    width: SIZES.avatarMedium,
    height: SIZES.avatarMedium,
    borderRadius: SIZES.avatarMedium / 2,
    backgroundColor: `${COLORS.violet}30`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.violet,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  memberPhone: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  planIcon: {
    fontSize: FONT_SIZES.md,
  },
  planName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  expiringBadge: {
    backgroundColor: `${COLORS.orange}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  expiringText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.orange,
    fontWeight: '500',
  },
  memberDetails: {
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  detailLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  memberActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    backgroundColor: `${COLORS.violet}15`,
    borderRadius: BORDER_RADIUS.sm,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.violet,
  },
  actionButtonDanger: {
    backgroundColor: `${COLORS.red}15`,
  },
  actionButtonDangerText: {
    color: COLORS.red,
  },
  actionButtonSuccess: {
    backgroundColor: `${COLORS.green}15`,
  },
  actionButtonSuccessText: {
    color: COLORS.green,
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
});
