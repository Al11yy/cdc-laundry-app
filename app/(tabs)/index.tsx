import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl, 
  TouchableOpacity, 
  Alert, 
  useColorScheme, 
  Image 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../../src/api/axios'; 
import { getToken } from '../../src/api/token';

const FILTERS = ['All', 'Antrian', 'Dicuci', 'Disetrika', 'Siap Diambil'];

export default function CustomerDashboard() {
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [userName, setUserName] = useState('Marco');
  const [userAddress, setUserAddress] = useState('Jakarta');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Profile Info
      try {
        const profileRes = await apiClient.get('/profile');
        const userData = profileRes.data?.data || profileRes.data;
        if (userData) {
          setUserName(userData.name || 'Pelanggan');
          setUserAddress(userData.customer?.address || 'Jakarta');
        }
      } catch (err) {
        console.warn('Failed to load profile, using fallback name/address', err);
      }

      // 2. Fetch Active Status Laundry
      const response = await apiClient.get('/status-laundry');
      const allData = response.data?.data || response.data || [];
      
      // Saring data: Hanya tampilkan yang belum diambil oleh customer
      const active = allData.filter((trx: any) => trx.status.toLowerCase() !== 'diambil');
      setActiveOrders(active);
      applyFilter(active, selectedFilter);
    } catch (error: any) {
      console.error('Gagal memuat status laundry:', error);
      Alert.alert(
        'Error Koneksi',
        error.response?.data?.message || 'Gagal terhubung ke server Laravel. Periksa koneksi internet atau IP address Anda.'
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

  const applyFilter = (orders: any[], filter: string) => {
    if (filter === 'All') {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(
        (order) => order.status.toLowerCase() === filter.toLowerCase()
      );
      setFilteredOrders(filtered);
    }
  };

  const handleFilterSelect = (filter: string) => {
    setSelectedFilter(filter);
    applyFilter(activeOrders, filter);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getMockDuration = (status: string) => {
    switch (status.toLowerCase()) {
      case 'antrian': return '24h 00m';
      case 'dicuci': return '2h 30m';
      case 'disetrika': return '45min';
      case 'siap diambil': return 'Ready';
      default: return 'Finished';
    }
  };

  const getServiceTags = (order: any) => {
    const serviceName = order.service?.service_name?.toLowerCase() || '';
    if (serviceName.includes('setrika')) {
      return ['Ironing', 'Dry'];
    }
    if (serviceName.includes('cuci')) {
      return ['Cleaning', 'Wash'];
    }
    return ['Laundry', 'Dry'];
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: isDark ? '#0a0a0a' : '#f8f9fa' }]}>
        <ActivityIndicator size="large" color="#06b6d4" />
      </View>
    );
  }

  const formattedDate = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  // Dynamic Theme Colors configuration
  const themeColors = {
    background: isDark ? '#0a0a0a' : '#f8f9fa',
    headerGradient: isDark ? ['#1e1b4b', '#0f172a'] : ['#e9f0ff', '#f5eaff'],
    text: isDark ? '#ffffff' : '#0a0a0a',
    textSecondary: isDark ? '#a3a3a3' : '#737373',
    cardBg: isDark ? '#171717' : '#ffffff',
    cardBorder: isDark ? '#262626' : '#e9ecef',
    locationIconBg: isDark ? '#171717' : 'rgba(255, 255, 255, 0.7)',
    bellBg: isDark ? '#171717' : 'rgba(255, 255, 255, 0.7)',
    bellIcon: isDark ? '#ffffff' : '#0a0a0a',
    tagBg: isDark ? '#262626' : '#f1f3f5',
    tagText: isDark ? '#cbd5e1' : '#495057',
    buttonBg: isDark ? '#ffffff' : '#0a0a0a',
    buttonArrow: isDark ? '#0a0a0a' : '#ffffff',
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06b6d4" />}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <View>
            {/* Smooth Top Gradient Header */}
            <LinearGradient 
              colors={themeColors.headerGradient} 
              style={styles.headerGradient}
            >
              {/* Location & Profile Row */}
              <View style={styles.topRow}>
                <View style={styles.locationContainer}>
                  <View style={[styles.locationIconBg, { backgroundColor: themeColors.locationIconBg }]}>
                    <MaterialCommunityIcons name="map-marker" color="#ff7675" size={20} />
                  </View>
                  <View>
                    <Text style={styles.locationLabel}>Location</Text>
                    <Text style={[styles.locationText, { color: themeColors.text }]} numberOfLines={1}>
                      {userAddress}
                    </Text>
                  </View>
                </View>

                <View style={styles.topActions}>
                  <TouchableOpacity style={[styles.iconButtonBg, { backgroundColor: themeColors.bellBg }]}>
                    <MaterialCommunityIcons name="bell-outline" color={themeColors.bellIcon} size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push('/profile')}>
                    <Image 
                      source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80' }} 
                      style={styles.profileAvatar}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Date & User Greeting */}
              <Text style={styles.dateText}>Today, {formattedDate}</Text>
              <Text style={[styles.greetingText, { color: themeColors.text }]}>
                Hello, {userName} <Text style={styles.subGreetingText}>👋</Text>
              </Text>
              <Text style={[styles.subGreetingText, { color: themeColors.text }]}>
                wash anything here
              </Text>
            </LinearGradient>

            {/* Premium Salmon/Orange Progress Banner */}
            <View style={styles.summaryBanner}>
              <Text style={styles.summaryText}>
                You have <Text style={styles.summaryTextBold}>{activeOrders.length} laundry</Text> in progress
              </Text>
              <TouchableOpacity style={styles.arrowCircle} onPress={onRefresh}>
                <MaterialCommunityIcons name="arrow-top-right" color="#f19066" size={18} />
              </TouchableOpacity>
            </View>

            {/* Horizontal Scrollable Categories */}
            <View style={styles.filterSection}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={FILTERS}
                keyExtractor={(item) => item}
                contentContainerStyle={styles.filterScrollView}
                renderItem={({ item }) => {
                  const isActive = selectedFilter === item;
                  return (
                    <TouchableOpacity 
                      onPress={() => handleFilterSelect(item)}
                      style={[
                        styles.filterTab, 
                        { 
                          borderColor: isActive ? 'transparent' : themeColors.cardBorder,
                          backgroundColor: isActive ? (isDark ? '#ffffff' : '#0a0a0a') : 'transparent'
                        }
                      ]}
                    >
                      <Text style={[
                        styles.filterTabText, 
                        { color: isActive ? (isDark ? '#0a0a0a' : '#ffffff') : themeColors.textSecondary }
                      ]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="package-variant" color={themeColors.textSecondary} size={48} />
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              Tidak ada cucian dalam kategori ini, coi.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          // Alternate styling: first card is premium blue, second is standard matching light/dark theme
          const isBlueCard = index % 2 === 0;
          const cardLocation = index % 2 === 0 ? 'Bekasi' : 'Tangerang';
          const tags = getServiceTags(item);
          const duration = getMockDuration(item.status);

          if (isBlueCard) {
            return (
              <View style={styles.listContainer}>
                <TouchableOpacity 
                  style={styles.blueCard}
                  onPress={() => router.push({ pathname: '/modal', params: { id: item.id } })}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardLocationContainer}>
                      <MaterialCommunityIcons name="map-marker-outline" color="#ffffff" size={14} />
                      <Text style={[styles.cardLocationText, styles.blueCardText]}>{cardLocation}</Text>
                    </View>
                    <Text style={[styles.cardDurationText, styles.blueCardText]}>{duration}</Text>
                  </View>

                  <Text style={[styles.cardTitle, styles.blueCardText]}>
                    {item.service?.service_name || 'Layanan Laundry'}
                  </Text>

                  <View style={styles.cardTagsRow}>
                    {tags.map((tag, i) => (
                      <View key={i} style={[styles.cardTag, styles.blueCardTagBg]}>
                        <Text style={[styles.cardTagText, styles.blueCardTagText]}>{tag}</Text>
                      </View>
                    ))}
                    <View style={[styles.cardTag, styles.blueCardTagBg]}>
                      <Text style={[styles.cardTagText, styles.blueCardTagText]}>{item.status.toUpperCase()}</Text>
                    </View>
                  </View>

                  <View style={styles.cardBottomRow}>
                    <View style={styles.cardPriceContainer}>
                      <Text style={[styles.cardPriceText, styles.blueCardText]}>
                        Rp {Number(item.total_price).toLocaleString('id-ID')}
                      </Text>
                      <Text style={[styles.cardPriceUnit, styles.blueCardSubText]}>
                        /{item.service?.unit || 'Kg'}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={[styles.cardButton, styles.blueCardIconCircle]}
                      onPress={() => router.push({ pathname: '/modal', params: { id: item.id } })}
                    >
                      <MaterialCommunityIcons name="arrow-top-right" color="#5f27cd" size={20} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </View>
            );
          } else {
            return (
              <View style={styles.listContainer}>
                <TouchableOpacity 
                  style={[
                    styles.standardCard, 
                    { 
                      backgroundColor: themeColors.cardBg, 
                      borderColor: themeColors.cardBorder 
                    }
                  ]}
                  onPress={() => router.push({ pathname: '/modal', params: { id: item.id } })}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardLocationContainer}>
                      <MaterialCommunityIcons name="map-marker-outline" color={themeColors.textSecondary} size={14} />
                      <Text style={[styles.cardLocationText, { color: themeColors.textSecondary }]}>{cardLocation}</Text>
                    </View>
                    <Text style={[styles.cardDurationText, { color: themeColors.textSecondary }]}>{duration}</Text>
                  </View>

                  <Text style={[styles.cardTitle, { color: themeColors.text }]}>
                    {item.service?.service_name || 'Layanan Laundry'}
                  </Text>

                  <View style={styles.cardTagsRow}>
                    {tags.map((tag, i) => (
                      <View key={i} style={[styles.cardTag, { backgroundColor: themeColors.tagBg }]}>
                        <Text style={[styles.cardTagText, { color: themeColors.tagText }]}>{tag}</Text>
                      </View>
                    ))}
                    <View style={[styles.cardTag, { backgroundColor: themeColors.tagBg }]}>
                      <Text style={[styles.cardTagText, { color: themeColors.tagText }]}>{item.status.toUpperCase()}</Text>
                    </View>
                  </View>

                  <View style={styles.cardBottomRow}>
                    <View style={styles.cardPriceContainer}>
                      <Text style={[styles.cardPriceText, { color: themeColors.text }]}>
                        Rp {Number(item.total_price).toLocaleString('id-ID')}
                      </Text>
                      <Text style={[styles.cardPriceUnit, { color: themeColors.textSecondary }]}>
                        /{item.service?.unit || 'Kg'}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={[styles.cardButton, { backgroundColor: themeColors.buttonBg }]}
                      onPress={() => router.push({ pathname: '/modal', params: { id: item.id } })}
                    >
                      <MaterialCommunityIcons name="arrow-top-right" color={themeColors.buttonArrow} size={20} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </View>
            );
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerGradient: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 44,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  locationIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  locationLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: '#8e8e93',
  },
  locationText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    marginTop: 1,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButtonBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  dateText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 2,
  },
  greetingText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
  },
  subGreetingText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 28,
  },
  summaryBanner: {
    backgroundColor: '#ffaa85', // premium soft orange
    borderRadius: 20,
    marginHorizontal: 24,
    marginTop: -20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#ffaa85',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#ffffff',
    flex: 1,
  },
  summaryTextBold: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  arrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSection: {
    marginTop: 20,
    paddingLeft: 24,
    marginBottom: 12,
  },
  filterScrollView: {
    paddingRight: 24,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  filterTabText: {
    fontFamily: 'Poppins_600Medium',
    fontSize: 12,
  },
  listContainer: {
    paddingHorizontal: 24,
  },
  blueCard: {
    backgroundColor: '#6c5ce7', // Indigo
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  blueCardText: {
    color: '#ffffff',
  },
  blueCardSubText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  blueCardIconCircle: {
    backgroundColor: '#ffffff',
  },
  blueCardTagBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  blueCardTagText: {
    color: '#ffffff',
  },
  standardCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardLocationText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
  },
  cardDurationText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
  },
  cardTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    marginBottom: 8,
  },
  cardTagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  cardTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardTagText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  cardPriceText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
  },
  cardPriceUnit: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    marginLeft: 1,
  },
  cardButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
  },
});