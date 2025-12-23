import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

interface MenuItemProps {
  icon: string;
  label: string;
  subtitle?: string;
  badge?: string;
  onPress: () => void;
}

function MenuItem({ icon, label, subtitle, badge, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <View style={styles.menuContent}>
        <Text style={styles.menuLabel}>{label}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

export default function MoreScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.salonCard}>
          <View style={styles.salonAvatar}>
            <Text style={styles.salonAvatarText}>ES</Text>
          </View>
          <View style={styles.salonInfo}>
            <Text style={styles.salonName}>Elite Salon & Spa</Text>
            <Text style={styles.salonAddress}>123 Main Street, Mumbai</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.switchText}>Switch</Text>
          </TouchableOpacity>
        </View>

        <MenuSection title="Business">
          <MenuItem icon="📊" label="Analytics" subtitle="Revenue & insights" onPress={() => {}} />
          <MenuItem icon="📦" label="Inventory" subtitle="Stock management" onPress={() => {}} />
          <MenuItem icon="💰" label="Payments" subtitle="Transactions & payouts" badge="3" onPress={() => {}} />
          <MenuItem icon="🎁" label="Promotions" subtitle="Offers & discounts" onPress={() => {}} />
        </MenuSection>

        <MenuSection title="Services">
          <MenuItem icon="✂️" label="Service Menu" subtitle="Manage services & prices" onPress={() => {}} />
          <MenuItem icon="📋" label="Packages" subtitle="Service bundles" onPress={() => {}} />
          <MenuItem icon="🏷️" label="Pricing Rules" subtitle="Dynamic pricing setup" onPress={() => {}} />
        </MenuSection>

        <MenuSection title="Settings">
          <MenuItem icon="🕐" label="Business Hours" subtitle="Opening times" onPress={() => {}} />
          <MenuItem icon="🔔" label="Notifications" subtitle="Alert preferences" onPress={() => {}} />
          <MenuItem icon="🔐" label="Access Control" subtitle="Staff permissions" onPress={() => {}} />
          <MenuItem icon="⚙️" label="App Settings" subtitle="General preferences" onPress={() => {}} />
        </MenuSection>

        <MenuSection title="Support">
          <MenuItem icon="❓" label="Help Center" onPress={() => {}} />
          <MenuItem icon="💬" label="Contact Support" onPress={() => {}} />
          <MenuItem icon="📖" label="Tutorials" onPress={() => {}} />
        </MenuSection>

        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>StylemateBusiness v1.0.0</Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  salonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
  },
  salonAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  salonAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  salonInfo: {
    flex: 1,
  },
  salonName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  salonAddress: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  switchText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    paddingHorizontal: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  menuIcon: {
    fontSize: 22,
    marginRight: 14,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#F8FAFC',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chevron: {
    fontSize: 20,
    color: '#64748B',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#64748B',
    marginTop: 16,
  },
});
