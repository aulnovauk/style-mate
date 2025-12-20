import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { firebaseAuth } from '../services/firebaseAuth';
import { useKeyboard } from '@/hooks/useKeyboard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COUNTRIES = [
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', minLength: 10, maxLength: 10 },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', minLength: 10, maxLength: 10 },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', minLength: 10, maxLength: 10 },
  { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪', minLength: 9, maxLength: 9 },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', minLength: 8, maxLength: 8 },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', minLength: 9, maxLength: 9 },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', minLength: 10, maxLength: 10 },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', minLength: 10, maxLength: 11 },
];

interface FloatingOrbProps {
  delay: number;
  duration: number;
  size: number;
  startX: number;
  startY: number;
  color: string;
}

function FloatingOrb({ delay, duration, size, startX, startY, color }: FloatingOrbProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.sequence([
              Animated.timing(translateY, {
                toValue: -30,
                duration: duration,
                useNativeDriver: true,
              }),
              Animated.timing(translateY, {
                toValue: 0,
                duration: duration,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(translateX, {
                toValue: 15,
                duration: duration * 1.2,
                useNativeDriver: true,
              }),
              Animated.timing(translateX, {
                toValue: 0,
                duration: duration * 1.2,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(opacity, {
                toValue: 0.6,
                duration: duration,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 0.3,
                duration: duration,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ])
      ).start();
    };
    animate();
  }, []);

  return (
    <Animated.View
      style={[
        styles.floatingOrb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left: startX,
          top: startY,
          backgroundColor: color,
          transform: [{ translateY }, { translateX }],
          opacity,
        },
      ]}
    />
  );
}

function SparkleIcon({ style }: { style?: any }) {
  return (
    <View style={[styles.sparkle, style]}>
      <Text style={styles.sparkleText}>✦</Text>
    </View>
  );
}

export default function MobileVerificationScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const keyboardOpen = useKeyboard();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const logoRotateInterpolate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-3deg', '3deg'],
  });

  const validatePhoneNumber = (number: string): boolean => {
    const len = number.length;
    return len >= selectedCountry.minLength && len <= selectedCountry.maxLength;
  };

  const handleRequestOTP = async () => {
    setErrors(null);

    if (!validatePhoneNumber(phoneNumber)) {
      setErrors(`Please enter a valid ${selectedCountry.minLength}-digit mobile number`);
      return;
    }

    setIsLoading(true);
    const fullPhone = `${selectedCountry.dialCode}${phoneNumber}`;
    console.log('Mobile Number :', fullPhone);
    try {
      const result = await firebaseAuth.sendOTP(fullPhone);
      
      if (result.success) {
        router.push({
          pathname: '/onboarding/otp-verification',
          params: { phoneNumber: fullPhone },
        });
      } else {
        Alert.alert('Error', result.error || 'Failed to send OTP. Please try again.');
      }
    } catch (error: any) {
      console.error('OTP request failed:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to send OTP. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.heroSection}>
        <LinearGradient
          colors={['#0F0C29', '#302B63', '#24243E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        />
        
        <FloatingOrb delay={0} duration={2500} size={120} startX={-40} startY={60} color="rgba(139, 92, 246, 0.15)" />
        <FloatingOrb delay={500} duration={3000} size={80} startX={SCREEN_WIDTH - 60} startY={100} color="rgba(236, 72, 153, 0.15)" />
        <FloatingOrb delay={1000} duration={2800} size={60} startX={SCREEN_WIDTH / 2 - 30} startY={20} color="rgba(6, 182, 212, 0.12)" />
        <FloatingOrb delay={300} duration={3200} size={40} startX={60} startY={180} color="rgba(139, 92, 246, 0.2)" />
        <FloatingOrb delay={800} duration={2600} size={50} startX={SCREEN_WIDTH - 100} startY={200} color="rgba(236, 72, 153, 0.18)" />
        
        <SparkleIcon style={{ position: 'absolute', top: 50, left: 30, opacity: 0.6 }} />
        <SparkleIcon style={{ position: 'absolute', top: 80, right: 50, opacity: 0.4 }} />
        <SparkleIcon style={{ position: 'absolute', top: 150, left: SCREEN_WIDTH / 2 + 60, opacity: 0.5 }} />

        <Animated.View 
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: logoScale },
                { rotate: logoRotateInterpolate },
              ],
            },
          ]}
        >
          <View style={styles.logoOuter}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
              style={styles.logoGlow}
            />
            <View style={styles.logoCircle}>
              <LinearGradient
                colors={['#8B5CF6', '#EC4899', '#06B6D4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <Text style={styles.logoText}>SM</Text>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Text style={styles.welcomeTitle}>Welcome to Stylemate</Text>
          <Text style={styles.welcomeSubtitle}>Your premium beauty & wellness destination</Text>
        </Animated.View>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        
        <Animated.View 
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Let's Get Started</Text>
            <Text style={styles.subtitle}>Enter your mobile number to continue</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputSection}>
              <Text style={styles.label}>Mobile Number</Text>
              <View style={[
                styles.phoneInputRow,
                isFocused && styles.phoneInputRowFocused,
              ]}>
                <TouchableOpacity 
                  style={styles.countrySelector}
                  onPress={() => setShowCountryPicker(true)}
                  disabled={isLoading}
                >
                  <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                  <Text style={styles.countryDialCode}>{selectedCountry.dialCode}</Text>
                  <Ionicons name="chevron-down" size={14} color="#8B5CF6" />
                </TouchableOpacity>
                
                <View style={styles.inputDivider} />
                
                <TextInput
                  style={styles.phoneInput}
                  placeholder={`Enter ${selectedCountry.minLength} digit number`}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  maxLength={selectedCountry.maxLength}
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text.replace(/[^0-9]/g, ''));
                    setErrors(null);
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  editable={!isLoading}
                />
              </View>
              {errors && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  <Text style={styles.errorText}>{errors}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={handleRequestOTP}
              disabled={isLoading || phoneNumber.length < selectedCountry.minLength}
              style={styles.buttonContainer}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={phoneNumber.length >= selectedCountry.minLength 
                  ? ['#8B5CF6', '#EC4899'] 
                  : ['#D1D5DB', '#9CA3AF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>Request OTP</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {!keyboardOpen && (
            <View style={styles.footer}>
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Secure & Private</Text>
                <View style={styles.dividerLine} />
              </View>
              <Text style={styles.termsText}>
                By continuing, you agree to our{'\n'}
                <Text style={styles.termsLink}>Terms of Services</Text>,{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text> &{' '}
                <Text style={styles.termsLink}>Content Policy</Text>.
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
      
      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity 
                onPress={() => setShowCountryPicker(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    selectedCountry.code === item.code && styles.countryItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedCountry(item);
                    setPhoneNumber('');
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={styles.countryItemFlag}>{item.flag}</Text>
                  <View style={styles.countryItemInfo}>
                    <Text style={styles.countryItemName}>{item.name}</Text>
                    <Text style={styles.countryItemDialCode}>{item.dialCode}</Text>
                  </View>
                  {selectedCountry.code === item.code && (
                    <Ionicons name="checkmark-circle" size={22} color="#8B5CF6" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0C29',
  },
  heroSection: {
    height: '48%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    overflow: 'hidden',
  },
  heroGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  floatingOrb: {
    position: 'absolute',
  },
  sparkle: {
    position: 'absolute',
  },
  sparkleText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  logoContainer: {
    marginBottom: 28,
    position: 'relative',
    zIndex: 20,
  },
  logoOuter: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  logoCircle: {
    width: 100,
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 50,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  logoGradient: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  welcomeSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -36,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 24,
    position: 'relative',
    zIndex: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  formContainer: {
    flex: 1,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    letterSpacing: 0.1,
  },
  form: {
    flex: 1,
    gap: 20,
  },
  inputSection: {
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  phoneInputRowFocused: {
    borderColor: '#8B5CF6',
    backgroundColor: '#FAF5FF',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  countryFlag: {
    fontSize: 22,
  },
  countryDialCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  inputDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E7EB',
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },
  buttonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
    marginTop: 8,
  },
  button: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
    gap: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  termsLink: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '65%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 4,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  countryItemSelected: {
    backgroundColor: '#FAF5FF',
  },
  countryItemFlag: {
    fontSize: 28,
  },
  countryItemInfo: {
    flex: 1,
  },
  countryItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  countryItemDialCode: {
    fontSize: 14,
    color: '#6B7280',
  },
});
