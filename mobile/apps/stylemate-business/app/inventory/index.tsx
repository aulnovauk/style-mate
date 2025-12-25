import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
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
  useInventoryStats,
  useInventoryProducts,
  useProductCategories,
  useVendors,
  usePurchaseOrders,
  useInventoryActions,
  useInventoryAnalytics,
} from '@stylemate/core/hooks/useBusinessApi';
import type { 
  InventoryProduct, 
  ProductCategory, 
  Vendor, 
  PurchaseOrder 
} from '@stylemate/core/services/businessApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ViewMode = 'overview' | 'products' | 'categories' | 'suppliers' | 'orders';
type StockFilter = 'all' | 'out' | 'low' | 'good';

const STOCK_STATUS_CONFIG: Record<string, { icon: string; label: string; color: string; bgColor: string }> = {
  out: { icon: '🔴', label: 'Out of Stock', color: COLORS.red, bgColor: `${COLORS.red}20` },
  low: { icon: '🟡', label: 'Low Stock', color: COLORS.amber, bgColor: `${COLORS.amber}20` },
  good: { icon: '🟢', label: 'In Stock', color: COLORS.green, bgColor: `${COLORS.green}20` },
  overstock: { icon: '🔵', label: 'Overstock', color: COLORS.blue, bgColor: `${COLORS.blue}20` },
};

const PO_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: COLORS.textSecondary, bgColor: `${COLORS.textSecondary}20` },
  sent: { label: 'Sent', color: COLORS.blue, bgColor: `${COLORS.blue}20` },
  confirmed: { label: 'Confirmed', color: COLORS.amber, bgColor: `${COLORS.amber}20` },
  received: { label: 'Received', color: COLORS.green, bgColor: `${COLORS.green}20` },
  cancelled: { label: 'Cancelled', color: COLORS.red, bgColor: `${COLORS.red}20` },
};

interface OverviewCard {
  id: string;
  label: string;
  value: string | number;
  icon: string;
  gradient: [string, string];
  change: number;
  changeType: 'up' | 'down' | 'neutral';
}

interface CriticalStockItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  currentStock: number;
  minLevel: number;
  maxLevel: number;
  status: 'critical' | 'low';
  icon: string;
}

interface TopSellingProduct {
  id: string;
  name: string;
  unitsSold: number;
  revenue: number;
}

interface StockChange {
  id: string;
  type: 'added' | 'used' | 'adjusted' | 'delivery';
  title: string;
  productName: string;
  quantity: number;
  by: string;
  timestamp: string;
}

interface CategoryFilter {
  id: string;
  name: string;
  count: number;
}

const formatCurrency = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount}`;
};

const formatFullCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

function OverviewCardComponent({ card }: { card: OverviewCard }) {
  return (
    <View style={styles.overviewCard}>
      <View style={styles.overviewCardHeader}>
        <LinearGradient colors={card.gradient} style={styles.overviewCardIcon}>
          <Text style={styles.overviewCardIconText}>{card.icon}</Text>
        </LinearGradient>
        <View style={[
          styles.changeBadge,
          { backgroundColor: card.changeType === 'up' ? `${COLORS.green}20` : card.changeType === 'down' ? `${COLORS.red}20` : `${COLORS.textMuted}20` }
        ]}>
          <Text style={[
            styles.changeText,
            { color: card.changeType === 'up' ? COLORS.green : card.changeType === 'down' ? COLORS.red : COLORS.textMuted }
          ]}>
            {card.changeType === 'up' ? '↑' : card.changeType === 'down' ? '↓' : '−'} {Math.abs(card.change)}%
          </Text>
        </View>
      </View>
      <Text style={styles.overviewCardValue}>{card.value}</Text>
      <Text style={styles.overviewCardLabel}>{card.label}</Text>
    </View>
  );
}

function QuickActionButton({ icon, label, gradient, onPress }: { icon: string; label: string; gradient?: [string, string]; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickActionButton} onPress={onPress} activeOpacity={0.7}>
      {gradient ? (
        <LinearGradient colors={gradient} style={styles.quickActionIcon}>
          <Text style={styles.quickActionIconText}>{icon}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.quickActionIconPlain}>
          <Text style={[styles.quickActionIconText, { color: COLORS.violet }]}>{icon}</Text>
        </View>
      )}
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function CriticalStockCard({ item, onViewDetails, onReorder }: { item: CriticalStockItem; onViewDetails: () => void; onReorder: () => void }) {
  const percentage = Math.round((item.currentStock / item.maxLevel) * 100);
  const isCritical = item.status === 'critical';
  const statusColor = isCritical ? COLORS.red : COLORS.amber;
  
  return (
    <View style={[styles.criticalStockCard, { borderLeftColor: statusColor }]}>
      <View style={styles.criticalStockHeader}>
        <View style={styles.criticalStockLeft}>
          <View style={styles.criticalStockIcon}>
            <Text style={styles.criticalStockIconText}>{item.icon}</Text>
          </View>
          <View style={styles.criticalStockInfo}>
            <Text style={styles.criticalStockName}>{item.name}</Text>
            <Text style={styles.criticalStockCategory}>Category: {item.category}</Text>
            <View style={styles.criticalStockBadges}>
              <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                  {isCritical ? 'Critical' : 'Low Stock'}
                </Text>
              </View>
              <Text style={styles.skuText}>SKU: {item.sku}</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.criticalStockDetails}>
        <View style={styles.stockLevelRow}>
          <Text style={styles.stockLevelLabel}>Current Stock</Text>
          <Text style={[styles.stockLevelValue, { color: statusColor }]}>{item.currentStock} units</Text>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: statusColor }]} />
          </View>
          <Text style={[styles.progressText, { color: statusColor }]}>{percentage}%</Text>
        </View>
        <View style={styles.minMaxRow}>
          <Text style={styles.minMaxText}>Min Level: {item.minLevel} units</Text>
          <Text style={styles.minMaxText}>Max Level: {item.maxLevel} units</Text>
        </View>
      </View>
      
      <View style={styles.criticalStockActions}>
        <TouchableOpacity style={styles.viewDetailsButton} onPress={onViewDetails}>
          <Text style={styles.viewDetailsButtonText}>👁️ View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onReorder}>
          <LinearGradient colors={GRADIENTS.primary} style={styles.reorderButton}>
            <Text style={styles.reorderButtonText}>🛒 Reorder Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TopSellingCard({ product, rank }: { product: TopSellingProduct; rank: number }) {
  return (
    <View style={styles.topSellingItem}>
      <View style={styles.topSellingLeft}>
        {rank === 1 ? (
          <LinearGradient colors={GRADIENTS.primary} style={styles.rankBadge}>
            <Text style={styles.rankText}>{rank}</Text>
          </LinearGradient>
        ) : (
          <View style={styles.rankBadgePlain}>
            <Text style={styles.rankTextPlain}>{rank}</Text>
          </View>
        )}
        <View>
          <Text style={styles.topSellingName}>{product.name}</Text>
          <Text style={styles.topSellingUnits}>{product.unitsSold} units sold</Text>
        </View>
      </View>
      <View style={styles.topSellingRight}>
        <Text style={styles.topSellingRevenue}>{formatFullCurrency(product.revenue)}</Text>
        <Text style={styles.topSellingRevenueLabel}>Revenue</Text>
      </View>
    </View>
  );
}

function StockChangeCard({ change }: { change: StockChange }) {
  const config = {
    added: { icon: '↑', color: COLORS.green, bg: `${COLORS.green}20` },
    used: { icon: '↓', color: COLORS.red, bg: `${COLORS.red}20` },
    adjusted: { icon: '↻', color: COLORS.amber, bg: `${COLORS.amber}20` },
    delivery: { icon: '🚚', color: COLORS.blue, bg: `${COLORS.blue}20` },
  };
  const { icon, color, bg } = config[change.type];
  
  return (
    <View style={styles.stockChangeCard}>
      <View style={styles.stockChangeLeft}>
        <View style={[styles.stockChangeIcon, { backgroundColor: bg }]}>
          <Text style={[styles.stockChangeIconText, { color }]}>{icon}</Text>
        </View>
        <View style={styles.stockChangeInfo}>
          <Text style={styles.stockChangeTitle}>{change.title}</Text>
          <Text style={styles.stockChangeProduct}>{change.productName}</Text>
          <View style={styles.stockChangeBadges}>
            <View style={[styles.quantityBadge, { backgroundColor: bg }]}>
              <Text style={[styles.quantityBadgeText, { color }]}>
                {change.type === 'used' ? '-' : '+'}{Math.abs(change.quantity)} units
              </Text>
            </View>
            <Text style={styles.stockChangeBy}>{change.by}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.stockChangeTime}>{change.timestamp}</Text>
    </View>
  );
}

function EnhancedProductCard({ 
  product, 
  onPress, 
  onEdit, 
  onAdjustStock 
}: { 
  product: InventoryProduct; 
  onPress: () => void; 
  onEdit: () => void; 
  onAdjustStock: () => void 
}) {
  const stockConfig = STOCK_STATUS_CONFIG[product.stockStatus] || STOCK_STATUS_CONFIG.good;
  const currentStock = Number(product.currentStock) || 0;
  const maxStock = Number(product.reorderLevel) * 2 || 100;
  const percentage = Math.min(Math.round((currentStock / maxStock) * 100), 100);
  
  return (
    <View style={styles.enhancedProductCard}>
      <TouchableOpacity style={styles.enhancedProductMain} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.enhancedProductImage}>
          <Text style={styles.enhancedProductImageIcon}>📦</Text>
        </View>
        <View style={styles.enhancedProductInfo}>
          <View style={styles.enhancedProductHeader}>
            <View style={styles.enhancedProductTitleRow}>
              <Text style={styles.enhancedProductName} numberOfLines={1}>{product.name}</Text>
              <TouchableOpacity 
                style={styles.moreOptionsButton}
                onPress={() => Alert.alert('Options', 'Edit, Delete, View History', [{ text: 'Close' }])}
              >
                <Text style={styles.moreOptionsText}>⋮</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.enhancedProductCategory}>{product.categoryName || 'Uncategorized'} • {product.unit}</Text>
          </View>
          
          <View style={styles.enhancedProductBadges}>
            <View style={[styles.statusBadge, { backgroundColor: stockConfig.bgColor }]}>
              <Text style={[styles.statusBadgeText, { color: stockConfig.color }]}>{stockConfig.label}</Text>
            </View>
            <Text style={styles.skuText}>SKU: {product.sku}</Text>
          </View>
          
          <View style={styles.enhancedProductStats}>
            <View>
              <Text style={styles.enhancedProductStatLabel}>Stock Level</Text>
              <Text style={styles.enhancedProductStatValue}>{currentStock} {product.unit}</Text>
            </View>
            <View style={styles.enhancedProductPriceColumn}>
              <Text style={styles.enhancedProductStatLabel}>Price</Text>
              <Text style={styles.enhancedProductPrice}>{product.sellingPriceFormatted || product.costPriceFormatted}</Text>
            </View>
          </View>
          
          <View style={styles.enhancedProductProgress}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: stockConfig.color }]} />
            </View>
            <Text style={[styles.progressText, { color: stockConfig.color }]}>{percentage}%</Text>
          </View>
        </View>
      </TouchableOpacity>
      
      <View style={styles.enhancedProductActions}>
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <Text style={styles.editButtonText}>✏️ Edit</Text>
        </TouchableOpacity>
        <View style={styles.actionDivider} />
        <TouchableOpacity style={styles.adjustStockButton} onPress={onAdjustStock}>
          <Text style={styles.adjustStockButtonText}>➕ Adjust Stock</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CategoryCard({ category, onPress }: { category: ProductCategory; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.categoryCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.categoryIcon}>
        <Text style={styles.categoryIconText}>📦</Text>
      </View>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{category.name}</Text>
        <Text style={styles.categoryCount}>{category.productCount} products</Text>
      </View>
      <View style={[styles.statusIndicator, { backgroundColor: category.isActive === 1 ? COLORS.green : COLORS.textMuted }]} />
    </TouchableOpacity>
  );
}

function VendorCard({ vendor, onPress }: { vendor: Vendor; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.vendorCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.vendorHeader}>
        <View style={styles.vendorAvatar}>
          <Text style={styles.vendorAvatarText}>{vendor.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName}>{vendor.name}</Text>
          {vendor.contactPerson && (
            <Text style={styles.vendorContact}>{vendor.contactPerson}</Text>
          )}
        </View>
        <View style={[styles.vendorStatus, { backgroundColor: vendor.status === 'active' ? `${COLORS.green}20` : `${COLORS.textMuted}20` }]}>
          <Text style={[styles.vendorStatusText, { color: vendor.status === 'active' ? COLORS.green : COLORS.textMuted }]}>
            {vendor.status}
          </Text>
        </View>
      </View>
      <View style={styles.vendorStats}>
        <View style={styles.vendorStat}>
          <Text style={styles.vendorStatValue}>{vendor.productCount || 0}</Text>
          <Text style={styles.vendorStatLabel}>Products</Text>
        </View>
        <View style={styles.vendorStat}>
          <Text style={styles.vendorStatValue}>{vendor.orderCount || 0}</Text>
          <Text style={styles.vendorStatLabel}>Orders</Text>
        </View>
        <View style={styles.vendorStat}>
          <Text style={styles.vendorStatValue}>{vendor.totalOrderedFormatted || '₹0'}</Text>
          <Text style={styles.vendorStatLabel}>Total</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function POCard({ order, onPress }: { order: PurchaseOrder; onPress: () => void }) {
  const statusConfig = PO_STATUS_CONFIG[order.status] || PO_STATUS_CONFIG.draft;

  return (
    <TouchableOpacity style={styles.poCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.poHeader}>
        <View>
          <Text style={styles.poNumber}>{order.orderNumber}</Text>
          <Text style={styles.poVendor}>{order.vendorName}</Text>
        </View>
        <View style={[styles.poStatus, { backgroundColor: statusConfig.bgColor }]}>
          <Text style={[styles.poStatusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
        </View>
      </View>
      <View style={styles.poFooter}>
        <Text style={styles.poDate}>{order.orderDateFormatted}</Text>
        <Text style={styles.poTotal}>{order.totalFormatted}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function InventoryDashboard() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewType, setViewType] = useState<'grid' | 'list'>('list');
  const [trendPeriod, setTrendPeriod] = useState<'week' | 'month'>('week');
  const [refreshing, setRefreshing] = useState(false);

  const { stats, loading: statsLoading, refetch: refetchStats } = useInventoryStats();
  const { products, loading: productsLoading, refetch: refetchProducts } = useInventoryProducts({
    search: searchQuery || undefined,
    stockStatus: stockFilter !== 'all' ? stockFilter : undefined,
  });
  const { categories, loading: categoriesLoading, refetch: refetchCategories } = useProductCategories();
  const { vendors, loading: vendorsLoading, refetch: refetchVendors } = useVendors();
  const { orders, loading: ordersLoading, refetch: refetchOrders } = usePurchaseOrders();
  const { deleteProduct } = useInventoryActions();
  const { analytics, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useInventoryAnalytics(trendPeriod);

  const overviewCards: OverviewCard[] = useMemo(() => [
    { id: '1', label: 'Total Products', value: stats?.totalProducts?.toString() || '0', icon: '📦', gradient: GRADIENTS.primary as [string, string], change: 8, changeType: 'up' },
    { id: '2', label: 'Stock Value', value: stats?.totalStockValueFormatted || '₹0', icon: '₹', gradient: ['#10B981', '#059669'] as [string, string], change: 12, changeType: 'up' },
    { id: '3', label: 'Low Stock Items', value: stats?.lowStockCount?.toString() || '0', icon: '⚠️', gradient: ['#EF4444', '#DC2626'] as [string, string], change: 3, changeType: 'down' },
    { id: '4', label: 'Pending Orders', value: stats?.pendingOrdersCount?.toString() || '0', icon: '⏳', gradient: ['#F59E0B', '#D97706'] as [string, string], change: 0, changeType: 'neutral' },
  ], [stats]);

  const criticalStockItems: CriticalStockItem[] = useMemo(() => {
    const lowStockProducts = products.filter(p => p.stockStatus === 'low' || p.stockStatus === 'out');
    return lowStockProducts.slice(0, 3).map(p => ({
      id: p.id,
      name: p.name,
      category: p.categoryName || 'Uncategorized',
      sku: p.sku,
      currentStock: Number(p.currentStock) || 0,
      minLevel: Number(p.reorderLevel) || 5,
      maxLevel: Number(p.reorderLevel) * 2 || 20,
      status: (p.stockStatus === 'out' ? 'critical' : 'low') as 'critical' | 'low',
      icon: '📦',
    }));
  }, [products]);

  const topSellingProducts: TopSellingProduct[] = useMemo(() => {
    if (!analytics?.topSellingProducts) return [];
    return analytics.topSellingProducts.map(p => ({
      id: p.id,
      name: p.name,
      unitsSold: p.unitsSold,
      revenue: p.revenue,
    }));
  }, [analytics]);

  const stockChanges: StockChange[] = useMemo(() => {
    if (!analytics?.recentChanges) return [];
    return analytics.recentChanges.map(c => ({
      id: c.id,
      type: c.type,
      title: c.title,
      productName: c.productName,
      quantity: c.quantity,
      by: c.by,
      timestamp: formatRelativeTime(c.timestamp),
    }));
  }, [analytics]);

  const trendSummary = useMemo(() => {
    return analytics?.trendSummary || { stockIn: 0, stockOut: 0, turnoverRate: 0 };
  }, [analytics]);

  const stockTrends = useMemo(() => {
    return analytics?.stockTrends || [];
  }, [analytics]);

  const categoryFilters: CategoryFilter[] = useMemo(() => {
    const allCount = products.length;
    const catFilters: CategoryFilter[] = [
      { id: 'all', name: 'All Products', count: allCount },
    ];
    categories.forEach(cat => {
      catFilters.push({
        id: cat.id,
        name: cat.name,
        count: cat.productCount || 0,
      });
    });
    return catFilters;
  }, [products, categories]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchStats(),
      refetchProducts(),
      refetchCategories(),
      refetchVendors(),
      refetchOrders(),
      refetchAnalytics(),
    ]);
    setRefreshing(false);
  }, [refetchStats, refetchProducts, refetchCategories, refetchVendors, refetchOrders, refetchAnalytics]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const refetchAll = async () => {
        if (!isActive) return;
        await Promise.all([
          refetchStats(),
          refetchProducts(),
          refetchCategories(),
          refetchVendors(),
          refetchOrders(),
          refetchAnalytics(),
        ]);
      };
      refetchAll();
      return () => {
        isActive = false;
      };
    }, [refetchStats, refetchProducts, refetchCategories, refetchVendors, refetchOrders, refetchAnalytics])
  );

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      (p.brand && p.brand.toLowerCase().includes(query))
    );
  }, [products, searchQuery]);

  const handleProductPress = (product: InventoryProduct) => {
    router.push(`/inventory/add-edit?id=${product.id}`);
  };

  const handleAdjustStock = (product: InventoryProduct) => {
    router.push(`/inventory/adjust?productId=${product.id}`);
  };

  const handleVendorPress = (vendor: Vendor) => {
    router.push(`/inventory/suppliers/add-edit?id=${vendor.id}`);
  };

  const handlePOPress = (order: PurchaseOrder) => {
    router.push(`/inventory/purchase-orders/${order.id}`);
  };

  const handleAddProduct = () => {
    router.push('/inventory/add-edit');
  };

  const handleScanBarcode = () => {
    Alert.alert('Scan Barcode', 'Barcode scanner will open');
  };

  const handleBulkUpdate = () => {
    Alert.alert('Bulk Update', 'Select multiple products to update');
  };

  const handleReorder = () => {
    router.push('/inventory/purchase-orders/create');
  };

  const handleStocktake = () => {
    router.push('/inventory/stocktake');
  };

  const handleExport = () => {
    Alert.alert('Export', 'Export inventory data as CSV or Excel', [
      { text: 'CSV', onPress: () => {} },
      { text: 'Excel', onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Product Inventory</Text>
          <Text style={styles.headerSubtitle}>Stock Management</Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.notificationButton}>
          <Text style={styles.notificationIcon}>🔔</Text>
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.avatarButton}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
      </View>
    </View>
  );

  const renderSearch = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products, categories..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => Alert.alert('Filters', 'Apply advanced filters')}
        >
          <Text style={styles.filterIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOverviewCards = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Inventory Overview</Text>
        <TouchableOpacity onPress={handleExport}>
          <Text style={styles.exportButton}>Export 📥</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.overviewGrid}>
        {overviewCards.map((card) => (
          <OverviewCardComponent key={card.id} card={card} />
        ))}
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <QuickActionButton icon="➕" label="Add Product" gradient={GRADIENTS.primary as [string, string]} onPress={handleAddProduct} />
        <QuickActionButton icon="📱" label="Scan Code" onPress={handleScanBarcode} />
        <QuickActionButton icon="📋" label="Bulk Update" onPress={handleBulkUpdate} />
        <QuickActionButton icon="🔄" label="Reorder" onPress={handleReorder} />
      </View>
    </View>
  );

  const renderCriticalAlerts = () => {
    const lowStockCount = stats?.lowStockCount || 0;
    const remainingCount = Math.max(0, lowStockCount - criticalStockItems.length);
    
    if (productsLoading) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Critical Stock Alerts</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={COLORS.violet} />
            <Text style={styles.loadingText}>Loading stock alerts...</Text>
          </View>
        </View>
      );
    }
    
    if (criticalStockItems.length === 0) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Critical Stock Alerts</Text>
            <View style={[styles.alertCountBadge, { backgroundColor: `${COLORS.green}20` }]}>
              <Text style={[styles.alertCountText, { color: COLORS.green }]}>All Good</Text>
            </View>
          </View>
          <View style={styles.emptyAlertCard}>
            <Text style={styles.emptyAlertIcon}>✅</Text>
            <Text style={styles.emptyAlertTitle}>No Critical Stock Alerts</Text>
            <Text style={styles.emptyAlertSubtitle}>All products are well-stocked</Text>
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Critical Stock Alerts</Text>
          <View style={styles.alertCountBadge}>
            <Text style={styles.alertCountText}>{lowStockCount} Items</Text>
          </View>
        </View>
        {criticalStockItems.map((item) => (
          <CriticalStockCard
            key={item.id}
            item={item}
            onViewDetails={() => router.push(`/inventory/add-edit?id=${item.id}`)}
            onReorder={() => router.push('/inventory/purchase-orders/create')}
          />
        ))}
        {remainingCount > 0 && (
          <TouchableOpacity style={styles.viewAllButton} onPress={() => setViewMode('products')}>
            <Text style={styles.viewAllButtonText}>View All Low Stock Items ({remainingCount} more) →</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderCategoryFilters = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Browse by Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryFiltersContainer}>
        {categoryFilters.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryFilterPill, selectedCategory === cat.id && styles.categoryFilterPillActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            {selectedCategory === cat.id ? (
              <LinearGradient colors={GRADIENTS.primary} style={styles.categoryFilterPillGradient}>
                <Text style={styles.categoryFilterTextActive}>{cat.name}</Text>
              </LinearGradient>
            ) : (
              <Text style={styles.categoryFilterText}>{cat.name}</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderStockTrends = () => {
    // Calculate max value for chart scaling
    const maxValue = stockTrends.length > 0 
      ? Math.max(...stockTrends.map(t => Math.max(t.inbound, t.outbound)), 1)
      : 100;
    
    if (analyticsLoading) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Stock Movement Trends</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={COLORS.violet} />
            <Text style={styles.loadingText}>Loading trends...</Text>
          </View>
        </View>
      );
    }

    if (analyticsError) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Stock Movement Trends</Text>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load trends</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refetchAnalytics}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Stock Movement Trends</Text>
        <View style={styles.periodToggle}>
          <TouchableOpacity
            style={[styles.periodButton, trendPeriod === 'week' && styles.periodButtonActive]}
            onPress={() => setTrendPeriod('week')}
          >
            <Text style={[styles.periodButtonText, trendPeriod === 'week' && styles.periodButtonTextActive]}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, trendPeriod === 'month' && styles.periodButtonActive]}
            onPress={() => setTrendPeriod('month')}
          >
            <Text style={[styles.periodButtonText, trendPeriod === 'month' && styles.periodButtonTextActive]}>Month</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.trendChart}>
        {stockTrends.length > 0 ? (
          <View style={styles.chartBars}>
            {stockTrends.map((trend, index) => {
              const totalActivity = trend.inbound + trend.outbound;
              const height = maxValue > 0 ? Math.max((totalActivity / maxValue) * 100, 5) : 5;
              return (
                <View key={index} style={styles.chartBarContainer}>
                  <LinearGradient colors={GRADIENTS.primary} style={[styles.chartBar, { height: `${height}%` }]} />
                  <Text style={styles.chartBarLabel}>{trend.day.charAt(0)}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyChartContainer}>
            <Text style={styles.emptyChartText}>No stock movements recorded this {trendPeriod}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.trendSummary}>
        <View style={styles.trendCard}>
          <View style={[styles.trendIcon, { backgroundColor: `${COLORS.green}20` }]}>
            <Text style={styles.trendIconText}>↑</Text>
          </View>
          <Text style={[styles.trendValue, { color: COLORS.green }]}>+{trendSummary.stockIn}</Text>
          <Text style={styles.trendLabel}>Stock In</Text>
        </View>
        <View style={styles.trendCard}>
          <View style={[styles.trendIcon, { backgroundColor: `${COLORS.red}20` }]}>
            <Text style={styles.trendIconText}>↓</Text>
          </View>
          <Text style={[styles.trendValue, { color: COLORS.red }]}>-{trendSummary.stockOut}</Text>
          <Text style={styles.trendLabel}>Stock Out</Text>
        </View>
        <View style={styles.trendCard}>
          <View style={[styles.trendIcon, { backgroundColor: `${COLORS.violet}20` }]}>
            <Text style={styles.trendIconText}>🔄</Text>
          </View>
          <Text style={[styles.trendValue, { color: COLORS.violet }]}>{trendSummary.turnoverRate}x</Text>
          <Text style={styles.trendLabel}>Turnover</Text>
        </View>
      </View>
    </View>
  );
  };

  const renderTopSelling = () => {
    if (analyticsLoading) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Selling Products</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={COLORS.violet} />
            <Text style={styles.loadingText}>Loading top sellers...</Text>
          </View>
        </View>
      );
    }

    if (analyticsError) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Selling Products</Text>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load top sellers</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refetchAnalytics}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (topSellingProducts.length === 0) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Selling Products</Text>
          </View>
          <View style={styles.emptyAlertCard}>
            <Text style={styles.emptyAlertIcon}>📊</Text>
            <Text style={styles.emptyAlertTitle}>No Sales Data</Text>
            <Text style={styles.emptyAlertSubtitle}>Start recording stock usage to see top sellers</Text>
          </View>
        </View>
      );
    }

    return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Top Selling Products</Text>
        <TouchableOpacity>
          <Text style={styles.viewReportText}>View Report</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.topSellingCard}>
        {topSellingProducts.map((product, index) => (
          <View key={product.id}>
            <TopSellingCard product={product} rank={index + 1} />
            {index < topSellingProducts.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>
    </View>
  );
  };

  const renderRecentChanges = () => {
    if (analyticsLoading) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Stock Changes</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={COLORS.violet} />
            <Text style={styles.loadingText}>Loading changes...</Text>
          </View>
        </View>
      );
    }

    if (analyticsError) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Stock Changes</Text>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load changes</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refetchAnalytics}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (stockChanges.length === 0) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Stock Changes</Text>
          </View>
          <View style={styles.emptyAlertCard}>
            <Text style={styles.emptyAlertIcon}>📝</Text>
            <Text style={styles.emptyAlertTitle}>No Recent Activity</Text>
            <Text style={styles.emptyAlertSubtitle}>Stock movements will appear here</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Stock Changes</Text>
          <TouchableOpacity>
            <Text style={styles.viewReportText}>View History</Text>
          </TouchableOpacity>
        </View>
        {stockChanges.map((change) => (
          <StockChangeCard key={change.id} change={change} />
        ))}
      </View>
    );
  };

  const renderAllProducts = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All Products</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewToggleButton, viewType === 'grid' && styles.viewToggleButtonActive]}
            onPress={() => setViewType('grid')}
          >
            <Text style={styles.viewToggleIcon}>⊞</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleButton, viewType === 'list' && styles.viewToggleButtonActive]}
            onPress={() => setViewType('list')}
          >
            <Text style={styles.viewToggleIcon}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {productsLoading ? (
        <ActivityIndicator color={COLORS.violet} style={{ marginVertical: SPACING.xl }} />
      ) : (
        filteredProducts.slice(0, 6).map((product) => (
          <EnhancedProductCard
            key={product.id}
            product={product}
            onPress={() => handleProductPress(product)}
            onEdit={() => handleProductPress(product)}
            onAdjustStock={() => handleAdjustStock(product)}
          />
        ))
      )}
      
      {filteredProducts.length > 6 && (
        <TouchableOpacity style={styles.loadMoreButton} onPress={() => setViewMode('products')}>
          <Text style={styles.loadMoreText}>Load More Products ({filteredProducts.length - 6} remaining) ↓</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderOverviewContent = () => (
    <ScrollView
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.violet} />
      }
    >
      {renderOverviewCards()}
      {renderQuickActions()}
      {renderCriticalAlerts()}
      {renderCategoryFilters()}
      {renderStockTrends()}
      {renderAllProducts()}
      {renderTopSelling()}
      {renderRecentChanges()}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderProductsContent = () => (
    <>
      <View style={styles.filterChipsContainer}>
        {(['all', 'out', 'low', 'good'] as StockFilter[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, stockFilter === filter && styles.activeFilterChip]}
            onPress={() => setStockFilter(filter)}
          >
            <Text style={[styles.filterChipText, stockFilter === filter && styles.activeFilterChipText]}>
              {filter === 'all' ? 'All' : STOCK_STATUS_CONFIG[filter]?.label || filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EnhancedProductCard
            product={item}
            onPress={() => handleProductPress(item)}
            onEdit={() => handleProductPress(item)}
            onAdjustStock={() => handleAdjustStock(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.violet} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>Add your first product to get started</Text>
          </View>
        }
      />
    </>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {(['overview', 'products', 'categories', 'suppliers', 'orders'] as ViewMode[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, viewMode === tab && styles.activeTab]}
          onPress={() => setViewMode(tab)}
        >
          <Text style={[styles.tabText, viewMode === tab && styles.activeTabText]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContent = () => {
    switch (viewMode) {
      case 'overview':
        return renderOverviewContent();
      case 'products':
        return renderProductsContent();
      case 'categories':
        return (
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CategoryCard category={item} onPress={() => {}} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📁</Text>
                <Text style={styles.emptyTitle}>No categories</Text>
                <Text style={styles.emptySubtitle}>Create categories to organize your products</Text>
              </View>
            }
          />
        );
      case 'suppliers':
        return (
          <FlatList
            data={vendors}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <VendorCard vendor={item} onPress={() => handleVendorPress(item)} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏢</Text>
                <Text style={styles.emptyTitle}>No suppliers</Text>
                <Text style={styles.emptySubtitle}>Add suppliers to manage your orders</Text>
              </View>
            }
          />
        );
      case 'orders':
        return (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <POCard order={item} onPress={() => handlePOPress(item)} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>No purchase orders</Text>
                <Text style={styles.emptySubtitle}>Create orders to restock your inventory</Text>
              </View>
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      {renderSearch()}
      {renderTabs()}
      <View style={styles.content}>
        {renderContent()}
      </View>
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButtonGradient}
          >
            <Text style={styles.addButtonIcon}>+</Text>
            <Text style={styles.addButtonText}>Add Product</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
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
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationIcon: {
    fontSize: 24,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    fontWeight: '600',
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
  },
  avatarText: {
    fontSize: 20,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: SPACING.md,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
  },
  filterButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  tab: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBg,
  },
  activeTab: {
    backgroundColor: COLORS.violet,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.white,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  exportButton: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.violet,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  overviewCard: {
    width: (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.sm) / 2,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  overviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  overviewCardIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewCardIconText: {
    fontSize: 18,
  },
  changeBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  changeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  overviewCardValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  overviewCardLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  quickActionIconPlain: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  quickActionIconText: {
    fontSize: 20,
    color: COLORS.white,
  },
  quickActionLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  alertCountBadge: {
    backgroundColor: `${COLORS.red}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  alertCountText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.red,
    fontWeight: '500',
  },
  criticalStockCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderLeftWidth: 4,
  },
  criticalStockHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  criticalStockLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  criticalStockIcon: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  criticalStockIconText: {
    fontSize: 24,
  },
  criticalStockInfo: {
    flex: 1,
  },
  criticalStockName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  criticalStockCategory: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  criticalStockBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  statusBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  skuText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  criticalStockDetails: {
    marginBottom: SPACING.md,
  },
  stockLevelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  stockLevelLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  stockLevelValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  progressText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    minWidth: 36,
    textAlign: 'right',
  },
  minMaxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  minMaxText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  criticalStockActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  viewDetailsButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  reorderButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  reorderButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: '500',
  },
  viewAllButton: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  viewAllButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.violet,
    fontWeight: '500',
  },
  categoryFiltersContainer: {
    gap: SPACING.sm,
    paddingRight: SPACING.lg,
  },
  categoryFilterPill: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  categoryFilterPillActive: {
    borderColor: COLORS.violet,
  },
  categoryFilterPillGradient: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  categoryFilterText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  categoryFilterTextActive: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: '500',
  },
  periodToggle: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  periodButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
  },
  periodButtonActive: {
    backgroundColor: COLORS.violet,
  },
  periodButtonText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  periodButtonTextActive: {
    color: COLORS.white,
  },
  trendChart: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 24,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  chartBarLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  emptyChartContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyChartText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  errorContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.sm,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.red,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.violet,
    borderRadius: BORDER_RADIUS.sm,
  },
  retryButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    fontWeight: '600',
  },
  trendSummary: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  trendCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  trendIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  trendIconText: {
    fontSize: 18,
  },
  trendValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  trendLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  viewReportText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.violet,
  },
  topSellingCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  topSellingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  topSellingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgePlain: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  rankTextPlain: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  topSellingName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  topSellingUnits: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  topSellingRight: {
    alignItems: 'flex-end',
  },
  topSellingRevenue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.green,
  },
  topSellingRevenueLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SPACING.sm,
  },
  stockChangeCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  stockChangeLeft: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  stockChangeIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockChangeIconText: {
    fontSize: 18,
  },
  stockChangeInfo: {
    flex: 1,
  },
  stockChangeTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  stockChangeProduct: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  stockChangeBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  quantityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  quantityBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  stockChangeBy: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  stockChangeTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  viewToggleButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleButtonActive: {
    backgroundColor: COLORS.surface,
  },
  viewToggleIcon: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  enhancedProductCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  enhancedProductMain: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  enhancedProductImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enhancedProductImageIcon: {
    fontSize: 32,
  },
  enhancedProductInfo: {
    flex: 1,
  },
  enhancedProductHeader: {
    marginBottom: SPACING.sm,
  },
  enhancedProductTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  enhancedProductName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  moreOptionsButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreOptionsText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  enhancedProductCategory: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  enhancedProductBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  enhancedProductStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  enhancedProductStatLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  enhancedProductStatValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  enhancedProductPriceColumn: {
    alignItems: 'flex-end',
  },
  enhancedProductPrice: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.violet,
  },
  enhancedProductProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  enhancedProductActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  editButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  actionDivider: {
    width: 1,
    backgroundColor: COLORS.cardBorder,
  },
  adjustStockButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  adjustStockButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.violet,
    fontWeight: '500',
  },
  loadMoreButton: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  loadMoreText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.violet,
    fontWeight: '500',
  },
  filterChipsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  filterChip: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  activeFilterChip: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  filterChipText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  activeFilterChipText: {
    color: COLORS.white,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SIZES.listPaddingBottom,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  categoryIconText: {
    fontSize: 24,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  categoryCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  vendorCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  vendorAvatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.violet,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  vendorAvatarText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  vendorContact: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  vendorStatus: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  vendorStatusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  vendorStats: {
    flexDirection: 'row',
  },
  vendorStat: {
    flex: 1,
    alignItems: 'center',
  },
  vendorStatValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  vendorStatLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  poCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  poHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  poNumber: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  poVendor: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  poStatus: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  poStatusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  poFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  poDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  poTotal: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.violet,
  },
  bottomBar: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    backgroundColor: COLORS.background,
  },
  addButton: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  addButtonIcon: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
    fontWeight: '600',
  },
  addButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  emptyAlertCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyAlertIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyAlertTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  emptyAlertSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
});
