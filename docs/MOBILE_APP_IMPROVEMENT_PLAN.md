# Stylemate Mobile App - Improvement Plan

## Document Version
- **Version:** 1.0
- **Created:** December 2024
- **Status:** Planning Phase

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Improvement Categories](#improvement-categories)
4. [Phase 1: Responsiveness & Layout](#phase-1-responsiveness--layout)
5. [Phase 2: Performance Optimization](#phase-2-performance-optimization)
6. [Phase 3: Offline & Resilience](#phase-3-offline--resilience)
7. [Phase 4: User Experience](#phase-4-user-experience)
8. [Phase 5: Security & Production Readiness](#phase-5-security--production-readiness)
9. [Implementation Timeline](#implementation-timeline)
10. [Testing Strategy](#testing-strategy)

---

## Executive Summary

This document outlines a comprehensive improvement plan for the Stylemate mobile application built with React Native (Expo). The improvements follow industry best practices and are designed to enhance user experience, performance, reliability, and maintainability.

### Key Objectives
- Ensure consistent UI across all device sizes and orientations
- Optimize app performance for smooth 60fps interactions
- Implement robust offline support for unreliable network conditions
- Enhance security for payment and authentication flows
- Prepare for production-grade deployment

---

## Current State Analysis

### Technology Stack
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React Native | 0.74.5 |
| Build System | Expo | ~51.0.0 |
| Navigation | expo-router | ~3.5.0 |
| State Management | React Query | ^5.90.11 |
| Storage | Async Storage + Secure Store | Latest |
| Animation | Reanimated | ~3.10.1 |

### Current Features
- User authentication (phone OTP)
- Salon discovery with GPS location
- Service booking with calendar
- Payment integration (Razorpay)
- Gift cards and wallet
- Push notifications
- Real-time chat

### Identified Gaps
1. **Responsiveness**: Fixed dimensions, no tablet optimization
2. **Performance**: Non-virtualized lists, missing memoization
3. **Offline**: Limited offline data persistence
4. **Accessibility**: Missing a11y labels and screen reader support
5. **Error Handling**: Generic error messages, no retry mechanisms
6. **Analytics**: No user behavior tracking
7. **Monitoring**: No crash reporting or performance monitoring

---

## Phase 1: Responsiveness & Layout

### 1.1 Dynamic Screen Dimensions

**Problem:** Using `Dimensions.get('window')` at module level doesn't update on orientation change or window resize.

**Solution:**
```typescript
// Before (problematic)
const { width } = Dimensions.get('window');

// After (recommended)
import { useWindowDimensions } from 'react-native';

const MyComponent = () => {
  const { width, height } = useWindowDimensions();
  // Component re-renders on dimension change
};
```

**Files to Update:**
- `mobile/src/screens/HomeScreen.tsx`
- `mobile/src/screens/SalonDetailScreen.tsx`
- `mobile/src/screens/BookingDetailScreen.tsx`
- `mobile/src/screens/CheckoutScreen.tsx`
- `mobile/src/components/SalonCard.tsx`
- `mobile/src/components/OfferCard.tsx`

### 1.2 Responsive Breakpoints

**Implementation:**
```typescript
// utils/responsive.ts
import { useWindowDimensions } from 'react-native';

export const BREAKPOINTS = {
  phone: 0,
  phoneWide: 480,
  tablet: 768,
  tabletWide: 1024,
} as const;

export function useBreakpoint() {
  const { width } = useWindowDimensions();
  
  if (width >= BREAKPOINTS.tabletWide) return 'tabletWide';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  if (width >= BREAKPOINTS.phoneWide) return 'phoneWide';
  return 'phone';
}

export function useResponsiveValue<T>(values: {
  phone: T;
  phoneWide?: T;
  tablet?: T;
  tabletWide?: T;
}): T {
  const breakpoint = useBreakpoint();
  return values[breakpoint] ?? values.phone;
}
```

**Use Cases:**
| Screen Size | Grid Columns | Card Width | Font Scale |
|-------------|--------------|------------|------------|
| Phone (<480) | 1 | 100% | 1.0 |
| Phone Wide (480-767) | 2 | 48% | 1.0 |
| Tablet (768-1023) | 3 | 31% | 1.1 |
| Tablet Wide (1024+) | 4 | 23% | 1.2 |

### 1.3 Safe Area Handling

**Problem:** Content can overlap with notches, status bars, and home indicators.

**Solution:**
```typescript
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const Screen = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ 
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }}>
      {/* Content */}
    </View>
  );
};
```

### 1.4 Orientation Support

**app.json Update:**
```json
{
  "expo": {
    "orientation": "default", // Allow both portrait and landscape
    "ios": {
      "supportsTablet": true,
      "requireFullScreen": false
    }
  }
}
```

**Corner Cases:**
- [ ] Keyboard overlapping inputs in landscape
- [ ] Modal positioning in landscape
- [ ] Image aspect ratios on rotation
- [ ] Tab bar visibility in landscape

---

## Phase 2: Performance Optimization

### 2.1 List Virtualization

**Problem:** Using `ScrollView` with many items causes memory issues and jank.

**Solution:** Migrate to `@shopify/flash-list` (already installed).

```typescript
// Before
<ScrollView>
  {salons.map(salon => <SalonCard key={salon.id} {...salon} />)}
</ScrollView>

// After
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={salons}
  renderItem={({ item }) => <SalonCard {...item} />}
  estimatedItemSize={200}
  keyExtractor={(item) => item.id}
/>
```

**Files to Migrate:**
| File | List Type | Priority |
|------|-----------|----------|
| HomeScreen.tsx | Salon grid | High |
| SalonDetailScreen.tsx | Services list | High |
| BookingDetailScreen.tsx | Time slots | Medium |
| OrdersListScreen.tsx | Orders list | Medium |
| NotificationsScreen.tsx | Notifications | Medium |

### 2.2 Memoization Strategy

**Components to Memoize:**
```typescript
// Expensive list items
export const SalonCard = React.memo(({ salon, onPress }) => {
  // Component code
});

// Expensive computations
const sortedServices = useMemo(() => {
  return services.sort((a, b) => a.price - b.price);
}, [services]);

// Callback stability
const handlePress = useCallback(() => {
  navigation.navigate('Salon', { id: salon.id });
}, [salon.id]);
```

### 2.3 Image Optimization

**Current:** Using `expo-image` (good choice)

**Enhancements:**
```typescript
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  contentFit="cover"
  placeholder={blurhash}
  transition={300}
  cachePolicy="memory-disk"
  recyclingKey={imageUrl}
/>
```

**Best Practices:**
- Use WebP format for smaller file sizes
- Implement progressive loading with blurhash
- Set appropriate cache policies
- Use `recyclingKey` for list items

### 2.4 Bundle Size Optimization

**Current Analysis Needed:**
```bash
npx expo-doctor
npx expo export --analyze
```

**Recommendations:**
- Tree-shake unused icon sets
- Lazy load heavy screens
- Code split by route

---

## Phase 3: Offline & Resilience

### 3.1 Offline Data Strategy

**Cache Layers:**
| Layer | Technology | TTL | Use Case |
|-------|------------|-----|----------|
| Memory | React Query | 5 min | Active session |
| Disk | AsyncStorage | 24 hrs | App restarts |
| Permanent | SQLite | Forever | User data |

**Implementation:**
```typescript
// Already have OfflineQueryProvider - enhance it
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 24 * 60 * 60 * 1000, // 24 hours
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      networkMode: 'offlineFirst',
    },
  },
});
```

### 3.2 Network Status UI

**Component:**
```typescript
// components/NetworkStatusBanner.tsx
export function NetworkStatusBanner() {
  const { isConnected } = useNetworkStatus();
  
  if (isConnected) return null;
  
  return (
    <Animated.View style={styles.banner}>
      <Text>You're offline. Some features may be limited.</Text>
    </Animated.View>
  );
}
```

### 3.3 Optimistic Updates

**Use Cases:**
- [ ] Adding items to cart
- [ ] Updating profile information
- [ ] Toggling favorites
- [ ] Marking notifications as read

**Implementation Pattern:**
```typescript
const mutation = useMutation({
  mutationFn: updateProfile,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['profile'] });
    const previous = queryClient.getQueryData(['profile']);
    queryClient.setQueryData(['profile'], (old) => ({ ...old, ...newData }));
    return { previous };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(['profile'], context.previous);
    Alert.alert('Error', 'Failed to update. Please try again.');
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['profile'] });
  },
});
```

### 3.4 Error Boundaries

```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    // Log to crash reporting service
    crashlytics().recordError(error);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}
```

---

## Phase 4: User Experience

### 4.1 Dark Mode Support

**Implementation Steps:**
1. Create theme context
2. Define light/dark color schemes
3. Update all hardcoded colors
4. Persist preference

**Theme Structure:**
```typescript
// themes/colors.ts
export const lightTheme = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  primary: '#8B5CF6',
  secondary: '#EC4899',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
};

export const darkTheme = {
  background: '#0F172A',
  surface: '#1E293B',
  primary: '#A78BFA',
  secondary: '#F472B6',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: '#334155',
  error: '#F87171',
  success: '#34D399',
};
```

### 4.2 Haptic Feedback

**Use Cases:**
| Action | Haptic Type |
|--------|-------------|
| Button press | Light |
| Toggle switch | Medium |
| Error | Error notification |
| Success | Success notification |
| Pull to refresh | Light |

**Implementation:**
```typescript
import * as Haptics from 'expo-haptics';

const handlePress = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  // Action
};
```

### 4.3 Skeleton Loading

**Already Implemented:** `SkeletonLoader.tsx` exists

**Enhancements:**
- Add shimmer animation
- Create component-specific skeletons
- Match exact layout of loaded content

### 4.4 Pull-to-Refresh Enhancement

```typescript
<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={['#8B5CF6']} // Android
      tintColor="#8B5CF6" // iOS
      progressViewOffset={20}
    />
  }
>
```

### 4.5 Empty States

**Create consistent empty state components:**
```typescript
// components/EmptyState.tsx
export function EmptyState({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}) {
  return (
    <View style={styles.container}>
      <Image source={icon} style={styles.icon} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && (
        <Button onPress={onAction}>{actionLabel}</Button>
      )}
    </View>
  );
}
```

### 4.6 Accessibility (a11y)

**Checklist:**
- [ ] All touchable elements have `accessibilityLabel`
- [ ] Images have `accessibilityLabel` or `accessible={false}`
- [ ] Form inputs have `accessibilityHint`
- [ ] Buttons have `accessibilityRole="button"`
- [ ] Minimum touch target size: 44x44 points
- [ ] Color contrast ratio: 4.5:1 minimum
- [ ] Screen reader navigation order is logical

---

## Phase 5: Security & Production Readiness

### 5.1 Secure Storage

**Already Using:** `expo-secure-store` for tokens

**Enhancements:**
- Encrypt sensitive cached data
- Clear secure storage on logout
- Implement token refresh logic

### 5.2 Biometric Authentication

```typescript
import * as LocalAuthentication from 'expo-local-authentication';

const authenticate = async () => {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  
  if (hasHardware && isEnrolled) {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to continue',
      fallbackLabel: 'Use passcode',
    });
    return result.success;
  }
  return false;
};
```

### 5.3 Certificate Pinning

```typescript
// For high-security API calls
const secureAxios = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  // Certificate pinning handled by native module
});
```

### 5.4 Crash Reporting

**Recommended:** Sentry or Firebase Crashlytics

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  tracesSampleRate: 0.2,
  enableAutoSessionTracking: true,
});
```

### 5.5 Analytics

**Recommended:** Firebase Analytics or Mixpanel

**Key Events to Track:**
| Event | Parameters |
|-------|------------|
| screen_view | screen_name |
| search | query, results_count |
| salon_view | salon_id, source |
| booking_started | salon_id, service_ids |
| booking_completed | booking_id, amount |
| payment_initiated | amount, method |
| payment_completed | booking_id, success |

### 5.6 Deep Linking

**app.json Configuration:**
```json
{
  "expo": {
    "scheme": "stylemate",
    "ios": {
      "associatedDomains": ["applinks:stylemate.in"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [{ "scheme": "https", "host": "stylemate.in" }]
        }
      ]
    }
  }
}
```

**Supported Deep Links:**
| Link | Screen |
|------|--------|
| stylemate://salon/:id | SalonDetailScreen |
| stylemate://booking/:id | BookingDetailScreen |
| stylemate://offer/:id | OfferDetailScreen |
| https://stylemate.in/salon/:id | SalonDetailScreen |

---

## Implementation Timeline

### Sprint 1 (Week 1-2): Foundation
| Task | Priority | Effort |
|------|----------|--------|
| Responsive utilities setup | High | 4 hrs |
| useWindowDimensions migration | High | 8 hrs |
| FlashList migration | High | 8 hrs |
| Theme context setup | Medium | 4 hrs |

### Sprint 2 (Week 3-4): Performance
| Task | Priority | Effort |
|------|----------|--------|
| Memoization audit | High | 8 hrs |
| Image optimization | Medium | 4 hrs |
| Bundle analysis | Medium | 4 hrs |
| Offline enhancements | Medium | 8 hrs |

### Sprint 3 (Week 5-6): UX Polish
| Task | Priority | Effort |
|------|----------|--------|
| Dark mode implementation | Medium | 12 hrs |
| Haptic feedback | Low | 4 hrs |
| Empty states | Medium | 6 hrs |
| Accessibility audit | High | 8 hrs |

### Sprint 4 (Week 7-8): Production
| Task | Priority | Effort |
|------|----------|--------|
| Biometric auth | Medium | 8 hrs |
| Crash reporting | High | 4 hrs |
| Analytics setup | High | 8 hrs |
| Deep linking | Medium | 6 hrs |

---

## Testing Strategy

### Unit Testing
- Jest for utility functions
- React Native Testing Library for components

### Integration Testing
- Detox for E2E flows
- Critical paths: Login → Browse → Book → Pay

### Manual Testing Checklist
- [ ] Test on small phones (iPhone SE, Android small)
- [ ] Test on large phones (iPhone 15 Pro Max, Pixel 8)
- [ ] Test on tablets (iPad, Android tablet)
- [ ] Test portrait and landscape
- [ ] Test with slow network (3G simulation)
- [ ] Test offline scenarios
- [ ] Test with accessibility features enabled
- [ ] Test light and dark mode
- [ ] Test with different font sizes (accessibility)

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| App startup time | TBD | < 2s |
| Screen transition | TBD | < 300ms |
| List scroll FPS | TBD | 60 FPS |
| Crash-free sessions | TBD | > 99.5% |
| App store rating | N/A | > 4.5 |

---

## Appendix

### A. Color Tokens Reference
See `themes/colors.ts`

### B. Typography Scale
| Name | Size | Weight | Line Height |
|------|------|--------|-------------|
| heading1 | 28 | 700 | 36 |
| heading2 | 24 | 600 | 32 |
| heading3 | 20 | 600 | 28 |
| body | 16 | 400 | 24 |
| caption | 14 | 400 | 20 |
| small | 12 | 400 | 16 |

### C. Spacing Scale
| Token | Value |
|-------|-------|
| xs | 4 |
| sm | 8 |
| md | 16 |
| lg | 24 |
| xl | 32 |
| xxl | 48 |

---

*Document maintained by the Stylemate development team.*
