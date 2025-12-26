import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useCallback } from 'react';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { marketingApi, OfferDashboardResponse, SlowDayAlert } from '@stylemate/core/services/businessApi';

export default function MarketingDashboard() {
  const [data, setData] = useState<OfferDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const response = await marketingApi.getOffersDashboard();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setData(getMockDashboard());
      }
    } catch (err) {
      console.error('Error fetching marketing dashboard:', err);
      setData(getMockDashboard());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.violet} />
      </View>
    );
  }

  const stats = data?.stats || getMockDashboard().stats;
  const slowDayAlerts = data?.slowDayAlerts || [];
  const topOffers = data?.topPerformingOffers || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Marketing & Offers</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.violet} />
        }
      >
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <LinearGradient colors={GRADIENTS.primary} style={styles.statIcon}>
              <Text style={styles.statEmoji}>🏷️</Text>
            </LinearGradient>
            <Text style={styles.statValue}>{stats.activeOffers}</Text>
            <Text style={styles.statLabel}>Active Offers</Text>
          </View>
          <View style={styles.statCard}>
            <LinearGradient colors={GRADIENTS.secondary} style={styles.statIcon}>
              <Text style={styles.statEmoji}>✓</Text>
            </LinearGradient>
            <Text style={styles.statValue}>{stats.totalRedemptions}</Text>
            <Text style={styles.statLabel}>Redemptions</Text>
          </View>
          <View style={styles.statCard}>
            <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.statIcon}>
              <Text style={styles.statEmoji}>💰</Text>
            </LinearGradient>
            <Text style={styles.statValue}>{stats.attributedRevenue.formatted}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
          <View style={styles.statCard}>
            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.statIcon}>
              <Text style={styles.statEmoji}>📈</Text>
            </LinearGradient>
            <Text style={styles.statValue}>{stats.conversionRate}%</Text>
            <Text style={styles.statLabel}>Conversion</Text>
          </View>
        </View>

        {slowDayAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Fill Slow Days</Text>
            {slowDayAlerts.map((alert, index) => (
              <SlowDayAlertCard key={index} alert={alert} />
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/marketing/offers/create')}
            >
              <LinearGradient colors={GRADIENTS.primary} style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>➕</Text>
              </LinearGradient>
              <Text style={styles.actionLabel}>Create Offer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/marketing/offers')}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.card }]}>
                <Text style={styles.actionEmoji}>📋</Text>
              </View>
              <Text style={styles.actionLabel}>View All Offers</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/marketing/campaigns')}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.card }]}>
                <Text style={styles.actionEmoji}>📱</Text>
              </View>
              <Text style={styles.actionLabel}>Campaigns</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/marketing/automations')}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.card }]}>
                <Text style={styles.actionEmoji}>🤖</Text>
              </View>
              <Text style={styles.actionLabel}>Automations</Text>
            </TouchableOpacity>
          </View>
        </View>

        {topOffers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🏆 Top Performing</Text>
              <TouchableOpacity onPress={() => router.push('/marketing/offers')}>
                <Text style={styles.viewAllLink}>View All</Text>
              </TouchableOpacity>
            </View>
            {topOffers.slice(0, 3).map((offer) => (
              <TouchableOpacity
                key={offer.id}
                style={styles.offerRow}
                onPress={() => router.push(`/marketing/offers/${offer.id}`)}
              >
                <View style={styles.offerInfo}>
                  <Text style={styles.offerTitle}>{offer.title}</Text>
                  <Text style={styles.offerDiscount}>
                    {offer.discountType === 'percentage' ? `${offer.discountValue}%` : `₹${offer.discountValue}`} OFF
                  </Text>
                </View>
                <View style={styles.offerStats}>
                  <Text style={styles.offerRevenue}>{offer.attributedRevenue.formatted}</Text>
                  <Text style={styles.offerRedemptions}>{offer.usageCount} used</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {recentActivity.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Recent Activity</Text>
            {recentActivity.slice(0, 5).map((activity) => (
              <View key={activity.id} style={styles.activityRow}>
                <Text style={styles.activityIcon}>
                  {activity.type === 'redemption' ? '✓' : activity.type === 'created' ? '➕' : '⏸️'}
                </Text>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{activity.offerTitle}</Text>
                  <Text style={styles.activityDetail}>
                    {activity.customerName || activity.type.replace('_', ' ')}
                  </Text>
                </View>
                <Text style={styles.activityTime}>
                  {formatTimeAgo(activity.timestamp)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </View>
  );
}

function SlowDayAlertCard({ alert }: { alert: SlowDayAlert }) {
  return (
    <View style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <Text style={styles.alertDay}>{alert.dayName}</Text>
        <View style={styles.occupancyBadge}>
          <Text style={styles.occupancyText}>{alert.occupancy}% booked</Text>
        </View>
      </View>
      <Text style={styles.alertSuggestion}>{alert.suggestedAction}</Text>
      <TouchableOpacity style={styles.alertAction}>
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.alertButton}
        >
          <Text style={styles.alertButtonText}>Create Flash Sale</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function getMockDashboard(): OfferDashboardResponse {
  return {
    stats: {
      totalOffers: 12,
      activeOffers: 5,
      totalRedemptions: 234,
      attributedRevenue: { value: 45600, formatted: '₹45,600' },
      conversionRate: 23,
    },
    slowDayAlerts: [
      {
        date: '2025-01-02',
        dayName: 'Thursday',
        occupancy: 35,
        suggestedAction: 'Create a flash sale to boost bookings',
      },
    ],
    topPerformingOffers: [
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
    ],
    recentActivity: [
      {
        id: '1',
        type: 'redemption',
        offerId: '1',
        offerTitle: 'New Year Special',
        customerName: 'Priya Sharma',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        amount: 500,
      },
      {
        id: '2',
        type: 'redemption',
        offerId: '2',
        offerTitle: 'First Visit Discount',
        customerName: 'Rahul Patel',
        timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        amount: 350,
      },
    ],
  };
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
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.background,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'flex-start',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statEmoji: {
    fontSize: 18,
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
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
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  viewAllLink: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.violet,
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionEmoji: {
    fontSize: 20,
  },
  actionLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  alertCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.amber,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  alertDay: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  occupancyBadge: {
    backgroundColor: COLORS.amber + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  occupancyText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.amber,
  },
  alertSuggestion: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  alertAction: {},
  alertButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  alertButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  offerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  offerInfo: {
    flex: 1,
  },
  offerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  offerDiscount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.violet,
    fontWeight: '500',
  },
  offerStats: {
    alignItems: 'flex-end',
  },
  offerRevenue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.green,
    marginBottom: SPACING.xs,
  },
  offerRedemptions: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  activityIcon: {
    fontSize: 16,
    marginRight: SPACING.md,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  activityDetail: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  activityTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
});
