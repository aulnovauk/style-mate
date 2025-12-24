import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';

interface Client {
  id: string;
  name: string;
  phone: string;
  lastVisit: string;
  totalVisits: number;
  totalSpent: string;
  isVIP: boolean;
}

const mockClients: Client[] = [
  { id: '1', name: 'Priya Sharma', phone: '+91 98765 43210', lastVisit: 'Dec 20, 2025', totalVisits: 24, totalSpent: '₹48,500', isVIP: true },
  { id: '2', name: 'Rahul Verma', phone: '+91 87654 32109', lastVisit: 'Dec 18, 2025', totalVisits: 12, totalSpent: '₹15,200', isVIP: false },
  { id: '3', name: 'Sneha Patel', phone: '+91 76543 21098', lastVisit: 'Dec 15, 2025', totalVisits: 8, totalSpent: '₹12,800', isVIP: false },
  { id: '4', name: 'Amit Kumar', phone: '+91 65432 10987', lastVisit: 'Dec 12, 2025', totalVisits: 32, totalSpent: '₹72,000', isVIP: true },
  { id: '5', name: 'Neha Singh', phone: '+91 54321 09876', lastVisit: 'Dec 10, 2025', totalVisits: 5, totalSpent: '₹8,500', isVIP: false },
];

interface ClientCardProps {
  client: Client;
  onPress: () => void;
}

function ClientCard({ client, onPress }: ClientCardProps) {
  return (
    <TouchableOpacity style={styles.clientCard} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {client.name.split(' ').map(n => n[0]).join('')}
        </Text>
        {client.isVIP && (
          <View style={styles.vipBadge}>
            <Text style={styles.vipText}>⭐</Text>
          </View>
        )}
      </View>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{client.name}</Text>
        <Text style={styles.clientPhone}>{client.phone}</Text>
        <Text style={styles.clientMeta}>
          {client.totalVisits} visits • {client.totalSpent}
        </Text>
      </View>
      <View style={styles.lastVisit}>
        <Text style={styles.lastVisitLabel}>Last visit</Text>
        <Text style={styles.lastVisitDate}>{client.lastVisit}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ClientsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'vip' | 'new'>('all');

  const filteredClients = mockClients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.phone.includes(searchQuery);
    const matchesFilter = filter === 'all' || 
                         (filter === 'vip' && client.isVIP) ||
                         (filter === 'new' && client.totalVisits <= 3);
    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clients</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Client</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search clients..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity 
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterChip, filter === 'vip' && styles.filterChipActive]}
          onPress={() => setFilter('vip')}
        >
          <Text style={[styles.filterText, filter === 'vip' && styles.filterTextActive]}>VIP ⭐</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterChip, filter === 'new' && styles.filterChipActive]}
          onPress={() => setFilter('new')}
        >
          <Text style={[styles.filterText, filter === 'new' && styles.filterTextActive]}>New Clients</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ClientCard 
            client={item} 
            onPress={() => router.push(`/clients/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#F8FAFC',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1E293B',
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  vipBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vipText: {
    fontSize: 10,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  clientPhone: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  clientMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  lastVisit: {
    alignItems: 'flex-end',
  },
  lastVisitLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  lastVisitDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
});
