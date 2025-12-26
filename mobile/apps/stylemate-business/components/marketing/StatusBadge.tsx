import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';

type StatusType = 
  | 'active' 
  | 'paused' 
  | 'scheduled' 
  | 'expired' 
  | 'archived' 
  | 'pending' 
  | 'completed' 
  | 'sending' 
  | 'failed'
  | 'draft';

interface StatusBadgeProps {
  status: StatusType;
  compact?: boolean;
}

const STATUS_CONFIG: Record<StatusType, { color: string; label: string; icon?: string }> = {
  active: { color: COLORS.green, label: 'Active', icon: '🟢' },
  paused: { color: COLORS.amber, label: 'Paused', icon: '⏸️' },
  scheduled: { color: COLORS.blue, label: 'Scheduled', icon: '📅' },
  expired: { color: COLORS.red, label: 'Expired', icon: '⏰' },
  archived: { color: COLORS.textMuted, label: 'Archived', icon: '📦' },
  pending: { color: COLORS.amber, label: 'Pending', icon: '🟡' },
  completed: { color: COLORS.green, label: 'Completed', icon: '✓' },
  sending: { color: COLORS.blue, label: 'Sending', icon: '📤' },
  failed: { color: COLORS.red, label: 'Failed', icon: '❌' },
  draft: { color: COLORS.textMuted, label: 'Draft', icon: '📝' },
};

export function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  
  return (
    <View style={[
      styles.badge, 
      { backgroundColor: config.color + '20' },
      compact && styles.badgeCompact,
    ]}>
      {!compact && config.icon && (
        <Text style={styles.icon}>{config.icon}</Text>
      )}
      <Text style={[styles.text, { color: config.color }, compact && styles.textCompact]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  badgeCompact: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  icon: {
    fontSize: FONT_SIZES.xs,
  },
  text: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  textCompact: {
    fontSize: FONT_SIZES.xs,
  },
});
