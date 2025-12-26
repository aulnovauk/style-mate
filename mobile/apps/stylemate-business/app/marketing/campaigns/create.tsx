import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../../constants/theme';
import { StepIndicator } from '../../../components/marketing/StepWizard';
import { MessagePreview } from '../../../components/marketing/MessagePreview';
import { marketingApi, CreateCampaignParams } from '@stylemate/core/services/businessApi';

type Channel = 'whatsapp' | 'sms' | 'both';
type AudienceType = 'all' | 'segment' | 'custom';

const STEP_TITLES = ['Details', 'Message', 'Schedule', 'Review'];

const TEMPLATES = [
  { id: '1', name: 'Promotional Offer', message: 'Hi {name}! Enjoy {discount}% off on your next visit. Book now: {link}', category: 'promotional' },
  { id: '2', name: 'New Service Alert', message: 'Hi {name}, we\'ve added new services! Check them out and book your appointment: {link}', category: 'promotional' },
  { id: '3', name: 'Win Back', message: 'We miss you {name}! It\'s been a while since your last visit. Come back with {discount}% off: {link}', category: 'follow_up' },
  { id: '4', name: 'Flash Sale', message: 'FLASH SALE! {discount}% off all services today only. Book now before slots fill up: {link}', category: 'promotional' },
];

const AUDIENCE_OPTIONS = [
  { type: 'all' as const, label: 'All Customers', count: 1250, icon: '👥' },
  { type: 'segment' as const, label: 'Active (last 30 days)', count: 456, icon: '🔥' },
  { type: 'segment' as const, label: 'Inactive (60+ days)', count: 234, icon: '💤' },
  { type: 'segment' as const, label: 'VIP Customers', count: 89, icon: '⭐' },
  { type: 'segment' as const, label: 'Birthdays this month', count: 23, icon: '🎂' },
];

export default function CreateCampaignScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [channel, setChannel] = useState<Channel>('whatsapp');
  const [selectedAudience, setSelectedAudience] = useState(0);
  
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  const [sendNow, setSendNow] = useState(true);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const selectTemplate = (template: typeof TEMPLATES[0]) => {
    setSelectedTemplate(template.id);
    setMessage(template.message);
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!name.trim()) {
        Alert.alert('Required', 'Please enter a campaign name');
        return false;
      }
    }
    if (step === 2) {
      if (!message.trim()) {
        Alert.alert('Required', 'Please enter a message');
        return false;
      }
    }
    if (step === 3) {
      if (!sendNow && (!scheduledDate || !scheduledTime)) {
        Alert.alert('Required', 'Please select a date and time to schedule');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const audienceOption = AUDIENCE_OPTIONS[selectedAudience];
      const params: CreateCampaignParams = {
        name,
        channel,
        message,
        audience: {
          type: audienceOption.type,
          segmentId: audienceOption.type === 'segment' ? audienceOption.label : undefined,
        },
        sendNow,
        scheduledAt: !sendNow ? `${scheduledDate}T${scheduledTime}:00Z` : undefined,
      };

      const response = await marketingApi.createCampaign(params);
      if (response.success) {
        Alert.alert(
          'Success',
          sendNow ? 'Campaign is being sent!' : 'Campaign scheduled successfully!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', 'Failed to create campaign');
      }
    } catch (err) {
      console.error('Error creating campaign:', err);
      Alert.alert(
        'Error',
        'Failed to create campaign. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Campaign Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., New Year Promo"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <Text style={styles.sectionTitle}>Channel</Text>
            <View style={styles.channelGrid}>
              {(['whatsapp', 'sms', 'both'] as const).map((ch) => (
                <TouchableOpacity
                  key={ch}
                  style={[styles.channelCard, channel === ch && styles.channelCardActive]}
                  onPress={() => setChannel(ch)}
                >
                  <Text style={styles.channelIcon}>
                    {ch === 'whatsapp' ? '📱' : ch === 'sms' ? '💬' : '📱💬'}
                  </Text>
                  <Text style={[styles.channelLabel, channel === ch && styles.channelLabelActive]}>
                    {ch === 'whatsapp' ? 'WhatsApp' : ch === 'sms' ? 'SMS' : 'Both'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Target Audience</Text>
            {AUDIENCE_OPTIONS.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.audienceCard, selectedAudience === index && styles.audienceCardActive]}
                onPress={() => setSelectedAudience(index)}
              >
                <View style={styles.audienceRadio}>
                  {selectedAudience === index && <View style={styles.audienceRadioInner} />}
                </View>
                <Text style={styles.audienceIcon}>{option.icon}</Text>
                <View style={styles.audienceContent}>
                  <Text style={styles.audienceLabel}>{option.label}</Text>
                  <Text style={styles.audienceCount}>{option.count} customers</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Choose a Template</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
              {TEMPLATES.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={[styles.templateCard, selectedTemplate === template.id && styles.templateCardActive]}
                  onPress={() => selectTemplate(template)}
                >
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.templatePreview} numberOfLines={2}>{template.message}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>Your Message *</Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Type your message here..."
                placeholderTextColor={COLORS.textMuted}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={5}
              />
              <Text style={styles.variableHint}>
                Use variables: {'{name}'}, {'{link}'}, {'{discount}'}
              </Text>
            </View>

            <MessagePreview
              message={message}
              channel={channel === 'both' ? 'whatsapp' : channel}
              variables={{ name: 'Priya', link: 'book.stylemate.com/abc', discount: '20' }}
            />
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>When to Send</Text>
            
            <TouchableOpacity
              style={[styles.scheduleCard, sendNow && styles.scheduleCardActive]}
              onPress={() => setSendNow(true)}
            >
              <View style={styles.scheduleRadio}>
                {sendNow && <View style={styles.scheduleRadioInner} />}
              </View>
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleIcon}>⚡</Text>
                <View>
                  <Text style={styles.scheduleLabel}>Send Now</Text>
                  <Text style={styles.scheduleDescription}>Campaign will start immediately</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.scheduleCard, !sendNow && styles.scheduleCardActive]}
              onPress={() => setSendNow(false)}
            >
              <View style={styles.scheduleRadio}>
                {!sendNow && <View style={styles.scheduleRadioInner} />}
              </View>
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleIcon}>📅</Text>
                <View>
                  <Text style={styles.scheduleLabel}>Schedule for Later</Text>
                  <Text style={styles.scheduleDescription}>Choose a date and time</Text>
                </View>
              </View>
            </TouchableOpacity>

            {!sendNow && (
              <View style={styles.scheduleInputs}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.textMuted}
                    value={scheduledDate}
                    onChangeText={setScheduledDate}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Time</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="HH:MM"
                    placeholderTextColor={COLORS.textMuted}
                    value={scheduledTime}
                    onChangeText={setScheduledTime}
                  />
                </View>
              </View>
            )}
          </View>
        );

      case 4:
        const audienceOption = AUDIENCE_OPTIONS[selectedAudience];
        return (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Review Campaign</Text>
            
            <View style={styles.reviewCard}>
              <Text style={styles.reviewName}>{name}</Text>
              <View style={styles.reviewBadges}>
                <View style={[styles.reviewBadge, { backgroundColor: COLORS.green + '20' }]}>
                  <Text style={[styles.reviewBadgeText, { color: COLORS.green }]}>
                    {channel === 'whatsapp' ? 'WhatsApp' : channel === 'sms' ? 'SMS' : 'Multi-channel'}
                  </Text>
                </View>
                <View style={[styles.reviewBadge, { backgroundColor: COLORS.violet + '20' }]}>
                  <Text style={[styles.reviewBadgeText, { color: COLORS.violet }]}>
                    {audienceOption.count} recipients
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>Audience</Text>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewRowLabel}>{audienceOption.icon} {audienceOption.label}</Text>
              </View>
            </View>

            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>Message Preview</Text>
              <MessagePreview
                message={message}
                channel={channel === 'both' ? 'whatsapp' : channel}
                variables={{ name: 'Priya', link: 'book.stylemate.com/abc', discount: '20' }}
              />
            </View>

            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>Schedule</Text>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewRowLabel}>
                  {sendNow ? '⚡ Sending immediately' : `📅 Scheduled for ${scheduledDate} at ${scheduledTime}`}
                </Text>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Campaign</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.stepIndicator}>
        <StepIndicator currentStep={currentStep} totalSteps={4} />
        <Text style={styles.stepTitle}>{STEP_TITLES[currentStep - 1]}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {renderStepContent()}
        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerButtonSecondary}
          onPress={handleBack}
        >
          <Text style={styles.footerButtonSecondaryText}>
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.footerButtonPrimary}
          onPress={handleNext}
          disabled={isSubmitting}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.footerButtonGradient}
          >
            <Text style={styles.footerButtonPrimaryText}>
              {isSubmitting ? 'Sending...' : currentStep === 4 ? (sendNow ? 'Send Campaign' : 'Schedule') : 'Continue'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  stepIndicator: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  stepTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  stepContent: {},
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  variableHint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  channelGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  channelCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  channelCardActive: {
    borderColor: COLORS.violet,
  },
  channelIcon: {
    fontSize: 24,
    marginBottom: SPACING.sm,
  },
  channelLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  channelLabelActive: {
    color: COLORS.violet,
  },
  audienceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  audienceCardActive: {
    borderColor: COLORS.violet,
  },
  audienceRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    marginRight: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audienceRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.violet,
  },
  audienceIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  audienceContent: {
    flex: 1,
  },
  audienceLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  audienceCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  templateScroll: {
    marginBottom: SPACING.lg,
  },
  templateCard: {
    width: 180,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  templateCardActive: {
    borderColor: COLORS.violet,
  },
  templateName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  templatePreview: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  scheduleCardActive: {
    borderColor: COLORS.violet,
  },
  scheduleRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    marginRight: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.violet,
  },
  scheduleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  scheduleIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  scheduleLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  scheduleDescription: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  scheduleInputs: {
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  reviewCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  reviewName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  reviewBadges: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  reviewBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  reviewBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  reviewSection: {
    marginBottom: SPACING.lg,
  },
  reviewSectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  reviewRow: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  reviewRowLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    backgroundColor: COLORS.background,
  },
  footerButtonSecondary: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.card,
    alignItems: 'center',
  },
  footerButtonSecondaryText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  footerButtonPrimary: {
    flex: 2,
  },
  footerButtonGradient: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  footerButtonPrimaryText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
});
