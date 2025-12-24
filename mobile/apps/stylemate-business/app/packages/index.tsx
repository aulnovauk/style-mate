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
import { usePackages, usePackageActions } from '@stylemate/core/hooks/useBusinessApi';
import type { Package } from '@stylemate/core/services/businessApi';

type StatusFilter = 'all' | 'active' | 'inactive';

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

interface PackageCardProps {
  pkg: Package;
  onPress: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
  isTogglingId?: string | null;
}

function PackageCard({ pkg, onPress, onToggle, onDuplicate, isTogglingId }: PackageCardProps) {
  const isToggling = isTogglingId === pkg.id;
  const isActive = pkg.isActive === 1;

  const regularPriceFormatted = (pkg.regularPriceInPaisa / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const packagePriceFormatted = (pkg.packagePriceInPaisa / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const savingsAmount = pkg.regularPriceInPaisa - pkg.packagePriceInPaisa;
  const savingsFormatted = (savingsAmount / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const getScheduleIcon = () => {
    return pkg.scheduleType === 'sequential' ? '📋' : '⚡';
  };

  const getScheduleLabel = () => {
    return pkg.scheduleType === 'sequential' ? 'Sequential' : 'Parallel';
  };

  return (
    <TouchableOpacity style={styles.packageCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.packageHeader}>
        <View style={styles.packageTitleRow}>
          <Text style={styles.packageName} numberOfLines={1}>
            {pkg.name}
          </Text>
          {pkg.discountPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>{pkg.discountPercentage}% OFF</Text>
            </View>
          )}
        </View>
        {pkg.category && (
          <Text style={styles.packageCategory}>{pkg.category}</Text>
        )}
      </View>

      <View style={styles.packageServicesContainer}>
        <Text style={styles.packageServicesLabel}>
          {pkg.services.length} services • {pkg.totalDurationMinutes} min
        </Text>
        <View style={styles.scheduleBadge}>
          <Text style={styles.scheduleIcon}>{getScheduleIcon()}</Text>
          <Text style={styles.scheduleText}>{getScheduleLabel()}</Text>
        </View>
      </View>

      <View style={styles.packagePricingRow}>
        <View style={styles.priceColumn}>
          <Text style={styles.packagePrice}>{packagePriceFormatted}</Text>
          {pkg.packagePriceInPaisa < pkg.regularPriceInPaisa && (
            <Text style={styles.regularPrice}>{regularPriceFormatted}</Text>
          )}
        </View>
        {savingsAmount > 0 && (
          <View style={styles.savingsContainer}>
            <Text style={styles.savingsText}>Save {savingsFormatted}</Text>
          </View>
        )}
      </View>

      <View style={styles.packageStatsRow}>
        <View style={styles.packageStatItem}>
          <Text style={styles.packageStatValue}>{pkg.soldCount}</Text>
          <Text style={styles.packageStatLabel}>Sold</Text>
        </View>
        <View style={styles.packageStatDivider} />
        <View style={styles.packageStatItem}>
          <Text style={styles.packageStatValue}>
            {(pkg.monthlyRevenue / 100).toLocaleString('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 0,
              notation: 'compact',
            })}
          </Text>
          <Text style={styles.packageStatLabel}>This Month</Text>
        </View>
        {pkg.isOnlineBookingEnabled === 1 && (
          <>
            <View style={styles.packageStatDivider} />
            <View style={styles.packageStatItem}>
              <Text style={styles.onlineBadge}>🌐</Text>
              <Text style={styles.packageStatLabel}>Online</Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.packageActions}>
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

export default function PackagesListScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data, loading, error, refetch } = usePackages(statusFilter, searchQuery);
  const { togglePackageStatus, duplicatePackage } = usePackageActions();

  const packages = data?.packages || [];
  const stats = data?.stats;

  const handleToggleStatus = useCallback(async (pkg: Package) => {
    const newStatus = pkg.isActive === 1 ? false : true;
    setTogglingId(pkg.id);
    try {
      const result = await togglePackageStatus(pkg.id, newStatus);
      if (result.success) {
        await refetch();
      } else {
        Alert.alert('Error', result.error || 'Failed to update status');
      }
    } finally {
      setTogglingId(null);
    }
  }, [togglePackageStatus, refetch]);

  const handleDuplicate = useCallback(async (pkg: Package) => {
    Alert.alert(
      'Duplicate Package',
      `Create a copy of "${pkg.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Duplicate',
          onPress: async () => {
            const result = await duplicatePackage(pkg.id);
            if (result.success) {
              Alert.alert('Success', 'Package duplicated successfully');
              await refetch();
            } else {
              Alert.alert('Error', result.error || 'Failed to duplicate package');
            }
          },
        },
      ]
    );
  }, [duplicatePackage, refetch]);

  const filteredPackages = useMemo(() => {
    return packages;
  }, [packages]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📦</Text>
      <Text style={styles.emptyTitle}>No packages found</Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? 'Try adjusting your search'
          : 'Create your first package to offer bundled services'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => router.push('/packages/add-edit')}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.emptyButtonGradient}
          >
            <Text style={styles.emptyButtonText}>Create Package</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading packages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Failed to load packages</Text>
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
        <Text style={styles.headerTitle}>Packages</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/packages/add-edit')}
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

      {stats && (
        <View style={styles.statsRow}>
          <StatCard label="Total" value={stats.total} icon="📦" color={COLORS.violet} />
          <StatCard label="Active" value={stats.active} icon="✓" color={COLORS.green} />
          <StatCard label="Revenue" value={`₹${(stats.monthlyRevenue / 100 / 1000).toFixed(1)}K`} icon="💰" color={COLORS.amber} />
        </View>
      )}

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search packages..."
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
        data={filteredPackages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PackageCard
            pkg={item}
            onPress={() => router.push(`/packages/add-edit?id=${item.id}`)}
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
  packageCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  packageHeader: {
    marginBottom: SPACING.md,
  },
  packageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  packageName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  discountBadge: {
    backgroundColor: `${COLORS.green}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  discountBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.green,
  },
  packageCategory: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  packageServicesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  packageServicesLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  scheduleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.blue}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  scheduleIcon: {
    fontSize: FONT_SIZES.sm,
  },
  scheduleText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.blue,
    fontWeight: '500',
  },
  packagePricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  priceColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  packagePrice: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  regularPrice: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  savingsContainer: {
    backgroundColor: `${COLORS.green}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  savingsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.green,
    fontWeight: '600',
  },
  packageStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  packageStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  packageStatValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  packageStatLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  packageStatDivider: {
    width: 1,
    height: SPACING.xxl,
    backgroundColor: COLORS.cardBorder,
  },
  onlineBadge: {
    fontSize: FONT_SIZES.lg,
  },
  packageActions: {
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
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
  },
  emptyButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
});
