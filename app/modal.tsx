import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image, Modal } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Constants from 'expo-constants';
import apiClient from '../src/api/axios';

export default function OrderTrackingModal() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState('Pelanggan');
  const [customerPhone, setCustomerPhone] = useState('-');
  const [isFullscreenImage, setIsFullscreenImage] = useState(false);

  const getStorageURL = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const hostUri = Constants.expoConfig?.hostUri;
    const ip = hostUri ? hostUri.split(':')[0] : '192.168.0.110';
    return `http://${ip}:8000/storage/${path}`;
  };

  const fetchOrderDetail = async () => {
    try {
      const response = await apiClient.get('/status-laundry');
      const allOrders = response.data?.data || response.data || [];
      const currentOrder = allOrders.find((item: any) => item.id.toString() === id?.toString());
      
      if (currentOrder) {
        setOrder(currentOrder);

        // Fetch customer profile to get name and phone
        try {
          const profileRes = await apiClient.get('/profile');
          const userData = profileRes.data?.data || profileRes.data;
          if (userData) {
            setCustomerName(userData.name || 'Pelanggan');
            setCustomerPhone(userData.customer?.phone || '-');
          }
        } catch (err) {
          console.warn('Gagal memuat profil untuk nota:', err);
        }
      } else {
        Alert.alert('Error', 'Detail transaksi tidak ditemukan.');
        router.back();
      }
    } catch (error: any) {
      console.error('Gagal mengambil detail pesanan:', error);
      Alert.alert('Gagal Memuat', 'Koneksi ke server terputus. Silakan coba beberapa saat lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrderDetail();
    }
  }, [id]);

  const handlePrintReceipt = async () => {
    if (!order) return;
    try {
      const dateStr = new Date(order.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const priceUnitStr = Number(order.service?.price || 0).toLocaleString('id-ID');
      const totalPriceStr = Number(order.total_price || 0).toLocaleString('id-ID');

      const htmlContent = `
        <html>
          <head>
            <style>
              body {
                background: #fff !important;
                color: #000 !important;
                margin: 0 !important;
                padding: 20px !important;
                font-family: 'Courier New', Courier, monospace !important;
                font-size: 11pt !important;
                line-height: 1.4 !important;
                text-align: center !important;
              }
              .shop-name { font-weight: bold; font-size: 14pt; text-transform: uppercase; margin-bottom: 2px; }
              .shop-info { font-size: 9pt; margin-bottom: 2px; }
              .divider { margin: 8px 0; border-top: 1px dashed #000; }
              .detail-row { display: flex; justify-content: space-between; text-align: left; font-size: 10pt; margin-bottom: 3px; }
              .bold { font-weight: bold; }
              .total-row { display: flex; justify-content: space-between; text-align: left; font-size: 12pt; font-weight: bold; margin-top: 5px; }
              .footer-msg { font-size: 9pt; text-align: center; margin-top: 15px; font-style: italic; }
            </style>
          </head>
          <body>
            <div class="shop-name font-bold">CDC LAUNDRY</div>
            <div class="shop-info">Jl. Raya Kampus Udayana No. 20, Bali</div>
            <div class="shop-info">Telp/WA: 081234567890</div>
            
            <div class="divider"></div>
            
            <div class="detail-row">
              <span>Invoice:</span>
              <span class="bold">${order.invoice_code}</span>
            </div>
            <div class="detail-row">
              <span>Tanggal:</span>
              <span>${dateStr}</span>
            </div>
            <div class="detail-row">
              <span>Pelanggan:</span>
              <span>${customerName}</span>
            </div>
            <div class="detail-row">
              <span>Telepon:</span>
              <span>${customerPhone}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="detail-row bold" style="text-align: left;">
              ${order.service?.service_name || 'Layanan Laundry'}
            </div>
            <div class="detail-row" style="padding-left: 10px;">
              <span>${order.weight} ${order.service?.unit || 'Kg'} x Rp ${priceUnitStr}</span>
              <span>Rp ${totalPriceStr}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="total-row">
              <span>TOTAL BIAYA:</span>
              <span>Rp ${totalPriceStr}</span>
            </div>
            <div class="detail-row">
              <span>Pembayaran:</span>
              <span style="text-transform: uppercase;">${order.payment_method} (${order.payment_status})</span>
            </div>
            <div class="detail-row">
              <span>Status Cucian:</span>
              <span style="text-transform: uppercase;" class="bold">${order.status}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="footer-msg">
              <p class="bold">Terima Kasih Atas Kepercayaan Anda</p>
              <p style="font-size: 8pt; margin-top: 4px;">Mohon periksa cucian sebelum meninggalkan outlet. Komplain maksimal 24 jam setelah cucian diambil.</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Gagal memproses cetak nota PDF.');
    }
  };

  const getStatusDisplay = () => {
    if (!order) return { title: 'Pending', subtitle: 'Memproses data', color: '#64748b' };
    const status = order.status.toLowerCase();
    switch (status) {
      case 'antrian': return { title: 'Nota Masuk Antrean', subtitle: 'Pakaian berada di antrean awal sortir', color: '#a855f7' };
      case 'dicuci': return { title: 'Proses Pencucian', subtitle: 'Pakaian sedang diputar di mesin cuci', color: '#2196D3' };
      case 'disetrika': return { title: 'Penyetrikaan & Packing', subtitle: 'Pakaian sedang disetrika rapi', color: '#fb923c' };
      case 'siap diambil': return { title: 'Pakaian Siap Diambil', subtitle: 'Cucian beres! Silakan ambil di konter terdaftar', color: '#7EC839' };
      default: return { title: 'Transaksi Selesai', subtitle: 'Cucian sukses diserahkan ke pelanggan', color: '#64748b' };
    }
  };

  const getStepActive = () => {
    if (!order) return 0;
    const status = order.status.toLowerCase();
    if (status === 'antrian') return 1;
    if (status === 'dicuci') return 2;
    if (status === 'disetrika') return 3;
    return 4;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196D3" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Pesanan tidak ditemukan.</Text>
      </View>
    );
  }

  const { subtitle, color } = getStatusDisplay();
  const currentStep = getStepActive();
  const isPaid = order.payment_status?.toLowerCase() === 'paid';

  return (
    <View style={styles.container}>
      {/* HEADER TOP NAV BAR */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" color="#1e293b" size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>Pelacakan Detail Nota</Text>
        <TouchableOpacity style={styles.backButton} onPress={fetchOrderDetail}>
          <MaterialCommunityIcons name="refresh" color="#1e293b" size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* 1. MAIN OVERVIEW GLASS CARD */}
        <View style={styles.overviewGlassCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.headerMeta}>
              <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                <MaterialCommunityIcons name="tshirt-crew-outline" color={color} size={22} />
              </View>
              <View>
                <Text style={styles.cardServiceTitle}>{order.service?.service_name || 'Paket Laundry'}</Text>
                <Text style={styles.cardInvoiceCode}>{order.invoice_code}</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardMiddleGrid}>
            <View style={styles.gridColumn}>
              <Text style={styles.gridValue}>{order.weight} {order.service?.unit || 'Kg'}</Text>
              <Text style={styles.gridLabel}>Kuantitas</Text>
            </View>
            <View style={styles.gridDivider} />
            <View style={styles.gridColumn}>
              <Text style={styles.gridValue}>Rp {Number(order.total_price).toLocaleString('id-ID')}</Text>
              <Text style={styles.gridLabel}>Total Est Biaya</Text>
            </View>
          </View>

          <View style={styles.cardStatusFooterRow}>
            <MaterialCommunityIcons name="information-outline" color="#64748b" size={14} />
            <Text style={styles.cardStatusFooterText} numberOfLines={1}>{subtitle}</Text>
          </View>
        </View>

        {/* 2. REAL-TIME TIMELINE STEP CARD */}
        <View style={styles.timelineSectionCard}>
          <Text style={styles.sectionTitle}>Lini Masa Tahap Produksi</Text>
          
          {/* Step 1: Antrian */}
          <View style={styles.timelineStepRow}>
            <View style={styles.leftTimelineIndicatorBlock}>
              <View style={[styles.stepCircle, currentStep >= 1 && { backgroundColor: '#a855f7', borderColor: 'transparent' }]}>
                <MaterialCommunityIcons name="tray-full" color={currentStep >= 1 ? "#ffffff" : "#94a3b8"} size={12} />
              </View>
              <View style={[styles.verticalLineConnector, currentStep >= 2 && { backgroundColor: '#2196D3' }]} />
            </View>
            <View style={styles.rightStepDetailsBlock}>
              <Text style={[styles.stepLabelText, currentStep === 1 && { color: '#a855f7' }]}>Antrian Sortir</Text>
              <Text style={styles.stepDescText}>Nota masuk sistem, pakaian menunggu giliran penimbangan dan pemilahan kain.</Text>
            </View>
          </View>

          {/* Step 2: Dicuci */}
          <View style={styles.timelineStepRow}>
            <View style={styles.leftTimelineIndicatorBlock}>
              <View style={[styles.stepCircle, currentStep >= 2 && { backgroundColor: '#2196D3', borderColor: 'transparent' }]}>
                <MaterialCommunityIcons name="water" color={currentStep >= 2 ? "#ffffff" : "#94a3b8"} size={12} />
              </View>
              <View style={[styles.verticalLineConnector, currentStep >= 3 && { backgroundColor: '#fb923c' }]} />
            </View>
            <View style={styles.rightStepDetailsBlock}>
              <Text style={[styles.stepLabelText, currentStep === 2 && { color: '#2196D3' }]}>Proses Pencucian Mesin</Text>
              <Text style={styles.stepDescText}>Pakaian sedang dibersihkan secara higienis menggunakan cairan detergen premium.</Text>
            </View>
          </View>

          {/* Step 3: Disetrika */}
          <View style={styles.timelineStepRow}>
            <View style={styles.leftTimelineIndicatorBlock}>
              <View style={[styles.stepCircle, currentStep >= 3 && { backgroundColor: '#fb923c', borderColor: 'transparent' }]}>
                <MaterialCommunityIcons name="iron" color={currentStep >= 3 ? "#ffffff" : "#94a3b8"} size={12} />
              </View>
              <View style={[styles.verticalLineConnector, currentStep >= 4 && { backgroundColor: '#7EC839' }]} />
            </View>
            <View style={styles.rightStepDetailsBlock}>
              <Text style={[styles.stepLabelText, currentStep === 3 && { color: '#fb923c' }]}>Penyetrikaan & Packing Uap</Text>
              <Text style={styles.stepDescText}>Proses merapikan serat benang pakaian dan pembungkusan segel parfum wangi.</Text>
            </View>
          </View>

          {/* Step 4: Siap Diambil */}
          <View style={[styles.timelineStepRow, { marginBottom: 0 }]}>
            <View style={styles.leftTimelineIndicatorBlock}>
              <View style={[styles.stepCircle, currentStep >= 4 && { backgroundColor: '#7EC839', borderColor: 'transparent' }]}>
                <MaterialCommunityIcons name="check" color={currentStep >= 4 ? "#ffffff" : "#94a3b8"} size={12} />
              </View>
            </View>
            <View style={styles.rightStepDetailsBlock}>
              <Text style={[styles.stepLabelText, currentStep >= 4 && { color: '#7EC839' }]}>Pakaian Siap Diambil</Text>
              <Text style={styles.stepDescText}>Seluruh rangkaian pakaian selesai diproduksi dan stand-by penuh di rak konter konfirmasi.</Text>
            </View>
          </View>
        </View>

        {/* 3. NOTA FISIK / DIGITAL RECEIPT PREVIEW */}
        <View style={styles.receiptSectionCard}>
          <View style={styles.receiptHeaderRow}>
            <Text style={styles.sectionTitle}>Nota Transaksi</Text>
            <TouchableOpacity style={styles.printActionBtn} onPress={handlePrintReceipt}>
              <MaterialCommunityIcons name="printer-outline" color="#2196D3" size={14} />
              <Text style={styles.printActionText}>Cetak / PDF</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.thermalReceipt}>
            <Text style={styles.thermalTitle}>CDC LAUNDRY</Text>
            <Text style={styles.thermalSubtitle}>Jl. Raya Kampus Udayana No. 20, Bali</Text>
            <Text style={styles.thermalSubtitle}>Telp/WA: 081234567890</Text>
            
            <Text style={styles.thermalDivider}>----------------------------------------</Text>
            
            <View style={styles.thermalRow}>
              <Text style={styles.thermalMonoText}>Invoice:</Text>
              <Text style={[styles.thermalMonoText, styles.bold]}>{order.invoice_code}</Text>
            </View>
            <View style={styles.thermalRow}>
              <Text style={styles.thermalMonoText}>Tanggal:</Text>
              <Text style={styles.thermalMonoText}>
                {new Date(order.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
            <View style={styles.thermalRow}>
              <Text style={styles.thermalMonoText}>Pelanggan:</Text>
              <Text style={styles.thermalMonoText}>{customerName}</Text>
            </View>
            <View style={styles.thermalRow}>
              <Text style={styles.thermalMonoText}>Telepon:</Text>
              <Text style={styles.thermalMonoText}>{customerPhone}</Text>
            </View>
            
            <Text style={styles.thermalDivider}>----------------------------------------</Text>
            
            <Text style={[styles.thermalMonoText, styles.bold, { textAlign: 'left', width: '100%' }]}>
              {order.service?.service_name || 'Layanan Laundry'}
            </Text>
            <View style={[styles.thermalRow, { paddingLeft: 8 }]}>
              <Text style={styles.thermalMonoText}>
                {order.weight} {order.service?.unit || 'Kg'} x Rp {Number(order.service?.price || 0).toLocaleString('id-ID')}
              </Text>
              <Text style={styles.thermalMonoText}>
                Rp {Number(order.total_price).toLocaleString('id-ID')}
              </Text>
            </View>
            
            <Text style={styles.thermalDivider}>----------------------------------------</Text>
            
            <View style={styles.thermalRow}>
              <Text style={[styles.thermalMonoText, styles.bold, { fontSize: 13 }]}>TOTAL BIAYA:</Text>
              <Text style={[styles.thermalMonoText, styles.bold, { fontSize: 13 }]}>
                Rp {Number(order.total_price).toLocaleString('id-ID')}
              </Text>
            </View>
            <View style={styles.thermalRow}>
              <Text style={styles.thermalMonoText}>Pembayaran:</Text>
              <Text style={[styles.thermalMonoText, { textTransform: 'uppercase' }]}>
                {order.payment_method} ({order.payment_status})
              </Text>
            </View>
            <View style={styles.thermalRow}>
              <Text style={styles.thermalMonoText}>Status Cucian:</Text>
              <Text style={[styles.thermalMonoText, styles.bold, { textTransform: 'uppercase' }]}>
                {order.status}
              </Text>
            </View>
            
            <Text style={styles.thermalDivider}>----------------------------------------</Text>
            
            <Text style={[styles.thermalMonoText, styles.bold, { textAlign: 'center' }]}>
              Terima Kasih Atas Kepercayaan Anda
            </Text>
            <Text style={[styles.thermalMonoText, { textAlign: 'center', fontSize: 8, marginTop: 4, lineHeight: 11 }]}>
              Mohon periksa cucian sebelum meninggalkan outlet. Komplain maksimal 24 jam setelah cucian diambil.
            </Text>
          </View>
        </View>

        {/* 4. FINANCE CARD ACCENT */}
        <View style={styles.financeCard}>
          <Text style={styles.financeTitle}>Validasi Status Keuangan</Text>
          
          <View style={styles.financeRow}>
            <Text style={styles.financeLabel}>Metode Pembayaran</Text>
            <Text style={styles.financeValueText}>{order.payment_method?.toUpperCase() || 'CASH'}</Text>
          </View>

          <View style={[styles.financeRow, { borderBottomWidth: order.payment_proof ? 1 : 0, paddingBottom: order.payment_proof ? 10 : 0, marginBottom: order.payment_proof ? 10 : 0 }]}>
            <Text style={styles.financeLabel}>Validasi Kuitansi</Text>
            <View style={[styles.payBadge, { backgroundColor: isPaid ? 'rgba(126, 200, 57, 0.1)' : 'rgba(244, 63, 94, 0.1)', borderColor: isPaid ? '#7EC839' : '#f43f5e' }]}>
              <Text style={[styles.payBadgeText, { color: isPaid ? '#7EC839' : '#f43f5e' }]}>
                {isPaid ? 'LUNAS / PAID' : 'BELUM BAYAR / PENDING'}
              </Text>
            </View>
          </View>

          {/* Bukti Transfer Image Section */}
          {order.payment_proof ? (
            <View style={styles.paymentProofContainer}>
              <Text style={styles.paymentProofTitle}>Bukti Transfer / Pembayaran:</Text>
              <TouchableOpacity 
                style={styles.paymentProofImageWrapper} 
                onPress={() => setIsFullscreenImage(true)}
                activeOpacity={0.8}
              >
                <Image 
                  source={{ uri: getStorageURL(order.payment_proof) }} 
                  style={styles.paymentProofImage} 
                  resizeMode="cover"
                />
                <View style={styles.fullscreenIconOverlay}>
                  <MaterialCommunityIcons name="fullscreen" color="#ffffff" size={16} />
                  <Text style={styles.fullscreenText}>Sentuh untuk Perbesar</Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            order.payment_method?.toLowerCase() === 'transfer' && (
              <View style={styles.noProofMessageContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" color="#fb923c" size={16} />
                <Text style={styles.noProofMessageText}>Bukti transfer belum diunggah.</Text>
              </View>
            )
          )}
        </View>

      </ScrollView>

      {/* Fullscreen Payment Proof Modal */}
      <Modal
        visible={isFullscreenImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsFullscreenImage(false)}
      >
        <View style={styles.fullscreenOverlay}>
          <TouchableOpacity 
            style={styles.closeFullscreenBtn} 
            onPress={() => setIsFullscreenImage(false)}
          >
            <MaterialCommunityIcons name="close" color="#ffffff" size={24} />
          </TouchableOpacity>
          {order.payment_proof && (
            <Image 
              source={{ uri: getStorageURL(order.payment_proof) }} 
              style={styles.fullscreenImage} 
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f8fc', paddingHorizontal: 22 },
  centerContainer: { flex: 1, backgroundColor: '#f3f8fc', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingTop: 12, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 54, marginBottom: 20 },
  headerTitleText: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: '#1e293b', letterSpacing: 0.3 },
  backButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(33, 150, 211, 0.12)', shadowColor: '#2196D3', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  errorText: { fontFamily: 'Poppins_500Medium', color: '#f43f5e', fontSize: 13 },
  overviewGlassCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: 'rgba(33, 150, 211, 0.1)', marginBottom: 16, shadowColor: '#2196D3', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardServiceTitle: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: '#1e293b', lineHeight: 18 },
  cardInvoiceCode: { fontFamily: 'Poppins_500Medium', fontSize: 11, color: '#64748b', marginTop: 2 },
  cardMiddleGrid: { flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 14 },
  gridColumn: { flex: 1 },
  gridValue: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#1e293b' },
  gridLabel: { fontFamily: 'Poppins_500Medium', fontSize: 9, color: '#64748b', marginTop: 1 },
  gridDivider: { width: 1, height: 24, backgroundColor: 'rgba(0,0,0,0.04)', marginHorizontal: 12 },
  cardStatusFooterRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 2 },
  cardStatusFooterText: { fontFamily: 'Poppins_500Medium', fontSize: 10, color: '#64748b', flex: 1 },
  timelineSectionCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(33, 150, 211, 0.1)', marginBottom: 16, shadowColor: '#2196D3', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  sectionTitle: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#1e293b', marginBottom: 20, letterSpacing: 0.2 },
  timelineStepRow: { flexDirection: 'row', marginBottom: 4, minHeight: 60 },
  leftTimelineIndicatorBlock: { alignItems: 'center', marginRight: 14, width: 24 },
  stepCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  verticalLineConnector: { width: 2, flex: 1, backgroundColor: '#e2e8f0', marginTop: -2, marginBottom: -2, zIndex: 1 },
  rightStepDetailsBlock: { flex: 1, paddingTop: 1 },
  stepLabelText: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: '#94a3b8' },
  stepDescText: { fontFamily: 'Poppins_500Medium', fontSize: 10, color: '#64748b', marginTop: 2, lineHeight: 14 },
  financeCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: 'rgba(33, 150, 211, 0.1)', shadowColor: '#2196D3', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  financeTitle: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: '#1e293b', marginBottom: 14 },
  financeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)', marginBottom: 10 },
  financeLabel: { fontFamily: 'Poppins_500Medium', fontSize: 11, color: '#64748b' },
  financeValueText: { fontFamily: 'Poppins_700Bold', fontSize: 12, color: '#1e293b' },
  payBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  payBadgeText: { fontFamily: 'Poppins_700Bold', fontSize: 9, letterSpacing: 0.3 },
  
  // New Styles
  receiptSectionCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(33, 150, 211, 0.1)', marginBottom: 16, shadowColor: '#2196D3', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  receiptHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  printActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(33, 150, 211, 0.08)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  printActionText: { fontFamily: 'Poppins_700Bold', fontSize: 11, color: '#2196D3' },
  thermalReceipt: { backgroundColor: '#fcfdfa', borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 12, padding: 16, alignItems: 'center', width: '100%' },
  thermalTitle: { fontFamily: 'Courier New', fontWeight: 'bold', fontSize: 15, color: '#1e293b', letterSpacing: 1 },
  thermalSubtitle: { fontFamily: 'Courier New', fontSize: 9, color: '#64748b', marginTop: 1, textAlign: 'center' },
  thermalDivider: { fontFamily: 'Courier New', color: '#94a3b8', marginVertical: 6, letterSpacing: -0.5 },
  thermalRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 4 },
  thermalMonoText: { fontFamily: 'Courier New', fontSize: 11, color: '#1e293b' },
  bold: { fontWeight: 'bold' },
  paymentProofContainer: { marginTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.03)', paddingTop: 16 },
  paymentProofTitle: { fontFamily: 'Poppins_700Bold', fontSize: 11, color: '#64748b', marginBottom: 8 },
  paymentProofImageWrapper: { width: '100%', height: 180, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#f1f5f9' },
  paymentProofImage: { width: '100%', height: '100%' },
  fullscreenIconOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  fullscreenText: { fontFamily: 'Poppins_700Bold', fontSize: 10, color: '#ffffff' },
  noProofMessageContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: 'rgba(251, 146, 60, 0.08)', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(251, 146, 60, 0.15)' },
  noProofMessageText: { fontFamily: 'Poppins_600Medium', fontSize: 10, color: '#ea580c' },
  fullscreenOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  closeFullscreenBtn: { position: 'absolute', top: 54, right: 24, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  fullscreenImage: { width: '90%', height: '80%' },
});