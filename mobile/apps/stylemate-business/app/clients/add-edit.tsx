import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { z } from 'zod';
import {
  COLORS,
  GRADIENTS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from '../../constants/theme';
import {
  useClientDetails,
  useClientActions,
  useStaffList,
} from '@stylemate/core/hooks/useBusinessApi';
import type { CreateClientParams } from '@stylemate/core/services/businessApi';

const clientFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number too long')
    .regex(/^[0-9+\-\s]+$/, 'Invalid phone number format'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional(),
  birthday: z.string().optional(),
  address: z.string().max(200, 'Address too long').optional(),
  city: z.string().max(50, 'City name too long').optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
  isVIP: z.boolean().optional(),
  marketingOptIn: z.boolean().optional(),
  smsOptIn: z.boolean().optional(),
  whatsappOptIn: z.boolean().optional(),
  preferredStaffId: z.string().optional(),
});

type FormData = z.infer<typeof clientFormSchema>;

type FormErrors = Partial<Record<keyof FormData, string>>;

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export default function AddEditClientScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const isEditMode = !!id;

  const { data: clientData, loading: loadingClient } = useClientDetails(id);
  const { data: staffData } = useStaffList();
  const { createClient, updateClient, isCreating, isUpdating, isDeleting, deleteClient } = useClientActions();

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    gender: undefined,
    birthday: '',
    address: '',
    city: '',
    notes: '',
    isVIP: false,
    marketingOptIn: true,
    smsOptIn: true,
    whatsappOptIn: true,
    preferredStaffId: undefined,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showStaffPicker, setShowStaffPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isEditMode && clientData?.client) {
      const client = clientData.client;
      setFormData({
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        phone: client.phone || '',
        email: client.email || '',
        gender: client.gender || undefined,
        birthday: client.birthday || '',
        address: client.address || '',
        city: client.city || '',
        notes: client.notes || '',
        isVIP: client.isVIP || false,
        marketingOptIn: client.marketingOptIn ?? true,
        smsOptIn: client.smsOptIn ?? true,
        whatsappOptIn: client.whatsappOptIn ?? true,
        preferredStaffId: client.preferredStaffId || undefined,
      });
    }
  }, [isEditMode, clientData]);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/[^0-9+]/g, '');
    return cleaned;
  };

  const validateForm = (): boolean => {
    try {
      clientFormSchema.parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        err.errors.forEach(e => {
          const field = e.path[0] as keyof FormData;
          if (!newErrors[field]) {
            newErrors[field] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const params: CreateClientParams = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone.trim(),
      email: formData.email?.trim() || undefined,
      gender: formData.gender,
      birthday: formData.birthday || undefined,
      address: formData.address?.trim() || undefined,
      city: formData.city?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
      isVIP: formData.isVIP,
      marketingOptIn: formData.marketingOptIn,
      smsOptIn: formData.smsOptIn,
      whatsappOptIn: formData.whatsappOptIn,
      preferredStaffId: formData.preferredStaffId,
    };

    let result;
    if (isEditMode && id) {
      result = await updateClient({ id, ...params });
    } else {
      result = await createClient(params);
    }

    if (result.success) {
      Alert.alert(
        'Success',
        isEditMode ? 'Client updated successfully' : 'Client created successfully',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      Alert.alert('Error', result.error || 'Something went wrong');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setShowDeleteConfirm(false);
    const result = await deleteClient(id);
    if (result.success) {
      Alert.alert('Deleted', 'Client has been removed', [
        { text: 'OK', onPress: () => router.replace('/clients') },
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to delete client');
    }
  };

  const selectedGender = GENDER_OPTIONS.find(g => g.value === formData.gender);
  const selectedStaff = staffData?.staff?.find(s => s.id === formData.preferredStaffId);

  if (isEditMode && loadingClient) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen options={{ title: 'Edit Client', headerShown: true, headerStyle: { backgroundColor: COLORS.background }, headerTintColor: COLORS.textPrimary }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading client...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: isEditMode ? 'Edit Client' : 'Add Client',
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.textPrimary,
          headerRight: () =>
            isEditMode ? (
              <TouchableOpacity onPress={() => setShowDeleteConfirm(true)}>
                <Text style={styles.deleteHeaderBtn}>Delete</Text>
              </TouchableOpacity>
            ) : null,
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
                  <Text style={styles.label}>First Name *</Text>
                  <TextInput
                    style={[styles.input, errors.firstName && styles.inputError]}
                    value={formData.firstName}
                    onChangeText={text => updateField('firstName', text)}
                    placeholder="First name"
                    placeholderTextColor={COLORS.textMuted}
                  />
                  {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Last Name *</Text>
                  <TextInput
                    style={[styles.input, errors.lastName && styles.inputError]}
                    value={formData.lastName}
                    onChangeText={text => updateField('lastName', text)}
                    placeholder="Last name"
                    placeholderTextColor={COLORS.textMuted}
                  />
                  {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={[styles.input, errors.phone && styles.inputError]}
                  value={formData.phone}
                  onChangeText={text => updateField('phone', formatPhoneNumber(text))}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                />
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  value={formData.email}
                  onChangeText={text => updateField('email', text)}
                  placeholder="email@example.com"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender</Text>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => setShowGenderPicker(true)}
                >
                  <Text style={selectedGender ? styles.pickerText : styles.pickerPlaceholder}>
                    {selectedGender?.label || 'Select gender'}
                  </Text>
                  <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Birthday</Text>
                <TextInput
                  style={styles.input}
                  value={formData.birthday}
                  onChangeText={text => updateField('birthday', text)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Street Address</Text>
                <TextInput
                  style={styles.input}
                  value={formData.address}
                  onChangeText={text => updateField('address', text)}
                  placeholder="123 Main Street"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  value={formData.city}
                  onChangeText={text => updateField('city', text)}
                  placeholder="Mumbai"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Preferred Staff</Text>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => setShowStaffPicker(true)}
                >
                  <Text style={selectedStaff ? styles.pickerText : styles.pickerPlaceholder}>
                    {selectedStaff?.name || 'No preference'}
                  </Text>
                  <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => updateField('isVIP', !formData.isVIP)}
              >
                <View>
                  <Text style={styles.toggleLabel}>VIP Client</Text>
                  <Text style={styles.toggleDescription}>Mark as a priority client</Text>
                </View>
                <View style={[styles.toggle, formData.isVIP && styles.toggleActive]}>
                  <View style={[styles.toggleThumb, formData.isVIP && styles.toggleThumbActive]} />
                </View>
              </TouchableOpacity>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.notes}
                  onChangeText={text => updateField('notes', text)}
                  placeholder="Client preferences, allergies, etc."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Marketing Preferences</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => updateField('marketingOptIn', !formData.marketingOptIn)}
              >
                <View>
                  <Text style={styles.toggleLabel}>Marketing Communications</Text>
                  <Text style={styles.toggleDescription}>Receive offers and updates</Text>
                </View>
                <View style={[styles.toggle, formData.marketingOptIn && styles.toggleActive]}>
                  <View style={[styles.toggleThumb, formData.marketingOptIn && styles.toggleThumbActive]} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => updateField('smsOptIn', !formData.smsOptIn)}
              >
                <View>
                  <Text style={styles.toggleLabel}>SMS Notifications</Text>
                  <Text style={styles.toggleDescription}>Booking reminders via SMS</Text>
                </View>
                <View style={[styles.toggle, formData.smsOptIn && styles.toggleActive]}>
                  <View style={[styles.toggleThumb, formData.smsOptIn && styles.toggleThumbActive]} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => updateField('whatsappOptIn', !formData.whatsappOptIn)}
              >
                <View>
                  <Text style={styles.toggleLabel}>WhatsApp Notifications</Text>
                  <Text style={styles.toggleDescription}>Booking reminders via WhatsApp</Text>
                </View>
                <View style={[styles.toggle, formData.whatsappOptIn && styles.toggleActive]}>
                  <View style={[styles.toggleThumb, formData.whatsappOptIn && styles.toggleThumbActive]} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSubmit}
            disabled={isCreating || isUpdating}
          >
            <LinearGradient
              colors={isCreating || isUpdating ? GRADIENTS.disabled : GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              {(isCreating || isUpdating) ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isEditMode ? 'Update Client' : 'Add Client'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showGenderPicker} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGenderPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Gender</Text>
            {GENDER_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.modalOption,
                  formData.gender === option.value && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  updateField('gender', option.value as 'male' | 'female' | 'other');
                  setShowGenderPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    formData.gender === option.value && styles.modalOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                updateField('gender', undefined);
                setShowGenderPicker(false);
              }}
            >
              <Text style={styles.modalOptionText}>Clear Selection</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showStaffPicker} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStaffPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Preferred Staff</Text>
            <TouchableOpacity
              style={[styles.modalOption, !formData.preferredStaffId && styles.modalOptionSelected]}
              onPress={() => {
                updateField('preferredStaffId', undefined);
                setShowStaffPicker(false);
              }}
            >
              <Text
                style={[
                  styles.modalOptionText,
                  !formData.preferredStaffId && styles.modalOptionTextSelected,
                ]}
              >
                No Preference
              </Text>
            </TouchableOpacity>
            {staffData?.staff?.map(staff => (
              <TouchableOpacity
                key={staff.id}
                style={[
                  styles.modalOption,
                  formData.preferredStaffId === staff.id && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  updateField('preferredStaffId', staff.id);
                  setShowStaffPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    formData.preferredStaffId === staff.id && styles.modalOptionTextSelected,
                  ]}
                >
                  {staff.name}
                </Text>
              </TouchableOpacity>
            ))}
            {(!staffData?.staff || staffData.staff.length === 0) && (
              <Text style={styles.noDataText}>No staff members available</Text>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showDeleteConfirm} transparent animationType="fade">
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteModal}>
            <Text style={styles.deleteTitle}>Delete Client?</Text>
            <Text style={styles.deleteMessage}>
              This will remove all client data including visit history. This action cannot be undone.
            </Text>
            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={styles.deleteCancelBtn}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.deleteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmBtn}
                onPress={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.deleteConfirmText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  deleteHeaderBtn: {
    fontSize: FONT_SIZES.md,
    color: COLORS.red,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  inputError: {
    borderColor: COLORS.red,
  },
  textArea: {
    minHeight: 80,
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.red,
    marginTop: SPACING.xs,
  },
  picker: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  pickerPlaceholder: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
  pickerArrow: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  toggleLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  toggleDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.cardBorder,
    padding: SPACING.xs / 2,
  },
  toggleActive: {
    backgroundColor: COLORS.green,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
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
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  modalOptionSelected: {
    backgroundColor: `${COLORS.violet}20`,
  },
  modalOptionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  modalOptionTextSelected: {
    color: COLORS.violet,
    fontWeight: '600',
  },
  noDataText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.xl,
  },
  deleteOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  deleteModal: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 340,
  },
  deleteTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  deleteMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  deleteCancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
  },
  deleteCancelText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  deleteConfirmBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.red,
    alignItems: 'center',
  },
  deleteConfirmText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    fontWeight: '600',
  },
});
