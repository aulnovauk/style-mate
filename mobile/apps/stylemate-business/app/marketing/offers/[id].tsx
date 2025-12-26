import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useCallback } from 'react';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../../constants/theme';
import { StatusBadge } from '../../../components/marketing/StatusBadge';
import { marketingApi, OfferDetail, OfferPerformance } from '@stylemate/core/services/businessApi';

const TYPE_CONFIG = {
  promo_code: { icon: '🏷️', label: 'Promo Code' },
  flash_sale: { icon: '⚡', label: 'Flash Sale' },
  intro_offer: { icon: '👋', label: 'Intro Offer' },
  staff_special: { icon: '👤', label: 'Staff Special' },
};

export default function OfferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [performance, setPerformance] = useState<OfferPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      const [detailRes, perfRes] = await Promise.all([
        marketingApi.getOfferDetail(id),
        marketingApi.getOfferPerformance(id),
      ]);
      
      if (detailRes.success && detailRes.data) {
        setOffer(detailRes.data);
      } else {
        setOffer(getMockOffer());
      }
      
      if (perfRes.success && perfRes.data) {
        setPerformance(perfRes.data);
      } else {
        setPerformance(getMockPerformance());
      }
    } catch (err) {
      console.error('Error fetching offer:', err);
      setOffer(getMockOffer());
      setPerformance(getMockPerformance());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [id]);

  const handleEdit = () => {
    router.push(`/marketing/offers/create?id=${id}`);
  };

  const handleDuplicate = async () => {
    try {
      await marketingApi.duplicateOffer(id!);
      Alert.alert('Success', 'Offer duplicated successfully', [
        { text: 'OK', onPress: () => router.push('/marketing/offers') }
      ]);
    } catch {
      Alert.alert('Error', 'Failed to duplicate offer');
    }
  };

  const handleToggle = async () => {
    if (!offer) return;
    try {
      await marketingApi.toggleOffer(id!);
      setOffer({ ...offer, status: offer.status === 'active' ? 'paused' : 'active' });
    } catch {
      Alert.alert('Error', 'Failed to update offer status');
    }
  };

  const handleArchive = () => {
    Alert.alert(
      'Archive Offer',
      'Are you sure you want to archive this offer? It will no longer be available.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Archive', 
          style: 'destructive',
          onPress: async () => {
            try {
              await marketingApi.archiveOffer(id!);
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to archive offer');
            }
          }
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.violet} />
      </View>
    );
  }

  if (!offer) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Offer not found</Text>
      </View>
    );
  }

  const typeConfig = TYPE_CONFIG[offer.type];
  const discountDisplay = offer.discountType === 'percentage' 
    ? `${offer.discountValue}%` 
    : `₹${offer.discountValue}`;
  const usageProgress = offer.usageLimit ? (offer.usageCount / offer.usageLimit) * 100 : 0;
  const daysLeft = offer.validUntil 
    ? Math.max(0, Math.ceil((new Date(offer.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offer Details</Text>
        <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.violet} />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroIcon}>{typeConfig.icon}</Text>
            <View style={styles.heroTitleContainer}>
              <Text style={styles.heroTitle}>{offer.title}</Text>
              <Text style={styles.heroType}>{typeConfig.label}</Text>
            </View>
            <StatusBadge status={offer.status} />
          </View>

          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.discountBadge}
          >
            <Text style={styles.discountText}>{discountDisplay} OFF</Text>
          </LinearGradient>

          {offer.promoCode && (
            <View style={styles.promoCodeContainer}>
              <Text style={styles.promoCodeLabel}>Promo Code</Text>
              <View style={styles.promoCodeBadge}>
                <Text style={styles.promoCodeText}>{offer.promoCode}</Text>
              </View>
            </View>
          )}

          {offer.description && (
            <Text style={styles.description}>{offer.description}</Text>
          )}
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{offer.usageCount}</Text>
            <Text style={styles.statLabel}>Times Used</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.green }]}>
              {offer.attributedRevenue.formatted}
            </Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{offer.conversionRate}%</Text>
            <Text style={styles.statLabel}>Conversion</Text>
          </View>
          {daysLeft !== null && (
            <View style={styles.statCard}>
              <Text style={[styles.statValue, daysLeft <= 3 && { color: COLORS.amber }]}>
                {daysLeft}
              </Text>
              <Text style={styles.statLabel}>Days Left</Text>
            </View>
          )}
        </View>

        {offer.usageLimit && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Usage Progress</Text>
              <Text style={styles.progressText}>
                {offer.usageCount}/{offer.usageLimit}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${Math.min(usageProgress, 100)}%` }]}
              />
            </View>
          </View>
        )}

        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Target Audience</Text>
            <Text style={styles.detailValue}>
              {offer.targeting.audience === 'all' ? 'All Customers' : 
               offer.targeting.audience === 'new' ? 'New Customers' :
               offer.targeting.audience === 'vip' ? 'VIP Customers' : 'Inactive Customers'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Per Customer Limit</Text>
            <Text style={styles.detailValue}>{offer.limits.perClient}x</Text>
          </View>

          {offer.limits.minPurchase && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Minimum Purchase</Text>
              <Text style={styles.detailValue}>₹{offer.limits.minPurchase}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Channels</Text>
            <Text style={styles.detailValue}>
              {[
                offer.distribution.onlineCheckout && 'Online',
                offer.distribution.posCheckout && 'POS',
              ].filter(Boolean).join(', ')}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Valid From</Text>
            <Text style={styles.detailValue}>
              {new Date(offer.validFrom).toLocaleDateString('en-IN')}
            </Text>
          </View>

          {offer.validUntil && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Valid Until</Text>
              <Text style={styles.detailValue}>
                {new Date(offer.validUntil).toLocaleDateString('en-IN')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleToggle}
          >
            <Text style={styles.actionIcon}>
              {offer.status === 'active' ? '⏸️' : '▶️'}
            </Text>
            <Text style={styles.actionText}>
              {offer.status === 'active' ? 'Pause Offer' : 'Activate Offer'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDuplicate}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionText}>Duplicate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={handleArchive}
          >
            <Text style={styles.actionIcon}>📦</Text>
            <Text style={[styles.actionText, styles.actionTextDanger]}>Archive</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </View>
  );
}

function getMockOffer(): OfferDetail {
  return {
    id: '1',
    title: 'New Year Special',
    description: 'Celebrate the new year with amazing discounts on all services!',
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
    targeting: {
      audience: 'all',
      servicesScope: 'all',
      staffScope: 'all',
    },
    limits: {
      perClient: 1,
      totalUsage: 100,
      minPurchase: 500,
    },
    distribution: {
      onlineCheckout: true,
      posCheckout: true,
    },
    createdAt: '2024-12-28T10:00:00Z',
    updatedAt: '2024-12-28T10:00:00Z',
  };
}

function getMockPerformance(): OfferPerformance {
  return {
    totalRedemptions: 45,
    uniqueClients: 42,
    attributedRevenue: { value: 22500, formatted: '₹22,500' },
    avgOrderValue: { value: 500, formatted: '₹500' },
    conversionRate: 28,
    byDate: [],
    byChannel: [
      { channel: 'online', count: 32 },
      { channel: 'pos', count: 13 },
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
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
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
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  heroIcon: {
    fontSize: 36,
    marginRight: SPACING.md,
  },
  heroTitleContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  heroType: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  discountBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  discountText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.white,
  },
  promoCodeContainer: {
    marginBottom: SPACING.md,
  },
  promoCodeLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  promoCodeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderStyle: 'dashed',
  },
  promoCodeText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.violet,
    fontFamily: 'monospace',
  },
  description: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  progressSection: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  progressTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  progressText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  detailsSection: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  detailLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  detailValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  actionsSection: {
    gap: SPACING.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  actionButtonDanger: {
    backgroundColor: COLORS.red + '10',
  },
  actionIcon: {
    fontSize: 18,
  },
  actionText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  actionTextDanger: {
    color: COLORS.red,
  },
});
