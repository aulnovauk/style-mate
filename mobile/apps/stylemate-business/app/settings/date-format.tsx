import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from '../../constants/theme';
import { useAppPreferences } from '@stylemate/core/hooks/usePreferences';

const DATE_FORMATS = [
  { value: 'dd/mm/yyyy', label: 'DD/MM/YYYY', example: '24/12/2024' },
  { value: 'mm/dd/yyyy', label: 'MM/DD/YYYY', example: '12/24/2024' },
  { value: 'yyyy-mm-dd', label: 'YYYY-MM-DD', example: '2024-12-24' },
  { value: 'dd-mm-yyyy', label: 'DD-MM-YYYY', example: '24-12-2024' },
  { value: 'dd.mm.yyyy', label: 'DD.MM.YYYY', example: '24.12.2024' },
];

export default function DateFormatSettingsScreen() {
  const router = useRouter();
  const { preferences, updatePreference, loading } = useAppPreferences();

  const handleSelect = async (value: string) => {
    const result = await updatePreference('dateFormat', value);
    if (result.success) {
      router.back();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.violet} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Date Format</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.sectionCard}>
          {DATE_FORMATS.map((format, index) => (
            <View key={format.value}>
              {index > 0 && <View style={styles.divider} />}
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => handleSelect(format.value)}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{format.label}</Text>
                  <Text style={styles.optionSubtitle}>Example: {format.example}</Text>
                </View>
                {preferences?.dateFormat === format.value && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
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
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  sectionCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  optionSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  checkmark: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.violet,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginLeft: SPACING.lg,
  },
});
