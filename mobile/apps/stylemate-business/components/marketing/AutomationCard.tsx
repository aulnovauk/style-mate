import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';

interface AutomationCardProps {
  id: string;
  type: 'rebook_reminder' | 'birthday' | 'win_back' | 'review_request' | 'fill_slow_days';
  name: string;
  description: string;
  isActive: boolean;
  trigger: {
    type: string;
    value: number;
    unit: 'days' | 'hours' | 'weeks';
  };
  performance: {
    sent30d: number;
    converted30d: number;
    conversionRate: number;
    attributedRevenue: { formatted: string };
  };
  onToggle: (id: string, isActive: boolean) => void;
  onConfigure: (id: string) => void;
}

const TYPE_CONFIG = {
  rebook_reminder: { icon: '🔄', color: COLORS.blue },
  birthday: { icon: '🎂', color: COLORS.pink },
  win_back: { icon: '💤', color: COLORS.amber },
  review_request: { icon: '⭐', color: COLORS.green },
  fill_slow_days: { icon: '📅', color: COLORS.violet },
};

export function AutomationCard({
  id,
  type,
  name,
  description,
  isActive,
  trigger,
  performance,
  onToggle,
  onConfigure,
}: AutomationCardProps) {
  const typeConfig = TYPE_CONFIG[type];

  const getTriggerText = () => {
    const unitLabel = trigger.unit === 'days' ? 'd' : trigger.unit === 'hours' ? 'h' : 'w';
    return `${trigger.value}${unitLabel} ${trigger.type}`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconBg, { backgroundColor: typeConfig.color + '20' }]}>
            <Text style={styles.icon}>{typeConfig.icon}</Text>
          </View>
        </View>
        
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.description} numberOfLines={2}>{description}</Text>
          <Text style={styles.trigger}>Trigger: {getTriggerText()}</Text>
        </View>
        
        <Switch
          value={isActive}
          onValueChange={(value) => onToggle(id, value)}
          trackColor={{ false: COLORS.cardBorder, true: COLORS.violet + '60' }}
          thumbColor={isActive ? COLORS.violet : COLORS.textMuted}
        />
      </View>

      <View style={styles.performanceSection}>
        <Text style={styles.performanceTitle}>Last 30 days</Text>
        <View style={styles.performanceRow}>
          <View style={styles.performanceMetric}>
            <Text style={styles.performanceValue}>{performance.sent30d}</Text>
            <Text style={styles.performanceLabel}>Sent</Text>
          </View>
          <View style={styles.performanceMetric}>
            <Text style={styles.performanceValue}>{performance.converted30d}</Text>
            <Text style={styles.performanceLabel}>Converted</Text>
          </View>
          <View style={styles.performanceMetric}>
            <Text style={[styles.performanceValue, { color: COLORS.green }]}>
              {performance.conversionRate}%
            </Text>
            <Text style={styles.performanceLabel}>Rate</Text>
          </View>
          <View style={styles.performanceMetric}>
            <Text style={[styles.performanceValue, { color: COLORS.green }]}>
              {performance.attributedRevenue.formatted}
            </Text>
            <Text style={styles.performanceLabel}>Revenue</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.configureButton}
        onPress={() => onConfigure(id)}
        activeOpacity={0.7}
      >
        <Text style={styles.configureIcon}>⚙️</Text>
        <Text style={styles.configureText}>Configure</Text>
      </TouchableOpacity>
    </View>
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
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    marginRight: SPACING.md,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 22,
  },
  titleContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    lineHeight: 18,
  },
  trigger: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  performanceSection: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  performanceTitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performanceMetric: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  performanceLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  configureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  configureIcon: {
    fontSize: FONT_SIZES.md,
  },
  configureText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
});
