import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, ScrollView, TouchableOpacity, RefreshControl, Alert, useColorScheme } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../src/api/axios';

const STATUS_STEPS = [
  { key: 'antrian', label: 'Ironing', desc: 'Pakaian masuk antrean setrika.', icon: 'iron' },
  { key: 'dicuci', label: 'Ironing', desc: 'Pakaian sedang dicuci.', icon: 'iron' },
  { key: 'disetrika', label: 'Packing', desc: 'Pakaian disetrika & dipacking rapi.', icon: 'package-variant-closed' },
  { key: 'siap diambil', label: 'Delivery', desc: 'Siap diambil di outlet / sedang dikirim.', icon: 'truck-delivery' },
  { key: 'diambil', label: 'Delivery', desc: 'Pakaian sudah diambil.', icon: 'truck-delivery' },
];

export default function OrderTrackingModal() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const fetchOrderDetail = async () => {
    try {
      const response = await apiClient.get('/status-laundry');
      const allOrders = response.data?.data || response.data || [];
      const currentOrder = allOrders.find((item: any) => item.id.toString() === id?.toString());
      
      if (currentOrder) {
        setOrder(currentOrder);
      } else {
        Alert.alert('Error', 'Detail transaksi tidak ditemukan.');
        router.back();
      }
    } catch (error: any) {
      console.error('Gagal mengambil detail pesanan:', error);
      Alert.alert(
        'Gagal Memuat',
        error.response?.data?.message || 'Koneksi ke backend Laravel terputus. Silakan coba lagi.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrderDetail();
    }
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderDetail();
  };

  const getStatusDisplay = () => {
    if (!order) return { title: 'Pending', subtitle: 'Estimated to be received today' };
    const status = order.status.toLowerCase();
    switch (status) {
      case 'antrian':
        return { title: 'Order Queued', subtitle: 'Awaiting process in queue' };
      case 'dicuci':
        return { title: 'Washing', subtitle: 'Currently being cleaned' };
      case 'disetrika':
        return { title: 'Ironing & Packing', subtitle: 'Clothes are ironed and packed' };
      case 'siap diambil':
        return { title: 'Ready to Collect', subtitle: 'Ready at outlet for pickup' };
      case 'diambil':
        return { title: 'Delivered', subtitle: 'Transaction completed successfully' };
      default:
        return { title: 'In Progress', subtitle: 'Estimated to be received today' };
    }
  };

  const getActiveTrackerIndex = () => {
    if (!order) return 0;
    const status = order.status.toLowerCase();
    if (status === 'antrian' || status === 'dicuci') return 0; // Ironing active
    if (status === 'disetrika') return 1; // Packing active
    return 2; // Delivery active
  };

  const themeColors = {
    background: isDark ? '#0a0a0a' : '#f8f9fa',
    headerText: isDark ? '#ffffff' : '#0a0a0a',
    cardBg: isDark ? '#171717' : '#ffffff',
    cardBorder: isDark ? '#262626' : '#e9ecef',
    text: isDark ? '#ffffff' : '#0a0a0a',
    textSecondary: isDark ? '#a3a3a3' : '#737373',
    capsuleBg: isDark ? '#ffffff' : '#171717',
    capsuleText: isDark ? '#0a0a0a' : '#ffffff',
    chevronColor: isDark ? '#ffffff' : '#171717',
    mapBg: isDark ? '#1a2436' : '#eaf2f8',
    mapRoad: isDark ? '#2a354c' : '#ffffff',
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color="#2196D3" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeColors.background }]}>
        <Text style={styles.errorText}>Pesanan tidak ditemukan.</Text>
      </View>
    );
  }

  const { title, subtitle } = getStatusDisplay();
  const trackerIndex = getActiveTrackerIndex();

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: isDark ? '#171717' : '#ffffff', borderColor: themeColors.cardBorder }]} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" color={themeColors.chevronColor} size={20} />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.backButton, { backgroundColor: isDark ? '#171717' : '#ffffff', borderColor: themeColors.cardBorder }]}>
          <MaterialCommunityIcons name="dots-horizontal" color={themeColors.chevronColor} size={20} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.titleText, { color: themeColors.text }]}>{title}</Text>
      <Text style={[styles.subtitleText, { color: themeColors.textSecondary }]}>{subtitle}</Text>

      {/* Capsule Tracker Bar */}
      <View style={[styles.trackerBar, { borderColor: themeColors.cardBorder, backgroundColor: themeColors.cardBg }]}>
        {/* Ironing */}
        {trackerIndex === 0 ? (
          <View style={[styles.activeCapsule, { backgroundColor: themeColors.capsuleBg }]}>
            <MaterialCommunityIcons name="iron" color={themeColors.capsuleText} size={14} />
            <Text style={[styles.activeCapsuleText, { color: themeColors.capsuleText }]}>Ironing</Text>
          </View>
        ) : (
          <Text style={[styles.inactiveText, { color: themeColors.textSecondary }]}>Ironing</Text>
        )}

        <Text style={[styles.separator, { color: themeColors.textSecondary }]}>&gt;&gt;&gt;</Text>

        {trackerIndex === 1 ? (
          <View style={[styles.activeCapsule, { backgroundColor: themeColors.capsuleBg }]}>
            <MaterialCommunityIcons name="package-variant-closed" color={themeColors.capsuleText} size={14} />
            <Text style={[styles.activeCapsuleText, { color: themeColors.capsuleText }]}>Packing</Text>
          </View>
        ) : (
          <Text style={[styles.inactiveText, { color: themeColors.textSecondary }]}>Packing</Text>
        )}

        <Text style={[styles.separator, { color: themeColors.textSecondary }]}>&gt;&gt;&gt;</Text>

        {trackerIndex === 2 ? (
          <View style={[styles.activeCapsule, { backgroundColor: themeColors.capsuleBg }]}>
            <MaterialCommunityIcons name="truck-delivery" color={themeColors.capsuleText} size={14} />
            <Text style={[styles.activeCapsuleText, { color: themeColors.capsuleText }]}>Delivery</Text>
          </View>
        ) : (
          <Text style={[styles.inactiveText, { color: themeColors.textSecondary }]}>Delivery</Text>
        )}
      </View>

      {/* Mock Map view container matching third screen */}
      <View style={[styles.mapContainer, { backgroundColor: themeColors.mapBg, borderColor: themeColors.cardBorder }]}>
        {/* Mock Roads (drawn via rotated lines) */}
        <View style={[styles.road, { width: '100%', height: 40, top: '40%', transform: [{ rotate: '-15deg' }], backgroundColor: themeColors.mapRoad }]} />
        <View style={[styles.road, { width: 35, height: '100%', left: '45%', backgroundColor: themeColors.mapRoad }]} />
        <View style={[styles.road, { width: '100%', height: 35, top: '65%', transform: [{ rotate: '10deg' }], backgroundColor: themeColors.mapRoad }]} />

        {/* Mock Dotted Delivery Route Trace */}
        <View style={styles.routeLine} />

        {/* Home/Customer Marker Pin */}
        <View style={[styles.markerPin, { bottom: '30%', right: '40%' }]}>
          <View style={styles.markerCircleBlue}>
            <MaterialCommunityIcons name="home" color="#ffffff" size={14} />
          </View>
          <View style={styles.markerPulseBlue} />
        </View>

        {/* Driver/Truck Marker Pin */}
        <View style={[styles.markerPin, { top: '35%', left: '20%' }]}>
          <View style={styles.markerCircleOrange}>
            <MaterialCommunityIcons name="truck-delivery" color="#ffffff" size={14} />
          </View>
          <View style={styles.markerPulseOrange} />
        </View>

        {/* Floating Card inside Map */}
        <View style={[styles.floatingMapCard, { backgroundColor: themeColors.cardBg, borderColor: themeColors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: trackerIndex === 2 ? 'rgba(126, 200, 57, 0.15)' : 'rgba(33, 150, 211, 0.15)' }]}>
              <MaterialCommunityIcons 
                name={trackerIndex === 2 ? 'truck-delivery' : (trackerIndex === 1 ? 'package-variant-closed' : 'iron')} 
                color={trackerIndex === 2 ? '#7EC839' : '#2196D3'} 
                size={22} 
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.floatingCardTitle, { color: themeColors.text }]}>{title}</Text>
              <Text style={[styles.floatingCardDesc, { color: themeColors.textSecondary }]}>
                {order.status === 'diambil' ? 'Cucian Anda telah selesai diterima.' : 'Kurir sedang memproses cucian Anda.'}
              </Text>
            </View>
          </View>
        </View>

        {/* Zoom Controls (Stacked vertically on bottom left) */}
        <View style={[styles.zoomControls, { backgroundColor: themeColors.cardBg, borderColor: themeColors.cardBorder }]}>
          <TouchableOpacity style={styles.zoomButton}>
            <MaterialCommunityIcons name="plus" color={themeColors.text} size={18} />
          </TouchableOpacity>
          <View style={[styles.zoomDivider, { backgroundColor: themeColors.cardBorder }]} />
          <TouchableOpacity style={styles.zoomButton}>
            <MaterialCommunityIcons name="minus" color={themeColors.text} size={18} />
          </TouchableOpacity>
        </View>

        {/* GPS Locate Button (Bottom left corner below zoom) */}
        <TouchableOpacity style={[styles.gpsButton, { backgroundColor: themeColors.capsuleBg }]}>
          <MaterialCommunityIcons name="crosshairs-gps" color={themeColors.capsuleText} size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
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
  titleText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
  },
  subtitleText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Poppins_400Regular',
    color: '#f43f5e',
    fontSize: 14,
  },
  trackerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    height: 40,
    marginBottom: 20,
  },
  activeCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    height: 30,
  },
  activeCapsuleText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
  },
  inactiveText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    paddingHorizontal: 8,
  },
  separator: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 8,
    letterSpacing: -1,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 30,
  },
  road: {
    position: 'absolute',
  },
  routeLine: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: '#7EC839',
    borderStyle: 'dashed',
    top: '40%',
    left: '23%',
    width: '40%',
    height: 60,
    transform: [{ rotate: '45deg' }],
  },
  markerPin: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  markerCircleBlue: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2196D3',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  markerPulseBlue: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(33, 150, 211, 0.2)',
    zIndex: 1,
  },
  markerCircleOrange: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffaa85',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  markerPulseOrange: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 170, 133, 0.25)',
    zIndex: 1,
  },
  floatingMapCard: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCardTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  floatingCardDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    marginTop: 2,
  },
  zoomControls: {
    position: 'absolute',
    bottom: 84,
    left: 20,
    borderRadius: 14,
    borderWidth: 1,
    width: 36,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  zoomButton: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomDivider: {
    height: 1,
    width: '80%',
  },
  gpsButton: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
