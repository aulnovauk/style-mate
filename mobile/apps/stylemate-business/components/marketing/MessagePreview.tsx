import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';

interface MessagePreviewProps {
  message: string;
  channel: 'whatsapp' | 'sms';
  variables?: Record<string, string>;
}

export function MessagePreview({ message, channel, variables = {} }: MessagePreviewProps) {
  const processMessage = (text: string) => {
    let processed = text;
    Object.entries(variables).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
    return processed;
  };

  const displayMessage = processMessage(message);
  const characterCount = displayMessage.length;
  const maxLength = channel === 'sms' ? 160 : 1024;
  const isOverLimit = characterCount > maxLength;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>
          {channel === 'whatsapp' ? '📱' : '💬'}
        </Text>
        <Text style={styles.headerTitle}>
          {channel === 'whatsapp' ? 'WhatsApp Preview' : 'SMS Preview'}
        </Text>
      </View>
      
      <View style={[
        styles.phoneFrame,
        channel === 'whatsapp' ? styles.whatsappFrame : styles.smsFrame,
      ]}>
        <View style={styles.messageContainer}>
          <View style={[
            styles.messageBubble,
            channel === 'whatsapp' ? styles.whatsappBubble : styles.smsBubble,
          ]}>
            <Text style={[
              styles.messageText,
              channel === 'whatsapp' ? styles.whatsappText : styles.smsText,
            ]}>
              {displayMessage || 'Your message will appear here...'}
            </Text>
            <Text style={[
              styles.timeStamp,
              channel === 'whatsapp' ? styles.whatsappTime : styles.smsTime,
            ]}>
              Now ✓✓
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={[
          styles.characterCount,
          isOverLimit && styles.characterCountError,
        ]}>
          {characterCount}/{maxLength} characters
          {channel === 'sms' && characterCount > 160 && (
            <Text style={styles.segmentNote}>
              {' '}({Math.ceil(characterCount / 160)} segments)
            </Text>
          )}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  headerIcon: {
    fontSize: FONT_SIZES.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  phoneFrame: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    minHeight: 150,
  },
  whatsappFrame: {
    backgroundColor: '#0B141A',
  },
  smsFrame: {
    backgroundColor: '#1C1C1E',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '85%',
    alignSelf: 'flex-end',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  whatsappBubble: {
    backgroundColor: '#005C4B',
    borderBottomRightRadius: 4,
  },
  smsBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  whatsappText: {
    color: '#E9EDEF',
  },
  smsText: {
    color: '#FFFFFF',
  },
  timeStamp: {
    fontSize: FONT_SIZES.xs,
    alignSelf: 'flex-end',
  },
  whatsappTime: {
    color: 'rgba(233, 237, 239, 0.6)',
  },
  smsTime: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  footer: {
    marginTop: SPACING.md,
    alignItems: 'flex-end',
  },
  characterCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  characterCountError: {
    color: COLORS.red,
  },
  segmentNote: {
    color: COLORS.amber,
  },
});
