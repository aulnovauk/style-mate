import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS, SIZES } from '../../constants/theme';
import { useConversation, useCommunicationActions, ChatMessage as ApiMessage } from '@stylemate/core';

interface Message {
  id: string;
  text: string;
  timestamp: string;
  isFromClient: boolean;
  type: 'text' | 'image' | 'file' | 'appointment' | 'system';
  attachmentUrl?: string;
  attachmentName?: string;
  appointmentDetails?: {
    service: string;
    date: string;
    time: string;
    staff: string;
  };
  status?: 'sent' | 'delivered' | 'read';
}

interface Client {
  id: string;
  name: string;
  phone: string;
  isOnline: boolean;
  lastSeen?: string;
}

function formatMessageTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function mapApiMessage(apiMsg: ApiMessage): Message {
  return {
    id: apiMsg.id,
    text: apiMsg.text,
    timestamp: formatMessageTime(apiMsg.timestamp),
    isFromClient: apiMsg.isFromClient,
    type: apiMsg.type as Message['type'],
    status: apiMsg.status,
    attachmentUrl: apiMsg.attachmentUrl,
    attachmentName: apiMsg.attachmentName,
  };
}

const QUICK_REPLIES = [
  'Thank you for reaching out!',
  'Your appointment is confirmed',
  'We will get back to you shortly',
  'Please share more details',
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isClient = message.isFromClient;

  const renderContent = () => {
    if (message.type === 'appointment' && message.appointmentDetails) {
      return (
        <View style={styles.appointmentCard}>
          <View style={styles.appointmentHeader}>
            <Text style={styles.appointmentIcon}>📅</Text>
            <Text style={styles.appointmentTitle}>Appointment Scheduled</Text>
          </View>
          <View style={styles.appointmentDetails}>
            <View style={styles.appointmentRow}>
              <Text style={styles.appointmentLabel}>Service</Text>
              <Text style={styles.appointmentValue}>{message.appointmentDetails.service}</Text>
            </View>
            <View style={styles.appointmentRow}>
              <Text style={styles.appointmentLabel}>Date</Text>
              <Text style={styles.appointmentValue}>{message.appointmentDetails.date}</Text>
            </View>
            <View style={styles.appointmentRow}>
              <Text style={styles.appointmentLabel}>Time</Text>
              <Text style={styles.appointmentValue}>{message.appointmentDetails.time}</Text>
            </View>
            <View style={styles.appointmentRow}>
              <Text style={styles.appointmentLabel}>Staff</Text>
              <Text style={styles.appointmentValue}>{message.appointmentDetails.staff}</Text>
            </View>
          </View>
          <View style={styles.appointmentActions}>
            <TouchableOpacity style={styles.appointmentActionBtn}>
              <Text style={styles.appointmentActionText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.appointmentActionBtnPrimary}>
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.appointmentActionGradient}
              >
                <Text style={styles.appointmentActionTextPrimary}>Confirm</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (message.type === 'image') {
      return (
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderIcon}>🖼️</Text>
          </View>
        </View>
      );
    }

    if (message.type === 'file') {
      return (
        <View style={styles.fileContainer}>
          <Text style={styles.fileIcon}>📄</Text>
          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>{message.attachmentName}</Text>
            <Text style={styles.fileSize}>PDF Document</Text>
          </View>
          <TouchableOpacity style={styles.downloadBtn}>
            <Text style={styles.downloadIcon}>⬇️</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return <Text style={[styles.messageText, isClient && styles.messageTextClient]}>{message.text}</Text>;
  };

  const renderStatus = () => {
    if (isClient || !message.status) return null;
    
    const statusIcons = {
      sent: '✓',
      delivered: '✓✓',
      read: '✓✓',
    };
    
    return (
      <Text style={[styles.messageStatus, message.status === 'read' && styles.messageStatusRead]}>
        {statusIcons[message.status]}
      </Text>
    );
  };

  if (message.type === 'system') {
    return (
      <View style={styles.systemMessage}>
        <Text style={styles.systemMessageText}>{message.text}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.messageRow, isClient ? styles.messageRowClient : styles.messageRowBusiness]}>
      <View style={[
        styles.messageBubble,
        isClient ? styles.messageBubbleClient : styles.messageBubbleBusiness,
        message.type === 'appointment' && styles.messageBubbleAppointment,
      ]}>
        {renderContent()}
        <View style={styles.messageFooter}>
          <Text style={[styles.messageTime, isClient && styles.messageTimeClient]}>
            {message.timestamp}
          </Text>
          {renderStatus()}
        </View>
      </View>
    </View>
  );
}

export default function ChatConversationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messageText, setMessageText] = useState('');
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList<Message>>(null);
  
  const { data: conversationData, loading, error, refetch } = useConversation(id);
  const { sendMessage, isSubmitting } = useCommunicationActions();

  const client: Client = useMemo(() => {
    if (conversationData?.client) {
      return {
        id: conversationData.client.id,
        name: conversationData.client.name,
        phone: conversationData.client.phone,
        isOnline: conversationData.client.isOnline,
        lastSeen: conversationData.client.lastSeen,
      };
    }
    return { id: '1', name: 'Loading...', phone: '', isOnline: false };
  }, [conversationData]);

  const messages = useMemo(() => {
    const apiMessages = conversationData?.messages?.map(mapApiMessage) || [];
    return [...apiMessages, ...localMessages];
  }, [conversationData, localMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    if (!messageText.trim() || !id) return;

    setSendError(null);
    const tempId = `temp-${Date.now()}`;
    const textToSend = messageText.trim();
    const newMessage: Message = {
      id: tempId,
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isFromClient: false,
      type: 'text',
      status: 'sent',
    };

    setLocalMessages(prev => [...prev, newMessage]);
    setMessageText('');
    setShowQuickReplies(false);
    
    try {
      await sendMessage(id, textToSend);
      await refetch();
      setLocalMessages([]);
    } catch (err) {
      setLocalMessages(prev => prev.filter(m => m.id !== tempId));
      setMessageText(textToSend);
      setSendError('Message failed to send. Please try again.');
    }
    
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messageText, id, sendMessage, refetch]);

  const renderMessage = useCallback(({ item }: { item: Message }) => (
    <MessageBubble message={item} />
  ), []);

  const handleQuickReply = (reply: string) => {
    setMessageText(reply);
    setShowQuickReplies(false);
  };

  const attachmentOptions = [
    { icon: '📷', label: 'Camera', action: () => {} },
    { icon: '🖼️', label: 'Gallery', action: () => {} },
    { icon: '📄', label: 'Document', action: () => {} },
    { icon: '📍', label: 'Location', action: () => {} },
    { icon: '📅', label: 'Appointment', action: () => {} },
    { icon: '🎁', label: 'Offer', action: () => {} },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clientInfo} activeOpacity={0.7}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(client.name)}</Text>
          </View>
          <View style={styles.clientDetails}>
            <Text style={styles.clientName}>{client.name}</Text>
            <Text style={styles.clientStatus}>
              {client.isOnline ? (
                <Text style={styles.onlineStatus}>● Online</Text>
              ) : (
                `Last seen ${client.lastSeen || 'recently'}`
              )}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionBtn}>
            <Text style={styles.headerActionIcon}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn}>
            <Text style={styles.headerActionIcon}>📹</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn}>
            <Text style={styles.headerActionIcon}>⋯</Text>
          </TouchableOpacity>
        </View>
      </View>

      {(error || sendError) && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorText}>{error || sendError}</Text>
          {error ? (
            <TouchableOpacity style={styles.errorRetryBtn} onPress={refetch}>
              <Text style={styles.errorRetryText}>Retry</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setSendError(null)}>
              <Text style={styles.errorDismiss}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        inverted={false}
        ListHeaderComponent={
          <View style={styles.dateHeader}>
            <Text style={styles.dateText}>Today</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.violet} />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>Start the conversation</Text>
              <Text style={styles.emptySubtitle}>Send a message to begin chatting</Text>
            </View>
          )
        }
      />

      {showQuickReplies && (
        <View style={styles.quickRepliesContainer}>
          <Text style={styles.quickRepliesTitle}>Quick Replies</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.quickRepliesList}>
              {QUICK_REPLIES.map((reply, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickReplyChip}
                  onPress={() => handleQuickReply(reply)}
                >
                  <Text style={styles.quickReplyText}>{reply}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {showAttachments && (
        <View style={styles.attachmentsContainer}>
          <View style={styles.attachmentsGrid}>
            {attachmentOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.attachmentOption}
                onPress={() => {
                  option.action();
                  setShowAttachments(false);
                }}
              >
                <View style={styles.attachmentIconContainer}>
                  <Text style={styles.attachmentIcon}>{option.icon}</Text>
                </View>
                <Text style={styles.attachmentLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.inputActionBtn}
            onPress={() => {
              setShowAttachments(!showAttachments);
              setShowQuickReplies(false);
            }}
          >
            <Text style={styles.inputActionIcon}>+</Text>
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.textMuted}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={styles.emojiBtn}
              onPress={() => {
                setShowQuickReplies(!showQuickReplies);
                setShowAttachments(false);
              }}
            >
              <Text style={styles.emojiIcon}>⚡</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!messageText.trim() || isSubmitting}
          >
            <LinearGradient
              colors={messageText.trim() ? GRADIENTS.primary : GRADIENTS.disabled}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendBtnGradient}
            >
              <Text style={styles.sendIcon}>➤</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  backIcon: {
    fontSize: 20,
    color: COLORS.textSecondary,
  },
  clientInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.violet,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  clientStatus: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  onlineStatus: {
    color: COLORS.green,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionIcon: {
    fontSize: 18,
  },
  dateHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  dateText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  messageRow: {
    marginBottom: SPACING.md,
  },
  messageRowClient: {
    alignItems: 'flex-start',
  },
  messageRowBusiness: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  messageBubbleClient: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 4,
  },
  messageBubbleBusiness: {
    backgroundColor: COLORS.violet,
    borderTopRightRadius: 4,
  },
  messageBubbleAppointment: {
    backgroundColor: COLORS.card,
    maxWidth: '90%',
    padding: 0,
    overflow: 'hidden',
  },
  messageText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    lineHeight: 22,
  },
  messageTextClient: {
    color: COLORS.text,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  messageTime: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.6)',
  },
  messageTimeClient: {
    color: COLORS.textMuted,
  },
  messageStatus: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
  messageStatusRead: {
    color: COLORS.green,
  },
  systemMessage: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  systemMessageText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  appointmentCard: {
    padding: SPACING.lg,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  appointmentIcon: {
    fontSize: 18,
  },
  appointmentTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  appointmentDetails: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  appointmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  appointmentLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  appointmentValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text,
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  appointmentActionBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
  },
  appointmentActionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  appointmentActionBtnPrimary: {
    flex: 1,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  appointmentActionGradient: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  appointmentActionTextPrimary: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.white,
  },
  imageContainer: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    width: 200,
    height: 150,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderIcon: {
    fontSize: 40,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  fileIcon: {
    fontSize: 24,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text,
  },
  fileSize: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  downloadBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadIcon: {
    fontSize: 14,
  },
  quickRepliesContainer: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    padding: SPACING.md,
  },
  quickRepliesTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  quickRepliesList: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quickReplyChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.violet,
  },
  quickReplyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.violet,
  },
  attachmentsContainer: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    padding: SPACING.lg,
  },
  attachmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.lg,
    justifyContent: 'center',
  },
  attachmentOption: {
    alignItems: 'center',
    width: 70,
  },
  attachmentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  attachmentIcon: {
    fontSize: 24,
  },
  attachmentLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    gap: SPACING.sm,
  },
  inputActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputActionIcon: {
    fontSize: 24,
    color: COLORS.violet,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 44,
    maxHeight: 120,
  },
  textInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
  },
  emojiBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiIcon: {
    fontSize: 18,
  },
  sendBtn: {
    width: 44,
    height: 44,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    fontSize: 18,
    color: COLORS.white,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
    paddingHorizontal: SPACING.lg,
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
});
