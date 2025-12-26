import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useCallback } from 'react';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../../constants/theme';
import { SegmentedTabs } from '../../../components/marketing/SegmentedTabs';
import { CampaignCard } from '../../../components/marketing/CampaignCard';
import { QuotaMeter } from '../../../components/marketing/QuotaMeter';
import { marketingApi, CampaignDashboardResponse, CampaignSummary } from '@stylemate/core/services/businessApi';

type TabValue = 'one_time' | 'automated' | 'scheduled';

export default function CampaignsScreen() {
  const [activeTab, setActiveTab] = useState<TabValue>('one_time');
  const [dashboard, setDashboard] = useState<CampaignDashboardResponse | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [dashboardRes, campaignsRes] = await Promise.all([
        marketingApi.getCampaignsDashboard(),
        marketingApi.getCampaignsList(),
      ]);
      
      if (dashboardRes.success && dashboardRes.data) {
        setDashboard(dashboardRes.data);
      } else {
        setDashboard(getMockDashboard());
      }
      
      if (campaignsRes.success && campaignsRes.data) {
        setCampaigns(campaignsRes.data.campaigns);
      } else {
        setCampaigns(getMockCampaigns());
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setDashboard(getMockDashboard());
      setCampaigns(getMockCampaigns());
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

  const tabs = [
    { label: 'One-Time', value: 'one_time' },
    { label: 'Automated', value: 'automated' },
    { label: 'Scheduled', value: 'scheduled' },
  ];

  const filteredCampaigns = campaigns.filter(campaign => {
    if (activeTab === 'scheduled') return campaign.status === 'scheduled';
    if (activeTab === 'automated') return false;
    return campaign.status !== 'scheduled';
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.violet} />
      </View>
    );
  }

  const quota = dashboard?.quota || getMockDashboard().quota;
  const stats = dashboard?.stats || getMockDashboard().stats;
  const suggestions = dashboard?.suggestions || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Campaigns</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.violet} />
        }
      >
        <QuotaMeter
          used={quota.used}
          total={quota.total}
          resetDate={quota.resetDate}
        />

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalSent}</Text>
            <Text style={styles.statLabel}>Sent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.readRate}%</Text>
            <Text style={styles.statLabel}>Read Rate</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.clickRate}%</Text>
            <Text style={styles.statLabel}>Click Rate</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.green }]}>{stats.attributedRevenue.formatted}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
        </View>

        {suggestions.length > 0 && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.sectionTitle}>💡 Smart Suggestions</Text>
            {suggestions.map((suggestion, index) => (
              <View key={index} style={styles.suggestionCard}>
                <View style={styles.suggestionHeader}>
                  <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                  <View style={styles.targetBadge}>
                    <Text style={styles.targetText}>{suggestion.targetCount} clients</Text>
                  </View>
                </View>
                <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                <TouchableOpacity
                  style={styles.suggestionAction}
                  onPress={() => router.push('/marketing/campaigns/create')}
                >
                  <Text style={styles.suggestionActionText}>{suggestion.suggestedAction} →</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.tabsContainer}>
          <SegmentedTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(value) => setActiveTab(value as TabValue)}
          />
        </View>

        {activeTab === 'automated' ? (
          <View style={styles.automatedSection}>
            <Text style={styles.automatedIcon}>🤖</Text>
            <Text style={styles.automatedTitle}>Automated Campaigns</Text>
            <Text style={styles.automatedDescription}>
              Set up automated workflows to send messages based on triggers like birthdays, win-back, or rebook reminders.
            </Text>
            <TouchableOpacity
              style={styles.automatedButton}
              onPress={() => router.push('/marketing/automations')}
            >
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.automatedButtonGradient}
              >
                <Text style={styles.automatedButtonText}>Manage Automations</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : filteredCampaigns.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📱</Text>
            <Text style={styles.emptyTitle}>No campaigns yet</Text>
            <Text style={styles.emptyText}>
              Create your first campaign to reach your customers via WhatsApp or SMS
            </Text>
          </View>
        ) : (
          filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              {...campaign}
              onPress={() => router.push(`/marketing/campaigns/${campaign.id}`)}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/marketing/campaigns/create')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={GRADIENTS.primary}
          style={styles.fabGradient}
        >
          <Text style={styles.fabIcon}>+</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function getMockDashboard(): CampaignDashboardResponse {
  return {
    stats: {
      totalSent: 1250,
      readRate: 78,
      clickRate: 23,
      attributedRevenue: { value: 32400, formatted: '₹32,400' },
    },
    quota: {
      used: 1250,
      total: 2500,
      resetDate: '2025-02-01',
    },
    suggestions: [
      {
        type: 'win_back',
        title: 'Win Back Inactive Clients',
        description: '45 clients haven\'t visited in 60+ days. Send a special offer.',
        targetCount: 45,
        suggestedAction: 'Create Campaign',
      },
    ],
    recentCampaigns: [],
  };
}

function getMockCampaigns(): CampaignSummary[] {
  return [
    {
      id: '1',
      name: 'New Year Promo Blast',
      channel: 'whatsapp',
      status: 'completed',
      targetCount: 450,
      sentCount: 445,
      deliveredCount: 438,
      readCount: 342,
      clickedCount: 87,
      sentAt: '2025-01-01T09:00:00Z',
      completedAt: '2025-01-01T09:15:00Z',
      attributedRevenue: { value: 18500, formatted: '₹18,500' },
    },
    {
      id: '2',
      name: 'Weekend Flash Sale',
      channel: 'sms',
      status: 'scheduled',
      targetCount: 320,
      sentCount: 0,
      deliveredCount: 0,
      readCount: 0,
      clickedCount: 0,
      scheduledAt: '2025-01-11T10:00:00Z',
    },
    {
      id: '3',
      name: 'Holiday Greetings',
      channel: 'both',
      status: 'completed',
      targetCount: 580,
      sentCount: 574,
      deliveredCount: 568,
      readCount: 445,
      clickedCount: 112,
      sentAt: '2024-12-25T08:00:00Z',
      completedAt: '2024-12-25T08:30:00Z',
      attributedRevenue: { value: 13900, formatted: '₹13,900' },
    },
  ];
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
    paddingTop: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
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
    marginTop: SPACING.xs,
  },
  suggestionsSection: {
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  suggestionCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.violet,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  suggestionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  targetBadge: {
    backgroundColor: COLORS.violet + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  targetText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.violet,
  },
  suggestionDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  suggestionAction: {},
  suggestionActionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.violet,
  },
  tabsContainer: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  automatedSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
  },
  automatedIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  automatedTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  automatedDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  automatedButton: {},
  automatedButtonGradient: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  automatedButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.lg,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.violet,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 28,
    color: COLORS.white,
    lineHeight: 32,
  },
});
