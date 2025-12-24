import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  COLORS,
  GRADIENTS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from '../../constants/theme';
import {
  useCampaigns,
  useCampaignAssignment,
  useCampaignActions,
} from '@stylemate/core/hooks/useBusinessApi';
import type { MarketingCampaign, CampaignTarget } from '@stylemate/core/services/businessApi';

type FilterType = 'all' | 'assigned' | 'unassigned' | 'vip' | 'new';

function CampaignCard({
  campaign,
  isSelected,
  onPress,
}: {
  campaign: MarketingCampaign;
  isSelected: boolean;
  onPress: () => void;
}) {
  const getStatusColor = () => {
    switch (campaign.status) {
      case 'active': return COLORS.green;
      case 'scheduled': return COLORS.blue;
      case 'completed': return COLORS.textMuted;
      case 'paused': return COLORS.amber;
      default: return COLORS.textSecondary;
    }
  };

  const getTypeIcon = () => {
    switch (campaign.type) {
      case 'sms': return '💬';
      case 'email': return '📧';
      case 'whatsapp': return '📱';
      case 'push': return '🔔';
      default: return '📢';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.campaignCard, isSelected && styles.campaignCardSelected]}
      onPress={onPress}
    >
      <View style={styles.campaignHeader}>
        <Text style={styles.campaignIcon}>{getTypeIcon()}</Text>
        <View style={styles.campaignInfo}>
          <Text style={styles.campaignName}>{campaign.name}</Text>
          <Text style={styles.campaignType}>{campaign.type.toUpperCase()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}20` }]}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {campaign.status}
          </Text>
        </View>
      </View>
      <Text style={styles.campaignDescription} numberOfLines={2}>
        {campaign.description}
      </Text>
      <View style={styles.campaignStats}>
        <Text style={styles.campaignStat}>
          {campaign.targetCount} targets
        </Text>
        {campaign.sentCount > 0 && (
          <Text style={styles.campaignStat}>
            {campaign.sentCount} sent
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function ClientRow({
  client,
  onToggle,
}: {
  client: CampaignTarget;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity style={styles.clientRow} onPress={onToggle}>
      <View style={styles.clientAvatar}>
        <Text style={styles.clientInitials}>
          {client.clientName.split(' ').map(n => n[0]).join('').substring(0, 2)}
        </Text>
      </View>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{client.clientName}</Text>
        <Text style={styles.clientContact}>{client.phone}</Text>
        {client.email && (
          <Text style={styles.clientContact}>{client.email}</Text>
        )}
      </View>
      <View style={[styles.checkbox, client.isAssigned && styles.checkboxChecked]}>
        {client.isAssigned && <Text style={styles.checkmark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
}

export default function CampaignAssignmentScreen() {
  const { campaignId } = useLocalSearchParams<{ campaignId?: string }>();
  const router = useRouter();

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>(campaignId);
  
  const { data: campaignsData, loading: loadingCampaigns, error: campaignsError } = useCampaigns();
  const {
    data: assignmentData,
    loading: loadingAssignment,
    error: assignmentError,
    refetch: refetchAssignment,
  } = useCampaignAssignment(selectedCampaignId);
  const { updateAssignment, isUpdating } = useCampaignActions();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [localTargets, setLocalTargets] = useState<CampaignTarget[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!selectedCampaignId) {
      setLocalTargets([]);
      setHasChanges(false);
    }
  }, [selectedCampaignId]);

  useEffect(() => {
    if (assignmentData?.targets && selectedCampaignId) {
      setLocalTargets(assignmentData.targets);
      setHasChanges(false);
      setIsRefreshing(false);
    }
  }, [assignmentData, selectedCampaignId]);

  const filteredTargets = useMemo(() => {
    let result = localTargets;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        t =>
          t.clientName.toLowerCase().includes(query) ||
          t.phone.includes(query) ||
          (t.email && t.email.toLowerCase().includes(query))
      );
    }

    switch (filter) {
      case 'assigned':
        result = result.filter(t => t.isAssigned);
        break;
      case 'unassigned':
        result = result.filter(t => !t.isAssigned);
        break;
    }

    return result;
  }, [localTargets, searchQuery, filter]);

  const assignedCount = localTargets.filter(t => t.isAssigned).length;

  const handleToggleClient = (clientId: string) => {
    setLocalTargets(prev =>
      prev.map(t =>
        t.clientId === clientId ? { ...t, isAssigned: !t.isAssigned } : t
      )
    );
    setHasChanges(true);
  };

  const handleSelectAll = () => {
    const allFilteredIds = new Set(filteredTargets.map(t => t.clientId));
    const allAssigned = filteredTargets.every(t => t.isAssigned);

    setLocalTargets(prev =>
      prev.map(t => ({
        ...t,
        isAssigned: allFilteredIds.has(t.clientId) ? !allAssigned : t.isAssigned,
      }))
    );
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedCampaignId) return;

    const original = assignmentData?.targets || [];
    const originalAssigned = new Set(original.filter(t => t.isAssigned).map(t => t.clientId));
    const currentAssigned = new Set(localTargets.filter(t => t.isAssigned).map(t => t.clientId));

    const toAdd = localTargets.filter(t => t.isAssigned && !originalAssigned.has(t.clientId));
    const toRemove = original.filter(t => t.isAssigned && !currentAssigned.has(t.clientId));

    const promises: Promise<any>[] = [];

    if (toAdd.length > 0) {
      promises.push(
        updateAssignment({
          campaignId: selectedCampaignId,
          clientIds: toAdd.map(t => t.clientId),
          action: 'add',
        })
      );
    }

    if (toRemove.length > 0) {
      promises.push(
        updateAssignment({
          campaignId: selectedCampaignId,
          clientIds: toRemove.map(t => t.clientId),
          action: 'remove',
        })
      );
    }

    if (promises.length === 0) {
      setHasChanges(false);
      return;
    }

    const results = await Promise.all(promises);
    const hasError = results.some(r => !r.success);

    if (hasError) {
      Alert.alert('Error', 'Some changes could not be saved. Please try again.');
    } else {
      Alert.alert('Success', `Campaign targets updated. ${assignedCount} clients assigned.`);
      setHasChanges(false);
      refetchAssignment();
    }
  };

  const handleCampaignSelect = (id: string) => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to discard them?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setLocalTargets([]);
              setIsRefreshing(true);
              setSelectedCampaignId(id);
              setHasChanges(false);
            },
          },
        ]
      );
    } else {
      setLocalTargets([]);
      setIsRefreshing(true);
      setSelectedCampaignId(id);
    }
  };

  const handleBackToCampaignList = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to discard them?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setLocalTargets([]);
              setSelectedCampaignId(undefined);
              setHasChanges(false);
            },
          },
        ]
      );
    } else {
      setLocalTargets([]);
      setSelectedCampaignId(undefined);
    }
  };

  const isLoading = loadingCampaigns || loadingAssignment || isRefreshing;
  const error = campaignsError || assignmentError;

  if (isLoading && !campaignsData && !assignmentData) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen
          options={{
            title: 'Campaign Assignment',
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.background },
            headerTintColor: COLORS.textPrimary,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading campaigns...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen
          options={{
            title: 'Campaign Assignment',
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.background },
            headerTintColor: COLORS.textPrimary,
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetchAssignment}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const campaigns = campaignsData?.campaigns || [];
  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  if (!selectedCampaignId || !selectedCampaign) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen
          options={{
            title: 'Campaign Assignment',
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.background },
            headerTintColor: COLORS.textPrimary,
          }}
        />
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Select a Campaign</Text>
          <Text style={styles.sectionDescription}>
            Choose a campaign to manage client assignments
          </Text>

          {campaigns.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📢</Text>
              <Text style={styles.emptyTitle}>No Campaigns</Text>
              <Text style={styles.emptyDescription}>
                Create a marketing campaign first to assign clients
              </Text>
            </View>
          ) : (
            <FlatList
              data={campaigns}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <CampaignCard
                  campaign={item}
                  isSelected={item.id === selectedCampaignId}
                  onPress={() => handleCampaignSelect(item.id)}
                />
              )}
              contentContainerStyle={styles.campaignList}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const isLoadingAssignmentData = selectedCampaignId && (loadingAssignment || isRefreshing);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Campaign Assignment',
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.textPrimary,
          headerRight: () => (
            <TouchableOpacity onPress={handleBackToCampaignList}>
              <Text style={styles.changeBtn}>Change</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.campaignBanner}>
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.campaignBannerGradient}
        >
          <Text style={styles.campaignBannerName}>{selectedCampaign.name}</Text>
          <Text style={styles.campaignBannerType}>
            {selectedCampaign.type.toUpperCase()} Campaign
          </Text>
        </LinearGradient>
      </View>

      {isLoadingAssignmentData ? (
        <View style={styles.loadingAssignmentContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading client assignments...</Text>
        </View>
      ) : (
        <>
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{localTargets.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.green }]}>{assignedCount}</Text>
              <Text style={styles.statLabel}>Assigned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{localTargets.length - assignedCount}</Text>
              <Text style={styles.statLabel}>Unassigned</Text>
            </View>
          </View>

          <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search clients..."
            placeholderTextColor={COLORS.textMuted}
          />
        </View>
      </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContainer}
          >
            {(['all', 'assigned', 'unassigned'] as FilterType[]).map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, filter === f && styles.filterChipActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>
              {filteredTargets.length} client{filteredTargets.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity onPress={handleSelectAll} disabled={localTargets.length === 0}>
              <Text style={[styles.selectAllText, localTargets.length === 0 && { opacity: 0.5 }]}>
                {filteredTargets.every(t => t.isAssigned) ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredTargets}
            keyExtractor={item => item.clientId}
            renderItem={({ item }) => (
              <ClientRow client={item} onToggle={() => handleToggleClient(item.clientId)} />
            )}
            style={styles.clientList}
            contentContainerStyle={styles.clientListContent}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Text style={styles.emptyListText}>No clients found</Text>
              </View>
            }
          />
        </>
      )}

      {hasChanges && !isLoadingAssignmentData && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveChanges}
            disabled={isUpdating}
          >
            <LinearGradient
              colors={isUpdating ? GRADIENTS.disabled : GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              {isUpdating ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>
                  Save Changes ({assignedCount} assigned)
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
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
  },
  loadingAssignmentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorIcon: {
    fontSize: FONT_SIZES.xxxl + 16,
    marginBottom: SPACING.lg,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  retryButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.violet,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  sectionDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  campaignList: {
    paddingBottom: SPACING.xxl,
  },
  campaignCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  campaignCardSelected: {
    borderColor: COLORS.violet,
  },
  campaignHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  campaignIcon: {
    fontSize: FONT_SIZES.xxl,
    marginRight: SPACING.md,
  },
  campaignInfo: {
    flex: 1,
  },
  campaignName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  campaignType: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  campaignDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  campaignStats: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  campaignStat: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyIcon: {
    fontSize: FONT_SIZES.xxxl * 2,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  changeBtn: {
    fontSize: FONT_SIZES.md,
    color: COLORS.violet,
    fontWeight: '600',
  },
  campaignBanner: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  campaignBannerGradient: {
    padding: SPACING.lg,
  },
  campaignBannerName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  campaignBannerType: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textOnGradient,
    marginTop: 2,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.cardBorder,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  searchIcon: {
    fontSize: FONT_SIZES.lg,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  filterScroll: {
    maxHeight: 50,
  },
  filterContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
  },
  filterChipActive: {
    backgroundColor: COLORS.violet,
  },
  filterText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.white,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  listHeaderText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  selectAllText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.violet,
    fontWeight: '600',
  },
  clientList: {
    flex: 1,
  },
  clientListContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  clientInitials: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  clientContact: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.sm - 2,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  emptyList: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  saveButton: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
});
