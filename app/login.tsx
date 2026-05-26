import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, useColorScheme, Image } from 'react-native';
import { useRouter } from 'expo-router';
import apiClient from '../src/api/axios'; 
import { setToken } from '../src/api/token';

export default function LoginCustomer() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email dan password wajib diisi, cui!');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/login', { email, password });
      
      if (response.data.access_token) {
        await setToken(response.data.access_token);
        Alert.alert('Sukses', 'Login berhasil! Memuat data tracking anda...');
        router.replace('/(tabs)');
      } else {
        Alert.alert('Login Gagal', 'Token tidak ditemukan dalam response.');
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        'Login Gagal',
        error.response?.data?.message || 'Koneksi ke backend Laravel terputus, coi.'
      );
    } finally {
      setLoading(false);
    }
  };

  const themeColors = {
    background: isDark ? '#0a1628' : '#f8f9fa',
    cardBg: isDark ? '#0e1f38' : '#ffffff',
    borderColor: isDark ? 'rgba(33, 150, 211, 0.2)' : '#e9ecef',
    text: isDark ? '#ffffff' : '#0a0a0a',
    textSecondary: isDark ? '#a3a3a3' : '#737373',
    inputBg: isDark ? '#050c16' : '#ffffff',
    buttonBg: '#2196D3', // Brand Blue
    buttonText: '#ffffff',
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <View style={styles.brandContainer}>
        {/* CDC Brand Logo */}
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=150&q=80' }} 
          style={styles.logoImage}
        />
        <Text style={[styles.logoText, { color: themeColors.text }]}>CDC Laundry</Text>
        <Text style={styles.subtitleText}>Real-time Customer Tracking</Text>
      </View>

      <View style={[styles.formContainer, { backgroundColor: themeColors.cardBg, borderColor: themeColors.borderColor }]}>
        <Text style={[styles.label, { color: themeColors.text }]}>Email Pelanggan</Text>
        <TextInput
          style={[styles.input, { backgroundColor: themeColors.inputBg, borderColor: themeColors.borderColor, color: themeColors.text }]}
          placeholder="customer@email.com"
          placeholderTextColor={isDark ? '#495a72' : '#adb5bd'}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={[styles.label, { color: themeColors.text }]}>Password</Text>
        <TextInput
          style={[styles.input, { backgroundColor: themeColors.inputBg, borderColor: themeColors.borderColor, color: themeColors.text }]}
          placeholder="••••••••"
          placeholderTextColor={isDark ? '#495a72' : '#adb5bd'}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: themeColors.buttonBg }]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Masuk Ke Aplikasi</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#7EC839', // Brand Green border for CDC Logo style
    marginBottom: 16,
  },
  logoText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
  },
  subtitleText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#7EC839', // Brand Green subtitle
    marginTop: 4,
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  formContainer: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  label: {
    fontFamily: 'Poppins_600Medium',
    fontSize: 13,
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  button: {
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#2196D3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: '#ffffff',
  },
});