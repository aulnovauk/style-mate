import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0F172A' },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth/login" options={{ headerShown: false }} />
            <Stack.Screen name="auth/otp" options={{ headerShown: false }} />
            <Stack.Screen name="auth/register" options={{ headerShown: false }} />
            <Stack.Screen name="auth/salon-select" options={{ headerShown: false }} />
            <Stack.Screen 
              name="appointments/new-booking" 
              options={{ 
                presentation: 'modal',
                headerShown: true,
                title: 'New Booking',
                headerStyle: { backgroundColor: '#1E293B' },
                headerTintColor: '#F8FAFC',
              }} 
            />
            <Stack.Screen 
              name="appointments/walk-in" 
              options={{ 
                presentation: 'modal',
                headerShown: true,
                title: 'Walk-in Check-in',
                headerStyle: { backgroundColor: '#1E293B' },
                headerTintColor: '#F8FAFC',
              }} 
            />
            <Stack.Screen 
              name="appointments/[id]" 
              options={{ 
                headerShown: true,
                title: 'Appointment Details',
                headerStyle: { backgroundColor: '#1E293B' },
                headerTintColor: '#F8FAFC',
              }} 
            />
            <Stack.Screen 
              name="clients/[id]" 
              options={{ 
                headerShown: true,
                title: 'Client Profile',
                headerStyle: { backgroundColor: '#1E293B' },
                headerTintColor: '#F8FAFC',
              }} 
            />
            <Stack.Screen 
              name="team/[id]" 
              options={{ 
                headerShown: true,
                title: 'Team Member',
                headerStyle: { backgroundColor: '#1E293B' },
                headerTintColor: '#F8FAFC',
              }} 
            />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});
