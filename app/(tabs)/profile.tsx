import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import apiClient from '../../src/api/axios';
import { getToken, removeToken } from '../../src/api/token';
import { clearNotifications, getNotifications, LaundryNotification, markAllNotificationsAsRead } from '../../src/utils/notifications';

export default function ProfileScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [totalWeight, setTotalWeight] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  
  // Notifications state
  const [notifications, setNotifications] = useState<LaundryNotification[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const router = useRouter();

  const fetchProfileData = async () => {
    try {
      const response = await apiClient.get('/profile');
      const userData = response.data?.data || response.data;
      
      setName(userData.name || '');
      setPhone(userData.customer?.phone || '');
      setAddress(userData.customer?.address || '');

      // Ambil transaksi riwayat untuk menghitung data riil
      const trxRes = await apiClient.get('/status-laundry');
      const trxList = trxRes.data?.data || trxRes.data || [];
      setTotalTransactions(trxList.length);
      const weightSum = trxList.reduce((sum: number, trx: any) => sum + Number(trx.weight || 0), 0);
      setTotalWeight(weightSum);

      // Load local notifications
      await loadNotificationsList();
    } catch (error: any) {
      console.error('Gagal mengambil data profil dan transaksi:', error);
      Alert.alert('Error', error.response?.data?.message || 'Gagal memuat profile user.');
    } finally {
      setLoading(false);
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
          fetchProfileData();
        }
      };
      checkAuth();
    }, [])
  );

  const handleUpdateProfile = async () => {
    if (!name || !phone || !address) {
      Alert.alert('Peringatan', 'Semua kolom profil wajib diisi.');
      return;
    }

    setIsUpdating(true);
    try {
      await apiClient.put('/profile/update', { name, phone, address });
      Alert.alert('Sukses', 'Profil Anda berhasil diperbarui.');
      // Refresh data
      await fetchProfileData();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Gagal', error.response?.data?.message || 'Gagal menyimpan perubahan.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Keluar Akun', 'Apakah Anda yakin ingin keluar dari aplikasi?', [
      { text: 'Batal', style: 'cancel' },
      { 
        text: 'Keluar', 
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.post('/logout');
          } catch {
            console.log('Logout token local reset operation.');
          }
          await removeToken();
          router.replace('/login');
        }
      }
    ]);
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
      {/* BACKGROUND UNIK: FLOATING SOAP BUBBLES COATING */}
      <View style={styles.bubbleBg1} />
      <View style={styles.bubbleBg2} />
      <View style={styles.bubbleBg3} />

      {/* HEADER NAV BAR (Sesuai image) */}
      <View style={styles.navigationHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" color="#1e293b" size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>Profil</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
      >
        {/* PROFILE HEADER WIDGET (Sesuai image - Avatar di kiri, name, chevron edit) */}
        <TouchableOpacity 
          style={styles.profileHeaderWidget}
          onPress={() => setIsEditModalOpen(true)}
          activeOpacity={0.8}
        >
          <View style={styles.headerWidgetLeft}>
            <View style={styles.avatarCircleContainer}>
              <Text style={styles.avatarCircleText}>
                {name ? name.charAt(0).toUpperCase() : 'P'}
              </Text>
            </View>
            <View style={styles.headerWidgetInfo}>
              <Text style={styles.headerWidgetName}>{name || 'Pelanggan CDC'}</Text>
              <Text style={styles.headerWidgetSub}>Pelanggan CDC Laundry</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" color="#cbd5e1" size={24} />
        </TouchableOpacity>

        {/* METRICS CARD (Sesuai image - 3 columns, rounded) */}
        <View style={styles.unifiedMetricsCard}>
          <View style={styles.metricColumn}>
            <View style={[styles.metricIconBox, { backgroundColor: 'rgba(33, 150, 211, 0.08)' }]}>
              <MaterialCommunityIcons name="receipt-text-outline" color="#2196D3" size={18} />
            </View>
            <Text style={styles.metricValue}>{totalTransactions}</Text>
            <Text style={styles.metricSubLabel}>Total Nota</Text>
          </View>
          
          <View style={styles.verticalDivider} />

          <View style={styles.metricColumn}>
            <View style={[styles.metricIconBox, { backgroundColor: 'rgba(126, 200, 57, 0.08)' }]}>
              <MaterialCommunityIcons name="weight-kilogram" color="#7EC839" size={18} />
            </View>
            <Text style={styles.metricValue}>{totalWeight.toFixed(1)} Kg</Text>
            <Text style={styles.metricSubLabel}>Total Berat</Text>
          </View>

          <View style={styles.verticalDivider} />

          <TouchableOpacity 
            style={styles.metricColumn}
            onPress={openNotifications}
            activeOpacity={0.7}
          >
            <View style={[styles.metricIconBox, { backgroundColor: 'rgba(251, 146, 60, 0.08)' }]}>
              <MaterialCommunityIcons name="bell-outline" color="#fb923c" size={18} />
            </View>
            <Text style={styles.metricValue}>{unreadNotifCount}</Text>
            <Text style={styles.metricSubLabel}>Notif Baru</Text>
          </TouchableOpacity>
        </View>

        {/* SETTINGS MENU LIST (Sesuai image) */}
        <View style={styles.settingsMenuListContainer}>
          {/* Menu 1: Profil Saya */}
          <TouchableOpacity 
            style={styles.menuRowItem} 
            onPress={() => setIsEditModalOpen(true)}
          >
            <View style={styles.menuRowLeft}>
              <MaterialCommunityIcons name="account-outline" color="#2196D3" size={22} style={styles.menuIcon} />
              <Text style={styles.menuRowText}>Profil Saya</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" color="#cbd5e1" size={20} />
          </TouchableOpacity>

          {/* Menu 2: Notifikasi */}
          <TouchableOpacity 
            style={styles.menuRowItem} 
            onPress={openNotifications}
          >
            <View style={styles.menuRowLeft}>
              <MaterialCommunityIcons name="bell-outline" color="#2196D3" size={22} style={styles.menuIcon} />
              <Text style={styles.menuRowText}>Notifikasi</Text>
              {unreadNotifCount > 0 && (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>{unreadNotifCount}</Text>
                </View>
              )}
            </View>
            <MaterialCommunityIcons name="chevron-right" color="#cbd5e1" size={20} />
          </TouchableOpacity>

          {/* Menu 3: Riwayat aktivitas */}
          <TouchableOpacity 
            style={styles.menuRowItem} 
            onPress={() => router.push('/history')}
          >
            <View style={styles.menuRowLeft}>
              <MaterialCommunityIcons name="clock-outline" color="#2196D3" size={22} style={styles.menuIcon} />
              <Text style={styles.menuRowText}>Riwayat aktivitas</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" color="#cbd5e1" size={20} />
          </TouchableOpacity>

          {/* Menu 4: Kebijakan privasi */}
          <TouchableOpacity 
            style={styles.menuRowItem} 
            onPress={() => setIsPrivacyModalOpen(true)}
          >
            <View style={styles.menuRowLeft}>
              <MaterialCommunityIcons name="shield-check-outline" color="#2196D3" size={22} style={styles.menuIcon} />
              <Text style={styles.menuRowText}>Kebijakan privasi</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" color="#cbd5e1" size={20} />
          </TouchableOpacity>

          {/* Menu 5: Bantuan */}
          <TouchableOpacity 
            style={styles.menuRowItem} 
            onPress={() => setIsHelpModalOpen(true)}
          >
            <View style={styles.menuRowLeft}>
              <MaterialCommunityIcons name="help-circle-outline" color="#2196D3" size={22} style={styles.menuIcon} />
              <Text style={styles.menuRowText}>Bantuan</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" color="#cbd5e1" size={20} />
          </TouchableOpacity>

          {/* Menu 6: Logout (Sesuai image) */}
          <TouchableOpacity 
            style={styles.logoutMenuRowItem} 
            onPress={handleLogout}
          >
            <View style={styles.menuRowLeft}>
              <MaterialCommunityIcons name="logout-variant" color="#f43f5e" size={20} style={styles.menuIcon} />
              <Text style={styles.logoutMenuRowText}>Logout</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" color="#f43f5e" size={18} />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={isEditModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.bottomSheetModal}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Ubah Profil Saya</Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <MaterialCommunityIcons name="close" color="#475569" size={22} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetBody}>
              <Text style={styles.fieldLabel}>NAMA LENGKAP</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="account-circle-outline" color="#64748b" size={18} style={styles.fieldIcon} />
                <TextInput 
                  style={styles.input} 
                  value={name} 
                  onChangeText={setName} 
                  placeholder="Nama Lengkap Anda" 
                  placeholderTextColor="#94a3b8" 
                />
              </View>

              <Text style={styles.fieldLabel}>NOMOR WHATSAPP</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="whatsapp" color="#64748b" size={18} style={styles.fieldIcon} />
                <TextInput 
                  style={styles.input} 
                  value={phone} 
                  onChangeText={setPhone} 
                  keyboardType="phone-pad" 
                  placeholder="08xxxxxxxxxx" 
                  placeholderTextColor="#94a3b8" 
                />
              </View>

              <Text style={styles.fieldLabel}>ALAMAT PENGIRIMAN</Text>
              <View style={[styles.inputWrapper, styles.textareaWrapper]}>
                <MaterialCommunityIcons name="map-marker-outline" color="#64748b" size={18} style={[styles.fieldIcon, { marginTop: 14 }]} />
                <TextInput 
                  style={[styles.input, styles.textarea]} 
                  value={address} 
                  onChangeText={setAddress} 
                  multiline 
                  numberOfLines={4} 
                  placeholder="Tulis alamat rumah lengkap anda..." 
                  placeholderTextColor="#94a3b8" 
                />
              </View>

              <TouchableOpacity 
                style={styles.saveBtn} 
                onPress={async () => {
                  await handleUpdateProfile();
                  setIsEditModalOpen(false);
                }} 
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <View style={styles.buttonInner}>
                    <MaterialCommunityIcons name="check-all" color="#ffffff" size={16} />
                    <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
                notifications.map((notif) => (
                  <View key={notif.id} style={styles.notifItemCard}>
                    <View style={styles.notifHeaderRow}>
                      <Text style={styles.notifInvoiceCode}>{notif.invoice_code}</Text>
                      <Text style={styles.notifTimeText}>
                        {new Date(notif.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={styles.notifMsgBody}>
                      Status pesanan <Text style={{ fontFamily: 'Poppins_700Bold' }}>{notif.service_name}</Text> berubah dari <Text style={{ textTransform: 'uppercase', color: '#94a3b8' }}>{notif.old_status}</Text> menjadi <Text style={{ textTransform: 'uppercase', color: '#2196D3', fontFamily: 'Poppins_700Bold' }}>{notif.new_status}</Text>.
                    </Text>
                  </View>
                ))
              )}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* PRIVACY POLICY MODAL */}
      <Modal
        visible={isPrivacyModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPrivacyModalOpen(false)}
      >
        <View style={styles.modalBackdropBlur}>
          <View style={styles.centerInfoModal}>
            <Text style={styles.infoModalTitle}>Kebijakan Privasi</Text>
            <ScrollView style={{ maxHeight: 200, marginVertical: 12 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.infoModalText}>
                CDC Laundry sangat menghargai privasi data pribadi Anda. Kami mengumpulkan dan mengolah data seperti nama lengkap, nomor WhatsApp, serta alamat pengiriman dengan satu-satunya tujuan untuk mengoperasikan layanan laundry digital secara akurat dan tepat waktu.
                {"\n\n"}
                Kami menjamin data Anda aman dan tidak disebarluaskan kepada pihak ketiga yang tidak berkepentingan tanpa persetujuan tertulis Anda. Semua transaksi keuangan dilindungi dengan protokol keamanan internal kami.
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.closeInfoBtn} onPress={() => setIsPrivacyModalOpen(false)}>
              <Text style={styles.closeInfoBtnText}>Tutup Kebijakan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* HELP MODAL */}
      <Modal
        visible={isHelpModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsHelpModalOpen(false)}
      >
        <View style={styles.modalBackdropBlur}>
          <View style={styles.centerInfoModal}>
            <Text style={styles.infoModalTitle}>Bantuan & Layanan CDC</Text>
            <Text style={[styles.infoModalText, { marginVertical: 14, textAlign: 'center' }]}>
              Mengalami kendala pemesanan atau pelacakan status cucian? Hubungi Layanan Pelanggan CDC Laundry:
              {"\n\n"}
              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#2196D3' }}>0812-3456-7890</Text>
              {"\n\n"}
              Jam Operasional Outlet:{"\n"}Senin - Sabtu (08:00 - 20:00 WITA)
            </Text>
            <TouchableOpacity style={styles.closeInfoBtn} onPress={() => setIsHelpModalOpen(false)}>
              <Text style={styles.closeInfoBtnText}>Mengerti</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 130 },
  centerContainer: { flex: 1, backgroundColor: '#f4f6fa', justifyContent: 'center', alignItems: 'center' },
  
  // BACKGROUND UNIK GRAPHICS
  bubbleBg1: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(126, 200, 57, 0.04)', top: -15, left: -25 },
  bubbleBg2: { position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(33, 150, 211, 0.03)', top: 300, right: -40 },
  bubbleBg3: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(126, 200, 57, 0.02)', bottom: 80, left: -20 },

  // NAVIGATION HEADER (Sesuai image)
  navigationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 54,
    paddingHorizontal: 22,
    marginBottom: 16
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  headerTitleText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#1e293b'
  },

  // PROFILE HEADER WIDGET (Sesuai image)
  profileHeaderWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 20
  },
  headerWidgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  avatarCircleContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2196D3'
  },
  avatarCircleText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: '#2196D3'
  },
  headerWidgetInfo: {
    justifyContent: 'center'
  },
  headerWidgetName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#1e293b'
  },
  headerWidgetSub: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: '#64748b',
    marginTop: 1
  },

  // UNIFIED METRICS CARD (Sesuai image - 3 columns, rounded)
  unifiedMetricsCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 26,
    alignItems: 'center'
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6
  },
  metricValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#1e293b'
  },
  metricSubLabel: {
    fontFamily: 'Poppins_600Medium',
    fontSize: 10,
    color: '#64748b',
    marginTop: 2
  },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.05)'
  },

  // SETTINGS MENU LIST (Sesuai image - Flat menu rows)
  settingsMenuListContainer: {
    paddingHorizontal: 8
  },
  menuRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
    marginBottom: 2
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  menuIcon: {
    width: 24
  },
  menuRowText: {
    fontFamily: 'Poppins_600Medium',
    fontSize: 13,
    color: '#1e293b'
  },
  menuBadge: {
    backgroundColor: '#f43f5e',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 6
  },
  menuBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 9,
    color: '#ffffff'
  },
  logoutMenuRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.15)',
    borderRadius: 16,
    backgroundColor: 'rgba(244, 63, 94, 0.02)',
    paddingHorizontal: 16,
    marginTop: 20
  },
  logoutMenuRowText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: '#f43f5e'
  },

  // MODALS & BOTTOM SHEETS
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    justifyContent: 'flex-end'
  },
  modalBackdropBlur: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32
  },
  bottomSheetModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 16
  },
  sheetTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#1e293b'
  },
  sheetBody: {
    marginBottom: 10
  },
  fieldLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 9,
    color: '#64748b',
    marginBottom: 6,
    marginTop: 10,
    letterSpacing: 1
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 46,
    paddingHorizontal: 12,
    marginBottom: 12
  },
  textareaWrapper: {
    height: 96,
    alignItems: 'flex-start'
  },
  fieldIcon: {
    marginRight: 10
  },
  input: {
    flex: 1,
    color: '#1e293b',
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    height: '100%'
  },
  textarea: {
    textAlignVertical: 'top',
    paddingTop: 12,
    height: '100%'
  },
  saveBtn: {
    backgroundColor: '#2196D3',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  saveBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: '#ffffff'
  },

  // NOTIFICATION CARD LISTS
  clearNotifText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: '#f43f5e'
  },
  emptyNotifContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    gap: 12
  },
  emptyNotifText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center'
  },
  notifItemCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  notifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  notifInvoiceCode: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    color: '#1e293b'
  },
  notifTimeText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 9,
    color: '#94a3b8'
  },
  notifMsgBody: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: '#475569',
    lineHeight: 15
  },

  // INFO DIALOGS (Help, Policy)
  centerInfoModal: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center'
  },
  infoModalTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: '#1e293b'
  },
  infoModalText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 18
  },
  closeInfoBtn: {
    backgroundColor: '#2196D3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 10,
    width: '100%',
    alignItems: 'center'
  },
  closeInfoBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: '#ffffff'
  }
});