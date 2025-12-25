import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from '../../constants/theme';
import { useSettings } from '@stylemate/core/hooks/useBusinessApi';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'upi' | 'wallet' | 'cash' | 'bank';
  icon: string;
  enabled: boolean;
  description: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'razorpay',
    name: 'Razorpay',
    type: 'card',
    icon: '💳',
    enabled: true,
    description: 'Cards, UPI, NetBanking, Wallets',
  },
  {
    id: 'upi',
    name: 'UPI Direct',
    type: 'upi',
    icon: '📱',
    enabled: true,
    description: 'Google Pay, PhonePe, Paytm',
  },
  {
    id: 'cash',
    name: 'Cash on Visit',
    type: 'cash',
    icon: '💵',
    enabled: true,
    description: 'Accept cash payments at salon',
  },
  {
    id: 'wallet',
    name: 'Stylemate Wallet',
    type: 'wallet',
    icon: '👛',
    enabled: false,
    description: 'Customer credits and memberships',
  },
];

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { data: settings, isLoading } = useSettings();
  const [methods, setMethods] = useState<PaymentMethod[]>(PAYMENT_METHODS);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleMethod = (id: string) => {
    setMethods(prev => prev.map(m => 
      m.id === id ? { ...m, enabled: !m.enabled } : m
    ));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setHasChanges(false);
    setSaving(false);
    Alert.alert(
      'Coming Soon', 
      'Payment method preferences will be saved when backend integration is complete. Changes are currently preview-only.'
    );
  };

  const openRazorpayDashboard = () => {
    Linking.openURL('https://dashboard.razorpay.com');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading payment settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = settings?.isOwner ?? false;

  if (!isOwner) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Methods</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.restrictedContainer}>
          <Text style={styles.restrictedIcon}>🔒</Text>
          <Text style={styles.restrictedTitle}>Owner Access Only</Text>
          <Text style={styles.restrictedSubtitle}>
            Only salon owners can manage payment settings. Contact your salon owner for changes.
          </Text>
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
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <TouchableOpacity 
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={[styles.saveButtonText, !hasChanges && styles.saveButtonTextDisabled]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Connected</Text>
            </View>
            <TouchableOpacity onPress={openRazorpayDashboard}>
              <Text style={styles.dashboardLink}>Open Dashboard →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusIcon}>💳</Text>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>Razorpay Integration</Text>
              <Text style={styles.statusSubtitle}>
                Your payment gateway is active and accepting payments
              </Text>
            </View>
          </View>
          <View style={styles.statusStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₹12,450</Text>
              <Text style={styles.statLabel}>Today's Collection</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>23</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₹45,230</Text>
              <Text style={styles.statLabel}>Pending Payout</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Accepted Payment Methods</Text>
          <Text style={styles.sectionSubtitle}>
            Choose which payment methods customers can use
          </Text>

          {methods.map((method, index) => (
            <View key={method.id}>
              {index > 0 && <View style={styles.divider} />}
              <View style={styles.methodRow}>
                <View style={styles.methodInfo}>
                  <View style={styles.methodIconContainer}>
                    <Text style={styles.methodIcon}>{method.icon}</Text>
                  </View>
                  <View style={styles.methodContent}>
                    <Text style={styles.methodName}>{method.name}</Text>
                    <Text style={styles.methodDescription}>{method.description}</Text>
                  </View>
                </View>
                <Switch
                  value={method.enabled}
                  onValueChange={() => toggleMethod(method.id)}
                  trackColor={{ false: COLORS.cardBorder, true: COLORS.success }}
                  thumbColor={COLORS.white}
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Payout Settings</Text>

          <View style={styles.payoutRow}>
            <Text style={styles.payoutLabel}>Bank Account</Text>
            <View style={styles.payoutValue}>
              <Text style={styles.payoutText}>HDFC Bank ****4521</Text>
              <Text style={styles.payoutVerified}>✓ Verified</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.payoutRow}>
            <Text style={styles.payoutLabel}>Payout Schedule</Text>
            <Text style={styles.payoutText}>T+2 (Standard)</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.payoutRow}>
            <Text style={styles.payoutLabel}>Next Payout</Text>
            <Text style={styles.payoutText}>Dec 26, 2025</Text>
          </View>

          <TouchableOpacity style={styles.editBankButton}>
            <Text style={styles.editBankButtonText}>Update Bank Details</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Transaction Fees</Text>

          <View style={styles.feeRow}>
            <View style={styles.feeInfo}>
              <Text style={styles.feeMethod}>Credit/Debit Cards</Text>
              <Text style={styles.feeExample}>Visa, Mastercard, RuPay</Text>
            </View>
            <Text style={styles.feePercent}>2.0%</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.feeRow}>
            <View style={styles.feeInfo}>
              <Text style={styles.feeMethod}>UPI</Text>
              <Text style={styles.feeExample}>GPay, PhonePe, Paytm</Text>
            </View>
            <Text style={styles.feePercent}>0%</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.feeRow}>
            <View style={styles.feeInfo}>
              <Text style={styles.feeMethod}>Net Banking</Text>
              <Text style={styles.feeExample}>All major banks</Text>
            </View>
            <Text style={styles.feePercent}>1.5%</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.feeRow}>
            <View style={styles.feeInfo}>
              <Text style={styles.feeMethod}>Wallets</Text>
              <Text style={styles.feeExample}>Paytm, Amazon Pay</Text>
            </View>
            <Text style={styles.feePercent}>1.5%</Text>
          </View>
        </View>

        <View style={[styles.infoCard, { borderLeftWidth: 4, borderLeftColor: COLORS.amber }]}>
          <Text style={styles.infoIcon}>🚧</Text>
          <Text style={styles.infoText}>
            Payment method configuration is coming soon. Currently showing preview data. For live payment settings, use the Razorpay dashboard directly.
          </Text>
        </View>
      </ScrollView>
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
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.white,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  saveButton: {
    backgroundColor: COLORS.violet,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 70,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.cardBorder,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: FONT_SIZES.md,
  },
  saveButtonTextDisabled: {
    color: COLORS.textMuted,
  },
  placeholder: {
    width: 70,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  statusCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: SPACING.sm,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: '500',
  },
  dashboardLink: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.violet,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  statusIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  statusStats: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: SPACING.sm,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SPACING.md,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.md,
  },
  methodIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  methodIcon: {
    fontSize: 22,
  },
  methodContent: {
    flex: 1,
  },
  methodName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.white,
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  payoutLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  payoutValue: {
    alignItems: 'flex-end',
  },
  payoutText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    fontWeight: '500',
  },
  payoutVerified: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    marginTop: 2,
  },
  editBankButton: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  editBankButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.violet,
    fontWeight: '500',
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  feeInfo: {
    flex: 1,
  },
  feeMethod: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    fontWeight: '500',
    marginBottom: 2,
  },
  feeExample: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  feePercent: {
    fontSize: FONT_SIZES.md,
    color: COLORS.violet,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: SPACING.md,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  restrictedIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  restrictedTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  restrictedSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
