import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import apiClient from '../../src/api/axios';
import { getToken } from '../../src/api/token';

const FILTERS = [
  { key: 'All', label: 'Semua Status' },
  { key: 'Antrian', label: 'Antrian' },
  { key: 'Dicuci', label: 'Dicuci' },
  { key: 'Setrika', label: 'Setrika' },
  { key: 'Siap Diambil', label: 'Siap Diambil' },
  { key: 'Diambil', label: 'Diambil' }
];

export default function CustomerDashboard() {
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [userName, setUserName] = useState('Pelanggan');
  const [userAddress, setUserAddress] = useState('Jakarta');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const router = useRouter();

  const getStorageURL = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const hostUri = Constants.expoConfig?.hostUri;
    const ip = hostUri ? hostUri.split(':')[0] : '192.168.0.110';
    return `http://${ip}:8000/storage/${path}`;
  };

  const fetchDashboardData = async () => {
    try {
      try {
        const profileRes = await apiClient.get('/profile');
        const userData = profileRes.data?.data || profileRes.data;
        if (userData) {
          setUserName(userData.name || 'Pelanggan');
          setUserAddress(userData.customer?.address || 'Jakarta');
        }
      } catch (err) {
        console.warn('Gagal memuat data profil, menggunakan konfigurasi fallback.', err);
      }

      const response = await apiClient.get('/status-laundry');
      const allData = response.data?.data || response.data || [];
      setActiveOrders(allData);
      applyFilterAndSearch(allData, selectedFilter, searchQuery);
    } catch (error: any) {
      console.error('Gagal memuat status laundry:', error);
      Alert.alert(
        'Gangguan Jaringan',
        error.response?.data?.message || 'Gagal terhubung ke server. Periksa kembali koneksi internet Anda.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      if (!token) {
        router.replace('/login');
      } else {
        fetchDashboardData();
      }
    };
    checkAuth();
  }, []);

  const applyFilterAndSearch = (orders: any[], filter: string, query: string) => {
    let result = [...orders];

    if (filter !== 'All') {
      result = result.filter(
        (order) => order.status.toLowerCase() === filter.toLowerCase()
      );
    }

    if (query.trim() !== '') {
      result = result.filter(
        (order) => 
          order.invoice_code?.toLowerCase().includes(query.toLowerCase()) ||
          order.service?.service_name?.toLowerCase().includes(query.toLowerCase())
      );
    }

    setFilteredOrders(result);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    applyFilterAndSearch(activeOrders, selectedFilter, text);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getCategorizedCount = (type: string) => {
    if (type === 'Antrian') {
      return activeOrders.filter(o => o.status.toLowerCase() === 'antrian').length;
    }
    if (type === 'Diproses') {
      return activeOrders.filter(o => o.status.toLowerCase() === 'dicuci' || o.status.toLowerCase() === 'disetrika').length;
    }
    if (type === 'Siap Diambil') {
      return activeOrders.filter(o => o.status.toLowerCase() === 'siap diambil').length;
    }
    return activeOrders.length;
  };

  const renderTimelineFlow = (status: string) => {
    const current = status.toLowerCase();
    return (
      <View style={styles.flowContainer}>
        <Text style={[styles.flowStep, current === 'antrian' && styles.flowActive]}>Antrian</Text>
        <MaterialCommunityIcons name="chevron-double-right" color={current === 'dicuci' || current === 'disetrika' ? '#9333ea' : '#cbd5e1'} size={14} />
        <Text style={[styles.flowStep, (current === 'dicuci' || current === 'disetrika') && styles.flowActivePurple]}>Proses</Text>
        <MaterialCommunityIcons name="chevron-double-right" color={current === 'siap diambil' ? '#16a34a' : '#cbd5e1'} size={14} />
        <Text style={[styles.flowStep, current === 'siap diambil' && styles.flowActiveGreen]}>Siap Ambil</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196D3" />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#eef7fc', '#ffffff']}
      style={styles.container}
    >
      
      {/* ================= BACKGROUND UNIK: FLOATING SOAP BUBBLES GRAPHICS ================= */}
      <View style={styles.bubbleBg1} />
      <View style={styles.bubbleBg2} />
      <View style={styles.bubbleBg3} />

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2196D3" />}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            
            {/* 1. TOP BAR LOCATION PROFILE */}
            <View style={styles.topRow}>
              <View style={styles.locationBlock}>
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons name="map-marker" color="#2196D3" size={16} />
                </View>
                <View>
                  <Text style={styles.locationLabel}>Outlet Terdaftar</Text>
                  <Text style={styles.locationValue} numberOfLines={1}>{userAddress}</Text>
                </View>
              </View>

              <View style={styles.actionsBlock}>
                <TouchableOpacity style={styles.iconCircle}>
                  <MaterialCommunityIcons name="bell-outline" color="#475569" size={18} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.avatarContainer} 
                  onPress={() => router.push('/profile')}
                >
                  <Text style={styles.avatarText}>
                    {userName ? userName.charAt(0).toUpperCase() : 'P'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. LAUNDRY WELCOME GREETING & TITLE */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeGreeting}>Halo, {userName} 👋</Text>
              <Text style={styles.heroTitle}>Pelacakan CDC Laundry</Text>
            </View>

            {/* 3. SEARCH BAR */}
            <View style={styles.searchBarContainer}>
              <MaterialCommunityIcons name="magnify" color="#64748b" size={20} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari nomor invoice atau layanan di sini..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={handleSearchChange}
              />
            </View>

            {/* 4. STATIC STAT COUNTERS ROW (No icons) */}
            <View style={styles.statsRowContainer}>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#a855f7' }]}>
                  {getCategorizedCount('Antrian')}
                </Text>
                <Text style={styles.statLabel}>Antrian Baru</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#2196D3' }]}>
                  {getCategorizedCount('Diproses')}
                </Text>
                <Text style={styles.statLabel}>Sedang Proses</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#7EC839' }]}>
                  {getCategorizedCount('Siap Diambil')}
                </Text>
                <Text style={styles.statLabel}>Siap Diambil</Text>
              </View>
            </View>

            {/* 5. FILTER STATUS CHIPS (Horizontal Scroll matching user's screenshot) */}
            <View style={styles.filterSectionContainer}>
              <Text style={styles.filterSectionTitle}>FILTER STATUS CUCIAN</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScrollContent}
              >
                {FILTERS.map((filter) => {
                  const isCurrentSelected = selectedFilter === filter.key;
                  return (
                    <TouchableOpacity
                      key={filter.key}
                      style={[
                        styles.filterChip,
                        isCurrentSelected ? styles.filterChipActive : styles.filterChipInactive
                      ]}
                      onPress={() => {
                        setSelectedFilter(filter.key);
                        applyFilterAndSearch(activeOrders, filter.key, searchQuery);
                      }}
                    >
                      <Text style={[
                        styles.filterChipText,
                        isCurrentSelected ? styles.filterChipTextActive : styles.filterChipTextInactive
                      ]}>
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

          </View>
        }
        ListEmptyComponent={
          <View style={styles.glassEmptyContainer}>
            <MaterialCommunityIcons name="washing-machine" color="#cbd5e1" size={54} />
            <Text style={styles.emptyText}>Tidak ada data cucian pada kategori ini.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isAntrian = item.status.toLowerCase() === 'antrian';
          const indicatorColor = isAntrian ? '#a855f7' : '#2196D3';

          return (
            <View style={styles.cardWrapper}>
              <TouchableOpacity 
                style={styles.mainGlassCard}
                onPress={() => router.push({ pathname: '/modal', params: { id: item.id } })}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.serviceMeta}>
                    <View style={[styles.serviceIconContainer, { backgroundColor: 'rgba(33, 150, 211, 0.08)', overflow: 'hidden' }]}>
                      {item.service?.service_photo ? (
                        <Image 
                          source={{ uri: getStorageURL(item.service.service_photo) }} 
                          style={{ width: '100%', height: '100%' }} 
                          resizeMode="cover"
                        />
                      ) : (
                        <MaterialCommunityIcons name="tshirt-crew-outline" color="#2196D3" size={18} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardServiceTitle} numberOfLines={1}>{item.service?.service_name || 'Laundry Paket'}</Text>
                      <Text style={styles.cardInvoiceText}>{item.invoice_code}</Text>
                    </View>
                  </View>
                  
                  <View style={[styles.statusBadgeDotIndicator, { backgroundColor: indicatorColor + '20' }]}>
                    <Text style={[styles.statusBadgeDotText, { color: indicatorColor }]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardMiddleGrid}>
                  <View style={styles.gridColumn}>
                    <Text style={styles.gridValue}>{item.weight} {item.service?.unit || 'Kg'}</Text>
                    <Text style={styles.gridLabel}>Berat Cucian</Text>
                  </View>
                  
                  <View style={styles.gridDivider} />

                  <View style={styles.gridColumn}>
                    <Text style={styles.gridValue}>Rp {Number(item.total_price).toLocaleString('id-ID')}</Text>
                    <Text style={styles.gridLabel}>Total Biaya</Text>
                  </View>
                </View>

                {renderTimelineFlow(item.status)}
              </TouchableOpacity>
            </View>
          );
        }}
      />

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, backgroundColor: '#f3f8fc', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 120 },
  headerContainer: { paddingTop: 54 },
  
  // UNIK DEKORASI BACKGROUND GRAPHICS (BUBBLES & WATER WAVE LINI MASA)
  bubbleBg1: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(33, 150, 211, 0.04)', top: -20, left: -30 },
  bubbleBg2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(126, 200, 57, 0.03)', top: 250, right: -50 },
  bubbleBg3: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(33, 150, 211, 0.02)', bottom: 100, left: -10 },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingHorizontal: 22 },
  locationBlock: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(33, 150, 211, 0.12)', shadowColor: '#2196D3', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  locationLabel: { fontFamily: 'Poppins_400Regular', fontSize: 10, color: '#64748b' },
  locationValue: { fontFamily: 'Poppins_600Medium', fontSize: 13, color: '#1e293b', marginTop: 1 },
  actionsBlock: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarContainer: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#2196D3', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#ffffff' },

  welcomeSection: { paddingHorizontal: 22, marginBottom: 16 },
  welcomeGreeting: { fontFamily: 'Poppins_700Bold', fontSize: 12, color: '#2196D3', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroTitle: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: '#1e293b', lineHeight: 28, marginTop: 2 },
  
  // SEARCH BAR COATING GLASS
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 20, height: 46, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(33, 150, 211, 0.1)', marginBottom: 24, marginHorizontal: 22, shadowColor: '#2196D3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#1e293b', fontFamily: 'Poppins_500Medium', fontSize: 12, height: '100%' },
  
  statsRowContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingHorizontal: 22, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#ffffff', borderRadius: 20, paddingVertical: 14, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(33, 150, 211, 0.1)', shadowColor: '#2196D3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  statNumber: { fontFamily: 'Poppins_700Bold', fontSize: 20, lineHeight: 26 },
  statLabel: { fontFamily: 'Poppins_600Medium', fontSize: 10, color: '#64748b', marginTop: 2, textAlign: 'center' },
  
  filterSectionContainer: { paddingHorizontal: 22, marginBottom: 20 },
  filterSectionTitle: { fontFamily: 'Poppins_700Bold', fontSize: 9, color: '#64748b', marginBottom: 10, letterSpacing: 0.8 },
  filterScrollContent: { gap: 8, paddingRight: 16 },
  filterChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  filterChipActive: { backgroundColor: '#2196D3', borderColor: '#2196D3' },
  filterChipInactive: { backgroundColor: '#ffffff', borderColor: 'rgba(33, 150, 211, 0.12)' },
  filterChipText: { fontFamily: 'Poppins_700Bold', fontSize: 11 },
  filterChipTextActive: { color: '#ffffff' },
  filterChipTextInactive: { color: '#64748b' },

  // MAIN CARD TRANSACTION GLASS LIST ITEMS
  cardWrapper: { paddingHorizontal: 22 },
  mainGlassCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(33, 150, 211, 0.1)', shadowColor: '#2196D3', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  serviceMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  serviceIconContainer: { width: 34, height: 34, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardServiceTitle: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#1e293b', lineHeight: 18 },
  cardInvoiceText: { fontFamily: 'Poppins_500Medium', fontSize: 10, color: '#64748b', marginTop: 1 },
  statusBadgeDotIndicator: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusBadgeDotText: { fontFamily: 'Poppins_700Bold', fontSize: 9, letterSpacing: 0.3 },
  cardMiddleGrid: { flexDirection: 'row', backgroundColor: 'rgba(241, 245, 249, 0.5)', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  gridColumn: { flex: 1 },
  gridValue: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: '#1e293b' },
  gridLabel: { fontFamily: 'Poppins_500Medium', fontSize: 9, color: '#64748b', marginTop: 2 },
  gridDivider: { width: 1, height: 24, backgroundColor: 'rgba(0,0,0,0.04)', marginHorizontal: 12 },
  flowContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.03)' },
  flowStep: { fontFamily: 'Poppins_600Medium', fontSize: 11, color: '#cbd5e1' },
  flowActive: { color: '#1e293b' },
  flowActivePurple: { color: '#9333ea' },
  flowActiveGreen: { color: '#16a34a' },
  glassEmptyContainer: { alignItems: 'center', paddingVertical: 60, gap: 12, backgroundColor: '#ffffff', borderRadius: 24, marginHorizontal: 22, borderWidth: 1, borderColor: 'rgba(33, 150, 211, 0.1)', shadowColor: '#2196D3', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  emptyText: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#64748b' },
});