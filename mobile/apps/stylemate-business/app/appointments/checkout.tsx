import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useMemo, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { COLORS, GRADIENTS } from '../../constants/theme';
import { useCheckoutAppointment, useCheckout, CheckoutCartItem } from '@stylemate/core';

const { width } = Dimensions.get('window');

interface CartItem {
  id: string;
  type: 'service' | 'product' | 'package' | 'giftcard';
  name: string;
  price: number;
  quantity: number;
  duration?: number;
  staffName?: string;
  icon: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
  code?: string;
  reason?: string;
}

interface ClientInfo {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyPoints?: number;
  walletBalance?: number;
  hasCardOnFile?: boolean;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'cash', name: 'Cash', icon: '💵', enabled: true },
  { id: 'card', name: 'Card', icon: '💳', enabled: true },
  { id: 'upi', name: 'UPI', icon: '📱', enabled: true },
  { id: 'wallet', name: 'Wallet', icon: '👛', enabled: true },
  { id: 'saved_card', name: 'Saved Card', icon: '🔐', enabled: true },
  { id: 'split', name: 'Split Payment', icon: '➗', enabled: true },
];

const TIP_OPTIONS = [0, 5, 10, 15, 20];

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string | undefined;
  
  const { data: checkoutData, loading: loadingCheckout, error: checkoutError, refetch } = useCheckoutAppointment(bookingId);
  const { processPayment, isProcessing: isPaymentProcessing } = useCheckout();
  
  const [client, setClient] = useState<ClientInfo>({ name: '', phone: '' });
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const [tipPercentage, setTipPercentage] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualDiscountValue, setManualDiscountValue] = useState('');
  const [manualDiscountType, setManualDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountReason, setDiscountReason] = useState('');
  const [notes, setNotes] = useState('');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  
  useEffect(() => {
    if (checkoutData) {
      setClient({
        name: checkoutData.client?.name || 'Walk-in Customer',
        phone: checkoutData.client?.phone || '',
        email: checkoutData.client?.email,
        loyaltyPoints: 0,
        walletBalance: 0,
        hasCardOnFile: false,
      });
      
      const items: CartItem[] = (checkoutData.cartItems || []).map((item: CheckoutCartItem) => ({
        id: item.id,
        type: item.type as CartItem['type'],
        name: item.name,
        price: item.price / 100,
        quantity: item.quantity,
        duration: item.duration,
        staffName: item.staffName,
        icon: item.icon || '✂️',
      }));
      setCartItems(items);
    }
  }, [checkoutData]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    if (!discount) return 0;
    if (discount.type === 'percentage') {
      return Math.round(subtotal * (discount.value / 100));
    }
    return discount.value;
  }, [discount, subtotal]);

  const afterDiscount = subtotal - discountAmount;
  const gstRate = 18;
  const gstAmount = Math.round(afterDiscount * (gstRate / 100));
  const tipAmount = tipPercentage > 0 ? Math.round(afterDiscount * (tipPercentage / 100)) : parseInt(customTip) || 0;
  const grandTotal = afterDiscount + gstAmount + tipAmount;

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCartItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      Alert.alert('Error', 'Please enter a promo code');
      return;
    }
    if (promoCode.toUpperCase() === 'SAVE10') {
      setDiscount({ type: 'percentage', value: 10, code: promoCode.toUpperCase() });
      setShowPromoModal(false);
      setPromoCode('');
      Alert.alert('Success', '10% discount applied!');
    } else if (promoCode.toUpperCase() === 'FLAT200') {
      setDiscount({ type: 'fixed', value: 200, code: promoCode.toUpperCase() });
      setShowPromoModal(false);
      setPromoCode('');
      Alert.alert('Success', '₹200 discount applied!');
    } else {
      Alert.alert('Invalid Code', 'This promo code is not valid or has expired');
    }
  };

  const handleApplyManualDiscount = () => {
    const value = parseFloat(manualDiscountValue);
    if (isNaN(value) || value <= 0) {
      Alert.alert('Error', 'Please enter a valid discount amount');
      return;
    }
    if (manualDiscountType === 'percentage' && value > 100) {
      Alert.alert('Error', 'Percentage cannot exceed 100%');
      return;
    }
    setDiscount({ type: manualDiscountType, value, reason: discountReason });
    setShowDiscountModal(false);
    setManualDiscountValue('');
    setDiscountReason('');
  };

  const handleRemoveDiscount = () => {
    Alert.alert('Remove Discount', 'Are you sure you want to remove the discount?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setDiscount(null) },
    ]);
  };

  const handleProcessPayment = async () => {
    if (!bookingId) {
      Alert.alert('Error', 'No booking selected for checkout');
      return;
    }
    
    setIsProcessing(true);
    
    const checkoutParams = {
      bookingId,
      clientName: client.name,
      clientPhone: client.phone,
      items: cartItems.map(item => ({
        id: item.id,
        type: item.type as 'service' | 'product',
        name: item.name,
        price: Math.round(item.price * 100),
        quantity: item.quantity,
        duration: item.duration,
        staffName: item.staffName,
        icon: item.icon,
      })),
      paymentMethod: selectedPaymentMethod,
      tipAmount: tipAmount > 0 ? Math.round(tipAmount * 100) : undefined,
      discount: discount ? {
        type: discount.type,
        value: discount.type === 'percentage' ? discount.value : Math.round(discount.value * 100),
        code: discount.code,
        reason: discount.reason,
      } : undefined,
      notes: notes || undefined,
    };
    
    const result = await processPayment(checkoutParams);
    
    setIsProcessing(false);
    setShowPaymentModal(false);
    
    if (result.success) {
      setTransactionId(result.transaction?.id || null);
      setShowSuccessModal(true);
    } else {
      Alert.alert('Payment Failed', result.error || 'Unable to process payment. Please try again.');
    }
  };

  const handlePrintReceipt = () => {
    Alert.alert('Print Receipt', 'Sending to printer...');
  };

  const handleSendReceipt = () => {
    Alert.alert('Send Receipt', 'Receipt sent to ' + client.email);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
        <Text style={styles.headerIcon}>←</Text>
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Checkout</Text>
        <Text style={styles.headerSub}>{format(new Date(), 'EEE, MMM d • h:mm a')}</Text>
      </View>
      <TouchableOpacity style={styles.headerBtn} onPress={() => setShowProductModal(true)}>
        <Text style={styles.headerIcon}>➕</Text>
      </TouchableOpacity>
    </View>
  );

  const renderClientCard = () => (
    <View style={styles.clientCard}>
      <View style={styles.clientRow}>
        <View style={styles.clientAvatar}>
          <Text style={styles.clientAvatarText}>
            {client.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
          </Text>
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{client.name}</Text>
          <Text style={styles.clientPhone}>{client.phone}</Text>
        </View>
        <TouchableOpacity style={styles.clientChangeBtn}>
          <Text style={styles.clientChangeText}>Change</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.clientBadges}>
        <View style={[styles.clientBadge, { backgroundColor: COLORS.amber + '20' }]}>
          <Text style={[styles.clientBadgeText, { color: COLORS.amber }]}>⭐ {client.loyaltyPoints} pts</Text>
        </View>
        <View style={[styles.clientBadge, { backgroundColor: COLORS.green + '20' }]}>
          <Text style={[styles.clientBadgeText, { color: COLORS.green }]}>👛 ₹{client.walletBalance}</Text>
        </View>
        {client.hasCardOnFile && (
          <View style={[styles.clientBadge, { backgroundColor: COLORS.blue + '20' }]}>
            <Text style={[styles.clientBadgeText, { color: COLORS.blue }]}>💳 Card saved</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderCartItem = (item: CartItem) => (
    <View key={item.id} style={styles.cartItem}>
      <View style={styles.cartItemIcon}>
        <LinearGradient 
          colors={item.type === 'service' ? GRADIENTS.primary : GRADIENTS.info} 
          style={styles.cartItemIconBox}
        >
          <Text style={styles.cartItemEmoji}>{item.icon}</Text>
        </LinearGradient>
      </View>
      <View style={styles.cartItemDetails}>
        <Text style={styles.cartItemName}>{item.name}</Text>
        {item.staffName && <Text style={styles.cartItemStaff}>👤 {item.staffName}</Text>}
        {item.duration && <Text style={styles.cartItemMeta}>🕐 {item.duration} mins</Text>}
        <Text style={styles.cartItemPrice}>₹{item.price.toLocaleString()}</Text>
      </View>
      <View style={styles.cartItemQuantity}>
        <TouchableOpacity 
          style={styles.qtyBtn} 
          onPress={() => handleUpdateQuantity(item.id, -1)}
        >
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qtyValue}>{item.quantity}</Text>
        <TouchableOpacity 
          style={styles.qtyBtn} 
          onPress={() => handleUpdateQuantity(item.id, 1)}
        >
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.cartItemTotal}>₹{(item.price * item.quantity).toLocaleString()}</Text>
    </View>
  );

  const renderPriceBreakdown = () => (
    <View style={styles.priceSection}>
      <Text style={styles.sectionTitle}>Price Breakdown</Text>
      <View style={styles.priceCard}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Subtotal ({cartItems.length} items)</Text>
          <Text style={styles.priceValue}>₹{subtotal.toLocaleString()}</Text>
        </View>
        
        {discount && (
          <View style={styles.priceRow}>
            <View style={styles.discountRow}>
              <Text style={[styles.priceLabel, { color: COLORS.green }]}>
                Discount {discount.code ? `(${discount.code})` : discount.reason ? `(${discount.reason})` : ''}
              </Text>
              <TouchableOpacity onPress={handleRemoveDiscount}>
                <Text style={styles.removeDiscount}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.priceValue, { color: COLORS.green }]}>
              -{discount.type === 'percentage' ? `${discount.value}%` : ''} ₹{discountAmount.toLocaleString()}
            </Text>
          </View>
        )}
        
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>GST ({gstRate}%)</Text>
          <Text style={styles.priceValue}>₹{gstAmount.toLocaleString()}</Text>
        </View>
        
        {tipAmount > 0 && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tip</Text>
            <Text style={[styles.priceValue, { color: COLORS.amber }]}>₹{tipAmount.toLocaleString()}</Text>
          </View>
        )}
        
        <View style={styles.priceDivider} />
        
        <View style={styles.priceRow}>
          <Text style={styles.totalLabel}>Grand Total</Text>
          <Text style={styles.totalValue}>₹{grandTotal.toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );

  const renderDiscountSection = () => (
    <View style={styles.discountSection}>
      <View style={styles.discountRow}>
        <TouchableOpacity style={styles.discountBtn} onPress={() => setShowPromoModal(true)}>
          <Text style={styles.discountIcon}>🏷️</Text>
          <Text style={styles.discountBtnText}>Apply Promo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.discountBtn} onPress={() => setShowDiscountModal(true)}>
          <Text style={styles.discountIcon}>💰</Text>
          <Text style={styles.discountBtnText}>Manual Discount</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.discountBtn} onPress={() => setShowTipModal(true)}>
          <Text style={styles.discountIcon}>💝</Text>
          <Text style={styles.discountBtnText}>Add Tip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPaymentMethods = () => (
    <View style={styles.paymentSection}>
      <Text style={styles.sectionTitle}>Payment Method</Text>
      <View style={styles.paymentGrid}>
        {PAYMENT_METHODS.filter(p => p.enabled).map(method => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.paymentOption,
              selectedPaymentMethod === method.id && styles.paymentOptionSelected,
            ]}
            onPress={() => setSelectedPaymentMethod(method.id)}
          >
            <Text style={styles.paymentIcon}>{method.icon}</Text>
            <Text style={[
              styles.paymentName,
              selectedPaymentMethod === method.id && styles.paymentNameSelected,
            ]}>{method.name}</Text>
            {selectedPaymentMethod === method.id && (
              <View style={styles.paymentCheck}>
                <Text style={styles.paymentCheckText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderNotesSection = () => (
    <View style={styles.notesSection}>
      <Text style={styles.sectionTitle}>Notes (Optional)</Text>
      <TextInput
        style={styles.notesInput}
        placeholder="Add notes for this transaction..."
        placeholderTextColor={COLORS.textMuted}
        multiline
        numberOfLines={3}
        value={notes}
        onChangeText={setNotes}
      />
    </View>
  );

  const renderPromoModal = () => (
    <Modal visible={showPromoModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Apply Promo Code</Text>
          <View style={styles.promoInputRow}>
            <TextInput
              style={styles.promoInput}
              placeholder="Enter promo code"
              placeholderTextColor={COLORS.textMuted}
              value={promoCode}
              onChangeText={setPromoCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.promoApplyBtn} onPress={handleApplyPromo}>
              <LinearGradient colors={GRADIENTS.primary} style={styles.promoApplyGradient}>
                <Text style={styles.promoApplyText}>Apply</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <View style={styles.promoHints}>
            <Text style={styles.promoHintTitle}>Available Codes:</Text>
            <Text style={styles.promoHintText}>• SAVE10 - 10% off</Text>
            <Text style={styles.promoHintText}>• FLAT200 - ₹200 off</Text>
          </View>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowPromoModal(false)}>
            <Text style={styles.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderDiscountModal = () => (
    <Modal visible={showDiscountModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Manual Discount</Text>
          <View style={styles.discountTypeRow}>
            <TouchableOpacity
              style={[styles.discountTypeBtn, manualDiscountType === 'percentage' && styles.discountTypeBtnActive]}
              onPress={() => setManualDiscountType('percentage')}
            >
              <Text style={[styles.discountTypeText, manualDiscountType === 'percentage' && styles.discountTypeTextActive]}>
                Percentage %
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.discountTypeBtn, manualDiscountType === 'fixed' && styles.discountTypeBtnActive]}
              onPress={() => setManualDiscountType('fixed')}
            >
              <Text style={[styles.discountTypeText, manualDiscountType === 'fixed' && styles.discountTypeTextActive]}>
                Fixed Amount ₹
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.discountInput}
            placeholder={manualDiscountType === 'percentage' ? 'Enter percentage (e.g., 10)' : 'Enter amount (e.g., 200)'}
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
            value={manualDiscountValue}
            onChangeText={setManualDiscountValue}
          />
          <TextInput
            style={styles.discountInput}
            placeholder="Reason for discount (optional)"
            placeholderTextColor={COLORS.textMuted}
            value={discountReason}
            onChangeText={setDiscountReason}
          />
          <TouchableOpacity style={styles.applyDiscountBtn} onPress={handleApplyManualDiscount}>
            <LinearGradient colors={GRADIENTS.success} style={styles.applyDiscountGradient}>
              <Text style={styles.applyDiscountText}>Apply Discount</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowDiscountModal(false)}>
            <Text style={styles.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderTipModal = () => (
    <Modal visible={showTipModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Tip</Text>
          <View style={styles.tipGrid}>
            {TIP_OPTIONS.map(pct => (
              <TouchableOpacity
                key={pct}
                style={[styles.tipOption, tipPercentage === pct && styles.tipOptionSelected]}
                onPress={() => { setTipPercentage(pct); setCustomTip(''); }}
              >
                <Text style={[styles.tipPercent, tipPercentage === pct && styles.tipTextSelected]}>
                  {pct === 0 ? 'No Tip' : `${pct}%`}
                </Text>
                {pct > 0 && (
                  <Text style={[styles.tipAmount, tipPercentage === pct && styles.tipTextSelected]}>
                    ₹{Math.round(afterDiscount * (pct / 100))}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.customTipRow}>
            <Text style={styles.customTipLabel}>Custom Amount:</Text>
            <TextInput
              style={styles.customTipInput}
              placeholder="₹"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              value={customTip}
              onChangeText={(val) => { setCustomTip(val); setTipPercentage(0); }}
            />
          </View>
          <TouchableOpacity style={styles.tipDoneBtn} onPress={() => setShowTipModal(false)}>
            <LinearGradient colors={GRADIENTS.primary} style={styles.tipDoneGradient}>
              <Text style={styles.tipDoneText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderPaymentModal = () => (
    <Modal visible={showPaymentModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.paymentModalContent}>
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color={COLORS.violet} />
              <Text style={styles.processingText}>Processing Payment...</Text>
              <Text style={styles.processingSubtext}>Please wait while we process your transaction</Text>
            </View>
          ) : (
            <>
              <Text style={styles.modalTitle}>Confirm Payment</Text>
              <View style={styles.paymentSummary}>
                <Text style={styles.paymentMethodLabel}>
                  {PAYMENT_METHODS.find(p => p.id === selectedPaymentMethod)?.icon}{' '}
                  {PAYMENT_METHODS.find(p => p.id === selectedPaymentMethod)?.name}
                </Text>
                <Text style={styles.paymentAmountLarge}>₹{grandTotal.toLocaleString()}</Text>
              </View>
              <TouchableOpacity style={styles.confirmPaymentBtn} onPress={handleProcessPayment}>
                <LinearGradient colors={GRADIENTS.success} style={styles.confirmPaymentGradient}>
                  <Text style={styles.confirmPaymentText}>Confirm & Pay</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowPaymentModal(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderSuccessModal = () => (
    <Modal visible={showSuccessModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.successModalContent}>
          <LinearGradient colors={GRADIENTS.success} style={styles.successIconBox}>
            <Text style={styles.successIcon}>✓</Text>
          </LinearGradient>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successAmount}>₹{grandTotal.toLocaleString()}</Text>
          <Text style={styles.successSubtext}>
            Payment received from {client.name}
          </Text>
          <View style={styles.receiptActions}>
            <TouchableOpacity style={styles.receiptBtn} onPress={handlePrintReceipt}>
              <Text style={styles.receiptBtnIcon}>🖨️</Text>
              <Text style={styles.receiptBtnText}>Print</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.receiptBtn} onPress={handleSendReceipt}>
              <Text style={styles.receiptBtnIcon}>📧</Text>
              <Text style={styles.receiptBtnText}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.receiptBtn}>
              <Text style={styles.receiptBtnIcon}>💬</Text>
              <Text style={styles.receiptBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.successDoneBtn} 
            onPress={() => {
              setShowSuccessModal(false);
              router.replace('/(tabs)');
            }}
          >
            <LinearGradient colors={GRADIENTS.primary} style={styles.successDoneGradient}>
              <Text style={styles.successDoneText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.newSaleBtn}
            onPress={() => {
              setShowSuccessModal(false);
              setCartItems([]);
              setDiscount(null);
              setTipPercentage(0);
              setCustomTip('');
            }}
          >
            <Text style={styles.newSaleText}>Start New Sale</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderProductModal = () => (
    <Modal visible={showProductModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.productModalContent}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Add Items</Text>
          <View style={styles.addItemsGrid}>
            <TouchableOpacity style={styles.addItemCard}>
              <LinearGradient colors={GRADIENTS.primary} style={styles.addItemIcon}>
                <Text style={styles.addItemEmoji}>✂️</Text>
              </LinearGradient>
              <Text style={styles.addItemText}>Service</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addItemCard}>
              <LinearGradient colors={GRADIENTS.info} style={styles.addItemIcon}>
                <Text style={styles.addItemEmoji}>🧴</Text>
              </LinearGradient>
              <Text style={styles.addItemText}>Product</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addItemCard}>
              <LinearGradient colors={GRADIENTS.warning} style={styles.addItemIcon}>
                <Text style={styles.addItemEmoji}>📦</Text>
              </LinearGradient>
              <Text style={styles.addItemText}>Package</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addItemCard}>
              <LinearGradient colors={GRADIENTS.danger} style={styles.addItemIcon}>
                <Text style={styles.addItemEmoji}>🎁</Text>
              </LinearGradient>
              <Text style={styles.addItemText}>Gift Card</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowProductModal(false)}>
            <Text style={styles.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (!bookingId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>📋</Text>
          <Text style={styles.errorTitle}>No Booking Selected</Text>
          <Text style={styles.errorMessage}>Please select an appointment to proceed with checkout.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  if (loadingCheckout) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading checkout...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (checkoutError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Unable to Load Checkout</Text>
          <Text style={styles.errorMessage}>{checkoutError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <LinearGradient colors={GRADIENTS.primary} style={styles.retryGradient}>
              <Text style={styles.retryText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderClientCard()}
        
        <View style={styles.cartSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cart Items</Text>
            <TouchableOpacity onPress={() => setShowProductModal(true)}>
              <Text style={styles.addMoreText}>+ Add More</Text>
            </TouchableOpacity>
          </View>
          {cartItems.length === 0 ? (
            <View style={styles.emptyCart}>
              <Text style={styles.emptyCartIcon}>🛒</Text>
              <Text style={styles.emptyCartText}>No items in cart</Text>
              <Text style={styles.emptyCartSub}>Add services or products to continue</Text>
            </View>
          ) : (
            cartItems.map(item => renderCartItem(item))
          )}
        </View>
        
        {renderDiscountSection()}
        {renderPriceBreakdown()}
        {renderPaymentMethods()}
        {renderNotesSection()}
        
        <View style={{ height: 120 }} />
      </ScrollView>
      
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <Text style={styles.footerTotalValue}>₹{grandTotal.toLocaleString()}</Text>
        </View>
        <TouchableOpacity 
          style={styles.checkoutBtn}
          onPress={() => setShowPaymentModal(true)}
          disabled={cartItems.length === 0 || isProcessing || isPaymentProcessing}
        >
          <LinearGradient 
            colors={cartItems.length > 0 ? GRADIENTS.success : GRADIENTS.disabled} 
            style={styles.checkoutGradient}
          >
            <Text style={styles.checkoutText}>Complete Payment</Text>
            <Text style={styles.checkoutIcon}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      {renderPromoModal()}
      {renderDiscountModal()}
      {renderTipModal()}
      {renderPaymentModal()}
      {renderSuccessModal()}
      {renderProductModal()}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 18,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  clientCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.violet + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.violet,
  },
  clientInfo: {
    flex: 1,
    marginLeft: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  clientPhone: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  clientChangeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.cardBorder,
  },
  clientChangeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  clientBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  clientBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  clientBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cartSection: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  addMoreText: {
    fontSize: 14,
    color: COLORS.violet,
    fontWeight: '500',
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  cartItemIcon: {
    marginRight: 12,
  },
  cartItemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartItemEmoji: {
    fontSize: 18,
  },
  cartItemDetails: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  cartItemStaff: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cartItemMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  cartItemPrice: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cartItemQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginHorizontal: 12,
  },
  cartItemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    minWidth: 60,
    textAlign: 'right',
  },
  discountSection: {
    marginTop: 16,
  },
  discountRow: {
    flexDirection: 'row',
    gap: 8,
  },
  discountBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  discountIcon: {
    fontSize: 16,
  },
  discountBtnText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  priceSection: {
    marginTop: 20,
  },
  priceCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  removeDiscount: {
    fontSize: 12,
    color: COLORS.red,
    marginLeft: 8,
  },
  priceDivider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.green,
  },
  paymentSection: {
    marginTop: 20,
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  paymentOption: {
    width: (width - 48) / 3,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentOptionSelected: {
    borderColor: COLORS.violet,
    backgroundColor: COLORS.violet + '15',
  },
  paymentIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  paymentName: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  paymentNameSelected: {
    color: COLORS.violet,
    fontWeight: '600',
  },
  paymentCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentCheckText: {
    fontSize: 10,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  notesSection: {
    marginTop: 20,
  },
  notesInput: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    color: COLORS.textPrimary,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.cardBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 32,
  },
  footerTotal: {
    marginRight: 16,
  },
  footerTotalLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  footerTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  checkoutBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  checkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  checkoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  checkoutIcon: {
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 24,
    width: width - 48,
    maxWidth: 400,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  promoInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  promoInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  promoApplyBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  promoApplyGradient: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  promoApplyText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  promoHints: {
    marginTop: 16,
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  promoHintTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  promoHintText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  modalCloseBtn: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  discountTypeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  discountTypeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  discountTypeBtnActive: {
    backgroundColor: COLORS.violet + '30',
  },
  discountTypeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  discountTypeTextActive: {
    color: COLORS.violet,
    fontWeight: '600',
  },
  discountInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.textPrimary,
    fontSize: 16,
    marginBottom: 12,
  },
  applyDiscountBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  applyDiscountGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyDiscountText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  tipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  tipOption: {
    width: (width - 96) / 3,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tipOptionSelected: {
    borderColor: COLORS.amber,
    backgroundColor: COLORS.amber + '15',
  },
  tipPercent: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tipAmount: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  tipTextSelected: {
    color: COLORS.amber,
  },
  customTipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customTipLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  customTipInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  tipDoneBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
  },
  tipDoneGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  tipDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  paymentModalContent: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 24,
    width: width - 48,
    maxWidth: 400,
    alignItems: 'center',
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 20,
  },
  processingSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  paymentSummary: {
    alignItems: 'center',
    marginBottom: 24,
  },
  paymentMethodLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  paymentAmountLarge: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.green,
  },
  confirmPaymentBtn: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmPaymentGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmPaymentText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  successModalContent: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 32,
    width: width - 48,
    maxWidth: 400,
    alignItems: 'center',
  },
  successIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successIcon: {
    fontSize: 40,
    color: COLORS.textPrimary,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  successAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.green,
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 24,
  },
  receiptActions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  receiptBtn: {
    alignItems: 'center',
    padding: 12,
  },
  receiptBtnIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  receiptBtnText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  successDoneBtn: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  successDoneGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  successDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  newSaleBtn: {
    marginTop: 12,
    paddingVertical: 12,
  },
  newSaleText: {
    fontSize: 14,
    color: COLORS.violet,
  },
  productModalContent: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  addItemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  addItemCard: {
    width: (width - 80) / 2,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 20,
  },
  addItemIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  addItemEmoji: {
    fontSize: 28,
  },
  addItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryBtn: {
    marginBottom: 12,
  },
  retryGradient: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  backBtn: {
    paddingVertical: 12,
  },
  backBtnText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  emptyCart: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyCartIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyCartText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  emptyCartSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
