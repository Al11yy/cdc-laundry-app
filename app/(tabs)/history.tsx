import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, RefreshControl, Alert, useColorScheme, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../src/api/axios';
import { getToken } from '../../src/api/token';

export default function HistoryScreen() {
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [completedOrdersCount, setCompletedOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const fetchOrders = async () => {
    try {
      const response = await apiClient.get('/status-laundry');
      const data = response.data?.data || response.data || [];
      setAllOrders(data);

      // Counts
      const active = data.filter((trx: any) => trx.status.toLowerCase() !== 'diambil');
      const completed = data.filter((trx: any) => trx.status.toLowerCase() === 'diambil');
      setActiveOrdersCount(active.length);
      setCompletedOrdersCount(completed.length);
    } catch (error: any) {
      console.error('Gagal memuat pesanan:', error);
      Alert.alert(
        'Error Koneksi',
        error.response?.data?.message || 'Gagal memuat data pesanan. Periksa koneksi internet Anda.'
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
        fetchOrders();
      }
    };
    checkAuth();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getEstimationText = (order: any) => {
    const dateObj = new Date(order.created_at);
    const day = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    
    switch (order.status.toLowerCase()) {
      case 'antrian': return `Estimation: Today at 18:00`;
      case 'dicuci': return `Estimation: Today at 16:45`;
      case 'disetrika': return `Estimation: Today at 15:30`;
      case 'siap diambil': return `Estimation: Ready to collect`;
      default: return `Estimation: Completed on ${day}`;
    }
  };

  const themeColors = {
    background: isDark ? '#0a0a0a' : '#f8f9fa',
    cardBg: isDark ? '#171717' : '#ffffff',
    cardBorder: isDark ? '#262626' : '#e9ecef',
    text: isDark ? '#ffffff' : '#0a0a0a',
    textSecondary: isDark ? '#a3a3a3' : '#737373',
    capsuleBg: isDark ? '#ffffff' : '#171717',
    capsuleText: isDark ? '#0a0a0a' : '#ffffff',
    chevronColor: isDark ? '#ffffff' : '#171717',
    toggleBg: isDark ? '#262626' : '#e9ecef',
    toggleActiveBg: isDark ? '#ffffff' : '#ffffff',
    toggleActiveIcon: isDark ? '#0a0a0a' : '#171717',
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color="#2196D3" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: isDark ? '#171717' : '#ffffff', borderColor: themeColors.cardBorder }]} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" color={themeColors.chevronColor} size={20} />
        </TouchableOpacity>
        
        {/* Toggle list/grid (Mocked visual matching screenshot) */}
        <View style={[styles.toggleContainer, { backgroundColor: themeColors.toggleBg }]}>
          <View style={[styles.toggleButton, { backgroundColor: themeColors.toggleActiveBg }]}>
            <MaterialCommunityIcons name="format-list-bulleted" color={themeColors.toggleActiveIcon} size={16} />
          </View>
          <View style={[styles.toggleButton, { backgroundColor: 'transparent' }]}>
            <MaterialCommunityIcons name="view-grid-outline" color={isDark ? '#a3a3a3' : '#737373'} size={16} />
          </View>
        </View>
      </View>

      <Text style={[styles.titleText, { color: themeColors.text }]}>My order</Text>
      <Text style={[styles.subtitleText, { color: themeColors.textSecondary }]}>
        You have {activeOrdersCount} order in progress
      </Text>

      {/* Count Cards Grid */}
      <View style={styles.countCardsContainer}>
        {/* In Progress */}
        <View style={[styles.countCard, { backgroundColor: '#ff9f43' }]}>
          <Text style={styles.countNumber}>{activeOrdersCount}</Text>
          <Text style={styles.countLabel}>In progress</Text>
        </View>

        {/* Completed */}
        <View style={[styles.countCard, { backgroundColor: '#5f27cd' }]}>
          <Text style={styles.countNumber}>{completedOrdersCount}</Text>
          <Text style={styles.countLabel}>Completed</Text>
        </View>

        {/* Cancelled (Mocked) */}
        <View style={[styles.countCard, { backgroundColor: '#ff6b6b' }]}>
          <Text style={styles.countNumber}>1</Text>
          <Text style={styles.countLabel}>Cancelled</Text>
        </View>
      </View>

      {/* Orders List */}
      <FlatList
        data={allOrders}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2196D3" />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const status = item.status.toLowerCase();
          const estimation = getEstimationText(item);

          // Determine active tab in tracking bar
          // Stages: Ironing -> Packing -> Delivery
          const isIroningActive = status === 'antrian' || status === 'dicuci';
          const isPackingActive = status === 'disetrika';
          const isDeliveryActive = status === 'siap diambil' || status === 'diambil';

          return (
            <TouchableOpacity 
              style={[styles.orderCard, { backgroundColor: themeColors.cardBg, borderColor: themeColors.cardBorder }]}
              onPress={() => router.push({ pathname: '/modal', params: { id: item.id } })}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: themeColors.text }]}>
                    {item.service?.service_name || 'Layanan Laundry'}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: themeColors.textSecondary }]}>
                    {estimation}
                  </Text>
                </View>

                <TouchableOpacity 
                  style={[styles.arrowButton, { borderColor: themeColors.cardBorder }]}
                  onPress={() => router.push({ pathname: '/modal', params: { id: item.id } })}
                >
                  <MaterialCommunityIcons name="arrow-top-right" color={themeColors.text} size={16} />
                </TouchableOpacity>
              </View>

              {/* Capsule Tracker Bar */}
              <View style={[styles.trackerBar, { borderColor: themeColors.cardBorder }]}>
                {/* Ironing */}
                {isIroningActive ? (
                  <View style={[styles.activeCapsule, { backgroundColor: themeColors.capsuleBg }]}>
                    <MaterialCommunityIcons name="iron" color={themeColors.capsuleText} size={14} />
                    <Text style={[styles.activeCapsuleText, { color: themeColors.capsuleText }]}>Ironing</Text>
                  </View>
                ) : (
                  <Text style={[styles.inactiveText, { color: themeColors.textSecondary }]}>Ironing</Text>
                )}

                <Text style={[styles.separator, { color: themeColors.textSecondary }]}>&gt;&gt;&gt;</Text>

                {isPackingActive ? (
                  <View style={[styles.activeCapsule, { backgroundColor: themeColors.capsuleBg }]}>
                    <MaterialCommunityIcons name="package-variant-closed" color={themeColors.capsuleText} size={14} />
                    <Text style={[styles.activeCapsuleText, { color: themeColors.capsuleText }]}>Packing</Text>
                  </View>
                ) : (
                  <Text style={[styles.inactiveText, { color: themeColors.textSecondary }]}>Packing</Text>
                )}

                <Text style={[styles.separator, { color: themeColors.textSecondary }]}>&gt;&gt;&gt;</Text>

                {isDeliveryActive ? (
                  <View style={[styles.activeCapsule, { backgroundColor: themeColors.capsuleBg }]}>
                    <MaterialCommunityIcons name="truck-delivery" color={themeColors.capsuleText} size={14} />
                    <Text style={[styles.activeCapsuleText, { color: themeColors.capsuleText }]}>Delivery</Text>
                  </View>
                ) : (
                  <Text style={[styles.inactiveText, { color: themeColors.textSecondary }]}>Delivery</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
  },
  listContent: {
    paddingBottom: 110, // clear floating tab bar
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 3,
    alignItems: 'center',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
  },
  subtitleText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginBottom: 18,
    marginTop: 2,
  },
  countCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  countCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countNumber: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: '#ffffff',
  },
  countLabel: {
    fontFamily: 'Poppins_600Medium',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  orderCard: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
  },
  cardSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    marginTop: 2,
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 4,
    height: 38,
  },
  activeCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    height: 28,
  },
  activeCapsuleText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
  },
  inactiveText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    paddingHorizontal: 8,
  },
  separator: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 8,
    letterSpacing: -1,
  },
});