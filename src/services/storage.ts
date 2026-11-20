import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { DEFAULT_PLAFON } from '../database/db';

const KEY_GEMINI_API = 'GEMINI_API_KEY';
const KEY_PLAFON = 'PLAFON_KAS_KECIL';

export async function getStoredApiKey(): Promise<string> {
  try {
    const key = await AsyncStorage.getItem(KEY_GEMINI_API);
    return key || '';
  } catch (err) {
    console.error('Failed to get Gemini API key:', err);
    return '';
  }
}

export async function setStoredApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(KEY_GEMINI_API, key.trim());
}

export async function getStoredPlafon(): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(KEY_PLAFON);
    if (val) {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch (err) {
    console.error('Failed to get stored plafon:', err);
  }
  return DEFAULT_PLAFON;
}

export async function setStoredPlafon(amount: number): Promise<void> {
  await AsyncStorage.setItem(KEY_PLAFON, amount.toString());
}

export async function saveReceiptImage(sourceUri: string): Promise<string> {
  try {
    if (!FileSystem.documentDirectory) {
      return sourceUri;
    }

    const receiptsDir = `${FileSystem.documentDirectory}receipts/`;
    const dirInfo = await FileSystem.getInfoAsync(receiptsDir);
    
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(receiptsDir, { intermediates: true });
    }

    const filename = `struk_${Date.now()}.jpg`;
    const destinationUri = `${receiptsDir}${filename}`;

    await FileSystem.copyAsync({
      from: sourceUri,
      to: destinationUri,
    });

    return destinationUri;
  } catch (error) {
    console.warn('Gagal menyimpan foto ke documentDirectory, menggunakan source URI:', error);
    return sourceUri;
  }
}

export async function deleteReceiptImage(fileUri: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    }
  } catch (err) {
    console.warn('Gagal menghapus file gambar:', err);
  }
}
