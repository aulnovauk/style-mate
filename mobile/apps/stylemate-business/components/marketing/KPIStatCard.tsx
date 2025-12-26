import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';

interface KPIStatCardProps {
  icon: string;
  iconGradient?: [string, string];
  value: string;
  label: string;
  trend?: number;
  trendType?: 'up' | 'down' | 'neutral';
  onPress?: () => void;
  compact?: boolean;
}

export function KPIStatCard({ 
  icon, 
  iconGradient = GRADIENTS.primary, 
  value, 
  label, 
  trend, 
  trendType = 'neutral',
  onPress,
  compact = false,
}: KPIStatCardProps) {
  const getTrendColor = () => {
    if (trendType === 'up') return COLORS.green;
    if (trendType === 'down') return COLORS.red;
    return COLORS.amber;
  };

  const getTrendIcon = () => {
    if (trendType === 'up') return '↑';
    if (trendType === 'down') return '↓';
    return '−';
  };

  const content = (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.header}>
        <LinearGradient
          colors={iconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.iconContainer, compact && styles.iconContainerCompact]}
        >
          <Text style={[styles.icon, compact && styles.iconCompact]}>{icon}</Text>
        </LinearGradient>
        {trend !== undefined && (
          <View style={[styles.trendBadge, { backgroundColor: getTrendColor() + '20' }]}>
            <Text style={[styles.trendText, { color: getTrendColor() }]}>
              {getTrendIcon()} {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.value, compact && styles.valueCompact]}>{value}</Text>
      <Text style={[styles.label, compact && styles.labelCompact]}>{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flex: 1,
  },
  cardCompact: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerCompact: {
    width: 32,
    height: 32,
  },
  icon: {
    fontSize: 18,
  },
  iconCompact: {
    fontSize: 14,
  },
  trendBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  trendText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  value: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  valueCompact: {
    fontSize: FONT_SIZES.lg,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  labelCompact: {
    fontSize: FONT_SIZES.xs,
  },
});
