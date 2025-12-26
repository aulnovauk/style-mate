import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, FlatList, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS, SIZES } from '../../constants/theme';
import { useConversations, useCommunicationActions, Conversation as ApiConversation } from '@stylemate/core';

type FilterType = 'all' | 'unread' | 'appointments' | 'inquiries' | 'archived';

interface Conversation {
  id: string;
  clientName: string;
  clientImage?: string;
  lastMessage: string;
  timestamp: string;
  isOnline: boolean;
  isUnread: boolean;
  isPinned: boolean;
  messageType: 'text' | 'image' | 'file';
  category: 'appointment' | 'inquiry' | 'reschedule' | 'confirmed' | 'review' | 'payment' | 'general';
  attachmentName?: string;
  attachmentCount?: number;
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

function mapApiConversation(apiConv: ApiConversation): Conversation {
  return {
    id: apiConv.id,
    clientName: apiConv.clientName,
    lastMessage: apiConv.lastMessage,
    timestamp: formatTimestamp(apiConv.lastMessageAt),
    isOnline: apiConv.isOnline,
    isUnread: apiConv.isUnread,
    isPinned: apiConv.isPinned,
    messageType: apiConv.messageType,
    category: apiConv.category as Conversation['category'],
  };
}


function getCategoryStyle(category: Conversation['category']) {
  switch (category) {
    case 'appointment':
      return { bg: COLORS.violet + '30', text: COLORS.violet, icon: '📅', label: 'Appointment' };
    case 'inquiry':
      return { bg: COLORS.blue + '30', text: COLORS.blue, icon: '❓', label: 'Inquiry' };
    case 'reschedule':
      return { bg: COLORS.amber + '30', text: COLORS.amber, icon: '🕐', label: 'Reschedule' };
    case 'confirmed':
      return { bg: COLORS.green + '30', text: COLORS.green, icon: '✓✓', label: 'Confirmed' };
    case 'review':
      return { bg: COLORS.green + '30', text: COLORS.green, icon: '⭐', label: 'Review' };
    case 'payment':
      return { bg: COLORS.green + '30', text: COLORS.green, icon: '💳', label: 'Payment Received' };
    default:
      return { bg: COLORS.cardBorder + '30', text: COLORS.textSecondary, icon: '💬', label: 'General' };
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface ConversationCardProps {
  conversation: Conversation;
  isPinned?: boolean;
  onPress: () => void;
  onCall: () => void;
  onVideo: () => void;
}

function ConversationCard({ conversation, isPinned, onPress, onCall, onVideo }: ConversationCardProps) {
  const categoryStyle = getCategoryStyle(conversation.category);
  
  const renderMessagePreview = () => {
    if (conversation.messageType === 'image') {
      return (
        <View style={styles.attachmentRow}>
          <Text style={styles.attachmentIcon}>🖼️</Text>
          <Text style={[styles.messagePreview, styles.attachmentText]}>
            Sent {conversation.attachmentCount} photos
          </Text>
        </View>
      );
    }
    if (conversation.messageType === 'file') {
      return (
        <View style={styles.attachmentRow}>
          <Text style={styles.attachmentIcon}>📄</Text>
          <Text style={[styles.messagePreview, styles.attachmentText]}>
            {conversation.attachmentName}
          </Text>
        </View>
      );
    }
    return (
      <Text style={[styles.messagePreview, !conversation.isUnread && styles.messageRead]} numberOfLines={2}>
        {conversation.lastMessage}
      </Text>
    );
  };

  return (
    <TouchableOpacity style={styles.conversationCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.conversationContent}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, isPinned && styles.avatarLarge]}>
            <Text style={[styles.avatarText, isPinned && styles.avatarTextLarge]}>
              {getInitials(conversation.clientName)}
            </Text>
          </View>
          <View style={[
            styles.onlineIndicator,
            isPinned && styles.onlineIndicatorLarge,
            { backgroundColor: conversation.isOnline ? COLORS.green : COLORS.textMuted }
          ]} />
        </View>

        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={styles.clientName}>{conversation.clientName}</Text>
            <Text style={styles.timestamp}>{conversation.timestamp}</Text>
          </View>
          
          {renderMessagePreview()}

          <View style={styles.messageFooter}>
            <View style={styles.categoryContainer}>
              <View style={[styles.categoryBadge, { backgroundColor: categoryStyle.bg }]}>
                <Text style={styles.categoryIcon}>{categoryStyle.icon}</Text>
                <Text style={[styles.categoryText, { color: categoryStyle.text }]}>
                  {categoryStyle.label}
                </Text>
              </View>
              {conversation.isUnread && <View style={styles.unreadDot} />}
            </View>
            
            {isPinned && (
              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.quickActionBtn} onPress={onCall}>
                  <Text style={styles.quickActionIcon}>📞</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionBtn} onPress={onVideo}>
                  <Text style={styles.quickActionIcon}>📹</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ChatInboxScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  
  const { data: conversationsData, loading, error, refetch } = useConversations(activeFilter, searchQuery);
  const { pinConversation, markConversationRead } = useCommunicationActions();
  const [actionError, setActionError] = useState<string | null>(null);
  const [readOverrides, setReadOverrides] = useState<Record<string, boolean>>({});

  const conversations = useMemo(() => {
    if (!conversationsData?.conversations) return [];
    return conversationsData.conversations.map(mapApiConversation).map(conv => ({
      ...conv,
      isUnread: readOverrides[conv.id] !== undefined ? !readOverrides[conv.id] : conv.isUnread,
    }));
  }, [conversationsData, readOverrides]);

  const pinnedConversations = conversations.filter(c => c.isPinned);
  const recentConversations = conversations.filter(c => !c.isPinned);

  const filteredConversations = recentConversations.filter(conv => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!conv.clientName.toLowerCase().includes(query) && 
          !conv.lastMessage.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    switch (activeFilter) {
      case 'unread':
        return conv.isUnread;
      case 'appointments':
        return ['appointment', 'reschedule', 'confirmed'].includes(conv.category);
      case 'inquiries':
        return conv.category === 'inquiry';
      case 'archived':
        return false;
      default:
        return true;
    }
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleConversationPress = async (conversationId: string) => {
    setActionError(null);
    setReadOverrides(prev => ({ ...prev, [conversationId]: true }));
    router.push(`/communication/conversation?id=${conversationId}`);
    try {
      await markConversationRead(conversationId);
      await refetch();
      setReadOverrides({});
    } catch (err) {
      setReadOverrides(prev => {
        const { [conversationId]: _, ...rest } = prev;
        return rest;
      });
      setActionError('Failed to mark as read');
    }
  };
  
  const displayError = error || actionError;

  const handleNotificationsPress = () => {
    router.push('/communication/notifications');
  };

  const stats = conversationsData?.stats;
  const unreadCount = stats?.unread || conversations.filter(c => c.isUnread).length;
  const totalCount = stats?.total || conversations.length;

  const filterOptions = [
    { key: 'all' as FilterType, label: 'All', count: stats?.total || 0 },
    { key: 'unread' as FilterType, label: 'Unread', count: stats?.unread || 0, badgeColor: COLORS.red },
    { key: 'appointments' as FilterType, label: 'Appointments', count: stats?.appointments || 0 },
    { key: 'inquiries' as FilterType, label: 'Inquiries', count: stats?.inquiries || 0 },
    { key: 'archived' as FilterType, label: 'Archived', count: null },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Messages</Text>
              <Text style={styles.headerSubtitle}>{totalCount} conversations</Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationsPress}>
              <Text style={styles.notificationIcon}>🔔</Text>
              {unreadCount > 0 && (
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.notificationBadge}
                >
                  <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>SA</Text>
            </View>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages, clients..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {filterOptions.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setActiveFilter(filter.key)}
              activeOpacity={0.7}
            >
              {activeFilter === filter.key ? (
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.filterButtonActive}
                >
                  <Text style={styles.filterTextActive}>{filter.label}</Text>
                  {filter.count !== null && (
                    <View style={styles.filterCountActive}>
                      <Text style={styles.filterCountTextActive}>{filter.count}</Text>
                    </View>
                  )}
                </LinearGradient>
              ) : (
                <View style={styles.filterButton}>
                  <Text style={styles.filterText}>{filter.label}</Text>
                  {filter.count !== null && (
                    <View style={[
                      styles.filterCount,
                      filter.badgeColor && { backgroundColor: filter.badgeColor }
                    ]}>
                      <Text style={styles.filterCountText}>{filter.count}</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {displayError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorText}>{displayError}</Text>
          {error ? (
            <TouchableOpacity style={styles.errorRetryBtn} onPress={onRefresh}>
              <Text style={styles.errorRetryText}>Retry</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setActionError(null)}>
              <Text style={styles.errorDismiss}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        style={styles.content}
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: Conversation }) => (
          <View style={styles.listItemPadding}>
            <ConversationCard
              conversation={item}
              onPress={() => handleConversationPress(item.id)}
              onCall={() => {}}
              onVideo={() => {}}
            />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        onRefresh={onRefresh}
        refreshing={refreshing}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        ListHeaderComponent={
          !loading && (pinnedConversations.length > 0 || filteredConversations.length > 0) ? (
            <>
              {pinnedConversations.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                      <Text style={styles.pinIcon}>📌</Text>
                      <Text style={styles.sectionTitle}>Pinned</Text>
                    </View>
                    <Text style={styles.sectionCount}>{pinnedConversations.length}</Text>
                  </View>
                  {pinnedConversations.map((conversation: Conversation) => (
                    <ConversationCard
                      key={conversation.id}
                      conversation={conversation}
                      isPinned
                      onPress={() => handleConversationPress(conversation.id)}
                      onCall={() => {}}
                      onVideo={() => {}}
                    />
                  ))}
                </View>
              )}
              <View style={styles.sectionHeaderContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent</Text>
                  <Text style={styles.sectionCount}>{filteredConversations.length} conversations</Text>
                </View>
              </View>
            </>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.violet} />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>No conversations found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try a different search term' : 'Start chatting with your clients'}
              </Text>
            </View>
          )
        }
        ListFooterComponent={<View style={styles.bottomSpacer} />}
        contentContainerStyle={filteredConversations.length === 0 ? styles.emptyListContent : undefined}
      />

      <TouchableOpacity style={styles.newMessageFab} activeOpacity={0.8}>
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Text style={styles.fabIcon}>✏️</Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    paddingBottom: SPACING.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: COLORS.textSecondary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
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
    fontSize: 22,
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.violet,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
  },
  profileAvatarText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  filterScroll: {
    maxHeight: 44,
  },
  filterContainer: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    flexDirection: 'row',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.sm,
  },
  filterButtonActive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.sm,
  },
  filterText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.white,
  },
  filterCount: {
    backgroundColor: COLORS.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  filterCountActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  filterCountText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    color: COLORS.white,
  },
  filterCountTextActive: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    color: COLORS.white,
  },
  content: {
    flex: 1,
  },
  listItemPadding: {
    paddingHorizontal: SPACING.lg,
  },
  sectionHeaderContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  pinIcon: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  conversationCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  conversationContent: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.violet,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  avatarTextLarge: {
    fontSize: FONT_SIZES.lg,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  onlineIndicatorLarge: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  clientName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  timestamp: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  messagePreview: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  messageRead: {
    color: COLORS.textMuted,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  attachmentIcon: {
    fontSize: 14,
  },
  attachmentText: {
    color: COLORS.textSecondary,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  categoryIcon: {
    fontSize: 10,
  },
  categoryText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.red,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quickActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 14,
  },
  loadingContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: SIZES.listPaddingBottom,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.red + '15',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.red + '30',
  },
  errorIcon: {
    fontSize: FONT_SIZES.md,
    color: COLORS.red,
    fontWeight: '700',
    marginRight: SPACING.sm,
  },
  errorText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.red,
  },
  errorDismiss: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.red,
    fontWeight: '300',
    marginLeft: SPACING.sm,
  },
  errorRetryBtn: {
    backgroundColor: COLORS.red,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  errorRetryText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  newMessageFab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
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
    fontSize: 24,
  },
});
