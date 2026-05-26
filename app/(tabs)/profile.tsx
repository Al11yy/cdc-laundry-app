import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../src/api/axios';
import { getToken, removeToken } from '../../src/api/token';

export default function ProfileScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const fetchProfileData = async () => {
    try {
      const response = await apiClient.get('/profile');
      const userData = response.data?.data || response.data;
      
      setName(userData.name || '');
      setPhone(userData.customer?.phone || '');
      setAddress(userData.customer?.address || '');
    } catch (error: any) {
      console.error('Gagal mengambil data profil:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Gagal memuat profile user. Periksa koneksi internet Anda.'
      );
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
      Alert.alert('Sukses 🎉', 'Profil anda berhasil diperbarui.');
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
          } catch (e) {
            console.log('Logout token local reset operation.');
          }
          await removeToken();
          router.replace('/login');
        }
      }
    ]);
  };

  const themeColors = {
    background: isDark ? '#0a0a0a' : '#f8f9fa',
    cardBg: isDark ? '#171717' : '#ffffff',
    cardBorder: isDark ? '#262626' : '#e9ecef',
    text: isDark ? '#ffffff' : '#0a0a0a',
    textSecondary: isDark ? '#a3a3a3' : '#737373',
    inputBg: isDark ? '#0a0a0a' : '#ffffff',
    saveBtnBg: '#2196D3', // Brand Blue
    saveBtnText: '#ffffff',
    greenAccent: '#7EC839', // Brand Green
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color="#2196D3" />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={[styles.titleText, { color: themeColors.text }]}>Profil Saya</Text>
        <Text style={[styles.subtitleText, { color: themeColors.textSecondary }]}>
          Kelola data diri dan alamat pengiriman laundry anda
        </Text>
      </View>

      <View style={[styles.formCard, { backgroundColor: themeColors.cardBg, borderColor: themeColors.cardBorder }]}>
        <Text style={[styles.label, { color: themeColors.text }]}>Nama Lengkap</Text>
        <TextInput 
          style={[styles.input, { backgroundColor: themeColors.inputBg, borderColor: themeColors.cardBorder, color: themeColors.text }]} 
          value={name} 
          onChangeText={setName} 
          placeholder="Nama Anda" 
          placeholderTextColor={isDark ? '#525252' : '#adb5bd'} 
        />

        <Text style={[styles.label, { color: themeColors.text }]}>Nomor WhatsApp</Text>
        <TextInput 
          style={[styles.input, { backgroundColor: themeColors.inputBg, borderColor: themeColors.cardBorder, color: themeColors.text }]} 
          value={phone} 
          onChangeText={setPhone} 
          keyboardType="phone-pad" 
          placeholder="08xxxxxxxxxx" 
          placeholderTextColor={isDark ? '#525252' : '#adb5bd'} 
        />

        <Text style={[styles.label, { color: themeColors.text }]}>Alamat Rumah / Pengiriman</Text>
        <TextInput 
          style={[styles.input, styles.textarea, { backgroundColor: themeColors.inputBg, borderColor: themeColors.cardBorder, color: themeColors.text }]} 
          value={address} 
          onChangeText={setAddress} 
          multiline 
          numberOfLines={4} 
          placeholder="Tulis alamat lengkap anda..." 
          placeholderTextColor={isDark ? '#525252' : '#adb5bd'} 
        />

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: themeColors.saveBtnBg }]} onPress={handleUpdateProfile} disabled={isUpdating}>
          {isUpdating ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <View style={styles.buttonInner}>
              <MaterialCommunityIcons name="content-save" color={themeColors.saveBtnText} size={16} />
              <Text style={[styles.saveButtonText, { color: themeColors.saveBtnText }]}>Simpan Profil</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.logoutButton, { borderColor: 'rgba(244, 63, 94, 0.2)' }]} onPress={handleLogout}>
        <MaterialCommunityIcons name="logout" color="#f43f5e" size={16} />
        <Text style={styles.logoutText}>Keluar Akun</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  contentContainer: { 
    paddingHorizontal: 20, 
    paddingTop: 60, 
    paddingBottom: 110, // clear floating tab bar
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  header: { 
    marginBottom: 24,
  },
  titleText: { 
    fontFamily: 'Poppins_700Bold', 
    fontSize: 24, 
  },
  subtitleText: { 
    fontFamily: 'Poppins_400Regular', 
    fontSize: 12, 
    marginTop: 2,
  },
  formCard: { 
    padding: 20, 
    borderRadius: 24, 
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  label: { 
    fontFamily: 'Poppins_600Medium', 
    fontSize: 13, 
    marginBottom: 6, 
    marginTop: 10,
  },
  input: { 
    fontFamily: 'Poppins_400Regular', 
    fontSize: 14, 
    padding: 14, 
    borderRadius: 14, 
    borderWidth: 1, 
    marginBottom: 10,
  },
  textarea: { 
    height: 90, 
    textAlignVertical: 'top',
  },
  saveButton: { 
    padding: 15, 
    borderRadius: 14, 
    alignItems: 'center', 
    marginTop: 20,
    shadowColor: '#2196D3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonInner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
  },
  saveButtonText: { 
    fontFamily: 'Poppins_700Bold', 
    fontSize: 14, 
  },
  logoutButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    marginTop: 24, 
    padding: 14, 
    borderRadius: 14, 
    borderWidth: 1, 
    backgroundColor: 'rgba(244, 63, 94, 0.05)',
  },
  logoutText: { 
    fontFamily: 'Poppins_700Bold', 
    fontSize: 14, 
    color: '#f43f5e',
  },
});