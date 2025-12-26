import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';

interface DeliveryFunnelProps {
  sent: number;
  delivered: number;
  read: number;
  clicked: number;
  compact?: boolean;
}

export function DeliveryFunnel({ sent, delivered, read, clicked, compact = false }: DeliveryFunnelProps) {
  const deliveryRate = sent > 0 ? Math.round((delivered / sent) * 100) : 0;
  const readRate = delivered > 0 ? Math.round((read / delivered) * 100) : 0;
  const clickRate = read > 0 ? Math.round((clicked / read) * 100) : 0;

  const stages = [
    { label: 'Sent', value: sent, rate: 100, color: COLORS.blue, icon: '📤' },
    { label: 'Delivered', value: delivered, rate: deliveryRate, color: COLORS.cyan, icon: '✓' },
    { label: 'Read', value: read, rate: readRate, color: COLORS.green, icon: '👁️' },
    { label: 'Clicked', value: clicked, rate: clickRate, color: COLORS.violet, icon: '🎯' },
  ];

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {stages.map((stage, index) => (
          <View key={stage.label} style={styles.compactStage}>
            <View style={[styles.compactDot, { backgroundColor: stage.color }]} />
            <Text style={styles.compactValue}>{stage.value}</Text>
            <Text style={styles.compactLabel}>{stage.label}</Text>
            {index < stages.length - 1 && (
              <Text style={styles.compactArrow}>→</Text>
            )}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery Funnel</Text>
      
      <View style={styles.funnelContainer}>
        {stages.map((stage, index) => (
          <View key={stage.label} style={styles.stageContainer}>
            <View style={styles.stageHeader}>
              <Text style={styles.stageIcon}>{stage.icon}</Text>
              <Text style={styles.stageLabel}>{stage.label}</Text>
            </View>
            
            <View style={styles.barContainer}>
              <View 
                style={[
                  styles.bar,
                  { 
                    width: `${Math.max(stage.rate, 10)}%`,
                    backgroundColor: stage.color + '30',
                  }
                ]}
              >
                <View 
                  style={[
                    styles.barFill,
                    { backgroundColor: stage.color }
                  ]}
                />
              </View>
            </View>
            
            <View style={styles.stageStats}>
              <Text style={styles.stageValue}>{stage.value.toLocaleString()}</Text>
              {index > 0 && (
                <Text style={[styles.stageRate, { color: stage.color }]}>
                  {stage.rate}%
                </Text>
              )}
            </View>
            
            {index < stages.length - 1 && (
              <View style={styles.connector}>
                <Text style={styles.connectorArrow}>↓</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  funnelContainer: {
    gap: SPACING.md,
  },
  stageContainer: {
    gap: SPACING.sm,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  stageIcon: {
    fontSize: FONT_SIZES.md,
  },
  stageLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  barContainer: {
    height: 24,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  barFill: {
    width: 4,
    height: '60%',
    borderRadius: 2,
  },
  stageStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stageValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  stageRate: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  connector: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  connectorArrow: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  compactStage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  compactDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  compactValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  compactLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  compactArrow: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginLeft: SPACING.sm,
  },
});
