import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
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
} from '../../constants/theme';
import {
  useInventoryProducts,
  useInventoryActions,
} from '@stylemate/core/hooks/useBusinessApi';
import type { InventoryProduct } from '@stylemate/core/services/businessApi';

interface StocktakeItem {
  productId: string;
  countedQuantity: number;
  notes: string;
  variance: number;
}

export default function Stocktake() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [stocktakeItems, setStocktakeItems] = useState<Record<string, StocktakeItem>>({});
  const [filterDifferences, setFilterDifferences] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { products, loading, refetch } = useInventoryProducts();
  const { submitStocktake, isSubmitting } = useInventoryActions();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query)
      );
    }

    if (filterDifferences) {
      filtered = filtered.filter(p => {
        const item = stocktakeItems[p.id];
        return item && item.variance !== 0;
      });
    }

    return filtered;
  }, [products, searchQuery, filterDifferences, stocktakeItems]);

  const updateCount = (productId: string, product: InventoryProduct, count: string) => {
    const countNum = parseFloat(count) || 0;
    const currentStock = Number(product.currentStock) || 0;
    const variance = countNum - currentStock;

    setStocktakeItems((prev) => ({
      ...prev,
      [productId]: {
        productId,
        countedQuantity: countNum,
        notes: prev[productId]?.notes || '',
        variance,
      },
    }));
  };

  const updateNotes = (productId: string, notes: string) => {
    setStocktakeItems((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        notes,
      },
    }));
  };

  const handleIncrement = (productId: string, product: InventoryProduct) => {
    const current = stocktakeItems[productId]?.countedQuantity ?? Number(product.currentStock);
    updateCount(productId, product, String(current + 1));
  };

  const handleDecrement = (productId: string, product: InventoryProduct) => {
    const current = stocktakeItems[productId]?.countedQuantity ?? Number(product.currentStock);
    if (current > 0) {
      updateCount(productId, product, String(current - 1));
    }
  };

  const countedItems = Object.values(stocktakeItems).filter(item => item.countedQuantity >= 0);
  const itemsWithVariance = countedItems.filter(item => item.variance !== 0);

  const handleSubmit = async () => {
    if (countedItems.length === 0) {
      Alert.alert('Error', 'Please count at least one product');
      return;
    }

    Alert.alert(
      'Submit Stocktake',
      `You have counted ${countedItems.length} products. ${itemsWithVariance.length} have variances that will be adjusted. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            const result = await submitStocktake({
              items: countedItems.map((item) => ({
                productId: item.productId,
                countedQuantity: item.countedQuantity,
                notes: item.notes || undefined,
              })),
              notes: `Stocktake completed on ${new Date().toISOString().split('T')[0]}`,
            });

            if (result.success) {
              Alert.alert('Success', `Stocktake completed. ${result.adjustments?.length || 0} adjustments made.`, [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } else {
              Alert.alert('Error', result.error || 'Failed to submit stocktake');
            }
          },
        },
      ]
    );
  };

  const renderProduct = ({ item }: { item: InventoryProduct }) => {
    const stocktakeItem = stocktakeItems[item.id];
    const currentStock = Number(item.currentStock) || 0;
    const countedQty = stocktakeItem?.countedQuantity ?? currentStock;
    const variance = stocktakeItem?.variance ?? 0;

    return (
      <View style={styles.productCard}>
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productSku}>SKU: {item.sku}</Text>
          </View>
          <View style={styles.systemStock}>
            <Text style={styles.systemStockLabel}>System</Text>
            <Text style={styles.systemStockValue}>{currentStock}</Text>
          </View>
        </View>

        <View style={styles.countRow}>
          <Text style={styles.countLabel}>Physical Count:</Text>
          <View style={styles.countControls}>
            <TouchableOpacity
              style={styles.countButton}
              onPress={() => handleDecrement(item.id, item)}
            >
              <Text style={styles.countButtonText}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.countInput}
              value={String(countedQty)}
              onChangeText={(text) => updateCount(item.id, item, text)}
              keyboardType="decimal-pad"
              textAlign="center"
            />
            <TouchableOpacity
              style={styles.countButton}
              onPress={() => handleIncrement(item.id, item)}
            >
              <Text style={styles.countButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {variance !== 0 && (
          <View style={[styles.varianceBadge, { backgroundColor: variance > 0 ? `${COLORS.green}20` : `${COLORS.red}20` }]}>
            <Text style={[styles.varianceText, { color: variance > 0 ? COLORS.green : COLORS.red }]}>
              {variance > 0 ? '+' : ''}{variance} {item.unit}
            </Text>
            <TextInput
              style={styles.varianceNotes}
              value={stocktakeItem?.notes || ''}
              onChangeText={(text) => updateNotes(item.id, text)}
              placeholder="Reason for variance..."
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        )}
      </View>
    );
  };

  if (loading && !refreshing) {
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stocktake</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{products.length}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{countedItems.length}</Text>
          <Text style={styles.statLabel}>Counted</Text>
        </View>
        <View style={[styles.statItem, itemsWithVariance.length > 0 && styles.statItemHighlight]}>
          <Text style={[styles.statValue, itemsWithVariance.length > 0 && { color: COLORS.amber }]}>
            {itemsWithVariance.length}
          </Text>
          <Text style={styles.statLabel}>Variances</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search products..."
          placeholderTextColor={COLORS.textMuted}
        />
        <TouchableOpacity
          style={[styles.filterButton, filterDifferences && styles.filterButtonActive]}
          onPress={() => setFilterDifferences(!filterDifferences)}
        >
          <Text style={[styles.filterButtonText, filterDifferences && styles.filterButtonTextActive]}>
            Variances Only
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.violet} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>
              {filterDifferences ? 'No products with variances' : 'Try a different search'}
            </Text>
          </View>
        }
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isSubmitting || countedItems.length === 0}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButtonGradient}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Submit Stocktake</Text>
                {itemsWithVariance.length > 0 && (
                  <Text style={styles.submitButtonSubtext}>
                    {itemsWithVariance.length} adjustments
                  </Text>
                )}
              </>
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
  statsBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  statItem: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statItemHighlight: {
    borderColor: COLORS.amber,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  filterButton: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  filterButtonActive: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  filterButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SIZES.listPaddingBottom,
  },
  productCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  productSku: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  systemStock: {
    alignItems: 'flex-end',
  },
  systemStockLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  systemStockValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  countControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  countButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  countButtonText: {
    fontSize: 24,
    color: COLORS.violet,
    fontWeight: '300',
  },
  countInput: {
    width: 80,
    height: 44,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: COLORS.violet,
  },
  varianceBadge: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  varianceText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  varianceNotes: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyIcon: {
    fontSize: SIZES.emojiLarge,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
  submitButtonSubtext: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});
