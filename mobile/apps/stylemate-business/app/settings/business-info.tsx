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
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from '../../constants/theme';
import { useSettings } from '@stylemate/core/hooks/useBusinessApi';
import { settingsApi } from '@stylemate/core/services/businessApi';

const CATEGORIES = [
  { value: 'hair_salon', label: 'Hair Salon' },
  { value: 'spa', label: 'Spa & Wellness' },
  { value: 'nails', label: 'Nail Salon' },
  { value: 'beauty', label: 'Beauty Parlour' },
  { value: 'barbershop', label: 'Barbershop' },
  { value: 'skin_clinic', label: 'Skin Clinic' },
  { value: 'makeup', label: 'Makeup Studio' },
  { value: 'multi_service', label: 'Multi-Service' },
];

const VENUE_TYPES = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'female-only', label: 'Women Only' },
  { value: 'male-only', label: 'Men Only' },
];

const PRICE_RANGES = [
  { value: '$', label: '$ - Budget Friendly' },
  { value: '$$', label: '$$ - Moderate' },
  { value: '$$$', label: '$$$ - Premium' },
  { value: '$$$$', label: '$$$$ - Luxury' },
];

interface FormData {
  name: string;
  description: string;
  shopNumber: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
  category: string;
  venueType: string;
  priceRange: string;
}

export default function BusinessInfoScreen() {
  const router = useRouter();
  const { data: settings, isLoading, refetch } = useSettings();
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('basic');

  const [formData, setFormData] = useState<FormData>({
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
    category: 'hair_salon',
    venueType: 'everyone',
    priceRange: '$$',
  });

  useEffect(() => {
    if (settings?.salon) {
      setFormData({
        name: settings.salon.name || '',
        description: settings.salon.description || '',
        shopNumber: settings.salon.shopNumber || '',
        address: settings.salon.address || '',
        city: settings.salon.city || '',
        state: settings.salon.state || '',
        zipCode: settings.salon.zipCode || '',
        phone: settings.salon.phone || '',
        email: settings.salon.email || '',
        website: settings.salon.website || '',
        category: settings.salon.category || 'hair_salon',
        venueType: settings.salon.venueType || 'everyone',
        priceRange: settings.salon.priceRange || '$$',
      });
    }
  }, [settings]);

  const handleBack = useCallback(() => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() }
        ]
      );
      return true;
    }
    router.back();
    return true;
  }, [hasChanges, router]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => backHandler.remove();
  }, [handleBack]);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\d\s\-+()]{10,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleSave = async () => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) {
      errors.push('Business name is required');
    }
    if (!formData.address.trim()) {
      errors.push('Street address is required');
    }
    if (!formData.city.trim()) {
      errors.push('City is required');
    }
    if (!formData.state.trim()) {
      errors.push('State is required');
    }
    if (!formData.phone.trim()) {
      errors.push('Phone number is required');
    } else if (!validatePhone(formData.phone)) {
      errors.push('Please enter a valid phone number');
    }
    if (!formData.email.trim()) {
      errors.push('Email is required');
    } else if (!validateEmail(formData.email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    setSaving(true);
    try {
      const result = await settingsApi.updateSalon(formData);
      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        setHasChanges(false);
        Alert.alert('Success', 'Business information updated successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        refetch();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update business information');
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading business info...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = settings?.isOwner ?? false;

  if (!isOwner) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Business Information</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.restrictedContainer}>
          <Text style={styles.restrictedIcon}>🔒</Text>
          <Text style={styles.restrictedTitle}>Owner Access Only</Text>
          <Text style={styles.restrictedSubtitle}>
            Only salon owners can edit business information. Contact your salon owner for changes.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Business Information</Text>
          <TouchableOpacity 
            style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={[styles.saveButtonText, !hasChanges && styles.saveButtonTextDisabled]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity 
            style={styles.sectionHeader} 
            onPress={() => toggleSection('basic')}
          >
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionIcon}>🏪</Text>
              <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>
            <Text style={styles.chevron}>{expandedSection === 'basic' ? '▼' : '▶'}</Text>
          </TouchableOpacity>
          
          {expandedSection === 'basic' && (
            <View style={styles.sectionCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Business Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => updateField('name', text)}
                  placeholder="Enter business name"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => updateField('description', text)}
                  placeholder="Describe your business..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.chipContainer}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.chip,
                        formData.category === cat.value && styles.chipSelected
                      ]}
                      onPress={() => updateField('category', cat.value)}
                    >
                      <Text style={[
                        styles.chipText,
                        formData.category === cat.value && styles.chipTextSelected
                      ]}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Venue Type</Text>
                <View style={styles.chipContainer}>
                  {VENUE_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.chip,
                        formData.venueType === type.value && styles.chipSelected
                      ]}
                      onPress={() => updateField('venueType', type.value)}
                    >
                      <Text style={[
                        styles.chipText,
                        formData.venueType === type.value && styles.chipTextSelected
                      ]}>{type.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Price Range</Text>
                <View style={styles.chipContainer}>
                  {PRICE_RANGES.map((range) => (
                    <TouchableOpacity
                      key={range.value}
                      style={[
                        styles.chip,
                        formData.priceRange === range.value && styles.chipSelected
                      ]}
                      onPress={() => updateField('priceRange', range.value)}
                    >
                      <Text style={[
                        styles.chipText,
                        formData.priceRange === range.value && styles.chipTextSelected
                      ]}>{range.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity 
            style={styles.sectionHeader} 
            onPress={() => toggleSection('location')}
          >
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionIcon}>📍</Text>
              <Text style={styles.sectionTitle}>Location & Address</Text>
            </View>
            <Text style={styles.chevron}>{expandedSection === 'location' ? '▼' : '▶'}</Text>
          </TouchableOpacity>

          {expandedSection === 'location' && (
            <View style={styles.sectionCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Shop/Suite Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.shopNumber}
                  onChangeText={(text) => updateField('shopNumber', text)}
                  placeholder="e.g., Shop 12, Suite 3B"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Street Address *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.address}
                  onChangeText={(text) => updateField('address', text)}
                  placeholder="Enter street address"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.inputLabel}>City *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.city}
                    onChangeText={(text) => updateField('city', text)}
                    placeholder="City"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.inputLabel}>State *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.state}
                    onChangeText={(text) => updateField('state', text)}
                    placeholder="State"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ZIP/Postal Code *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.zipCode}
                  onChangeText={(text) => updateField('zipCode', text)}
                  placeholder="ZIP Code"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          <TouchableOpacity 
            style={styles.sectionHeader} 
            onPress={() => toggleSection('contact')}
          >
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionIcon}>📞</Text>
              <Text style={styles.sectionTitle}>Contact Information</Text>
            </View>
            <Text style={styles.chevron}>{expandedSection === 'contact' ? '▼' : '▶'}</Text>
          </TouchableOpacity>

          {expandedSection === 'contact' && (
            <View style={styles.sectionCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(text) => updateField('phone', text)}
                  placeholder="Enter phone number"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => updateField('email', text)}
                  placeholder="Enter email address"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Website</Text>
                <TextInput
                  style={styles.input}
                  value={formData.website}
                  onChangeText={(text) => updateField('website', text)}
                  placeholder="https://www.yoursalon.com"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>
            </View>
          )}

          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={styles.infoText}>
              Business information is displayed on your public profile. Make sure all details are accurate to help customers find you.
            </Text>
          </View>
        </ScrollView>
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
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.white,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  saveButton: {
    backgroundColor: COLORS.violet,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 70,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.cardBorder,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: FONT_SIZES.md,
  },
  saveButtonTextDisabled: {
    color: COLORS.textMuted,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xs,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  chevron: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfInput: {
    flex: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
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
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: SPACING.md,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  restrictedIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  restrictedTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  restrictedSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
