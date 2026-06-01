import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  Image,
  SafeAreaView,
  useColorScheme
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../src/api/axios'; 
import { setToken } from '../src/api/token';

export default function LoginCustomer() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Peringatan', 'Email dan password wajib diisi, cui!');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/login', { email, password });
      
      if (response.data.access_token) {
        await setToken(response.data.access_token);
        Alert.alert('Sukses 🎉', 'Login berhasil! Selamat datang kembali.');
        router.replace('/(tabs)');
      } else {
        Alert.alert('Login Gagal', 'Token tidak ditemukan dalam response.');
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        'Login Gagal',
        error.response?.data?.message || 'Gagal terhubung ke server Laravel.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Solid Premium Theme Colors (No elevation shadow bleed through)
  const themeColors = {
    background: isDark ? '#0a0b10' : '#f3f8fc',
    cardBg: isDark ? '#11121a' : '#ffffff',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(33, 150, 211, 0.12)',
    inputBg: isDark ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc',
    inputBorder: isDark ? 'rgba(255, 255, 255, 0.05)' : '#e2e8f0',
    text: isDark ? '#ffffff' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    label: isDark ? '#94a3b8' : '#475569',
    brandBlue: '#2196D3',
    brandGreen: '#7EC839',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Floating Bubbles Background Graphics */}
      <View style={[styles.bubble, styles.bubble1, { backgroundColor: `${themeColors.brandBlue}08` }]} />
      <View style={[styles.bubble, styles.bubble2, { backgroundColor: `${themeColors.brandGreen}06` }]} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
      >
        <View style={styles.formWrapper}>
          {/* Logo Squircle */}
          <View style={styles.logoWrapper}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/images/logo-cdc.jpg')} 
                style={styles.logoImage} 
              />
            </View>
            <Text style={[styles.logoTitleText, { color: themeColors.text }]}>CDC Laundry</Text>
            <Text style={[styles.logoSubtitleText, { color: themeColors.textSecondary }]}>
              Customer Tracking Engine
            </Text>
          </View>

          {/* Glassmorphism Form Card */}
          <View style={[
            styles.glassCard, 
            { 
              backgroundColor: themeColors.cardBg, 
              borderColor: themeColors.cardBorder 
            }
          ]}>
            {/* Email Field */}
            <Text style={[styles.label, { color: themeColors.label }]}>EMAIL PELANGGAN</Text>
            <View style={[
              styles.inputContainer, 
              { 
                backgroundColor: themeColors.inputBg, 
                borderColor: themeColors.inputBorder 
              }
            ]}>
              <MaterialCommunityIcons name="email-outline" color={themeColors.textSecondary} size={16} style={styles.fieldIcon} />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="customer@cdclaundry.com"
                placeholderTextColor={isDark ? '#4b5563' : '#94a3b8'}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Password Field */}
            <Text style={[styles.label, { color: themeColors.label }]}>PASSWORD KUNCI</Text>
            <View style={[
              styles.inputContainer, 
              { 
                backgroundColor: themeColors.inputBg, 
                borderColor: themeColors.inputBorder 
              }
            ]}>
              <MaterialCommunityIcons name="lock-outline" color={themeColors.textSecondary} size={16} style={styles.fieldIcon} />
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="Masukkan password Anda"
                placeholderTextColor={isDark ? '#4b5563' : '#94a3b8'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureText}
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeButton}>
                <MaterialCommunityIcons 
                  name={secureText ? "eye-outline" : "eye-off-outline"} 
                  color={themeColors.textSecondary} 
                  size={18} 
                />
              </TouchableOpacity>
            </View>

            {/* Login Action Button */}
            <TouchableOpacity 
              style={[styles.loginButton, { backgroundColor: themeColors.brandBlue }]} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={styles.buttonInner}>
                  <MaterialCommunityIcons name="login-variant" color="#ffffff" size={16} />
                  <Text style={styles.loginButtonText}>MASUK PELACAKAN</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Rights */}
          <Text style={[styles.footerText, { color: themeColors.textSecondary }]}>
            © 2026 CDC LAUNDRY // VERSI CUSTOMER v2.0
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  formWrapper: {
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  // Background Bubbles
  bubble: {
    position: 'absolute',
    borderRadius: 100,
  },
  bubble1: {
    width: 200,
    height: 200,
    top: -40,
    left: -40,
  },
  bubble2: {
    width: 180,
    height: 180,
    bottom: -30,
    right: -30,
  },
  // Logo
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffffff',
    marginBottom: 14,
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  logoTitleText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
  },
  logoSubtitleText: {
    fontFamily: 'Poppins_600Medium',
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  // Glass Card
  glassCard: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    paddingVertical: 28,
    paddingHorizontal: 20,
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 4,
  },
  label: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 9,
    marginBottom: 6,
    marginTop: 10,
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 46,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  fieldIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    height: '100%',
  },
  eyeButton: {
    padding: 4,
  },
  loginButton: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loginButtonText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: '#ffffff',
  },
  footerText: {
    fontFamily: 'monospace',
    fontSize: 8,
    marginTop: 32,
    letterSpacing: 0.5,
  },
});