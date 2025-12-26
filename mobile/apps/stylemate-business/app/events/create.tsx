import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS, SIZES } from '../../constants/theme';
import { useEventTypes, useEventDetail, useEventsActions, CreateEventParams } from '@stylemate/core';

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const STEP_TITLES = [
  'Basic Info',
  'Date & Venue',
  'Tickets',
  'Waitlist',
  'Speakers',
  'Schedule',
  'Policies',
];

interface FormData {
  title: string;
  eventTypeId: string;
  shortDescription: string;
  fullDescription: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  venueName: string;
  venueAddress: string;
  city: string;
  venuePhone: string;
  visibility: 'public' | 'private' | 'invite_only';
  maxCapacity: string;
  isRecurring: boolean;
  recurringType: string;
  enableWaitlist: boolean;
  autoNotifyWaitlist: boolean;
  requireManualConfirmation: boolean;
  waitlistCapacity: string;
  allowGuestBooking: boolean;
  maxGuestsPerBooking: string;
  registrationDeadlineHours: string;
  sendConfirmationEmail: boolean;
  sendCalendarInvite: boolean;
  sendReminder24h: boolean;
  sendReminder2h: boolean;
  whatToBring: string[];
  includedItems: string[];
  cancellationFullRefundHours: string;
  cancellationPartialRefundHours: string;
  cancellationPartialRefundPercentage: string;
  noShowFeePercentage: string;
}

const initialFormData: FormData = {
  title: '',
  eventTypeId: '',
  shortDescription: '',
  fullDescription: '',
  coverImage: '',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  venueName: '',
  venueAddress: '',
  city: '',
  venuePhone: '',
  visibility: 'public',
  maxCapacity: '',
  isRecurring: false,
  recurringType: 'weekly',
  enableWaitlist: true,
  autoNotifyWaitlist: true,
  requireManualConfirmation: false,
  waitlistCapacity: '50',
  allowGuestBooking: true,
  maxGuestsPerBooking: '4',
  registrationDeadlineHours: '24',
  sendConfirmationEmail: true,
  sendCalendarInvite: true,
  sendReminder24h: true,
  sendReminder2h: true,
  whatToBring: [],
  includedItems: [],
  cancellationFullRefundHours: '48',
  cancellationPartialRefundHours: '24',
  cancellationPartialRefundPercentage: '50',
  noShowFeePercentage: '100',
};

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <View key={i} style={styles.stepDotContainer}>
          <View style={[
            styles.stepDot,
            i + 1 <= currentStep && styles.stepDotActive,
            i + 1 < currentStep && styles.stepDotCompleted,
          ]}>
            {i + 1 < currentStep ? (
              <Text style={styles.stepDotCheck}>✓</Text>
            ) : (
              <Text style={[styles.stepDotText, i + 1 <= currentStep && styles.stepDotTextActive]}>
                {i + 1}
              </Text>
            )}
          </View>
          {i < totalSteps - 1 && (
            <View style={[styles.stepLine, i + 1 < currentStep && styles.stepLineActive]} />
          )}
        </View>
      ))}
    </View>
  );
}

function InputField({ label, value, onChangeText, placeholder, multiline, keyboardType, required }: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  required?: boolean;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label}
        {required && <Text style={styles.requiredStar}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        multiline={multiline}
        keyboardType={keyboardType}
        numberOfLines={multiline ? 4 : 1}
      />
    </View>
  );
}

function ToggleField({ label, description, value, onValueChange }: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleGroup}>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description && <Text style={styles.toggleDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: COLORS.cardBorder, true: COLORS.violet + '60' }}
        thumbColor={value ? COLORS.violet : COLORS.textMuted}
      />
    </View>
  );
}

export default function CreateEventScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const editId = params.editId as string | undefined;
  const isEditing = !!editId;

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [newItem, setNewItem] = useState('');

  const { data: eventTypes, loading: typesLoading } = useEventTypes();
  const { data: existingEvent, loading: eventLoading } = useEventDetail(editId);
  const { createEvent, updateEvent, isSubmitting } = useEventsActions();

  useEffect(() => {
    if (isEditing && existingEvent) {
      setFormData({
        title: existingEvent.title,
        eventTypeId: '',
        shortDescription: existingEvent.shortDescription || '',
        fullDescription: existingEvent.fullDescription || '',
        coverImage: existingEvent.coverImage || '',
        startDate: existingEvent.startDate,
        endDate: existingEvent.endDate || '',
        startTime: existingEvent.startTime,
        endTime: existingEvent.endTime,
        venueName: existingEvent.venueName,
        venueAddress: existingEvent.venueAddress,
        city: existingEvent.city,
        venuePhone: existingEvent.venuePhone || '',
        visibility: existingEvent.visibility as FormData['visibility'],
        maxCapacity: existingEvent.maxCapacity.toString(),
        isRecurring: existingEvent.isRecurring,
        recurringType: existingEvent.recurringType || 'weekly',
        enableWaitlist: true,
        autoNotifyWaitlist: true,
        requireManualConfirmation: false,
        waitlistCapacity: '50',
        allowGuestBooking: true,
        maxGuestsPerBooking: '4',
        registrationDeadlineHours: '24',
        sendConfirmationEmail: true,
        sendCalendarInvite: true,
        sendReminder24h: true,
        sendReminder2h: true,
        whatToBring: existingEvent.whatToBring || [],
        includedItems: existingEvent.includedItems || [],
        cancellationFullRefundHours: existingEvent.cancellationPolicy?.fullRefundHours?.toString() || '48',
        cancellationPartialRefundHours: existingEvent.cancellationPolicy?.partialRefundHours?.toString() || '24',
        cancellationPartialRefundPercentage: existingEvent.cancellationPolicy?.partialRefundPercentage?.toString() || '50',
        noShowFeePercentage: existingEvent.noShowFeePercentage?.toString() || '100',
      });
    }
  }, [isEditing, existingEvent]);

  const updateFormData = useCallback((key: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    const params: CreateEventParams = {
      title: formData.title || 'Untitled Event',
      eventTypeId: formData.eventTypeId,
      shortDescription: formData.shortDescription,
      fullDescription: formData.fullDescription || undefined,
      coverImage: formData.coverImage || undefined,
      startDate: formData.startDate || new Date().toISOString().split('T')[0],
      endDate: formData.endDate || undefined,
      startTime: formData.startTime || '10:00',
      endTime: formData.endTime || '18:00',
      venueName: formData.venueName || 'TBD',
      venueAddress: formData.venueAddress || 'TBD',
      city: formData.city || 'TBD',
      venuePhone: formData.venuePhone || undefined,
      visibility: formData.visibility,
      maxCapacity: parseInt(formData.maxCapacity) || 50,
      isRecurring: formData.isRecurring,
      recurringType: formData.isRecurring ? formData.recurringType as any : undefined,
      enableWaitlist: formData.enableWaitlist,
      autoNotifyWaitlist: formData.autoNotifyWaitlist,
      requireManualConfirmation: formData.requireManualConfirmation,
      waitlistCapacity: parseInt(formData.waitlistCapacity) || undefined,
      allowGuestBooking: formData.allowGuestBooking,
      maxGuestsPerBooking: parseInt(formData.maxGuestsPerBooking) || undefined,
      registrationDeadlineHours: parseInt(formData.registrationDeadlineHours) || undefined,
      sendConfirmationEmail: formData.sendConfirmationEmail,
      sendCalendarInvite: formData.sendCalendarInvite,
      sendReminder24h: formData.sendReminder24h,
      sendReminder2h: formData.sendReminder2h,
      whatToBring: formData.whatToBring.length > 0 ? formData.whatToBring : undefined,
      includedItems: formData.includedItems.length > 0 ? formData.includedItems : undefined,
      cancellationFullRefundHours: parseInt(formData.cancellationFullRefundHours) || undefined,
      cancellationPartialRefundHours: parseInt(formData.cancellationPartialRefundHours) || undefined,
      cancellationPartialRefundPercentage: parseInt(formData.cancellationPartialRefundPercentage) || undefined,
      noShowFeePercentage: parseInt(formData.noShowFeePercentage) || undefined,
    };

    if (isEditing && editId) {
      const result = await updateEvent(editId, params);
      if (result.success) {
        Alert.alert('Saved', 'Your changes have been saved as a draft.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to save');
      }
    } else {
      const result = await createEvent(params);
      if (result.success) {
        Alert.alert('Saved', 'Your event has been saved as a draft.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to create event');
      }
    }
    setIsSaving(false);
  };

  const handlePublish = async () => {
    if (!formData.title || !formData.startDate || !formData.startTime || !formData.venueName) {
      Alert.alert('Missing Information', 'Please fill in all required fields before publishing.');
      return;
    }
    Alert.alert(
      'Publish Event',
      'Are you sure you want to publish this event? It will be visible to customers.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Publish', onPress: handleSaveDraft },
      ]
    );
  };

  const addListItem = (key: 'whatToBring' | 'includedItems') => {
    if (newItem.trim()) {
      updateFormData(key, [...formData[key], newItem.trim()]);
      setNewItem('');
    }
  };

  const removeListItem = (key: 'whatToBring' | 'includedItems', index: number) => {
    const newList = formData[key].filter((_, i) => i !== index);
    updateFormData(key, newList);
  };

  const renderStep1 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepDescription}>Tell us about your event</Text>

      <InputField
        label="Event Title"
        value={formData.title}
        onChangeText={(text) => updateFormData('title', text)}
        placeholder="e.g., Summer Makeup Masterclass"
        required
      />

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Event Type <Text style={styles.requiredStar}>*</Text></Text>
        {typesLoading ? (
          <ActivityIndicator size="small" color={COLORS.violet} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
            {eventTypes?.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeChip,
                  formData.eventTypeId === type.id && styles.typeChipActive
                ]}
                onPress={() => updateFormData('eventTypeId', type.id)}
              >
                <Text style={styles.typeChipIcon}>{type.icon}</Text>
                <Text style={[
                  styles.typeChipText,
                  formData.eventTypeId === type.id && styles.typeChipTextActive
                ]}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <InputField
        label="Short Description"
        value={formData.shortDescription}
        onChangeText={(text) => updateFormData('shortDescription', text)}
        placeholder="A brief summary for event cards"
        required
      />

      <InputField
        label="Full Description"
        value={formData.fullDescription}
        onChangeText={(text) => updateFormData('fullDescription', text)}
        placeholder="Detailed description of your event..."
        multiline
      />

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Visibility</Text>
        <View style={styles.visibilityOptions}>
          {(['public', 'private', 'invite_only'] as const).map((vis) => (
            <TouchableOpacity
              key={vis}
              style={[
                styles.visibilityChip,
                formData.visibility === vis && styles.visibilityChipActive
              ]}
              onPress={() => updateFormData('visibility', vis)}
            >
              <Text style={styles.visibilityIcon}>
                {vis === 'public' ? '🌐' : vis === 'private' ? '🔒' : '✉️'}
              </Text>
              <Text style={[
                styles.visibilityText,
                formData.visibility === vis && styles.visibilityTextActive
              ]}>
                {vis === 'invite_only' ? 'Invite Only' : vis.charAt(0).toUpperCase() + vis.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Date & Venue</Text>
      <Text style={styles.stepDescription}>When and where is your event?</Text>

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <InputField
            label="Start Date"
            value={formData.startDate}
            onChangeText={(text) => updateFormData('startDate', text)}
            placeholder="YYYY-MM-DD"
            required
          />
        </View>
        <View style={styles.halfInput}>
          <InputField
            label="End Date"
            value={formData.endDate}
            onChangeText={(text) => updateFormData('endDate', text)}
            placeholder="YYYY-MM-DD"
          />
        </View>
      </View>
      <Text style={styles.dateHint}>Format: 2025-03-15 (Year-Month-Day)</Text>

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <InputField
            label="Start Time"
            value={formData.startTime}
            onChangeText={(text) => updateFormData('startTime', text)}
            placeholder="HH:MM"
            required
          />
        </View>
        <View style={styles.halfInput}>
          <InputField
            label="End Time"
            value={formData.endTime}
            onChangeText={(text) => updateFormData('endTime', text)}
            placeholder="HH:MM"
            required
          />
        </View>
      </View>

      <ToggleField
        label="Recurring Event"
        description="This event repeats on a schedule"
        value={formData.isRecurring}
        onValueChange={(val) => updateFormData('isRecurring', val)}
      />

      {formData.isRecurring && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Recurrence Pattern</Text>
          <View style={styles.recurrenceOptions}>
            {['daily', 'weekly', 'monthly'].map((pattern) => (
              <TouchableOpacity
                key={pattern}
                style={[
                  styles.recurrenceChip,
                  formData.recurringType === pattern && styles.recurrenceChipActive
                ]}
                onPress={() => updateFormData('recurringType', pattern)}
              >
                <Text style={[
                  styles.recurrenceText,
                  formData.recurringType === pattern && styles.recurrenceTextActive
                ]}>
                  {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <InputField
        label="Venue Name"
        value={formData.venueName}
        onChangeText={(text) => updateFormData('venueName', text)}
        placeholder="e.g., Grand Ballroom"
        required
      />

      <InputField
        label="Venue Address"
        value={formData.venueAddress}
        onChangeText={(text) => updateFormData('venueAddress', text)}
        placeholder="Full street address"
        required
      />

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <InputField
            label="City"
            value={formData.city}
            onChangeText={(text) => updateFormData('city', text)}
            placeholder="City"
            required
          />
        </View>
        <View style={styles.halfInput}>
          <InputField
            label="Venue Phone"
            value={formData.venuePhone}
            onChangeText={(text) => updateFormData('venuePhone', text)}
            placeholder="Phone number"
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <InputField
        label="Max Capacity"
        value={formData.maxCapacity}
        onChangeText={(text) => updateFormData('maxCapacity', text)}
        placeholder="Total attendees allowed"
        keyboardType="numeric"
        required
      />
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Tickets</Text>
      <Text style={styles.stepDescription}>Set up ticket types (you can add more after creating)</Text>

      <View style={styles.comingSoonCard}>
        <Text style={styles.comingSoonIcon}>🎫</Text>
        <Text style={styles.comingSoonTitle}>Ticket Setup</Text>
        <Text style={styles.comingSoonText}>
          After saving, you can add multiple ticket types with different prices, early bird discounts, and perks.
        </Text>
      </View>

      <ToggleField
        label="Allow Guest Booking"
        description="Attendees can add guests to their registration"
        value={formData.allowGuestBooking}
        onValueChange={(val) => updateFormData('allowGuestBooking', val)}
      />

      {formData.allowGuestBooking && (
        <InputField
          label="Max Guests per Booking"
          value={formData.maxGuestsPerBooking}
          onChangeText={(text) => updateFormData('maxGuestsPerBooking', text)}
          placeholder="e.g., 4"
          keyboardType="numeric"
        />
      )}

      <InputField
        label="Registration Deadline (hours before)"
        value={formData.registrationDeadlineHours}
        onChangeText={(text) => updateFormData('registrationDeadlineHours', text)}
        placeholder="e.g., 24"
        keyboardType="numeric"
      />
    </ScrollView>
  );

  const renderStep4 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Waitlist Settings</Text>
      <Text style={styles.stepDescription}>Configure waitlist behavior when tickets sell out</Text>

      <ToggleField
        label="Enable Waitlist"
        description="Allow customers to join a waitlist when sold out"
        value={formData.enableWaitlist}
        onValueChange={(val) => updateFormData('enableWaitlist', val)}
      />

      {formData.enableWaitlist && (
        <>
          <ToggleField
            label="Auto-Notify Waitlist"
            description="Automatically notify when spots become available"
            value={formData.autoNotifyWaitlist}
            onValueChange={(val) => updateFormData('autoNotifyWaitlist', val)}
          />

          <ToggleField
            label="Require Manual Confirmation"
            description="You must manually approve waitlist promotions"
            value={formData.requireManualConfirmation}
            onValueChange={(val) => updateFormData('requireManualConfirmation', val)}
          />

          <InputField
            label="Waitlist Capacity"
            value={formData.waitlistCapacity}
            onChangeText={(text) => updateFormData('waitlistCapacity', text)}
            placeholder="Max waitlist entries"
            keyboardType="numeric"
          />
        </>
      )}
    </ScrollView>
  );

  const renderStep5 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Speakers</Text>
      <Text style={styles.stepDescription}>Add speakers (you can add more after creating)</Text>

      <View style={styles.comingSoonCard}>
        <Text style={styles.comingSoonIcon}>👤</Text>
        <Text style={styles.comingSoonTitle}>Speaker Management</Text>
        <Text style={styles.comingSoonText}>
          After saving, you can add speaker profiles with photos, bios, and social links.
        </Text>
      </View>
    </ScrollView>
  );

  const renderStep6 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Event Schedule</Text>
      <Text style={styles.stepDescription}>Create your event timeline</Text>

      <View style={styles.comingSoonCard}>
        <Text style={styles.comingSoonIcon}>📅</Text>
        <Text style={styles.comingSoonTitle}>Schedule Builder</Text>
        <Text style={styles.comingSoonText}>
          After saving, you can add sessions, breaks, networking time, and assign speakers to each slot.
        </Text>
      </View>
    </ScrollView>
  );

  const renderStep7 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Policies & Extras</Text>
      <Text style={styles.stepDescription}>Set cancellation policies and attendee information</Text>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionCardTitle}>📧 Notifications</Text>
        <ToggleField
          label="Send Confirmation Email"
          value={formData.sendConfirmationEmail}
          onValueChange={(val) => updateFormData('sendConfirmationEmail', val)}
        />
        <ToggleField
          label="Send Calendar Invite"
          value={formData.sendCalendarInvite}
          onValueChange={(val) => updateFormData('sendCalendarInvite', val)}
        />
        <ToggleField
          label="Send 24h Reminder"
          value={formData.sendReminder24h}
          onValueChange={(val) => updateFormData('sendReminder24h', val)}
        />
        <ToggleField
          label="Send 2h Reminder"
          value={formData.sendReminder2h}
          onValueChange={(val) => updateFormData('sendReminder2h', val)}
        />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionCardTitle}>📋 What to Bring</Text>
        <View style={styles.listInputContainer}>
          <TextInput
            style={styles.listInput}
            value={newItem}
            onChangeText={setNewItem}
            placeholder="Add item (e.g., Yoga mat)"
            placeholderTextColor={COLORS.textMuted}
          />
          <TouchableOpacity 
            style={styles.addItemBtn}
            onPress={() => addListItem('whatToBring')}
          >
            <Text style={styles.addItemBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        {formData.whatToBring.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.listItemText}>• {item}</Text>
            <TouchableOpacity onPress={() => removeListItem('whatToBring', index)}>
              <Text style={styles.removeItemBtn}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionCardTitle}>✅ Included Items</Text>
        <View style={styles.listInputContainer}>
          <TextInput
            style={styles.listInput}
            value={newItem}
            onChangeText={setNewItem}
            placeholder="Add item (e.g., Lunch)"
            placeholderTextColor={COLORS.textMuted}
          />
          <TouchableOpacity 
            style={styles.addItemBtn}
            onPress={() => addListItem('includedItems')}
          >
            <Text style={styles.addItemBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        {formData.includedItems.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.listItemText}>• {item}</Text>
            <TouchableOpacity onPress={() => removeListItem('includedItems', index)}>
              <Text style={styles.removeItemBtn}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionCardTitle}>⚠️ Cancellation Policy</Text>
        <InputField
          label="Full Refund (hours before)"
          value={formData.cancellationFullRefundHours}
          onChangeText={(text) => updateFormData('cancellationFullRefundHours', text)}
          placeholder="48"
          keyboardType="numeric"
        />
        <InputField
          label="Partial Refund (hours before)"
          value={formData.cancellationPartialRefundHours}
          onChangeText={(text) => updateFormData('cancellationPartialRefundHours', text)}
          placeholder="24"
          keyboardType="numeric"
        />
        <InputField
          label="Partial Refund %"
          value={formData.cancellationPartialRefundPercentage}
          onChangeText={(text) => updateFormData('cancellationPartialRefundPercentage', text)}
          placeholder="50"
          keyboardType="numeric"
        />
        <InputField
          label="No-Show Fee %"
          value={formData.noShowFeePercentage}
          onChangeText={(text) => updateFormData('noShowFeePercentage', text)}
          placeholder="100"
          keyboardType="numeric"
        />
      </View>
    </ScrollView>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      default: return renderStep1();
    }
  };

  if (isEditing && eventLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading event...</Text>
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
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Event' : 'Create Event'}
        </Text>
        <TouchableOpacity style={styles.saveDraftBtn} onPress={handleSaveDraft} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color={COLORS.violet} />
          ) : (
            <Text style={styles.saveDraftText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <StepIndicator currentStep={currentStep} totalSteps={7} />

      <View style={styles.stepHeader}>
        <Text style={styles.stepNumber}>Step {currentStep} of 7</Text>
        <Text style={styles.stepName}>{STEP_TITLES[currentStep - 1]}</Text>
      </View>

      {renderCurrentStep()}

      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.footerRight}>
          {currentStep < 7 ? (
            <TouchableOpacity onPress={handleNext} activeOpacity={0.8}>
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextBtn}
              >
                <Text style={styles.nextBtnText}>Next →</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handlePublish} activeOpacity={0.8}>
              <LinearGradient
                colors={GRADIENTS.success}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.publishBtn}
              >
                <Text style={styles.publishBtnText}>Publish Event</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
  saveDraftBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  saveDraftText: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
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
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  stepDotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
  },
  stepDotActive: {
    borderColor: COLORS.violet,
    backgroundColor: COLORS.violet + '20',
  },
  stepDotCompleted: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  stepDotText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  stepDotTextActive: {
    color: COLORS.violet,
  },
  stepDotCheck: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  stepLine: {
    width: 20,
    height: 2,
    backgroundColor: COLORS.cardBorder,
  },
  stepLineActive: {
    backgroundColor: COLORS.violet,
  },
  stepHeader: {
    alignItems: 'center',
    paddingBottom: SPACING.md,
  },
  stepNumber: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    marginBottom: 2,
  },
  stepName: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  stepTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  stepDescription: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  requiredStar: {
    color: COLORS.red,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfInput: {
    flex: 1,
  },
  typeScroll: {
    marginTop: SPACING.sm,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.xs,
  },
  typeChipActive: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  typeChipIcon: {
    fontSize: FONT_SIZES.md,
  },
  typeChipText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  typeChipTextActive: {
    color: COLORS.white,
    fontWeight: '500',
  },
  visibilityOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  visibilityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.xs,
  },
  visibilityChipActive: {
    backgroundColor: COLORS.violet + '20',
    borderColor: COLORS.violet,
  },
  visibilityIcon: {
    fontSize: FONT_SIZES.md,
  },
  visibilityText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  visibilityTextActive: {
    color: COLORS.violet,
    fontWeight: '500',
  },
  recurrenceOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  recurrenceChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  recurrenceChipActive: {
    backgroundColor: COLORS.violet + '20',
    borderColor: COLORS.violet,
  },
  recurrenceText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  recurrenceTextActive: {
    color: COLORS.violet,
    fontWeight: '500',
  },
  toggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  toggleInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  toggleLabel: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  toggleDescription: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  comingSoonCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.lg,
  },
  comingSoonIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  comingSoonTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  comingSoonText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sectionCardTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  listInputContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  listInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  addItemBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addItemBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  listItemText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
  },
  removeItemBtn: {
    color: COLORS.red,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    padding: SPACING.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    backgroundColor: COLORS.background,
  },
  backBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backBtnText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  footerRight: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  nextBtn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  nextBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  publishBtn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  publishBtnText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  dateHint: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    marginTop: -SPACING.xs,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
});
