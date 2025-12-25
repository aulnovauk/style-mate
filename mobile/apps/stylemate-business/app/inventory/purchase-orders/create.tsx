import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
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
  useVendors,
  useInventoryProducts,
  useInventoryActions,
} from '@stylemate/core/hooks/useBusinessApi';
import type { Vendor, InventoryProduct } from '@stylemate/core/services/businessApi';

type WizardStep = 1 | 2 | 3;

const STEPS = [
  { step: 1, title: 'Supplier', icon: '🏢' },
  { step: 2, title: 'Products', icon: '📦' },
  { step: 3, title: 'Review', icon: '✅' },
];

interface OrderItem {
  productId: string;
  product: InventoryProduct;
  quantity: number;
  unitCostInPaisa: number;
}

function StepIndicator({ currentStep }: { currentStep: WizardStep }) {
  return (
    <View style={styles.stepIndicator}>
      {STEPS.map((step, index) => (
        <View key={step.step} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              currentStep >= step.step && styles.stepCircleActive,
              currentStep === step.step && styles.stepCircleCurrent,
            ]}
          >
            <Text style={styles.stepIcon}>{step.icon}</Text>
          </View>
          <Text
            style={[
              styles.stepTitle,
              currentStep >= step.step && styles.stepTitleActive,
            ]}
          >
            {step.title}
          </Text>
          {index < STEPS.length - 1 && (
            <View
              style={[
                styles.stepLine,
                currentStep > step.step && styles.stepLineActive,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );
}

export default function CreatePurchaseOrder() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { vendors, loading: vendorsLoading } = useVendors();
  const { products, loading: productsLoading } = useInventoryProducts({
    vendorId: selectedVendor?.id,
  });
  const { createPurchaseOrder, isSubmitting } = useInventoryActions();

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const totalAmount = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + (item.quantity * item.unitCostInPaisa), 0);
  }, [orderItems]);

  const formatPrice = (paisa: number) => `₹${(paisa / 100).toFixed(2)}`;

  const handleAddItem = (product: InventoryProduct) => {
    const existingIndex = orderItems.findIndex(item => item.productId === product.id);
    if (existingIndex >= 0) {
      const newItems = [...orderItems];
      newItems[existingIndex].quantity += 1;
      setOrderItems(newItems);
    } else {
      setOrderItems([...orderItems, {
        productId: product.id,
        product,
        quantity: 1,
        unitCostInPaisa: product.costPriceInPaisa,
      }]);
    }
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(orderItems.filter(item => item.productId !== productId));
    } else {
      setOrderItems(orderItems.map(item => 
        item.productId === productId ? { ...item, quantity } : item
      ));
    }
  };

  const handleRemoveItem = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId));
  };

  const handleNext = () => {
    if (currentStep === 1 && !selectedVendor) {
      Alert.alert('Error', 'Please select a supplier');
      return;
    }
    if (currentStep === 2 && orderItems.length === 0) {
      Alert.alert('Error', 'Please add at least one product');
      return;
    }
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (!selectedVendor) return;

    const result = await createPurchaseOrder({
      vendorId: selectedVendor.id,
      expectedDeliveryDate: expectedDeliveryDate || undefined,
      notes: notes.trim() || undefined,
      items: orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitCostInPaisa: item.unitCostInPaisa,
      })),
    });

    if (result.success) {
      Alert.alert('Success', 'Purchase order created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to create order');
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeader}>Select Supplier</Text>
      <Text style={styles.stepSubheader}>Choose a supplier for this order</Text>

      {vendorsLoading ? (
        <ActivityIndicator color={COLORS.violet} />
      ) : (
        <FlatList
          data={vendors.filter(v => v.status === 'active')}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.vendorCard,
                selectedVendor?.id === item.id && styles.vendorCardSelected,
              ]}
              onPress={() => setSelectedVendor(item)}
            >
              <View style={styles.vendorAvatar}>
                <Text style={styles.vendorAvatarText}>{item.name.charAt(0)}</Text>
              </View>
              <View style={styles.vendorInfo}>
                <Text style={styles.vendorName}>{item.name}</Text>
                {item.contactPerson && (
                  <Text style={styles.vendorContact}>{item.contactPerson}</Text>
                )}
              </View>
              {selectedVendor?.id === item.id && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No active suppliers found</Text>
            </View>
          }
        />
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeader}>Add Products</Text>
      <Text style={styles.stepSubheader}>Select products from {selectedVendor?.name}</Text>

      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search products..."
        placeholderTextColor={COLORS.textMuted}
      />

      {productsLoading ? (
        <ActivityIndicator color={COLORS.violet} />
      ) : (
        <>
          {orderItems.length > 0 && (
            <View style={styles.selectedItems}>
              <Text style={styles.selectedItemsTitle}>Selected ({orderItems.length})</Text>
              {orderItems.map((item) => (
                <View key={item.productId} style={styles.selectedItem}>
                  <View style={styles.selectedItemInfo}>
                    <Text style={styles.selectedItemName}>{item.product.name}</Text>
                    <Text style={styles.selectedItemPrice}>{formatPrice(item.unitCostInPaisa)} each</Text>
                  </View>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                    >
                      <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveItem(item.productId)}>
                    <Text style={styles.removeBtn}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const isSelected = orderItems.some(oi => oi.productId === item.id);
              return (
                <TouchableOpacity
                  style={[styles.productCard, isSelected && styles.productCardSelected]}
                  onPress={() => handleAddItem(item)}
                >
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productSku}>SKU: {item.sku}</Text>
                  </View>
                  <View style={styles.productMeta}>
                    <Text style={styles.productPrice}>{item.costPriceFormatted}</Text>
                    <Text style={styles.productStock}>{item.currentStock} in stock</Text>
                  </View>
                  <View style={styles.addIcon}>
                    <Text style={styles.addIconText}>{isSelected ? '✓' : '+'}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No products found</Text>
              </View>
            }
          />
        </>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeader}>Review Order</Text>
      <Text style={styles.stepSubheader}>Confirm your purchase order</Text>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Supplier</Text>
        <Text style={styles.reviewValue}>{selectedVendor?.name}</Text>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Expected Delivery Date</Text>
        <TextInput
          style={styles.dateInput}
          value={expectedDeliveryDate}
          onChangeText={setExpectedDeliveryDate}
          placeholder="YYYY-MM-DD (optional)"
          placeholderTextColor={COLORS.textMuted}
        />
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Notes</Text>
        <TextInput
          style={[styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Order notes..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Order Items ({orderItems.length})</Text>
        {orderItems.map((item) => (
          <View key={item.productId} style={styles.reviewItem}>
            <View style={styles.reviewItemInfo}>
              <Text style={styles.reviewItemName}>{item.product.name}</Text>
              <Text style={styles.reviewItemQty}>{item.quantity} x {formatPrice(item.unitCostInPaisa)}</Text>
            </View>
            <Text style={styles.reviewItemTotal}>
              {formatPrice(item.quantity * item.unitCostInPaisa)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.totalSection}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatPrice(totalAmount)}</Text>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Order</Text>
        <View style={styles.placeholder} />
      </View>

      <StepIndicator currentStep={currentStep} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStepContent()}
      </ScrollView>

      <View style={styles.bottomBar}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.primaryButton, currentStep === 1 && styles.primaryButtonFull]}
          onPress={handleNext}
          disabled={isSubmitting}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButtonGradient}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {currentStep === 3 ? 'Create Order' : 'Next'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.cardBg,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  stepCircleActive: {
    borderColor: COLORS.violet,
    backgroundColor: `${COLORS.violet}20`,
  },
  stepCircleCurrent: {
    backgroundColor: COLORS.violet,
  },
  stepIcon: {
    fontSize: 20,
  },
  stepTitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  stepTitleActive: {
    color: COLORS.violet,
    fontWeight: '600',
  },
  stepLine: {
    position: 'absolute',
    top: 24,
    right: -50,
    width: 100,
    height: 2,
    backgroundColor: COLORS.cardBorder,
    zIndex: -1,
  },
  stepLineActive: {
    backgroundColor: COLORS.violet,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SIZES.listPaddingBottom,
  },
  stepContent: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  stepHeader: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  stepSubheader: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
  },
  vendorCardSelected: {
    borderColor: COLORS.violet,
    backgroundColor: `${COLORS.violet}10`,
  },
  vendorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.violet,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  vendorAvatarText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.white,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  vendorContact: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  searchInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  selectedItems: {
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: `${COLORS.violet}10`,
    borderRadius: BORDER_RADIUS.md,
  },
  selectedItemsTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.violet,
    marginBottom: SPACING.sm,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  selectedItemInfo: {
    flex: 1,
  },
  selectedItemName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  selectedItemPrice: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.violet,
  },
  qtyValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    minWidth: 40,
    textAlign: 'center',
  },
  removeBtn: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.red,
    padding: SPACING.xs,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  productCardSelected: {
    borderColor: COLORS.green,
    backgroundColor: `${COLORS.green}10`,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  productSku: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  productMeta: {
    alignItems: 'flex-end',
    marginRight: SPACING.md,
  },
  productPrice: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  productStock: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  addIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.violet,
  },
  emptyState: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
  reviewSection: {
    marginBottom: SPACING.lg,
  },
  reviewLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  reviewValue: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  dateInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  notesInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  reviewItemInfo: {
    flex: 1,
  },
  reviewItemName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  reviewItemQty: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  reviewItemTotal: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.lg,
    borderTopWidth: 2,
    borderTopColor: COLORS.violet,
  },
  totalLabel: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.violet,
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
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  primaryButton: {
    flex: 2,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  primaryButtonFull: {
    flex: 1,
  },
  primaryButtonGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
});
