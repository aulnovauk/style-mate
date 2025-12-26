import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useCallback } from 'react';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../../constants/theme';
import { SegmentedTabs } from '../../../components/marketing/SegmentedTabs';
import { OfferCard } from '../../../components/marketing/OfferCard';
import { marketingApi, OfferSummary } from '@stylemate/core/services/businessApi';

type TabValue = 'active' | 'scheduled' | 'archived';

export default function OffersListScreen() {
  const [activeTab, setActiveTab] = useState<TabValue>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [offers, setOffers] = useState<OfferSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOffers = async () => {
    try {
      const response = await marketingApi.getOffersList({ status: activeTab, search: searchQuery });
      if (response.success && response.data) {
        setOffers(response.data.offers);
      } else {
        setOffers(getMockOffers(activeTab));
      }
    } catch (err) {
      console.error('Error fetching offers:', err);
      setOffers(getMockOffers(activeTab));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchOffers();
  }, [activeTab, searchQuery]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOffers();
  }, [activeTab, searchQuery]);

  const tabs = [
    { label: 'Active', value: 'active', count: offers.filter(o => o.status === 'active' || o.status === 'paused').length },
    { label: 'Scheduled', value: 'scheduled', count: offers.filter(o => o.status === 'scheduled').length },
    { label: 'Archived', value: 'archived', count: offers.filter(o => o.status === 'archived' || o.status === 'expired').length },
  ];

  const filteredOffers = offers.filter(offer => {
    if (activeTab === 'active') return offer.status === 'active' || offer.status === 'paused';
    if (activeTab === 'scheduled') return offer.status === 'scheduled';
    return offer.status === 'archived' || offer.status === 'expired';
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offers</Text>
        <TouchableOpacity onPress={() => router.push('/marketing/offers/welcome')} style={styles.welcomeButton}>
          <Text style={styles.welcomeIcon}>👋</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchField}
            placeholder="Search offers..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <SegmentedTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(value) => setActiveTab(value as TabValue)}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.violet} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.violet} />
          </View>
        ) : filteredOffers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏷️</Text>
            <Text style={styles.emptyTitle}>No offers found</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'active' 
                ? 'Create your first offer to attract more customers'
                : activeTab === 'scheduled'
                ? 'No scheduled offers at the moment'
                : 'No archived offers yet'
              }
            </Text>
            {activeTab === 'active' && (
              <TouchableOpacity
                onPress={() => router.push('/marketing/offers/create')}
                style={styles.emptyAction}
              >
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.emptyButton}
                >
                  <Text style={styles.emptyButtonText}>Create Offer</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {filteredOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                {...offer}
                onPress={() => router.push(`/marketing/offers/${offer.id}`)}
                onEdit={() => router.push(`/marketing/offers/create?id=${offer.id}`)}
                onDuplicate={() => console.log('Duplicate', offer.id)}
                onArchive={() => console.log('Archive', offer.id)}
              />
            ))}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/marketing/offers/create')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={GRADIENTS.primary}
          style={styles.fabGradient}
        >
          <Text style={styles.fabIcon}>+</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function getMockOffers(status: string): OfferSummary[] {
  const mockOffers: OfferSummary[] = [
    {
      id: '1',
      title: 'New Year Special',
      type: 'promo_code',
      discountType: 'percentage',
      discountValue: 20,
      promoCode: 'NY2025',
      status: 'active',
      usageCount: 45,
      usageLimit: 100,
      validFrom: '2025-01-01',
      validUntil: '2025-01-31',
      attributedRevenue: { value: 22500, formatted: '₹22,500' },
      conversionRate: 28,
    },
    {
      id: '2',
      title: 'First Visit Discount',
      type: 'intro_offer',
      discountType: 'percentage',
      discountValue: 15,
      status: 'active',
      usageCount: 32,
      validFrom: '2024-12-01',
      attributedRevenue: { value: 16800, formatted: '₹16,800' },
      conversionRate: 42,
    },
    {
      id: '3',
      title: 'Flash Friday',
      type: 'flash_sale',
      discountType: 'fixed',
      discountValue: 500,
      status: 'scheduled',
      usageCount: 0,
      usageLimit: 50,
      validFrom: '2025-01-10',
      validUntil: '2025-01-10',
      attributedRevenue: { value: 0, formatted: '₹0' },
      conversionRate: 0,
    },
    {
      id: '4',
      title: 'Holiday Special 2024',
      type: 'promo_code',
      discountType: 'percentage',
      discountValue: 25,
      promoCode: 'HOLIDAY24',
      status: 'expired',
      usageCount: 120,
      usageLimit: 200,
      validFrom: '2024-12-20',
      validUntil: '2024-12-31',
      attributedRevenue: { value: 54000, formatted: '₹54,000' },
      conversionRate: 35,
    },
  ];

  if (status === 'active') return mockOffers.filter(o => o.status === 'active' || o.status === 'paused');
  if (status === 'scheduled') return mockOffers.filter(o => o.status === 'scheduled');
  return mockOffers.filter(o => o.status === 'archived' || o.status === 'expired');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  welcomeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeIcon: {
    fontSize: 20,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  searchField: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    padding: 0,
  },
  tabsContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  emptyAction: {},
  emptyButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.lg,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.violet,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 28,
    color: COLORS.white,
    lineHeight: 32,
  },
});
