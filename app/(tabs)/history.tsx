import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import apiClient from '../../src/api/axios';
import { getToken } from '../../src/api/token';

const PERIOD_FILTERS = [
  { key: 'Hari Ini', label: 'Hari Ini' },
  { key: 'Minggu Ini', label: 'Minggu Ini' },
  { key: 'Bulan Ini', label: 'Bulan Ini' },
  { key: 'Sepanjang Masa', label: 'Sepanjang Masa' },
  { key: 'Pilih Tanggal', label: 'Pilih Rentang Tanggal...' }
];

const LAUNDRY_STATUSES = ['Semua', 'Antrian', 'Dicuci', 'Disetrika', 'Siap Diambil', 'Diambil'];

export default function HistoryScreen() {
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [completedOrdersCount, setCompletedOrdersCount] = useState(0);
  const [totalExpenditure, setTotalExpenditure] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('Sepanjang Masa');
  const [selectedLaundryStatus, setSelectedLaundryStatus] = useState('Semua');
  const [selectedServiceType, setSelectedServiceType] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Custom date selection state
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());

  const router = useRouter();

  const dynamicServiceTypes = ['Semua', ...Array.from(new Set(allOrders.map(o => o.service?.service_name).filter(Boolean)))];

  const getStorageURL = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const hostUri = Constants.expoConfig?.hostUri;
    const ip = hostUri ? hostUri.split(':')[0] : '192.168.0.110';
    return `http://${ip}:8000/storage/${path}`;
  };

  const applyFilters = (
    ordersList: any[], 
    period: string, 
    query: string, 
    laundryStatus: string, 
    serviceType: string,
    startDt?: Date | null, 
    endDt?: Date | null
  ) => {
    const now = new Date();
    let filtered = [...ordersList];

    // 1. Period Filter
    if (period === 'Hari Ini') {
      filtered = ordersList.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.toDateString() === now.toDateString();
      });
    } else if (period === 'Minggu Ini') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      filtered = ordersList.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= oneWeekAgo;
      });
    } else if (period === 'Bulan Ini') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      filtered = ordersList.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= oneMonthAgo;
      });
    } else if ((period === 'Pilih Tanggal' || period === 'Pilih Rentang Tanggal...') && startDt && endDt) {
      const start = new Date(startDt);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDt);
      end.setHours(23, 59, 59, 999);
      filtered = ordersList.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= start && orderDate <= end;
      });
    }

    // 2. Laundry Status Filter
    if (laundryStatus && laundryStatus !== 'Semua') {
      filtered = filtered.filter(order => order.status?.toLowerCase() === laundryStatus.toLowerCase());
    }

    // 3. Service Type Filter
    if (serviceType && serviceType !== 'Semua') {
      filtered = filtered.filter(order => order.service?.service_name?.toLowerCase() === serviceType.toLowerCase());
    }

    // 4. Search Query Filter
    if (query.trim() !== '') {
      filtered = filtered.filter(order => 
        order.invoice_code?.toLowerCase().includes(query.toLowerCase()) ||
        order.service?.service_name?.toLowerCase().includes(query.toLowerCase())
      );
    }

    setFilteredOrders(filtered);

    // Recalculate total spent on filtered list
    const totalSpend = filtered.reduce((sum: number, trx: any) => sum + Number(trx.total_price || 0), 0);
    setTotalExpenditure(totalSpend);
  };

  const fetchOrders = async () => {
    try {
      const response = await apiClient.get('/status-laundry');
      const data = response.data?.data || response.data || [];
      setAllOrders(data);
      applyFilters(data, selectedPeriod, searchQuery, selectedLaundryStatus, selectedServiceType, startDate, endDate);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handlePeriodSelect = (periodLabel: string) => {
    setIsDropdownOpen(false);
    if (periodLabel === 'Pilih Rentang Tanggal...') {
      setIsCalendarOpen(true);
    } else {
      setSelectedPeriod(periodLabel);
      setStartDate(null);
      setEndDate(null);
      applyFilters(allOrders, periodLabel, searchQuery, selectedLaundryStatus, selectedServiceType, null, null);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    applyFilters(allOrders, selectedPeriod, text, selectedLaundryStatus, selectedServiceType, startDate, endDate);
  };

  const handleLaundryStatusSelect = (status: string) => {
    setSelectedLaundryStatus(status);
    applyFilters(allOrders, selectedPeriod, searchQuery, status, selectedServiceType, startDate, endDate);
  };

  const handleServiceTypeSelect = (serviceType: string) => {
    setSelectedServiceType(serviceType);
    applyFilters(allOrders, selectedPeriod, searchQuery, selectedLaundryStatus, serviceType, startDate, endDate);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = (firstDay.getDay() + 6) % 7; // Monday is 0
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < dayOfWeek; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };



  const getEstimationText = (order: any) => {
    const dateObj = new Date(order.created_at);
    const day = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    
    switch (order.status.toLowerCase()) {
      case 'antrian': return `Berada pada antrean standard`;
      case 'dicuci': return `Sedang diproses di dalam mesin cuci`;
      case 'disetrika': return `Proses penyetrikaan dan pelipatan rapi`;
      case 'siap diambil': return `Siap diambil di counter outlet`;
      default: return `Telah sukses diserahkan pada ${day}`;
    }
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

      {/* UPPER NAVIGATION BAR HEADER (FIXED - NO PDF BUTTON) */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" color="#1e293b" size={20} />
        </TouchableOpacity>
        
        <View style={styles.headerRightActions}>
          {/* PREMIUM FILTER DROPDOWN TRIGGER (Sesuai image_f071a9.png Light Mode) */}
          <TouchableOpacity 
            style={styles.premiumFilterDropdownButton} 
            onPress={() => setIsDropdownOpen(true)}
          >
            <MaterialCommunityIcons name="calendar-month-outline" color="#2196D3" size={16} />
            <Text style={styles.premiumFilterButtonText}>
              {selectedPeriod === 'Pilih Tanggal' && startDate && endDate 
                ? `${startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`
                : selectedPeriod}
            </Text>
            <MaterialCommunityIcons name="chevron-down" color="#64748b" size={14} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2196D3" />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ paddingBottom: 16 }}>
            <Text style={styles.titleText}>Riwayat Cucian</Text>
            <Text style={styles.subtitleText}>Memantau akumulasi data dan arsip transaksi operasional Anda</Text>

            {/* 1. FILTER SEARCH BAR (Fitur 1) */}
            <View style={styles.searchBarContainer}>
              <MaterialCommunityIcons name="magnify" color="#64748b" size={18} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari kode invoice atau layanan..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={handleSearchChange}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearchChange('')}>
                  <MaterialCommunityIcons name="close-circle" color="#cbd5e1" size={16} />
                </TouchableOpacity>
              )}
            </View>

            {/* 2. DUA FILTER TERPISAH (STATUS & JENIS LAYANAN) */}
            <View style={styles.filtersWrapper}>
              {/* Seksi Filter Status Cucian */}
              <View style={styles.filterSectionContainer}>
                <Text style={styles.filterLabelText}>STATUS CUCIAN</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterChipsRow}
                >
                  {LAUNDRY_STATUSES.map((status) => {
                    const isSelected = selectedLaundryStatus === status;
                    return (
                      <TouchableOpacity
                        key={status}
                        onPress={() => handleLaundryStatusSelect(status)}
                        style={[
                          styles.filterChip,
                          isSelected ? styles.filterChipActive : styles.filterChipInactive
                        ]}
                      >
                        <Text style={[
                          styles.filterChipText,
                          isSelected ? styles.filterChipTextActive : styles.filterChipTextInactive
                        ]}>
                          {status}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Seksi Filter Jenis Layanan */}
              <View style={styles.filterSectionContainer}>
                <Text style={styles.filterLabelText}>JENIS LAYANAN</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterChipsRow}
                >
                  {dynamicServiceTypes.map((serviceName) => {
                    const isSelected = selectedServiceType === serviceName;
                    return (
                      <TouchableOpacity
                        key={serviceName}
                        onPress={() => handleServiceTypeSelect(serviceName)}
                        style={[
                          styles.filterChip,
                          isSelected ? styles.filterChipActive : styles.filterChipInactive
                        ]}
                      >
                        <Text style={[
                          styles.filterChipText,
                          isSelected ? styles.filterChipTextActive : styles.filterChipTextInactive
                        ]}>
                          {serviceName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            {/* 2. STATS HEADER (REDESIGNED FOR PREMIUM LOOK & HIGHLIGHTED EXPENDITURE) */}
            <View style={styles.statsWrapper}>
              {/* Total Expenditure: Large Prominent Full-Width Card */}
              <View style={styles.expenditureCard}>
                <View style={styles.expenditureLeft}>
                  <Text style={styles.expenditureLabel}>
                    TOTAL PENGELUARAN (
                    {selectedPeriod === 'Pilih Tanggal' && startDate && endDate
                      ? `${startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }).toUpperCase()} - ${endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }).toUpperCase()}`
                      : selectedPeriod.toUpperCase()}
                    )
                  </Text>
                  <Text style={styles.expenditureValue}>
                    Rp {totalExpenditure.toLocaleString('id-ID')}
                  </Text>
                  
                  {/* Dynamic Smart Insights (New premium feature) */}
                  <View style={styles.insightRow}>
                    <View style={styles.insightItem}>
                      <MaterialCommunityIcons name="calculator-variant-outline" color="#2196D3" size={12} style={{ marginRight: 2 }} />
                      <Text style={styles.insightText}>Rata-rata: Rp {Math.round(totalExpenditure / (filteredOrders.length || 1)).toLocaleString('id-ID')}</Text>
                    </View>
                    <View style={styles.insightItem}>
                      <MaterialCommunityIcons name="heart-pulse" color="#7EC839" size={12} style={{ marginRight: 2 }} />
                      <Text style={styles.insightText} numberOfLines={1}>Favorit: {(() => {
                        const serviceCounts: { [key: string]: number } = {};
                        filteredOrders.forEach(o => {
                          const name = o.service?.service_name || 'Layanan';
                          serviceCounts[name] = (serviceCounts[name] || 0) + 1;
                        });
                        let favService = '-';
                        let maxCount = 0;
                        Object.entries(serviceCounts).forEach(([name, count]) => {
                          if (count > maxCount) {
                            maxCount = count;
                            favService = name;
                          }
                        });
                        return favService;
                      })()}</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.expenditureIconContainer, { backgroundColor: 'rgba(126, 200, 57, 0.12)' }]}>
                  <MaterialCommunityIcons name="wallet-outline" color="#7EC839" size={24} />
                </View>
              </View>

              {/* Counts Row: Two smaller columns */}
              <View style={styles.countsRow}>
                <View style={[styles.countCardNew, { borderColor: '#e2e8f0' }]}>
                  <View style={styles.countCardHeader}>
                    <View style={[styles.countIconBox, { backgroundColor: 'rgba(33, 150, 211, 0.08)' }]}>
                      <MaterialCommunityIcons name="washing-machine" color="#2196D3" size={16} />
                    </View>
                    <Text style={[styles.countNumberNew, { color: '#2196D3' }]}>{activeOrdersCount}</Text>
                  </View>
                  <Text style={styles.countLabelNew}>Cucian Berjalan</Text>
                </View>

                <View style={[styles.countCardNew, { borderColor: '#e2e8f0' }]}>
                  <View style={styles.countCardHeader}>
                    <View style={[styles.countIconBox, { backgroundColor: 'rgba(126, 200, 57, 0.08)' }]}>
                      <MaterialCommunityIcons name="check-circle-outline" color="#7EC839" size={16} />
                    </View>
                    <Text style={[styles.countNumberNew, { color: '#7EC839' }]}>{completedOrdersCount}</Text>
                  </View>
                  <Text style={styles.countLabelNew}>Cucian Selesai</Text>
                </View>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="history" color="#cbd5e1" size={48} />
            <Text style={styles.emptyText}>Tidak ada riwayat cucian yang cocok.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const status = item.status.toLowerCase();
          const isDone = status === 'diambil';
          const estimation = getEstimationText(item);
          const accentColor = isDone ? "#7EC839" : "#2196D3";

          return (
            <TouchableOpacity 
              style={styles.orderGlassCard}
              onPress={() => router.push({ pathname: '/modal', params: { id: item.id } })}
            >
              <View style={styles.cardHeader}>
                <View style={styles.serviceMeta}>
                  <View style={[styles.serviceIconBox, { backgroundColor: isDone ? 'rgba(126, 200, 57, 0.08)' : 'rgba(33, 150, 211, 0.08)', overflow: 'hidden' }]}>
                    {item.service?.service_photo ? (
                      <Image 
                        source={{ uri: getStorageURL(item.service.service_photo) }} 
                        style={{ width: '100%', height: '100%' }} 
                        resizeMode="cover"
                      />
                    ) : (
                      <MaterialCommunityIcons 
                        name={isDone ? "checkbox-marked-circle-outline" : "washing-machine"} 
                        color={accentColor} 
                        size={18} 
                      />
                    )}
                  </View>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.cardTitle}>{item.service?.service_name || 'Paket Laundry'}</Text>
                    <Text style={styles.cardSubtitle} numberOfLines={1}>{estimation}</Text>
                  </View>
                </View>

                <View style={[styles.arrowButton, { borderColor: 'rgba(0,0,0,0.05)', backgroundColor: '#ffffff' }]}>
                  <MaterialCommunityIcons name="arrow-top-right" color="#475569" size={14} />
                </View>
              </View>

              <View style={styles.cardFooterArea}>
                <Text style={styles.invoiceTextCode}>{item.invoice_code}</Text>
                <View style={styles.rightWeightBadge}>
                  <Text style={styles.weightText}>{item.weight} {item.service?.unit || 'Kg'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* OVERLAY FILTER POPUP MODAL COUNTERPARTS */}
      <Modal
        visible={isDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsDropdownOpen(false)}>
          <View style={styles.modalOverlayBackground}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdownFloatingMenu}>
                {PERIOD_FILTERS.map((filter) => {
                  const isCurrentSelected = selectedPeriod === filter.label || (filter.key === 'Pilih Tanggal' && selectedPeriod === 'Pilih Tanggal');
                  return (
                    <TouchableOpacity
                      key={filter.key}
                      style={[styles.dropdownItemRow, isCurrentSelected && styles.dropdownItemRowActive]}
                      onPress={() => handlePeriodSelect(filter.label)}
                    >
                      <Text style={[styles.dropdownItemText, isCurrentSelected ? styles.dropdownItemTextActive : styles.dropdownItemTextInactive]}>
                        {filter.label}
                      </Text>
                      {isCurrentSelected && <MaterialCommunityIcons name="check" color="#2196D3" size={16} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* CUSTOM CALENDAR MODAL */}
      <Modal
        visible={isCalendarOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsCalendarOpen(false)}
      >
        <View style={styles.calendarModalBackdrop}>
          <View style={styles.calendarModalContent}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Pilih Rentang Tanggal</Text>
              <TouchableOpacity onPress={() => setIsCalendarOpen(false)}>
                <MaterialCommunityIcons name="close" color="#475569" size={20} />
              </TouchableOpacity>
            </View>

            {/* Month Navigation Row */}
            <View style={styles.monthNavRow}>
              <TouchableOpacity 
                onPress={() => {
                  const prev = new Date(currentCalendarMonth);
                  prev.setMonth(prev.getMonth() - 1);
                  setCurrentCalendarMonth(prev);
                }}
                style={styles.navArrow}
              >
                <MaterialCommunityIcons name="chevron-left" color="#1e293b" size={20} />
              </TouchableOpacity>
              <Text style={styles.monthTextName}>
                {currentCalendarMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  const next = new Date(currentCalendarMonth);
                  next.setMonth(next.getMonth() + 1);
                  setCurrentCalendarMonth(next);
                }}
                style={styles.navArrow}
              >
                <MaterialCommunityIcons name="chevron-right" color="#1e293b" size={20} />
              </TouchableOpacity>
            </View>

            {/* Days Header */}
            <View style={styles.daysHeaderGrid}>
              {['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'].map((day) => (
                <Text key={day} style={styles.daysHeaderLabel}>{day}</Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {getDaysInMonth(currentCalendarMonth).map((day, idx) => {
                if (!day) return <View key={`empty-${idx}`} style={styles.gridDayBox} />;
                
                const isStart = startDate ? day.toDateString() === startDate.toDateString() : false;
                const isEnd = endDate ? day.toDateString() === endDate.toDateString() : false;
                const isBetween = startDate && endDate && day > startDate && day < endDate;
                
                return (
                  <TouchableOpacity
                    key={`day-${day.toISOString()}`}
                    onPress={() => {
                      if (!startDate || (startDate && endDate)) {
                        setStartDate(day);
                        setEndDate(null);
                      } else {
                        if (day < startDate) {
                          setStartDate(day);
                        } else {
                          setEndDate(day);
                        }
                      }
                    }}
                    style={[
                      styles.gridDayBox,
                      isStart && styles.gridDayStart,
                      isEnd && styles.gridDayEnd,
                      isBetween && styles.gridDayBetween
                    ]}
                  >
                    <Text style={[
                      styles.dayTextNumber,
                      (isStart || isEnd) && styles.dayTextNumberSelected,
                      isBetween && styles.dayTextNumberBetween
                    ]}>
                      {day.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Date Info Summary */}
            <View style={styles.rangeInfoContainer}>
              <Text style={styles.rangeInfoLabel}>Rentang Terpilih:</Text>
              <Text style={styles.rangeInfoValue}>
                {startDate ? startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'} 
                {'  s/d  '}
                {endDate ? endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Pilih tanggal selesai'}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.calendarActionsRow}>
              <TouchableOpacity 
                style={[styles.calendarActionBtn, styles.calendarBtnCancel]}
                onPress={() => {
                  setIsCalendarOpen(false);
                }}
              >
                <Text style={styles.calendarBtnTextCancel}>Batal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.calendarActionBtn, styles.calendarBtnApply]}
                disabled={!startDate || !endDate}
                onPress={() => {
                  setSelectedPeriod('Pilih Tanggal');
                  setIsCalendarOpen(false);
                  applyFilters(allOrders, 'Pilih Tanggal', searchQuery, selectedLaundryStatus, selectedServiceType, startDate, endDate);
                }}
              >
                <Text style={styles.calendarBtnTextApply}>Terapkan</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fa', paddingHorizontal: 22 },
  bubbleBg1: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(33, 150, 211, 0.04)', top: -30, left: -40 },
  bubbleBg2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(126, 200, 57, 0.04)', top: 300, right: -60 },
  listContent: { paddingBottom: 110 },
  centerContainer: { flex: 1, backgroundColor: '#f4f6fa', justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 54, marginBottom: 20 },
  headerRightActions: { flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  premiumFilterDropdownButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.8)', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 12, gap: 6 },
  premiumFilterButtonText: { fontFamily: 'Poppins_600Medium', fontSize: 12, color: '#1e293b' },
  titleText: { fontFamily: 'Poppins_700Bold', fontSize: 26, color: '#1e293b' },
  subtitleText: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#64748b', marginBottom: 16, marginTop: 2 },
  
  // Search Bar Style
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 14, height: 42, paddingHorizontal: 12, marginBottom: 12 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, color: '#1e293b', fontFamily: 'Poppins_500Medium', fontSize: 12, height: '100%' },
  
  // Filters Layout
  filtersWrapper: { gap: 12, marginBottom: 18 },
  filterSectionContainer: { width: '100%' },
  filterLabelText: { fontFamily: 'Poppins_700Bold', fontSize: 9.5, color: '#64748b', letterSpacing: 0.6, marginBottom: 6 },
  filterChipsRow: { gap: 8, paddingRight: 10 },
  filterChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  filterChipActive: { backgroundColor: '#2196D3', borderColor: '#2196D3' },
  filterChipInactive: { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
  filterChipText: { fontFamily: 'Poppins_600Medium', fontSize: 11 },
  filterChipTextActive: { color: '#ffffff' },
  filterChipTextInactive: { color: '#64748b' },

  // CUSTOM CALENDAR DESIGN SYSTEM
  calendarModalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.3)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 22 },
  calendarModalContent: { backgroundColor: '#ffffff', borderRadius: 28, padding: 22, width: '100%', borderWidth: 1, borderColor: '#e2e8f0' },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 12, marginBottom: 14 },
  calendarTitle: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: '#1e293b' },
  monthNavRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  navArrow: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  monthTextName: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: '#1e293b' },
  daysHeaderGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  daysHeaderLabel: { flex: 1, textAlign: 'center', fontFamily: 'Poppins_700Bold', fontSize: 11, color: '#94a3b8' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  gridDayBox: { width: '13.5%', height: 38, justifyContent: 'center', alignItems: 'center', borderRadius: 19, marginVertical: 1 },
  gridDayStart: { backgroundColor: '#2196D3', borderRadius: 19 },
  gridDayEnd: { backgroundColor: '#2196D3', borderRadius: 19 },
  gridDayBetween: { backgroundColor: 'rgba(33, 150, 211, 0.08)', borderRadius: 0 },
  dayTextNumber: { fontFamily: 'Poppins_600Medium', fontSize: 12, color: '#475569' },
  dayTextNumberSelected: { color: '#ffffff', fontFamily: 'Poppins_700Bold' },
  dayTextNumberBetween: { color: '#2196D3', fontFamily: 'Poppins_700Bold' },
  rangeInfoContainer: { marginTop: 18, backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  rangeInfoLabel: { fontFamily: 'Poppins_700Bold', fontSize: 9, color: '#94a3b8', letterSpacing: 0.5 },
  rangeInfoValue: { fontFamily: 'Poppins_600Medium', fontSize: 11, color: '#1e293b', marginTop: 3 },
  calendarActionsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 18 },
  calendarActionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  calendarBtnCancel: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  calendarBtnApply: { backgroundColor: '#2196D3' },
  calendarBtnTextCancel: { fontFamily: 'Poppins_700Bold', fontSize: 12, color: '#64748b' },
  calendarBtnTextApply: { fontFamily: 'Poppins_700Bold', fontSize: 12, color: '#ffffff' },

  statsWrapper: { marginBottom: 20 },
  expenditureCard: { backgroundColor: '#ffffff', borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  expenditureLeft: { flex: 1 },
  expenditureLabel: { fontFamily: 'Poppins_700Bold', fontSize: 9, color: '#64748b', letterSpacing: 0.8 },
  expenditureValue: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: '#1e293b', marginTop: 4 },
  expenditureIconContainer: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  insightRow: { flexDirection: 'row', gap: 12, marginTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.03)', paddingTop: 8 },
  insightItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  insightText: { fontFamily: 'Poppins_600Medium', fontSize: 9, color: '#64748b' },
  countsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  countCardNew: { flex: 1, backgroundColor: '#ffffff', borderRadius: 20, padding: 14, borderWidth: 1 },
  countCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  countIconBox: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  countNumberNew: { fontFamily: 'Poppins_700Bold', fontSize: 16 },
  countLabelNew: { fontFamily: 'Poppins_600Medium', fontSize: 10, color: '#64748b' },
  orderGlassCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  serviceMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  serviceIconBox: { width: 34, height: 34, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#1e293b', lineHeight: 18 },
  cardSubtitle: { fontFamily: 'Poppins_500Medium', fontSize: 10, color: '#64748b', marginTop: 1 },
  arrowButton: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  cardFooterArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.03)' },
  invoiceTextCode: { fontFamily: 'Poppins_500Medium', fontSize: 11, color: '#64748b' },
  rightWeightBadge: { backgroundColor: 'rgba(241, 245, 249, 0.5)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  weightText: { fontFamily: 'Poppins_700Bold', fontSize: 11, color: '#1e293b' },
  modalOverlayBackground: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.15)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 38 },
  dropdownFloatingMenu: { width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', padding: 8 },
  dropdownItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 2 },
  dropdownItemRowActive: { backgroundColor: 'rgba(33, 150, 211, 0.08)' },
  dropdownItemText: { fontSize: 13 },
  dropdownItemTextActive: { fontFamily: 'Poppins_700Bold', color: '#2196D3' },
  dropdownItemTextInactive: { fontFamily: 'Poppins_500Medium', color: '#475569' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#94a3b8' }
});