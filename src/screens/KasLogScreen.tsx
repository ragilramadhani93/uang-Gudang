import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Platform,
  RefreshControl,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { THEME } from '../styles/theme';
import { Transaction, KasSummary, GeminiOcrResult, TransactionCategory } from '../types';
import {
  getAllTransactions,
  getKasSummary,
  addTransaction,
  deleteTransaction,
  DEFAULT_PLAFON,
} from '../database/db';
import { scanReceiptWithGemini } from '../services/gemini';
import {
  getStoredApiKey,
  getStoredPlafon,
  saveReceiptImage,
  deleteReceiptImage,
} from '../services/storage';

import { HeaderKas } from '../components/HeaderKas';
import { QuickActionButtons } from '../components/QuickActionButtons';
import { TransactionItem } from '../components/TransactionItem';
import { ScanConfirmModal } from '../components/ScanConfirmModal';
import { ManualTransactionModal } from '../components/ManualTransactionModal';
import { ReceiptViewModal } from '../components/ReceiptViewModal';

export const KasLogScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<KasSummary>({
    plafon: DEFAULT_PLAFON,
    totalMasuk: 0,
    totalKeluar: 0,
    cashOnHand: 0,
    kebutuhanReimburse: 0,
  });

  // Modal states
  const [scanning, setScanning] = useState(false);
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<GeminiOcrResult | null>(null);
  const [savingTransaction, setSavingTransaction] = useState(false);

  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualMode, setManualMode] = useState<'expense' | 'topup'>('expense');

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const plafon = await getStoredPlafon();
      const rows = await getAllTransactions();
      const sum = await getKasSummary(plafon);
      setTransactions(rows);
      setSummary(sum);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Hitung running balance secara kronologis
  // items urut DESC (terbaru diatas), jadi kita hitung dari yang terlama (ASC) lalu map ke id
  const runningBalanceMap = useMemo(() => {
    const map = new Map<number, number>();
    const chronological = [...transactions].sort((a, b) => {
      if (a.tanggal !== b.tanggal) return a.tanggal.localeCompare(b.tanggal);
      return a.id - b.id;
    });

    let currentBalance = 0;
    for (const tx of chronological) {
      currentBalance += tx.masuk - tx.keluar;
      map.set(tx.id, currentBalance);
    }
    return map;
  }, [transactions]);

  // Alur Scan Struk
  const handleScanReceipt = async () => {
    const apiKey = await getStoredApiKey();
    if (!apiKey) {
      Alert.alert(
        'Gemini API Key Diperlukan',
        'Untuk memindai struk dengan Gemini AI, masukkan API Key di tab Pengaturan terlebih dahulu.',
        [{ text: 'OK' }]
      );
      return;
    }

    const startPicker = async (source: 'camera' | 'gallery') => {
      try {
        let result: ImagePicker.ImagePickerResult;

        if (source === 'camera') {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Izin Kamera Ditolak', 'Izinkan akses kamera di pengaturan perangkat untuk memfoto struk.');
            return;
          }
          result = await ImagePicker.launchCameraAsync({
            base64: true,
            quality: 0.85,
            allowsEditing: false,
          });
        } else {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Izin Galeri Ditolak', 'Izinkan akses galeri di pengaturan perangkat.');
            return;
          }
          result = await ImagePicker.launchImageLibraryAsync({
            base64: true,
            quality: 0.85,
            allowsEditing: false,
          });
        }

        if (result.canceled || !result.assets || result.assets.length === 0) {
          return;
        }

        const asset = result.assets[0];
        if (!asset.base64) {
          Alert.alert('Gagal', 'Tidak dapat mengonversi gambar ke base64.');
          return;
        }

        setScanning(true);
        setCapturedPhotoUri(asset.uri);

        // Langsung panggil Gemini Vision API
        try {
          const ocr = await scanReceiptWithGemini(asset.base64, apiKey);
          setOcrResult(ocr);
          setScanModalVisible(true);
        } catch (apiError: any) {
          Alert.alert(
            'Gagal Membaca Struk',
            apiError.message || 'Terjadi kesalahan saat menghubungi Gemini API. Anda tetap dapat menginput manual data struk ini.',
            [
              {
                text: 'Input Manual Foto Ini',
                onPress: () => {
                  setOcrResult({
                    tanggal: new Date().toISOString().split('T')[0],
                    kategori: 'Tol',
                    keterangan: '',
                    nominal: 0,
                  });
                  setScanModalVisible(true);
                },
              },
              { text: 'Batal', style: 'cancel' },
            ]
          );
        } finally {
          setScanning(false);
        }
      } catch (err: any) {
        setScanning(false);
        Alert.alert('Kesalahan', err.message || 'Gagal membuka kamera/galeri.');
      }
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Batal', 'Buka Kamera HP', 'Pilih dari Galeri Foto'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) startPicker('camera');
          else if (buttonIndex === 2) startPicker('gallery');
        }
      );
    } else {
      Alert.alert(
        'Pilih Sumber Foto Struk',
        'Ambil foto langsung dengan kamera atau pilih file dari galeri:',
        [
          { text: 'Kamera HP', onPress: () => startPicker('camera') },
          { text: 'Galeri Foto', onPress: () => startPicker('gallery') },
          { text: 'Batal', style: 'cancel' },
        ]
      );
    }
  };

  // Simpan hasil scan
  const handleSaveScanResult = async (data: {
    tanggal: string;
    kategori: TransactionCategory;
    keterangan: string;
    nominal: number;
    platNomor?: string;
    rute?: string;
    photoUri?: string | null;
  }) => {
    try {
      setSavingTransaction(true);

      // Simpan file foto permanen ke documentDirectory aplikasi
      let permanentPhotoUri: string | null = null;
      if (data.photoUri) {
        permanentPhotoUri = await saveReceiptImage(data.photoUri);
      }

      await addTransaction({
        tanggal: data.tanggal,
        kategori: data.kategori,
        keterangan: data.keterangan,
        plat_nomor: data.platNomor,
        rute: data.rute,
        masuk: 0,
        keluar: data.nominal,
        foto_uri: permanentPhotoUri,
      });

      setScanModalVisible(false);
      setCapturedPhotoUri(null);
      setOcrResult(null);
      await loadData();
    } catch (err: any) {
      Alert.alert('Gagal Menyimpan', err.message || 'Terjadi kesalahan saat menyimpan transaksi.');
    } finally {
      setSavingTransaction(false);
    }
  };

  // Simpan input manual / topup
  const handleSaveManual = async (data: {
    tanggal: string;
    kategori: TransactionCategory;
    keterangan: string;
    nominal: number;
    platNomor?: string;
    rute?: string;
    masuk: number;
    keluar: number;
  }) => {
    try {
      setSavingTransaction(true);

      await addTransaction({
        tanggal: data.tanggal,
        kategori: data.kategori,
        keterangan: data.keterangan,
        plat_nomor: data.platNomor,
        rute: data.rute,
        masuk: data.masuk,
        keluar: data.keluar,
        foto_uri: null,
      });

      setManualModalVisible(false);
      await loadData();
    } catch (err: any) {
      Alert.alert('Gagal Menyimpan', err.message || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setSavingTransaction(false);
    }
  };

  // Hapus transaksi
  const handleDeleteTransaction = async (id: number, fotoUri?: string | null) => {
    try {
      if (fotoUri) {
        await deleteReceiptImage(fotoUri);
      }
      await deleteTransaction(id);
      await loadData();
    } catch (err: any) {
      Alert.alert('Gagal Menghapus', err.message || 'Terjadi kesalahan saat menghapus.');
    }
  };

  const openTransactionDetail = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setViewModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <HeaderKas summary={summary} />

      {/* Action Buttons */}
      <QuickActionButtons
        onScanReceipt={handleScanReceipt}
        onManualInput={() => {
          setManualMode('expense');
          setManualModalVisible(true);
        }}
        onTopUp={() => {
          setManualMode('topup');
          setManualModalVisible(true);
        }}
        loadingScan={scanning}
      />

      {/* Section Header */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>BUKU KAS & LOG OPERASIONAL HARIAN</Text>
        <Text style={styles.countBadge}>{transactions.length} REKOR</Text>
      </View>

      {/* List Transaksi */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={THEME.colors.textPrimary} />
          <Text style={styles.loadingText}>Memuat buku kas...</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TransactionItem
              transaction={item}
              runningBalance={runningBalanceMap.get(item.id) || 0}
              onPress={openTransactionDetail}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Belum ada transaksi operasional tercatat.</Text>
            </View>
          }
        />
      )}

      {/* Scan & Confirm Modal */}
      <ScanConfirmModal
        visible={scanModalVisible}
        photoUri={capturedPhotoUri}
        ocrResult={ocrResult}
        onSave={handleSaveScanResult}
        onCancel={() => {
          setScanModalVisible(false);
          setCapturedPhotoUri(null);
          setOcrResult(null);
        }}
        saving={savingTransaction}
      />

      {/* Manual & Top-Up Modal */}
      <ManualTransactionModal
        visible={manualModalVisible}
        mode={manualMode}
        onSave={handleSaveManual}
        onCancel={() => setManualModalVisible(false)}
        saving={savingTransaction}
      />

      {/* Detail / Receipt Photo Modal */}
      <ReceiptViewModal
        visible={viewModalVisible}
        transaction={selectedTransaction}
        onClose={() => setViewModalVisible(false)}
        onDelete={handleDeleteTransaction}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bgApp,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    backgroundColor: '#EBEBE6',
  },
  sectionTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
    letterSpacing: 0.6,
  },
  countBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#3F3F46',
    backgroundColor: '#D4D4CE',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 2,
    ...THEME.typography.tabular,
  },
  listContent: {
    paddingBottom: 24,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  emptyBox: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
});
