import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';

interface StepWizardProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  onNext?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  isNextDisabled?: boolean;
  isSubmitting?: boolean;
  showNavigation?: boolean;
}

export function StepWizard({
  currentStep,
  totalSteps,
  stepTitles,
  onNext,
  onBack,
  nextLabel = 'Next',
  isNextDisabled = false,
  isSubmitting = false,
  showNavigation = true,
}: StepWizardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <Text style={styles.stepLabel}>
          Step {currentStep} of {totalSteps}: {stepTitles[currentStep - 1]}
        </Text>
        <View style={styles.dotsContainer}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <View key={i} style={styles.dotWrapper}>
              <View style={[
                styles.dot,
                i + 1 <= currentStep && styles.dotActive,
                i + 1 < currentStep && styles.dotCompleted,
              ]}>
                {i + 1 < currentStep ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : (
                  <Text style={[
                    styles.dotNumber,
                    i + 1 <= currentStep && styles.dotNumberActive,
                  ]}>
                    {i + 1}
                  </Text>
                )}
              </View>
              {i < totalSteps - 1 && (
                <View style={[
                  styles.line,
                  i + 1 < currentStep && styles.lineActive,
                ]} />
              )}
            </View>
          ))}
        </View>
      </View>

      {showNavigation && (
        <View style={styles.navigation}>
          {currentStep > 1 && (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={onBack}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            onPress={onNext}
            disabled={isNextDisabled || isSubmitting}
            activeOpacity={0.8}
            style={styles.nextButtonWrapper}
          >
            <LinearGradient
              colors={isNextDisabled ? GRADIENTS.disabled : GRADIENTS.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButton}
            >
              <Text style={styles.nextButtonText}>
                {isSubmitting ? 'Please wait...' : nextLabel}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export function StepIndicator({ 
  currentStep, 
  totalSteps 
}: { 
  currentStep: number; 
  totalSteps: number;
}) {
  return (
    <View style={styles.indicatorContainer}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <View key={i} style={styles.indicatorWrapper}>
          <View style={[
            styles.indicatorDot,
            i + 1 <= currentStep && styles.indicatorDotActive,
            i + 1 < currentStep && styles.indicatorDotCompleted,
          ]}>
            {i + 1 < currentStep ? (
              <Text style={styles.indicatorCheck}>✓</Text>
            ) : (
              <Text style={[
                styles.indicatorNumber,
                i + 1 <= currentStep && styles.indicatorNumberActive,
              ]}>
                {i + 1}
              </Text>
            )}
          </View>
          {i < totalSteps - 1 && (
            <View style={[
              styles.indicatorLine,
              i + 1 < currentStep && styles.indicatorLineActive,
            ]} />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.lg,
  },
  progressContainer: {
    gap: SPACING.md,
  },
  stepLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotActive: {
    borderColor: COLORS.violet,
    backgroundColor: COLORS.violet,
  },
  dotCompleted: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  dotNumber: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  dotNumberActive: {
    color: COLORS.white,
  },
  checkmark: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.white,
  },
  line: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: SPACING.xs,
  },
  lineActive: {
    backgroundColor: COLORS.green,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  backButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  backButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  nextButtonWrapper: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  nextButton: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorDotActive: {
    borderColor: COLORS.violet,
    backgroundColor: COLORS.violet,
  },
  indicatorDotCompleted: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  indicatorNumber: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  indicatorNumberActive: {
    color: COLORS.white,
  },
  indicatorCheck: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.white,
  },
  indicatorLine: {
    width: 32,
    height: 2,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: SPACING.xs,
  },
  indicatorLineActive: {
    backgroundColor: COLORS.green,
  },
});
