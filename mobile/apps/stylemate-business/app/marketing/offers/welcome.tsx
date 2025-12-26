import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Switch, TextInput, Modal, Alert } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useCallback } from 'react';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../../constants/theme';
import { marketingApi, WelcomeOffer } from '@stylemate/core/services/businessApi';

export default function WelcomeOffersScreen() {
  const [offers, setOffers] = useState<WelcomeOffer[]>([]);
  const [stats, setStats] = useState({ active: 0, assigned: 0, redeemed: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<WelcomeOffer | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [formDiscountValue, setFormDiscountValue] = useState('');
  const [formValidityDays, setFormValidityDays] = useState('30');
  const [formUsageLimit, setFormUsageLimit] = useState('1');

  const fetchData = async () => {
    try {
      const response = await marketingApi.getWelcomeOffers();
      if (response.success && response.data) {
        setOffers(response.data.offers);
        setStats(response.data.stats);
      } else {
        const mock = getMockData();
        setOffers(mock.offers);
        setStats(mock.stats);
      }
    } catch (err) {
      console.error('Error fetching welcome offers:', err);
      const mock = getMockData();
      setOffers(mock.offers);
      setStats(mock.stats);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingOffer(null);
    setFormTitle('');
    setFormDescription('');
    setFormDiscountType('percentage');
    setFormDiscountValue('');
    setFormValidityDays('30');
    setFormUsageLimit('1');
    setShowModal(true);
  };

  const openEditModal = (offer: WelcomeOffer) => {
    setEditingOffer(offer);
    setFormTitle(offer.title);
    setFormDescription(offer.description);
    setFormDiscountType(offer.discountType);
    setFormDiscountValue(offer.discountValue.toString());
    setFormValidityDays(offer.validityDays.toString());
    setFormUsageLimit(offer.usageLimit.toString());
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formDiscountValue) {
      Alert.alert('Required', 'Please fill in all required fields');
      return;
    }

    try {
      if (editingOffer) {
        await marketingApi.updateWelcomeOffer(editingOffer.id, {
          title: formTitle,
          description: formDescription,
          discountType: formDiscountType,
          discountValue: parseFloat(formDiscountValue),
          validityDays: parseInt(formValidityDays),
          usageLimit: parseInt(formUsageLimit),
        });
      } else {
        await marketingApi.createWelcomeOffer({
          title: formTitle,
          description: formDescription,
          discountType: formDiscountType,
          discountValue: parseFloat(formDiscountValue),
          validityDays: parseInt(formValidityDays),
          usageLimit: parseInt(formUsageLimit),
          isActive: true,
        });
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error('Error saving welcome offer:', err);
      Alert.alert('Error', 'Failed to save welcome offer. Please try again.');
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, isActive } : o));
    try {
      await marketingApi.toggleWelcomeOffer(id);
    } catch {
      setOffers(prev => prev.map(o => o.id === id ? { ...o, isActive: !isActive } : o));
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Welcome Offer',
      'Are you sure you want to delete this welcome offer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await marketingApi.deleteWelcomeOffer(id);
              setOffers(prev => prev.filter(o => o.id !== id));
            } catch {
              Alert.alert('Error', 'Failed to delete offer');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.violet} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Welcome Offers</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.violet} />
        }
      >
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>👋</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Welcome New Customers</Text>
            <Text style={styles.infoDescription}>
              Automatically assign special offers to first-time customers to encourage them to book.
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.green }]}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.assigned}</Text>
            <Text style={styles.statLabel}>Assigned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.redeemed}</Text>
            <Text style={styles.statLabel}>Redeemed</Text>
          </View>
        </View>

        {offers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎁</Text>
            <Text style={styles.emptyTitle}>No welcome offers yet</Text>
            <Text style={styles.emptyText}>
              Create your first welcome offer to greet new customers
            </Text>
          </View>
        ) : (
          offers.map((offer) => (
            <View key={offer.id} style={styles.offerCard}>
              <View style={styles.offerHeader}>
                <View style={styles.offerTitleContainer}>
                  <Text style={styles.offerTitle}>{offer.title}</Text>
                  <Text style={styles.offerDescription}>{offer.description}</Text>
                </View>
                <Switch
                  value={offer.isActive}
                  onValueChange={(value) => handleToggle(offer.id, value)}
                  trackColor={{ false: COLORS.cardBorder, true: COLORS.violet + '60' }}
                  thumbColor={offer.isActive ? COLORS.violet : COLORS.textMuted}
                />
              </View>

              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.discountBadge}
              >
                <Text style={styles.discountText}>
                  {offer.discountValue}{offer.discountType === 'percentage' ? '%' : '₹'} OFF
                </Text>
              </LinearGradient>

              <View style={styles.offerDetails}>
                <View style={styles.offerDetail}>
                  <Text style={styles.offerDetailLabel}>Valid for</Text>
                  <Text style={styles.offerDetailValue}>{offer.validityDays} days</Text>
                </View>
                <View style={styles.offerDetail}>
                  <Text style={styles.offerDetailLabel}>Usage</Text>
                  <Text style={styles.offerDetailValue}>{offer.usageLimit}x per customer</Text>
                </View>
              </View>

              <View style={styles.offerStats}>
                <Text style={styles.offerStatsText}>
                  {offer.assignedCount} assigned • {offer.redeemedCount} redeemed
                </Text>
              </View>

              <View style={styles.offerActions}>
                <TouchableOpacity
                  style={styles.offerAction}
                  onPress={() => openEditModal(offer)}
                >
                  <Text style={styles.offerActionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.offerAction, styles.offerActionDanger]}
                  onPress={() => handleDelete(offer.id)}
                >
                  <Text style={[styles.offerActionText, styles.offerActionTextDanger]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={openCreateModal}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={GRADIENTS.primary}
          style={styles.fabGradient}
        >
          <Text style={styles.fabIcon}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingOffer ? 'Edit Welcome Offer' : 'Create Welcome Offer'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Welcome Gift"
                  placeholderTextColor={COLORS.textMuted}
                  value={formTitle}
                  onChangeText={setFormTitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Brief description"
                  placeholderTextColor={COLORS.textMuted}
                  value={formDescription}
                  onChangeText={setFormDescription}
                  multiline
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Discount *</Text>
                <View style={styles.discountRow}>
                  <TouchableOpacity
                    style={[
                      styles.discountTypeButton,
                      formDiscountType === 'percentage' && styles.discountTypeActive,
                    ]}
                    onPress={() => setFormDiscountType('percentage')}
                  >
                    <Text style={[
                      styles.discountTypeText,
                      formDiscountType === 'percentage' && styles.discountTypeTextActive,
                    ]}>%</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.discountTypeButton,
                      formDiscountType === 'fixed' && styles.discountTypeActive,
                    ]}
                    onPress={() => setFormDiscountType('fixed')}
                  >
                    <Text style={[
                      styles.discountTypeText,
                      formDiscountType === 'fixed' && styles.discountTypeTextActive,
                    ]}>₹</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.input, styles.discountInput]}
                    placeholder="Amount"
                    placeholderTextColor={COLORS.textMuted}
                    value={formDiscountValue}
                    onChangeText={setFormDiscountValue}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Valid for (days)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="30"
                  placeholderTextColor={COLORS.textMuted}
                  value={formValidityDays}
                  onChangeText={setFormValidityDays}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Usage limit per customer</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1"
                  placeholderTextColor={COLORS.textMuted}
                  value={formUsageLimit}
                  onChangeText={setFormUsageLimit}
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={handleSave}
              >
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonPrimaryText}>
                    {editingOffer ? 'Save Changes' : 'Create Offer'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getMockData() {
  return {
    offers: [
      {
        id: '1',
        title: 'Welcome Gift',
        description: 'Get 15% off on your first visit!',
        discountType: 'percentage' as const,
        discountValue: 15,
        validityDays: 30,
        usageLimit: 1,
        isActive: true,
        assignedCount: 156,
        redeemedCount: 89,
      },
      {
        id: '2',
        title: 'First Timer Special',
        description: 'Flat ₹200 off on bookings above ₹1000',
        discountType: 'fixed' as const,
        discountValue: 200,
        minPurchase: 1000,
        validityDays: 14,
        usageLimit: 1,
        isActive: false,
        assignedCount: 45,
        redeemedCount: 23,
      },
    ],
    stats: {
      active: 1,
      assigned: 201,
      redeemed: 112,
    },
  };
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  infoIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  infoDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: SPACING.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  offerCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  offerTitleContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  offerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  offerDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  discountBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  discountText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.white,
  },
  offerDetails: {
    flexDirection: 'row',
    gap: SPACING.xl,
    marginBottom: SPACING.md,
  },
  offerDetail: {},
  offerDetailLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  offerDetailValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  offerStats: {
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  offerStatsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  offerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  offerAction: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.backgroundLight,
    alignItems: 'center',
  },
  offerActionDanger: {
    backgroundColor: COLORS.red + '10',
  },
  offerActionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  offerActionTextDanger: {
    color: COLORS.red,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.lg,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: {
    fontSize: 28,
    color: COLORS.white,
    lineHeight: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalClose: {
    fontSize: 20,
    color: COLORS.textMuted,
    padding: SPACING.sm,
  },
  modalScroll: {
    padding: SPACING.lg,
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
  modalFooter: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.card,
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalButtonPrimary: {
    flex: 2,
  },
  modalButtonGradient: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
});
