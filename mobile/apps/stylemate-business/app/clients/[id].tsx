import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>PS</Text>
          </View>
          <Text style={styles.clientName}>Priya Sharma</Text>
          <Text style={styles.clientPhone}>+91 98765 43210</Text>
          <View style={styles.vipBadge}>
            <Text style={styles.vipText}>⭐ VIP Client</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>24</Text>
            <Text style={styles.statLabel}>Total Visits</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹48,500</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>4.9</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.preferenceCard}>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Preferred Staff</Text>
              <Text style={styles.preferenceValue}>Anita Desai</Text>
            </View>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Favorite Services</Text>
              <Text style={styles.preferenceValue}>Haircut, Hair Color, Facial</Text>
            </View>
            <View style={styles.preferenceRow}>
              <Text style={styles.preferenceLabel}>Notes</Text>
              <Text style={styles.preferenceValue}>Prefers morning slots, allergic to certain hair dyes</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Visits</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.visitCard}>
            <View style={styles.visitDate}>
              <Text style={styles.visitDay}>20</Text>
              <Text style={styles.visitMonth}>Dec</Text>
            </View>
            <View style={styles.visitInfo}>
              <Text style={styles.visitService}>Haircut + Color</Text>
              <Text style={styles.visitStaff}>with Anita Desai</Text>
            </View>
            <Text style={styles.visitAmount}>₹3,000</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.visitCard}>
            <View style={styles.visitDate}>
              <Text style={styles.visitDay}>05</Text>
              <Text style={styles.visitMonth}>Dec</Text>
            </View>
            <View style={styles.visitInfo}>
              <Text style={styles.visitService}>Facial Treatment</Text>
              <Text style={styles.visitStaff}>with Meera Joshi</Text>
            </View>
            <Text style={styles.visitAmount}>₹2,500</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.bookButton}>
          <Text style={styles.bookText}>Book Appointment</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  clientName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  clientPhone: {
    fontSize: 15,
    color: '#94A3B8',
    marginTop: 4,
  },
  vipBadge: {
    marginTop: 12,
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  vipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F59E0B',
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
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#F8FAFC',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 8,
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
    color: '#F8FAFC',
    marginBottom: 12,
  },
  viewAll: {
    fontSize: 14,
    color: '#3B82F6',
  },
  preferenceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
  },
  preferenceRow: {
    marginBottom: 16,
  },
  preferenceLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  preferenceValue: {
    fontSize: 14,
    color: '#F8FAFC',
  },
  visitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  visitDate: {
    width: 50,
    alignItems: 'center',
    marginRight: 12,
  },
  visitDay: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  visitMonth: {
    fontSize: 12,
    color: '#64748B',
  },
  visitInfo: {
    flex: 1,
  },
  visitService: {
    fontSize: 15,
    fontWeight: '500',
    color: '#F8FAFC',
  },
  visitStaff: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  visitAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10B981',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  bookButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
