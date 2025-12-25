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
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  error?: string;
  icon?: string;
}

function FormField({ label, value, onChangeText, placeholder, keyboardType = 'default', error, icon }: FormFieldProps) {
  return (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        {icon && <Text style={styles.inputIcon}>{icon}</Text>}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          keyboardType={keyboardType}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, loading, refetch } = useSettings();
  const { updateProfile, isSubmitting } = useSettingsActions();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  const updateFormData = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (formData.phone && !/^[+]?[\d\s-]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const result = await updateProfile({
      firstName: formData.firstName.trim() || undefined,
      lastName: formData.lastName.trim() || undefined,
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
    });

    if (result.success) {
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => { refetch(); router.back(); } },
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to update profile');
    }
  };

  if (loading && !profile) {
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
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(formData.firstName || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity style={styles.changePhotoButton}>
                <LinearGradient colors={GRADIENTS.primary} style={styles.changePhotoGradient}>
                  <Text style={styles.changePhotoIcon}>📷</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </View>

          <View style={styles.formSection}>
            <FormField
              label="First Name"
              value={formData.firstName}
              onChangeText={(v) => updateFormData('firstName', v)}
              placeholder="Enter first name"
              icon="👤"
              error={errors.firstName}
            />

            <FormField
              label="Last Name"
              value={formData.lastName}
              onChangeText={(v) => updateFormData('lastName', v)}
              placeholder="Enter last name"
              icon="👤"
              error={errors.lastName}
            />

            <FormField
              label="Email"
              value={formData.email}
              onChangeText={(v) => updateFormData('email', v)}
              placeholder="Enter email address"
              keyboardType="email-address"
              icon="📧"
              error={errors.email}
            />

            <FormField
              label="Phone"
              value={formData.phone}
              onChangeText={(v) => updateFormData('phone', v)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              icon="📞"
              error={errors.phone}
            />
          </View>

          <View style={styles.roleSection}>
            <Text style={styles.roleLabel}>Your Role</Text>
            <View style={styles.roleCard}>
              <View style={styles.roleIcon}>
                <Text style={styles.roleIconText}>👑</Text>
              </View>
              <View style={styles.roleInfo}>
                <Text style={styles.roleTitle}>{profile?.role === 'owner' ? 'Owner & Manager' : profile?.role}</Text>
                <Text style={styles.roleDescription}>Full access to all settings</Text>
              </View>
            </View>
          </View>
        </ScrollView>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SIZES.listPaddingBottom,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.violet,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.fuchsia,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.white,
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  changePhotoGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoIcon: {
    fontSize: 16,
  },
  changePhotoText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.violet,
    fontWeight: '500',
  },
  formSection: {
    gap: SPACING.lg,
  },
  formField: {
    marginBottom: SPACING.md,
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
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  inputError: {
    borderColor: COLORS.red,
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
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.red,
    marginTop: SPACING.xs,
  },
  roleSection: {
    marginTop: SPACING.xxl,
  },
  roleLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.amber}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  roleIconText: {
    fontSize: 24,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textTransform: 'capitalize',
  },
  roleDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
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
