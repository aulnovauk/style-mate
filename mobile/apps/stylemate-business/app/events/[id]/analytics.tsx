import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS, SIZES } from '../../../constants/theme';
import { useEventAnalytics, useEventsActions } from '@stylemate/core';

type RangeType = '7d' | '30d' | 'all';

function StatCard({ icon, label, value, subValue, color }: { 
  icon: string; 
  label: string; 
  value: string | number; 
  subValue?: string;
  color?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      {subValue && <Text style={styles.statSubValue}>{subValue}</Text>}
    </View>
  );
}

function InsightCard({ insight, index }: { insight: string; index: number }) {
  const icons = ['💡', '📈', '🎯', '⚡', '🔍'];
  return (
    <View style={styles.insightCard}>
      <Text style={styles.insightIcon}>{icons[index % icons.length]}</Text>
      <Text style={styles.insightText}>{insight}</Text>
    </View>
  );
}

function TicketPerformanceCard({ ticket }: { ticket: any }) {
  return (
    <View style={styles.ticketPerfCard}>
      <View style={styles.ticketPerfHeader}>
        <Text style={styles.ticketPerfName}>🎫 {ticket.ticketName}</Text>
        <Text style={styles.ticketPerfPercentage}>{ticket.percentage.toFixed(0)}%</Text>
      </View>
      <View style={styles.ticketPerfStats}>
        <Text style={styles.ticketPerfStat}>Sold: {ticket.sold}/{ticket.capacity}</Text>
        <Text style={styles.ticketPerfStat}>Revenue: ₹{(ticket.revenue / 100).toLocaleString()}</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${ticket.percentage}%` }]} />
      </View>
      <Text style={styles.ticketPerfInsight}>
        Avg. {ticket.avgDaysBeforeEvent} days before event
        {ticket.soldOutDaysBefore && ` • Sold out ${ticket.soldOutDaysBefore} days early`}
      </Text>
    </View>
  );
}

function FeedbackCard({ feedback }: { feedback: any }) {
  const stars = '⭐'.repeat(feedback.rating);
  return (
    <View style={styles.feedbackCard}>
      <View style={styles.feedbackHeader}>
        <Text style={styles.feedbackName}>{feedback.attendeeName}</Text>
        <Text style={styles.feedbackStars}>{stars}</Text>
      </View>
      <Text style={styles.feedbackComment} numberOfLines={3}>{feedback.comment}</Text>
    </View>
  );
}

export default function EventAnalyticsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const eventId = id as string;

  const [range, setRange] = useState<RangeType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data, loading, error, refetch } = useEventAnalytics(eventId, range);
  const { exportAttendees } = useEventsActions();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleExport = async (format: 'csv' | 'pdf') => {
    const result = await exportAttendees(eventId, format);
    if (result.success && result.url) {
      const url = result.url;
      Alert.alert(
        'Export Ready',
        `Your ${format.toUpperCase()} file has been generated.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open', 
            onPress: async () => {
              try {
                await Linking.openURL(url);
              } catch (e) {
                Alert.alert('Error', 'Unable to open the download link.');
              }
            }
          },
        ]
      );
    } else if (result.success) {
      Alert.alert(
        'Export Ready',
        `Your ${format.toUpperCase()} file has been generated. Check your email.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Export Failed', 'Unable to generate export. Please try again.');
    }
  };

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event Analytics</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event Analytics</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error || 'Failed to load analytics'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <TouchableOpacity style={styles.exportButton} onPress={() => handleExport('csv')}>
          <Text style={styles.exportButtonIcon}>📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.violet}
          />
        }
        contentContainerStyle={styles.content}
      >
        <Text style={styles.eventTitle}>{data.eventTitle}</Text>

        <View style={styles.rangeSelector}>
          {(['7d', '30d', 'all'] as RangeType[]).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}
              onPress={() => setRange(r)}
            >
              <Text style={[styles.rangeBtnText, range === r && styles.rangeBtnTextActive]}>
                {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.statsRow}
          >
            <StatCard icon="👥" label="Total Registrations" value={data.totalRegistrations} />
            <StatCard icon="✅" label="Attended" value={data.attended} subValue={`${data.attendanceRate.toFixed(0)}%`} color={COLORS.green} />
            <StatCard icon="❌" label="No Shows" value={data.noShows} color={COLORS.red} />
            <StatCard icon="📊" label="Late Cancel" value={data.lateCancellations} color={COLORS.amber} />
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue</Text>
          <View style={styles.revenueCard}>
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.revenueGradient}
            >
              <Text style={styles.revenueLabel}>Total Revenue</Text>
              <Text style={styles.revenueValue}>{data.revenueFormatted}</Text>
              <Text style={styles.revenueSubtext}>
                {data.revenuePerPersonFormatted} per person
              </Text>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendee Insights</Text>
          <View style={styles.insightsGrid}>
            <View style={styles.insightBox}>
              <Text style={styles.insightBoxIcon}>🔄</Text>
              <Text style={styles.insightBoxValue}>{data.repeatAttendeesPercentage.toFixed(0)}%</Text>
              <Text style={styles.insightBoxLabel}>Repeat Attendees</Text>
            </View>
            <View style={styles.insightBox}>
              <Text style={styles.insightBoxIcon}>🆕</Text>
              <Text style={styles.insightBoxValue}>{data.firstTimeAttendees}</Text>
              <Text style={styles.insightBoxLabel}>First Timers</Text>
            </View>
            <View style={styles.insightBox}>
              <Text style={styles.insightBoxIcon}>👥</Text>
              <Text style={styles.insightBoxValue}>{data.guestCount}</Text>
              <Text style={styles.insightBoxLabel}>Guests</Text>
            </View>
            <View style={styles.insightBox}>
              <Text style={styles.insightBoxIcon}>⭐</Text>
              <Text style={styles.insightBoxValue}>{data.vipCount}</Text>
              <Text style={styles.insightBoxLabel}>VIPs</Text>
            </View>
          </View>
        </View>

        {data.ticketPerformance && data.ticketPerformance.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ticket Performance</Text>
            {data.ticketPerformance.map((ticket, index) => (
              <TicketPerformanceCard key={ticket.ticketId || index} ticket={ticket} />
            ))}
          </View>
        )}

        {data.promoCodePerformance && data.promoCodePerformance.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Promo Code Performance</Text>
            {data.promoCodePerformance.map((promo, index) => (
              <View key={promo.code || index} style={styles.promoCard}>
                <View style={styles.promoHeader}>
                  <Text style={styles.promoCode}>🏷️ {promo.code}</Text>
                  <Text style={styles.promoUsed}>{promo.usedCount} uses</Text>
                </View>
                <Text style={styles.promoStats}>
                  Discount: ₹{(promo.discountTotal / 100).toLocaleString()} • 
                  Generated: ₹{(promo.revenueGenerated / 100).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {data.aiInsights && data.aiInsights.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>AI Insights</Text>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>🤖 AI</Text>
              </View>
            </View>
            {data.aiInsights.map((insight, index) => (
              <InsightCard key={index} insight={insight} index={index} />
            ))}
          </View>
        )}

        {data.comparison && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>vs Previous Event</Text>
            <View style={styles.comparisonCard}>
              <Text style={styles.comparisonTitle}>{data.comparison.eventTitle}</Text>
              <View style={styles.comparisonStats}>
                <View style={styles.comparisonStat}>
                  <Text style={styles.comparisonLabel}>Registrations</Text>
                  <Text style={[
                    styles.comparisonValue,
                    { color: data.comparison.registrationsDiff >= 0 ? COLORS.green : COLORS.red }
                  ]}>
                    {data.comparison.registrationsDiff >= 0 ? '+' : ''}{data.comparison.registrationsDiff}
                    {' '}({data.comparison.registrationsDiffPercentage >= 0 ? '+' : ''}{data.comparison.registrationsDiffPercentage.toFixed(0)}%)
                  </Text>
                </View>
                <View style={styles.comparisonStat}>
                  <Text style={styles.comparisonLabel}>Revenue</Text>
                  <Text style={[
                    styles.comparisonValue,
                    { color: data.comparison.revenueDiff >= 0 ? COLORS.green : COLORS.red }
                  ]}>
                    {data.comparison.revenueDiff >= 0 ? '+' : ''}₹{(data.comparison.revenueDiff / 100).toLocaleString()}
                    {' '}({data.comparison.revenueDiffPercentage >= 0 ? '+' : ''}{data.comparison.revenueDiffPercentage.toFixed(0)}%)
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {data.avgRating && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reviews ({data.reviewCount})</Text>
            <View style={styles.ratingOverview}>
              <Text style={styles.ratingScore}>{data.avgRating.toFixed(1)}</Text>
              <Text style={styles.ratingStars}>{'⭐'.repeat(Math.round(data.avgRating))}</Text>
            </View>
            {data.feedback && data.feedback.slice(0, 3).map((fb, index) => (
              <FeedbackCard key={fb.id || index} feedback={fb} />
            ))}
          </View>
        )}

        <View style={styles.exportSection}>
          <Text style={styles.exportTitle}>Export Data</Text>
          <View style={styles.exportButtons}>
            <TouchableOpacity 
              style={styles.exportBtn}
              onPress={() => handleExport('csv')}
            >
              <Text style={styles.exportBtnIcon}>📊</Text>
              <Text style={styles.exportBtnText}>Export CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.exportBtn}
              onPress={() => handleExport('pdf')}
            >
              <Text style={styles.exportBtnIcon}>📄</Text>
              <Text style={styles.exportBtnText}>Export PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButtonIcon: {
    fontSize: FONT_SIZES.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    gap: SPACING.md,
  },
  errorIcon: {
    fontSize: 48,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
  },
  retryText: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SIZES.listPaddingBottom,
  },
  eventTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  rangeSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  rangeBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  rangeBtnActive: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  rangeBtnText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  rangeBtnTextActive: {
    color: COLORS.white,
    fontWeight: '500',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  aiBadge: {
    backgroundColor: COLORS.violet + '30',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  aiBadgeText: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  statsRow: {
    gap: SPACING.md,
  },
  statCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statIcon: {
    fontSize: FONT_SIZES.xxl,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  statValue: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  statSubValue: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  revenueCard: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  revenueGradient: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  revenueLabel: {
    color: COLORS.white + '80',
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  revenueValue: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  revenueSubtext: {
    color: COLORS.white + '80',
    fontSize: FONT_SIZES.sm,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  insightBox: {
    width: '47%',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  insightBoxIcon: {
    fontSize: FONT_SIZES.xxl,
    marginBottom: SPACING.xs,
  },
  insightBoxValue: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
  },
  insightBoxLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
  },
  ticketPerfCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  ticketPerfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  ticketPerfName: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  ticketPerfPercentage: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  ticketPerfStats: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  ticketPerfStat: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.violet,
    borderRadius: 3,
  },
  ticketPerfInsight: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
  },
  promoCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  promoCode: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  promoUsed: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  promoStats: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  insightCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  insightIcon: {
    fontSize: FONT_SIZES.xl,
  },
  insightText: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
  comparisonCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  comparisonTitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.md,
  },
  comparisonStats: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  comparisonStat: {
    flex: 1,
  },
  comparisonLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    marginBottom: SPACING.xs,
  },
  comparisonValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  ratingOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  ratingScore: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '700',
  },
  ratingStars: {
    fontSize: FONT_SIZES.lg,
  },
  feedbackCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  feedbackName: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  feedbackStars: {
    fontSize: FONT_SIZES.sm,
  },
  feedbackComment: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
  exportSection: {
    marginTop: SPACING.lg,
  },
  exportTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.sm,
  },
  exportBtnIcon: {
    fontSize: FONT_SIZES.lg,
  },
  exportBtnText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
});
