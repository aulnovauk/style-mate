import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  COLORS,
  GRADIENTS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from '../../../constants/theme';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  accountType: 'current' | 'savings';
  isPrimary: boolean;
}

export default function BankAccountSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccount, setNewAccount] = useState<Partial<BankAccount>>({
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    accountType: 'current',
    isPrimary: false,
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setAccounts([
        {
          id: '1',
          bankName: 'HDFC Bank',
          accountNumber: '50100123456789',
          ifscCode: 'HDFC0001234',
          accountHolderName: 'Stylemate Pvt Ltd',
          accountType: 'current',
          isPrimary: true,
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (!newAccount.bankName || !newAccount.accountNumber || !newAccount.ifscCode || !newAccount.accountHolderName) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      setSaving(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const account: BankAccount = {
        id: Date.now().toString(),
        bankName: newAccount.bankName!,
        accountNumber: newAccount.accountNumber!,
        ifscCode: newAccount.ifscCode!,
        accountHolderName: newAccount.accountHolderName!,
        accountType: newAccount.accountType as 'current' | 'savings',
        isPrimary: accounts.length === 0,
      };
      setAccounts([...accounts, account]);
      setShowAddForm(false);
      setNewAccount({
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        accountHolderName: '',
        accountType: 'current',
        isPrimary: false,
      });
      Alert.alert('Success', 'Bank account added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add bank account');
    } finally {
      setSaving(false);
    }
  };

  const handleSetPrimary = (accountId: string) => {
    setAccounts(accounts.map(acc => ({
      ...acc,
      isPrimary: acc.id === accountId,
    })));
  };

  const handleDeleteAccount = (accountId: string) => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to remove this bank account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setAccounts(accounts.filter(acc => acc.id !== accountId));
          },
        },
      ]
    );
  };

  const maskAccountNumber = (number: string) => {
    if (number.length <= 4) return number;
    return 'X'.repeat(number.length - 4) + number.slice(-4);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bank Accounts</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
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
        <Text style={styles.headerTitle}>Bank Accounts</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionDescription}>
          Manage bank accounts for salary disbursement. The primary account will be used for all payroll transfers.
        </Text>

        {accounts.map((account) => (
          <View key={account.id} style={styles.accountCard}>
            <View style={styles.accountHeader}>
              <View style={styles.bankInfo}>
                <View style={styles.bankIcon}>
                  <Text style={styles.bankIconText}>🏦</Text>
                </View>
                <View>
                  <Text style={styles.bankName}>{account.bankName}</Text>
                  <Text style={styles.accountType}>
                    {account.accountType === 'current' ? 'Current Account' : 'Savings Account'}
                  </Text>
                </View>
              </View>
              {account.isPrimary && (
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>Primary</Text>
                </View>
              )}
            </View>

            <View style={styles.accountDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Account Number</Text>
                <Text style={styles.detailValue}>{maskAccountNumber(account.accountNumber)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>IFSC Code</Text>
                <Text style={styles.detailValue}>{account.ifscCode}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Account Holder</Text>
                <Text style={styles.detailValue}>{account.accountHolderName}</Text>
              </View>
            </View>

            <View style={styles.accountActions}>
              {!account.isPrimary && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleSetPrimary(account.id)}
                >
                  <Text style={styles.actionButtonText}>Set as Primary</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteAccount(account.id)}
              >
                <Text style={styles.deleteButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {accounts.length === 0 && !showAddForm && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏦</Text>
            <Text style={styles.emptyTitle}>No Bank Accounts</Text>
            <Text style={styles.emptyDescription}>
              Add a bank account to start processing salary payments
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowAddForm(true)}
            >
              <LinearGradient colors={GRADIENTS.primary} style={styles.emptyButtonGradient}>
                <Text style={styles.emptyButtonText}>Add Bank Account</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {showAddForm && (
          <View style={styles.addForm}>
            <Text style={styles.formTitle}>Add New Bank Account</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bank Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter bank name"
                placeholderTextColor={COLORS.textMuted}
                value={newAccount.bankName}
                onChangeText={(text) => setNewAccount({ ...newAccount, bankName: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter account number"
                placeholderTextColor={COLORS.textMuted}
                value={newAccount.accountNumber}
                onChangeText={(text) => setNewAccount({ ...newAccount, accountNumber: text })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>IFSC Code *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter IFSC code"
                placeholderTextColor={COLORS.textMuted}
                value={newAccount.ifscCode}
                onChangeText={(text) => setNewAccount({ ...newAccount, ifscCode: text.toUpperCase() })}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Holder Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter account holder name"
                placeholderTextColor={COLORS.textMuted}
                value={newAccount.accountHolderName}
                onChangeText={(text) => setNewAccount({ ...newAccount, accountHolderName: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Type</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    newAccount.accountType === 'current' && styles.typeButtonActive,
                  ]}
                  onPress={() => setNewAccount({ ...newAccount, accountType: 'current' })}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      newAccount.accountType === 'current' && styles.typeButtonTextActive,
                    ]}
                  >
                    Current
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    newAccount.accountType === 'savings' && styles.typeButtonActive,
                  ]}
                  onPress={() => setNewAccount({ ...newAccount, accountType: 'savings' })}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      newAccount.accountType === 'savings' && styles.typeButtonTextActive,
                    ]}
                  >
                    Savings
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelFormButton}
                onPress={() => setShowAddForm(false)}
                disabled={saving}
              >
                <Text style={styles.cancelFormButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveFormButton}
                onPress={handleAddAccount}
                disabled={saving}
              >
                <LinearGradient colors={GRADIENTS.primary} style={styles.saveFormButtonGradient}>
                  {saving ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.saveFormButtonText}>Add Account</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xxl,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.violet,
    borderRadius: BORDER_RADIUS.md,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  sectionDescription: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  accountCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  bankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.violet}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  bankIconText: {
    fontSize: FONT_SIZES.xl,
  },
  bankName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  accountType: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  primaryBadge: {
    backgroundColor: `${COLORS.green}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  primaryBadgeText: {
    color: COLORS.green,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  accountDetails: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  detailLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  detailValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  accountActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    backgroundColor: `${COLORS.violet}20`,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  actionButtonText: {
    color: COLORS.violet,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: `${COLORS.red}20`,
  },
  deleteButtonText: {
    color: COLORS.red,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  emptyDescription: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  emptyButton: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  addForm: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  formTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginBottom: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  typeButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  typeButtonActive: {
    backgroundColor: COLORS.violet,
    borderColor: COLORS.violet,
  },
  typeButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  typeButtonTextActive: {
    color: COLORS.white,
    fontWeight: '500',
  },
  formActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  cancelFormButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cancelFormButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  saveFormButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  saveFormButtonGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  saveFormButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
});
