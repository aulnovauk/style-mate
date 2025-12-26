import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../../constants/theme';
import { MessagePreview } from '../../../components/marketing/MessagePreview';
import { marketingApi, AutomationWorkflow } from '@stylemate/core/services/businessApi';

const TYPE_CONFIG = {
  rebook_reminder: { icon: '🔄', color: COLORS.blue, label: 'Rebook Reminder' },
  birthday: { icon: '🎂', color: COLORS.pink, label: 'Birthday Offer' },
  win_back: { icon: '💤', color: COLORS.amber, label: 'Win-Back Campaign' },
  review_request: { icon: '⭐', color: COLORS.green, label: 'Review Request' },
  fill_slow_days: { icon: '📅', color: COLORS.violet, label: 'Fill Slow Days' },
};

export default function AutomationConfigScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [automation, setAutomation] = useState<AutomationWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isActive, setIsActive] = useState(false);
  const [triggerValue, setTriggerValue] = useState('');
  const [triggerUnit, setTriggerUnit] = useState<'days' | 'hours' | 'weeks'>('days');
  const [message, setMessage] = useState('');
  const [testPhone, setTestPhone] = useState('');

  useEffect(() => {
    fetchAutomation();
  }, [id]);

  const fetchAutomation = async () => {
    if (!id) return;
    try {
      const response = await marketingApi.getAutomationDetail(id);
      if (response.success && response.data) {
        initializeForm(response.data);
      } else {
        const mock = getMockAutomation(id);
        initializeForm(mock);
      }
    } catch {
      const mock = getMockAutomation(id);
      initializeForm(mock);
    } finally {
      setLoading(false);
    }
  };

  const initializeForm = (data: AutomationWorkflow) => {
    setAutomation(data);
    setIsActive(data.isActive);
    setTriggerValue(data.trigger.value.toString());
    setTriggerUnit(data.trigger.unit);
    setMessage(data.message);
  };

  const handleSave = async () => {
    if (!automation) return;
    setSaving(true);
    try {
      await marketingApi.updateAutomation(id!, {
        isActive,
        trigger: {
          type: automation.trigger.type,
          value: parseInt(triggerValue) || 0,
          unit: triggerUnit,
        },
        message,
      });
      Alert.alert('Success', 'Automation settings saved');
    } catch (err) {
      console.error('Error saving automation:', err);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testPhone.trim()) {
      Alert.alert('Required', 'Please enter a phone number to send test message');
      return;
    }
    try {
      await marketingApi.testAutomation(id!, testPhone);
      Alert.alert('Success', 'Test message sent to ' + testPhone);
      setTestPhone('');
    } catch (err) {
      console.error('Error sending test:', err);
      Alert.alert('Error', 'Failed to send test message. Please check the phone number and try again.');
    }
  };

  if (loading || !automation) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const typeConfig = TYPE_CONFIG[automation.type];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configure</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroCard}>
          <View style={[styles.iconContainer, { backgroundColor: typeConfig.color + '20' }]}>
            <Text style={styles.icon}>{typeConfig.icon}</Text>
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{automation.name}</Text>
            <Text style={styles.heroDescription}>{automation.description}</Text>
          </View>
        </View>

        <View style={styles.toggleSection}>
          <View style={styles.toggleContent}>
            <Text style={styles.toggleLabel}>Automation Active</Text>
            <Text style={styles.toggleDescription}>
              {isActive ? 'Messages will be sent automatically' : 'Automation is paused'}
            </Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: COLORS.cardBorder, true: COLORS.green + '60' }}
            thumbColor={isActive ? COLORS.green : COLORS.textMuted}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trigger Settings</Text>
          <Text style={styles.sectionSubtitle}>When should this automation run?</Text>
          
          <View style={styles.triggerRow}>
            <TextInput
              style={styles.triggerInput}
              value={triggerValue}
              onChangeText={setTriggerValue}
              keyboardType="numeric"
              placeholder="14"
              placeholderTextColor={COLORS.textMuted}
            />
            <View style={styles.unitButtons}>
              {(['hours', 'days', 'weeks'] as const).map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[styles.unitButton, triggerUnit === unit && styles.unitButtonActive]}
                  onPress={() => setTriggerUnit(unit)}
                >
                  <Text style={[styles.unitButtonText, triggerUnit === unit && styles.unitButtonTextActive]}>
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <Text style={styles.triggerHint}>
            {automation.type === 'rebook_reminder' && `Send ${triggerValue} ${triggerUnit} after last appointment`}
            {automation.type === 'birthday' && `Send on customer's birthday`}
            {automation.type === 'win_back' && `Send after ${triggerValue} ${triggerUnit} of inactivity`}
            {automation.type === 'review_request' && `Send ${triggerValue} ${triggerUnit} after appointment`}
            {automation.type === 'fill_slow_days' && `Send when occupancy drops below ${triggerValue}%`}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message</Text>
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            placeholder="Enter your message..."
            placeholderTextColor={COLORS.textMuted}
          />
          <Text style={styles.variableHint}>
            Available: {'{name}'}, {'{link}'}, {'{discount}'}, {'{salon_name}'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <MessagePreview
            message={message}
            channel="whatsapp"
            variables={{ name: 'Priya', link: 'book.stylemate.com/abc', discount: '20', salon_name: 'Style Studio' }}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Message</Text>
          <Text style={styles.sectionSubtitle}>Send a test message to verify everything works</Text>
          <View style={styles.testRow}>
            <TextInput
              style={styles.testInput}
              value={testPhone}
              onChangeText={setTestPhone}
              placeholder="+91 98765 43210"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
            />
            <TouchableOpacity style={styles.testButton} onPress={handleTest}>
              <Text style={styles.testButtonText}>Send Test</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.performanceSection}>
          <Text style={styles.sectionTitle}>Performance (Last 30 Days)</Text>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>{automation.performance.sent30d}</Text>
              <Text style={styles.performanceLabel}>Sent</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceValue}>{automation.performance.converted30d}</Text>
              <Text style={styles.performanceLabel}>Converted</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={[styles.performanceValue, { color: COLORS.green }]}>
                {automation.performance.conversionRate}%
              </Text>
              <Text style={styles.performanceLabel}>Rate</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={[styles.performanceValue, { color: COLORS.green }]}>
                {automation.performance.attributedRevenue.formatted}
              </Text>
              <Text style={styles.performanceLabel}>Revenue</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButtonGradient}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function getMockAutomation(id: string): AutomationWorkflow {
  const automations: Record<string, AutomationWorkflow> = {
    '1': {
      id: '1',
      type: 'rebook_reminder',
      name: 'Rebook Reminder',
      description: 'Send a reminder to clients who haven\'t booked again after their last appointment.',
      isActive: true,
      trigger: { type: 'after_visit', value: 14, unit: 'days' },
      message: 'Hi {name}, it\'s been 2 weeks since your last visit! Book your next appointment and enjoy 10% off.',
      performance: { sent30d: 156, converted30d: 42, conversionRate: 27, attributedRevenue: { value: 18900, formatted: '₹18,900' } },
    },
    '2': {
      id: '2',
      type: 'birthday',
      name: 'Birthday Offer',
      description: 'Automatically send birthday wishes with a special discount offer.',
      isActive: true,
      trigger: { type: 'on_birthday', value: 0, unit: 'days' },
      message: '🎂 Happy Birthday {name}! Celebrate with 20% off on any service this week.',
      performance: { sent30d: 23, converted30d: 15, conversionRate: 65, attributedRevenue: { value: 7500, formatted: '₹7,500' } },
    },
  };
  return automations[id] || automations['1'];
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
  loadingText: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  heroCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  icon: {
    fontSize: 28,
  },
  heroContent: {
    flex: 1,
  },
  heroTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  heroDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  toggleContent: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  toggleDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  triggerRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  triggerInput: {
    width: 80,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  unitButtons: {
    flexDirection: 'row',
    flex: 1,
    gap: SPACING.sm,
  },
  unitButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  unitButtonActive: {
    borderColor: COLORS.violet,
  },
  unitButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  unitButtonTextActive: {
    color: COLORS.violet,
  },
  triggerHint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  messageInput: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  variableHint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  testRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  testInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  testButton: {
    backgroundColor: COLORS.violet + '20',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
  },
  testButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.violet,
  },
  performanceSection: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  performanceLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    backgroundColor: COLORS.background,
  },
  saveButton: {
    width: '100%',
  },
  saveButtonGradient: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
});
