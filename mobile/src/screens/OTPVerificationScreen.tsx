import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { firebaseAuth } from '../services/firebaseAuth';
import { useAuth } from '../contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.sequence([
            Animated.timing(translateY, {
              toValue: -20,
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
            Animated.timing(opacity, {
              toValue: 0.5,
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
          transform: [{ translateY }],
          opacity,
        },
      ]}
    />
  );
}

export default function OTPVerificationScreen() {
  const router = useRouter();
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
  const { login, completeOnboarding } = useAuth();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const inputRefs = useRef<Array<TextInput | null>>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleOTPChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit OTP code');
      return;
    }

    setIsVerifying(true);

    try {
      const result = await firebaseAuth.verifyOTP(otpString);

      if (result.success && result.user && result.accessToken && result.refreshToken) {
        await login(result.user, result.accessToken, result.refreshToken);
        await completeOnboarding();
        router.replace('/(tabs)/at-salon');
      } else {
        Alert.alert('Verification Failed', result.error || 'Invalid OTP. Please try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      console.error('OTP verification failed:', error);
      Alert.alert(
        'Verification Failed',
        error.message || 'Invalid OTP. Please try again.'
      );
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;

    setIsResending(true);

    try {
      const result = await firebaseAuth.resendOTP(phoneNumber);
      if (result.success) {
        setResendTimer(30);
        Alert.alert('OTP Sent', 'A new verification code has been sent to your phone');
      } else {
        Alert.alert('Error', result.error || 'Failed to resend OTP. Please try again.');
      }
    } catch (error: any) {
      console.error('Resend OTP failed:', error);
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const isOTPComplete = otp.every(digit => digit !== '');
  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    const last4 = cleaned.slice(-4);
    const masked = '*'.repeat(Math.max(0, cleaned.length - 4));
    return `${masked}${last4}`;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FDFBFB', '#F5F0FF', '#FDF2F8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />
      
      <FloatingOrb delay={0} duration={2500} size={180} startX={-60} startY={-40} color="rgba(139, 92, 246, 0.08)" />
      <FloatingOrb delay={500} duration={3000} size={120} startX={SCREEN_WIDTH - 80} startY={100} color="rgba(236, 72, 153, 0.08)" />
      <FloatingOrb delay={800} duration={2800} size={100} startX={SCREEN_WIDTH / 2} startY={400} color="rgba(6, 182, 212, 0.06)" />

      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#374151" />
      </TouchableOpacity>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <Ionicons name="shield-checkmark" size={32} color="#fff" />
          </LinearGradient>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Verification Code</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit code to
          </Text>
          <Text style={styles.phoneNumber}>{phoneNumber || formatPhoneDisplay(phoneNumber)}</Text>
        </View>

        <View style={styles.otpSection}>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <View 
                key={index}
                style={[
                  styles.otpInputWrapper,
                  focusedIndex === index && styles.otpInputWrapperFocused,
                  digit && styles.otpInputWrapperFilled,
                ]}
              >
                <TextInput
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(value) => handleOTPChange(value.replace(/[^0-9]/g, ''), index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(null)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              </View>
            ))}
          </View>
          <Text style={styles.otpHint}>
            <Ionicons name="time-outline" size={14} color="#9CA3AF" /> Enter the code to verify
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleVerify}
          disabled={isVerifying || !isOTPComplete}
          style={styles.buttonContainer}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={isOTPComplete ? ['#8B5CF6', '#EC4899'] : ['#E5E7EB', '#D1D5DB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            {isVerifying ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={[styles.buttonText, !isOTPComplete && styles.buttonTextDisabled]}>
                  Verify & Continue
                </Text>
                <Ionicons 
                  name="checkmark-circle" 
                  size={20} 
                  color={isOTPComplete ? "#fff" : "#9CA3AF"} 
                />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.resendSection}>
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={resendTimer > 0 || isResending}
            style={styles.resendButton}
          >
            {isResending ? (
              <ActivityIndicator size="small" color="#8B5CF6" />
            ) : (
              <Text style={[
                styles.resendButtonText, 
                resendTimer > 0 && styles.resendButtonTextDisabled
              ]}>
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <View style={styles.securityBadge}>
            <Ionicons name="lock-closed" size={14} color="#10B981" />
            <Text style={styles.securityText}>End-to-end encrypted</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backgroundGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  floatingOrb: {
    position: 'absolute',
  },
  backButton: {
    position: 'absolute',
    top: 56,
    left: 20,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 120,
    paddingBottom: 32,
    position: 'relative',
    zIndex: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  otpSection: {
    marginBottom: 32,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  otpInputWrapper: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  otpInputWrapperFocused: {
    borderColor: '#8B5CF6',
    backgroundColor: '#FAF5FF',
  },
  otpInputWrapperFilled: {
    borderColor: '#8B5CF6',
    backgroundColor: '#FAF5FF',
  },
  otpInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  otpHint: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 32,
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
  buttonTextDisabled: {
    color: '#9CA3AF',
  },
  resendSection: {
    alignItems: 'center',
    gap: 12,
  },
  resendText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  resendButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  resendButtonText: {
    color: '#8B5CF6',
    fontSize: 15,
    fontWeight: '600',
  },
  resendButtonTextDisabled: {
    color: '#9CA3AF',
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 20,
  },
  securityText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '500',
  },
});
