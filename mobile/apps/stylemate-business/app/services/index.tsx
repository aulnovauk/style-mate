import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
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
import { useServicesManagement, useServiceActions } from '@stylemate/core/hooks/useBusinessApi';
import type { ServiceListItem, ServiceCategory } from '@stylemate/core/services/businessApi';

type CategoryFilter = 'all' | string;
type StatusFilter = 'all' | 'active' | 'inactive' | 'featured';

interface ServiceCardProps {
  service: ServiceListItem;
  onPress: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
  isTogglingId?: string | null;
}

function ServiceCard({ service, onPress, onToggle, onDuplicate, isTogglingId }: ServiceCardProps) {
  const isToggling = isTogglingId === service.id;
  const priceFormatted = (service.priceInPaisa / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const specialPriceFormatted = service.specialPricePaisa
    ? (service.specialPricePaisa / 100).toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      })
    : null;

  const isActive = service.isActive === 1;

  const getGenderIcon = () => {
    switch (service.gender) {
      case 'male':
        return '♂️';
      case 'female':
        return '♀️';
      default:
        return '⚤';
    }
  };

  const getApprovalBadge = () => {
    switch (service.approvalStatus) {
      case 'pending':
        return { bg: `${COLORS.amber}20`, color: COLORS.amber, label: 'Pending' };
      case 'rejected':
        return { bg: `${COLORS.red}20`, color: COLORS.red, label: 'Rejected' };
      default:
        return null;
    }
  };

  const approvalBadge = getApprovalBadge();

  return (
    <TouchableOpacity style={styles.serviceCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.serviceContent}>
        <View style={styles.serviceHeader}>
          <Text style={styles.serviceName} numberOfLines={1}>
            {service.name}
          </Text>
          <View style={styles.serviceBadges}>
            {service.isComboService === 1 && (
              <View style={[styles.badge, { backgroundColor: `${COLORS.purple}20` }]}>
                <Text style={[styles.badgeText, { color: COLORS.purple }]}>Combo</Text>
              </View>
            )}
            {service.isFeatured === 1 && (
              <View style={[styles.badge, { backgroundColor: `${COLORS.amber}20` }]}>
                <Text style={[styles.badgeText, { color: COLORS.amber }]}>⭐</Text>
              </View>
            )}
            {approvalBadge && (
              <View style={[styles.badge, { backgroundColor: approvalBadge.bg }]}>
                <Text style={[styles.badgeText, { color: approvalBadge.color }]}>
                  {approvalBadge.label}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.serviceDetails}>
          <View style={styles.priceContainer}>
            {specialPriceFormatted ? (
              <>
                <Text style={styles.specialPrice}>{specialPriceFormatted}</Text>
                <Text style={styles.originalPrice}>{priceFormatted}</Text>
              </>
            ) : (
              <Text style={styles.servicePrice}>
                {service.priceType === 'starting_from' ? 'From ' : ''}
                {priceFormatted}
              </Text>
            )}
          </View>
          <Text style={styles.serviceDuration}>{service.durationMinutes} min</Text>
          <Text style={styles.genderIcon}>{getGenderIcon()}</Text>
        </View>

        {service.category && (
          <Text style={styles.serviceCategory}>
            {service.category}
            {service.subCategory ? ` • ${service.subCategory}` : ''}
          </Text>
        )}
      </View>

      <View style={styles.serviceActions}>
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
        <View style={styles.chevron}>
          <Text style={styles.chevronText}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

interface StatsCardProps {
  icon: string;
  iconBg: string;
  iconColor: string;
  value: number | string;
  label: string;
  valueColor?: string;
  onPress?: () => void;
  actionLabel?: string;
}

function StatsCard({ icon, iconBg, iconColor, value, label, valueColor, onPress, actionLabel }: StatsCardProps) {
  const cardContent = (
    <>
      <View style={[styles.statsIconContainer, { backgroundColor: iconBg }]}>
        <Text style={[styles.statsIcon, { color: iconColor }]}>{icon}</Text>
      </View>
      <Text style={[styles.statsValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
      <Text style={styles.statsLabel}>{label}</Text>
      {onPress && actionLabel && (
        <Text style={styles.statsAction}>{actionLabel}</Text>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity 
        style={styles.statsCard} 
        onPress={onPress} 
        activeOpacity={0.7}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.statsCard}>
      {cardContent}
    </View>
  );
}

interface CategoryChipProps {
  category: ServiceCategory | { id: string; name: string; icon: string; count: number };
  isSelected: boolean;
  onPress: () => void;
}

function CategoryChip({ category, isSelected, onPress }: CategoryChipProps) {
  return (
    <TouchableOpacity
      style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.categoryChipIcon}>{category.icon}</Text>
      <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
        {category.name}
      </Text>
      {category.count > 0 && (
        <View style={[styles.categoryChipCount, isSelected && styles.categoryChipCountActive]}>
          <Text
            style={[
              styles.categoryChipCountText,
              isSelected && styles.categoryChipCountTextActive,
            ]}
          >
            {category.count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

interface CollapsibleCategoryProps {
  categoryName: string;
  icon: string;
  services: ServiceListItem[];
  onServicePress: (service: ServiceListItem) => void;
  onToggle: (service: ServiceListItem) => void;
  onDuplicate: (service: ServiceListItem) => void;
  defaultExpanded?: boolean;
  isTogglingId?: string | null;
}

function CollapsibleCategory({
  categoryName,
  icon,
  services,
  onServicePress,
  onToggle,
  onDuplicate,
  defaultExpanded = true,
  isTogglingId,
}: CollapsibleCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const visibleServices = isExpanded ? services : services.slice(0, 2);
  const hasMore = services.length > 2 && !isExpanded;

  return (
    <View style={styles.categorySection}>
      <TouchableOpacity
        style={styles.categorySectionHeader}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.categorySectionLeft}>
          <Text style={styles.categorySectionIcon}>{icon}</Text>
          <Text style={styles.categorySectionTitle}>{categoryName}</Text>
          <View style={styles.categorySectionCount}>
            <Text style={styles.categorySectionCountText}>{services.length}</Text>
          </View>
        </View>
        <Text style={styles.categorySectionChevron}>{isExpanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {visibleServices.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          onPress={() => onServicePress(service)}
          onToggle={() => onToggle(service)}
          onDuplicate={() => onDuplicate(service)}
          isTogglingId={isTogglingId}
        />
      ))}

      {hasMore && (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={() => setIsExpanded(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.showMoreText}>
            Show {services.length - 2} more...
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const CATEGORY_ICONS: Record<string, string> = {
  Hair: '💇',
  Skin: '💆',
  Nails: '💅',
  Spa: '🧘',
  Makeup: '💄',
  Bridal: '👰',
  Massage: '💆‍♂️',
  Facial: '✨',
  Waxing: '🌿',
  Threading: '🧵',
};

function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category] || '✂️';
}

export default function ServicesManagementScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data, loading, error, refetch } = useServicesManagement(
    selectedCategory !== 'all' ? selectedCategory : undefined,
    debouncedSearch || undefined
  );
  const { toggleServiceStatus, isSubmitting } = useServiceActions();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(text);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleServicePress = (service: ServiceListItem) => {
    router.push(`/services/add-edit?id=${service.id}`);
  };

  const [togglingServiceId, setTogglingServiceId] = useState<string | null>(null);

  const handleToggleService = async (service: ServiceListItem) => {
    if (togglingServiceId) return;
    setTogglingServiceId(service.id);
    try {
      const newStatus = service.isActive !== 1;
      const result = await toggleServiceStatus(service.id, newStatus);
      if (result.success) {
        await refetch();
      } else {
        Alert.alert('Error', result.error || 'Failed to update service status');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setTogglingServiceId(null);
    }
  };

  const handleAddService = () => {
    router.push('/services/add-edit');
  };

  const handleDuplicateService = (service: ServiceListItem) => {
    router.push(`/services/add-edit?duplicateFrom=${service.id}`);
  };

  const handleViewInactiveServices = () => {
    if (statusFilter === 'inactive') {
      setStatusFilter('all');
    } else {
      setStatusFilter('inactive');
      setSelectedCategory('all');
    }
  };

  const handleViewActiveServices = () => {
    if (statusFilter === 'active') {
      setStatusFilter('all');
    } else {
      setStatusFilter('active');
      setSelectedCategory('all');
    }
  };

  const handleViewFeaturedServices = () => {
    if (statusFilter === 'featured') {
      setStatusFilter('all');
    } else {
      setStatusFilter('featured');
      setSelectedCategory('all');
    }
  };

  const handleManagePackages = () => {
    router.push('/packages');
  };

  const handleManageMemberships = () => {
    router.push('/memberships');
  };

  const handleManageStaffSpecializations = () => {
    router.push('/team');
  };

  const stats = data?.stats;
  const categories = data?.categories || [];
  const servicesByCategory = data?.byCategory || {};

  const allCategory = {
    id: 'all',
    name: 'All',
    icon: '📋',
    count: stats?.total || 0,
  };

  const categoryFilters = [
    allCategory,
    ...categories.map((cat) => ({
      ...cat,
      icon: cat.icon || getCategoryIcon(cat.name),
    })),
  ];

  const filteredServices = useMemo(() => {
    if (!data?.services) return [];
    let result = data.services;

    if (statusFilter === 'active') {
      result = result.filter((s) => s.isActive === 1);
    } else if (statusFilter === 'inactive') {
      result = result.filter((s) => s.isActive !== 1);
    } else if (statusFilter === 'featured') {
      result = result.filter((s) => s.isFeatured === 1);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.category?.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [data?.services, searchQuery, statusFilter]);

  const groupedServices = useMemo(() => {
    if (selectedCategory !== 'all') {
      return { [selectedCategory]: filteredServices };
    }

    const grouped: Record<string, ServiceListItem[]> = {};
    filteredServices.forEach((service) => {
      const category = service.category || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(service);
    });
    return grouped;
  }, [filteredServices, selectedCategory]);

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Unable to load services</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <LinearGradient colors={GRADIENTS.primary} style={styles.retryButtonGradient}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Services & Pricing</Text>
        <TouchableOpacity onPress={handleAddService} style={styles.addButton}>
          <LinearGradient colors={GRADIENTS.primary} style={styles.addButtonGradient}>
            <Text style={styles.addButtonText}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Error Banner (when cached data exists) */}
      {error && data && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={refetch}>
            <Text style={styles.errorBannerRetry}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.violet}
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search services..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={handleSearchChange}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setDebouncedSearch('');
                }}
              >
                <Text style={styles.clearSearch}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          {categoryFilters.map((cat) => (
            <CategoryChip
              key={cat.id}
              category={cat}
              isSelected={selectedCategory === cat.id}
              onPress={() => setSelectedCategory(cat.id as CategoryFilter)}
            />
          ))}
        </ScrollView>

        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsContainer}>
            <StatsCard
              icon="📋"
              iconBg={`${COLORS.violet}20`}
              iconColor={COLORS.violet}
              value={stats.total}
              label="Total"
            />
            <StatsCard
              icon="🟢"
              iconBg={statusFilter === 'active' ? COLORS.green : `${COLORS.green}20`}
              iconColor={statusFilter === 'active' ? COLORS.white : COLORS.green}
              value={stats.active}
              label="Active"
              valueColor={COLORS.green}
              onPress={handleViewActiveServices}
              actionLabel={statusFilter === 'active' ? 'Show All' : 'View All'}
            />
            <StatsCard
              icon="⏸️"
              iconBg={statusFilter === 'inactive' ? COLORS.textMuted : `${COLORS.textMuted}20`}
              iconColor={statusFilter === 'inactive' ? COLORS.white : COLORS.textMuted}
              value={stats.inactive}
              label="Inactive"
              onPress={handleViewInactiveServices}
              actionLabel={statusFilter === 'inactive' ? 'Show All' : 'View All'}
            />
            <StatsCard
              icon="⭐"
              iconBg={statusFilter === 'featured' ? COLORS.amber : `${COLORS.amber}20`}
              iconColor={statusFilter === 'featured' ? COLORS.white : COLORS.amber}
              value={stats.featuredCount}
              label="Featured"
              onPress={handleViewFeaturedServices}
              actionLabel={statusFilter === 'featured' ? 'Show All' : 'View All'}
            />
          </View>
        )}

        {/* Status Filter Indicator */}
        {statusFilter !== 'all' && (
          <View style={styles.filterIndicator}>
            <Text style={styles.filterIndicatorText}>
              Showing: {statusFilter === 'active' ? 'Active' : statusFilter === 'inactive' ? 'Inactive' : 'Featured'} services
            </Text>
            <TouchableOpacity onPress={() => setStatusFilter('all')}>
              <Text style={styles.filterIndicatorClear}>Clear Filter</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Services by Category */}
        <View style={styles.servicesSection}>
          {Object.keys(groupedServices).length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>✂️</Text>
              <Text style={styles.emptyTitle}>No Services Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'Try adjusting your search'
                  : statusFilter !== 'all'
                    ? `No ${statusFilter} services available`
                    : 'Add your first service to get started'}
              </Text>
              {!searchQuery && statusFilter === 'all' && (
                <TouchableOpacity style={styles.emptyButton} onPress={handleAddService}>
                  <LinearGradient colors={GRADIENTS.primary} style={styles.emptyButtonGradient}>
                    <Text style={styles.emptyButtonText}>Add Service</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            Object.entries(groupedServices).map(([category, services]) => (
              <CollapsibleCategory
                key={category}
                categoryName={category}
                icon={getCategoryIcon(category)}
                services={services}
                onServicePress={handleServicePress}
                onToggle={handleToggleService}
                onDuplicate={handleDuplicateService}
                isTogglingId={togglingServiceId}
              />
            ))
          )}
        </View>

        {/* Related Links */}
        <View style={styles.relatedSection}>
          <Text style={styles.relatedTitle}>Related</Text>
          <View style={styles.relatedButtons}>
            <TouchableOpacity 
              style={styles.relatedButton} 
              activeOpacity={0.7}
              onPress={handleManagePackages}
            >
              <Text style={styles.relatedButtonIcon}>📦</Text>
              <View style={styles.relatedButtonContent}>
                <Text style={styles.relatedButtonText}>Packages</Text>
                <Text style={styles.relatedButtonAction}>Manage →</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.relatedButton} 
              activeOpacity={0.7}
              onPress={handleManageMemberships}
            >
              <Text style={styles.relatedButtonIcon}>👑</Text>
              <View style={styles.relatedButtonContent}>
                <Text style={styles.relatedButtonText}>Memberships</Text>
                <Text style={styles.relatedButtonAction}>Manage →</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.relatedButton} 
              activeOpacity={0.7}
              onPress={handleManageStaffSpecializations}
            >
              <Text style={styles.relatedButtonIcon}>👥</Text>
              <View style={styles.relatedButtonContent}>
                <Text style={styles.relatedButtonText}>Staff Specializations</Text>
                <Text style={styles.relatedButtonAction}>Manage →</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: SIZES.listPaddingBottom }} />
      </ScrollView>

      {/* Loading Overlay */}
      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.white} />
        </View>
      )}
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
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    gap: SPACING.md,
  },
  errorIcon: {
    fontSize: SIZES.emojiLarge,
    marginBottom: SPACING.md,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  backButton: {
    width: SIZES.buttonMedium,
    height: SIZES.buttonMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  addButton: {
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  addButtonGradient: {
    width: SIZES.buttonMedium,
    height: SIZES.buttonMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.white,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: `${COLORS.amber}20`,
  },
  errorBannerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.amber,
    flex: 1,
  },
  errorBannerRetry: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.amber,
    marginLeft: SPACING.md,
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: SIZES.inputHeight,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  searchIcon: {
    fontSize: FONT_SIZES.lg,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  clearSearch: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textMuted,
    paddingLeft: SPACING.sm,
  },
  categoriesScroll: {
    marginTop: SPACING.lg,
  },
  categoriesContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginRight: SPACING.sm,
  },
  categoryChipActive: {
    backgroundColor: `${COLORS.violet}20`,
    borderColor: COLORS.violet,
  },
  categoryChipIcon: {
    fontSize: FONT_SIZES.lg,
    marginRight: SPACING.xs,
  },
  categoryChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: COLORS.violet,
  },
  categoryChipCount: {
    marginLeft: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.micro,
    backgroundColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.full,
    minWidth: SPACING.xl,
    alignItems: 'center',
  },
  categoryChipCountActive: {
    backgroundColor: COLORS.violet,
  },
  categoryChipCountText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  categoryChipCountTextActive: {
    color: COLORS.white,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    gap: SPACING.sm,
  },
  statsCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statsIconContainer: {
    width: SIZES.iconMedium,
    height: SIZES.iconMedium,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  statsIcon: {
    fontSize: FONT_SIZES.lg,
  },
  statsValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statsLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.micro,
  },
  statsAction: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.violet,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  servicesSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  categorySection: {
    marginBottom: SPACING.lg,
  },
  categorySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  categorySectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categorySectionIcon: {
    fontSize: FONT_SIZES.xl,
    marginRight: SPACING.sm,
  },
  categorySectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  categorySectionCount: {
    marginLeft: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.micro,
    backgroundColor: `${COLORS.violet}20`,
    borderRadius: BORDER_RADIUS.full,
  },
  categorySectionCountText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.violet,
    fontWeight: '600',
  },
  categorySectionChevron: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  serviceContent: {
    flex: 1,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  serviceName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  serviceBadges: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  badge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.micro,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  servicePrice: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.green,
  },
  specialPrice: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.green,
  },
  originalPrice: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  serviceDuration: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  genderIcon: {
    fontSize: FONT_SIZES.md,
  },
  serviceCategory: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  serviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.md,
    gap: SPACING.sm,
  },
  duplicateButton: {
    width: SIZES.buttonSmall,
    height: SIZES.buttonSmall,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.blue}10`,
    borderRadius: BORDER_RADIUS.sm,
  },
  duplicateButtonText: {
    fontSize: FONT_SIZES.md,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  statusToggleDisabled: {
    opacity: 0.6,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: `${COLORS.green}10`,
    borderColor: `${COLORS.green}30`,
  },
  statusInactive: {
    backgroundColor: `${COLORS.textMuted}10`,
    borderColor: `${COLORS.textMuted}30`,
  },
  statusDot: {
    width: SPACING.sm,
    height: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  chevron: {
    width: SPACING.lg,
    alignItems: 'center',
  },
  chevronText: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textMuted,
  },
  showMoreButton: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  showMoreText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.violet,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  emptyIcon: {
    fontSize: SIZES.emojiLarge,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  emptyButton: {
    marginTop: SPACING.lg,
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
  relatedSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  relatedTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  relatedButtons: {
    flexDirection: 'column',
    gap: SPACING.sm,
  },
  relatedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  relatedButtonIcon: {
    fontSize: FONT_SIZES.xl,
    marginRight: SPACING.md,
  },
  relatedButtonContent: {
    flex: 1,
  },
  relatedButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  relatedButtonAction: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.violet,
    marginTop: SPACING.micro,
  },
  filterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: `${COLORS.violet}10`,
    borderRadius: BORDER_RADIUS.sm,
  },
  filterIndicatorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.violet,
    fontWeight: '500',
  },
  filterIndicatorClear: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.violet,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
