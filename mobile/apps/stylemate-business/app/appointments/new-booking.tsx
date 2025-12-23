import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Dimensions, Modal, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { format, addDays, isSameDay } from 'date-fns';
import { useClients, useServices, useStaff, businessApi } from '@stylemate/core';

const { width } = Dimensions.get('window');

const COLORS = {
  background: '#0F172A',
  cardBg: '#1E293B',
  cardBorder: '#334155',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  violet: '#8B5CF6',
  fuchsia: '#D946EF',
  green: '#22C55E',
  amber: '#F59E0B',
  blue: '#3B82F6',
  red: '#EF4444',
  pink: '#EC4899',
  cyan: '#06B6D4',
  orange: '#F97316',
  purple: '#A855F7',
};

interface Client {
  id: string;
  name: string;
  phone: string;
  image: string;
  visits: number;
  lastVisit: string;
  tag?: 'VIP' | 'Regular' | 'New';
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  icon: string;
  iconColors: [string, string];
  tag?: 'Trending' | 'Popular' | 'Premium';
}

interface TimeSlot {
  time: string;
  available: boolean;
  limited: boolean;
}

const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'Sarah Johnson', phone: '+91 98765 43210', image: 'https://i.pravatar.cc/150?img=5', visits: 24, lastVisit: '2 days ago', tag: 'VIP' },
  { id: '2', name: 'Michael Chen', phone: '+91 98765 43211', image: 'https://i.pravatar.cc/150?img=8', visits: 12, lastVisit: 'Today', tag: 'Regular' },
  { id: '3', name: 'Emily Rodriguez', phone: '+91 98765 43212', image: 'https://i.pravatar.cc/150?img=9', visits: 3, lastVisit: 'Yesterday', tag: 'New' },
  { id: '4', name: 'David Brown', phone: '+91 98765 43213', image: 'https://i.pravatar.cc/150?img=12', visits: 8, lastVisit: '5 days ago', tag: 'Regular' },
  { id: '5', name: 'Jessica Parker', phone: '+91 98765 43214', image: 'https://i.pravatar.cc/150?img=1', visits: 31, lastVisit: '3 days ago', tag: 'VIP' },
];

const MOCK_SERVICES: Service[] = [
  { id: '1', name: 'Hair Styling', description: 'Professional styling with premium products', price: 1200, duration: 45, category: 'Hair', icon: '✂️', iconColors: [COLORS.violet, COLORS.fuchsia] },
  { id: '2', name: 'Facial Treatment', description: 'Deep cleansing and rejuvenation', price: 1800, duration: 60, category: 'Spa', icon: '🧖', iconColors: [COLORS.pink, COLORS.fuchsia] },
  { id: '3', name: 'Hair Coloring', description: 'Full color treatment with premium brands', price: 2500, duration: 90, category: 'Hair', icon: '🎨', iconColors: [COLORS.blue, COLORS.cyan], tag: 'Trending' },
  { id: '4', name: 'Manicure & Pedicure', description: 'Complete nail care and polish', price: 900, duration: 75, category: 'Nails', icon: '💅', iconColors: [COLORS.amber, COLORS.orange], tag: 'Popular' },
  { id: '5', name: 'Bridal Makeup', description: 'Complete bridal look with HD makeup', price: 5500, duration: 120, category: 'Makeup', icon: '✨', iconColors: [COLORS.purple, COLORS.fuchsia], tag: 'Premium' },
  { id: '6', name: 'Hair Spa Treatment', description: 'Deep conditioning and nourishment', price: 1500, duration: 60, category: 'Hair', icon: '🌿', iconColors: [COLORS.green, COLORS.cyan] },
  { id: '7', name: 'Body Massage', description: 'Full body relaxation therapy', price: 2200, duration: 90, category: 'Spa', icon: '💆', iconColors: [COLORS.red, COLORS.pink] },
];

const CATEGORIES = ['Popular', 'Hair Services', 'Spa & Massage', 'Nail Care', 'Makeup'];

const MORNING_SLOTS: TimeSlot[] = [
  { time: '9:00 AM', available: true, limited: false },
  { time: '9:30 AM', available: true, limited: false },
  { time: '10:00 AM', available: true, limited: true },
  { time: '10:30 AM', available: true, limited: false },
  { time: '11:00 AM', available: true, limited: false },
  { time: '11:30 AM', available: true, limited: true },
];

const AFTERNOON_SLOTS: TimeSlot[] = [
  { time: '12:00 PM', available: true, limited: false },
  { time: '12:30 PM', available: true, limited: true },
  { time: '1:00 PM', available: true, limited: false },
  { time: '1:30 PM', available: true, limited: false },
  { time: '2:00 PM', available: true, limited: false },
  { time: '2:30 PM', available: true, limited: false },
  { time: '3:00 PM', available: true, limited: true },
  { time: '3:30 PM', available: true, limited: false },
  { time: '4:00 PM', available: true, limited: false },
  { time: '4:30 PM', available: true, limited: true },
];

const EVENING_SLOTS: TimeSlot[] = [
  { time: '5:00 PM', available: true, limited: true },
  { time: '5:30 PM', available: true, limited: false },
  { time: '6:00 PM', available: true, limited: true },
  { time: '6:30 PM', available: true, limited: false },
  { time: '7:00 PM', available: true, limited: false },
  { time: '7:30 PM', available: true, limited: true },
];

function ProgressIndicator({ currentStep }: { currentStep: number }) {
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        {[1, 2, 3, 4].map((step, index) => (
          <View key={step} style={styles.progressItem}>
            {step < currentStep ? (
              <LinearGradient colors={[COLORS.violet, COLORS.fuchsia]} style={styles.progressCircle}>
                <Text style={styles.progressCheck}>✓</Text>
              </LinearGradient>
            ) : step === currentStep ? (
              <LinearGradient colors={[COLORS.violet, COLORS.fuchsia]} style={styles.progressCircle}>
                <Text style={styles.progressNumber}>{step}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.progressCircleInactive}>
                <Text style={styles.progressNumberInactive}>{step}</Text>
              </View>
            )}
            {index < 3 && (
              <View style={[styles.progressLine, step < currentStep ? styles.progressLineActive : null]} />
            )}
          </View>
        ))}
      </View>
      <View style={styles.progressLabels}>
        <Text style={[styles.progressLabel, currentStep >= 1 && styles.progressLabelActive]}>Client</Text>
        <Text style={[styles.progressLabel, currentStep >= 2 && styles.progressLabelActive]}>Services</Text>
        <Text style={[styles.progressLabel, currentStep >= 3 && styles.progressLabelActive]}>Date & Time</Text>
        <Text style={[styles.progressLabel, currentStep >= 4 && styles.progressLabelActive]}>Review</Text>
      </View>
    </View>
  );
}

function StepHeader({ step, title, icon }: { step: number; title: string; icon: string }) {
  return (
    <View style={styles.stepHeader}>
      <LinearGradient colors={[COLORS.violet, COLORS.fuchsia]} style={styles.stepIconBox}>
        <Text style={styles.stepIcon}>{icon}</Text>
      </LinearGradient>
      <View>
        <Text style={styles.stepLabel}>STEP {step} OF 4</Text>
        <Text style={styles.stepTitle}>{title}</Text>
      </View>
    </View>
  );
}

function ClientCard({ client, isSelected, onSelect }: { client: Client; isSelected: boolean; onSelect: () => void }) {
  const tagColors = client.tag === 'VIP' ? COLORS.green : client.tag === 'New' ? COLORS.amber : COLORS.violet;
  return (
    <TouchableOpacity style={[styles.clientCard, isSelected && styles.clientCardSelected]} onPress={onSelect}>
      <Image source={{ uri: client.image }} style={styles.clientImg} />
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{client.name}</Text>
        <Text style={styles.clientPhone}>{client.phone}</Text>
        <View style={styles.clientTags}>
          <View style={[styles.tagBadge, { backgroundColor: tagColors + '30' }]}>
            <Text style={[styles.tagText, { color: tagColors }]}>{client.tag}</Text>
          </View>
          <Text style={styles.visitCount}>{client.visits} visits</Text>
        </View>
      </View>
      {isSelected ? (
        <LinearGradient colors={[COLORS.violet, COLORS.fuchsia]} style={styles.checkCircle}>
          <Text style={styles.checkMark}>✓</Text>
        </LinearGradient>
      ) : (
        <Text style={styles.chevron}>›</Text>
      )}
    </TouchableOpacity>
  );
}

function ServiceCard({ service, isSelected, onToggle }: { service: Service; isSelected: boolean; onToggle: () => void }) {
  return (
    <View style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}>
      <View style={styles.serviceRow}>
        <LinearGradient colors={service.iconColors} style={styles.serviceIconBox}>
          <Text style={styles.serviceIcon}>{service.icon}</Text>
        </LinearGradient>
        <View style={styles.serviceDetails}>
          <View style={styles.serviceNameRow}>
            <Text style={styles.serviceName}>{service.name}</Text>
            {service.tag && (
              <View style={[styles.serviceTagBadge, { backgroundColor: service.tag === 'Trending' ? COLORS.amber + '30' : service.tag === 'Popular' ? COLORS.green + '30' : COLORS.pink + '30' }]}>
                <Text style={[styles.serviceTagText, { color: service.tag === 'Trending' ? COLORS.amber : service.tag === 'Popular' ? COLORS.green : COLORS.pink }]}>{service.tag}</Text>
              </View>
            )}
          </View>
          <Text style={styles.serviceDesc}>{service.description}</Text>
          <View style={styles.serviceMeta}>
            <Text style={styles.serviceDuration}>🕐 {service.duration} mins</Text>
            <Text style={styles.servicePrice}>₹{service.price.toLocaleString()}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity onPress={onToggle}>
        {isSelected ? (
          <View style={styles.removeBtn}><Text style={styles.removeIcon}>✕</Text></View>
        ) : (
          <LinearGradient colors={[COLORS.violet, COLORS.fuchsia]} style={styles.addBtn}>
            <Text style={styles.addBtnText}>Add</Text>
          </LinearGradient>
        )}
      </TouchableOpacity>
    </View>
  );
}

function DateCard({ date, isSelected, onSelect }: { date: Date; isSelected: boolean; onSelect: () => void }) {
  if (isSelected) {
    return (
      <TouchableOpacity onPress={onSelect}>
        <LinearGradient colors={[COLORS.violet, COLORS.fuchsia]} style={[styles.dateCard, styles.dateCardSelected]}>
          <Text style={styles.dateDaySelected}>{format(date, 'EEE')}</Text>
          <Text style={styles.dateNumSelected}>{format(date, 'd')}</Text>
          <Text style={styles.dateMonthSelected}>{format(date, 'MMM')}</Text>
          <View style={styles.dateDot} />
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity style={styles.dateCard} onPress={onSelect}>
      <Text style={styles.dateDay}>{format(date, 'EEE')}</Text>
      <Text style={styles.dateNum}>{format(date, 'd')}</Text>
      <Text style={styles.dateMonth}>{format(date, 'MMM')}</Text>
    </TouchableOpacity>
  );
}

function TimeSlotBtn({ slot, isSelected, onSelect }: { slot: TimeSlot; isSelected: boolean; onSelect: () => void }) {
  if (isSelected) {
    return (
      <TouchableOpacity onPress={onSelect}>
        <LinearGradient colors={[COLORS.violet, COLORS.fuchsia]} style={styles.timeSlot}>
          <Text style={styles.timeTextSelected}>{slot.time}</Text>
          <Text style={styles.timeCheck}>✓</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity style={styles.timeSlot} onPress={onSelect}>
      <Text style={styles.timeText}>{slot.time}</Text>
      <View style={[styles.slotDot, slot.limited ? styles.slotLimited : styles.slotAvailable]} />
    </TouchableOpacity>
  );
}

export default function NewBookingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Popular');
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 2));
  const [selectedTime, setSelectedTime] = useState<string | null>('2:00 PM');
  const [timePreference, setTimePreference] = useState<'Morning' | 'Afternoon' | 'Evening'>('Afternoon');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [notes, setNotes] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);

  const { data: clientsData, loading: clientsLoading } = useClients(searchQuery, 20);
  const { data: servicesData, loading: servicesLoading } = useServices();
  const { data: staffData } = useStaff();

  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));
  const getTotalPrice = () => selectedServices.reduce((sum, s) => sum + s.price, 0);
  const getTotalDuration = () => selectedServices.reduce((sum, s) => sum + s.duration, 0);

  const toggleService = (service: Service) => {
    if (selectedServices.find((s) => s.id === service.id)) {
      setSelectedServices(selectedServices.filter((s) => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const convertTimeTo24Hour = (time12h: string): string => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsLoading(true);
      try {
        const bookingData = {
          clientId: selectedClient?.id || undefined,
          clientName: selectedClient?.name || 'Walk-in Customer',
          clientPhone: selectedClient?.phone || '',
          serviceIds: selectedServices.map(s => s.id),
          staffId: selectedStaffId ? String(selectedStaffId) : (staffData?.staff?.[0]?.id),
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: selectedTime ? convertTimeTo24Hour(selectedTime) : '10:00',
          notes: notes || undefined,
          paymentMethod: paymentMethod,
          isWalkIn: !selectedClient?.id,
        };
        
        const result = await businessApi.createBooking(bookingData);
        
        if (result.error) {
          Alert.alert('Booking Failed', result.error);
          setIsLoading(false);
          return;
        }
        
        setIsLoading(false);
        setShowSuccessModal(true);
      } catch (error) {
        setIsLoading(false);
        Alert.alert('Error', 'Failed to create booking. Please try again.');
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else router.back();
  };

  const canProceed = () => {
    if (currentStep === 1) return selectedClient !== null;
    if (currentStep === 2) return selectedServices.length > 0;
    if (currentStep === 3) return selectedDate !== null && selectedTime !== null;
    return true;
  };

  const apiClients: Client[] = useMemo(() => {
    if (!clientsData?.clients?.length) return MOCK_CLIENTS;
    return clientsData.clients.map((c, index) => ({
      id: c.userId || String(index + 1),
      name: c.name,
      phone: c.phone || '',
      image: `https://i.pravatar.cc/150?u=${c.phone || index}`,
      visits: c.visits || c.completedVisits || 0,
      lastVisit: c.lastVisit || 'Never',
      tag: c.tag as 'VIP' | 'Regular' | 'New' | undefined,
    }));
  }, [clientsData]);

  const getServiceIcon = (category: string | null): string => {
    const icons: Record<string, string> = {
      'Hair': '✂️', 'Spa': '🧖', 'Nails': '💅', 'Makeup': '💄', 'Skin': '✨', 'Massage': '💆'
    };
    return icons[category || ''] || '✂️';
  };

  const getServiceColors = (category: string | null): [string, string] => {
    const colors: Record<string, [string, string]> = {
      'Hair': [COLORS.violet, COLORS.fuchsia],
      'Spa': [COLORS.pink, COLORS.fuchsia],
      'Nails': [COLORS.amber, COLORS.orange],
      'Makeup': [COLORS.purple, COLORS.fuchsia],
      'Skin': [COLORS.cyan, COLORS.blue],
      'Massage': [COLORS.green, COLORS.cyan],
    };
    return colors[category || ''] || [COLORS.violet, COLORS.fuchsia];
  };

  const apiServices: Service[] = useMemo(() => {
    if (!servicesData?.services?.length) return MOCK_SERVICES;
    return servicesData.services.map(s => ({
      id: String(s.id),
      name: s.name,
      description: s.description || '',
      price: (s.priceInPaisa || 0) / 100,
      duration: s.durationMinutes || 60,
      category: s.category || 'General',
      icon: getServiceIcon(s.category),
      iconColors: getServiceColors(s.category),
    }));
  }, [servicesData]);

  const filteredClients = apiClients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery));

  const renderStep1 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <StepHeader step={1} title="Select Client" icon="👤" />
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput style={styles.searchInput} placeholder="Search clients by name or phone..." placeholderTextColor={COLORS.textMuted} value={searchQuery} onChangeText={setSearchQuery} />
      </View>
      <TouchableOpacity>
        <LinearGradient colors={[COLORS.violet, COLORS.fuchsia]} style={styles.addClientBtn}>
          <View style={styles.addClientIconBox}><Text style={styles.addClientIcon}>+</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addClientTitle}>Add New Client</Text>
            <Text style={styles.addClientSub}>Quick registration for walk-ins</Text>
          </View>
          <Text style={styles.addClientChev}>›</Text>
        </LinearGradient>
      </TouchableOpacity>
      <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Recent Clients</Text><TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity></View>
      {clientsLoading ? (
        <View style={{ padding: 20, alignItems: 'center' }}><ActivityIndicator color={COLORS.violet} /><Text style={{ color: COLORS.textMuted, marginTop: 8 }}>Loading clients...</Text></View>
      ) : (
        filteredClients.map(client => <ClientCard key={client.id} client={client} isSelected={selectedClient?.id === client.id} onSelect={() => setSelectedClient(client)} />)
      )}
      <View style={{ height: 140 }} />
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <StepHeader step={2} title="Select Services" icon="✂️" />
      {selectedClient && (
        <View style={styles.selectedClientCard}>
          <Image source={{ uri: selectedClient.image }} style={styles.selectedClientImg} />
          <View style={{ flex: 1 }}>
            <Text style={styles.selectedClientName}>{selectedClient.name}</Text>
            <Text style={styles.selectedClientPhone}>{selectedClient.phone}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => setCurrentStep(1)}><Text>✏️</Text></TouchableOpacity>
        </View>
      )}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput style={styles.searchInput} placeholder="Search services..." placeholderTextColor={COLORS.textMuted} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat} onPress={() => setSelectedCategory(cat)}>
            {selectedCategory === cat ? (
              <LinearGradient colors={[COLORS.violet, COLORS.fuchsia]} style={styles.categoryChip}><Text style={styles.categoryTextActive}>{cat}</Text></LinearGradient>
            ) : (
              <View style={styles.categoryChipInactive}><Text style={styles.categoryText}>{cat}</Text></View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      {selectedServices.length > 0 && (
        <>
          <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Selected ({selectedServices.length})</Text><TouchableOpacity onPress={() => setSelectedServices([])}><Text style={styles.clearAll}>Clear All</Text></TouchableOpacity></View>
          {selectedServices.map(s => (
            <View key={s.id} style={styles.selectedServiceCard}>
              <LinearGradient colors={s.iconColors} style={styles.selectedServiceIcon}><Text>{s.icon}</Text></LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedServiceName}>{s.name}</Text>
                <Text style={styles.selectedServiceMeta}>🕐 {s.duration} mins • ₹{s.price.toLocaleString()}</Text>
              </View>
              <TouchableOpacity style={styles.removeBtn} onPress={() => toggleService(s)}><Text style={styles.removeIcon}>✕</Text></TouchableOpacity>
            </View>
          ))}
        </>
      )}
      <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Available Services</Text><TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity></View>
      {servicesLoading ? (
        <View style={{ padding: 20, alignItems: 'center' }}><ActivityIndicator color={COLORS.violet} /><Text style={{ color: COLORS.textMuted, marginTop: 8 }}>Loading services...</Text></View>
      ) : (
        apiServices.map(s => <ServiceCard key={s.id} service={s} isSelected={selectedServices.some(x => x.id === s.id)} onToggle={() => toggleService(s)} />)
      )}
      <View style={{ height: 140 }} />
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <StepHeader step={3} title="Date & Time" icon="📅" />
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}><Text style={styles.summaryTitle}>Booking Summary</Text><TouchableOpacity onPress={() => setCurrentStep(1)}><Text style={styles.editLink}>Edit</Text></TouchableOpacity></View>
        {selectedClient && (
          <View style={styles.summaryClientRow}>
            <Image source={{ uri: selectedClient.image }} style={styles.summaryImg} />
            <View><Text style={styles.summaryClientName}>{selectedClient.name}</Text><Text style={styles.summaryClientPhone}>{selectedClient.phone}</Text></View>
          </View>
        )}
        <View style={styles.summaryStats}>
          <View style={styles.summaryStatRow}><Text style={styles.summaryLabel}>Services</Text><Text style={styles.summaryValue}>{selectedServices.length} Selected</Text></View>
          <View style={styles.summaryStatRow}><Text style={styles.summaryLabel}>Duration</Text><Text style={styles.summaryValue}>{getTotalDuration()} mins</Text></View>
          <View style={styles.summaryStatRow}><Text style={styles.summaryLabel}>Total</Text><Text style={styles.summaryAmount}>₹{getTotalPrice().toLocaleString()}</Text></View>
        </View>
      </View>
      <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Select Date</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
        {dates.map(d => <DateCard key={d.toISOString()} date={d} isSelected={isSameDay(d, selectedDate)} onSelect={() => setSelectedDate(d)} />)}
      </ScrollView>
      <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Preferred Time</Text></View>
      <View style={styles.timePrefRow}>
        {(['Morning', 'Afternoon', 'Evening'] as const).map(pref => (
          <TouchableOpacity key={pref} style={{ flex: 1 }} onPress={() => setTimePreference(pref)}>
            {timePreference === pref ? (
              <LinearGradient colors={[COLORS.violet, COLORS.fuchsia]} style={styles.timePrefBtn}>
                <Text style={styles.timePrefIcon}>{pref === 'Morning' ? '☀️' : pref === 'Afternoon' ? '⛅' : '🌙'}</Text>
                <Text style={styles.timePrefTextActive}>{pref}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.timePrefBtnInactive}>
                <Text style={styles.timePrefIcon}>{pref === 'Morning' ? '☀️' : pref === 'Afternoon' ? '⛅' : '🌙'}</Text>
                <Text style={styles.timePrefText}>{pref}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Available Slots</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}><View style={[styles.legendDot, styles.slotAvailable]} /><Text style={styles.legendText}>Available</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, styles.slotLimited]} /><Text style={styles.legendText}>Limited</Text></View>
        </View>
      </View>
      <View style={styles.timeSlotsGroup}>
        <View style={styles.timeGroupHeader}><Text style={styles.timeGroupIcon}>☀️</Text><Text style={styles.timeGroupTitle}>Morning (9:00 AM - 12:00 PM)</Text></View>
        <View style={styles.timeSlotsGrid}>{MORNING_SLOTS.map(s => <TimeSlotBtn key={s.time} slot={s} isSelected={selectedTime === s.time} onSelect={() => setSelectedTime(s.time)} />)}</View>
      </View>
      <View style={styles.timeSlotsGroup}>
        <View style={styles.timeGroupHeader}><Text style={styles.timeGroupIcon}>⛅</Text><Text style={styles.timeGroupTitle}>Afternoon (12:00 PM - 5:00 PM)</Text></View>
        <View style={styles.timeSlotsGrid}>{AFTERNOON_SLOTS.map(s => <TimeSlotBtn key={s.time} slot={s} isSelected={selectedTime === s.time} onSelect={() => setSelectedTime(s.time)} />)}</View>
      </View>
      <View style={styles.timeSlotsGroup}>
        <View style={styles.timeGroupHeader}><Text style={styles.timeGroupIcon}>🌙</Text><Text style={styles.timeGroupTitle}>Evening (5:00 PM - 8:00 PM)</Text></View>
        <View style={styles.timeSlotsGrid}>{EVENING_SLOTS.map(s => <TimeSlotBtn key={s.time} slot={s} isSelected={selectedTime === s.time} onSelect={() => setSelectedTime(s.time)} />)}</View>
      </View>
      <View style={{ height: 140 }} />
    </ScrollView>
  );

  const renderStep4 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <StepHeader step={4} title="Review & Confirm" icon="📋" />
      <View style={styles.reviewSection}>
        <View style={styles.reviewHeader}><Text style={styles.reviewTitle}>Client Information</Text><TouchableOpacity onPress={() => setCurrentStep(1)}><Text style={styles.editLink}>✏️ Edit</Text></TouchableOpacity></View>
        {selectedClient && (
          <View style={styles.reviewCard}>
            <Image source={{ uri: selectedClient.image }} style={styles.reviewImg} />
            <View><Text style={styles.reviewName}>{selectedClient.name}</Text><Text style={styles.reviewText}>📞 {selectedClient.phone}</Text></View>
          </View>
        )}
      </View>
      <View style={styles.reviewSection}>
        <View style={styles.reviewHeader}><Text style={styles.reviewTitle}>Appointment</Text><TouchableOpacity onPress={() => setCurrentStep(3)}><Text style={styles.editLink}>✏️ Edit</Text></TouchableOpacity></View>
        <View style={styles.reviewCard}>
          <LinearGradient colors={[COLORS.violet, COLORS.fuchsia]} style={styles.reviewIconBox}><Text>📅</Text></LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.reviewDateText}>{format(selectedDate, 'EEEE, MMM d, yyyy')}</Text>
            <Text style={styles.reviewTimeText}>{selectedTime} • {getTotalDuration()} mins</Text>
          </View>
        </View>
      </View>
      <View style={styles.reviewSection}>
        <View style={styles.reviewHeader}><Text style={styles.reviewTitle}>Services ({selectedServices.length})</Text><TouchableOpacity onPress={() => setCurrentStep(2)}><Text style={styles.editLink}>✏️ Edit</Text></TouchableOpacity></View>
        {selectedServices.map(s => (
          <View key={s.id} style={styles.reviewServiceRow}>
            <View style={[styles.reviewServiceIcon, { backgroundColor: s.iconColors[0] + '30' }]}><Text>{s.icon}</Text></View>
            <View style={{ flex: 1 }}><Text style={styles.reviewServiceName}>{s.name}</Text><Text style={styles.reviewServiceMeta}>🕐 {s.duration} mins</Text></View>
            <Text style={styles.reviewServicePrice}>₹{s.price.toLocaleString()}</Text>
          </View>
        ))}
      </View>
      <View style={styles.reviewSection}>
        <Text style={styles.reviewTitle}>Price Breakdown</Text>
        <View style={styles.priceCard}>
          {selectedServices.map(s => <View key={s.id} style={styles.priceRow}><Text style={styles.priceLabel}>{s.name}</Text><Text style={styles.priceValue}>₹{s.price.toLocaleString()}</Text></View>)}
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}><Text style={styles.priceLabel}>Subtotal</Text><Text style={styles.priceValue}>₹{getTotalPrice().toLocaleString()}</Text></View>
          <View style={styles.priceRow}><Text style={styles.priceLabel}>GST (18%)</Text><Text style={styles.priceValue}>₹{Math.round(getTotalPrice() * 0.18).toLocaleString()}</Text></View>
          <View style={styles.priceRow}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Text style={[styles.priceLabel, { color: COLORS.green }]}>Loyalty Discount</Text><View style={styles.discountBadge}><Text style={styles.discountText}>-10%</Text></View></View><Text style={[styles.priceValue, { color: COLORS.green }]}>-₹{Math.round(getTotalPrice() * 0.1).toLocaleString()}</Text></View>
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}><Text style={styles.totalLabel}>Total Amount</Text><Text style={styles.totalValue}>₹{Math.round(getTotalPrice() * 1.08).toLocaleString()}</Text></View>
        </View>
      </View>
      <View style={styles.reviewSection}>
        <Text style={styles.reviewTitle}>Payment Method</Text>
        {(['cash', 'card', 'upi'] as const).map(method => (
          <TouchableOpacity key={method} style={[styles.paymentOption, paymentMethod === method && styles.paymentOptionSelected]} onPress={() => setPaymentMethod(method)}>
            <View style={styles.paymentIcon}><Text>{method === 'cash' ? '💵' : method === 'card' ? '💳' : '📱'}</Text></View>
            <View style={{ flex: 1 }}><Text style={styles.paymentTitle}>{method === 'cash' ? 'Cash Payment' : method === 'card' ? 'Card Payment' : 'UPI Payment'}</Text><Text style={styles.paymentSub}>{method === 'cash' ? 'Pay at the salon' : method === 'card' ? 'Pay online now' : 'PhonePe, GPay, Paytm'}</Text></View>
            {paymentMethod === method ? <LinearGradient colors={[COLORS.violet, COLORS.fuchsia]} style={styles.paymentCheck}><Text style={styles.checkMark}>✓</Text></LinearGradient> : <View style={styles.paymentRadio} />}
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.reviewSection}>
        <Text style={styles.reviewTitle}>Special Instructions</Text>
        <View style={styles.notesCard}>
          <TextInput style={styles.notesInput} placeholder="Add any special requests..." placeholderTextColor={COLORS.textMuted} multiline value={notes} onChangeText={setNotes} maxLength={200} />
          <View style={styles.notesFooter}><Text style={styles.notesHint}>Optional</Text><Text style={styles.notesCount}>{notes.length}/200</Text></View>
        </View>
      </View>
      <View style={styles.policyCard}>
        <View style={styles.policyIcon}><Text>ℹ️</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.policyTitle}>Cancellation Policy</Text>
          <Text style={styles.policyText}>• Free cancellation up to 2 hours before</Text>
          <Text style={styles.policyText}>• 50% charge within 2 hours</Text>
          <Text style={styles.policyText}>• Full charge for no-shows</Text>
        </View>
      </View>
      <View style={{ height: 140 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={handleBack}><Text style={styles.headerIcon}>←</Text></TouchableOpacity>
        <View style={styles.headerCenter}><Text style={styles.headerTitle}>New Booking</Text><Text style={styles.headerSub}>Step {currentStep} of 4</Text></View>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}><Text style={styles.headerIcon}>✕</Text></TouchableOpacity>
      </View>
      <ProgressIndicator currentStep={currentStep} />
      <View style={styles.content}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </View>
      <View style={styles.footer}>
        <View style={styles.footerSummary}>
          <View><Text style={styles.footerLabel}>{currentStep === 4 ? 'Total Amount' : 'Selected'}</Text><Text style={styles.footerValue}>{currentStep === 1 ? (selectedClient?.name || 'No client') : currentStep === 2 ? `${selectedServices.length} services` : currentStep === 3 ? `${format(selectedDate, 'EEE, MMM d')} • ${selectedTime}` : `₹${Math.round(getTotalPrice() * 1.08).toLocaleString()}`}</Text></View>
          {currentStep >= 2 && <View style={styles.footerRight}><Text style={styles.footerLabel}>{currentStep === 4 ? 'Duration' : 'Total'}</Text><Text style={styles.footerAmount}>{currentStep === 4 ? `${getTotalDuration()} mins` : `₹${getTotalPrice().toLocaleString()}`}</Text></View>}
        </View>
        <View style={styles.footerBtns}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}><Text style={styles.backBtnIcon}>←</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]} onPress={handleNext} disabled={!canProceed() || isLoading}>
            <LinearGradient colors={canProceed() ? [COLORS.violet, COLORS.fuchsia] : [COLORS.cardBorder, COLORS.cardBorder]} style={styles.nextBtnGradient}>
              <Text style={styles.nextBtnText}>{isLoading ? 'Processing...' : currentStep === 4 ? 'Confirm Booking' : 'Continue'}</Text>
              {!isLoading && <Text style={styles.nextBtnIcon}>{currentStep === 4 ? '✓' : '→'}</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient colors={[COLORS.green, '#10B981']} style={styles.successIcon}><Text style={styles.successCheck}>✓</Text></LinearGradient>
            <Text style={styles.successTitle}>Booking Confirmed!</Text>
            <Text style={styles.successSub}>Your appointment has been scheduled</Text>
            <View style={styles.successDetails}>
              <View style={styles.successRow}><Text style={styles.successLabel}>Booking ID</Text><Text style={styles.successValue}>#BK-{Math.floor(Math.random() * 9000 + 1000)}</Text></View>
              <View style={styles.successRow}><Text style={styles.successLabel}>Date & Time</Text><Text style={styles.successValue}>{format(selectedDate, 'MMM d')}, {selectedTime}</Text></View>
              <View style={styles.successRow}><Text style={styles.successLabel}>Client</Text><Text style={styles.successValue}>{selectedClient?.name}</Text></View>
            </View>
            <TouchableOpacity style={styles.successBtn} onPress={() => { setShowSuccessModal(false); router.replace('/(tabs)/calendar'); }}>
              <LinearGradient colors={[COLORS.violet, COLORS.fuchsia]} style={styles.successBtnGradient}><Text style={styles.successBtnText}>View Appointment</Text></LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.successSecBtn} onPress={() => { setShowSuccessModal(false); router.replace('/(tabs)'); }}><Text style={styles.successSecText}>Back to Dashboard</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder, backgroundColor: COLORS.cardBg },
  headerBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.cardBorder, justifyContent: 'center', alignItems: 'center' },
  headerIcon: { fontSize: 18, color: COLORS.textPrimary },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  headerSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  progressContainer: { paddingHorizontal: 16, paddingVertical: 16, backgroundColor: COLORS.cardBg, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  progressBar: { flexDirection: 'row', alignItems: 'center' },
  progressItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  progressCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  progressCircleInactive: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.cardBorder, justifyContent: 'center', alignItems: 'center' },
  progressCheck: { fontSize: 12, color: '#FFF' },
  progressNumber: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  progressNumberInactive: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  progressLine: { flex: 1, height: 2, backgroundColor: COLORS.cardBorder, marginHorizontal: 8 },
  progressLineActive: { backgroundColor: COLORS.violet },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  progressLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  progressLabelActive: { color: COLORS.violet },
  content: { flex: 1, paddingHorizontal: 16 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.violet + '15', borderRadius: 16, padding: 16, marginTop: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.violet + '30', gap: 12 },
  stepIconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  stepIcon: { fontSize: 22 },
  stepLabel: { fontSize: 11, fontWeight: '600', color: COLORS.violet, letterSpacing: 0.5 },
  stepTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.cardBorder },
  searchIcon: { fontSize: 16, marginRight: 12 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 14, color: COLORS.textPrimary },
  addClientBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 20, gap: 12 },
  addClientIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  addClientIcon: { fontSize: 24, color: '#FFF', fontWeight: '300' },
  addClientTitle: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  addClientSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  addClientChev: { fontSize: 24, color: '#FFF' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  viewAll: { fontSize: 14, color: COLORS.violet, fontWeight: '500' },
  clearAll: { fontSize: 14, color: COLORS.violet, fontWeight: '500' },
  clientCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.cardBorder, gap: 12, marginBottom: 12 },
  clientCardSelected: { borderColor: COLORS.violet, borderWidth: 2 },
  clientImg: { width: 48, height: 48, borderRadius: 24 },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  clientPhone: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  clientTags: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 11, fontWeight: '600' },
  visitCount: { fontSize: 11, color: COLORS.textMuted },
  checkCircle: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  checkMark: { fontSize: 12, color: '#FFF' },
  chevron: { fontSize: 20, color: COLORS.textMuted },
  selectedClientCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.cardBorder, gap: 12 },
  selectedClientImg: { width: 56, height: 56, borderRadius: 28 },
  selectedClientName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  selectedClientPhone: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  editBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.cardBorder, justifyContent: 'center', alignItems: 'center' },
  categoryRow: { marginBottom: 16 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginRight: 8 },
  categoryChipInactive: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginRight: 8, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder },
  categoryTextActive: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  categoryText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  selectedServiceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.violet + '15', borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.violet + '30', gap: 12 },
  selectedServiceIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  selectedServiceName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  selectedServiceMeta: { fontSize: 12, color: COLORS.violet, marginTop: 4 },
  serviceCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.cardBorder, marginBottom: 12 },
  serviceCardSelected: { borderColor: COLORS.violet },
  serviceRow: { flexDirection: 'row', flex: 1, gap: 12 },
  serviceIconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  serviceIcon: { fontSize: 20 },
  serviceDetails: { flex: 1 },
  serviceNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  serviceName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  serviceTagBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  serviceTagText: { fontSize: 10, fontWeight: '600' },
  serviceDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  serviceMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  serviceDuration: { fontSize: 12, color: COLORS.textMuted },
  servicePrice: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  addBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  removeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.red + '30', justifyContent: 'center', alignItems: 'center' },
  removeIcon: { fontSize: 14, color: COLORS.red },
  summaryCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.cardBorder },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  editLink: { fontSize: 13, color: COLORS.violet, fontWeight: '500' },
  summaryClientRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 12, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  summaryImg: { width: 40, height: 40, borderRadius: 20 },
  summaryClientName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  summaryClientPhone: { fontSize: 12, color: COLORS.textMuted },
  summaryStats: { gap: 8 },
  summaryStatRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 12, color: COLORS.textMuted },
  summaryValue: { fontSize: 12, fontWeight: '500', color: COLORS.textPrimary },
  summaryAmount: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  dateCard: { width: 76, backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 12, alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: COLORS.cardBorder },
  dateCardSelected: { borderWidth: 2, borderColor: COLORS.violet },
  dateDay: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  dateDaySelected: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  dateNum: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  dateNumSelected: { fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  dateMonth: { fontSize: 12, color: COLORS.textMuted },
  dateMonthSelected: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  dateDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF', marginTop: 6 },
  timePrefRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  timePrefBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 6 },
  timePrefBtnInactive: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 6, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.cardBorder },
  timePrefIcon: { fontSize: 14 },
  timePrefText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  timePrefTextActive: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  legendRow: { flexDirection: 'row', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.textMuted },
  slotAvailable: { backgroundColor: COLORS.green },
  slotLimited: { backgroundColor: COLORS.amber },
  timeSlotsGroup: { marginBottom: 16 },
  timeGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  timeGroupIcon: { fontSize: 16 },
  timeGroupTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  timeSlotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeSlot: { width: (width - 56) / 3, backgroundColor: COLORS.cardBg, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.cardBorder, position: 'relative' },
  timeText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  timeTextSelected: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  timeCheck: { position: 'absolute', top: 4, right: 6, fontSize: 10, color: '#FFF' },
  slotDot: { position: 'absolute', top: 4, right: 6, width: 8, height: 8, borderRadius: 4 },
  reviewSection: { marginBottom: 20 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reviewTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  reviewCard: { flexDirection: 'row', backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.cardBorder, gap: 12, alignItems: 'center' },
  reviewImg: { width: 56, height: 56, borderRadius: 28 },
  reviewIconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  reviewName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  reviewText: { fontSize: 13, color: COLORS.textSecondary },
  reviewDateText: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  reviewTimeText: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  reviewServiceRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.cardBorder, gap: 12 },
  reviewServiceIcon: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  reviewServiceName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  reviewServiceMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  reviewServicePrice: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  priceCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.cardBorder },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  priceLabel: { fontSize: 14, color: COLORS.textMuted },
  priceValue: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
  priceDivider: { height: 1, backgroundColor: COLORS.cardBorder, marginVertical: 8 },
  discountBadge: { backgroundColor: COLORS.green + '30', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  discountText: { fontSize: 11, fontWeight: '700', color: COLORS.green },
  totalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  totalValue: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  paymentOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.cardBorder, gap: 12, marginBottom: 12 },
  paymentOptionSelected: { backgroundColor: COLORS.violet + '15', borderColor: COLORS.violet + '50', borderWidth: 2 },
  paymentIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.violet + '30', justifyContent: 'center', alignItems: 'center' },
  paymentTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  paymentSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  paymentCheck: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  paymentRadio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.cardBorder },
  notesCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.cardBorder },
  notesInput: { backgroundColor: COLORS.background, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.textPrimary, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: COLORS.cardBorder },
  notesFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  notesHint: { fontSize: 12, color: COLORS.textMuted },
  notesCount: { fontSize: 12, color: COLORS.textMuted },
  policyCard: { flexDirection: 'row', backgroundColor: COLORS.amber + '15', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.amber + '30', gap: 12, marginBottom: 20 },
  policyIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.amber + '30', justifyContent: 'center', alignItems: 'center' },
  policyTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  policyText: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.cardBg, borderTopWidth: 1, borderTopColor: COLORS.cardBorder, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  footerSummary: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  footerLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 2 },
  footerValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  footerRight: { alignItems: 'flex-end' },
  footerAmount: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  footerBtns: { flexDirection: 'row', gap: 12 },
  backBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.cardBorder, justifyContent: 'center', alignItems: 'center' },
  backBtnIcon: { fontSize: 20, color: COLORS.textPrimary },
  nextBtn: { flex: 1, height: 48, borderRadius: 12, overflow: 'hidden' },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  nextBtnText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  nextBtnIcon: { fontSize: 16, color: '#FFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 24, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  successIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  successCheck: { fontSize: 32, color: '#FFF' },
  successTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  successSub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 24 },
  successDetails: { backgroundColor: COLORS.background, borderRadius: 16, padding: 16, width: '100%', marginBottom: 24 },
  successRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  successLabel: { fontSize: 12, color: COLORS.textMuted },
  successValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  successBtn: { width: '100%', height: 48, borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  successBtnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  successBtnText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  successSecBtn: { width: '100%', height: 48, backgroundColor: COLORS.cardBorder, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  successSecText: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
});
