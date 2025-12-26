import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, FlatList, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../../constants/theme';
import { StatusBadge } from '../../../components/marketing/StatusBadge';
import { DeliveryFunnel } from '../../../components/marketing/DeliveryFunnel';
import { MessagePreview } from '../../../components/marketing/MessagePreview';
import { marketingApi, CampaignDetail, CampaignRecipient } from '@stylemate/core/services/businessApi';

const CHANNEL_CONFIG = {
  whatsapp: { icon: '📱', label: 'WhatsApp', color: '#25D366' },
  sms: { icon: '💬', label: 'SMS', color: COLORS.blue },
  both: { icon: '📱💬', label: 'Multi-channel', color: COLORS.violet },
};

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'recipients'>('overview');

  const fetchData = async () => {
    if (!id) return;
    try {
      const [detailRes, recipientsRes] = await Promise.all([
        marketingApi.getCampaignDetail(id),
        marketingApi.getCampaignRecipients(id),
      ]);
      
      if (detailRes.success && detailRes.data) {
        setCampaign(detailRes.data);
      } else {
        setCampaign(getMockCampaign());
      }
      
      if (recipientsRes.success && recipientsRes.data) {
        setRecipients(recipientsRes.data.recipients);
      } else {
        setRecipients(getMockRecipients());
      }
    } catch (err) {
      console.error('Error fetching campaign:', err);
      setCampaign(getMockCampaign());
      setRecipients(getMockRecipients());
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

  const handlePauseResume = async () => {
    if (!campaign) return;
    try {
      if (campaign.status === 'sending') {
        await marketingApi.pauseCampaign(id!);
        setCampaign({ ...campaign, status: 'paused' });
      } else if (campaign.status === 'paused') {
        await marketingApi.resumeCampaign(id!);
        setCampaign({ ...campaign, status: 'sending' });
      }
    } catch {
      Alert.alert('Error', 'Failed to update campaign status');
    }
  };

  const handleDuplicate = async () => {
    try {
      await marketingApi.duplicateCampaign(id!);
      Alert.alert('Success', 'Campaign duplicated', [
        { text: 'OK', onPress: () => router.push('/marketing/campaigns') }
      ]);
    } catch {
      Alert.alert('Error', 'Failed to duplicate campaign');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.violet} />
      </View>
    );
  }

  if (!campaign) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Campaign not found</Text>
      </View>
    );
  }

  const channelConfig = CHANNEL_CONFIG[campaign.channel];

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRecipientStatusIcon = (status: CampaignRecipient['status']) => {
    switch (status) {
      case 'delivered': return '✓';
      case 'read': return '👁️';
      case 'clicked': return '🎯';
      case 'failed': return '❌';
      default: return '⏳';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Campaign Details</Text>
        <TouchableOpacity onPress={handleDuplicate} style={styles.duplicateButton}>
          <Text style={styles.duplicateIcon}>📋</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recipients' && styles.tabActive]}
          onPress={() => setActiveTab('recipients')}
        >
          <Text style={[styles.tabText, activeTab === 'recipients' && styles.tabTextActive]}>
            Recipients ({recipients.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'overview' ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.violet} />
          }
        >
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={styles.heroTitleContainer}>
                <Text style={styles.heroTitle}>{campaign.name}</Text>
                <View style={[styles.channelBadge, { backgroundColor: channelConfig.color + '20' }]}>
                  <Text style={styles.channelIcon}>{channelConfig.icon}</Text>
                  <Text style={[styles.channelLabel, { color: channelConfig.color }]}>
                    {channelConfig.label}
                  </Text>
                </View>
              </View>
              <StatusBadge status={campaign.status} />
            </View>

            {campaign.scheduledAt && campaign.status === 'scheduled' && (
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleIcon}>📅</Text>
                <Text style={styles.scheduleText}>Scheduled: {formatDate(campaign.scheduledAt)}</Text>
              </View>
            )}

            {campaign.sentAt && (
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleIcon}>📤</Text>
                <Text style={styles.scheduleText}>Sent: {formatDate(campaign.sentAt)}</Text>
              </View>
            )}
          </View>

          <DeliveryFunnel
            sent={campaign.sentCount}
            delivered={campaign.deliveredCount}
            read={campaign.readCount}
            clicked={campaign.clickedCount}
          />

          {campaign.attributedRevenue && (
            <View style={styles.revenueCard}>
              <Text style={styles.revenueLabel}>Attributed Revenue</Text>
              <Text style={styles.revenueValue}>{campaign.attributedRevenue.formatted}</Text>
              <Text style={styles.revenueNote}>7-day attribution window</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Message</Text>
            <MessagePreview
              message={campaign.message}
              channel={campaign.channel === 'both' ? 'whatsapp' : campaign.channel}
              variables={{ name: 'Customer', link: 'book.stylemate.com' }}
            />
          </View>

          {(campaign.status === 'sending' || campaign.status === 'paused') && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handlePauseResume}
            >
              <Text style={styles.actionIcon}>
                {campaign.status === 'sending' ? '⏸️' : '▶️'}
              </Text>
              <Text style={styles.actionText}>
                {campaign.status === 'sending' ? 'Pause Campaign' : 'Resume Campaign'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ height: SPACING.xl }} />
        </ScrollView>
      ) : (
        <FlatList
          data={recipients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.recipientsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.violet} />
          }
          renderItem={({ item }) => (
            <View style={styles.recipientCard}>
              <View style={styles.recipientInfo}>
                <Text style={styles.recipientName}>{item.name}</Text>
                <Text style={styles.recipientPhone}>{item.phone}</Text>
              </View>
              <View style={styles.recipientStatus}>
                <Text style={styles.recipientStatusIcon}>
                  {getRecipientStatusIcon(item.status)}
                </Text>
                <Text style={styles.recipientStatusText}>{item.status}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No recipients yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function getMockCampaign(): CampaignDetail {
  return {
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
    message: 'Hi {name}! Happy New Year! Enjoy 20% off on all services this week. Book now: {link}',
    variables: ['name', 'link'],
    audience: { type: 'all' },
    recipients: [],
    createdAt: '2024-12-30T10:00:00Z',
    updatedAt: '2025-01-01T09:15:00Z',
  };
}

function getMockRecipients(): CampaignRecipient[] {
  return [
    { id: '1', name: 'Priya Sharma', phone: '+91 98765 43210', status: 'clicked', deliveredAt: '2025-01-01T09:01:00Z', readAt: '2025-01-01T09:05:00Z', clickedAt: '2025-01-01T09:06:00Z' },
    { id: '2', name: 'Rahul Patel', phone: '+91 98765 43211', status: 'read', deliveredAt: '2025-01-01T09:01:00Z', readAt: '2025-01-01T09:10:00Z' },
    { id: '3', name: 'Anjali Singh', phone: '+91 98765 43212', status: 'delivered', deliveredAt: '2025-01-01T09:02:00Z' },
    { id: '4', name: 'Vikram Mehta', phone: '+91 98765 43213', status: 'failed' },
    { id: '5', name: 'Neha Gupta', phone: '+91 98765 43214', status: 'clicked', deliveredAt: '2025-01-01T09:01:00Z', readAt: '2025-01-01T09:08:00Z', clickedAt: '2025-01-01T09:09:00Z' },
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
  duplicateButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  duplicateIcon: {
    fontSize: 20,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.violet,
  },
  tabText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.violet,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTitleContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  heroTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
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
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  scheduleIcon: {
    fontSize: FONT_SIZES.md,
  },
  scheduleText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  revenueCard: {
    backgroundColor: COLORS.green + '10',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginVertical: SPACING.lg,
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  revenueValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.green,
  },
  revenueNote: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
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
  actionIcon: {
    fontSize: 18,
  },
  actionText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  recipientsList: {
    paddingHorizontal: SPACING.lg,
  },
  recipientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  recipientInfo: {},
  recipientName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  recipientPhone: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  recipientStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  recipientStatusIcon: {
    fontSize: FONT_SIZES.sm,
  },
  recipientStatusText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
});
