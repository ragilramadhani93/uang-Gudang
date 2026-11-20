import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { THEME } from '../styles/theme';
import {
  getStoredApiKey,
  setStoredApiKey,
  getStoredPlafon,
  setStoredPlafon,
} from '../services/storage';
import { testGeminiKey } from '../services/gemini';
import { resetDatabase, getAllTransactions, DEFAULT_PLAFON } from '../database/db';
import { formatRupiah } from '../services/pdfGenerator';

interface PengaturanScreenProps {
  onDataReset?: () => void;
}

export const PengaturanScreen: React.FC<PengaturanScreenProps> = ({ onDataReset }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [plafonStr, setPlafonStr] = useState(DEFAULT_PLAFON.toString());
  const [exportingCsv, setExportingCsv] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const key = await getStoredApiKey();
    const plafon = await getStoredPlafon();
    setApiKey(key);
    setPlafonStr(plafon.toString());
  };

  const handleSaveApiKey = async () => {
    await setStoredApiKey(apiKey);
    Alert.alert('Sukses', 'Gemini API Key berhasil disimpan di penyimpanan aman perangkat.');
  };

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Peringatan', 'Masukkan Gemini API Key terlebih dahulu.');
      return;
    }

    try {
      setTestingKey(true);
      await testGeminiKey(apiKey);
      Alert.alert('Koneksi Berhasil! ✅', 'Gemini AI Vision siap digunakan untuk memindai struk Tol & Bensin.');
    } catch (err: any) {
      Alert.alert('Koneksi Gagal ❌', err.message || 'Periksa kembali API Key dan koneksi internet Anda.');
    } finally {
      setTestingKey(false);
    }
  };

  const handleSavePlafon = async () => {
    const parsed = parseInt(plafonStr.replace(/[^0-9]/g, ''), 10);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Peringatan', 'Masukkan jumlah nominal plafon kas yang valid.');
      return;
    }
    await setStoredPlafon(parsed);
    Alert.alert('Sukses', `Plafon kas kecil berhasil diperbarui menjadi ${formatRupiah(parsed)}.`);
  };

  const handleExportCsv = async () => {
    try {
      setExportingCsv(true);
      const rows = await getAllTransactions();
      if (rows.length === 0) {
        Alert.alert('Informasi', 'Tidak ada data transaksi untuk diekspor.');
        return;
      }

      // Format CSV
      const headers = [
        'ID',
        'Tanggal',
        'No Bukti',
        'Kategori',
        'Keterangan',
        'Plat Nomor',
        'Rute',
        'Masuk (Rp)',
        'Keluar (Rp)',
        'Foto Struk',
        'Created At',
      ];

      const csvLines = [headers.join(',')];

      for (const r of rows) {
        const cleanKeterangan = `"${(r.keterangan || '').replace(/"/g, '""')}"`;
        const cleanRute = `"${(r.rute || '').replace(/"/g, '""')}"`;
        const cleanPlat = `"${(r.plat_nomor || '').replace(/"/g, '""')}"`;
        csvLines.push(
          [
            r.id,
            r.tanggal,
            r.no_bukti,
            r.kategori,
            cleanKeterangan,
            cleanPlat,
            cleanRute,
            r.masuk,
            r.keluar,
            r.foto_uri ? 'Ada' : 'Tidak',
            r.created_at,
          ].join(',')
        );
      }

      const csvContent = csvLines.join('\n');
      const filename = `Backup_Kas_Gudang_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Backup CSV Kas Gudang',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Tersimpan', `File berhasil disimpan di: ${fileUri}`);
      }
    } catch (err: any) {
      Alert.alert('Gagal Export CSV', err.message || 'Terjadi kesalahan.');
    } finally {
      setExportingCsv(false);
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'Konfirmasi Reset Data',
      'Apakah Anda yakin ingin mereset seluruh database ke data awal seed (Plafon Rp 2.000.000 dan Penyesuaian Rp 228.500)? Seluruh transaksi baru akan dihapus.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Reset Database',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetDatabase();
              await loadSettings();
              if (onDataReset) onDataReset();
              Alert.alert('Sukses', 'Database berhasil di-reset ke data pembuka wajib.');
            } catch (err: any) {
              Alert.alert('Gagal Reset', err.message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header section */}
      <View style={styles.headerBlock}>
        <Text style={styles.headerTitle}>PENGATURAN & KONEKSI SISTEM</Text>
        <Text style={styles.headerSub}>
          Konfigurasi Gemini Vision API, Plafon Kas, dan Manajemen Data Lokal
        </Text>
      </View>

      {/* Card 1: Gemini Vision API */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="google" size={16} color="#D97706" />
          <Text style={styles.cardTitle}>GEMINI VISION API KEY</Text>
        </View>

        <Text style={styles.cardHelp}>
          Digunakan untuk OCR membaca struk tol & SPBU secara otomatis langsung dari kamera HP tanpa server pihak ketiga.
        </Text>

        <View style={styles.keyInputRow}>
          <TextInput
            style={styles.keyInput}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="Tempel Gemini API Key (AIzaSy...)"
            placeholderTextColor={THEME.colors.textMuted}
            secureTextEntry={!showKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.toggleVisibilityBtn}
            onPress={() => setShowKey(!showKey)}
          >
            <MaterialCommunityIcons
              name={showKey ? 'eye-off' : 'eye'}
              size={18}
              color={THEME.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveApiKey}>
            <Text style={styles.primaryBtnText}>SIMPAN API KEY</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleTestApiKey}
            disabled={testingKey}
          >
            {testingKey ? (
              <ActivityIndicator size="small" color="#18181B" />
            ) : (
              <Text style={styles.secondaryBtnText}>TES KONEKSI AI</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoTipBox}>
          <Text style={styles.infoTipText}>
            💡 API Key gratis dapat dibuat di: <Text style={{ fontWeight: '700' }}>aistudio.google.com</Text>
          </Text>
        </View>
      </View>

      {/* Card 2: Plafon Kas Kecil */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="safe" size={16} color="#15803D" />
          <Text style={styles.cardTitle}>PLAFON DANA KAS KECIL (IMPREST)</Text>
        </View>

        <Text style={styles.cardHelp}>
          Jumlah modal tetap kas kecil operasional gudang. Saat reimburse dilakukan, saldo kas akan kembali diisi hingga mencapai angka ini.
        </Text>

        <View style={styles.inputWithLabel}>
          <Text style={styles.inputPrefix}>Rp</Text>
          <TextInput
            style={styles.plafonInput}
            value={plafonStr}
            onChangeText={setPlafonStr}
            keyboardType="numeric"
            placeholder="2000000"
            placeholderTextColor={THEME.colors.textMuted}
          />
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSavePlafon}>
          <Text style={styles.primaryBtnText}>PERBARUI NILAI PLAFON</Text>
        </TouchableOpacity>
      </View>

      {/* Card 3: Backup & Maintenance */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="database-sync" size={16} color="#475569" />
          <Text style={styles.cardTitle}>CADANGAN DATA & RESET</Text>
        </View>

        <Text style={styles.cardHelp}>
          Database tersimpan di penyimpanan lokal HP (SQLite). Anda dapat mengekspor seluruh transaksi ke CSV atau mereset data.
        </Text>

        <TouchableOpacity
          style={[styles.secondaryBtn, { marginBottom: 8 }]}
          onPress={handleExportCsv}
          disabled={exportingCsv}
        >
          {exportingCsv ? (
            <ActivityIndicator size="small" color="#18181B" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialCommunityIcons name="file-delimited-outline" size={16} color="#18181B" />
              <Text style={styles.secondaryBtnText}>EXPORT BACKUP CSV (WHATSAPP/FILES)</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerBtn} onPress={handleResetData}>
          <MaterialCommunityIcons name="restore" size={16} color="#DC2626" />
          <Text style={styles.dangerBtnText}>RESET DATABASE KE DATA AWAL SEED</Text>
        </TouchableOpacity>
      </View>

      {/* System Badge */}
      <View style={styles.systemFooter}>
        <Text style={styles.footerVersion}>Tracker Uang Operasional Gudang &bull; v1.0.0 APK</Text>
        <Text style={styles.footerSpec}>
          Zero Backend &bull; Local SQLite &bull; Direct Gemini 2.5 Flash Vision &bull; Expo Print A4
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bgApp,
  },
  content: {
    padding: THEME.spacing.lg,
    paddingBottom: 32,
  },
  headerBlock: {
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: 0.6,
  },
  headerSub: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.xs,
    padding: THEME.spacing.md,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: 0.5,
  },
  cardHelp: {
    fontSize: 9.5,
    color: THEME.colors.textSecondary,
    lineHeight: 14,
    marginBottom: 10,
  },
  keyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.xs,
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  keyInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 11.5,
    color: THEME.colors.textPrimary,
    ...THEME.typography.tabular,
  },
  toggleVisibilityBtn: {
    padding: 8,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: THEME.radii.xs,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: THEME.radii.xs,
  },
  secondaryBtnText: {
    color: '#18181B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  infoTipBox: {
    marginTop: 8,
    padding: 6,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    borderRadius: THEME.radii.xs,
  },
  infoTipText: {
    fontSize: 9,
    color: '#92400E',
  },
  inputWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.xs,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  inputPrefix: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginRight: 6,
  },
  plafonInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    ...THEME.typography.tabular,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 10,
    borderRadius: THEME.radii.xs,
  },
  dangerBtnText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  systemFooter: {
    alignItems: 'center',
    marginTop: 10,
  },
  footerVersion: {
    fontSize: 9,
    fontWeight: '700',
    color: '#71717A',
  },
  footerSpec: {
    fontSize: 8,
    color: '#A1A1AA',
    marginTop: 2,
  },
});
