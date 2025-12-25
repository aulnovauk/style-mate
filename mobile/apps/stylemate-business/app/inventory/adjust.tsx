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
  useInventoryProduct,
  useStockMovements,
  useInventoryActions,
} from '@stylemate/core/hooks/useBusinessApi';
import type { StockMovement } from '@stylemate/core/services/businessApi';

type MovementType = 'receive' | 'usage' | 'adjustment' | 'transfer' | 'damage' | 'return' | 'expired';

const MOVEMENT_TYPES: { type: MovementType; label: string; icon: string; color: string; direction: 'in' | 'out' | 'set' }[] = [
  { type: 'receive', label: 'Receive Stock', icon: '📥', color: COLORS.green, direction: 'in' },
  { type: 'return', label: 'Return', icon: '↩️', color: COLORS.blue, direction: 'in' },
  { type: 'usage', label: 'Usage', icon: '✂️', color: COLORS.amber, direction: 'out' },
  { type: 'damage', label: 'Damaged', icon: '💔', color: COLORS.red, direction: 'out' },
  { type: 'expired', label: 'Expired', icon: '⏰', color: COLORS.red, direction: 'out' },
  { type: 'transfer', label: 'Transfer', icon: '🔄', color: COLORS.purple, direction: 'out' },
  { type: 'adjustment', label: 'Adjust', icon: '📊', color: COLORS.violet, direction: 'set' },
];

interface MovementCardProps {
  movement: StockMovement;
}

function MovementCard({ movement }: MovementCardProps) {
  const config = MOVEMENT_TYPES.find((t) => t.type === movement.type);
  const isIncrease = config?.direction === 'in' || (config?.direction === 'set' && Number(movement.newStock) > Number(movement.previousStock));
  
  return (
    <View style={styles.movementCard}>
      <View style={styles.movementIcon}>
        <Text style={styles.movementIconText}>{config?.icon || '📦'}</Text>
      </View>
      <View style={styles.movementInfo}>
        <Text style={styles.movementType}>{config?.label || movement.type}</Text>
        <Text style={styles.movementDate}>{movement.createdAtFormatted}</Text>
        {movement.reason && <Text style={styles.movementReason}>{movement.reason}</Text>}
      </View>
      <View style={styles.movementQuantity}>
        <Text style={[styles.movementQtyText, { color: isIncrease ? COLORS.green : COLORS.red }]}>
          {isIncrease ? '+' : '-'}{Math.abs(Number(movement.quantity))}
        </Text>
        <Text style={styles.movementStock}>
          {movement.previousStock} → {movement.newStock}
        </Text>
      </View>
    </View>
  );
}

export default function StockAdjustment() {
  const router = useRouter();
  const params = useLocalSearchParams<{ productId: string }>();
  
  const [selectedType, setSelectedType] = useState<MovementType>('receive');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [unitCost, setUnitCost] = useState('');

  const { product, movements: productMovements, loading: productLoading, refetch } = useInventoryProduct(params.productId);
  const { movements: recentMovements, loading: movementsLoading } = useStockMovements(params.productId);
  const { adjustStock, isSubmitting } = useInventoryActions();

  const selectedConfig = useMemo(() => 
    MOVEMENT_TYPES.find((t) => t.type === selectedType),
    [selectedType]
  );

  const currentStock = Number(product?.currentStock) || 0;
  const quantityNum = parseFloat(quantity) || 0;

  const calculateNewStock = (): number => {
    switch (selectedConfig?.direction) {
      case 'in':
        return currentStock + quantityNum;
      case 'out':
        return Math.max(0, currentStock - quantityNum);
      case 'set':
        return quantityNum;
      default:
        return currentStock;
    }
  };

  const newStock = calculateNewStock();

  const handleIncrement = () => {
    setQuantity(String((quantityNum || 0) + 1));
  };

  const handleDecrement = () => {
    if (quantityNum > 0) {
      setQuantity(String(quantityNum - 1));
    }
  };

  const handleSubmit = async () => {
    if (!quantity || quantityNum <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (selectedConfig?.direction === 'out' && quantityNum > currentStock) {
      Alert.alert('Error', 'Cannot remove more than current stock');
      return;
    }

    const result = await adjustStock({
      productId: params.productId!,
      type: selectedType,
      quantity: quantityNum,
      reason: reason.trim() || undefined,
      notes: notes.trim() || undefined,
      batchNumber: batchNumber.trim() || undefined,
      expiryDate: expiryDate.trim() || undefined,
      unitCostInPaisa: unitCost ? Math.round(parseFloat(unitCost) * 100) : undefined,
    });

    if (result.success) {
      Alert.alert('Success', 'Stock adjusted successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      refetch();
    } else {
      Alert.alert('Error', result.error || 'Failed to adjust stock');
    }
  };

  if (productLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Product not found</Text>
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
        <Text style={styles.headerTitle}>Adjust Stock</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productSku}>SKU: {product.sku}</Text>
          <View style={styles.currentStockBadge}>
            <Text style={styles.currentStockLabel}>Current Stock:</Text>
            <Text style={styles.currentStockValue}>
              {currentStock} {product.unit}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Movement Type</Text>
          <View style={styles.typeGrid}>
            {MOVEMENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.type}
                style={[
                  styles.typeButton,
                  selectedType === type.type && { borderColor: type.color, backgroundColor: `${type.color}15` },
                ]}
                onPress={() => setSelectedType(type.type)}
              >
                <Text style={styles.typeIcon}>{type.icon}</Text>
                <Text style={[styles.typeLabel, selectedType === type.type && { color: type.color }]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedConfig?.direction === 'set' ? 'New Stock Level' : 'Quantity'}
          </Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity style={styles.quantityButton} onPress={handleDecrement}>
              <Text style={styles.quantityButtonText}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.quantityInput}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="0"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="decimal-pad"
              textAlign="center"
            />
            <TouchableOpacity style={styles.quantityButton} onPress={handleIncrement}>
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.unitLabel}>{product.unit}</Text>
        </View>

        <View style={styles.stockPreview}>
          <View style={styles.stockPreviewRow}>
            <Text style={styles.stockPreviewLabel}>Current Stock</Text>
            <Text style={styles.stockPreviewValue}>{currentStock}</Text>
          </View>
          <View style={styles.stockPreviewArrow}>
            <Text style={styles.arrowText}>→</Text>
          </View>
          <View style={styles.stockPreviewRow}>
            <Text style={styles.stockPreviewLabel}>New Stock</Text>
            <Text style={[styles.stockPreviewValue, { color: newStock > currentStock ? COLORS.green : newStock < currentStock ? COLORS.red : COLORS.textPrimary }]}>
              {newStock}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Reason</Text>
            <TextInput
              style={styles.textInput}
              value={reason}
              onChangeText={setReason}
              placeholder="e.g., Supplier delivery, Service usage"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              style={[styles.textInput, styles.textInputMultiline]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>

          {(selectedType === 'receive' || selectedType === 'return') && (
            <>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Batch Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={batchNumber}
                  onChangeText={setBatchNumber}
                  placeholder="Optional batch number"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Expiry Date</Text>
                <TextInput
                  style={styles.textInput}
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Unit Cost (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  value={unitCost}
                  onChangeText={setUnitCost}
                  placeholder="Cost per unit"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Movements</Text>
          {movementsLoading ? (
            <ActivityIndicator color={COLORS.violet} />
          ) : recentMovements.length === 0 ? (
            <Text style={styles.emptyText}>No recent movements</Text>
          ) : (
            recentMovements.slice(0, 5).map((movement) => (
              <MovementCard key={movement.id} movement={movement} />
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isSubmitting || !quantity}
        >
          <LinearGradient
            colors={selectedConfig?.color ? [selectedConfig.color, selectedConfig.color] : GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButtonGradient}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                {selectedConfig?.direction === 'set' ? 'Set Stock' : selectedConfig?.direction === 'in' ? 'Add Stock' : 'Remove Stock'}
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
  productInfo: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  productName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  productSku: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  currentStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.violet}20`,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  currentStockLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  currentStockValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.violet,
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  typeButton: {
    width: '31%',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  typeLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  quantityButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  quantityButtonText: {
    fontSize: 28,
    color: COLORS.violet,
    fontWeight: '300',
  },
  quantityInput: {
    width: 120,
    height: 64,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  unitLabel: {
    textAlign: 'center',
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  stockPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  stockPreviewRow: {
    alignItems: 'center',
  },
  stockPreviewLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  stockPreviewValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  stockPreviewArrow: {
    paddingHorizontal: SPACING.md,
  },
  arrowText: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textMuted,
  },
  formField: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  textInput: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  textInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  movementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  movementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  movementIconText: {
    fontSize: 18,
  },
  movementInfo: {
    flex: 1,
  },
  movementType: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  movementDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  movementReason: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  movementQuantity: {
    alignItems: 'flex-end',
  },
  movementQtyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  movementStock: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  bottomBar: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  submitButton: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
});
