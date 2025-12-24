import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  COLORS,
  GRADIENTS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from '../../constants/theme';
import { useClientDetails } from '@stylemate/core/hooks/useBusinessApi';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, loading, error } = useClientDetails(id);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading client...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error || 'Client not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const client = data.client;
  const stats = data.stats;
  const initials = `${client.firstName?.[0] || ''}${client.lastName?.[0] || ''}`.toUpperCase() || '?';

  const formatCurrency = (amountInPaisa: number) => {
    return `₹${(amountInPaisa / 100).toLocaleString('en-IN')}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.clientName}>{client.name}</Text>
          <Text style={styles.clientPhone}>{client.phone}</Text>
          {client.isVIP && (
            <View style={styles.vipBadge}>
              <Text style={styles.vipText}>⭐ VIP Client</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalVisits}</Text>
            <Text style={styles.statLabel}>Total Visits</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(stats.totalSpentInPaisa)}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.upcomingAppointments}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionText}>Book</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push(`/clients/add-edit?id=${id}`)}
          >
            <Text style={styles.actionIcon}>✏️</Text>
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.preferenceCard}>
            {client.preferredStaffName && (
              <View style={styles.preferenceRow}>
                <Text style={styles.preferenceLabel}>Preferred Staff</Text>
                <Text style={styles.preferenceValue}>{client.preferredStaffName}</Text>
              </View>
            )}
            {data.preferredServices && data.preferredServices.length > 0 && (
              <View style={styles.preferenceRow}>
                <Text style={styles.preferenceLabel}>Favorite Services</Text>
                <Text style={styles.preferenceValue}>{data.preferredServices.join(', ')}</Text>
              </View>
            )}
            {client.notes && (
              <View style={styles.preferenceRow}>
                <Text style={styles.preferenceLabel}>Notes</Text>
                <Text style={styles.preferenceValue}>{client.notes}</Text>
              </View>
            )}
            {!client.preferredStaffName && (!data.preferredServices || data.preferredServices.length === 0) && !client.notes && (
              <Text style={styles.noDataText}>No preferences recorded</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Visits</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {data.recentVisits && data.recentVisits.length > 0 ? (
            data.recentVisits.slice(0, 3).map((visit) => {
              const visitDate = new Date(visit.date);
              return (
                <TouchableOpacity key={visit.id} style={styles.visitCard}>
                  <View style={styles.visitDate}>
                    <Text style={styles.visitDay}>{visitDate.getDate()}</Text>
                    <Text style={styles.visitMonth}>{visitDate.toLocaleString('en', { month: 'short' })}</Text>
                  </View>
                  <View style={styles.visitInfo}>
                    <Text style={styles.visitService}>{visit.services.join(', ')}</Text>
                    <Text style={styles.visitStaff}>with {visit.staffName}</Text>
                  </View>
                  <Text style={styles.visitAmount}>{formatCurrency(visit.amountInPaisa)}</Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyVisits}>
              <Text style={styles.noDataText}>No visits yet</Text>
            </View>
          )}
        </View>

        {data.activePackages && data.activePackages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Packages</Text>
            {data.activePackages.map((pkg) => (
              <View key={pkg.id} style={styles.packageCard}>
                <Text style={styles.packageName}>{pkg.name}</Text>
                <Text style={styles.packageRemaining}>{pkg.remainingSessions} sessions remaining</Text>
                {pkg.expiryDate && (
                  <Text style={styles.packageExpiry}>
                    Expires: {new Date(pkg.expiryDate).toLocaleDateString()}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.bookButton}>
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookButtonGradient}
          >
            <Text style={styles.bookText}>Book Appointment</Text>
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
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorIcon: {
    fontSize: FONT_SIZES.xxxl + 16,
    marginBottom: SPACING.lg,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  retryButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.violet,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatarText: {
    fontSize: FONT_SIZES.xxl + 4,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  clientName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  clientPhone: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  vipBadge: {
    marginTop: SPACING.md,
    backgroundColor: `${COLORS.amber}20`,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  vipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.amber,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: FONT_SIZES.xxl,
    marginBottom: SPACING.sm,
  },
  actionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  section: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.sm,
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
    marginBottom: SPACING.md,
  },
  viewAll: {
    fontSize: FONT_SIZES.md,
    color: COLORS.violet,
  },
  preferenceCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
  },
  preferenceRow: {
    marginBottom: SPACING.lg,
  },
  preferenceLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  preferenceValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  noDataText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  visitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  visitDate: {
    width: 50,
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  visitDay: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  visitMonth: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  visitInfo: {
    flex: 1,
  },
  visitService: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  visitStaff: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  visitAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.green,
  },
  emptyVisits: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xl,
  },
  packageCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  packageName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  packageRemaining: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.green,
    marginTop: SPACING.xs,
  },
  packageExpiry: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  footer: {
    padding: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  bookButton: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  bookButtonGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  bookText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
});
