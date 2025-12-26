import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';

interface QuotaMeterProps {
  used: number;
  total: number;
  resetDate: string;
}

export function QuotaMeter({ used, total, resetDate }: QuotaMeterProps) {
  const percentage = Math.min((used / total) * 100, 100);
  const remaining = total - used;
  
  const getProgressColor = () => {
    if (percentage >= 90) return GRADIENTS.danger;
    if (percentage >= 70) return GRADIENTS.warning;
    return GRADIENTS.primary;
  };

  const formatResetDate = () => {
    const date = new Date(resetDate);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>📱</Text>
          <Text style={styles.title}>Monthly Message Quota</Text>
        </View>
        <Text style={styles.resetText}>Resets {formatResetDate()}</Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={getProgressColor()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${percentage}%` }]}
          />
        </View>
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{used.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Used</Text>
        </View>
        <View style={styles.statDivider}>
          <Text style={styles.dividerText}>/</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{total.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.remainingStat}>
          <Text style={[styles.statValue, { color: COLORS.green }]}>
            {remaining.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Remaining</Text>
        </View>
      </View>
      
      {percentage >= 80 && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            {percentage >= 100 
              ? 'Quota exceeded. Upgrade for more messages.'
              : `${Math.round(100 - percentage)}% remaining. Consider upgrading.`
            }
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  icon: {
    fontSize: FONT_SIZES.lg,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  resetText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  progressContainer: {
    marginBottom: SPACING.md,
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statDivider: {
    marginHorizontal: SPACING.sm,
  },
  dividerText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textMuted,
  },
  remainingStat: {
    alignItems: 'center',
    marginLeft: 'auto',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.amber + '20',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  warningIcon: {
    fontSize: FONT_SIZES.md,
  },
  warningText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.amber,
  },
});
