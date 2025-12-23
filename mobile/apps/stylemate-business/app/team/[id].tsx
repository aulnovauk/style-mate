import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function TeamMemberDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.avatar, { borderColor: '#8B5CF6' }]}>
            <Text style={styles.avatarText}>AD</Text>
          </View>
          <Text style={styles.memberName}>Anita Desai</Text>
          <Text style={styles.memberRole}>Senior Stylist</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Available</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>4.9</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹1.2L</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          
          <View style={styles.appointmentCard}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeText}>10:00 AM</Text>
              <Text style={styles.durationText}>45 min</Text>
            </View>
            <View style={styles.appointmentInfo}>
              <Text style={styles.appointmentClient}>Priya Sharma</Text>
              <Text style={styles.appointmentService}>Haircut</Text>
            </View>
            <View style={[styles.appointmentStatus, { backgroundColor: '#10B98120' }]}>
              <Text style={[styles.appointmentStatusText, { color: '#10B981' }]}>Done</Text>
            </View>
          </View>

          <View style={styles.appointmentCard}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeText}>11:30 AM</Text>
              <Text style={styles.durationText}>90 min</Text>
            </View>
            <View style={styles.appointmentInfo}>
              <Text style={styles.appointmentClient}>Sneha Patel</Text>
              <Text style={styles.appointmentService}>Hair Color</Text>
            </View>
            <View style={[styles.appointmentStatus, { backgroundColor: '#3B82F620' }]}>
              <Text style={[styles.appointmentStatusText, { color: '#3B82F6' }]}>Current</Text>
            </View>
          </View>

          <View style={styles.appointmentCard}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeText}>2:00 PM</Text>
              <Text style={styles.durationText}>60 min</Text>
            </View>
            <View style={styles.appointmentInfo}>
              <Text style={styles.appointmentClient}>Neha Singh</Text>
              <Text style={styles.appointmentService}>Haircut + Styling</Text>
            </View>
            <View style={[styles.appointmentStatus, { backgroundColor: '#F59E0B20' }]}>
              <Text style={[styles.appointmentStatusText, { color: '#F59E0B' }]}>Upcoming</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.servicesCard}>
            <View style={styles.serviceRow}>
              <Text style={styles.serviceName}>Haircut</Text>
              <Text style={styles.servicePrice}>₹500</Text>
            </View>
            <View style={styles.serviceRow}>
              <Text style={styles.serviceName}>Hair Color</Text>
              <Text style={styles.servicePrice}>₹2,500</Text>
            </View>
            <View style={styles.serviceRow}>
              <Text style={styles.serviceName}>Hair Treatment</Text>
              <Text style={styles.servicePrice}>₹1,800</Text>
            </View>
            <View style={styles.serviceRow}>
              <Text style={styles.serviceName}>Styling</Text>
              <Text style={styles.servicePrice}>₹800</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.performanceCard}>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Appointments This Week</Text>
              <Text style={styles.performanceValue}>42</Text>
            </View>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Revenue This Week</Text>
              <Text style={styles.performanceValue}>₹85,000</Text>
            </View>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Client Retention</Text>
              <Text style={styles.performanceValue}>92%</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.scheduleButton}>
          <Text style={styles.scheduleText}>Edit Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.assignButton}>
          <Text style={styles.assignText}>Assign Booking</Text>
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
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#334155',
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  memberName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  memberRole: {
    fontSize: 15,
    color: '#94A3B8',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#10B98120',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  timeBlock: {
    width: 70,
    marginRight: 12,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  durationText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentClient: {
    fontSize: 15,
    fontWeight: '500',
    color: '#F8FAFC',
  },
  appointmentService: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  appointmentStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  appointmentStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  servicesCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  serviceName: {
    fontSize: 14,
    color: '#F8FAFC',
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  performanceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  performanceLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  scheduleButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1E293B',
    borderRadius: 12,
  },
  scheduleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  assignButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    alignItems: 'center',
  },
  assignText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
