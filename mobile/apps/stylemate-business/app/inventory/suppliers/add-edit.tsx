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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  COLORS,
  GRADIENTS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SIZES,
} from '../../../constants/theme';
import {
  useVendorDetail,
  useInventoryActions,
} from '@stylemate/core/hooks/useBusinessApi';

interface FormData {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  website: string;
  taxId: string;
  paymentTerms: string;
  notes: string;
  status: 'active' | 'inactive' | 'suspended';
  rating: string;
}

const initialFormData: FormData = {
  name: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'India',
  website: '',
  taxId: '',
  paymentTerms: 'Net 30',
  notes: '',
  status: 'active',
  rating: '5',
};

const PAYMENT_TERMS = ['COD', 'Net 15', 'Net 30', 'Net 45', 'Net 60'];
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: COLORS.green },
  { value: 'inactive', label: 'Inactive', color: COLORS.textMuted },
  { value: 'suspended', label: 'Suspended', color: COLORS.red },
];

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'url';
  multiline?: boolean;
  required?: boolean;
  error?: string;
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  required = false,
  error,
}: FormFieldProps) {
  return (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.requiredStar}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.textInput,
          multiline && styles.textInputMultiline,
          error && styles.textInputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

export default function AddEditSupplier() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!params.id;

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { vendor, loading: vendorLoading } = useVendorDetail(params.id);
  const { createVendor, updateVendor, isSubmitting } = useInventoryActions();

  useEffect(() => {
    if (vendor && isEditing) {
      setFormData({
        name: vendor.name || '',
        contactPerson: vendor.contactPerson || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        address: vendor.address || '',
        city: vendor.city || '',
        state: vendor.state || '',
        zipCode: vendor.zipCode || '',
        country: vendor.country || 'India',
        website: vendor.website || '',
        taxId: vendor.taxId || '',
        paymentTerms: vendor.paymentTerms || 'Net 30',
        notes: vendor.notes || '',
        status: vendor.status || 'active',
        rating: String(vendor.rating) || '5',
      });
    }
  }, [vendor, isEditing]);

  const updateFormData = (key: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Supplier name is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const vendorData = {
      name: formData.name.trim(),
      contactPerson: formData.contactPerson.trim() || undefined,
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      address: formData.address.trim() || undefined,
      city: formData.city.trim() || undefined,
      state: formData.state.trim() || undefined,
      zipCode: formData.zipCode.trim() || undefined,
      country: formData.country.trim() || 'India',
      website: formData.website.trim() || undefined,
      taxId: formData.taxId.trim() || undefined,
      paymentTerms: formData.paymentTerms || undefined,
      notes: formData.notes.trim() || undefined,
      status: formData.status,
      rating: formData.rating,
    };

    let result;
    if (isEditing && vendor) {
      result = await updateVendor(vendor.id, vendorData);
    } else {
      result = await createVendor(vendorData);
    }

    if (result.success) {
      Alert.alert('Success', `Supplier ${isEditing ? 'updated' : 'created'} successfully`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to save supplier');
    }
  };

  if (isEditing && vendorLoading) {
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Supplier' : 'Add Supplier'}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <FormField
              label="Supplier Name"
              value={formData.name}
              onChangeText={(text) => updateFormData('name', text)}
              placeholder="e.g., ABC Beauty Supplies"
              required
              error={errors.name}
            />

            <FormField
              label="Contact Person"
              value={formData.contactPerson}
              onChangeText={(text) => updateFormData('contactPerson', text)}
              placeholder="Primary contact name"
            />

            <FormField
              label="Email"
              value={formData.email}
              onChangeText={(text) => updateFormData('email', text)}
              placeholder="supplier@example.com"
              keyboardType="email-address"
              error={errors.email}
            />

            <FormField
              label="Phone"
              value={formData.phone}
              onChangeText={(text) => updateFormData('phone', text)}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
            />

            <FormField
              label="Website"
              value={formData.website}
              onChangeText={(text) => updateFormData('website', text)}
              placeholder="www.supplier.com"
              keyboardType="url"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>

            <FormField
              label="Street Address"
              value={formData.address}
              onChangeText={(text) => updateFormData('address', text)}
              placeholder="123 Main Street"
            />

            <View style={styles.rowFields}>
              <View style={styles.halfField}>
                <FormField
                  label="City"
                  value={formData.city}
                  onChangeText={(text) => updateFormData('city', text)}
                  placeholder="Mumbai"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  label="State"
                  value={formData.state}
                  onChangeText={(text) => updateFormData('state', text)}
                  placeholder="Maharashtra"
                />
              </View>
            </View>

            <View style={styles.rowFields}>
              <View style={styles.halfField}>
                <FormField
                  label="ZIP Code"
                  value={formData.zipCode}
                  onChangeText={(text) => updateFormData('zipCode', text)}
                  placeholder="400001"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  label="Country"
                  value={formData.country}
                  onChangeText={(text) => updateFormData('country', text)}
                  placeholder="India"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Details</Text>

            <FormField
              label="Tax ID / GST Number"
              value={formData.taxId}
              onChangeText={(text) => updateFormData('taxId', text)}
              placeholder="GSTIN1234567890"
            />

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Payment Terms</Text>
              <View style={styles.chipContainer}>
                {PAYMENT_TERMS.map((term) => (
                  <TouchableOpacity
                    key={term}
                    style={[styles.chip, formData.paymentTerms === term && styles.chipActive]}
                    onPress={() => updateFormData('paymentTerms', term)}
                  >
                    <Text style={[styles.chipText, formData.paymentTerms === term && styles.chipTextActive]}>
                      {term}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Status</Text>
              <View style={styles.statusOptions}>
                {STATUS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.statusOption,
                      formData.status === option.value && { backgroundColor: `${option.color}20`, borderColor: option.color },
                    ]}
                    onPress={() => updateFormData('status', option.value)}
                  >
                    <View style={[styles.statusDot, { backgroundColor: option.color }]} />
                    <Text style={[styles.statusOptionText, formData.status === option.value && { color: option.color }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Rating (1-5)</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[styles.ratingStar, Number(formData.rating) >= num && styles.ratingStarActive]}
                    onPress={() => updateFormData('rating', String(num))}
                  >
                    <Text style={styles.ratingStarText}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <FormField
              label="Notes"
              value={formData.notes}
              onChangeText={(text) => updateFormData('notes', text)}
              placeholder="Internal notes about this supplier..."
              multiline
            />
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Update Supplier' : 'Create Supplier'}
                </Text>
              )}
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
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
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  section: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  formField: {
    marginBottom: SPACING.lg,
  },
  fieldLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  requiredStar: {
    color: COLORS.red,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  textInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textInputError: {
    borderColor: COLORS.red,
  },
  errorText: {
    color: COLORS.red,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
  rowFields: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfField: {
    flex: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  chip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  chipActive: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  chipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  statusOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    gap: SPACING.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOptionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  ratingStar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  ratingStarActive: {
    backgroundColor: COLORS.amber,
    borderColor: COLORS.amber,
  },
  ratingStarText: {
    fontSize: 24,
    color: COLORS.white,
  },
  bottomBar: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
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
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
});
