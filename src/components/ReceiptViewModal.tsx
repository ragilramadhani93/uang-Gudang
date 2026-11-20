import React from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../styles/theme';
import { Transaction } from '../types';
import { formatRupiah, formatDateIndo } from '../services/pdfGenerator';

interface ReceiptViewModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onDelete: (id: number, fotoUri?: string | null) => Promise<void>;
}

export const ReceiptViewModal: React.FC<ReceiptViewModalProps> = ({
  visible,
  transaction,
  onClose,
  onDelete,
}) => {
  if (!transaction) return null;

  const isIncome = transaction.masuk > 0;
  const amount = isIncome ? transaction.masuk : transaction.keluar;

  const confirmDelete = () => {
    Alert.alert(
      'Hapus Transaksi',
      `Apakah Anda yakin ingin menghapus transaksi "${transaction.keterangan}" (${formatRupiah(amount)})?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await onDelete(transaction.id, transaction.foto_uri);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>DETAIL TRANSAKSI OPERASIONAL</Text>
              <Text style={styles.headerSubtitle}>ID #{transaction.id} &bull; {transaction.no_bukti}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color={THEME.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            {/* Foto Struk jika ada */}
            {transaction.foto_uri ? (
              <View style={styles.photoContainer}>
                <Image
                  source={{ uri: transaction.foto_uri }}
                  style={styles.receiptImage}
                  resizeMode="contain"
                />
                <View style={styles.photoBadge}>
                  <MaterialCommunityIcons name="shield-check" size={14} color="#047857" />
                  <Text style={styles.photoBadgeText}>ARSIAP STRUK TERSIMPAN LOKAL</Text>
                </View>
              </View>
            ) : (
              <View style={styles.noPhotoBox}>
                <MaterialCommunityIcons name="receipt" size={32} color="#CBD5E1" />
                <Text style={styles.noPhotoText}>Tidak ada lampiran foto fisik untuk transaksi ini.</Text>
              </View>
            )}

            {/* Info Grid */}
            <View style={styles.infoTable}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>TANGGAL</Text>
                <Text style={styles.infoValue}>{formatDateIndo(transaction.tanggal)}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>NOMOR BUKTI</Text>
                <Text style={[styles.infoValue, styles.monospace]}>{transaction.no_bukti}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>KATEGORI</Text>
                <Text style={styles.infoValue}>{transaction.kategori}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>KETERANGAN</Text>
                <Text style={[styles.infoValue, { fontWeight: '700' }]}>{transaction.keterangan}</Text>
              </View>

              {transaction.plat_nomor && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>PLAT NOMOR</Text>
                  <Text style={styles.infoValue}>{transaction.plat_nomor}</Text>
                </View>
              )}

              {transaction.rute && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>RUTE ARMADA</Text>
                  <Text style={styles.infoValue}>{transaction.rute}</Text>
                </View>
              )}

              <View style={[styles.infoRow, styles.infoRowTotal]}>
                <Text style={[styles.infoLabel, { fontWeight: '800' }]}>
                  {isIncome ? 'UANG MASUK' : 'UANG KELUAR'}
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    styles.monospace,
                    isIncome ? styles.amountIncome : styles.amountExpense,
                  ]}
                >
                  {isIncome ? `+ ${formatRupiah(amount)}` : `- ${formatRupiah(amount)}`}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={confirmDelete}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={16} color="#DC2626" />
              <Text style={styles.deleteButtonText}>HAPUS</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
              <Text style={styles.closeModalButtonText}>TUTUP</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  cardContainer: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.radii.sm,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 9.5,
    color: THEME.colors.textMuted,
    marginTop: 2,
    ...THEME.typography.tabular,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: THEME.spacing.md,
  },
  photoContainer: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.xs,
    overflow: 'hidden',
    backgroundColor: '#18181B',
    marginBottom: 14,
  },
  receiptImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#18181B',
  },
  photoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#A7F3D0',
  },
  photoBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#065F46',
  },
  noPhotoBox: {
    padding: 18,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: THEME.radii.xs,
    marginBottom: 14,
  },
  noPhotoText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  infoTable: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radii.xs,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderLight,
    backgroundColor: '#FFFFFF',
  },
  infoRowTotal: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 0,
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 11,
    color: THEME.colors.textPrimary,
    maxWidth: '65%',
    textAlign: 'right',
  },
  monospace: {
    ...THEME.typography.tabular,
    fontWeight: '800',
  },
  amountIncome: {
    color: THEME.colors.income,
    fontSize: 14,
  },
  amountExpense: {
    color: THEME.colors.expense,
    fontSize: 14,
  },
  footerActions: {
    flexDirection: 'row',
    padding: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    backgroundColor: '#F8FAFC',
    gap: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    borderRadius: THEME.radii.xs,
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 10.5,
    fontWeight: '800',
  },
  closeModalButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18181B',
    paddingVertical: 8,
    borderRadius: THEME.radii.xs,
  },
  closeModalButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
