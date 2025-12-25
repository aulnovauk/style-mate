import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from '../../constants/theme';
import { useSettings } from '@stylemate/core/hooks/useBusinessApi';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: string[];
  isEditable: boolean;
}

const PERMISSIONS: Permission[] = [
  { id: 'view_calendar', name: 'View Calendar', description: 'See appointments and bookings', category: 'Calendar' },
  { id: 'manage_bookings', name: 'Manage Bookings', description: 'Create, edit, cancel appointments', category: 'Calendar' },
  { id: 'view_clients', name: 'View Clients', description: 'Access client list and profiles', category: 'Clients' },
  { id: 'manage_clients', name: 'Manage Clients', description: 'Add, edit, delete clients', category: 'Clients' },
  { id: 'view_services', name: 'View Services', description: 'See service catalog and prices', category: 'Services' },
  { id: 'manage_services', name: 'Manage Services', description: 'Add, edit, delete services', category: 'Services' },
  { id: 'process_payments', name: 'Process Payments', description: 'Handle checkout and POS', category: 'Payments' },
  { id: 'view_reports', name: 'View Reports', description: 'Access business analytics', category: 'Reports' },
  { id: 'manage_team', name: 'Manage Team', description: 'Add, edit staff members', category: 'Team' },
  { id: 'manage_payroll', name: 'Manage Payroll', description: 'Process salaries and commissions', category: 'Team' },
  { id: 'manage_settings', name: 'Manage Settings', description: 'Edit business settings', category: 'Settings' },
  { id: 'manage_inventory', name: 'Manage Inventory', description: 'Stock and product management', category: 'Inventory' },
];

const DEFAULT_ROLES: Role[] = [
  {
    id: 'owner',
    name: 'Owner',
    description: 'Full access to all features',
    color: '#8B5CF6',
    permissions: PERMISSIONS.map(p => p.id),
    isEditable: false,
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Manage operations and team',
    color: '#22C55E',
    permissions: [
      'view_calendar', 'manage_bookings', 'view_clients', 'manage_clients',
      'view_services', 'process_payments', 'view_reports', 'manage_team',
    ],
    isEditable: true,
  },
  {
    id: 'senior_stylist',
    name: 'Senior Stylist',
    description: 'Full service access with payments',
    color: '#F59E0B',
    permissions: [
      'view_calendar', 'manage_bookings', 'view_clients', 'manage_clients',
      'view_services', 'process_payments',
    ],
    isEditable: true,
  },
  {
    id: 'stylist',
    name: 'Stylist',
    description: 'Standard service provider access',
    color: '#3B82F6',
    permissions: [
      'view_calendar', 'manage_bookings', 'view_clients', 'view_services',
    ],
    isEditable: true,
  },
  {
    id: 'receptionist',
    name: 'Receptionist',
    description: 'Front desk and booking management',
    color: '#EC4899',
    permissions: [
      'view_calendar', 'manage_bookings', 'view_clients', 'manage_clients',
      'view_services', 'process_payments',
    ],
    isEditable: true,
  },
];

export default function AccessControlScreen() {
  const router = useRouter();
  const { data: settings, isLoading } = useSettings();
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const togglePermission = (roleId: string, permissionId: string) => {
    setRoles(prev => prev.map(role => {
      if (role.id !== roleId || !role.isEditable) return role;
      const hasPermission = role.permissions.includes(permissionId);
      return {
        ...role,
        permissions: hasPermission
          ? role.permissions.filter(p => p !== permissionId)
          : [...role.permissions, permissionId],
      };
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setHasChanges(false);
    setSaving(false);
    Alert.alert(
      'Coming Soon', 
      'Role permissions will be saved when backend integration is complete. Changes are currently preview-only.'
    );
  };

  const getPermissionsByCategory = () => {
    const categories: Record<string, Permission[]> = {};
    PERMISSIONS.forEach(p => {
      if (!categories[p.category]) categories[p.category] = [];
      categories[p.category].push(p);
    });
    return categories;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
          <Text style={styles.loadingText}>Loading access settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = settings?.isOwner ?? false;

  if (!isOwner) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Access Control</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.restrictedContainer}>
          <Text style={styles.restrictedIcon}>🔒</Text>
          <Text style={styles.restrictedTitle}>Owner Access Only</Text>
          <Text style={styles.restrictedSubtitle}>
            Only salon owners can manage staff permissions. Contact your salon owner for changes.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const activeRole = roles.find(r => r.id === selectedRole);
  const permissionsByCategory = getPermissionsByCategory();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Access Control</Text>
        <TouchableOpacity 
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={[styles.saveButtonText, !hasChanges && styles.saveButtonTextDisabled]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.infoCard, { borderLeftWidth: 4, borderLeftColor: COLORS.amber }]}>
          <Text style={styles.infoIcon}>🚧</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Preview Mode</Text>
            <Text style={styles.infoText}>
              Role-based access control is in development. Preview the interface below - changes won't be saved yet.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Select Role to Edit</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.rolesScroll}
          contentContainerStyle={styles.rolesContainer}
        >
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={[
                styles.roleChip,
                selectedRole === role.id && styles.roleChipSelected,
                { borderColor: role.color },
              ]}
              onPress={() => setSelectedRole(role.id)}
            >
              <View style={[styles.roleDot, { backgroundColor: role.color }]} />
              <View>
                <Text style={[
                  styles.roleChipName,
                  selectedRole === role.id && styles.roleChipNameSelected
                ]}>{role.name}</Text>
                <Text style={styles.roleChipCount}>
                  {role.permissions.length} permissions
                </Text>
              </View>
              {!role.isEditable && (
                <Text style={styles.lockIcon}>🔒</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {activeRole ? (
          <View style={styles.permissionsSection}>
            <View style={styles.roleHeader}>
              <View style={[styles.roleBadge, { backgroundColor: activeRole.color }]}>
                <Text style={styles.roleBadgeText}>{activeRole.name}</Text>
              </View>
              {!activeRole.isEditable && (
                <Text style={styles.readOnlyBadge}>Read-only</Text>
              )}
            </View>
            <Text style={styles.roleDescription}>{activeRole.description}</Text>

            {Object.entries(permissionsByCategory).map(([category, permissions]) => (
              <View key={category} style={styles.categoryCard}>
                <Text style={styles.categoryTitle}>{category}</Text>
                {permissions.map((permission, index) => {
                  const hasPermission = activeRole.permissions.includes(permission.id);
                  return (
                    <View key={permission.id}>
                      {index > 0 && <View style={styles.divider} />}
                      <View style={styles.permissionRow}>
                        <View style={styles.permissionInfo}>
                          <Text style={styles.permissionName}>{permission.name}</Text>
                          <Text style={styles.permissionDescription}>{permission.description}</Text>
                        </View>
                        <Switch
                          value={hasPermission}
                          onValueChange={() => togglePermission(activeRole.id, permission.id)}
                          trackColor={{ false: COLORS.cardBorder, true: COLORS.success }}
                          thumbColor={COLORS.white}
                          disabled={!activeRole.isEditable}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👆</Text>
            <Text style={styles.emptyText}>Select a role above to view and edit permissions</Text>
          </View>
        )}

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionText}>Create Custom Role</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionText}>View Staff Assignments</Text>
          </TouchableOpacity>
        </View>
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
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
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
    fontSize: 24,
    color: COLORS.white,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
  saveButton: {
    backgroundColor: COLORS.violet,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 70,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.cardBorder,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: FONT_SIZES.md,
  },
  saveButtonTextDisabled: {
    color: COLORS.textMuted,
  },
  placeholder: {
    width: 70,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rolesScroll: {
    marginBottom: SPACING.lg,
  },
  rolesContainer: {
    gap: SPACING.md,
    paddingRight: SPACING.lg,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 2,
    minWidth: 150,
  },
  roleChipSelected: {
    backgroundColor: COLORS.background,
  },
  roleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.md,
  },
  roleChipName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 2,
  },
  roleChipNameSelected: {
    color: COLORS.white,
  },
  roleChipCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  lockIcon: {
    fontSize: 14,
    marginLeft: SPACING.sm,
  },
  permissionsSection: {
    marginTop: SPACING.md,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  roleBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  roleBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.white,
  },
  readOnlyBadge: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginLeft: SPACING.md,
    fontStyle: 'italic',
  },
  roleDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  categoryCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  categoryTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SPACING.md,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permissionInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  permissionName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.white,
    marginBottom: 2,
  },
  permissionDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  emptyState: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xxl,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: SPACING.sm,
  },
  actionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  restrictedIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  restrictedTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  restrictedSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
