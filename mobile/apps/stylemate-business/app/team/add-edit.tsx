import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert, Switch, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { z } from 'zod';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { 
  useStaffDetail, 
  useStaffRoles, 
  useStaffMutations,
  CreateStaffParams,
  UpdateStaffParams,
  StaffRole,
} from '@stylemate/core';

const staffFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string()
    .min(1, 'Phone number is required')
    .refine(val => /^[\d\s+\-()]+$/.test(val), 'Invalid phone number format')
    .refine(val => val.replace(/\D/g, '').length >= 10, 'Phone must have at least 10 digits'),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
  roleId: z.string().min(1, 'Please select a role'),
  baseSalary: z.string().refine(val => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, 'Invalid salary amount'),
  commissionRate: z.string().refine(val => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 100;
  }, 'Commission must be between 0 and 100%'),
  specialties: z.array(z.string()),
  isActive: z.boolean(),
});

interface StaffFormData {
  name: string;
  email: string;
  phone: string;
  gender: 'male' | 'female' | 'other' | '';
  roleId: string;
  baseSalary: string;
  commissionRate: string;
  specialties: string[];
  isActive: boolean;
}

const DEFAULT_FORM_DATA: StaffFormData = {
  name: '',
  email: '',
  phone: '',
  gender: '',
  roleId: '',
  baseSalary: '',
  commissionRate: '15',
  specialties: [],
  isActive: true,
};

const SPECIALTIES = [
  'Haircuts', 'Hair Coloring', 'Hair Treatments', 'Bridal Styling',
  'Makeup', 'Facials', 'Manicure', 'Pedicure', 'Waxing', 'Threading',
  'Massage', 'Body Treatments', 'Beard Grooming', 'Kids Haircuts',
];


export default function AddEditStaffScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const staffId = params.staffId as string | undefined;
  const isEditing = !!staffId;
  
  const initialFormRef = useRef<StaffFormData>(DEFAULT_FORM_DATA);
  const [formData, setFormData] = useState<StaffFormData>(DEFAULT_FORM_DATA);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showSpecialtiesModal, setShowSpecialtiesModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { data: staffData, loading: loadingStaff, error: staffError } = useStaffDetail(staffId);
  const { data: rolesData, loading: loadingRoles } = useStaffRoles();
  const { createStaff, updateStaff, isCreating, isUpdating } = useStaffMutations();
  
  const isSaving = isCreating || isUpdating;
  const isLoading = loadingStaff || loadingRoles;
  
  const roles: StaffRole[] = rolesData?.roles || [];
  const hasRoles = roles.length > 0;

  useEffect(() => {
    if (isEditing && staffData?.staff) {
      const staff = staffData.staff;
      const formValues: StaffFormData = {
        name: staff.name,
        email: staff.email || '',
        phone: staff.phone || '',
        gender: staff.gender || '',
        roleId: staff.roleId,
        baseSalary: (staff.baseSalaryInPaisa / 100).toString(),
        commissionRate: staff.commissionRate.toString(),
        specialties: staff.specialties || [],
        isActive: staff.isActive,
      };
      setFormData(formValues);
      initialFormRef.current = formValues;
    }
  }, [isEditing, staffData]);

  const hasUnsavedChanges = useCallback(() => {
    const initial = initialFormRef.current;
    return (
      formData.name !== initial.name ||
      formData.email !== initial.email ||
      formData.phone !== initial.phone ||
      formData.gender !== initial.gender ||
      formData.roleId !== initial.roleId ||
      formData.baseSalary !== initial.baseSalary ||
      formData.commissionRate !== initial.commissionRate ||
      formData.isActive !== initial.isActive ||
      JSON.stringify(formData.specialties) !== JSON.stringify(initial.specialties)
    );
  }, [formData]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (hasUnsavedChanges()) {
        setShowDiscardModal(true);
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [hasUnsavedChanges]);

  const handleBack = () => {
    if (hasUnsavedChanges()) {
      setShowDiscardModal(true);
    } else {
      router.back();
    }
  };

  const handleDiscard = () => {
    setShowDiscardModal(false);
    router.back();
  };

  const validateForm = (): boolean => {
    const result = staffFormSchema.safeParse(formData);
    
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as string;
        if (field === 'roleId') {
          newErrors.role = err.message;
        } else {
          newErrors[field] = err.message;
        }
      });
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving');
      return;
    }
    
    const baseSalaryInPaisa = Math.round(parseFloat(formData.baseSalary || '0') * 100);
    const commissionRate = parseFloat(formData.commissionRate || '0');
    
    try {
      if (isEditing && staffId) {
        const updateParams: UpdateStaffParams = {
          id: staffId,
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim(),
          gender: formData.gender || undefined,
          roleId: formData.roleId,
          specialties: formData.specialties,
          baseSalaryInPaisa,
          commissionRate,
          isActive: formData.isActive,
        };
        
        const result = await updateStaff(updateParams);
        if (result.success) {
          Alert.alert('Success', 'Staff member updated successfully', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        } else {
          Alert.alert('Error', result.error || 'Failed to update staff member');
        }
      } else {
        const createParams: CreateStaffParams = {
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim(),
          gender: formData.gender || undefined,
          roleId: formData.roleId,
          specialties: formData.specialties,
          baseSalaryInPaisa,
          commissionRate,
          isActive: formData.isActive,
        };
        
        const result = await createStaff(createParams);
        if (result.success) {
          Alert.alert('Success', 'Staff member added successfully', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        } else {
          Alert.alert('Error', result.error || 'Failed to add staff member');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  const selectedRole = roles.find(r => r.id === formData.roleId);

  if (isLoading && isEditing) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading staff details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (staffError && isEditing) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Failed to Load</Text>
          <Text style={styles.errorMessage}>{staffError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {formData.name ? formData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
              </Text>
            </View>
            <TouchableOpacity style={styles.changePhotoBtn}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, name: text }));
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              placeholder="Enter full name"
              placeholderTextColor={COLORS.textMuted}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number *</Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              value={formData.phone}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, phone: text }));
                if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
              }}
              placeholder="+91 98765 43210"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, email: text }));
                if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
              }}
              placeholder="email@example.com"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {(['male', 'female', 'other'] as const).map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderBtn,
                    formData.gender === gender && styles.genderBtnActive,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, gender }))}
                >
                  <Text style={[
                    styles.genderText,
                    formData.gender === gender && styles.genderTextActive,
                  ]}>
                    {gender === 'male' ? '👨 Male' : gender === 'female' ? '👩 Female' : '⚧ Other'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Role & Responsibilities</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Role *</Text>
            <TouchableOpacity
              style={[styles.selectInput, errors.role && styles.inputError]}
              onPress={() => setShowRoleModal(true)}
            >
              <Text style={selectedRole ? styles.selectText : styles.selectPlaceholder}>
                {selectedRole ? `${selectedRole.icon} ${selectedRole.name}` : 'Select a role'}
              </Text>
              <Text style={styles.selectArrow}>▼</Text>
            </TouchableOpacity>
            {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Specialties</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setShowSpecialtiesModal(true)}
            >
              <Text style={formData.specialties.length > 0 ? styles.selectText : styles.selectPlaceholder}>
                {formData.specialties.length > 0 
                  ? `${formData.specialties.length} selected`
                  : 'Select specialties'}
              </Text>
              <Text style={styles.selectArrow}>▼</Text>
            </TouchableOpacity>
            {formData.specialties.length > 0 && (
              <View style={styles.tagsContainer}>
                {formData.specialties.map((specialty) => (
                  <View key={specialty} style={styles.tag}>
                    <Text style={styles.tagText}>{specialty}</Text>
                    <TouchableOpacity onPress={() => toggleSpecialty(specialty)}>
                      <Text style={styles.tagRemove}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compensation</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Base Salary (per month)</Text>
            <View style={styles.currencyInput}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={[styles.inputWithPrefix, errors.baseSalary && styles.inputError]}
                value={formData.baseSalary}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, baseSalary: text }));
                  if (errors.baseSalary) setErrors(prev => ({ ...prev, baseSalary: '' }));
                }}
                placeholder="35000"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
              />
            </View>
            {errors.baseSalary && <Text style={styles.errorText}>{errors.baseSalary}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Commission Rate (%)</Text>
            <View style={styles.currencyInput}>
              <TextInput
                style={[styles.inputWithPrefix, errors.commissionRate && styles.inputError]}
                value={formData.commissionRate}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, commissionRate: text }));
                  if (errors.commissionRate) setErrors(prev => ({ ...prev, commissionRate: '' }));
                }}
                placeholder="15"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
              />
              <Text style={styles.percentSymbol}>%</Text>
            </View>
            {errors.commissionRate && <Text style={styles.errorText}>{errors.commissionRate}</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Active Staff Member</Text>
              <Text style={styles.switchDescription}>
                Inactive staff won't appear in booking options
              </Text>
            </View>
            <Switch
              value={formData.isActive}
              onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value }))}
              trackColor={{ false: COLORS.cardBorder, true: COLORS.green }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleBack}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <LinearGradient colors={GRADIENTS.primary} style={styles.saveGradient}>
            {isSaving ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.saveText}>{isEditing ? 'Update Staff' : 'Add Staff'}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Modal visible={showRoleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Role</Text>
            <ScrollView style={styles.modalList}>
              {roles.map((role) => (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.modalItem,
                    formData.roleId === role.id && styles.modalItemActive,
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, roleId: role.id }));
                    if (errors.role) setErrors(prev => ({ ...prev, role: '' }));
                    setShowRoleModal(false);
                  }}
                >
                  <Text style={styles.modalItemIcon}>{role.icon}</Text>
                  <Text style={[
                    styles.modalItemText,
                    formData.roleId === role.id && styles.modalItemTextActive,
                  ]}>
                    {role.name}
                  </Text>
                  {formData.roleId === role.id && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowRoleModal(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showSpecialtiesModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Specialties</Text>
            <ScrollView style={styles.modalList}>
              {SPECIALTIES.map((specialty) => (
                <TouchableOpacity
                  key={specialty}
                  style={[
                    styles.modalItem,
                    formData.specialties.includes(specialty) && styles.modalItemActive,
                  ]}
                  onPress={() => toggleSpecialty(specialty)}
                >
                  <Text style={[
                    styles.modalItemText,
                    formData.specialties.includes(specialty) && styles.modalItemTextActive,
                  ]}>
                    {specialty}
                  </Text>
                  {formData.specialties.includes(specialty) && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={styles.modalDoneBtn} 
              onPress={() => setShowSpecialtiesModal(false)}
            >
              <LinearGradient colors={GRADIENTS.primary} style={styles.modalDoneGradient}>
                <Text style={styles.modalDoneText}>Done ({formData.specialties.length} selected)</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showDiscardModal} transparent animationType="fade">
        <View style={styles.discardOverlay}>
          <View style={styles.discardContent}>
            <Text style={styles.discardTitle}>Discard Changes?</Text>
            <Text style={styles.discardMessage}>
              You have unsaved changes. Are you sure you want to discard them?
            </Text>
            <View style={styles.discardActions}>
              <TouchableOpacity 
                style={styles.discardKeepBtn} 
                onPress={() => setShowDiscardModal(false)}
              >
                <Text style={styles.discardKeepText}>Keep Editing</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.discardBtn} 
                onPress={handleDiscard}
              >
                <Text style={styles.discardBtnText}>Discard</Text>
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
    gap: SPACING.lg,
  },
  loadingText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  errorMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  retryBtn: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
  },
  retryText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.violet,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.violet,
  },
  avatarText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  changePhotoBtn: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  changePhotoText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.violet,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  inputError: {
    borderColor: COLORS.red,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.red,
    marginTop: SPACING.xs,
  },
  genderRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
  },
  genderBtnActive: {
    borderColor: COLORS.violet,
    backgroundColor: `${COLORS.violet}20`,
  },
  genderText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  genderTextActive: {
    color: COLORS.violet,
    fontWeight: '600',
  },
  selectInput: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  selectText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  selectPlaceholder: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textMuted,
  },
  selectArrow: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.violet}20`,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  tagText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.violet,
  },
  tagRemove: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.violet,
    fontWeight: '600',
  },
  currencyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: SPACING.lg,
  },
  currencySymbol: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  percentSymbol: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  inputWithPrefix: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  switchLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  switchDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: SPACING.xl,
    gap: SPACING.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  cancelBtn: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
  },
  cancelText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  saveBtn: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlayLight,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  modalItemActive: {
    backgroundColor: `${COLORS.violet}15`,
  },
  modalItemIcon: {
    fontSize: 24,
  },
  modalItemText: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
  },
  modalItemTextActive: {
    color: COLORS.violet,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.violet,
    fontWeight: '600',
  },
  modalCloseBtn: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalDoneBtn: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  modalDoneGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  modalDoneText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  discardOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  discardContent: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 320,
  },
  discardTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  discardMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  discardActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  discardKeepBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  discardKeepText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  discardBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.red,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  discardBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
});
