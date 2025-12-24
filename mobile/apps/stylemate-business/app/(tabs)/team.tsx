import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  color: string;
  status: 'available' | 'busy' | 'break' | 'off';
  todayAppointments: number;
  currentClient?: string;
}

const mockTeam: TeamMember[] = [
  { id: '1', name: 'Anita Desai', role: 'Senior Stylist', color: '#8B5CF6', status: 'busy', todayAppointments: 8, currentClient: 'Priya Sharma' },
  { id: '2', name: 'Ravi Mehta', role: 'Barber', color: '#EC4899', status: 'available', todayAppointments: 6 },
  { id: '3', name: 'Meera Joshi', role: 'Aesthetician', color: '#3B82F6', status: 'break', todayAppointments: 5 },
  { id: '4', name: 'Suresh Kumar', role: 'Hair Colorist', color: '#10B981', status: 'busy', todayAppointments: 7, currentClient: 'Rahul Verma' },
  { id: '5', name: 'Pooja Sharma', role: 'Nail Technician', color: '#F59E0B', status: 'off', todayAppointments: 0 },
];

interface TeamCardProps {
  member: TeamMember;
  onPress: () => void;
}

function TeamCard({ member, onPress }: TeamCardProps) {
  const statusConfig = {
    available: { label: 'Available', color: '#10B981', bg: '#10B98120' },
    busy: { label: 'With Client', color: '#3B82F6', bg: '#3B82F620' },
    break: { label: 'On Break', color: '#F59E0B', bg: '#F59E0B20' },
    off: { label: 'Day Off', color: '#64748B', bg: '#64748B20' },
  };

  const status = statusConfig[member.status];

  return (
    <TouchableOpacity style={styles.teamCard} onPress={onPress}>
      <View style={[styles.avatar, { borderColor: member.color }]}>
        <Text style={styles.avatarText}>
          {member.name.split(' ').map(n => n[0]).join('')}
        </Text>
        <View style={[styles.statusDot, { backgroundColor: status.color }]} />
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.name}</Text>
        <Text style={styles.memberRole}>{member.role}</Text>
        {member.currentClient && (
          <Text style={styles.currentClient}>With: {member.currentClient}</Text>
        )}
      </View>
      <View style={styles.rightSection}>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
        <Text style={styles.appointmentCount}>
          {member.todayAppointments} today
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function TeamScreen() {
  const router = useRouter();

  const availableCount = mockTeam.filter(m => m.status === 'available').length;
  const busyCount = mockTeam.filter(m => m.status === 'busy').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Team</Text>
        <TouchableOpacity style={styles.scheduleButton}>
          <Text style={styles.scheduleButtonText}>View Schedule</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <View style={[styles.summaryDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.summaryValue}>{availableCount}</Text>
          <Text style={styles.summaryLabel}>Available</Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={[styles.summaryDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.summaryValue}>{busyCount}</Text>
          <Text style={styles.summaryLabel}>With Clients</Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={[styles.summaryDot, { backgroundColor: '#64748B' }]} />
          <Text style={styles.summaryValue}>{mockTeam.length}</Text>
          <Text style={styles.summaryLabel}>Total Staff</Text>
        </View>
      </View>

      <FlatList
        data={mockTeam}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TeamCard 
            member={item} 
            onPress={() => router.push(`/team/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  scheduleButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  scheduleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F8FAFC',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#334155',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  memberRole: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  currentClient: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 4,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  appointmentCount: {
    fontSize: 12,
    color: '#64748B',
  },
});
