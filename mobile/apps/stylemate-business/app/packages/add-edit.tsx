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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo, useCallback } from 'react';
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
  usePackageDetail,
  useAvailableServicesForPackage,
  usePackageActions,
  useServiceCategories,
} from '@stylemate/core/hooks/useBusinessApi';
import type { ServiceListItem, CreatePackageParams, PackageService } from '@stylemate/core/services/businessApi';
import type { GestureResponderEvent } from 'react-native';
import { z } from 'zod';

type WizardStep = 1 | 2 | 3;
type ScheduleType = 'sequential' | 'parallel';
type PricingType = 'service_pricing' | 'custom' | 'percentage_discount' | 'free';
type GenderAvailability = 'everyone' | 'women' | 'men';
type ExtraTimeType = 'processing' | 'blocked';

interface SelectedService {
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  durationMinutes: number;
  category: string;
  extraTimeMinutes?: number;
  extraTimeType?: ExtraTimeType;
}

const packageFormSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  category: z.string().optional(),
  scheduleType: z.enum(['sequential', 'parallel']),
  pricingType: z.enum(['service_pricing', 'custom', 'percentage_discount', 'free']),
  customPriceInRupees: z.number().min(0).optional(),
  discountPercentage: z.number().min(1).max(99).optional(),
  taxRatePercentage: z.number().min(0).max(100).optional(),
  validityDays: z.number().min(0).optional(),
  isOnlineBookingEnabled: z.boolean(),
  genderAvailability: z.enum(['everyone', 'women', 'men']),
});

interface FormErrors {
  name?: string;
  category?: string;
  services?: string;
  customPriceInRupees?: string;
  discountPercentage?: string;
}

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
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
      </View>
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

interface RadioOptionProps {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  icon?: string;
}

function RadioOption({ label, description, selected, onPress, icon }: RadioOptionProps) {
  return (
    <TouchableOpacity
      style={[styles.radioOption, selected && styles.radioOptionSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
        {selected && <View style={styles.radioCircleInner} />}
      </View>
      <View style={styles.radioContent}>
        <View style={styles.radioLabelRow}>
          {icon && <Text style={styles.radioIcon}>{icon}</Text>}
          <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>{label}</Text>
        </View>
        {description && <Text style={styles.radioDescription}>{description}</Text>}
      </View>
    </TouchableOpacity>
  );
}

interface ChipSelectorProps {
  options: { key: string; label: string }[];
  selectedValue: string;
  onChange: (value: string) => void;
}

function ChipSelector({ options, selectedValue, onChange }: ChipSelectorProps) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[styles.chip, selectedValue === option.key && styles.chipSelected]}
          onPress={() => onChange(option.key)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, selectedValue === option.key && styles.chipTextSelected]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

interface ServiceCardSelectProps {
  service: ServiceListItem;
  selected: boolean;
  selectedService?: SelectedService;
  onToggle: () => void;
  onExtraTimePress: () => void;
}

function ServiceCardSelect({ service, selected, selectedService, onToggle, onExtraTimePress }: ServiceCardSelectProps) {
  const priceFormatted = (service.priceInPaisa / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  return (
    <TouchableOpacity
      style={[styles.serviceCardSelect, selected && styles.serviceCardSelectActive]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[styles.serviceCheckbox, selected && styles.serviceCheckboxChecked]}>
        {selected && <Text style={styles.serviceCheckmark}>✓</Text>}
      </View>
      <View style={styles.serviceCardContent}>
        <Text style={styles.serviceCardName} numberOfLines={1}>{service.name}</Text>
        <View style={styles.serviceCardDetails}>
          <Text style={styles.serviceCardPrice}>{priceFormatted}</Text>
          <Text style={styles.serviceCardDuration}>{service.durationMinutes} min</Text>
        </View>
        {selectedService?.extraTimeMinutes && (
          <View style={styles.extraTimeIndicator}>
            <Text style={styles.extraTimeText}>
              +{selectedService.extraTimeMinutes}min {selectedService.extraTimeType === 'processing' ? '(Processing)' : '(Blocked)'}
            </Text>
          </View>
        )}
      </View>
      {selected && (
        <TouchableOpacity
          style={styles.moreButton}
          onPress={(e: GestureResponderEvent) => {
            e.stopPropagation();
            onExtraTimePress();
          }}
        >
          <Text style={styles.moreButtonText}>⋮</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

interface ExtraTimeModalProps {
  visible: boolean;
  onClose: () => void;
  service: SelectedService | null;
  onApply: (extraTimeMinutes: number, extraTimeType: ExtraTimeType) => void;
  onRemove: () => void;
}

function ExtraTimeModal({ visible, onClose, service, onApply, onRemove }: ExtraTimeModalProps) {
  const [extraTimeType, setExtraTimeType] = useState<ExtraTimeType>(service?.extraTimeType || 'processing');
  const [duration, setDuration] = useState<number>(service?.extraTimeMinutes || 15);

  useEffect(() => {
    if (service) {
      setExtraTimeType(service.extraTimeType || 'processing');
      setDuration(service.extraTimeMinutes || 15);
    }
  }, [service]);

  const durationOptions = [
    { key: '10', label: '10' },
    { key: '15', label: '15' },
    { key: '20', label: '20' },
    { key: '30', label: '30' },
    { key: '45', label: '45' },
    { key: '60', label: '60' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Extra Time</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalCloseBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {service && (
            <Text style={styles.modalSubtitle}>For: {service.serviceName}</Text>
          )}

          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Extra Time Type</Text>
            <RadioOption
              label="Processing Time"
              description="Staff can take other bookings during this time (e.g., color processing)"
              selected={extraTimeType === 'processing'}
              onPress={() => setExtraTimeType('processing')}
              icon="⏱️"
            />
            <RadioOption
              label="Blocked Time"
              description="Gap between appointments for prep, cleanup, or transition. No other bookings allowed."
              selected={extraTimeType === 'blocked'}
              onPress={() => setExtraTimeType('blocked')}
              icon="🚫"
            />
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Duration (minutes)</Text>
            <View style={styles.durationChips}>
              {durationOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.durationChip, duration === parseInt(opt.key) && styles.durationChipSelected]}
                  onPress={() => setDuration(parseInt(opt.key))}
                >
                  <Text style={[styles.durationChipText, duration === parseInt(opt.key) && styles.durationChipTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalActions}>
            {service?.extraTimeMinutes && (
              <TouchableOpacity style={styles.removeExtraTimeBtn} onPress={onRemove}>
                <Text style={styles.removeExtraTimeBtnText}>Remove Extra Time</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => onApply(duration, extraTimeType)}
            >
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.applyBtnGradient}
              >
                <Text style={styles.applyBtnText}>Apply</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function AddEditPackageScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('sequential');
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [pricingType, setPricingType] = useState<PricingType>('custom');
  const [customPriceInRupees, setCustomPriceInRupees] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('15');
  const [taxRatePercentage, setTaxRatePercentage] = useState('18');
  const [validityDays, setValidityDays] = useState('0');
  const [isOnlineBookingEnabled, setIsOnlineBookingEnabled] = useState(true);
  const [genderAvailability, setGenderAvailability] = useState<GenderAvailability>('everyone');
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<FormErrors>({});

  const [extraTimeModalVisible, setExtraTimeModalVisible] = useState(false);
  const [selectedServiceForExtraTime, setSelectedServiceForExtraTime] = useState<SelectedService | null>(null);

  const { data: packageData, loading: loadingPackage } = usePackageDetail(id);
  const { data: servicesData, loading: loadingServices } = useAvailableServicesForPackage();
  const { data: categoriesData } = useServiceCategories();
  const { createPackage, updatePackage, deletePackage, isSubmitting } = usePackageActions();

  const availableServices = servicesData?.services || [];
  const servicesByCategory = servicesData?.byCategory || {};
  const categories = categoriesData?.categories || [];

  useEffect(() => {
    if (packageData?.package && isEditing) {
      const pkg = packageData.package;
      setName(pkg.name);
      setDescription(pkg.description || '');
      setCategory(pkg.category || '');
      setScheduleType(pkg.scheduleType);
      setPricingType(pkg.pricingType);
      setCustomPriceInRupees((pkg.packagePriceInPaisa / 100).toString());
      setDiscountPercentage(pkg.discountPercentage.toString());
      setTaxRatePercentage(pkg.taxRatePercentage.toString());
      setValidityDays(pkg.validityDays?.toString() || '0');
      setIsOnlineBookingEnabled(pkg.isOnlineBookingEnabled === 1);
      setGenderAvailability(pkg.genderAvailability);
      setSelectedServices(pkg.services.map((s: PackageService) => ({
        serviceId: s.serviceId,
        serviceName: s.serviceName,
        servicePrice: s.servicePrice,
        durationMinutes: s.durationMinutes,
        category: s.category,
        extraTimeMinutes: s.extraTimeMinutes,
        extraTimeType: s.extraTimeType,
      })));
    }
  }, [packageData, isEditing]);

  const regularPriceInPaisa = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.servicePrice, 0);
  }, [selectedServices]);

  const totalDurationMinutes = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.durationMinutes + (s.extraTimeMinutes || 0), 0);
  }, [selectedServices]);

  const calculatedPackagePrice = useMemo(() => {
    switch (pricingType) {
      case 'service_pricing':
        return regularPriceInPaisa;
      case 'custom':
        return Math.round(parseFloat(customPriceInRupees || '0') * 100);
      case 'percentage_discount':
        const discount = parseFloat(discountPercentage || '0');
        return Math.round(regularPriceInPaisa * (1 - discount / 100));
      case 'free':
        return 0;
      default:
        return regularPriceInPaisa;
    }
  }, [pricingType, regularPriceInPaisa, customPriceInRupees, discountPercentage]);

  const calculatedDiscount = useMemo(() => {
    if (regularPriceInPaisa === 0) return 0;
    return Math.round((1 - calculatedPackagePrice / regularPriceInPaisa) * 100);
  }, [regularPriceInPaisa, calculatedPackagePrice]);

  const savingsAmount = regularPriceInPaisa - calculatedPackagePrice;

  const filteredServicesByCategory = useMemo(() => {
    const filtered: Record<string, ServiceListItem[]> = {};
    const searchLower = serviceSearchQuery.toLowerCase();

    Object.entries(servicesByCategory).forEach(([cat, services]: [string, ServiceListItem[]]) => {
      const matchingServices = services.filter((s: ServiceListItem) =>
        s.name.toLowerCase().includes(searchLower)
      );
      if (matchingServices.length > 0) {
        filtered[cat] = matchingServices;
      }
    });

    return filtered;
  }, [servicesByCategory, serviceSearchQuery]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cat)) {
        newSet.delete(cat);
      } else {
        newSet.add(cat);
      }
      return newSet;
    });
  };

  const toggleServiceSelection = (service: ServiceListItem) => {
    setHasChanges(true);
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.serviceId === service.id);
      if (exists) {
        return prev.filter((s) => s.serviceId !== service.id);
      }
      return [
        ...prev,
        {
          serviceId: service.id,
          serviceName: service.name,
          servicePrice: service.priceInPaisa,
          durationMinutes: service.durationMinutes,
          category: service.category || 'Uncategorized',
        },
      ];
    });
  };

  const openExtraTimeModal = (service: SelectedService) => {
    setSelectedServiceForExtraTime(service);
    setExtraTimeModalVisible(true);
  };

  const handleApplyExtraTime = (extraTimeMinutes: number, extraTimeType: ExtraTimeType) => {
    if (!selectedServiceForExtraTime) return;
    setHasChanges(true);
    setSelectedServices((prev) =>
      prev.map((s) =>
        s.serviceId === selectedServiceForExtraTime.serviceId
          ? { ...s, extraTimeMinutes, extraTimeType }
          : s
      )
    );
    setExtraTimeModalVisible(false);
    setSelectedServiceForExtraTime(null);
  };

  const handleRemoveExtraTime = () => {
    if (!selectedServiceForExtraTime) return;
    setHasChanges(true);
    setSelectedServices((prev) =>
      prev.map((s) =>
        s.serviceId === selectedServiceForExtraTime.serviceId
          ? { ...s, extraTimeMinutes: undefined, extraTimeType: undefined }
          : s
      )
    );
    setExtraTimeModalVisible(false);
    setSelectedServiceForExtraTime(null);
  };

  const validateStep = (step: WizardStep): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      if (!name || name.length < 3) {
        newErrors.name = 'Name must be at least 3 characters';
      }
    }

    if (step === 2) {
      if (selectedServices.length < 2) {
        newErrors.services = 'Please select at least 2 services';
      }
    }

    if (step === 3) {
      if (pricingType === 'custom') {
        const price = parseFloat(customPriceInRupees || '0');
        if (price <= 0) {
          newErrors.customPriceInRupees = 'Price must be greater than 0';
        }
      }
      if (pricingType === 'percentage_discount') {
        const discount = parseFloat(discountPercentage || '0');
        if (discount < 1 || discount > 99) {
          newErrors.discountPercentage = 'Discount must be between 1% and 99%';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    } else {
      if (hasChanges) {
        Alert.alert(
          'Unsaved Changes',
          'You have unsaved changes. Are you sure you want to leave?',
          [
            { text: 'Stay', style: 'cancel' },
            { text: 'Leave', style: 'destructive', onPress: () => router.back() },
          ]
        );
      } else {
        router.back();
      }
    }
  };

  const handleSave = async () => {
    if (!validateStep(3)) return;

    setIsSaving(true);
    try {
      const params: CreatePackageParams = {
        name,
        description: description || undefined,
        category: category || undefined,
        scheduleType,
        pricingType,
        customPriceInPaisa: pricingType === 'custom' ? Math.round(parseFloat(customPriceInRupees) * 100) : undefined,
        discountPercentage: pricingType === 'percentage_discount' ? parseFloat(discountPercentage) : undefined,
        taxRatePercentage: parseFloat(taxRatePercentage) || 18,
        validityDays: parseInt(validityDays) || undefined,
        isOnlineBookingEnabled,
        genderAvailability,
        services: selectedServices.map((s) => ({
          serviceId: s.serviceId,
          extraTimeMinutes: s.extraTimeMinutes,
          extraTimeType: s.extraTimeType,
        })),
      };

      const result = isEditing
        ? await updatePackage({ id: id!, ...params })
        : await createPackage(params);

      if (result.success) {
        Alert.alert('Success', isEditing ? 'Package updated successfully' : 'Package created successfully');
        router.back();
      } else {
        Alert.alert('Error', result.error || 'Failed to save package');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Package',
      'Are you sure you want to delete this package? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deletePackage(id!);
            if (result.success) {
              Alert.alert('Deleted', 'Package has been deleted');
              router.back();
            } else {
              Alert.alert('Error', result.error || 'Failed to delete package');
            }
          },
        },
      ]
    );
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              currentStep >= step && styles.stepCircleActive,
              currentStep === step && styles.stepCircleCurrent,
            ]}
          >
            <Text
              style={[
                styles.stepNumber,
                currentStep >= step && styles.stepNumberActive,
              ]}
            >
              {currentStep > step ? '✓' : step}
            </Text>
          </View>
          <Text style={[styles.stepLabel, currentStep >= step && styles.stepLabelActive]}>
            {step === 1 ? 'Details' : step === 2 ? 'Services' : 'Pricing'}
          </Text>
          {step < 3 && (
            <View style={[styles.stepLine, currentStep > step && styles.stepLineActive]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <FieldInput
        label="Package Name"
        value={name}
        onChangeText={(text) => { setName(text); setHasChanges(true); }}
        placeholder="e.g., Bridal Package, Summer Glow"
        error={errors.name}
        required
      />

      <FieldInput
        label="Description"
        value={description}
        onChangeText={(text) => { setDescription(text); setHasChanges(true); }}
        placeholder="Describe what's included in this package..."
        multiline
      />

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categoryChips}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, category === cat.name && styles.categoryChipSelected]}
                onPress={() => { setCategory(cat.name); setHasChanges(true); }}
              >
                <Text style={[styles.categoryChipText, category === cat.name && styles.categoryChipTextSelected]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.proTipCard}>
        <Text style={styles.proTipIcon}>💡</Text>
        <View style={styles.proTipContent}>
          <Text style={styles.proTipTitle}>Pro Tip</Text>
          <Text style={styles.proTipText}>
            Packages with clear names and descriptions tend to sell 40% more. Be specific about what's included!
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Schedule Type *</Text>
        <RadioOption
          label="Booked in Sequence"
          description="Services performed one after another by the same staff member"
          selected={scheduleType === 'sequential'}
          onPress={() => { setScheduleType('sequential'); setHasChanges(true); }}
          icon="📋"
        />
        <RadioOption
          label="Booked in Parallel"
          description="Services can be performed at the same time by multiple staff (e.g., mani + pedi)"
          selected={scheduleType === 'parallel'}
          onPress={() => { setScheduleType('parallel'); setHasChanges(true); }}
          icon="⚡"
        />
      </View>

      <View style={styles.servicesHeader}>
        <Text style={styles.fieldLabel}>Select Services *</Text>
        <Text style={styles.selectedCount}>
          {selectedServices.length} selected (min 2)
        </Text>
      </View>

      {errors.services && (
        <Text style={styles.fieldError}>{errors.services}</Text>
      )}

      <View style={styles.serviceSearchContainer}>
        <Text style={styles.searchIconSmall}>🔍</Text>
        <TextInput
          style={styles.serviceSearchInput}
          value={serviceSearchQuery}
          onChangeText={setServiceSearchQuery}
          placeholder="Search services..."
          placeholderTextColor={COLORS.textMuted}
        />
      </View>

      {loadingServices ? (
        <View style={styles.loadingServices}>
          <ActivityIndicator size="small" color={COLORS.violet} />
          <Text style={styles.loadingServicesText}>Loading services...</Text>
        </View>
      ) : (
        Object.entries(filteredServicesByCategory).map(([cat, services]) => (
          <View key={cat} style={styles.categorySection}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => toggleCategory(cat)}
              activeOpacity={0.7}
            >
              <Text style={styles.categoryName}>{cat}</Text>
              <View style={styles.categoryRight}>
                <Text style={styles.categoryCount}>{services.length}</Text>
                <Text style={styles.categoryArrow}>
                  {expandedCategories.has(cat) ? '▼' : '▶'}
                </Text>
              </View>
            </TouchableOpacity>
            {expandedCategories.has(cat) && (
              <View style={styles.categoryServices}>
                {services.map((service) => {
                  const selected = selectedServices.some((s) => s.serviceId === service.id);
                  const selectedService = selectedServices.find((s) => s.serviceId === service.id);
                  return (
                    <ServiceCardSelect
                      key={service.id}
                      service={service}
                      selected={selected}
                      selectedService={selectedService}
                      onToggle={() => toggleServiceSelection(service)}
                      onExtraTimePress={() => selectedService && openExtraTimeModal(selectedService)}
                    />
                  );
                })}
              </View>
            )}
          </View>
        ))
      )}

      {selectedServices.length > 0 && (
        <View style={styles.selectionSummary}>
          <Text style={styles.summaryTitle}>Selection Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Services:</Text>
            <Text style={styles.summaryValue}>{selectedServices.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Duration:</Text>
            <Text style={styles.summaryValue}>{totalDurationMinutes} min</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Regular Price:</Text>
            <Text style={styles.summaryValue}>
              {(regularPriceInPaisa / 100).toLocaleString('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0,
              })}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Pricing Type *</Text>
        <RadioOption
          label="Service Pricing"
          description={`Total cost of all services: ${(regularPriceInPaisa / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}`}
          selected={pricingType === 'service_pricing'}
          onPress={() => { setPricingType('service_pricing'); setHasChanges(true); }}
          icon="💵"
        />
        <RadioOption
          label="Custom Price"
          description="Set your own bundle price"
          selected={pricingType === 'custom'}
          onPress={() => { setPricingType('custom'); setHasChanges(true); }}
          icon="✏️"
        />
        <RadioOption
          label="Percentage Discount"
          description="Apply % off total price"
          selected={pricingType === 'percentage_discount'}
          onPress={() => { setPricingType('percentage_discount'); setHasChanges(true); }}
          icon="🏷️"
        />
        <RadioOption
          label="Free"
          description="No charge for this bundle (promotional)"
          selected={pricingType === 'free'}
          onPress={() => { setPricingType('free'); setHasChanges(true); }}
          icon="🎁"
        />
      </View>

      {pricingType === 'custom' && (
        <FieldInput
          label="Package Price"
          value={customPriceInRupees}
          onChangeText={(text) => { setCustomPriceInRupees(text); setHasChanges(true); }}
          placeholder="Enter price"
          keyboardType="numeric"
          error={errors.customPriceInRupees}
          required
          prefix="₹"
        />
      )}

      {pricingType === 'percentage_discount' && (
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Discount Percentage *</Text>
          <ChipSelector
            options={[
              { key: '10', label: '10%' },
              { key: '15', label: '15%' },
              { key: '20', label: '20%' },
              { key: '25', label: '25%' },
            ]}
            selectedValue={discountPercentage}
            onChange={(val) => { setDiscountPercentage(val); setHasChanges(true); }}
          />
          <View style={styles.customDiscountRow}>
            <Text style={styles.customDiscountLabel}>Or custom:</Text>
            <TextInput
              style={styles.customDiscountInput}
              value={discountPercentage}
              onChangeText={(text) => { setDiscountPercentage(text); setHasChanges(true); }}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.customDiscountSuffix}>%</Text>
          </View>
          {errors.discountPercentage && (
            <Text style={styles.fieldError}>{errors.discountPercentage}</Text>
          )}
        </View>
      )}

      {(pricingType !== 'service_pricing' && selectedServices.length >= 2) && (
        <View style={[styles.dealCard, savingsAmount < 0 && styles.premiumCard]}>
          <View style={styles.dealHeader}>
            <Text style={styles.dealEmoji}>{savingsAmount >= 0 ? '🎉' : '💎'}</Text>
            <Text style={[styles.dealTitle, savingsAmount < 0 && styles.premiumTitle]}>
              {savingsAmount >= 0 ? 'Great Deal!' : 'Premium Package'}
            </Text>
            {calculatedDiscount > 0 && (
              <View style={styles.dealBadge}>
                <Text style={styles.dealBadgeText}>{calculatedDiscount}% OFF</Text>
              </View>
            )}
          </View>
          <View style={styles.dealRow}>
            <Text style={styles.dealLabel}>Regular Price:</Text>
            <Text style={savingsAmount >= 0 ? styles.dealRegularPrice : styles.dealRegularPriceNormal}>
              {(regularPriceInPaisa / 100).toLocaleString('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0,
              })}
            </Text>
          </View>
          <View style={styles.dealRow}>
            <Text style={styles.dealLabel}>Package Price:</Text>
            <Text style={styles.dealPackagePrice}>
              {(calculatedPackagePrice / 100).toLocaleString('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0,
              })}
            </Text>
          </View>
          {savingsAmount > 0 && (
            <View style={styles.dealRow}>
              <Text style={styles.dealLabel}>Customer Saves:</Text>
              <Text style={styles.dealSavings}>
                {(savingsAmount / 100).toLocaleString('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>
          )}
          {savingsAmount < 0 && (
            <View style={styles.premiumHint}>
              <Text style={styles.premiumHintText}>
                This is a premium bundle priced above individual services
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Tax Rate</Text>
        <ChipSelector
          options={[
            { key: '0', label: 'No Tax' },
            { key: '5', label: '5% GST' },
            { key: '12', label: '12% GST' },
            { key: '18', label: '18% GST' },
          ]}
          selectedValue={taxRatePercentage}
          onChange={(val) => { setTaxRatePercentage(val); setHasChanges(true); }}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Validity</Text>
        <ChipSelector
          options={[
            { key: '0', label: 'No Expiry' },
            { key: '30', label: '30 Days' },
            { key: '60', label: '60 Days' },
            { key: '90', label: '90 Days' },
          ]}
          selectedValue={validityDays}
          onChange={(val) => { setValidityDays(val); setHasChanges(true); }}
        />
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.fieldLabel}>Online Booking Settings</Text>
        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => { setIsOnlineBookingEnabled(!isOnlineBookingEnabled); setHasChanges(true); }}
          activeOpacity={0.7}
        >
          <View style={styles.toggleContent}>
            <Text style={styles.toggleLabel}>Enable online booking</Text>
            <Text style={styles.toggleHint}>Show on Stylemate marketplace</Text>
          </View>
          <View style={[styles.toggleSwitch, isOnlineBookingEnabled && styles.toggleSwitchActive]}>
            <View style={[styles.toggleKnob, isOnlineBookingEnabled && styles.toggleKnobActive]} />
          </View>
        </TouchableOpacity>

        {isOnlineBookingEnabled && (
          <View style={styles.genderSection}>
            <Text style={styles.genderLabel}>Available for:</Text>
            <View style={styles.genderOptions}>
              {(['everyone', 'women', 'men'] as GenderAvailability[]).map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[styles.genderOption, genderAvailability === gender && styles.genderOptionActive]}
                  onPress={() => { setGenderAvailability(gender); setHasChanges(true); }}
                >
                  <Text style={[styles.genderOptionText, genderAvailability === gender && styles.genderOptionTextActive]}>
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {isEditing && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Package</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  if (loadingPackage && isEditing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading package...</Text>
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
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Package' : 'Create Package'}
          </Text>
          <TouchableOpacity
            style={[styles.saveButton, (isSaving || isSubmitting) && styles.saveButtonDisabled]}
            onPress={currentStep === 3 ? handleSave : handleNext}
            disabled={isSaving || isSubmitting}
          >
            {(isSaving || isSubmitting) ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonText}>
                  {currentStep === 3 ? (isEditing ? 'Update' : 'Create') : 'Next'}
                </Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>

        {renderStepIndicator()}

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </KeyboardAvoidingView>

      <ExtraTimeModal
        visible={extraTimeModalVisible}
        onClose={() => setExtraTimeModalVisible(false)}
        service={selectedServiceForExtraTime}
        onApply={handleApplyExtraTime}
        onRemove={handleRemoveExtraTime}
      />
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
    gap: SPACING.md,
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
    padding: SPACING.sm,
  },
  backIcon: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  saveButton: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: SIZES.buttonMedium,
    height: SIZES.buttonMedium,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.cardBg,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  stepCircleCurrent: {
    borderColor: COLORS.fuchsia,
    borderWidth: 3,
  },
  stepNumber: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  stepNumberActive: {
    color: COLORS.white,
  },
  stepLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  stepLabelActive: {
    color: COLORS.violet,
    fontWeight: '600',
  },
  stepLine: {
    position: 'absolute',
    top: SIZES.buttonMedium / 2,
    left: '60%',
    right: '-40%',
    height: 2,
    backgroundColor: COLORS.cardBorder,
  },
  stepLineActive: {
    backgroundColor: COLORS.violet,
  },
  stepContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  fieldContainer: {
    marginBottom: SPACING.lg,
  },
  fieldLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
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
    paddingHorizontal: SPACING.md,
  },
  inputWrapperError: {
    borderColor: COLORS.red,
  },
  inputPrefix: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  textInput: {
    flex: 1,
    height: SIZES.inputHeight,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  textInputMultiline: {
    height: SIZES.inputHeight * 2,
    textAlignVertical: 'top',
    paddingTop: SPACING.md,
  },
  textInputWithPrefix: {
    paddingLeft: 0,
  },
  fieldError: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.red,
    marginTop: SPACING.xs,
  },
  categoryChips: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  categoryChipSelected: {
    backgroundColor: `${COLORS.violet}20`,
    borderColor: COLORS.violet,
  },
  categoryChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  categoryChipTextSelected: {
    color: COLORS.violet,
    fontWeight: '600',
  },
  proTipCard: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.amber}15`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  proTipIcon: {
    fontSize: FONT_SIZES.xxl,
  },
  proTipContent: {
    flex: 1,
  },
  proTipTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.amber,
    marginBottom: SPACING.xs,
  },
  proTipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  radioOptionSelected: {
    borderColor: COLORS.violet,
    backgroundColor: `${COLORS.violet}10`,
  },
  radioCircle: {
    width: SPACING.xl,
    height: SPACING.xl,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    marginTop: SPACING.xs,
  },
  radioCircleSelected: {
    borderColor: COLORS.violet,
  },
  radioCircleInner: {
    width: SPACING.md,
    height: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.violet,
  },
  radioContent: {
    flex: 1,
  },
  radioLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  radioIcon: {
    fontSize: FONT_SIZES.lg,
  },
  radioLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  radioLabelSelected: {
    color: COLORS.violet,
  },
  radioDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    lineHeight: FONT_SIZES.sm * 1.4,
  },
  servicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  selectedCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.violet,
    fontWeight: '500',
  },
  serviceSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  searchIconSmall: {
    fontSize: FONT_SIZES.md,
    marginRight: SPACING.sm,
  },
  serviceSearchInput: {
    flex: 1,
    height: SIZES.buttonMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  loadingServices: {
    alignItems: 'center',
    padding: SPACING.xxl,
    gap: SPACING.md,
  },
  loadingServicesText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  categorySection: {
    marginBottom: SPACING.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  categoryName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  categoryCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    backgroundColor: `${COLORS.violet}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  categoryArrow: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  categoryServices: {
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  serviceCardSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  serviceCardSelectActive: {
    borderColor: COLORS.violet,
    backgroundColor: `${COLORS.violet}10`,
  },
  serviceCheckbox: {
    width: SPACING.xl,
    height: SPACING.xl,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  serviceCheckboxChecked: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  serviceCheckmark: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: '700',
  },
  serviceCardContent: {
    flex: 1,
  },
  serviceCardName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  serviceCardDetails: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  serviceCardPrice: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.green,
    fontWeight: '600',
  },
  serviceCardDuration: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  extraTimeIndicator: {
    marginTop: SPACING.xs,
  },
  extraTimeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.amber,
    fontWeight: '500',
  },
  moreButton: {
    padding: SPACING.sm,
  },
  moreButtonText: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textSecondary,
  },
  selectionSummary: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  summaryTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  chipSelected: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  chipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  chipTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  customDiscountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  customDiscountLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  customDiscountInput: {
    width: SIZES.emojiLarge,
    height: SIZES.buttonMedium,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    textAlign: 'center',
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  customDiscountSuffix: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  dealCard: {
    backgroundColor: `${COLORS.green}15`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: `${COLORS.green}30`,
  },
  dealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  dealEmoji: {
    fontSize: FONT_SIZES.xxl,
  },
  dealTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.green,
    flex: 1,
  },
  dealBadge: {
    backgroundColor: COLORS.green,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  dealBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.white,
  },
  dealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  dealLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  dealRegularPrice: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  dealPackagePrice: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dealSavings: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.green,
  },
  premiumCard: {
    backgroundColor: `${COLORS.violet}15`,
    borderColor: `${COLORS.violet}30`,
  },
  premiumTitle: {
    color: COLORS.violet,
  },
  dealRegularPriceNormal: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  premiumHint: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: `${COLORS.violet}20`,
  },
  premiumHintText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  settingsSection: {
    marginBottom: SPACING.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  toggleContent: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  toggleHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  toggleSwitch: {
    width: SIZES.iconXLarge,
    height: SPACING.xxl,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.cardBorder,
    padding: SPACING.xs,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: COLORS.violet,
  },
  toggleKnob: {
    width: SPACING.lg,
    height: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  genderSection: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  genderLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  genderOption: {
    flex: 1,
    paddingVertical: SPACING.sm,
    backgroundColor: `${COLORS.cardBorder}50`,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  genderOptionActive: {
    backgroundColor: `${COLORS.violet}20`,
    borderColor: COLORS.violet,
  },
  genderOptionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  genderOptionTextActive: {
    color: COLORS.violet,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: `${COLORS.red}15`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: `${COLORS.red}30`,
  },
  deleteButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.red,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalCloseBtn: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textMuted,
    padding: SPACING.sm,
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  modalSection: {
    marginBottom: SPACING.lg,
  },
  modalSectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  durationChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  durationChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  durationChipSelected: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  durationChipText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  durationChipTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  removeExtraTimeBtn: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.red}15`,
    alignItems: 'center',
  },
  removeExtraTimeBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.red,
  },
  applyBtn: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  applyBtnGradient: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
});
