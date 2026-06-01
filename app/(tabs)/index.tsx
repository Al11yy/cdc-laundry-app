import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Modal,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import apiClient from '../../src/api/axios';
import { getToken } from '../../src/api/token';
import { checkAndNotifyStatusChanges, getNotifications, markAllNotificationsAsRead, clearNotifications } from '../../src/utils/notifications';

export default function CustomerDashboard() {
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [userName, setUserName] = useState('Pelanggan');
  const [userAddress, setUserAddress] = useState('Jakarta');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Notifications state
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Custom Alert & Toast states
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState<{ title: string; message: string } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
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
      
      // Jalankan pengecekan perubahan status secara lokal
      const newNotifs = await checkAndNotifyStatusChanges(allData);
      await loadNotificationsList();

      if (newNotifs && newNotifs.length > 0) {
        const latest = newNotifs[0];
        const isNewOrder = latest.old_status === 'BARU';

        // Tampilkan Toast sekilas (sesuai pedoman UX/Toast)
        setToastMessage(
          isNewOrder 
            ? `Pesanan baru ${latest.invoice_code} berhasil ditambahkan.` 
            : `Status cucian ${latest.invoice_code} diperbarui menjadi ${latest.new_status.toUpperCase()}.`
        );
        setToastVisible(true);
        
        // Timer toast
        setTimeout(() => {
          setToastVisible(false);
        }, 4000);
      }
    } catch (error: any) {
      console.error('Gagal memuat status laundry:', error);
      // Tampilkan Custom Alert untuk kendala jaringan (sesuai pedoman UX/Alert)
      setAlertData({
        title: 'Koneksi Bermasalah',
        message: 'Gagal terhubung ke server. Silakan periksa kembali koneksi internet Anda.'
      });
      setAlertVisible(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadNotificationsList = async () => {
    const list = await getNotifications();
    setNotifications(list);
    const unread = list.filter(n => !n.is_read).length;
    setUnreadNotifCount(unread);
  };

  const openNotifications = async () => {
    setIsNotifModalOpen(true);
    await markAllNotificationsAsRead();
    await loadNotificationsList();
  };

  const handleClearNotifications = async () => {
    await clearNotifications();
    await loadNotificationsList();
  };

  useFocusEffect(
    useCallback(() => {
      const checkAuth = async () => {
        const token = await getToken();
        if (!token) {
          router.replace('/login');
        } else {
          fetchDashboardData();
        }
      };
      checkAuth();
    }, [])
  );

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
      colors={['#e8eff7', '#f4f7fa']}
      style={styles.container}
    >
      
      {/* ================= BACKGROUND UNIK: FLOATING SOAP BUBBLES GRAPHICS ================= */}
      <View style={styles.bubbleBg1} />
      <View style={styles.bubbleBg2} />
      <View style={styles.bubbleBg3} />

      <FlatList
        data={activeOrders.slice(0, 4)}
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
                <TouchableOpacity 
                  style={styles.iconCircle} 
                  onPress={openNotifications}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons name="bell-outline" color="#475569" size={18} />
                  {unreadNotifCount > 0 && (
                    <View style={styles.bellBadge} />
                  )}
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

            {/* 4. PREMIUM UNIFIED STATS WIDGET */}
            <View style={styles.premiumStatsWidget}>
              <View style={styles.widgetHeader}>
                <Text style={styles.widgetHeaderTitle}>STATUS CUCIAN</Text>
              </View>
              <View style={styles.widgetBodyRow}>
                <View style={styles.widgetStatBlock}>
                  <Text style={[styles.widgetStatNumber, { color: '#a855f7' }]}>
                    {getCategorizedCount('Antrian')}
                  </Text>
                  <Text style={styles.widgetStatLabel}>ANTRIAN</Text>
                </View>

                <View style={styles.widgetVerticalDivider} />

                <View style={styles.widgetStatBlock}>
                  <Text style={[styles.widgetStatNumber, { color: '#2196D3' }]}>
                    {getCategorizedCount('Diproses')}
                  </Text>
                  <Text style={styles.widgetStatLabel}>DIPROSES</Text>
                </View>

                <View style={styles.widgetVerticalDivider} />

                <View style={styles.widgetStatBlock}>
                  <Text style={[styles.widgetStatNumber, { color: '#7EC839' }]}>
                    {getCategorizedCount('Siap Diambil')}
                  </Text>
                  <Text style={styles.widgetStatLabel}>SIAP AMBIL</Text>
                </View>
              </View>
            </View>

            {/* 5. TITLE AREA FOR LATEST LAUNDRY */}
            <View style={styles.laundryListHeader}>
              <Text style={styles.laundryListTitle}>CUCIAN TERAKHIR</Text>
              <Text style={styles.laundryListSub}>Memantau 4 cucian terbaru Anda</Text>
            </View>

          </View>
        }
        ListEmptyComponent={
          <View style={styles.glassEmptyContainer}>
            <MaterialCommunityIcons name="washing-machine" color="#cbd5e1" size={54} />
            <Text style={styles.emptyText}>Tidak ada data cucian saat ini.</Text>
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
        ListFooterComponent={
          <View style={styles.footerContainer}>
            {/* Button to view all history if total active orders > 4 */}
            {activeOrders.length > 4 && (
              <TouchableOpacity 
                style={styles.viewMoreBtn}
                onPress={() => router.push('/history')}
                activeOpacity={0.7}
              >
                <Text style={styles.viewMoreBtnText}>Lihat Semua Riwayat ({activeOrders.length})</Text>
                <MaterialCommunityIcons name="arrow-right" color="#2196D3" size={16} />
              </TouchableOpacity>
            )}

            {/* Custom footer display */}
            <View style={styles.footerInfoBlock}>
              <Text style={styles.footerText1}>CDC LAUNDRY CUSTOMER PORTAL</Text>
              <Text style={styles.footerText2}>Layanan Laundry Cepat & Bersih Terpercaya</Text>
              <Text style={styles.footerText3}>Hubungi Outlet: 0812-3456-7890</Text>
            </View>
          </View>
        }
      />

      {/* NOTIFICATIONS LIST MODAL */}
      <Modal
        visible={isNotifModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsNotifModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.bottomSheetModal}>
            <View style={styles.sheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="bell-ring-outline" color="#2196D3" size={20} />
                <Text style={styles.sheetTitle}>Notifikasi Status</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                {notifications.length > 0 && (
                  <TouchableOpacity onPress={handleClearNotifications}>
                    <Text style={styles.clearNotifText}>Hapus Semua</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setIsNotifModalOpen(false)}>
                  <MaterialCommunityIcons name="close" color="#475569" size={22} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetBody}>
              {notifications.length === 0 ? (
                <View style={styles.emptyNotifContainer}>
                  <MaterialCommunityIcons name="bell-off-outline" color="#cbd5e1" size={44} />
                  <Text style={styles.emptyNotifText}>Belum ada pemberitahuan status cucian.</Text>
                </View>
              ) : (
                notifications.map((notif) => {
                  const isNewOrder = notif.old_status === 'BARU';
                  return (
                    <View key={notif.id} style={styles.notifItemCard}>
                      <View style={styles.notifHeaderRow}>
                        <Text style={styles.notifInvoiceCode}>{notif.invoice_code}</Text>
                        <Text style={styles.notifTimeText}>
                          {new Date(notif.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <Text style={styles.notifMsgBody}>
                        {isNewOrder ? (
                          <Text>
                            Pesanan baru <Text style={{ fontFamily: 'Poppins_700Bold' }}>{notif.service_name}</Text> telah berhasil diterima dan masuk ke dalam antrean.
                          </Text>
                        ) : (
                          <Text>
                            Status pesanan <Text style={{ fontFamily: 'Poppins_700Bold' }}>{notif.service_name}</Text> berubah dari <Text style={{ textTransform: 'uppercase', color: '#94a3b8' }}>{notif.old_status}</Text> menjadi <Text style={{ textTransform: 'uppercase', color: '#2196D3', fontFamily: 'Poppins_700Bold' }}>{notif.new_status}</Text>.
                          </Text>
                        )}
                      </Text>
                    </View>
                  );
                })
              )}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CUSTOM FLOATING TOAST NOTIFICATION */}
      {toastVisible && (
        <View style={styles.toastOverlay}>
          <View style={styles.toastCard}>
            <MaterialCommunityIcons name="bell-ring" color="#ffffff" size={16} style={{ marginRight: 8 }} />
            <Text style={styles.toastText} numberOfLines={2}>{toastMessage}</Text>
            <TouchableOpacity onPress={() => setToastVisible(false)} style={{ marginLeft: 10 }}>
              <MaterialCommunityIcons name="close" color="#ffffff" size={14} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* CUSTOM POPUP ALERT DIALOG MODAL */}
      {alertVisible && alertData && (
        <Modal
          visible={alertVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setAlertVisible(false)}
        >
          <View style={styles.alertBackdrop}>
            <View style={styles.alertCard}>
              <View style={styles.alertIconCircle}>
                <MaterialCommunityIcons name="washing-machine" color="#2196D3" size={28} />
              </View>
              <Text style={styles.alertTitle}>{alertData.title}</Text>
              <Text style={styles.alertMessage}>{alertData.message}</Text>
              
              <TouchableOpacity 
                style={styles.alertBtn} 
                onPress={() => setAlertVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.alertBtnText}>Mengerti</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, backgroundColor: '#f4f6fa', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 140 },
  headerContainer: { paddingTop: 54 },
  
  // UNIK DEKORASI BACKGROUND GRAPHICS (BUBBLES)
  bubbleBg1: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(33, 150, 211, 0.04)', top: -20, left: -30 },
  bubbleBg2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(126, 200, 57, 0.03)', top: 250, right: -50 },
  bubbleBg3: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(33, 150, 211, 0.02)', bottom: 100, left: -10 },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingHorizontal: 22 },
  locationBlock: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  locationLabel: { fontFamily: 'Poppins_400Regular', fontSize: 10, color: '#64748b' },
  locationValue: { fontFamily: 'Poppins_600Medium', fontSize: 13, color: '#1e293b', marginTop: 1 },
  actionsBlock: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarContainer: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#2196D3', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#ffffff' },

  welcomeSection: { paddingHorizontal: 22, marginBottom: 16 },
  welcomeGreeting: { fontFamily: 'Poppins_700Bold', fontSize: 12, color: '#2196D3', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroTitle: { fontFamily: 'Poppins_700Bold', fontSize: 22, color: '#1e293b', lineHeight: 28, marginTop: 2 },
  
  premiumStatsWidget: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    marginHorizontal: 22,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14
  },
  widgetHeaderTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#64748b',
    letterSpacing: 0.8
  },
  widgetBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  widgetStatBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  widgetStatNumber: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    lineHeight: 28
  },
  widgetStatLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2,
    letterSpacing: 0.5
  },
  widgetVerticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.05)'
  },

  // TITLE AREA FOR LATEST LAUNDRY
  laundryListHeader: {
    paddingHorizontal: 22,
    marginBottom: 16
  },
  laundryListTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#1e293b',
    letterSpacing: 0.5
  },
  laundryListSub: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: '#64748b',
    marginTop: 2
  },

  // FOOTER CONTAINER & VIEW MORE BTN
  footerContainer: {
    paddingHorizontal: 22,
    marginTop: 10,
    alignItems: 'center',
  },
  viewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    paddingVertical: 12,
    width: '100%',
    marginBottom: 26,
  },
  viewMoreBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12.5,
    color: '#2196D3',
  },
  footerInfoBlock: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.04)',
    width: '100%',
  },
  footerText1: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#64748b',
    letterSpacing: 1,
  },
  footerText2: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 9.5,
    color: '#94a3b8',
    marginTop: 3,
  },
  footerText3: {
    fontFamily: 'Poppins_600Medium',
    fontSize: 9.5,
    color: '#2196D3',
    marginTop: 4,
  },

  // MODALS & NOTIFICATIONS STYLE
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.3)', justifyContent: 'flex-end' },
  bottomSheetModal: { backgroundColor: '#ffffff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '80%', borderWidth: 1, borderColor: '#e2e8f0' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', marginBottom: 16 },
  sheetTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#1e293b' },
  sheetBody: { marginBottom: 10 },
  clearNotifText: { fontFamily: 'Poppins_700Bold', fontSize: 12, color: '#f43f5e' },
  emptyNotifContainer: { alignItems: 'center', paddingVertical: 50, gap: 12 },
  emptyNotifText: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#94a3b8', textAlign: 'center' },
  notifItemCard: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  notifHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  notifInvoiceCode: { fontFamily: 'Poppins_700Bold', fontSize: 11, color: '#1e293b' },
  notifTimeText: { fontFamily: 'Poppins_500Medium', fontSize: 9, color: '#94a3b8' },
  notifMsgBody: { fontFamily: 'Poppins_500Medium', fontSize: 11, color: '#475569', lineHeight: 15 },
  bellBadge: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#f43f5e' },

  // MAIN CARD TRANSACTION GLASS LIST ITEMS
  cardWrapper: { paddingHorizontal: 22 },
  mainGlassCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#e2e8f0' },
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
  glassEmptyContainer: { alignItems: 'center', paddingVertical: 60, gap: 12, backgroundColor: '#ffffff', borderRadius: 24, marginHorizontal: 22, borderWidth: 1, borderColor: '#e2e8f0' },
  emptyText: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#64748b' },

  // CUSTOM FLOATING TOAST STYLE
  toastOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toastText: {
    color: '#ffffff',
    fontFamily: 'Poppins_600Medium',
    fontSize: 11.5,
    flex: 1,
  },
  
  // CUSTOM ALERT STYLE
  alertBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  alertCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  alertIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(33, 150, 211, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  alertMessage: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  alertBtn: {
    backgroundColor: '#2196D3',
    paddingVertical: 12,
    width: '100%',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: '#ffffff',
  },
});