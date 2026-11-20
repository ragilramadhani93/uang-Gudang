import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
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
import { TransactionCategory } from '../types';
import { getTodayFormatted } from '../services/gemini';
import { formatVoucherNumber } from '../database/db';
import { formatRupiah } from '../services/pdfGenerator';

interface ManualTransactionModalProps {
  visible: boolean;
  mode: 'expense' | 'topup';
  onSave: (data: {
    tanggal: string;
    kategori: TransactionCategory;
    keterangan: string;
    nominal: number;
    platNomor?: string;
    rute?: string;
    masuk: number;
    keluar: number;
  }) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export const ManualTransactionModal: React.FC<ManualTransactionModalProps> = ({
  visible,
  mode,
  onSave,
  onCancel,
  saving = false,
}) => {
  const isTopUp = mode === 'topup';
  const [tanggal, setTanggal] = useState(getTodayFormatted());
  const [kategori, setKategori] = useState<TransactionCategory>(isTopUp ? 'Top-Up' : 'Tol');
  const [keterangan, setKeterangan] = useState('');
  const [nominalStr, setNominalStr] = useState('');
  const [platNomor, setPlatNomor] = useState('');
  const [rute, setRute] = useState('');

  useEffect(() => {
    if (visible) {
      setTanggal(getTodayFormatted());
      if (isTopUp) {
        setKategori('Top-Up');
        setKeterangan('Reimburse / Penggantian Kas Kecil Operasional');
      } else {
        setKategori('Tol');
        setKeterangan('');
      }
      setNominalStr('');
      setPlatNomor('');
      setRute('');
    }
  }, [visible, isTopUp]);

  const nominalNum = parseInt(nominalStr.replace(/[^0-9]/g, ''), 10) || 0;
  const voucherPreview = isTopUp ? '-' : formatVoucherNumber(tanggal);

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
      masuk: isTopUp ? nominalNum : 0,
      keluar: isTopUp ? 0 : nominalNum,
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
          <View style={[styles.sheetHeader, isTopUp && styles.sheetHeaderTopUp]}>
            <View>
              <Text style={styles.sheetTitle}>
                {isTopUp ? 'CATAT TOP-UP / REIMBURSE MASUK' : 'INPUT MANUAL PENGELUARAN'}
              </Text>
              <Text style={styles.sheetSubtitle}>
                {isTopUp
                  ? 'Menambah saldo Cash on Hand kas kecil gudang'
                  : 'Catat pengeluaran Tol / Bensin tanpa foto struk'}
              </Text>
            </View>
            <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color={THEME.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
            {/* Voucher preview banner */}
            {!isTopUp && (
              <View style={styles.voucherBanner}>
                <Text style={styles.voucherLabel}>NO. BUKTI PENGELUARAN OTOMATIS:</Text>
                <Text style={styles.voucherCode}>{voucherPreview}</Text>
              </View>
            )}

            {/* Category Toggle (Expense only) */}
            {!isTopUp && (
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
            )}

            {/* Tanggal & Nominal */}
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
              <Text
                style={[
                  styles.nominalPreviewText,
                  isTopUp && { color: THEME.colors.income },
                ]}
              >
                {isTopUp ? 'Uang Masuk: ' : 'Uang Keluar: '}
                {formatRupiah(nominalNum)}
              </Text>
            </View>

            {/* Keterangan */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>
                {isTopUp ? 'KETERANGAN REIMBURSE' : 'KETERANGAN TRANSAKSI'}
              </Text>
              <TextInput
                style={styles.textInput}
                value={keterangan}
                onChangeText={setKeterangan}
                placeholder={
                  isTopUp
                    ? 'Contoh: Reimburse BPG tgl 20 Nov dari Ibu Siti Finance'
                    : 'Contoh: Tol Cikupa - Merak armada Box B'
                }
                placeholderTextColor={THEME.colors.textMuted}
              />
            </View>

            {/* Optional Fields (Plat & Rute) */}
            {!isTopUp && (
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
                      placeholder="Cikarang - Tj Priok"
                      placeholderTextColor={THEME.colors.textMuted}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Actions */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isTopUp && { backgroundColor: THEME.colors.income },
                ]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="check-bold"
                      size={16}
                      color="#FFFFFF"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.saveButtonText}>
                      {isTopUp ? 'SIMPAN DANA MASUK' : 'SIMPAN PENGELUARAN'}
                    </Text>
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
    maxHeight: '90%',
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
  sheetHeaderTopUp: {
    backgroundColor: '#F0FDF4',
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
  voucherBanner: {
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    padding: 8,
    borderRadius: THEME.radii.xs,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voucherLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#71717A',
  },
  voucherCode: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    ...THEME.typography.tabular,
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
