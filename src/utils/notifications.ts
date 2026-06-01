import * as SecureStore from 'expo-secure-store';

export interface LaundryNotification {
  id: string;
  invoice_code: string;
  service_name: string;
  old_status: string;
  new_status: string;
  created_at: string;
  is_read: boolean;
}

const NOTIF_KEY = 'laundry_notifications_list';
const PREV_ORDERS_KEY = 'previous_orders_status_state';

// Ambil daftar notifikasi
export async function getNotifications(): Promise<LaundryNotification[]> {
  try {
    const data = await SecureStore.getItemAsync(NOTIF_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Gagal mengambil notifikasi:', error);
    return [];
  }
}

// Simpan daftar notifikasi
export async function saveNotifications(notifications: LaundryNotification[]) {
  try {
    // Batasi maksimal 20 item agar tidak melebihi limit SecureStore (2KB)
    const capped = notifications.slice(0, 20);
    await SecureStore.setItemAsync(NOTIF_KEY, JSON.stringify(capped));
  } catch (error) {
    console.error('Gagal menyimpan notifikasi:', error);
  }
}

// Tandai semua notifikasi sebagai dibaca
export async function markAllNotificationsAsRead() {
  try {
    const notifs = await getNotifications();
    const updated = notifs.map(n => ({ ...n, is_read: true }));
    await saveNotifications(updated);
  } catch (error) {
    console.error('Gagal menandai notifikasi dibaca:', error);
  }
}

// Hapus semua notifikasi
export async function clearNotifications() {
  try {
    await SecureStore.deleteItemAsync(NOTIF_KEY);
  } catch (error) {
    console.error('Gagal menghapus notifikasi:', error);
  }
}

// Bandingkan status laundry dan picu notifikasi
export async function checkAndNotifyStatusChanges(currentOrders: any[]): Promise<LaundryNotification[]> {
  if (!currentOrders || currentOrders.length === 0) return [];

  const notificationsToAdd: LaundryNotification[] = [];
  try {
    // 1. Ambil status order sebelumnya
    const prevStateStr = await SecureStore.getItemAsync(PREV_ORDERS_KEY);
    const prevState: Record<string, string> = prevStateStr ? JSON.parse(prevStateStr) : {};

    // 2. Bandingkan status setiap order
    const newStates: Record<string, string> = {};

    currentOrders.forEach((order) => {
      const orderId = order.id.toString();
      const newStatus = order.status;
      newStates[orderId] = newStatus;

      // Jika order ini belum ada di prevState DAN prevState tidak kosong (berarti ada order baru ditambahkan)
      if (Object.keys(prevState).length > 0 && prevState[orderId] === undefined) {
        const notif: LaundryNotification = {
          id: Math.random().toString(36).substring(2, 9),
          invoice_code: order.invoice_code,
          service_name: order.service?.service_name || 'Layanan Laundry',
          old_status: 'BARU',
          new_status: newStatus,
          created_at: new Date().toISOString(),
          is_read: false,
        };
        notificationsToAdd.push(notif);
      }
      // Jika statusnya berubah
      else if (prevState[orderId] && prevState[orderId].toLowerCase() !== newStatus.toLowerCase()) {
        const oldStatus = prevState[orderId];
        
        const notif: LaundryNotification = {
          id: Math.random().toString(36).substring(2, 9),
          invoice_code: order.invoice_code,
          service_name: order.service?.service_name || 'Layanan Laundry',
          old_status: oldStatus,
          new_status: newStatus,
          created_at: new Date().toISOString(),
          is_read: false,
        };
        notificationsToAdd.push(notif);
      }
    });

    // 3. Jika ada notifikasi baru, gabungkan dan simpan
    if (notificationsToAdd.length > 0) {
      const existingNotifs = await getNotifications();
      const combined = [...notificationsToAdd, ...existingNotifs];
      await saveNotifications(combined);
    }

    // 4. Simpan state status terbaru
    await SecureStore.setItemAsync(PREV_ORDERS_KEY, JSON.stringify(newStates));
  } catch (error) {
    console.error('Gagal melakukan check status perubahan laundry:', error);
  }
  return notificationsToAdd;
}
