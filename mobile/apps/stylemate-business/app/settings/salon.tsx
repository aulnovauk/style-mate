import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
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
import {
  useSettings,
  useSettingsActions,
} from '@stylemate/core/hooks/useBusinessApi';

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'url';
  multiline?: boolean;
  icon?: string;
  error?: string;
  editable?: boolean;
}

function FormField({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  keyboardType = 'default', 
  multiline = false,
  icon, 
  error,
  editable = true,
}: FormFieldProps) {
  return (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputContainer, error ? styles.inputError : null, !editable && styles.inputDisabled]}>
        {icon && <Text style={styles.inputIcon}>{icon}</Text>}
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          editable={editable}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
  icon?: string;
}

function SelectField({ label, value, options, onSelect, icon }: SelectFieldProps) {
  const [expanded, setExpanded] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity 
        style={styles.inputContainer}
        onPress={() => setExpanded(!expanded)}
      >
        {icon && <Text style={styles.inputIcon}>{icon}</Text>}
        <Text style={styles.selectText}>{selectedOption?.label || 'Select...'}</Text>
        <Text style={styles.selectChevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.optionItem, value === option.value && styles.optionItemSelected]}
              onPress={() => {
                onSelect(option.value);
                setExpanded(false);
              }}
            >
              <Text style={[styles.optionText, value === option.value && styles.optionTextSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const CATEGORY_OPTIONS = [
  { value: 'hair_salon', label: 'Hair Salon' },
  { value: 'spa', label: 'Spa & Wellness' },
  { value: 'nails', label: 'Nail Studio' },
  { value: 'barbershop', label: 'Barbershop' },
  { value: 'beauty', label: 'Beauty Salon' },
  { value: 'skincare', label: 'Skincare Clinic' },
  { value: 'tattoo', label: 'Tattoo Studio' },
  { value: 'other', label: 'Other' },
];

const PRICE_RANGE_OPTIONS = [
  { value: '$', label: '$ - Budget Friendly' },
  { value: '$$', label: '$$ - Moderate' },
  { value: '$$$', label: '$$$ - Premium' },
  { value: '$$$$', label: '$$$$ - Luxury' },
];

const VENUE_TYPE_OPTIONS = [
  { value: 'everyone', label: 'Everyone Welcome' },
  { value: 'female-only', label: 'Female Only' },
  { value: 'male-only', label: 'Male Only' },
];

export default function EditSalonScreen() {
  const router = useRouter();
  const { salon, isOwner, loading, refetch } = useSettings();
  const { updateSalon, isSubmitting } = useSettingsActions();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shopNumber: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    website: '',
    category: '',
    priceRange: '',
    venueType: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (salon) {
      setFormData({
        name: salon.name || '',
        description: salon.description || '',
        shopNumber: salon.shopNumber || '',
        address: salon.address || '',
        city: salon.city || '',
        state: salon.state || '',
        zipCode: salon.zipCode || '',
        phone: salon.phone || '',
        email: salon.email || '',
        website: salon.website || '',
        category: salon.category || '',
        priceRange: salon.priceRange || '',
        venueType: salon.venueType || 'everyone',
      });
    }
  }, [salon]);

  const updateFormData = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Salon name is required';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!isOwner) {
      Alert.alert('Error', 'Only salon owners can update salon settings');
      return;
    }

    if (!validateForm()) return;

    const result = await updateSalon({
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      shopNumber: formData.shopNumber.trim() || null,
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      zipCode: formData.zipCode.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      website: formData.website.trim() || null,
      category: formData.category,
      priceRange: formData.priceRange,
      venueType: formData.venueType,
    });

    if (result.success) {
      Alert.alert('Success', 'Salon information updated successfully', [
        { text: 'OK', onPress: () => { refetch(); router.back(); } },
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to update salon');
    }
  };

  if (loading && !salon) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Salon Information</Text>
          <View style={styles.placeholder} />
        </View>

        {!isOwner && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>Only salon owners can edit this information</Text>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.sectionCard}>
            <FormField
              label="Salon Name"
              value={formData.name}
              onChangeText={(v) => updateFormData('name', v)}
              placeholder="Enter salon name"
              icon="✂️"
              error={errors.name}
              editable={isOwner}
            />
            <FormField
              label="Branch / Location Name"
              value={formData.shopNumber}
              onChangeText={(v) => updateFormData('shopNumber', v)}
              placeholder="e.g., Downtown Branch"
              icon="🏢"
              editable={isOwner}
            />
            <FormField
              label="Description"
              value={formData.description}
              onChangeText={(v) => updateFormData('description', v)}
              placeholder="Brief description of your salon..."
              icon="📝"
              multiline
              editable={isOwner}
            />
          </View>

          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.sectionCard}>
            <FormField
              label="Street Address"
              value={formData.address}
              onChangeText={(v) => updateFormData('address', v)}
              placeholder="Enter street address"
              icon="📍"
              error={errors.address}
              editable={isOwner}
            />
            <FormField
              label="City"
              value={formData.city}
              onChangeText={(v) => updateFormData('city', v)}
              placeholder="Enter city"
              icon="🏙️"
              error={errors.city}
              editable={isOwner}
            />
            <View style={styles.row}>
              <View style={styles.halfField}>
                <FormField
                  label="State"
                  value={formData.state}
                  onChangeText={(v) => updateFormData('state', v)}
                  placeholder="State"
                  editable={isOwner}
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  label="ZIP Code"
                  value={formData.zipCode}
                  onChangeText={(v) => updateFormData('zipCode', v)}
                  placeholder="ZIP"
                  editable={isOwner}
                />
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.sectionCard}>
            <FormField
              label="Phone Number"
              value={formData.phone}
              onChangeText={(v) => updateFormData('phone', v)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              icon="📞"
              error={errors.phone}
              editable={isOwner}
            />
            <FormField
              label="Email Address"
              value={formData.email}
              onChangeText={(v) => updateFormData('email', v)}
              placeholder="Enter email address"
              keyboardType="email-address"
              icon="📧"
              error={errors.email}
              editable={isOwner}
            />
            <FormField
              label="Website"
              value={formData.website}
              onChangeText={(v) => updateFormData('website', v)}
              placeholder="www.yoursalon.com"
              keyboardType="url"
              icon="🌐"
              editable={isOwner}
            />
          </View>

          <Text style={styles.sectionTitle}>Business Settings</Text>
          <View style={styles.sectionCard}>
            <SelectField
              label="Category"
              value={formData.category}
              options={CATEGORY_OPTIONS}
              onSelect={(v) => updateFormData('category', v)}
              icon="🏷️"
            />
            <SelectField
              label="Price Range"
              value={formData.priceRange}
              options={PRICE_RANGE_OPTIONS}
              onSelect={(v) => updateFormData('priceRange', v)}
              icon="💰"
            />
            <SelectField
              label="Venue Type"
              value={formData.venueType}
              options={VENUE_TYPE_OPTIONS}
              onSelect={(v) => updateFormData('venueType', v)}
              icon="👥"
            />
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        {isOwner && (
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              <LinearGradient colors={GRADIENTS.primary} style={styles.saveButtonGradient}>
                {isSubmitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.amber}20`,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  warningIcon: {
    fontSize: 16,
  },
  warningText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.amber,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SIZES.listPaddingBottom,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  formField: {
    marginBottom: SPACING.lg,
  },
  fieldLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  inputError: {
    borderWidth: 1,
    borderColor: COLORS.red,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: SPACING.md,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  inputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.red,
    marginTop: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfField: {
    flex: 1,
  },
  selectText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  selectChevron: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  optionsContainer: {
    backgroundColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xs,
    overflow: 'hidden',
  },
  optionItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBg,
  },
  optionItemSelected: {
    backgroundColor: `${COLORS.violet}20`,
  },
  optionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  optionTextSelected: {
    color: COLORS.violet,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  saveButton: {
    flex: 2,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
});
