import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { StatusBadge } from './StatusBadge';

interface CampaignCardProps {
  id: string;
  name: string;
  channel: 'whatsapp' | 'sms' | 'both';
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'failed';
  targetCount: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  clickedCount: number;
  scheduledAt?: string;
  sentAt?: string;
  attributedRevenue?: { formatted: string };
  onPress: () => void;
  onPause?: () => void;
  onDuplicate?: () => void;
}

const CHANNEL_CONFIG = {
  whatsapp: { icon: '📱', label: 'WhatsApp', color: '#25D366' },
  sms: { icon: '💬', label: 'SMS', color: COLORS.blue },
  both: { icon: '📱💬', label: 'Multi-channel', color: COLORS.violet },
};

export function CampaignCard({
  name,
  channel,
  status,
  targetCount,
  sentCount,
  deliveredCount,
  readCount,
  clickedCount,
  scheduledAt,
  sentAt,
  attributedRevenue,
  onPress,
}: CampaignCardProps) {
  const channelConfig = CHANNEL_CONFIG[channel];
  const sendProgress = targetCount > 0 ? (sentCount / targetCount) * 100 : 0;
  const readRate = deliveredCount > 0 ? Math.round((readCount / deliveredCount) * 100) : 0;
  const clickRate = readCount > 0 ? Math.round((clickedCount / readCount) * 100) : 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{name}</Text>
          <View style={[styles.channelBadge, { backgroundColor: channelConfig.color + '20' }]}>
            <Text style={styles.channelIcon}>{channelConfig.icon}</Text>
            <Text style={[styles.channelLabel, { color: channelConfig.color }]}>
              {channelConfig.label}
            </Text>
          </View>
        </View>
        <StatusBadge status={status} compact />
      </View>

      {scheduledAt && status === 'scheduled' && (
        <View style={styles.scheduleRow}>
          <Text style={styles.scheduleIcon}>📅</Text>
          <Text style={styles.scheduleText}>Scheduled: {formatDate(scheduledAt)}</Text>
        </View>
      )}

      {sentAt && (status === 'completed' || status === 'sending') && (
        <View style={styles.scheduleRow}>
          <Text style={styles.scheduleIcon}>📤</Text>
          <Text style={styles.scheduleText}>Sent: {formatDate(sentAt)}</Text>
        </View>
      )}

      {status === 'sending' && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${Math.min(sendProgress, 100)}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {sentCount}/{targetCount} sent ({Math.round(sendProgress)}%)
          </Text>
        </View>
      )}

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{sentCount}</Text>
          <Text style={styles.metricLabel}>Sent</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{readRate}%</Text>
          <Text style={styles.metricLabel}>Read</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{clickRate}%</Text>
          <Text style={styles.metricLabel}>Clicked</Text>
        </View>
        {attributedRevenue && (
          <>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={[styles.metricValue, { color: COLORS.green }]}>
                {attributedRevenue.formatted}
              </Text>
              <Text style={styles.metricLabel}>Revenue</Text>
            </View>
          </>
        )}
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
  titleContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  channelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  channelIcon: {
    fontSize: FONT_SIZES.sm,
  },
  channelLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  scheduleIcon: {
    fontSize: FONT_SIZES.sm,
  },
  scheduleText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  progressContainer: {
    marginBottom: SPACING.md,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 3,
    marginBottom: SPACING.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.cardBorder,
  },
});
