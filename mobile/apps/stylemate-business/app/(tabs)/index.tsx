import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useDashboard, useTodayAppointments } from '@stylemate/core';

const { width } = Dimensions.get('window');

const COLORS = {
  background: '#0F172A',
  cardBg: '#1E293B',
  cardBorder: '#334155',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  violet: '#8B5CF6',
  fuchsia: '#D946EF',
  green: '#10B981',
  amber: '#F59E0B',
  blue: '#3B82F6',
  cyan: '#06B6D4',
  red: '#EF4444',
};

interface StatCardProps {
  icon: string;
  iconGradient: [string, string];
  value: string;
  label: string;
  trend: number;
  trendType: 'up' | 'down' | 'neutral';
}

function StatCard({ icon, iconGradient, value, label, trend, trendType }: StatCardProps) {
  const getTrendColor = () => {
    if (trendType === 'up') return COLORS.green;
    if (trendType === 'down') return COLORS.red;
    return COLORS.amber;
  };

  const getTrendIcon = () => {
    if (trendType === 'up') return '↑';
    if (trendType === 'down') return '↓';
    return '−';
  };

  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <LinearGradient
          colors={iconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statIconContainer}
        >
          <Text style={styles.statIcon}>{icon}</Text>
        </LinearGradient>
        <View style={[styles.trendBadge, { backgroundColor: getTrendColor() + '20' }]}>
          <Text style={[styles.trendText, { color: getTrendColor() }]}>
            {getTrendIcon()} {Math.abs(trend)}%
          </Text>
        </View>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

interface QuickActionButtonProps {
  icon: string;
  label: string;
  isPrimary?: boolean;
  onPress: () => void;
}

function QuickActionButton({ icon, label, isPrimary = false, onPress }: QuickActionButtonProps) {
  return (
    <TouchableOpacity 
      style={styles.quickActionButton} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isPrimary ? (
        <LinearGradient
          colors={[COLORS.violet, COLORS.fuchsia]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.quickActionIconPrimary}
        >
          <Text style={styles.quickActionIcon}>{icon}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.quickActionIconSecondary}>
          <Text style={[styles.quickActionIcon, { color: COLORS.violet }]}>{icon}</Text>
        </View>
      )}
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

interface AppointmentCardProps {
  clientName: string;
  clientImage: string;
  service: string;
  time: string;
  staffName: string;
  staffImage: string;
  price: string;
  status: 'confirmed' | 'pending' | 'in-progress';
  onCall: () => void;
  onCheckIn: () => void;
}

function AppointmentCard({ 
  clientName, 
  clientImage,
  service, 
  time, 
  staffName, 
  staffImage,
  price, 
  status,
  onCall,
  onCheckIn 
}: AppointmentCardProps) {
  const getStatusStyle = () => {
    switch (status) {
      case 'confirmed':
        return { bg: COLORS.green + '20', text: COLORS.green, label: 'Confirmed' };
      case 'pending':
        return { bg: COLORS.amber + '20', text: COLORS.amber, label: 'Pending' };
      case 'in-progress':
        return { bg: COLORS.blue + '20', text: COLORS.blue, label: 'In Progress' };
    }
  };

  const statusStyle = getStatusStyle();

  return (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.appointmentClientInfo}>
          <Image source={{ uri: clientImage }} style={styles.clientAvatar} />
          <View style={styles.clientDetails}>
            <Text style={styles.clientName}>{clientName}</Text>
            <Text style={styles.serviceName}>{service}</Text>
            <View style={styles.timeRow}>
              <Text style={styles.timeIcon}>🕐</Text>
              <Text style={styles.timeText}>{time}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
        </View>
      </View>

      <View style={styles.appointmentFooter}>
        <View style={styles.staffInfo}>
          <Image source={{ uri: staffImage }} style={styles.staffAvatar} />
          <Text style={styles.staffName}>{staffName}</Text>
        </View>
        <Text style={styles.priceText}>{price}</Text>
      </View>

      <View style={styles.appointmentActions}>
        <TouchableOpacity style={styles.callButton} onPress={onCall} activeOpacity={0.7}>
          <Text style={styles.callButtonIcon}>📞</Text>
          <Text style={styles.callButtonText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.checkInButton} onPress={onCheckIn} activeOpacity={0.7}>
          <LinearGradient
            colors={[COLORS.violet, COLORS.fuchsia]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.checkInGradient}
          >
            <Text style={styles.checkInIcon}>✓</Text>
            <Text style={styles.checkInText}>Check-in</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface StaffCardProps {
  name: string;
  role: string;
  image: string;
  isActive: boolean;
  bookings: number;
  revenue: string;
  rating: number;
}

function StaffCard({ name, role, image, isActive, bookings, revenue, rating }: StaffCardProps) {
  return (
    <View style={styles.staffCard}>
      <View style={styles.staffCardHeader}>
        <View style={styles.staffInfoRow}>
          <Image source={{ uri: image }} style={styles.staffCardAvatar} />
          <View style={styles.staffCardDetails}>
            <Text style={styles.staffCardName}>{name}</Text>
            <Text style={styles.staffCardRole}>{role}</Text>
          </View>
        </View>
        <View style={[
          styles.staffStatusBadge, 
          { backgroundColor: isActive ? COLORS.green + '20' : COLORS.amber + '20' }
        ]}>
          <Text style={[
            styles.staffStatusText, 
            { color: isActive ? COLORS.green : COLORS.amber }
          ]}>
            {isActive ? 'Active' : 'Break'}
          </Text>
        </View>
      </View>

      <View style={styles.staffMetrics}>
        <View style={styles.staffMetric}>
          <Text style={[styles.staffMetricValue, { color: COLORS.violet }]}>{bookings}</Text>
          <Text style={styles.staffMetricLabel}>Bookings</Text>
        </View>
        <View style={styles.staffMetric}>
          <Text style={[styles.staffMetricValue, { color: COLORS.green }]}>{revenue}</Text>
          <Text style={styles.staffMetricLabel}>Revenue</Text>
        </View>
        <View style={styles.staffMetric}>
          <Text style={[styles.staffMetricValue, { color: COLORS.amber }]}>{rating}</Text>
          <Text style={styles.staffMetricLabel}>Rating</Text>
        </View>
      </View>
    </View>
  );
}

interface TopServiceProps {
  rank: number;
  name: string;
  count: number;
  revenue: string;
  icon: string;
}

function TopServiceItem({ rank, name, count, revenue, icon }: TopServiceProps) {
  return (
    <View style={styles.topServiceItem}>
      <View style={styles.serviceRank}>
        <Text style={styles.serviceRankText}>{rank}</Text>
      </View>
      <View style={styles.serviceIconContainer}>
        <Text style={styles.serviceItemIcon}>{icon}</Text>
      </View>
      <View style={styles.serviceDetails}>
        <Text style={styles.serviceItemName}>{name}</Text>
        <Text style={styles.serviceCount}>{count} bookings</Text>
      </View>
      <Text style={styles.serviceRevenue}>{revenue}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('Today');
  
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useDashboard();
  const { data: todayAppointments, loading: appointmentsLoading, error: appointmentsError, refetch: refetchAppointments } = useTodayAppointments();
  
  const refreshing = dashboardLoading || appointmentsLoading;
  
  const onRefresh = useCallback(() => {
    refetchDashboard();
    refetchAppointments();
  }, [refetchDashboard, refetchAppointments]);

  const periods = ['Today', 'This Week', 'This Month', 'Custom'];

  const formatStatus = (status: string): 'confirmed' | 'pending' | 'in-progress' => {
    if (status === 'confirmed' || status === 'completed') return 'confirmed';
    if (status === 'in_progress') return 'in-progress';
    return 'pending';
  };

  const appointments = todayAppointments?.appointments?.slice(0, 3).map(apt => ({
    id: String(apt.id),
    clientName: apt.customerName || 'Walk-in Customer',
    clientImage: `https://i.pravatar.cc/150?u=${apt.id}`,
    service: apt.service?.name || 'Service',
    time: apt.bookingTime || '',
    staffName: apt.staff?.name || 'Staff',
    staffImage: apt.staff?.photoUrl || `https://i.pravatar.cc/150?u=staff${apt.staffId}`,
    price: apt.amountFormatted || '₹0',
    status: formatStatus(apt.status),
  })) || [];

  const staffMembers = [
    { name: 'Rahul Kumar', role: 'Senior Stylist', image: 'https://i.pravatar.cc/150?img=8', isActive: true, bookings: 12, revenue: '₹9.2K', rating: 4.8 },
    { name: 'Anjali Reddy', role: 'Makeup Artist', image: 'https://i.pravatar.cc/150?img=9', isActive: true, bookings: 8, revenue: '₹6.8K', rating: 4.9 },
    { name: 'Vikram Singh', role: 'Barber', image: 'https://i.pravatar.cc/150?img=12', isActive: false, bookings: 10, revenue: '₹5.5K', rating: 4.7 },
  ];

  const topServices = [
    { rank: 1, name: 'Hair Styling', count: 45, revenue: '₹22.5K', icon: '💇' },
    { rank: 2, name: 'Makeup', count: 32, revenue: '₹18.4K', icon: '💄' },
    { rank: 3, name: 'Manicure', count: 28, revenue: '₹8.4K', icon: '💅' },
  ];
  
  if (dashboardLoading && !dashboardData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (dashboardError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>Unable to load dashboard</Text>
          <Text style={styles.errorSubtext}>{dashboardError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.violet}
            colors={[COLORS.violet, COLORS.fuchsia]}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={[COLORS.violet, COLORS.fuchsia]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoContainer}
            >
              <Text style={styles.logoIcon}>✂️</Text>
            </LinearGradient>
            <View style={styles.salonInfo}>
              <Text style={styles.salonName}>{dashboardData?.salon?.name || 'My Salon'}</Text>
              <Text style={styles.branchName}>Business Dashboard</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationBtn}>
              <Text style={styles.notificationIcon}>🔔</Text>
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity>
              <Image 
                source={{ uri: 'https://i.pravatar.cc/150?img=5' }} 
                style={styles.profileAvatar} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search clients, appointments..."
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        </View>

        <View style={styles.periodTabs}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period}
              onPress={() => setSelectedPeriod(period)}
              activeOpacity={0.8}
            >
              {selectedPeriod === period ? (
                <LinearGradient
                  colors={[COLORS.violet, COLORS.fuchsia]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.periodTabActive}
                >
                  <Text style={styles.periodTabTextActive}>{period}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.periodTab}>
                  <Text style={styles.periodTabText}>{period}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Overview</Text>
            <TouchableOpacity style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>View All</Text>
              <Text style={styles.viewAllArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            <StatCard
              icon="📅"
              iconGradient={[COLORS.violet, COLORS.fuchsia]}
              value={String(dashboardData?.stats?.todayAppointments?.value || todayAppointments?.total || 0)}
              label="Appointments"
              trend={dashboardData?.stats?.todayAppointments?.change?.value || 0}
              trendType={dashboardData?.stats?.todayAppointments?.change?.isPositive ? 'up' : dashboardData?.stats?.todayAppointments?.change?.value ? 'down' : 'neutral'}
            />
            <StatCard
              icon="₹"
              iconGradient={[COLORS.green, '#059669']}
              value={dashboardData?.stats?.todayRevenue?.formatted || '₹0'}
              label="Revenue"
              trend={dashboardData?.stats?.todayRevenue?.change?.value || 0}
              trendType={dashboardData?.stats?.todayRevenue?.change?.isPositive ? 'up' : dashboardData?.stats?.todayRevenue?.change?.value ? 'down' : 'neutral'}
            />
            <StatCard
              icon="👥"
              iconGradient={[COLORS.amber, '#EA580C']}
              value={String(dashboardData?.stats?.todayClients?.value || 0)}
              label="Clients Today"
              trend={dashboardData?.stats?.todayClients?.change?.value || 0}
              trendType={dashboardData?.stats?.todayClients?.change?.isPositive ? 'up' : dashboardData?.stats?.todayClients?.change?.value ? 'down' : 'neutral'}
            />
            <StatCard
              icon="💰"
              iconGradient={[COLORS.blue, COLORS.cyan]}
              value={dashboardData?.stats?.weeklyRevenue?.formatted || '₹0'}
              label="Weekly Revenue"
              trend={dashboardData?.stats?.weeklyRevenue?.change?.value || 0}
              trendType={dashboardData?.stats?.weeklyRevenue?.change?.isPositive ? 'up' : dashboardData?.stats?.weeklyRevenue?.change?.value ? 'down' : 'neutral'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionButton
              icon="➕"
              label="New Booking"
              isPrimary
              onPress={() => router.push('/appointments/new-booking')}
            />
            <QuickActionButton
              icon="🚶"
              label="Walk-in"
              onPress={() => router.push('/appointments/walk-in')}
            />
            <QuickActionButton
              icon="👤"
              label="Add Client"
              onPress={() => router.push('/(tabs)/clients')}
            />
            <QuickActionButton
              icon="💳"
              label="Checkout"
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/calendar')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {appointments.map((apt) => (
            <AppointmentCard
              key={apt.id}
              {...apt}
              onCall={() => {}}
              onCheckIn={() => router.push(`/appointments/${apt.id}`)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Staff Performance</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/team')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {staffMembers.map((staff, index) => (
            <StaffCard key={index} {...staff} />
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Services Today</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.topServicesCard}>
            {topServices.map((service, index) => (
              <View key={service.rank}>
                <TopServiceItem {...service} />
                {index < topServices.length - 1 && <View style={styles.serviceDivider} />}
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
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
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: COLORS.violet,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 18,
  },
  salonInfo: {},
  salonName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  branchName: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationBtn: {
    position: 'relative',
  },
  notificationIcon: {
    fontSize: 22,
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.violet,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  periodTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  periodTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
  },
  periodTabActive: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  periodTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  periodTabTextActive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.violet,
    fontWeight: '500',
  },
  viewAllArrow: {
    fontSize: 18,
    color: COLORS.violet,
    marginLeft: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 44) / 2,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 18,
    color: '#FFF',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  quickActionIconPrimary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionIconSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionIcon: {
    fontSize: 18,
    color: '#FFF',
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  appointmentCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  appointmentClientInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  serviceName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  appointmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  staffName: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.violet,
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBorder,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  callButtonIcon: {
    fontSize: 14,
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  checkInButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  checkInGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  checkInIcon: {
    fontSize: 14,
    color: '#FFF',
  },
  checkInText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
  },
  staffCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  staffCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  staffInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffCardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  staffCardDetails: {},
  staffCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  staffCardRole: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  staffStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  staffStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  staffMetrics: {
    flexDirection: 'row',
  },
  staffMetric: {
    flex: 1,
    alignItems: 'center',
  },
  staffMetricValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  staffMetricLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  topServicesCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  topServiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  serviceRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceItemIcon: {
    fontSize: 18,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceItemName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  serviceCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  serviceRevenue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.green,
  },
  serviceDivider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
  },
});
