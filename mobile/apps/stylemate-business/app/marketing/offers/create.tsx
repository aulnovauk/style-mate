import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../../constants/theme';
import { StepIndicator } from '../../../components/marketing/StepWizard';
import { marketingApi, CreateOfferParams } from '@stylemate/core/services/businessApi';

type OfferType = 'promo_code' | 'flash_sale' | 'intro_offer' | 'staff_special';
type DiscountType = 'percentage' | 'fixed';

const STEP_TITLES = ['Details', 'Targeting', 'Distribution', 'Review'];

const OFFER_TYPES: { type: OfferType; icon: string; label: string; description: string }[] = [
  { type: 'promo_code', icon: '🏷️', label: 'Promo Code', description: 'Customers enter a code at checkout' },
  { type: 'flash_sale', icon: '⚡', label: 'Flash Sale', description: 'Limited-time automatic discount' },
  { type: 'intro_offer', icon: '👋', label: 'Intro Offer', description: 'Special deal for first-time customers' },
  { type: 'staff_special', icon: '👤', label: 'Staff Special', description: 'Discount for specific staff bookings' },
];

export default function CreateOfferScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [offerType, setOfferType] = useState<OfferType>('promo_code');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [validFrom, setValidFrom] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');
  
  const [audience, setAudience] = useState<'all' | 'new' | 'vip' | 'inactive'>('all');
  const [perClientLimit, setPerClientLimit] = useState('1');
  const [totalLimit, setTotalLimit] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  
  const [onlineCheckout, setOnlineCheckout] = useState(true);
  const [posCheckout, setPosCheckout] = useState(true);

  const generatePromoCode = async () => {
    try {
      const response = await marketingApi.generatePromoCode();
      if (response.success && response.data) {
        setPromoCode(response.data.code);
      } else {
        const randomCode = `STYLE${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        setPromoCode(randomCode);
      }
    } catch {
      const randomCode = `STYLE${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setPromoCode(randomCode);
    }
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!title.trim()) {
        Alert.alert('Required', 'Please enter an offer title');
        return false;
      }
      if (!discountValue || parseFloat(discountValue) <= 0) {
        Alert.alert('Required', 'Please enter a valid discount amount');
        return false;
      }
      if (discountType === 'percentage' && parseFloat(discountValue) > 100) {
        Alert.alert('Invalid', 'Percentage discount cannot exceed 100%');
        return false;
      }
      if (offerType === 'promo_code' && !promoCode.trim()) {
        Alert.alert('Required', 'Please enter or generate a promo code');
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
      const params: CreateOfferParams = {
        title,
        description,
        type: offerType,
        discountType,
        discountValue: parseFloat(discountValue),
        promoCode: offerType === 'promo_code' ? promoCode : undefined,
        targeting: {
          audience,
          servicesScope: 'all',
          staffScope: 'all',
        },
        limits: {
          perClient: parseInt(perClientLimit) || 1,
          totalUsage: totalLimit ? parseInt(totalLimit) : undefined,
          minPurchase: minPurchase ? parseFloat(minPurchase) : undefined,
        },
        distribution: {
          onlineCheckout,
          posCheckout,
        },
        validFrom,
        validUntil: validUntil || undefined,
      };

      const response = isEditing 
        ? await marketingApi.updateOffer(id!, params)
        : await marketingApi.createOffer(params);

      if (response.success) {
        Alert.alert(
          'Success',
          isEditing ? 'Offer updated successfully' : 'Offer created successfully',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', 'Failed to save offer. Please try again.');
      }
    } catch (err) {
      console.error('Error saving offer:', err);
      Alert.alert(
        'Error',
        'Failed to save offer. Please check your connection and try again.',
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
            <Text style={styles.sectionTitle}>Offer Type</Text>
            <View style={styles.typeGrid}>
              {OFFER_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.type}
                  style={[
                    styles.typeCard,
                    offerType === type.type && styles.typeCardActive,
                  ]}
                  onPress={() => setOfferType(type.type)}
                >
                  <Text style={styles.typeIcon}>{type.icon}</Text>
                  <Text style={styles.typeLabel}>{type.label}</Text>
                  <Text style={styles.typeDescription}>{type.description}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Offer Details</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., New Year Special"
                placeholderTextColor={COLORS.textMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Brief description of your offer"
                placeholderTextColor={COLORS.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            <Text style={styles.sectionTitle}>Discount</Text>
            <View style={styles.discountRow}>
              <TouchableOpacity
                style={[
                  styles.discountTypeButton,
                  discountType === 'percentage' && styles.discountTypeActive,
                ]}
                onPress={() => setDiscountType('percentage')}
              >
                <Text style={[
                  styles.discountTypeText,
                  discountType === 'percentage' && styles.discountTypeTextActive,
                ]}>%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.discountTypeButton,
                  discountType === 'fixed' && styles.discountTypeActive,
                ]}
                onPress={() => setDiscountType('fixed')}
              >
                <Text style={[
                  styles.discountTypeText,
                  discountType === 'fixed' && styles.discountTypeTextActive,
                ]}>₹</Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.input, styles.discountInput]}
                placeholder="Amount"
                placeholderTextColor={COLORS.textMuted}
                value={discountValue}
                onChangeText={setDiscountValue}
                keyboardType="numeric"
              />
            </View>

            {offerType === 'promo_code' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Promo Code *</Text>
                <View style={styles.promoCodeRow}>
                  <TextInput
                    style={[styles.input, styles.promoCodeInput]}
                    placeholder="SUMMER25"
                    placeholderTextColor={COLORS.textMuted}
                    value={promoCode}
                    onChangeText={(text) => setPromoCode(text.toUpperCase())}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity
                    style={styles.generateButton}
                    onPress={generatePromoCode}
                  >
                    <Text style={styles.generateButtonText}>Generate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Target Audience</Text>
            {(['all', 'new', 'vip', 'inactive'] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.optionCard, audience === opt && styles.optionCardActive]}
                onPress={() => setAudience(opt)}
              >
                <View style={styles.optionRadio}>
                  {audience === opt && <View style={styles.optionRadioInner} />}
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionLabel}>
                    {opt === 'all' ? 'All Customers' : 
                     opt === 'new' ? 'New Customers Only' :
                     opt === 'vip' ? 'VIP Customers' : 'Inactive Customers (60+ days)'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            <Text style={styles.sectionTitle}>Usage Limits</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Per Customer</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor={COLORS.textMuted}
                value={perClientLimit}
                onChangeText={setPerClientLimit}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Total Uses (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Unlimited"
                placeholderTextColor={COLORS.textMuted}
                value={totalLimit}
                onChangeText={setTotalLimit}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Minimum Purchase (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="₹0"
                placeholderTextColor={COLORS.textMuted}
                value={minPurchase}
                onChangeText={setMinPurchase}
                keyboardType="numeric"
              />
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Where to Apply</Text>
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setOnlineCheckout(!onlineCheckout)}
            >
              <View style={styles.toggleContent}>
                <Text style={styles.toggleIcon}>🌐</Text>
                <View>
                  <Text style={styles.toggleLabel}>Online Checkout</Text>
                  <Text style={styles.toggleDescription}>Apply at online booking</Text>
                </View>
              </View>
              <View style={[styles.toggle, onlineCheckout && styles.toggleActive]}>
                <View style={[styles.toggleThumb, onlineCheckout && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setPosCheckout(!posCheckout)}
            >
              <View style={styles.toggleContent}>
                <Text style={styles.toggleIcon}>🏪</Text>
                <View>
                  <Text style={styles.toggleLabel}>POS Checkout</Text>
                  <Text style={styles.toggleDescription}>Apply at in-store payment</Text>
                </View>
              </View>
              <View style={[styles.toggle, posCheckout && styles.toggleActive]}>
                <View style={[styles.toggleThumb, posCheckout && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Validity Period</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Start Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textMuted}
                value={validFrom}
                onChangeText={setValidFrom}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>End Date (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="No expiry"
                placeholderTextColor={COLORS.textMuted}
                value={validUntil}
                onChangeText={setValidUntil}
              />
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Review Your Offer</Text>
            
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewIcon}>
                  {OFFER_TYPES.find(t => t.type === offerType)?.icon}
                </Text>
                <View style={styles.reviewTitleContainer}>
                  <Text style={styles.reviewTitle}>{title || 'Untitled Offer'}</Text>
                  <Text style={styles.reviewType}>
                    {OFFER_TYPES.find(t => t.type === offerType)?.label}
                  </Text>
                </View>
              </View>
              
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.reviewDiscountBadge}
              >
                <Text style={styles.reviewDiscountText}>
                  {discountValue}{discountType === 'percentage' ? '%' : '₹'} OFF
                </Text>
              </LinearGradient>

              {promoCode && (
                <View style={styles.reviewPromoCode}>
                  <Text style={styles.reviewPromoCodeLabel}>Promo Code:</Text>
                  <Text style={styles.reviewPromoCodeValue}>{promoCode}</Text>
                </View>
              )}
            </View>

            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>Settings</Text>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewRowLabel}>Audience</Text>
                <Text style={styles.reviewRowValue}>
                  {audience === 'all' ? 'All Customers' : 
                   audience === 'new' ? 'New Customers' :
                   audience === 'vip' ? 'VIP Customers' : 'Inactive Customers'}
                </Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewRowLabel}>Per Customer</Text>
                <Text style={styles.reviewRowValue}>{perClientLimit || 1}x</Text>
              </View>
              {totalLimit && (
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewRowLabel}>Total Limit</Text>
                  <Text style={styles.reviewRowValue}>{totalLimit} uses</Text>
                </View>
              )}
              <View style={styles.reviewRow}>
                <Text style={styles.reviewRowLabel}>Channels</Text>
                <Text style={styles.reviewRowValue}>
                  {[onlineCheckout && 'Online', posCheckout && 'POS'].filter(Boolean).join(', ')}
                </Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewRowLabel}>Valid From</Text>
                <Text style={styles.reviewRowValue}>{validFrom}</Text>
              </View>
              {validUntil && (
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewRowLabel}>Valid Until</Text>
                  <Text style={styles.reviewRowValue}>{validUntil}</Text>
                </View>
              )}
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
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Offer' : 'Create Offer'}
        </Text>
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
              {isSubmitting ? 'Saving...' : currentStep === 4 ? 'Create Offer' : 'Continue'}
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  typeCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardActive: {
    borderColor: COLORS.violet,
  },
  typeIcon: {
    fontSize: 28,
    marginBottom: SPACING.sm,
  },
  typeLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  typeDescription: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  discountRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  discountTypeButton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountTypeActive: {
    borderColor: COLORS.violet,
    backgroundColor: COLORS.violet + '20',
  },
  discountTypeText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  discountTypeTextActive: {
    color: COLORS.violet,
  },
  discountInput: {
    flex: 1,
  },
  promoCodeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  promoCodeInput: {
    flex: 1,
    fontFamily: 'monospace',
  },
  generateButton: {
    backgroundColor: COLORS.violet + '20',
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
  },
  generateButtonText: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardActive: {
    borderColor: COLORS.violet,
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    marginRight: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.violet,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  toggleLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  toggleDescription: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.cardBorder,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.violet,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  reviewCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  reviewIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  reviewTitleContainer: {
    flex: 1,
  },
  reviewTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  reviewType: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  reviewDiscountBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  reviewDiscountText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  reviewPromoCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  reviewPromoCodeLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  reviewPromoCodeValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.violet,
    fontFamily: 'monospace',
  },
  reviewSection: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  reviewSectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  reviewRowLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  reviewRowValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
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
