import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';

interface StaffProfile {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: 'available' | 'busy' | 'break' | 'off' | 'leave';
  photoUrl: string | null;
  joinedDate: string;
  baseSalary: number;
  commissionRate: number;
  specialties: string[];
  todayStats: {
    appointments: number;
    completed: number;
    revenue: number;
  };
  monthStats: {
    appointments: number;
    revenue: number;
    commission: number;
    rating: number;
  };
  schedule: AppointmentSlot[];
  services: ServiceItem[];
}

interface AppointmentSlot {
  id: string;
  time: string;
  duration: number;
  clientName: string;
  service: string;
  status: 'done' | 'current' | 'upcoming';
}

interface ServiceItem {
  name: string;
  price: number;
}

const SAMPLE_PROFILE: StaffProfile = {
  id: '1',
  name: 'Anita Desai',
  role: 'Senior Stylist',
  email: 'anita@salon.com',
  phone: '+91 98765 43210',
  status: 'busy',
  photoUrl: null,
  joinedDate: '2022-03-15',
  baseSalary: 35000,
  commissionRate: 15,
  specialties: ['Haircuts', 'Hair Coloring', 'Hair Treatments', 'Bridal Styling'],
  todayStats: {
    appointments: 8,
    completed: 3,
    revenue: 12500,
  },
  monthStats: {
    appointments: 120,
    revenue: 85000,
    commission: 12750,
    rating: 4.9,
  },
  schedule: [
    { id: '1', time: '10:00 AM', duration: 45, clientName: 'Priya Sharma', service: 'Haircut', status: 'done' },
    { id: '2', time: '11:30 AM', duration: 90, clientName: 'Sneha Patel', service: 'Hair Color', status: 'current' },
    { id: '3', time: '2:00 PM', duration: 60, clientName: 'Neha Singh', service: 'Haircut + Styling', status: 'upcoming' },
    { id: '4', time: '3:30 PM', duration: 45, clientName: 'Meera Joshi', service: 'Hair Treatment', status: 'upcoming' },
  ],
  services: [
    { name: 'Haircut', price: 500 },
    { name: 'Hair Color', price: 2500 },
    { name: 'Hair Treatment', price: 1800 },
    { name: 'Styling', price: 800 },
    { name: 'Bridal', price: 5000 },
  ],
};

export default function TeamMemberDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'schedule' | 'services' | 'performance'>('schedule');

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setProfile(SAMPLE_PROFILE);
    } catch (error) {
      Alert.alert('Error', 'Failed to load staff profile');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'available': return { label: 'Available', color: COLORS.green, bg: `${COLORS.green}20` };
      case 'busy': return { label: 'With Client', color: COLORS.blue, bg: `${COLORS.blue}20` };
      case 'break': return { label: 'On Break', color: COLORS.amber, bg: `${COLORS.amber}20` };
      case 'off': return { label: 'Day Off', color: COLORS.textMuted, bg: `${COLORS.textMuted}20` };
      case 'leave': return { label: 'On Leave', color: COLORS.red, bg: `${COLORS.red}20` };
      default: return { label: 'Unknown', color: COLORS.textMuted, bg: `${COLORS.textMuted}20` };
    }
  };

  const getAppointmentStatusColor = (status: string) => {
    switch (status) {
      case 'done': return COLORS.green;
      case 'current': return COLORS.blue;
      case 'upcoming': return COLORS.amber;
      default: return COLORS.textMuted;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>Staff member not found</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = getStatusConfig(profile.status);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <LinearGradient colors={GRADIENTS.primary} style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </LinearGradient>
          </View>
          <Text style={styles.memberName}>{profile.name}</Text>
          <Text style={styles.memberRole}>{profile.role}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionBtn}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionEmoji}>📱</Text>
            </View>
            <Text style={styles.actionLabel}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionEmoji}>💬</Text>
            </View>
            <Text style={styles.actionLabel}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => router.push({ pathname: '/team/schedule', params: { staffId: profile.id, name: profile.name } })}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionEmoji}>📅</Text>
            </View>
            <Text style={styles.actionLabel}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => router.push({ pathname: '/team/add-edit', params: { staffId: profile.id } })}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionEmoji}>✏️</Text>
            </View>
            <Text style={styles.actionLabel}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.todayStats.appointments}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.monthStats.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{(profile.monthStats.revenue / 1000).toFixed(1)}K</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'schedule' && styles.tabActive]}
            onPress={() => setActiveTab('schedule')}
          >
            <Text style={[styles.tabText, activeTab === 'schedule' && styles.tabTextActive]}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'services' && styles.tabActive]}
            onPress={() => setActiveTab('services')}
          >
            <Text style={[styles.tabText, activeTab === 'services' && styles.tabTextActive]}>Services</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'performance' && styles.tabActive]}
            onPress={() => setActiveTab('performance')}
          >
            <Text style={[styles.tabText, activeTab === 'performance' && styles.tabTextActive]}>Performance</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'schedule' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            {profile.schedule.map((slot) => (
              <TouchableOpacity key={slot.id} style={styles.appointmentCard}>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeText}>{slot.time}</Text>
                  <Text style={styles.durationText}>{slot.duration} min</Text>
                </View>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentClient}>{slot.clientName}</Text>
                  <Text style={styles.appointmentService}>{slot.service}</Text>
                </View>
                <View style={[styles.appointmentStatus, { backgroundColor: `${getAppointmentStatusColor(slot.status)}20` }]}>
                  <Text style={[styles.appointmentStatusText, { color: getAppointmentStatusColor(slot.status) }]}>
                    {slot.status === 'done' ? 'Done' : slot.status === 'current' ? 'Current' : 'Upcoming'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'services' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services Offered</Text>
            <View style={styles.servicesCard}>
              {profile.services.map((service, index) => (
                <View key={index} style={[styles.serviceRow, index === profile.services.length - 1 && styles.serviceRowLast]}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.servicePrice}>₹{service.price.toLocaleString()}</Text>
                </View>
              ))}
            </View>
            
            <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>Specialties</Text>
            <View style={styles.specialtiesList}>
              {profile.specialties.map((specialty, index) => (
                <View key={index} style={styles.specialtyTag}>
                  <Text style={styles.specialtyText}>{specialty}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'performance' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This Month's Stats</Text>
            <View style={styles.performanceCard}>
              <View style={styles.performanceRow}>
                <Text style={styles.performanceLabel}>Appointments</Text>
                <Text style={styles.performanceValue}>{profile.monthStats.appointments}</Text>
              </View>
              <View style={styles.performanceRow}>
                <Text style={styles.performanceLabel}>Revenue Generated</Text>
                <Text style={styles.performanceValue}>₹{profile.monthStats.revenue.toLocaleString()}</Text>
              </View>
              <View style={styles.performanceRow}>
                <Text style={styles.performanceLabel}>Commission Earned</Text>
                <Text style={[styles.performanceValue, { color: COLORS.green }]}>₹{profile.monthStats.commission.toLocaleString()}</Text>
              </View>
              <View style={[styles.performanceRow, styles.performanceRowLast]}>
                <Text style={styles.performanceLabel}>Client Rating</Text>
                <Text style={styles.performanceValue}>{profile.monthStats.rating} ⭐</Text>
              </View>
            </View>

            <View style={styles.quickLinksSection}>
              <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>Quick Links</Text>
              <TouchableOpacity 
                style={styles.quickLinkCard}
                onPress={() => router.push({ pathname: '/team/commissions', params: { staffId: profile.id } })}
              >
                <LinearGradient colors={GRADIENTS.success} style={styles.quickLinkIcon}>
                  <Text style={styles.quickLinkEmoji}>💰</Text>
                </LinearGradient>
                <View style={styles.quickLinkInfo}>
                  <Text style={styles.quickLinkTitle}>Commission History</Text>
                  <Text style={styles.quickLinkSubtitle}>View earnings and payouts</Text>
                </View>
                <Text style={styles.quickLinkArrow}>→</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickLinkCard}
                onPress={() => router.push('/team/leave')}
              >
                <LinearGradient colors={GRADIENTS.info} style={styles.quickLinkIcon}>
                  <Text style={styles.quickLinkEmoji}>🏖️</Text>
                </LinearGradient>
                <View style={styles.quickLinkInfo}>
                  <Text style={styles.quickLinkTitle}>Leave Management</Text>
                  <Text style={styles.quickLinkSubtitle}>View leave balance and requests</Text>
                </View>
                <Text style={styles.quickLinkArrow}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.scheduleButton}
          onPress={() => router.push({ pathname: '/team/schedule', params: { staffId: profile.id, name: profile.name } })}
        >
          <Text style={styles.scheduleText}>View Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.assignButton}>
          <LinearGradient colors={GRADIENTS.primary} style={styles.assignGradient}>
            <Text style={styles.assignText}>Assign Booking</Text>
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
    gap: SPACING.lg,
  },
  loadingText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.lg,
    padding: SPACING.xl,
  },
  errorIcon: {
    fontSize: 48,
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
  retryBtn: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
  },
  retryText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.violet,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
  },
  avatarContainer: {
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '600',
    color: COLORS.white,
  },
  memberName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  memberRole: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  actionBtn: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionEmoji: {
    fontSize: FONT_SIZES.xl,
  },
  actionLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    paddingBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  tabActive: {
    backgroundColor: COLORS.violet,
  },
  tabText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  section: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  timeBlock: {
    width: 70,
    marginRight: SPACING.md,
  },
  timeText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  durationText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentClient: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  appointmentService: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  appointmentStatus: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  appointmentStatusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  servicesCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  serviceRowLast: {
    borderBottomWidth: 0,
  },
  serviceName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  servicePrice: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.green,
  },
  specialtiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  specialtyTag: {
    backgroundColor: `${COLORS.violet}20`,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
  },
  specialtyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.violet,
    fontWeight: '500',
  },
  performanceCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  performanceRowLast: {
    borderBottomWidth: 0,
  },
  performanceLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  performanceValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  quickLinksSection: {},
  quickLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  quickLinkIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLinkEmoji: {
    fontSize: FONT_SIZES.xxl,
  },
  quickLinkInfo: {
    flex: 1,
  },
  quickLinkTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  quickLinkSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  quickLinkArrow: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textMuted,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: SPACING.xl,
    gap: SPACING.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  scheduleButton: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.md,
  },
  scheduleText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  assignButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  assignGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  assignText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
});
