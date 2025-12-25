import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
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
  useMembershipPlanDetail,
  useMembershipPlanActions,
  useAvailableServicesForMembership,
} from '@stylemate/core/hooks/useBusinessApi';
import type { 
  MembershipPlanType, 
  MembershipBillingType,
  CreateMembershipPlanParams,
  ServiceListItem,
} from '@stylemate/core/services/businessApi';

type WizardStep = 1 | 2 | 3 | 4;

const PLAN_TYPES: { type: MembershipPlanType; icon: string; label: string; description: string; color: string }[] = [
  { 
    type: 'discount', 
    icon: '🏷️', 
    label: 'Discount Plan', 
    description: 'Offer percentage discounts on all services',
    color: COLORS.blue,
  },
  { 
    type: 'credit', 
    icon: '💰', 
    label: 'Credit/Wallet Plan', 
    description: 'Pre-paid credits with bonus amounts',
    color: COLORS.purple,
  },
  { 
    type: 'packaged', 
    icon: '📦', 
    label: 'Session Package', 
    description: 'Bundle specific services with usage limits',
    color: COLORS.green,
  },
];

const DURATION_OPTIONS = [1, 3, 6, 12];

interface FormData {
  name: string;
  description: string;
  planType: MembershipPlanType;
  durationMonths: number;
  priceInPaisa: number;
  billingType: MembershipBillingType;
  monthlyPriceInPaisa: number;
  discountPercentage: number;
  discountAppliesTo: 'all' | 'services' | 'products';
  creditAmountInPaisa: number;
  bonusPercentage: number;
  creditsRollover: boolean;
  priorityBooking: boolean;
  freeCancellation: boolean;
  birthdayBonusInPaisa: number;
  referralBonusInPaisa: number;
  maxMembers: number;
  maxUsesPerMonth: number;
  isActive: boolean;
  planColor: string;
  isOnlineSalesEnabled: boolean;
  isRedemptionEnabled: boolean;
  includedServices: { serviceId: string; quantityPerMonth: number; isUnlimited: boolean }[];
}

const initialFormData: FormData = {
  name: '',
  description: '',
  planType: 'discount',
  durationMonths: 3,
  priceInPaisa: 0,
  billingType: 'one_time',
  monthlyPriceInPaisa: 0,
  discountPercentage: 10,
  discountAppliesTo: 'all',
  creditAmountInPaisa: 0,
  bonusPercentage: 10,
  creditsRollover: true,
  priorityBooking: false,
  freeCancellation: false,
  birthdayBonusInPaisa: 0,
  referralBonusInPaisa: 0,
  maxMembers: 0,
  maxUsesPerMonth: 0,
  isActive: true,
  planColor: COLORS.violet,
  isOnlineSalesEnabled: true,
  isRedemptionEnabled: true,
  includedServices: [],
};

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <View key={i} style={styles.stepRow}>
          <View
            style={[
              styles.stepDot,
              i + 1 <= currentStep && styles.stepDotActive,
              i + 1 < currentStep && styles.stepDotComplete,
            ]}
          >
            {i + 1 < currentStep ? (
              <Text style={styles.stepCheckmark}>✓</Text>
            ) : (
              <Text style={[styles.stepNumber, i + 1 <= currentStep && styles.stepNumberActive]}>
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

interface ServiceSelectionProps {
  services: ServiceListItem[];
  selectedServices: { serviceId: string; quantityPerMonth: number; isUnlimited: boolean }[];
  onToggleService: (serviceId: string) => void;
  onUpdateQuantity: (serviceId: string, quantity: number) => void;
  onToggleUnlimited: (serviceId: string) => void;
}

function ServiceSelection({ services, selectedServices, onToggleService, onUpdateQuantity, onToggleUnlimited }: ServiceSelectionProps) {
  const isSelected = (serviceId: string) => selectedServices.some(s => s.serviceId === serviceId);
  const getService = (serviceId: string) => selectedServices.find(s => s.serviceId === serviceId);

  return (
    <View style={styles.serviceSelectionContainer}>
      {services.map((service) => {
        const selected = isSelected(service.id);
        const selectedService = getService(service.id);
        
        return (
          <View key={service.id} style={[styles.serviceItem, selected && styles.serviceItemSelected]}>
            <TouchableOpacity
              style={styles.serviceCheckbox}
              onPress={() => onToggleService(service.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
                {selected && <Text style={styles.checkboxCheck}>✓</Text>}
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.servicePrice}>
                  ₹{(service.priceInPaisa / 100).toLocaleString('en-IN')} • {service.durationMinutes} min
                </Text>
              </View>
            </TouchableOpacity>
            
            {selected && (
              <View style={styles.serviceQuantityRow}>
                <View style={styles.quantityControl}>
                  <Text style={styles.quantityLabel}>Qty/month:</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => onUpdateQuantity(service.id, Math.max(1, (selectedService?.quantityPerMonth || 1) - 1))}
                    disabled={selectedService?.isUnlimited}
                  >
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={[styles.quantityValue, selectedService?.isUnlimited && styles.quantityValueDisabled]}>
                    {selectedService?.isUnlimited ? '∞' : selectedService?.quantityPerMonth || 1}
                  </Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => onUpdateQuantity(service.id, (selectedService?.quantityPerMonth || 1) + 1)}
                    disabled={selectedService?.isUnlimited}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.unlimitedToggle}
                  onPress={() => onToggleUnlimited(service.id)}
                >
                  <Text style={[styles.unlimitedText, selectedService?.isUnlimited && styles.unlimitedTextActive]}>
                    Unlimited
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

export default function AddEditMembershipScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  const { data: planDetail, loading: loadingDetail } = useMembershipPlanDetail(id);
  const { data: servicesData, loading: loadingServices } = useAvailableServicesForMembership();
  const { createPlan, updatePlan, isSubmitting } = useMembershipPlanActions();

  const services = servicesData?.services || [];

  useEffect(() => {
    if (planDetail?.plan) {
      const plan = planDetail.plan;
      setFormData({
        name: plan.name,
        description: plan.description || '',
        planType: plan.planType,
        durationMonths: plan.durationMonths,
        priceInPaisa: plan.priceInPaisa,
        billingType: plan.billingType,
        monthlyPriceInPaisa: plan.monthlyPriceInPaisa || 0,
        discountPercentage: plan.discountPercentage || 10,
        discountAppliesTo: plan.discountAppliesTo || 'all',
        creditAmountInPaisa: plan.creditAmountInPaisa || 0,
        bonusPercentage: plan.bonusPercentage || 10,
        creditsRollover: plan.creditsRollover === 1,
        priorityBooking: plan.priorityBooking === 1,
        freeCancellation: plan.freeCancellation === 1,
        birthdayBonusInPaisa: plan.birthdayBonusInPaisa || 0,
        referralBonusInPaisa: plan.referralBonusInPaisa || 0,
        maxMembers: plan.maxMembers || 0,
        maxUsesPerMonth: plan.maxUsesPerMonth || 0,
        isActive: plan.isActive === 1,
        planColor: plan.planColor || COLORS.violet,
        isOnlineSalesEnabled: plan.isOnlineSalesEnabled || false,
        isRedemptionEnabled: plan.isRedemptionEnabled || false,
        includedServices: plan.includedServices?.map(s => ({
          serviceId: s.serviceId,
          quantityPerMonth: s.quantityPerMonth,
          isUnlimited: s.isUnlimited,
        })) || [],
      });
    }
  }, [planDetail]);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleToggleService = (serviceId: string) => {
    setFormData(prev => {
      const existing = prev.includedServices.find(s => s.serviceId === serviceId);
      if (existing) {
        return { ...prev, includedServices: prev.includedServices.filter(s => s.serviceId !== serviceId) };
      }
      return { ...prev, includedServices: [...prev.includedServices, { serviceId, quantityPerMonth: 1, isUnlimited: false }] };
    });
  };

  const handleUpdateQuantity = (serviceId: string, quantity: number) => {
    setFormData(prev => ({
      ...prev,
      includedServices: prev.includedServices.map(s => 
        s.serviceId === serviceId ? { ...s, quantityPerMonth: quantity } : s
      ),
    }));
  };

  const handleToggleUnlimited = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      includedServices: prev.includedServices.map(s => 
        s.serviceId === serviceId ? { ...s, isUnlimited: !s.isUnlimited } : s
      ),
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        if (!formData.name.trim()) return false;
        if (formData.planType === 'discount' && formData.discountPercentage <= 0) return false;
        if (formData.planType === 'credit' && formData.creditAmountInPaisa <= 0) return false;
        if (formData.planType === 'packaged' && formData.includedServices.length === 0) return false;
        return true;
      case 3:
        return formData.priceInPaisa > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4 && canProceed()) {
      setCurrentStep((currentStep + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
    } else {
      router.back();
    }
  };

  const handleSave = async () => {
    if (!canProceed()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const params: CreateMembershipPlanParams = {
        name: formData.name,
        description: formData.description || undefined,
        planType: formData.planType,
        durationMonths: formData.durationMonths,
        priceInPaisa: formData.priceInPaisa,
        billingType: formData.billingType,
        monthlyPriceInPaisa: formData.billingType === 'recurring' ? formData.monthlyPriceInPaisa : undefined,
        discountPercentage: formData.planType === 'discount' ? formData.discountPercentage : undefined,
        discountAppliesTo: formData.planType === 'discount' ? formData.discountAppliesTo : undefined,
        creditAmountInPaisa: formData.planType === 'credit' ? formData.creditAmountInPaisa : undefined,
        bonusPercentage: formData.planType === 'credit' ? formData.bonusPercentage : undefined,
        creditsRollover: formData.creditsRollover,
        priorityBooking: formData.priorityBooking,
        freeCancellation: formData.freeCancellation,
        birthdayBonusInPaisa: formData.birthdayBonusInPaisa || undefined,
        referralBonusInPaisa: formData.referralBonusInPaisa || undefined,
        maxMembers: formData.maxMembers || undefined,
        maxUsesPerMonth: formData.maxUsesPerMonth || undefined,
        isActive: formData.isActive,
        planColor: formData.planColor,
        isOnlineSalesEnabled: formData.isOnlineSalesEnabled,
        isRedemptionEnabled: formData.isRedemptionEnabled,
        includedServices: formData.planType === 'packaged' ? formData.includedServices : undefined,
      };

      const result = isEditing 
        ? await updatePlan({ id, ...params })
        : await createPlan(params);

      if (result.success) {
        Alert.alert('Success', isEditing ? 'Plan updated successfully' : 'Plan created successfully');
        router.back();
      } else {
        Alert.alert('Error', result.error || 'Failed to save plan');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingDetail && isEditing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Choose Plan Type</Text>
      <Text style={styles.stepSubtitle}>Select the type of membership plan you want to create</Text>
      
      <View style={styles.planTypeList}>
        {PLAN_TYPES.map((type) => (
          <TouchableOpacity
            key={type.type}
            style={[
              styles.planTypeCard,
              formData.planType === type.type && styles.planTypeCardSelected,
              formData.planType === type.type && { borderColor: type.color },
            ]}
            onPress={() => updateField('planType', type.type)}
            activeOpacity={0.7}
          >
            <Text style={styles.planTypeIcon}>{type.icon}</Text>
            <View style={styles.planTypeInfo}>
              <Text style={styles.planTypeLabel}>{type.label}</Text>
              <Text style={styles.planTypeDescription}>{type.description}</Text>
            </View>
            <View style={[styles.radioOuter, formData.planType === type.type && { borderColor: type.color }]}>
              {formData.planType === type.type && (
                <View style={[styles.radioInner, { backgroundColor: type.color }]} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Plan Details</Text>
      <Text style={styles.stepSubtitle}>Configure the specifics of your {formData.planType} plan</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Plan Name *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.name}
          onChangeText={(v) => updateField('name', v)}
          placeholder="e.g., Gold Membership"
          placeholderTextColor={COLORS.textMuted}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.description}
          onChangeText={(v) => updateField('description', v)}
          placeholder="Brief description of this plan..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Duration</Text>
        <View style={styles.durationOptions}>
          {DURATION_OPTIONS.map((months) => (
            <TouchableOpacity
              key={months}
              style={[styles.durationOption, formData.durationMonths === months && styles.durationOptionSelected]}
              onPress={() => updateField('durationMonths', months)}
              activeOpacity={0.7}
            >
              <Text style={[styles.durationOptionText, formData.durationMonths === months && styles.durationOptionTextSelected]}>
                {months} {months === 1 ? 'Month' : 'Months'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {formData.planType === 'discount' && (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Discount Percentage *</Text>
            <View style={styles.percentInput}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                value={formData.discountPercentage.toString()}
                onChangeText={(v) => updateField('discountPercentage', parseInt(v) || 0)}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor={COLORS.textMuted}
              />
              <Text style={styles.percentSymbol}>%</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Discount Applies To</Text>
            <View style={styles.durationOptions}>
              {(['all', 'services', 'products'] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.durationOption, formData.discountAppliesTo === option && styles.durationOptionSelected]}
                  onPress={() => updateField('discountAppliesTo', option)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.durationOptionText, formData.discountAppliesTo === option && styles.durationOptionTextSelected]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}

      {formData.planType === 'credit' && (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Credit Amount (₹) *</Text>
            <TextInput
              style={styles.textInput}
              value={(formData.creditAmountInPaisa / 100).toString()}
              onChangeText={(v) => updateField('creditAmountInPaisa', (parseFloat(v) || 0) * 100)}
              keyboardType="numeric"
              placeholder="5000"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bonus Percentage</Text>
            <View style={styles.percentInput}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                value={formData.bonusPercentage.toString()}
                onChangeText={(v) => updateField('bonusPercentage', parseInt(v) || 0)}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor={COLORS.textMuted}
              />
              <Text style={styles.percentSymbol}>%</Text>
            </View>
            <Text style={styles.inputHint}>
              Customer pays ₹{(formData.creditAmountInPaisa / 100).toLocaleString('en-IN')}, gets ₹{((formData.creditAmountInPaisa / 100) * (1 + formData.bonusPercentage / 100)).toLocaleString('en-IN')} credits
            </Text>
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Credits Rollover</Text>
              <Text style={styles.switchHint}>Unused credits carry to next month</Text>
            </View>
            <Switch
              value={formData.creditsRollover}
              onValueChange={(v) => updateField('creditsRollover', v)}
              trackColor={{ false: COLORS.cardBorder, true: `${COLORS.violet}60` }}
              thumbColor={formData.creditsRollover ? COLORS.violet : COLORS.textMuted}
            />
          </View>
        </>
      )}

      {formData.planType === 'packaged' && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Included Services *</Text>
          {loadingServices ? (
            <ActivityIndicator size="small" color={COLORS.violet} />
          ) : (
            <ServiceSelection
              services={services}
              selectedServices={formData.includedServices}
              onToggleService={handleToggleService}
              onUpdateQuantity={handleUpdateQuantity}
              onToggleUnlimited={handleToggleUnlimited}
            />
          )}
        </View>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Payment & Billing</Text>
      <Text style={styles.stepSubtitle}>Set the pricing and billing cycle for this plan</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Billing Type</Text>
        <View style={styles.durationOptions}>
          {(['one_time', 'recurring'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.durationOption, formData.billingType === type && styles.durationOptionSelected]}
              onPress={() => updateField('billingType', type)}
              activeOpacity={0.7}
            >
              <Text style={[styles.durationOptionText, formData.billingType === type && styles.durationOptionTextSelected]}>
                {type === 'one_time' ? 'One-Time' : 'Recurring'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {formData.billingType === 'one_time' && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Total Price (₹) *</Text>
          <TextInput
            style={styles.textInput}
            value={(formData.priceInPaisa / 100).toString()}
            onChangeText={(v) => updateField('priceInPaisa', (parseFloat(v) || 0) * 100)}
            keyboardType="numeric"
            placeholder="9999"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>
      )}

      {formData.billingType === 'recurring' && (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Monthly Price (₹) *</Text>
            <TextInput
              style={styles.textInput}
              value={(formData.monthlyPriceInPaisa / 100).toString()}
              onChangeText={(v) => {
                const monthly = (parseFloat(v) || 0) * 100;
                updateField('monthlyPriceInPaisa', monthly);
                updateField('priceInPaisa', monthly * formData.durationMonths);
              }}
              keyboardType="numeric"
              placeholder="999"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
          <View style={styles.priceSummary}>
            <Text style={styles.priceSummaryLabel}>Total for {formData.durationMonths} months:</Text>
            <Text style={styles.priceSummaryValue}>
              ₹{(formData.priceInPaisa / 100).toLocaleString('en-IN')}
            </Text>
          </View>
        </>
      )}

      <View style={styles.perksSection}>
        <Text style={styles.sectionTitle}>Additional Perks</Text>
        
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Priority Booking</Text>
            <Text style={styles.switchHint}>Members book before non-members</Text>
          </View>
          <Switch
            value={formData.priorityBooking}
            onValueChange={(v) => updateField('priorityBooking', v)}
            trackColor={{ false: COLORS.cardBorder, true: `${COLORS.violet}60` }}
            thumbColor={formData.priorityBooking ? COLORS.violet : COLORS.textMuted}
          />
        </View>

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Free Cancellation</Text>
            <Text style={styles.switchHint}>No cancellation fees for members</Text>
          </View>
          <Switch
            value={formData.freeCancellation}
            onValueChange={(v) => updateField('freeCancellation', v)}
            trackColor={{ false: COLORS.cardBorder, true: `${COLORS.violet}60` }}
            thumbColor={formData.freeCancellation ? COLORS.violet : COLORS.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Birthday Bonus (₹)</Text>
          <TextInput
            style={styles.textInput}
            value={(formData.birthdayBonusInPaisa / 100).toString()}
            onChangeText={(v) => updateField('birthdayBonusInPaisa', (parseFloat(v) || 0) * 100)}
            keyboardType="numeric"
            placeholder="500"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Referral Bonus (₹)</Text>
          <TextInput
            style={styles.textInput}
            value={(formData.referralBonusInPaisa / 100).toString()}
            onChangeText={(v) => updateField('referralBonusInPaisa', (parseFloat(v) || 0) * 100)}
            keyboardType="numeric"
            placeholder="200"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Online Settings & Review</Text>
      <Text style={styles.stepSubtitle}>Configure visibility and review your plan</Text>

      <View style={styles.switchRow}>
        <View>
          <Text style={styles.switchLabel}>Enable Online Sales</Text>
          <Text style={styles.switchHint}>Allow customers to purchase online</Text>
        </View>
        <Switch
          value={formData.isOnlineSalesEnabled}
          onValueChange={(v) => updateField('isOnlineSalesEnabled', v)}
          trackColor={{ false: COLORS.cardBorder, true: `${COLORS.violet}60` }}
          thumbColor={formData.isOnlineSalesEnabled ? COLORS.violet : COLORS.textMuted}
        />
      </View>

      <View style={styles.switchRow}>
        <View>
          <Text style={styles.switchLabel}>Enable Redemption</Text>
          <Text style={styles.switchHint}>Allow members to redeem benefits</Text>
        </View>
        <Switch
          value={formData.isRedemptionEnabled}
          onValueChange={(v) => updateField('isRedemptionEnabled', v)}
          trackColor={{ false: COLORS.cardBorder, true: `${COLORS.violet}60` }}
          thumbColor={formData.isRedemptionEnabled ? COLORS.violet : COLORS.textMuted}
        />
      </View>

      <View style={styles.switchRow}>
        <View>
          <Text style={styles.switchLabel}>Active Status</Text>
          <Text style={styles.switchHint}>Make this plan available for purchase</Text>
        </View>
        <Switch
          value={formData.isActive}
          onValueChange={(v) => updateField('isActive', v)}
          trackColor={{ false: COLORS.cardBorder, true: `${COLORS.green}60` }}
          thumbColor={formData.isActive ? COLORS.green : COLORS.textMuted}
        />
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.sectionTitle}>Plan Summary</Text>
        <View style={styles.reviewCard}>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Plan Name</Text>
            <Text style={styles.reviewValue}>{formData.name || '-'}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Type</Text>
            <Text style={styles.reviewValue}>{PLAN_TYPES.find(t => t.type === formData.planType)?.label}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Duration</Text>
            <Text style={styles.reviewValue}>{formData.durationMonths} months</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Price</Text>
            <Text style={styles.reviewValue}>₹{(formData.priceInPaisa / 100).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Billing</Text>
            <Text style={styles.reviewValue}>{formData.billingType === 'recurring' ? 'Monthly' : 'One-time'}</Text>
          </View>
          {formData.planType === 'discount' && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Discount</Text>
              <Text style={styles.reviewValue}>{formData.discountPercentage}% off</Text>
            </View>
          )}
          {formData.planType === 'credit' && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Credits</Text>
              <Text style={styles.reviewValue}>₹{(formData.creditAmountInPaisa / 100).toLocaleString('en-IN')} (+{formData.bonusPercentage}% bonus)</Text>
            </View>
          )}
          {formData.planType === 'packaged' && (
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Services</Text>
              <Text style={styles.reviewValue}>{formData.includedServices.length} included</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Plan' : 'New Membership Plan'}</Text>
          <View style={{ width: 50 }} />
        </View>

        <StepIndicator currentStep={currentStep} totalSteps={4} />

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </ScrollView>

        <View style={styles.footer}>
          {currentStep < 4 ? (
            <TouchableOpacity
              style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
              onPress={handleNext}
              disabled={!canProceed()}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={canProceed() ? GRADIENTS.primary : GRADIENTS.disabled}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextButtonGradient}
              >
                <Text style={styles.nextButtonText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, isSaving && styles.nextButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={isSaving ? GRADIENTS.disabled : GRADIENTS.success}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextButtonGradient}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.nextButtonText}>{isEditing ? 'Update Plan' : 'Create Plan'}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
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
  },
  backButton: {
    padding: SPACING.sm,
  },
  backIcon: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cardBg,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    borderColor: COLORS.violet,
    backgroundColor: `${COLORS.violet}20`,
  },
  stepDotComplete: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  stepNumber: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  stepNumberActive: {
    color: COLORS.violet,
  },
  stepCheckmark: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.white,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: SPACING.xs,
  },
  stepLineActive: {
    backgroundColor: COLORS.violet,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SIZES.listPaddingBottom,
  },
  stepContent: {
    padding: SPACING.lg,
  },
  stepTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  stepSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  planTypeList: {
    gap: SPACING.md,
  },
  planTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    gap: SPACING.md,
  },
  planTypeCardSelected: {
    backgroundColor: `${COLORS.violet}10`,
  },
  planTypeIcon: {
    fontSize: SIZES.iconLarge,
  },
  planTypeInfo: {
    flex: 1,
  },
  planTypeLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  planTypeDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.violet,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  inputHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  textInput: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  percentInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentSymbol: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  durationOption: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  durationOptionSelected: {
    backgroundColor: `${COLORS.violet}20`,
    borderColor: COLORS.violet,
  },
  durationOptionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  durationOptionTextSelected: {
    color: COLORS.violet,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  switchLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  switchHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  perksSection: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  priceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: `${COLORS.green}15`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  priceSummaryLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  priceSummaryValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.green,
  },
  reviewSection: {
    marginTop: SPACING.lg,
  },
  reviewCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  reviewLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  reviewValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  serviceSelectionContainer: {
    gap: SPACING.sm,
  },
  serviceItem: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  serviceItemSelected: {
    borderColor: COLORS.violet,
    backgroundColor: `${COLORS.violet}10`,
  },
  serviceCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  checkboxCheck: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: '700',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  servicePrice: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  serviceQuantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  quantityLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  quantityValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
  quantityValueDisabled: {
    color: COLORS.textMuted,
  },
  unlimitedToggle: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  unlimitedText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  unlimitedTextActive: {
    color: COLORS.violet,
    fontWeight: '600',
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  nextButton: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
});
