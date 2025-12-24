import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  COLORS,
  GRADIENTS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SIZES,
} from '../../constants/theme';
import { useClients, useDashboard } from '@stylemate/core/hooks/useBusinessApi';
import { useUnreadNotificationCount } from '@stylemate/core/hooks/useQueries';

type FilterType = 'all' | 'vip' | 'regular' | 'new' | 'inactive';

interface ClientListItem {
  id?: string;
  userId?: string | null;
  name: string;
  phone: string;
  email: string | null;
  visits: number;
  lastVisit: string;
  completedVisits: number;
  tag: 'VIP' | 'Regular' | 'New';
}

interface ClientCardProps {
  client: ClientListItem;
  onPress: () => void;
}

function ClientCard({ client, onPress }: ClientCardProps) {
  const initials = client.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getTagStyle = () => {
    switch (client.tag) {
      case 'VIP':
        return { bg: `${COLORS.amber}20`, color: COLORS.amber, icon: '👑' };
      case 'New':
        return { bg: `${COLORS.blue}20`, color: COLORS.blue, icon: '✨' };
      default:
        return { bg: `${COLORS.green}20`, color: COLORS.green, icon: '🔄' };
    }
  };

  const tagStyle = getTagStyle();

  return (
    <TouchableOpacity style={styles.clientCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.clientAvatar}>
        <Text style={styles.clientAvatarText}>{initials}</Text>
        {client.tag === 'VIP' && (
          <View style={styles.vipBadge}>
            <Text style={styles.vipBadgeText}>👑</Text>
          </View>
        )}
      </View>
      <View style={styles.clientInfo}>
        <View style={styles.clientNameRow}>
          <Text style={styles.clientName} numberOfLines={1}>
            {client.name}
          </Text>
          <View style={[styles.tagBadge, { backgroundColor: tagStyle.bg }]}>
            <Text style={[styles.tagText, { color: tagStyle.color }]}>{client.tag}</Text>
          </View>
        </View>
        <Text style={styles.clientPhone}>{client.phone}</Text>
        <Text style={styles.clientMeta}>
          {client.visits} visit{client.visits !== 1 ? 's' : ''} • Last: {client.lastVisit || 'Never'}
        </Text>
      </View>
      <View style={styles.chevron}>
        <Text style={styles.chevronText}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

interface StatsCardProps {
  icon: string;
  iconBg: string;
  iconColor: string;
  value: number | string;
  label: string;
  valueColor?: string;
}

function StatsCard({ icon, iconBg, iconColor, value, label, valueColor }: StatsCardProps) {
  return (
    <View style={styles.statsCard}>
      <View style={[styles.statsIconContainer, { backgroundColor: iconBg }]}>
        <Text style={[styles.statsIcon, { color: iconColor }]}>{icon}</Text>
      </View>
      <Text style={[styles.statsValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
      <Text style={styles.statsLabel}>{label}</Text>
    </View>
  );
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function ClientsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, loading, error, refetch } = useClients(searchQuery || undefined);
  const { data: dashboardData } = useDashboard();
  const { data: notificationData } = useUnreadNotificationCount();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const clients = data?.clients || [];
  const totalClients = data?.total || 0;

  const clientStats = useMemo(() => {
    const vipCount = clients.filter((c) => c.tag === 'VIP').length;
    const newCount = clients.filter((c) => c.tag === 'New').length;
    const activeCount = clients.filter(
      (c) => c.lastVisit && new Date(c.lastVisit) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    ).length;
    return { vipCount, newCount, activeCount };
  }, [clients]);

  const filteredClients = useMemo(() => {
    let result = clients;

    if (filter === 'vip') {
      result = result.filter((c) => c.tag === 'VIP');
    } else if (filter === 'new') {
      result = result.filter((c) => c.tag === 'New');
    } else if (filter === 'regular') {
      result = result.filter((c) => c.tag === 'Regular');
    } else if (filter === 'inactive') {
      result = result.filter(
        (c) => !c.lastVisit || new Date(c.lastVisit) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      );
    }

    if (selectedLetter) {
      result = result.filter((c) => c.name.toUpperCase().startsWith(selectedLetter));
    }

    return result;
  }, [clients, filter, selectedLetter]);

  const filterOptions: { key: FilterType; label: string; icon: string; iconColor: string }[] = [
    { key: 'all', label: 'All Clients', icon: '👥', iconColor: COLORS.violet },
    { key: 'vip', label: 'VIP', icon: '👑', iconColor: COLORS.amber },
    { key: 'regular', label: 'Regular', icon: '🔄', iconColor: COLORS.green },
    { key: 'new', label: 'New', icon: '✨', iconColor: COLORS.blue },
    { key: 'inactive', label: 'Inactive', icon: '⏰', iconColor: COLORS.textMuted },
  ];

  const handleClientPress = (client: ClientListItem) => {
    const clientId = client.id || client.userId;
    if (clientId) {
      router.push(`/clients/${clientId}`);
    }
  };

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading clients...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Unable to load clients</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <LinearGradient colors={GRADIENTS.primary} style={styles.retryButtonGradient}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient colors={GRADIENTS.primary} style={styles.logoContainer}>
            <Text style={styles.logoIcon}>✂️</Text>
          </LinearGradient>
          <View style={styles.headerInfo}>
            {dashboardData?.salon?.name ? (
              <Text style={styles.salonName}>{dashboardData.salon.name}</Text>
            ) : (
              <View style={styles.salonNamePlaceholder} />
            )}
            <Text style={styles.branchName}>Client Management</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
            {notificationData?.count > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notificationData.count > 9 ? '9+' : notificationData.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone, email..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {error && data && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity onPress={refetch}>
            <Text style={styles.errorBannerRetry}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.id || item.userId || item.phone}
        renderItem={({ item }) => (
          <ClientCard client={item} onPress={() => handleClientPress(item)} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.violet}
          />
        }
        ListHeaderComponent={
          <>
            {/* Stats Cards */}
            <View style={styles.statsRow}>
              <StatsCard
                icon="👥"
                iconBg={`${COLORS.violet}30`}
                iconColor={COLORS.violet}
                value={totalClients}
                label="Total"
              />
              <StatsCard
                icon="✅"
                iconBg={`${COLORS.green}20`}
                iconColor={COLORS.green}
                value={clientStats.activeCount}
                label="Active"
                valueColor={COLORS.green}
              />
              <StatsCard
                icon="✨"
                iconBg={`${COLORS.blue}20`}
                iconColor={COLORS.blue}
                value={clientStats.newCount}
                label="New"
                valueColor={COLORS.blue}
              />
            </View>

            {/* Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
              style={styles.filterContainer}
            >
              {filterOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.filterChip, filter === opt.key && styles.filterChipActive]}
                  onPress={() => setFilter(opt.key)}
                >
                  <Text style={styles.filterIcon}>{opt.icon}</Text>
                  <Text style={[styles.filterText, filter === opt.key && styles.filterTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Quick Actions */}
            <TouchableOpacity
              style={styles.addClientCard}
              onPress={() => router.push('/clients/add-edit')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[`${COLORS.violet}30`, `${COLORS.fuchsia}20`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addClientGradient}
              >
                <View style={styles.addClientInfo}>
                  <Text style={styles.addClientTitle}>Add New Client</Text>
                  <Text style={styles.addClientSubtitle}>Build your client database</Text>
                </View>
                <LinearGradient
                  colors={GRADIENTS.primary}
                  style={styles.addClientButton}
                >
                  <Text style={styles.addClientButtonText}>+</Text>
                </LinearGradient>
              </LinearGradient>
            </TouchableOpacity>

            {/* More Actions Row */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/clients/import')}
              >
                <Text style={styles.actionButtonIcon}>📥</Text>
                <Text style={styles.actionButtonText}>Import</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/clients/campaign-assignment')}
              >
                <Text style={styles.actionButtonIcon}>📣</Text>
                <Text style={styles.actionButtonText}>Campaigns</Text>
              </TouchableOpacity>
            </View>

            {/* Alphabet Index */}
            <View style={styles.alphabetSection}>
              <View style={styles.alphabetHeader}>
                <Text style={styles.sectionTitle}>Client Directory</Text>
                <Text style={styles.clientCount}>{filteredClients.length} clients</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.alphabetScroll}
              >
                <TouchableOpacity
                  style={[styles.alphabetButton, !selectedLetter && styles.alphabetButtonActive]}
                  onPress={() => setSelectedLetter(null)}
                >
                  <Text
                    style={[styles.alphabetText, !selectedLetter && styles.alphabetTextActive]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {ALPHABET.map((letter) => (
                  <TouchableOpacity
                    key={letter}
                    style={[
                      styles.alphabetButton,
                      selectedLetter === letter && styles.alphabetButtonActive,
                    ]}
                    onPress={() => setSelectedLetter(letter)}
                  >
                    <Text
                      style={[
                        styles.alphabetText,
                        selectedLetter === letter && styles.alphabetTextActive,
                      ]}
                    >
                      {letter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No clients found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || filter !== 'all' || selectedLetter
                ? 'Try adjusting your search or filters'
                : 'Add your first client to get started'}
            </Text>
            {!searchQuery && filter === 'all' && !selectedLetter && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/clients/add-edit')}
              >
                <LinearGradient colors={GRADIENTS.primary} style={styles.emptyButtonGradient}>
                  <Text style={styles.emptyButtonText}>Add Client</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorIcon: {
    fontSize: SIZES.emojiLarge,
    marginBottom: SPACING.lg,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  retryButton: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  retryButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${COLORS.red}20`,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  errorBannerText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.red,
  },
  errorBannerRetry: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.violet,
    marginLeft: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  logoContainer: {
    width: SIZES.iconLarge,
    height: SIZES.iconLarge,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: FONT_SIZES.lg,
  },
  headerInfo: {
    gap: SPACING.micro,
  },
  salonName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  salonNamePlaceholder: {
    width: SIZES.placeholderWidth,
    height: FONT_SIZES.md,
    backgroundColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.sm,
  },
  branchName: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationIcon: {
    fontSize: FONT_SIZES.xl,
  },
  notificationBadge: {
    position: 'absolute',
    top: -SPACING.xs,
    right: -SPACING.xs,
    width: SIZES.iconSmall,
    height: SIZES.iconSmall,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.violet,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.white,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    height: SIZES.inputHeight,
  },
  searchIcon: {
    fontSize: FONT_SIZES.md,
    marginRight: SPACING.md,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  clearIcon: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    padding: SPACING.xs,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  statsCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statsIconContainer: {
    width: SIZES.iconXLarge,
    height: SIZES.iconXLarge,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statsIcon: {
    fontSize: FONT_SIZES.xl,
  },
  statsValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statsLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  filterContainer: {
    marginTop: SPACING.lg,
  },
  filterScroll: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.sm,
  },
  filterChipActive: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  filterIcon: {
    fontSize: FONT_SIZES.sm,
  },
  filterText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  addClientCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${COLORS.violet}40`,
  },
  addClientGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  addClientInfo: {
    flex: 1,
  },
  addClientTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  addClientSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  addClientButton: {
    width: SIZES.buttonLarge,
    height: SIZES.buttonLarge,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addClientButtonText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '400',
    color: COLORS.white,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.sm,
  },
  actionButtonIcon: {
    fontSize: FONT_SIZES.md,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  alphabetSection: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  alphabetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  clientCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  alphabetScroll: {
    gap: SPACING.xs,
    paddingBottom: SPACING.md,
  },
  alphabetButton: {
    width: SIZES.buttonSmall,
    height: SIZES.buttonSmall,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  alphabetButtonActive: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  alphabetText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  alphabetTextActive: {
    color: COLORS.white,
  },
  listContent: {
    paddingBottom: SIZES.listPaddingBottom,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  clientAvatar: {
    width: SIZES.avatarMedium,
    height: SIZES.avatarMedium,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  clientAvatarText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  vipBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: SIZES.iconSmall,
    height: SIZES.iconSmall,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vipBadgeText: {
    fontSize: FONT_SIZES.xs,
  },
  clientInfo: {
    flex: 1,
  },
  clientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.micro,
  },
  clientName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  tagBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.micro,
    borderRadius: BORDER_RADIUS.sm,
  },
  tagText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  clientPhone: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  clientMeta: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  chevron: {
    paddingLeft: SPACING.sm,
  },
  chevronText: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SIZES.iconXLarge,
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    fontSize: SIZES.emojiLarge,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  emptyButton: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  emptyButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
});
