import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
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
  usePurchaseOrderDetail,
  useInventoryActions,
} from '@stylemate/core/hooks/useBusinessApi';
import type { PurchaseOrderItem } from '@stylemate/core/services/businessApi';

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; actions: string[] }> = {
  draft: { label: 'Draft', color: COLORS.textSecondary, bgColor: `${COLORS.textSecondary}20`, actions: ['send', 'cancel'] },
  sent: { label: 'Sent', color: COLORS.blue, bgColor: `${COLORS.blue}20`, actions: ['confirm', 'cancel'] },
  confirmed: { label: 'Confirmed', color: COLORS.amber, bgColor: `${COLORS.amber}20`, actions: ['receive'] },
  received: { label: 'Received', color: COLORS.green, bgColor: `${COLORS.green}20`, actions: [] },
  cancelled: { label: 'Cancelled', color: COLORS.red, bgColor: `${COLORS.red}20`, actions: [] },
};

interface ReceiveItemData {
  itemId: string;
  receivedQuantity: number;
  maxQuantity: number;
  batchNumber: string;
  expiryDate: string;
}

export default function PurchaseOrderDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [isReceiving, setIsReceiving] = useState(false);
  const [receiveData, setReceiveData] = useState<Record<string, ReceiveItemData>>({});
  const [receiveNotes, setReceiveNotes] = useState('');

  const { order, items, loading, refetch } = usePurchaseOrderDetail(id);
  const { updatePurchaseOrderStatus, receiveItems, isSubmitting } = useInventoryActions();

  const statusConfig = order ? STATUS_CONFIG[order.status] : null;

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchData = async () => {
        if (isActive) {
          await refetch();
        }
      };
      fetchData();
      return () => {
        isActive = false;
      };
    }, [refetch])
  );

  const hasValidReceiveQuantity = useMemo(() => {
    return Object.values(receiveData).some((item) => {
      const qty = Number(item.receivedQuantity);
      return !isNaN(qty) && qty > 0 && Number.isInteger(qty);
    });
  }, [receiveData]);

  const hasInvalidReceiveQuantity = useMemo(() => {
    return Object.values(receiveData).some((item) => {
      const qty = Number(item.receivedQuantity);
      return isNaN(qty) || qty < 0 || !Number.isInteger(qty) || qty > item.maxQuantity;
    });
  }, [receiveData]);

  const getItemError = useCallback((itemId: string): string | null => {
    const item = receiveData[itemId];
    if (!item) return null;
    const qty = Number(item.receivedQuantity);
    if (isNaN(qty)) return 'Invalid quantity';
    if (qty < 0) return 'Cannot be negative';
    if (!Number.isInteger(qty)) return 'Must be a whole number';
    if (qty > item.maxQuantity) return `Max: ${item.maxQuantity}`;
    return null;
  }, [receiveData]);

  const initReceiveData = () => {
    const data: Record<string, ReceiveItemData> = {};
    items.forEach((item) => {
      const remaining = Math.max(0, Number(item.quantity) - Number(item.receivedQuantity || 0));
      data[item.id] = {
        itemId: item.id,
        receivedQuantity: remaining,
        maxQuantity: remaining,
        batchNumber: '',
        expiryDate: '',
      };
    });
    setReceiveData(data);
    setIsReceiving(true);
  };

  const updateReceiveItem = (itemId: string, field: keyof ReceiveItemData, value: string | number) => {
    if (field === 'receivedQuantity') {
      const numValue = Math.floor(Number(value) || 0);
      const maxQty = receiveData[itemId]?.maxQuantity || 0;
      const clampedValue = Math.max(0, Math.min(numValue, maxQty));
      setReceiveData((prev) => ({
        ...prev,
        [itemId]: { ...prev[itemId], [field]: clampedValue },
      }));
    } else {
      setReceiveData((prev) => ({
        ...prev,
        [itemId]: { ...prev[itemId], [field]: value },
      }));
    }
  };

  const handleStatusChange = async (newStatus: 'sent' | 'confirmed' | 'cancelled') => {
    const statusLabels: Record<string, string> = {
      sent: 'send to supplier',
      confirmed: 'mark as confirmed',
      cancelled: 'cancel',
    };

    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${statusLabels[newStatus]} this order?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const result = await updatePurchaseOrderStatus(id!, newStatus);
            if (result.success) {
              Alert.alert('Success', 'Order status updated');
              refetch();
            } else {
              Alert.alert('Error', result.error || 'Failed to update status');
            }
          },
        },
      ]
    );
  };

  const handleReceiveItems = async () => {
    if (hasInvalidReceiveQuantity) {
      Alert.alert('Error', 'Please enter valid quantities (no negative numbers)');
      return;
    }

    const itemsToReceive = Object.values(receiveData)
      .filter((item) => {
        const qty = Number(item.receivedQuantity);
        return !isNaN(qty) && qty > 0;
      })
      .map((item) => ({
        itemId: item.itemId,
        receivedQuantity: Number(item.receivedQuantity),
        batchNumber: item.batchNumber || undefined,
        expiryDate: item.expiryDate || undefined,
      }));

    if (itemsToReceive.length === 0) {
      Alert.alert('Error', 'Please enter at least one item with a quantity greater than 0');
      return;
    }

    const result = await receiveItems(id!, {
      items: itemsToReceive,
      notes: receiveNotes || undefined,
    });

    if (result.success) {
      Alert.alert('Success', 'Items received successfully');
      setIsReceiving(false);
      refetch();
    } else {
      Alert.alert('Error', result.error || 'Failed to receive items');
    }
  };

  const formatPrice = (paisa: number) => `₹${(paisa / 100).toFixed(2)}`;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{order.orderNumber}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig?.bgColor }]}>
            <Text style={[styles.statusText, { color: statusConfig?.color }]}>
              {statusConfig?.label}
            </Text>
          </View>
          <Text style={styles.orderDate}>{order.orderDateFormatted}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supplier</Text>
          <View style={styles.infoCard}>
            <Text style={styles.vendorName}>{order.vendorName}</Text>
            {order.vendorEmail && <Text style={styles.vendorDetail}>{order.vendorEmail}</Text>}
            {order.vendorPhone && <Text style={styles.vendorDetail}>{order.vendorPhone}</Text>}
          </View>
        </View>

        {order.expectedDeliveryDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expected Delivery</Text>
            <Text style={styles.deliveryDate}>{order.expectedDeliveryFormatted}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isReceiving ? 'Receive Items' : `Order Items (${items.length})`}
          </Text>
          
          {items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemSku}>SKU: {item.productSku}</Text>
                </View>
                <View style={styles.itemQuantity}>
                  <Text style={styles.itemQtyValue}>{item.quantity}</Text>
                  <Text style={styles.itemQtyLabel}>ordered</Text>
                </View>
              </View>

              <View style={styles.itemPricing}>
                <Text style={styles.itemUnitPrice}>{item.unitCostFormatted} × {item.quantity}</Text>
                <Text style={styles.itemTotalPrice}>{item.totalCostFormatted}</Text>
              </View>

              {item.receivedQuantity && Number(item.receivedQuantity) > 0 && (
                <View style={styles.receivedInfo}>
                  <Text style={styles.receivedText}>
                    ✓ {item.receivedQuantity} received
                  </Text>
                </View>
              )}

              {isReceiving && (
                <View style={styles.receiveForm}>
                  <View style={styles.receiveField}>
                    <Text style={styles.receiveLabel}>Quantity to Receive</Text>
                    <TextInput
                      style={styles.receiveInput}
                      value={String(receiveData[item.id]?.receivedQuantity || '')}
                      onChangeText={(text) => updateReceiveItem(item.id, 'receivedQuantity', parseInt(text) || 0)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>
                  <View style={styles.receiveFieldsRow}>
                    <View style={styles.halfField}>
                      <Text style={styles.receiveLabel}>Batch #</Text>
                      <TextInput
                        style={styles.receiveInput}
                        value={receiveData[item.id]?.batchNumber || ''}
                        onChangeText={(text) => updateReceiveItem(item.id, 'batchNumber', text)}
                        placeholder="Optional"
                        placeholderTextColor={COLORS.textMuted}
                      />
                    </View>
                    <View style={styles.halfField}>
                      <Text style={styles.receiveLabel}>Expiry</Text>
                      <TextInput
                        style={styles.receiveInput}
                        value={receiveData[item.id]?.expiryDate || ''}
                        onChangeText={(text) => updateReceiveItem(item.id, 'expiryDate', text)}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={COLORS.textMuted}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          ))}

          {isReceiving && (
            <View style={styles.receiveNotesField}>
              <Text style={styles.receiveLabel}>Notes</Text>
              <TextInput
                style={[styles.receiveInput, styles.notesInput]}
                value={receiveNotes}
                onChangeText={setReceiveNotes}
                placeholder="Receiving notes..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>
          )}
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{order.subtotalFormatted}</Text>
          </View>
          <View style={styles.totalRowFinal}>
            <Text style={styles.totalLabelFinal}>Total</Text>
            <Text style={styles.totalValueFinal}>{order.totalFormatted}</Text>
          </View>
        </View>

        {order.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{order.notes}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        {isReceiving ? (
          <>
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={() => setIsReceiving(false)}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, (!hasValidReceiveQuantity || hasInvalidReceiveQuantity) && styles.primaryButtonDisabled]}
              onPress={handleReceiveItems}
              disabled={isSubmitting || !hasValidReceiveQuantity || hasInvalidReceiveQuantity}
            >
              <LinearGradient
                colors={(!hasValidReceiveQuantity || hasInvalidReceiveQuantity) ? [COLORS.cardBorder, COLORS.cardBorder] : [COLORS.green, COLORS.green]}
                style={styles.primaryButtonGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={[styles.primaryButtonText, (!hasValidReceiveQuantity || hasInvalidReceiveQuantity) && styles.primaryButtonTextDisabled]}>
                    Confirm Receipt
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {statusConfig?.actions.includes('cancel') && (
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={() => handleStatusChange('cancelled')}
              >
                <Text style={styles.dangerButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
            {statusConfig?.actions.includes('send') && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => handleStatusChange('sent')}
              >
                <LinearGradient colors={GRADIENTS.primary} style={styles.primaryButtonGradient}>
                  <Text style={styles.primaryButtonText}>Send to Supplier</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            {statusConfig?.actions.includes('confirm') && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => handleStatusChange('confirmed')}
              >
                <LinearGradient colors={GRADIENTS.primary} style={styles.primaryButtonGradient}>
                  <Text style={styles.primaryButtonText}>Mark Confirmed</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            {statusConfig?.actions.includes('receive') && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={initReceiveData}
              >
                <LinearGradient colors={[COLORS.green, COLORS.green]} style={styles.primaryButtonGradient}>
                  <Text style={styles.primaryButtonText}>Receive Items</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
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
  errorText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.lg,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SIZES.listPaddingBottom,
  },
  statusCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statusBadge: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  infoCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  vendorName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  vendorDetail: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  deliveryDate: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  itemCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  itemSku: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  itemQuantity: {
    alignItems: 'flex-end',
  },
  itemQtyValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  itemQtyLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  itemPricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  itemUnitPrice: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  itemTotalPrice: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  receivedInfo: {
    marginTop: SPACING.sm,
    backgroundColor: `${COLORS.green}20`,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  receivedText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.green,
    fontWeight: '600',
  },
  receiveForm: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.violet,
  },
  receiveField: {
    marginBottom: SPACING.md,
  },
  receiveFieldsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfField: {
    flex: 1,
  },
  receiveLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  receiveInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  receiveNotesField: {
    marginTop: SPACING.md,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  totalSection: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  totalLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  totalValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  totalLabelFinal: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  totalValueFinal: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.violet,
  },
  notesText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
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
  dangerButton: {
    flex: 1,
    backgroundColor: `${COLORS.red}20`,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.red,
  },
  primaryButton: {
    flex: 2,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
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
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonTextDisabled: {
    color: COLORS.textMuted,
  },
});
