import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function WalkInScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.progressBar}>
        {[1, 2].map((s) => (
          <View 
            key={s}
            style={[styles.progressStep, s <= step && styles.progressStepActive]}
          />
        ))}
      </View>

      <ScrollView style={styles.content}>
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Client Info</Text>
            <Text style={styles.stepSubtitle}>Quick check-in for walk-in client</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Client Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter client name"
                placeholderTextColor="#64748B"
                value={clientName}
                onChangeText={setClientName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+91"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
                value={clientPhone}
                onChangeText={setClientPhone}
              />
            </View>

            <Text style={styles.orText}>or select existing client</Text>

            <TouchableOpacity style={styles.clientCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>RV</Text>
              </View>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>Rahul Verma</Text>
                <Text style={styles.clientPhone}>+91 87654 32109</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Assign Staff</Text>
            <Text style={styles.stepSubtitle}>Select available staff member</Text>
            
            <TouchableOpacity style={styles.staffCard}>
              <View style={styles.statusDot} />
              <View style={[styles.avatar, { borderColor: '#8B5CF6', borderWidth: 2 }]}>
                <Text style={styles.avatarText}>AD</Text>
              </View>
              <View style={styles.staffInfo}>
                <Text style={styles.staffName}>Anita Desai</Text>
                <Text style={styles.staffRole}>Available now</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.staffCard}>
              <View style={styles.statusDot} />
              <View style={[styles.avatar, { borderColor: '#EC4899', borderWidth: 2 }]}>
                <Text style={styles.avatarText}>RM</Text>
              </View>
              <View style={styles.staffInfo}>
                <Text style={styles.staffName}>Ravi Mehta</Text>
                <Text style={styles.staffRole}>Available now</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.staffCard, styles.staffCardBusy]}>
              <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
              <View style={[styles.avatar, { borderColor: '#3B82F6', borderWidth: 2 }]}>
                <Text style={styles.avatarText}>MJ</Text>
              </View>
              <View style={styles.staffInfo}>
                <Text style={styles.staffName}>Meera Joshi</Text>
                <Text style={styles.staffRole}>With client (15 min left)</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => setStep(step - 1)}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={() => {
            if (step < 2) {
              setStep(step + 1);
            } else {
              router.back();
            }
          }}
        >
          <Text style={styles.nextButtonText}>
            {step < 2 ? 'Continue' : 'Check In'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  progressBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#10B981',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
  },
  orText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginVertical: 20,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  clientPhone: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  staffCardBusy: {
    opacity: 0.6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    position: 'absolute',
    top: 16,
    right: 16,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  staffRole: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  backButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#1E293B',
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  nextButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#10B981',
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
