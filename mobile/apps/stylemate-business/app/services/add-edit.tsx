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
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
  useServiceDetail,
  useServiceCategories,
  useServiceActions,
  useStaff,
} from '@stylemate/core/hooks/useBusinessApi';
import { z } from 'zod';

const serviceFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  subCategory: z.string().optional(),
  gender: z.enum(['male', 'female', 'unisex']).optional(),
  priceInRupees: z.number().min(0, 'Price must be positive'),
  durationMinutes: z.number().min(5, 'Duration must be at least 5 minutes'),
  priceType: z.enum(['fixed', 'variable', 'starting_from']).optional(),
  specialPriceInRupees: z.number().min(0).optional(),
  staffIds: z.array(z.string()).optional(),
});

type ServiceFormData = z.infer<typeof serviceFormSchema>;

interface FormErrors {
  name?: string;
  description?: string;
  category?: string;
  priceInRupees?: string;
  durationMinutes?: string;
}

type Gender = 'male' | 'female' | 'unisex';
type PriceType = 'fixed' | 'variable' | 'starting_from';

interface FieldInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  required?: boolean;
  prefix?: string;
  suffix?: string;
}

function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType = 'default',
  multiline = false,
  required = false,
  prefix,
  suffix,
}: FieldInputProps) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.requiredMark}> *</Text>}
      </Text>
      <View style={[styles.inputWrapper, error && styles.inputWrapperError]}>
        {prefix && <Text style={styles.inputPrefix}>{prefix}</Text>}
        <TextInput
          style={[
            styles.textInput,
            multiline && styles.textInputMultiline,
            prefix && styles.textInputWithPrefix,
            suffix && styles.textInputWithSuffix,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
        {suffix && <Text style={styles.inputSuffix}>{suffix}</Text>}
      </View>
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

interface SegmentedControlProps {
  label: string;
  options: { key: string; label: string; icon?: string }[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

function SegmentedControl({ label, options, value, onChange, required }: SegmentedControlProps) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.requiredMark}> *</Text>}
      </Text>
      <View style={styles.segmentedContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[styles.segmentedOption, value === option.key && styles.segmentedOptionActive]}
            onPress={() => onChange(option.key)}
            activeOpacity={0.7}
          >
            {option.icon && <Text style={styles.segmentedIcon}>{option.icon}</Text>}
            <Text
              style={[
                styles.segmentedText,
                value === option.key && styles.segmentedTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

interface ChipSelectProps {
  label: string;
  options: { key: string; label: string; icon?: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  multiSelect?: boolean;
  required?: boolean;
}

function ChipSelect({
  label,
  options,
  selectedValues,
  onChange,
  multiSelect = true,
  required,
}: ChipSelectProps) {
  const handlePress = (key: string) => {
    if (multiSelect) {
      if (selectedValues.includes(key)) {
        onChange(selectedValues.filter((v) => v !== key));
      } else {
        onChange([...selectedValues, key]);
      }
    } else {
      onChange([key]);
    }
  };

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.requiredMark}> *</Text>}
      </Text>
      <View style={styles.chipsContainer}>
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.key);
          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => handlePress(option.key)}
              activeOpacity={0.7}
            >
              {option.icon && <Text style={styles.chipIcon}>{option.icon}</Text>}
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                {option.label}
              </Text>
              {isSelected && <Text style={styles.chipCheck}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const DEFAULT_CATEGORIES = [
  { key: 'Hair', label: 'Hair', icon: '💇' },
  { key: 'Skin', label: 'Skin', icon: '💆' },
  { key: 'Nails', label: 'Nails', icon: '💅' },
  { key: 'Spa', label: 'Spa', icon: '🧘' },
  { key: 'Makeup', label: 'Makeup', icon: '💄' },
  { key: 'Bridal', label: 'Bridal', icon: '👰' },
  { key: 'Massage', label: 'Massage', icon: '💆‍♂️' },
  { key: 'Other', label: 'Other', icon: '✂️' },
];

const GENDER_OPTIONS = [
  { key: 'unisex', label: 'Unisex', icon: '⚤' },
  { key: 'female', label: 'Female', icon: '♀️' },
  { key: 'male', label: 'Male', icon: '♂️' },
];

const PRICE_TYPE_OPTIONS = [
  { key: 'fixed', label: 'Fixed', icon: '💰' },
  { key: 'starting_from', label: 'Starting From', icon: '📈' },
  { key: 'variable', label: 'Variable', icon: '🔄' },
];

const DURATION_OPTIONS = [
  { key: '15', label: '15 min' },
  { key: '30', label: '30 min' },
  { key: '45', label: '45 min' },
  { key: '60', label: '1 hr' },
  { key: '90', label: '1.5 hr' },
  { key: '120', label: '2 hr' },
];

export default function AddEditServiceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; duplicateFrom?: string }>();
  const isEditing = !!params.id;
  const isDuplicating = !!params.duplicateFrom;

  const { data: serviceData, loading: serviceLoading } = useServiceDetail(params.id || params.duplicateFrom);
  const { data: categoriesData } = useServiceCategories();
  const { data: staffData } = useStaff();
  const { createService, updateService, deleteService, isSubmitting } = useServiceActions();

  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    category: '',
    subCategory: '',
    gender: 'unisex',
    priceInRupees: 0,
    durationMinutes: 30,
    priceType: 'fixed',
    specialPriceInRupees: undefined,
    staffIds: [],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (serviceData?.service && (isEditing || isDuplicating)) {
      const service = serviceData.service;
      setFormData({
        name: isDuplicating ? `${service.name} (Copy)` : service.name,
        description: service.description || '',
        category: service.category || '',
        subCategory: service.subCategory || '',
        gender: service.gender || 'unisex',
        priceInRupees: service.priceInPaisa / 100,
        durationMinutes: service.durationMinutes,
        priceType: service.priceType,
        specialPriceInRupees: service.specialPricePaisa
          ? service.specialPricePaisa / 100
          : undefined,
        staffIds: serviceData.assignedStaff?.map((s) => s.id) || [],
      });
      if (isDuplicating) {
        setHasChanges(true);
      }
    }
  }, [serviceData, isEditing, isDuplicating]);

  const updateField = <K extends keyof ServiceFormData>(field: K, value: ServiceFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const categoryOptions = useMemo(() => {
    if (categoriesData?.categories?.length) {
      return categoriesData.categories.map((cat) => ({
        key: cat.name,
        label: cat.name,
        icon: cat.icon,
      }));
    }
    return DEFAULT_CATEGORIES;
  }, [categoriesData]);

  const staffOptions = useMemo(() => {
    if (!staffData?.staff) return [];
    return staffData.staff.map((staff) => ({
      key: staff.id,
      label: staff.name,
      icon: '👤',
    }));
  }, [staffData]);

  const validateForm = (): boolean => {
    try {
      serviceFormSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof FormErrors;
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please check the form for errors');
      return;
    }

    const serviceParams = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      subCategory: formData.subCategory,
      gender: formData.gender,
      priceInPaisa: Math.round(formData.priceInRupees * 100),
      durationMinutes: formData.durationMinutes,
      priceType: formData.priceType,
      specialPricePaisa: formData.specialPriceInRupees
        ? Math.round(formData.specialPriceInRupees * 100)
        : undefined,
      staffIds: formData.staffIds,
    };

    let result;
    if (isEditing && params.id) {
      result = await updateService({ id: params.id, ...serviceParams });
    } else {
      result = await createService(serviceParams);
    }

    if (result.success) {
      router.back();
    } else {
      Alert.alert('Error', result.error || 'Failed to save service');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Service',
      'Are you sure you want to delete this service? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (params.id) {
              const result = await deleteService(params.id);
              if (result.success) {
                router.back();
              } else {
                Alert.alert('Error', result.error || 'Failed to delete service');
              }
            }
          },
        },
      ]
    );
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert('Unsaved Changes', 'You have unsaved changes. Are you sure you want to leave?', [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  if (isEditing && serviceLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading service...</Text>
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Service' : isDuplicating ? 'Duplicate Service' : 'Add Service'}
          </Text>
          {isEditing && !isDuplicating && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Basic Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <FieldInput
              label="Service Name"
              value={formData.name}
              onChangeText={(text) => updateField('name', text)}
              placeholder="e.g., Women's Haircut"
              error={errors.name}
              required
            />

            <FieldInput
              label="Description"
              value={formData.description || ''}
              onChangeText={(text) => updateField('description', text)}
              placeholder="Describe what this service includes..."
              multiline
            />
          </View>

          {/* Category & Gender */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Classification</Text>

            <ChipSelect
              label="Category"
              options={categoryOptions}
              selectedValues={formData.category ? [formData.category] : []}
              onChange={(values) => updateField('category', values[0] || '')}
              multiSelect={false}
              required
            />

            <FieldInput
              label="Sub-Category"
              value={formData.subCategory || ''}
              onChangeText={(text) => updateField('subCategory', text)}
              placeholder="e.g., Long Hair, Short Hair"
            />

            <SegmentedControl
              label="Gender"
              options={GENDER_OPTIONS}
              value={formData.gender || 'unisex'}
              onChange={(value) => updateField('gender', value as Gender)}
            />
          </View>

          {/* Pricing & Duration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing & Duration</Text>

            <SegmentedControl
              label="Price Type"
              options={PRICE_TYPE_OPTIONS}
              value={formData.priceType || 'fixed'}
              onChange={(value) => updateField('priceType', value as PriceType)}
            />

            <View style={styles.rowFields}>
              <View style={styles.halfField}>
                <FieldInput
                  label="Price"
                  value={formData.priceInRupees?.toString() || ''}
                  onChangeText={(text) => updateField('priceInRupees', parseFloat(text) || 0)}
                  placeholder="500"
                  keyboardType="numeric"
                  error={errors.priceInRupees}
                  required
                  prefix="₹"
                />
              </View>
              <View style={styles.halfField}>
                <FieldInput
                  label="Special Price"
                  value={formData.specialPriceInRupees?.toString() || ''}
                  onChangeText={(text) =>
                    updateField('specialPriceInRupees', text ? parseFloat(text) : undefined)
                  }
                  placeholder="400"
                  keyboardType="numeric"
                  prefix="₹"
                />
              </View>
            </View>

            <ChipSelect
              label="Duration"
              options={DURATION_OPTIONS}
              selectedValues={[formData.durationMinutes.toString()]}
              onChange={(values) =>
                updateField('durationMinutes', parseInt(values[0], 10) || 30)
              }
              multiSelect={false}
              required
            />
          </View>

          {/* Staff Assignment */}
          {staffOptions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Staff Assignment</Text>
              <Text style={styles.sectionSubtitle}>
                Select staff members who can perform this service
              </Text>

              <ChipSelect
                label="Assigned Staff"
                options={staffOptions}
                selectedValues={formData.staffIds || []}
                onChange={(values) => updateField('staffIds', values)}
                multiSelect
              />
            </View>
          )}

          <View style={{ height: SIZES.listPaddingBottom }} />
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleBack}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <LinearGradient colors={GRADIENTS.primary} style={styles.saveButtonGradient}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Update Service' : 'Create Service'}
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
    gap: SPACING.lg,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
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
    width: SIZES.buttonMedium,
    height: SIZES.buttonMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  deleteButton: {
    width: SIZES.buttonMedium,
    height: SIZES.buttonMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: FONT_SIZES.xl,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    marginTop: -SPACING.sm,
  },
  fieldContainer: {
    marginBottom: SPACING.lg,
  },
  fieldLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  requiredMark: {
    color: COLORS.red,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    minHeight: SIZES.inputHeight,
    paddingHorizontal: SPACING.md,
  },
  inputWrapperError: {
    borderColor: COLORS.red,
  },
  inputPrefix: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  inputSuffix: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginLeft: SPACING.xs,
  },
  textInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.md,
  },
  textInputMultiline: {
    minHeight: SIZES.inputHeight * 2,
    textAlignVertical: 'top',
  },
  textInputWithPrefix: {
    paddingLeft: 0,
  },
  textInputWithSuffix: {
    paddingRight: 0,
  },
  fieldError: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.red,
    marginTop: SPACING.xs,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  segmentedOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },
  segmentedOptionActive: {
    backgroundColor: COLORS.violet,
  },
  segmentedIcon: {
    fontSize: FONT_SIZES.md,
  },
  segmentedText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  segmentedTextActive: {
    color: COLORS.white,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.xs,
  },
  chipActive: {
    backgroundColor: `${COLORS.violet}20`,
    borderColor: COLORS.violet,
  },
  chipIcon: {
    fontSize: FONT_SIZES.md,
  },
  chipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.violet,
  },
  chipCheck: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.violet,
    fontWeight: '700',
  },
  rowFields: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfField: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  cancelButton: {
    flex: 1,
    height: SIZES.buttonLarge,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  saveButton: {
    flex: 2,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    height: SIZES.buttonLarge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
});
