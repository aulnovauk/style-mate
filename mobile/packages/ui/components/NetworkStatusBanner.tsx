import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useTheme } from '../contexts/ThemeContext';

interface NetworkStatusBannerProps {
  showOnlineStatus?: boolean;
  onRetry?: () => void;
}

export function NetworkStatusBanner({ 
  showOnlineStatus = false,
  onRetry 
}: NetworkStatusBannerProps) {
  const { isConnected, isInternetReachable, refresh } = useNetworkStatus();
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(-60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const isOffline = !isConnected || isInternetReachable === false;

  useEffect(() => {
    if (isOffline) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -60,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOffline, slideAnim, opacityAnim]);

  const handleRetry = async () => {
    await refresh();
    if (onRetry) {
      onRetry();
    }
  };

  if (!isOffline && !showOnlineStatus) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isOffline ? colors.error : colors.success,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name={isOffline ? 'cloud-offline-outline' : 'cloud-done-outline'}
          size={20}
          color={colors.textInverse}
          style={styles.icon}
        />
        <Text style={[styles.text, { color: colors.textInverse }]}>
          {isOffline
            ? "You're offline. Some features may be limited."
            : "You're back online!"}
        </Text>
      </View>
      {isOffline && (
        <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
          <Ionicons name="refresh" size={18} color={colors.textInverse} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  retryButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default NetworkStatusBanner;
