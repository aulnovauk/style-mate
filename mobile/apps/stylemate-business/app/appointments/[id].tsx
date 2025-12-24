import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content}>
        <View style={styles.statusBanner}>
          <Text style={styles.statusIcon}>✓</Text>
          <Text style={styles.statusText}>Confirmed</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client</Text>
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>PS</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Priya Sharma</Text>
              <Text style={styles.cardSubtitle}>+91 98765 43210</Text>
            </View>
            <TouchableOpacity style={styles.chatButton}>
              <Text style={styles.chatIcon}>💬</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.serviceCard}>
            <View style={styles.serviceRow}>
              <Text style={styles.serviceName}>Haircut</Text>
              <Text style={styles.servicePrice}>₹500</Text>
            </View>
            <Text style={styles.serviceDuration}>45 min</Text>
          </View>
          <View style={styles.serviceCard}>
            <View style={styles.serviceRow}>
              <Text style={styles.serviceName}>Hair Color</Text>
              <Text style={styles.servicePrice}>₹2,500</Text>
            </View>
            <Text style={styles.serviceDuration}>90 min</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Staff</Text>
          <View style={styles.card}>
            <View style={[styles.avatar, { borderColor: '#8B5CF6', borderWidth: 2 }]}>
              <Text style={styles.avatarText}>AD</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Anita Desai</Text>
              <Text style={styles.cardSubtitle}>Senior Stylist</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleRow}>
              <Text style={styles.scheduleIcon}>📅</Text>
              <Text style={styles.scheduleText}>December 23, 2025</Text>
            </View>
            <View style={styles.scheduleRow}>
              <Text style={styles.scheduleIcon}>⏰</Text>
              <Text style={styles.scheduleText}>2:00 PM - 4:15 PM</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Subtotal</Text>
              <Text style={styles.paymentValue}>₹3,000</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Discount</Text>
              <Text style={[styles.paymentValue, { color: '#10B981' }]}>-₹300</Text>
            </View>
            <View style={[styles.paymentRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹2,700</Text>
            </View>
            <View style={styles.paymentStatus}>
              <Text style={styles.paymentStatusText}>Payment pending</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.rescheduleButton}>
          <Text style={styles.rescheduleText}>Reschedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.checkoutButton}>
          <Text style={styles.checkoutText}>Start & Checkout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B98120',
    paddingVertical: 12,
    gap: 8,
  },
  statusIcon: {
    fontSize: 16,
    color: '#10B981',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatIcon: {
    fontSize: 20,
  },
  serviceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  serviceDuration: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  scheduleCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  scheduleText: {
    fontSize: 15,
    color: '#F8FAFC',
  },
  paymentCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F8FAFC',
  },
  totalRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  paymentStatus: {
    backgroundColor: '#F59E0B20',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  paymentStatusText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#F59E0B',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  rescheduleButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#1E293B',
    borderRadius: 12,
  },
  rescheduleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  checkoutButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
