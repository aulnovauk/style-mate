import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../../constants/theme';
import { AutomationCard } from '../../../components/marketing/AutomationCard';
import { marketingApi, AutomationWorkflow } from '@stylemate/core/services/businessApi';

export default function AutomationsScreen() {
  const [automations, setAutomations] = useState<AutomationWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAutomations = async () => {
    try {
      const response = await marketingApi.getAutomationsList();
      if (response.success && response.data) {
        setAutomations(response.data.automations);
      } else {
        setAutomations(getMockAutomations());
      }
    } catch (err) {
      console.error('Error fetching automations:', err);
      setAutomations(getMockAutomations());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAutomations();
  }, []);

  const handleToggle = async (id: string, isActive: boolean) => {
    setAutomations(prev => 
      prev.map(a => a.id === id ? { ...a, isActive } : a)
    );
    try {
      await marketingApi.toggleAutomation(id);
    } catch (err) {
      console.error('Error toggling automation:', err);
      setAutomations(prev => 
        prev.map(a => a.id === id ? { ...a, isActive: !isActive } : a)
      );
    }
  };

  const handleConfigure = (id: string) => {
    router.push(`/marketing/automations/${id}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.violet} />
      </View>
    );
  }

  const activeCount = automations.filter(a => a.isActive).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Automations</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.violet} />
        }
      >
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🤖</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Automated Marketing</Text>
            <Text style={styles.infoDescription}>
              Set up workflows to automatically send messages based on customer behavior and events.
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{automations.length - activeCount}</Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Workflows</Text>

        {automations.map((automation) => (
          <AutomationCard
            key={automation.id}
            {...automation}
            onToggle={handleToggle}
            onConfigure={handleConfigure}
          />
        ))}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </View>
  );
}

function getMockAutomations(): AutomationWorkflow[] {
  return [
    {
      id: '1',
      type: 'rebook_reminder',
      name: 'Rebook Reminder',
      description: 'Send a reminder to clients who haven\'t booked again after their last appointment.',
      isActive: true,
      trigger: {
        type: 'after_visit',
        value: 14,
        unit: 'days',
      },
      message: 'Hi {name}, it\'s been 2 weeks since your last visit! Book your next appointment and enjoy 10% off.',
      performance: {
        sent30d: 156,
        converted30d: 42,
        conversionRate: 27,
        attributedRevenue: { value: 18900, formatted: '₹18,900' },
      },
    },
    {
      id: '2',
      type: 'birthday',
      name: 'Birthday Offer',
      description: 'Automatically send birthday wishes with a special discount offer.',
      isActive: true,
      trigger: {
        type: 'on_birthday',
        value: 0,
        unit: 'days',
      },
      message: '🎂 Happy Birthday {name}! Celebrate with 20% off on any service this week.',
      performance: {
        sent30d: 23,
        converted30d: 15,
        conversionRate: 65,
        attributedRevenue: { value: 7500, formatted: '₹7,500' },
      },
    },
    {
      id: '3',
      type: 'win_back',
      name: 'Win-Back Campaign',
      description: 'Re-engage clients who haven\'t visited in 60+ days with a special offer.',
      isActive: false,
      trigger: {
        type: 'after_last_visit',
        value: 60,
        unit: 'days',
      },
      message: 'We miss you {name}! Come back and get 25% off your next visit. Valid this month only.',
      performance: {
        sent30d: 0,
        converted30d: 0,
        conversionRate: 0,
        attributedRevenue: { value: 0, formatted: '₹0' },
      },
    },
    {
      id: '4',
      type: 'review_request',
      name: 'Review Request',
      description: 'Ask for reviews after a completed appointment to build social proof.',
      isActive: true,
      trigger: {
        type: 'after_visit',
        value: 24,
        unit: 'hours',
      },
      message: 'Hi {name}, thank you for visiting! We\'d love your feedback. Please leave us a review: {link}',
      performance: {
        sent30d: 234,
        converted30d: 67,
        conversionRate: 29,
        attributedRevenue: { value: 0, formatted: '₹0' },
      },
    },
    {
      id: '5',
      type: 'fill_slow_days',
      name: 'Fill Slow Days',
      description: 'Automatically promote discounts on days with low bookings.',
      isActive: false,
      trigger: {
        type: 'low_occupancy',
        value: 40,
        unit: 'days',
      },
      message: 'Book tomorrow and save! We have special slots available with 15% off.',
      performance: {
        sent30d: 0,
        converted30d: 0,
        conversionRate: 0,
        attributedRevenue: { value: 0, formatted: '₹0' },
      },
    },
  ];
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
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  infoIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  infoDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
});
