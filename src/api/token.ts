import * as SecureStore from 'expo-secure-store';

let memoryToken: string | null = null;

export async function setToken(token: string) {
  memoryToken = token;
  try {
    await SecureStore.setItemAsync('auth_token', token);
  } catch (e) {
    console.warn('SecureStore not available, falling back to memory store.');
  }
}

export async function getToken() {
  if (memoryToken) return memoryToken;
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      memoryToken = token;
      return token;
    }
  } catch (e) {
    // fallback to memory
  }
  return memoryToken;
}

export async function removeToken() {
  memoryToken = null;
  try {
    await SecureStore.deleteItemAsync('auth_token');
  } catch (e) {
    console.warn('SecureStore not available for delete.');
  }
}
