import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../../src/api/axios';
import { getToken, removeToken } from '../../src/api/token';

export default function ProfileScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [totalWeight, setTotalWeight] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
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
    } catch (error: any) {
      console.error('Gagal mengambil data profil dan transaksi:', error);
      Alert.alert('Error', error.response?.data?.message || 'Gagal memuat profile user.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      if (!token) {
        router.replace('/login');
      } else {
        fetchProfileData();
      }
    };
    checkAuth();
  }, []);

  const handleUpdateProfile = async () => {
    if (!name || !phone || !address) {
      Alert.alert('Peringatan', 'Semua kolom profil wajib diisi, cui!');
      return;
    }

    setIsUpdating(true);
    try {
      await apiClient.put('/profile/update', { name, phone, address });
      Alert.alert('Sukses', 'Profil anda berhasil diperbarui.');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Gagal', error.response?.data?.message || 'Gagal menyimpan perubahan.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Yakin ingin keluar dari aplikasi laundry, cui?', [
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
      colors={['#f2faf4', '#ffffff']}
      style={styles.container}
    >
      {/* BACKGROUND UNIK: FLOATING SOAP BUBBLES COATING */}
      <View style={styles.bubbleBg1} />
      <View style={styles.bubbleBg2} />
      <View style={styles.bubbleBg3} />

      <ScrollView 
        contentContainerStyle={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.titleText}>Profil Saya</Text>
          <Text style={styles.subtitleText}>Kelola data diri dan alamat pengiriman laundry anda</Text>
        </View>

        {/* UNIFIED PREMIUM SHEET LAYOUT */}
        <View style={styles.unifiedProfileSheet}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.largeAvatarCircle}>
              <Text style={styles.largeAvatarText}>
                {name ? name.charAt(0).toUpperCase() : 'P'}
              </Text>
            </View>
            <Text style={styles.profileNameTitle} numberOfLines={1}>{name || 'Pelanggan CDC'}</Text>
          </View>

          {/* Stats Metrics Grid */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricColumn}>
              <MaterialCommunityIcons name="receipt-text-outline" color="#2196D3" size={20} />
              <Text style={styles.metricValue}>{totalTransactions} Nota</Text>
              <Text style={styles.metricLabel}>Total Transaksi</Text>
            </View>
            
            <View style={styles.verticalDivider} />

            <View style={styles.metricColumn}>
              <MaterialCommunityIcons name="weight-kilogram" color="#7EC839" size={20} />
              <Text style={styles.metricValue}>{totalWeight.toFixed(1)} Kg</Text>
              <Text style={styles.metricLabel}>Total Cucian</Text>
            </View>
          </View>

          <View style={styles.sheetDivider} />

          {/* Form Fields Section */}
          <View style={styles.formSection}>
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
              style={styles.saveButton} 
              onPress={handleUpdateProfile} 
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={styles.buttonInner}>
                  <MaterialCommunityIcons name="check-all" color="#ffffff" size={16} />
                  <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.sheetDivider} />

          {/* Logout Section */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialCommunityIcons name="power" color="#f43f5e" size={16} />
            <Text style={styles.logoutText}>Keluar Sesi Akun</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingHorizontal: 22, paddingTop: 60, paddingBottom: 130 },
  centerContainer: { flex: 1, backgroundColor: '#f3f8fc', justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 24 },
  titleText: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: '#1e293b' },
  subtitleText: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#64748b', marginTop: 2 },
  
  // BACKGROUND UNIK GRAPHICS
  bubbleBg1: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(126, 200, 57, 0.04)', top: -15, left: -25 },
  bubbleBg2: { position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(33, 150, 211, 0.03)', top: 300, right: -40 },
  bubbleBg3: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(126, 200, 57, 0.02)', bottom: 80, left: -20 },

  // UNIFIED PREMIUM SHEET LAYOUT
  unifiedProfileSheet: { 
    backgroundColor: '#ffffff', 
    borderRadius: 28, 
    padding: 22, 
    borderWidth: 1, 
    borderColor: 'rgba(33, 150, 211, 0.1)', 
    shadowColor: '#2196D3', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.04, 
    shadowRadius: 16, 
    elevation: 3 
  },
  
  avatarSection: { 
    alignItems: 'center', 
    marginBottom: 20 
  },
  largeAvatarCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: 'rgba(33, 150, 211, 0.08)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 211, 0.15)'
  },
  largeAvatarText: { fontFamily: 'Poppins_700Bold', fontSize: 30, color: '#2196D3' },
  profileNameTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#1e293b', textAlign: 'center', width: '90%' },
  
  metricsGrid: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc',
    borderRadius: 20, 
    paddingVertical: 14, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    marginBottom: 20
  },
  metricColumn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#1e293b', marginTop: 4 },
  metricLabel: { fontFamily: 'Poppins_500Medium', fontSize: 10, color: '#64748b', marginTop: 1 },
  verticalDivider: { width: 1, height: 32, backgroundColor: '#e2e8f0' },
  
  sheetDivider: { 
    height: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.05)', 
    marginVertical: 20 
  },
  
  formSection: {
    width: '100%'
  },
  fieldLabel: { fontFamily: 'Poppins_700Bold', fontSize: 9, color: '#64748b', marginBottom: 6, marginTop: 10, letterSpacing: 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', height: 46, paddingHorizontal: 12, marginBottom: 12 },
  textareaWrapper: { height: 96, alignItems: 'flex-start' },
  fieldIcon: { marginRight: 10 },
  input: { flex: 1, color: '#1e293b', fontFamily: 'Poppins_500Medium', fontSize: 13, height: '100%' },
  textarea: { textAlignVertical: 'top', paddingTop: 12, height: '100%' },
  saveButton: { backgroundColor: '#2196D3', padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 12, shadowColor: '#2196D3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 2 },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  saveButtonText: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: '#ffffff' },
  
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(244, 63, 94, 0.2)', backgroundColor: 'rgba(244, 63, 94, 0.04)' },
  logoutText: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: '#f43f5e' }
});