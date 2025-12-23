import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeMode } from '../contexts/ThemeContext';
import { haptic } from '../utils/haptics';

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  showChevron?: boolean;
  destructive?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  value,
  onPress,
  onToggle,
  showChevron = true,
  destructive = false,
}) => {
  const { colors } = useTheme();
  
  const handlePress = () => {
    haptic.light();
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
      onPress={handlePress}
      disabled={!onPress && !onToggle}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: destructive ? colors.errorLight : colors.primaryLight + '20' }]}>
        <Ionicons
          name={icon as any}
          size={20}
          color={destructive ? colors.error : colors.primary}
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: destructive ? colors.error : colors.text }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {onToggle ? (
        <Switch
          value={value}
          onValueChange={(newValue) => {
            haptic.light();
            onToggle(newValue);
          }}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={value ? colors.textInverse : colors.textTertiary}
        />
      ) : showChevron ? (
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      ) : null}
    </TouchableOpacity>
  );
};

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, themeMode, setThemeMode, isDark, colors } = useTheme();
  
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    sms: false,
    promotions: true,
  });

  const handleThemeChange = useCallback(() => {
    haptic.medium();
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    const currentIndex = modes.indexOf(themeMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setThemeMode(nextMode);
  }, [themeMode, setThemeMode]);

  const getThemeLabel = useCallback(() => {
    switch (themeMode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return 'System';
    }
  }, [themeMode]);

  const handleNotificationToggle = useCallback((key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => {
            haptic.light();
            router.back();
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Appearance
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <SettingItem
            icon="color-palette-outline"
            title="Theme"
            subtitle={`Current: ${getThemeLabel()}${themeMode === 'system' ? ` (${isDark ? 'Dark' : 'Light'})` : ''}`}
            onPress={handleThemeChange}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Notifications
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <SettingItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Receive booking updates and reminders"
            value={notifications.push}
            onToggle={() => handleNotificationToggle('push')}
          />
          <SettingItem
            icon="mail-outline"
            title="Email Notifications"
            subtitle="Booking confirmations and receipts"
            value={notifications.email}
            onToggle={() => handleNotificationToggle('email')}
          />
          <SettingItem
            icon="chatbubble-outline"
            title="SMS Notifications"
            subtitle="Important updates via SMS"
            value={notifications.sms}
            onToggle={() => handleNotificationToggle('sms')}
          />
          <SettingItem
            icon="megaphone-outline"
            title="Promotional Offers"
            subtitle="Deals and special discounts"
            value={notifications.promotions}
            onToggle={() => handleNotificationToggle('promotions')}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Account
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <SettingItem
            icon="person-outline"
            title="Edit Profile"
            onPress={() => router.push('/edit-profile')}
          />
          <SettingItem
            icon="card-outline"
            title="Payment Methods"
            onPress={() => router.push('/saved-cards')}
          />
          <SettingItem
            icon="location-outline"
            title="Saved Addresses"
            onPress={() => {}}
          />
          <SettingItem
            icon="language-outline"
            title="Language"
            subtitle="English"
            onPress={() => router.push('/language')}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Support
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <SettingItem
            icon="help-circle-outline"
            title="Help & Support"
            onPress={() => router.push('/help-support')}
          />
          <SettingItem
            icon="document-text-outline"
            title="Terms of Service"
            onPress={() => {}}
          />
          <SettingItem
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            onPress={() => {}}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Danger Zone
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <SettingItem
            icon="log-out-outline"
            title="Log Out"
            onPress={() => router.push('/profile')}
            destructive
            showChevron={false}
          />
          <SettingItem
            icon="trash-outline"
            title="Delete Account"
            subtitle="Permanently delete your account and data"
            onPress={() => {}}
            destructive
            showChevron={false}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.version, { color: colors.textTertiary }]}>
            Stylemate v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  section: {
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  version: {
    fontSize: 12,
  },
});
