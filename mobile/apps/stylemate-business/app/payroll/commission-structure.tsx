import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useCommissionStructures,
  usePayrollActions,
} from '@stylemate/core/hooks/useBusinessApi';
import type { CommissionStructure } from '@stylemate/core/services/businessApi';
import {
  COLORS,
  GRADIENTS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from '../../constants/theme';

interface CommissionTier {
  min: number;
  max: number;
  rate: number;
}

interface CommissionStructureWithCount extends CommissionStructure {
  assignedStaffCount?: number;
}

const formatCurrency = (amountInPaisa: number): string => {
  return `₹${(amountInPaisa / 100).toLocaleString('en-IN')}`;
};

const TYPE_CONFIG = {
  flat: { label: 'Flat Rate', icon: '₹', color: COLORS.blue, description: 'Fixed amount per service' },
  percentage: { label: 'Percentage', icon: '%', color: COLORS.green, description: 'Percentage of service value' },
  tiered: { label: 'Tiered', icon: '📊', color: COLORS.violet, description: 'Variable rates based on thresholds' },
};

const SERVICE_CATEGORIES = [
  { id: 'all', name: 'All Services' },
  { id: 'hair', name: 'Hair Services' },
  { id: 'skincare', name: 'Skincare' },
  { id: 'makeup', name: 'Makeup' },
  { id: 'nails', name: 'Nail Services' },
  { id: 'spa', name: 'Spa & Wellness' },
  { id: 'bridal', name: 'Bridal Packages' },
];

export default function CommissionStructureScreen() {
  const router = useRouter();
  const { data: structures, loading, error, refetch } = useCommissionStructures();
  const { createCommissionStructure, updateCommissionStructure, isSubmitting } = usePayrollActions();
  
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStructure, setEditingStructure] = useState<CommissionStructureWithCount | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'percentage' as 'flat' | 'percentage' | 'tiered',
    serviceCategory: null as string | null,
    baseFlatAmount: '',
    basePercentage: '',
    tiers: [] as CommissionTier[],
  });

  const structuresWithCount: CommissionStructureWithCount[] = (structures || []).map(s => ({
    ...s,
    assignedStaffCount: 0,
  }));

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAddStructure = () => {
    setEditingStructure(null);
    setFormData({
      name: '',
      type: 'percentage',
      serviceCategory: null,
      baseFlatAmount: '',
      basePercentage: '',
      tiers: [],
    });
    setShowAddModal(true);
  };

  const handleEditStructure = (structure: CommissionStructure) => {
    setEditingStructure(structure);
    setFormData({
      name: structure.name,
      type: structure.type,
      serviceCategory: structure.serviceCategory,
      baseFlatAmount: structure.baseFlatAmount ? (structure.baseFlatAmount / 100).toString() : '',
      basePercentage: structure.basePercentage?.toString() || '',
      tiers: structure.tiers,
    });
    setShowAddModal(true);
  };

  const handleToggleActive = (structure: CommissionStructureWithCount) => {
    Alert.alert(
      structure.isActive ? 'Deactivate Structure' : 'Activate Structure',
      structure.isActive
        ? `Deactivating "${structure.name}" will stop applying this commission.`
        : `Activate "${structure.name}" for commission calculations?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: structure.isActive ? 'Deactivate' : 'Activate',
          style: structure.isActive ? 'destructive' : 'default',
          onPress: async () => {
            const result = await updateCommissionStructure(structure.id, { isActive: !structure.isActive });
            if (result.success) {
              await refetch();
            } else {
              Alert.alert('Error', result.error || 'Failed to update structure');
            }
          },
        },
      ]
    );
  };

  const handleDeleteStructure = (structure: CommissionStructureWithCount) => {
    if ((structure.assignedStaffCount || 0) > 0) {
      Alert.alert(
        'Cannot Delete',
        `This commission structure is assigned to ${structure.assignedStaffCount} staff members. Please reassign them first.`
      );
      return;
    }

    Alert.alert(
      'Delete Structure',
      `Are you sure you want to delete "${structure.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await updateCommissionStructure(structure.id, { isActive: false });
            if (result.success) {
              await refetch();
            } else {
              Alert.alert('Error', result.error || 'Failed to delete structure');
            }
          },
        },
      ]
    );
  };

  const handleSaveStructure = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a structure name');
      return;
    }

    if (formData.type === 'percentage' && !formData.basePercentage) {
      Alert.alert('Error', 'Please enter a percentage rate');
      return;
    }

    if (formData.type === 'flat' && !formData.baseFlatAmount) {
      Alert.alert('Error', 'Please enter a flat amount');
      return;
    }

    if (formData.type === 'tiered' && formData.tiers.length === 0) {
      Alert.alert('Error', 'Please add at least one tier');
      return;
    }

    const structureData = {
      name: formData.name,
      type: formData.type,
      serviceCategory: formData.serviceCategory,
      baseFlatAmount: formData.baseFlatAmount ? parseFloat(formData.baseFlatAmount) * 100 : null,
      basePercentage: formData.basePercentage ? parseFloat(formData.basePercentage) : null,
      tiers: formData.tiers,
      isActive: editingStructure?.isActive ?? true,
    };

    let result;
    if (editingStructure) {
      result = await updateCommissionStructure(editingStructure.id, structureData);
    } else {
      result = await createCommissionStructure(structureData);
    }

    if (result.success) {
      setShowAddModal(false);
      await refetch();
      Alert.alert('Success', editingStructure ? 'Commission structure updated' : 'Commission structure created');
    } else {
      Alert.alert('Error', result.error || 'Failed to save structure');
    }
  };

  const addTier = () => {
    const lastTier = formData.tiers[formData.tiers.length - 1];
    const newMin = lastTier ? lastTier.max + 1 : 0;
    setFormData(prev => ({
      ...prev,
      tiers: [...prev.tiers, { min: newMin, max: newMin + 50000, rate: 10 }],
    }));
  };

  const removeTier = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tiers: prev.tiers.filter((_, i) => i !== index),
    }));
  };

  const updateTier = (index: number, field: keyof CommissionTier, value: string) => {
    setFormData(prev => ({
      ...prev,
      tiers: prev.tiers.map((tier, i) =>
        i === index ? { ...tier, [field]: parseFloat(value) || 0 } : tier
      ),
    }));
  };

  const renderStructureCard = (structure: CommissionStructureWithCount) => {
    const typeConfig = TYPE_CONFIG[structure.type];
    const category = SERVICE_CATEGORIES.find(c => c.id === structure.serviceCategory);

    return (
      <TouchableOpacity
        key={structure.id}
        style={[styles.structureCard, !structure.isActive && styles.inactiveCard]}
        onPress={() => handleEditStructure(structure)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.typeIcon, { backgroundColor: `${typeConfig.color}20` }]}>
              <Text style={[styles.typeIconText, { color: typeConfig.color }]}>{typeConfig.icon}</Text>
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.structureName}>{structure.name}</Text>
              <Text style={styles.structureType}>{typeConfig.label}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: structure.isActive ? `${COLORS.green}20` : `${COLORS.textMuted}20` }]}>
            <Text style={[styles.statusText, { color: structure.isActive ? COLORS.green : COLORS.textMuted }]}>
              {structure.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          {structure.type === 'percentage' && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rate</Text>
              <Text style={styles.detailValue}>{structure.basePercentage}%</Text>
            </View>
          )}
          {structure.type === 'flat' && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>{formatCurrency(structure.baseFlatAmount || 0)}</Text>
            </View>
          )}
          {structure.type === 'tiered' && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tiers</Text>
              <Text style={styles.detailValue}>{structure.tiers.length} levels</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Applies to</Text>
            <Text style={styles.detailValue}>{category?.name || 'All Services'}</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.toggleButton, isSubmitting && styles.formatButtonDisabled]}
            onPress={() => handleToggleActive(structure)}
            disabled={isSubmitting}
          >
            <Text style={styles.actionButtonText}>
              {structure.isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton, isSubmitting && styles.formatButtonDisabled]}
            onPress={() => handleDeleteStructure(structure)}
            disabled={isSubmitting}
          >
            <Text style={[styles.actionButtonText, { color: COLORS.red }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading commission structures...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Commission Structures</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddStructure}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <LinearGradient colors={GRADIENTS.card} style={styles.infoGradient}>
          <Text style={styles.infoIcon}>💡</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Automated Commission Calculations</Text>
            <Text style={styles.infoDescription}>
              Define commission structures and assign them to staff. Commissions are automatically calculated from completed services.
            </Text>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.violet} />}
      >
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={refetch}>
              <Text style={styles.retryText}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {structuresWithCount.length === 0 && !loading && !error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No Commission Structures</Text>
            <Text style={styles.emptyDescription}>Create your first commission structure to automate staff payouts.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Active Structures ({structuresWithCount.filter(s => s.isActive).length})</Text>
            {structuresWithCount.filter(s => s.isActive).map(renderStructureCard)}

            {structuresWithCount.filter(s => !s.isActive).length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>
                  Inactive Structures ({structuresWithCount.filter(s => !s.isActive).length})
                </Text>
                {structuresWithCount.filter(s => !s.isActive).map(renderStructureCard)}
              </>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingStructure ? 'Edit Structure' : 'New Structure'}
            </Text>
            <TouchableOpacity onPress={handleSaveStructure}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Structure Name</Text>
              <TextInput
                style={styles.textInput}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="e.g., Senior Stylist Commission"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Commission Type</Text>
              <View style={styles.typeSelector}>
                {(Object.keys(TYPE_CONFIG) as Array<keyof typeof TYPE_CONFIG>).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      formData.type === type && { backgroundColor: `${TYPE_CONFIG[type].color}20`, borderColor: TYPE_CONFIG[type].color },
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, type }))}
                  >
                    <Text style={[styles.typeOptionIcon, { color: TYPE_CONFIG[type].color }]}>
                      {TYPE_CONFIG[type].icon}
                    </Text>
                    <Text style={[styles.typeOptionLabel, formData.type === type && { color: TYPE_CONFIG[type].color }]}>
                      {TYPE_CONFIG[type].label}
                    </Text>
                    <Text style={styles.typeOptionDesc}>{TYPE_CONFIG[type].description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Apply to Service Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {SERVICE_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      (formData.serviceCategory === cat.id || (cat.id === 'all' && !formData.serviceCategory)) && styles.categoryChipActive,
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, serviceCategory: cat.id === 'all' ? null : cat.id }))}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        (formData.serviceCategory === cat.id || (cat.id === 'all' && !formData.serviceCategory)) && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {formData.type === 'percentage' && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Commission Percentage</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.textInput, styles.percentInput]}
                    value={formData.basePercentage}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, basePercentage: text }))}
                    placeholder="15"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.inputSuffix}>%</Text>
                </View>
              </View>
            )}

            {formData.type === 'flat' && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Flat Amount per Service</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.inputPrefix}>₹</Text>
                  <TextInput
                    style={[styles.textInput, styles.currencyInput]}
                    value={formData.baseFlatAmount}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, baseFlatAmount: text }))}
                    placeholder="100"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            )}

            {formData.type === 'tiered' && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Commission Tiers</Text>
                <Text style={styles.formHint}>Define progressive rates based on service value</Text>
                
                {formData.tiers.map((tier, index) => (
                  <View key={index} style={styles.tierRow}>
                    <View style={styles.tierInputs}>
                      <View style={styles.tierField}>
                        <Text style={styles.tierLabel}>Min (₹)</Text>
                        <TextInput
                          style={styles.tierInput}
                          value={(tier.min / 100).toString()}
                          onChangeText={(text) => updateTier(index, 'min', (parseFloat(text) * 100).toString())}
                          keyboardType="decimal-pad"
                        />
                      </View>
                      <View style={styles.tierField}>
                        <Text style={styles.tierLabel}>Max (₹)</Text>
                        <TextInput
                          style={styles.tierInput}
                          value={(tier.max / 100).toString()}
                          onChangeText={(text) => updateTier(index, 'max', (parseFloat(text) * 100).toString())}
                          keyboardType="decimal-pad"
                        />
                      </View>
                      <View style={styles.tierField}>
                        <Text style={styles.tierLabel}>Rate (%)</Text>
                        <TextInput
                          style={styles.tierInput}
                          value={tier.rate.toString()}
                          onChangeText={(text) => updateTier(index, 'rate', text)}
                          keyboardType="decimal-pad"
                        />
                      </View>
                    </View>
                    <TouchableOpacity style={styles.removeTierButton} onPress={() => removeTier(index)}>
                      <Text style={styles.removeTierText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity style={styles.addTierButton} onPress={addTier}>
                  <Text style={styles.addTierText}>+ Add Tier</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
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
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    marginTop: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  backButtonText: {
    fontSize: FONT_SIZES.xxxl,
    color: COLORS.violet,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.violet,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  addButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  infoCard: {
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  infoGradient: {
    flexDirection: 'row',
    padding: SPACING.md,
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: FONT_SIZES.xxxl,
    marginRight: SPACING.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  infoDescription: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  structureCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inactiveCard: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  typeIconText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
  },
  cardTitleContainer: {
    flex: 1,
  },
  structureName: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  structureType: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  cardDetails: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  detailValue: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleButton: {
    backgroundColor: COLORS.backgroundLight,
  },
  deleteButton: {
    backgroundColor: `${COLORS.red}10`,
    borderColor: `${COLORS.red}30`,
  },
  actionButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cancelButton: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  saveButton: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: SPACING.md,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  formLabel: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  formHint: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    marginBottom: SPACING.sm,
  },
  textInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
  },
  typeSelector: {
    gap: SPACING.sm,
  },
  typeOption: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  typeOptionIcon: {
    fontSize: FONT_SIZES.xxxl,
    marginBottom: SPACING.xs,
  },
  typeOptionLabel: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  typeOptionDesc: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  categoryScroll: {
    marginTop: SPACING.xs,
  },
  categoryChip: {
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: `${COLORS.violet}20`,
    borderColor: COLORS.violet,
  },
  categoryChipText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  categoryChipTextActive: {
    color: COLORS.violet,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputPrefix: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    marginRight: SPACING.sm,
  },
  inputSuffix: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    marginLeft: SPACING.sm,
  },
  percentInput: {
    flex: 1,
    textAlign: 'center',
  },
  currencyInput: {
    flex: 1,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tierInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  tierField: {
    flex: 1,
  },
  tierLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    marginBottom: 4,
  },
  tierInput: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  removeTierButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  removeTierText: {
    color: COLORS.red,
    fontSize: FONT_SIZES.lg,
  },
  addTierButton: {
    backgroundColor: `${COLORS.violet}20`,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.violet,
    borderStyle: 'dashed',
  },
  addTierText: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  formatButtonDisabled: {
    opacity: 0.5,
  },
  errorCard: {
    backgroundColor: `${COLORS.red}10`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.red,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  retryText: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyIcon: {
    fontSize: FONT_SIZES.giant,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  emptyDescription: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});
