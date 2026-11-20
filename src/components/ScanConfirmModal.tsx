import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../styles/theme';
import { GeminiOcrResult, TransactionCategory } from '../types';
import { formatVoucherNumber } from '../database/db';
import { formatRupiah } from '../services/pdfGenerator';

interface ScanConfirmModalProps {
  visible: boolean;
  photoUri: string | null;
  ocrResult: GeminiOcrResult | null;
  onSave: (data: {
    tanggal: string;
    kategori: TransactionCategory;
    keterangan: string;
    nominal: number;
    platNomor?: string;
    rute?: string;
    photoUri?: string | null;
  }) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export const ScanConfirmModal: React.FC<ScanConfirmModalProps> = ({
  visible,
  photoUri,
  ocrResult,
  onSave,
  onCancel,
  saving = false,
}) => {
  const [tanggal, setTanggal] = useState('');
  const [kategori, setKategori] = useState<TransactionCategory>('Tol');
  const [keterangan, setKeterangan] = useState('');
  const [nominalStr, setNominalStr] = useState('');
  const [platNomor, setPlatNomor] = useState('');
  const [rute, setRute] = useState('');

  useEffect(() => {
    if (ocrResult) {
      setTanggal(ocrResult.tanggal);
      setKategori(ocrResult.kategori);
      setKeterangan(ocrResult.keterangan);
      setNominalStr(ocrResult.nominal ? ocrResult.nominal.toString() : '');
    }
  }, [ocrResult]);

  const voucherPreview = tanggal ? formatVoucherNumber(tanggal) : 'BPG-YYYYMMDD-01';
  const nominalNum = parseInt(nominalStr.replace(/[^0-9]/g, ''), 10) || 0;

  const handleSave = async () => {
    if (!keterangan.trim()) {
      alert('Keterangan tidak boleh kosong.');
      return;
    }
    if (nominalNum <= 0) {
      alert('Nominal harus lebih besar dari 0.');
      return;
    }

    await onSave({
      tanggal,
      kategori,
      keterangan: keterangan.trim(),
      nominal: nominalNum,
      platNomor: platNomor.trim() || undefined,
      rute: rute.trim() || undefined,
      photoUri,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>KONFIRMASI BACAAN GEMINI VISION</Text>
              <Text style={styles.sheetSubtitle}>
                Periksa & verifikasi data struk sebelum masuk saldo
              </Text>
            </View>
            <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color={THEME.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
            {/* Photo Thumbnail + Voucher badge */}
            <View style={styles.photoSection}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoThumbnail} resizeMode="cover" />
              ) : (
                <View style={[styles.photoThumbnail, styles.photoEmpty]}>
                  <MaterialCommunityIcons name="image-off" size={24} color="#A1A1AA" />
                </View>
              )}

              <View style={styles.photoMeta}>
                <Text style={styles.metaLabel}>NOMOR BUKTI OTOMATIS (BPG)</Text>
                <Text style={styles.voucherCode}>{voucherPreview}</Text>
                <Text style={styles.metaTip}>
                  Semua transaksi Tol/Bensin tgl {tanggal} otomatis disatukan ke No. Bukti ini.
                </Text>
              </View>
            </View>

            {/* Category Toggle */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>KATEGORI PENGELUARAN</Text>
              <View style={styles.categoryToggleRow}>
                {(['Tol', 'Bensin', 'Lainnya'] as TransactionCategory[]).map((cat) => {
                  const isActive = kategori === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catOption,
                        isActive && styles.catOptionActive,
                      ]}
                      onPress={() => setKategori(cat)}
                    >
                      <Text
                        style={[
                          styles.catOptionText,
                          isActive && styles.catOptionTextActive,
                        ]}
                      >
                        {cat.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Tanggal & Nominal in row */}
            <View style={styles.rowTwoCols}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>TANGGAL (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.textInput}
                  value={tanggal}
                  onChangeText={setTanggal}
                  placeholder="2026-11-20"
                  placeholderTextColor={THEME.colors.textMuted}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1.2 }]}>
                <Text style={styles.inputLabel}>NOMINAL (RP)</Text>
                <TextInput
                  style={[styles.textInput, styles.nominalInput]}
                  value={nominalStr}
                  onChangeText={setNominalStr}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={THEME.colors.textMuted}
                />
              </View>
            </View>

            {/* Nominal preview text */}
            <View style={styles.nominalPreviewBox}>
              <Text style={styles.nominalPreviewText}>
                Total Terbaca: {formatRupiah(nominalNum)}
              </Text>
            </View>

            {/* Keterangan */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>KETERANGAN STRUK (GERBANG TOL / SPBU / DLL)</Text>
              <TextInput
                style={styles.textInput}
                value={keterangan}
                onChangeText={setKeterangan}
                placeholder="Contoh: Tol Cikarang Utama - Cikampek"
                placeholderTextColor={THEME.colors.textMuted}
              />
            </View>

            {/* Optional Fields: Plat Nomor & Rute */}
            <View style={styles.optionalSection}>
              <Text style={styles.optionalHeader}>KOLOM TAMBAHAN OPERASIONAL (OPSIONAL)</Text>
              
              <View style={styles.rowTwoCols}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>PLAT NOMOR ARMADA</Text>
                  <TextInput
                    style={styles.textInput}
                    value={platNomor}
                    onChangeText={setPlatNomor}
                    placeholder="B 1234 CD"
                    placeholderTextColor={THEME.colors.textMuted}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>RUTE / TUJUAN</Text>
                  <TextInput
                    style={styles.textInput}
                    value={rute}
                    onChangeText={setRute}
                    placeholder="Gudang - Tj Priok"
                    placeholderTextColor={THEME.colors.textMuted}
                  />
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check-bold" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.saveButtonText}>SIMPAN TRANSAKSI KE DATABASE</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>BATAL</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    backgroundColor: '#F8FAFC',
  },
  sheetTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: 0.5,
  },
  sheetSubtitle: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollArea: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: 12,
  },
  photoSection: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F4F4F5',
    padding: 8,
    borderRadius: THEME.radii.xs,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    marginBottom: 12,
  },
  photoThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
  },
  photoEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  metaLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#71717A',
    letterSpacing: 0.5,
  },
  voucherCode: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginVertical: 2,
    ...THEME.typography.tabular,
  },
  metaTip: {
    fontSize: 9,
    color: '#52525B',
    lineHeight: 12,
  },
  formGroup: {
    marginBottom: 12,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 8,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.xs,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12.5,
    color: THEME.colors.textPrimary,
    backgroundColor: '#FFFFFF',
  },
  nominalInput: {
    fontWeight: '700',
    fontSize: 13.5,
    ...THEME.typography.tabular,
  },
  nominalPreviewBox: {
    marginTop: -8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  nominalPreviewText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.accentDark,
    ...THEME.typography.tabular,
  },
  categoryToggleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  catOption: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.radii.xs,
  },
  catOptionActive: {
    backgroundColor: '#18181B',
    borderColor: '#18181B',
  },
  catOptionText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
  },
  catOptionTextActive: {
    color: '#FFFFFF',
  },
  optionalSection: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    borderRadius: THEME.radii.xs,
    marginBottom: 16,
  },
  optionalHeader: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  buttonContainer: {
    gap: 8,
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: '#18181B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: THEME.radii.xs,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11.5,
    letterSpacing: 0.5,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.xs,
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    color: THEME.colors.textSecondary,
    fontWeight: '700',
    fontSize: 11,
  },
});
