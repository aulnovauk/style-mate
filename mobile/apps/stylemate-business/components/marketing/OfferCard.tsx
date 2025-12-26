import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { StatusBadge } from './StatusBadge';

interface OfferCardProps {
  id: string;
  title: string;
  type: 'promo_code' | 'flash_sale' | 'intro_offer' | 'staff_special';
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  promoCode?: string;
  status: 'active' | 'paused' | 'scheduled' | 'expired' | 'archived';
  usageCount: number;
  usageLimit?: number;
  validUntil?: string;
  attributedRevenue?: { formatted: string };
  conversionRate?: number;
  imageUrl?: string;
  onPress: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onArchive?: () => void;
}

const TYPE_CONFIG = {
  promo_code: { icon: '🏷️', label: 'Promo Code' },
  flash_sale: { icon: '⚡', label: 'Flash Sale' },
  intro_offer: { icon: '👋', label: 'Intro Offer' },
  staff_special: { icon: '👤', label: 'Staff Special' },
};

export function OfferCard({
  title,
  type,
  discountType,
  discountValue,
  promoCode,
  status,
  usageCount,
  usageLimit,
  validUntil,
  attributedRevenue,
  conversionRate,
  onPress,
}: OfferCardProps) {
  const typeConfig = TYPE_CONFIG[type];
  const discountDisplay = discountType === 'percentage' 
    ? `${discountValue}%` 
    : `₹${discountValue}`;
  
  const usageProgress = usageLimit ? (usageCount / usageLimit) * 100 : 0;
  const daysLeft = validUntil ? Math.max(0, Math.ceil((new Date(validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.typeIcon}>{typeConfig.icon}</Text>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            <Text style={styles.typeLabel}>{typeConfig.label}</Text>
          </View>
        </View>
        <StatusBadge status={status} compact />
      </View>

      <View style={styles.discountRow}>
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.discountBadge}
        >
          <Text style={styles.discountIcon}>💹</Text>
          <Text style={styles.discountText}>{discountDisplay} OFF</Text>
        </LinearGradient>
        
        {promoCode && (
          <View style={styles.promoCodeBadge}>
            <Text style={styles.promoCodeText}>{promoCode}</Text>
          </View>
        )}
      </View>

      {usageLimit && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(usageProgress, 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>{usageCount}/{usageLimit} used</Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.metricsRow}>
          {attributedRevenue && (
            <View style={styles.metric}>
              <Text style={styles.metricIcon}>💰</Text>
              <Text style={styles.metricValue}>{attributedRevenue.formatted}</Text>
            </View>
          )}
          {conversionRate !== undefined && (
            <View style={styles.metric}>
              <Text style={styles.metricIcon}>📈</Text>
              <Text style={styles.metricValue}>{conversionRate}%</Text>
            </View>
          )}
          {daysLeft !== null && status === 'active' && (
            <View style={styles.metric}>
              <Text style={styles.metricIcon}>⏰</Text>
              <Text style={styles.metricValue}>{daysLeft}d left</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.md,
  },
  typeIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  typeLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  discountIcon: {
    fontSize: FONT_SIZES.sm,
  },
  discountText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.white,
  },
  promoCodeBadge: {
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderStyle: 'dashed',
  },
  promoCodeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.violet,
    fontFamily: 'monospace',
  },
  progressContainer: {
    marginBottom: SPACING.md,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 3,
    marginBottom: SPACING.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.violet,
    borderRadius: 3,
  },
  progressText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: SPACING.md,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  metricIcon: {
    fontSize: FONT_SIZES.sm,
  },
  metricValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
});
