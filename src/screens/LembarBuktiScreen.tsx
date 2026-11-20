import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../styles/theme';
import { Transaction, KasSummary } from '../types';
import {
  getAllVouchers,
  getTransactionsByVoucher,
  getKasSummary,
  DEFAULT_PLAFON,
} from '../database/db';
import { getStoredPlafon } from '../services/storage';
import {
  formatRupiah,
  formatDateIndo,
  exportAndSharePdf,
  angkaKeTerbilang,
} from '../services/pdfGenerator';

export const LembarBuktiScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [vouchers, setVouchers] = useState<
    { no_bukti: string; tanggal: string; count: number; totalKeluar: number }[]
  >([]);
  const [selectedVoucher, setSelectedVoucher] = useState<string>('');
  const [items, setItems] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<KasSummary>({
    plafon: DEFAULT_PLAFON,
    totalMasuk: 0,
    totalKeluar: 0,
    cashOnHand: 0,
    kebutuhanReimburse: 0,
  });

  const loadVouchers = useCallback(async () => {
    try {
      const plafon = await getStoredPlafon();
      const sum = await getKasSummary(plafon);
      setSummary(sum);

      const vList = await getAllVouchers();
      setVouchers(vList);

      if (vList.length > 0) {
        const defaultVoucher = selectedVoucher || vList[0].no_bukti;
        setSelectedVoucher(defaultVoucher);
        const txs = await getTransactionsByVoucher(defaultVoucher);
        setItems(txs);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Error loading vouchers:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedVoucher]);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);

  const handleSelectVoucher = async (noBukti: string) => {
    setSelectedVoucher(noBukti);
    const txs = await getTransactionsByVoucher(noBukti);
    setItems(txs);
  };

  const handleExportPdf = async () => {
    if (!selectedVoucher || items.length === 0) {
      Alert.alert('Peringatan', 'Pilih nomor bukti yang memiliki item transaksi.');
      return;
    }

    try {
      setExporting(true);
      const currentVoucherData = vouchers.find((v) => v.no_bukti === selectedVoucher);
      const docDate = currentVoucherData?.tanggal || items[0]?.tanggal || '2026-11-20';

      await exportAndSharePdf({
        noBukti: selectedVoucher,
        tanggal: docDate,
        items,
        cashOnHand: summary.cashOnHand,
        plafon: summary.plafon,
      });
    } catch (err: any) {
      Alert.alert('Gagal Generate PDF', err.message || 'Terjadi kesalahan saat membuat PDF.');
    } finally {
      setExporting(false);
    }
  };

  // Hitung subtotal & kumpulkan plat nomor
  let subtotalTol = 0;
  let subtotalBensin = 0;
  let subtotalLainnya = 0;
  const platNomorList: string[] = [];

  items.forEach((item) => {
    if (item.kategori === 'Tol') subtotalTol += item.keluar;
    else if (item.kategori === 'Bensin') subtotalBensin += item.keluar;
    else subtotalLainnya += item.keluar;

    if (item.plat_nomor && !platNomorList.includes(item.plat_nomor)) {
      platNomorList.push(item.plat_nomor);
    }
  });

  const totalPengeluaran = subtotalTol + subtotalBensin + subtotalLainnya;
  const platNomorDisplay = platNomorList.length > 0 ? platNomorList.join(', ') : '-';
  const terbilangDisplay = angkaKeTerbilang(totalPengeluaran);
  const currentVoucherInfo = vouchers.find((v) => v.no_bukti === selectedVoucher);

  return (
    <View style={styles.container}>
      {/* Top Banner Selector */}
      <View style={styles.topControlBanner}>
        <Text style={styles.controlTitle}>PILIH NOMOR BUKTI KAS KELUAR (BPG):</Text>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.voucherScroll}
          contentContainerStyle={styles.voucherScrollContent}
        >
          {vouchers.map((v) => {
            const isSelected = v.no_bukti === selectedVoucher;
            return (
              <TouchableOpacity
                key={v.no_bukti}
                style={[
                  styles.voucherChip,
                  isSelected && styles.voucherChipActive,
                ]}
                onPress={() => handleSelectVoucher(v.no_bukti)}
              >
                <Text
                  style={[
                    styles.voucherChipCode,
                    isSelected && styles.voucherChipCodeActive,
                  ]}
                >
                  {v.no_bukti}
                </Text>
                <Text
                  style={[
                    styles.voucherChipMeta,
                    isSelected && styles.voucherChipMetaActive,
                  ]}
                >
                  {v.count} Item &bull; {formatRupiah(v.totalKeluar)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Document Preview (A4 Sheet matching real voucher) */}
      <ScrollView style={styles.docScrollArea} contentContainerStyle={styles.docScrollContent}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={THEME.colors.textPrimary} />
            <Text style={styles.loadingText}>Menyiapkan preview bukti kas keluar...</Text>
          </View>
        ) : (
          <View style={styles.paperSheet}>
            {/* Top Tag */}
            <View style={styles.topStrip}>
              <Text style={styles.topStripText}>KEPERLUAN INTERN OPERASIONAL GUDANG &bull; SISTEM IMPREST</Text>
            </View>

            {/* Header Layout */}
            <View style={styles.sheetTopBar}>
              <View style={{ flex: 1 }}>
                <Text style={styles.titleMain}>BUKTI KAS KELUAR</Text>
                <Text style={styles.companySub}>LOGISTIK & OPERASIONAL ARMADA</Text>
              </View>

              <View style={styles.metaBoxRight}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLbl}>No. Bukti</Text>
                  <Text style={[styles.metaVal, styles.mono]}>{selectedVoucher || '-'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLbl}>Tanggal</Text>
                  <Text style={styles.metaVal}>
                    {currentVoucherInfo ? formatDateIndo(currentVoucherInfo.tanggal) : '-'}
                  </Text>
                </View>
                <View style={[styles.metaRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.metaLbl}>Lampiran</Text>
                  <Text style={styles.metaVal}>{items.length} Lembar</Text>
                </View>
              </View>
            </View>

            {/* Dibayarkan Kepada & Plat Nomor Armada */}
            <View style={styles.partyGrid}>
              <View style={[styles.partyCol, { borderRightWidth: 1, borderColor: '#18181B' }]}>
                <Text style={styles.partyLbl}>DIBAYARKAN KEPADA</Text>
                <Text style={styles.partyVal}>Driver / Supir Armada</Text>
              </View>
              <View style={styles.partyCol}>
                <Text style={styles.partyLbl}>KENDARAAN / PLAT NOMOR</Text>
                <Text style={[styles.partyVal, styles.mono, { color: '#B45309' }]}>
                  {platNomorDisplay}
                </Text>
              </View>
            </View>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.thCell, { width: 26, textAlign: 'center' }]}>NO</Text>
              <Text style={[styles.thCell, { width: 70, textAlign: 'center' }]}>PERKIRAAN</Text>
              <Text style={[styles.thCell, { flex: 1 }]}>URAIAN PENGELUARAN</Text>
              <Text style={[styles.thCell, { width: 95, textAlign: 'right' }]}>JUMLAH (RP)</Text>
            </View>

            {/* Table Rows */}
            {items.map((it, idx) => (
              <View key={it.id} style={styles.tableRow}>
                <Text style={[styles.tdCell, { width: 26, textAlign: 'center', color: '#64748B' }]}>
                  {idx + 1}
                </Text>
                <View style={[styles.tdCell, { width: 70, alignItems: 'center' }]}>
                  <View style={styles.catPill}>
                    <Text style={styles.catPillText}>{it.kategori.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={[styles.tdCell, { flex: 1 }]}>
                  <Text style={styles.tdTitle}>{it.keterangan}</Text>
                  {(it.plat_nomor || it.rute) && (
                    <Text style={styles.tdSub}>
                      {[it.plat_nomor && `Plat: ${it.plat_nomor}`, it.rute && `Rute: ${it.rute}`]
                        .filter(Boolean)
                        .join(' • ')}
                    </Text>
                  )}
                </View>
                <Text style={[styles.tdCell, styles.mono, { width: 95, textAlign: 'right', fontWeight: '800' }]}>
                  {formatRupiah(it.keluar)}
                </Text>
              </View>
            ))}

            {/* Terbilang & Totals */}
            <View style={styles.bottomSummaryGrid}>
              <View style={styles.terbilangBox}>
                <Text style={styles.terbilangLbl}>TERBILANG :</Text>
                <Text style={styles.terbilangText}># {terbilangDisplay} #</Text>
              </View>

              <View style={styles.totalsBox}>
                <View style={styles.totRow}>
                  <Text style={styles.totLbl}>Subtotal Tol</Text>
                  <Text style={[styles.totVal, styles.mono]}>{formatRupiah(subtotalTol)}</Text>
                </View>
                <View style={styles.totRow}>
                  <Text style={styles.totLbl}>Subtotal Bensin</Text>
                  <Text style={[styles.totVal, styles.mono]}>{formatRupiah(subtotalBensin)}</Text>
                </View>
                {subtotalLainnya > 0 && (
                  <View style={styles.totRow}>
                    <Text style={styles.totLbl}>Subtotal Lainnya</Text>
                    <Text style={[styles.totVal, styles.mono]}>{formatRupiah(subtotalLainnya)}</Text>
                  </View>
                )}
                <View style={[styles.totRow, styles.grandTotRow]}>
                  <Text style={styles.grandTotLbl}>JUMLAH :</Text>
                  <Text style={[styles.grandTotVal, styles.mono]}>
                    {formatRupiah(totalPengeluaran)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Status Kasir Bar */}
            <View style={styles.statusBar}>
              <Text style={styles.statusText}>
                Plafon: <Text style={styles.statusBold}>{formatRupiah(summary.plafon)}</Text>
              </Text>
              <Text style={styles.statusText}>
                Cash on Hand: <Text style={styles.statusBold}>{formatRupiah(summary.cashOnHand)}</Text>
              </Text>
              <Text style={styles.statusText}>
                Reimburse: <Text style={[styles.statusBold, { color: '#B45309' }]}>{formatRupiah(totalPengeluaran)}</Text>
              </Text>
            </View>

            {/* 5 Kolom Tanda Tangan Sesuai Dokumen Fisik */}
            <View style={styles.signatureGrid}>
              <View style={styles.signatureCol}>
                <Text style={styles.sigRole}>Pembukuan</Text>
                <View style={styles.sigSpace} />
                <Text style={styles.sigName}>( Admin Kas )</Text>
                <Text style={styles.sigDate}>Tgl: .......</Text>
              </View>

              <View style={[styles.signatureCol, styles.sigBorderSide]}>
                <Text style={styles.sigRole}>Mengetahui</Text>
                <View style={styles.sigSpace} />
                <Text style={styles.sigName}>( Spv. Gudang )</Text>
                <Text style={styles.sigDate}>Tgl: .......</Text>
              </View>

              <View style={[styles.signatureCol, styles.sigBorderSide]}>
                <Text style={styles.sigRole}>Menyetujui</Text>
                <View style={styles.sigSpace} />
                <Text style={styles.sigName}>( Manajer )</Text>
                <Text style={styles.sigDate}>Tgl: .......</Text>
              </View>

              <View style={[styles.signatureCol, styles.sigBorderSide]}>
                <Text style={styles.sigRole}>Kasir</Text>
                <View style={styles.sigSpace} />
                <Text style={styles.sigName}>( Kasir )</Text>
                <Text style={styles.sigDate}>Tgl: .......</Text>
              </View>

              <View style={styles.signatureCol}>
                <Text style={styles.sigRole}>Penerima</Text>
                <View style={styles.sigSpace} />
                <Text style={styles.sigName}>( Driver )</Text>
                <Text style={styles.sigDate}>Tgl: .......</Text>
              </View>
            </View>

            {/* Sheet Footer */}
            <View style={styles.sheetFooter}>
              <Text style={styles.sheetFooterText}>
                * Wajib melampirkan seluruh struk asli (SPBU, e-Toll) pada lembar ini.
              </Text>
              <Text style={styles.sheetFooterText}>Siap Cetak A4</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Prominent Export & Share Bar */}
      <View style={styles.exportBar}>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExportPdf}
          disabled={exporting || items.length === 0}
          activeOpacity={0.8}
        >
          {exporting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="printer-pos-network-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.exportButtonText}>
                EXPORT & BAGIKAN BUKTI KAS KELUAR (PDF A4)
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bgApp,
  },
  topControlBanner: {
    backgroundColor: '#09090B',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  controlTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#A1A1AA',
    letterSpacing: 0.6,
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: 6,
  },
  voucherScroll: {
    paddingLeft: THEME.spacing.lg,
  },
  voucherScrollContent: {
    paddingRight: THEME.spacing.lg,
    gap: 8,
  },
  voucherChip: {
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#3F3F46',
    borderRadius: THEME.radii.xs,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  voucherChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  voucherChipCode: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#E4E4E7',
    ...THEME.typography.tabular,
  },
  voucherChipCodeActive: {
    color: '#09090B',
  },
  voucherChipMeta: {
    fontSize: 8.5,
    color: '#71717A',
    marginTop: 2,
  },
  voucherChipMetaActive: {
    color: '#52525B',
  },
  docScrollArea: {
    flex: 1,
  },
  docScrollContent: {
    padding: THEME.spacing.md,
    paddingBottom: 24,
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  paperSheet: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#18181B',
    padding: 12,
  },
  topStrip: {
    borderBottomWidth: 1,
    borderBottomColor: '#71717A',
    borderStyle: 'dashed',
    paddingBottom: 4,
    marginBottom: 8,
    alignItems: 'center',
  },
  topStripText: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#52525B',
    letterSpacing: 0.8,
  },
  sheetTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#18181B',
    paddingBottom: 8,
    marginBottom: 8,
    gap: 8,
  },
  titleMain: {
    fontSize: 16,
    fontWeight: '900',
    color: '#09090B',
    letterSpacing: 0.5,
  },
  companySub: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#475569',
    marginTop: 1,
  },
  metaBoxRight: {
    width: 150,
    borderWidth: 1,
    borderColor: '#18181B',
    backgroundColor: '#F8FAFC',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  metaLbl: {
    fontSize: 8,
    fontWeight: '700',
    color: '#475569',
  },
  metaVal: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  partyGrid: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#18181B',
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
  },
  partyCol: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  partyLbl: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  partyVal: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#18181B',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#18181B',
  },
  thCell: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  tdCell: {
    paddingHorizontal: 2,
    fontSize: 9,
  },
  tdTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0F172A',
  },
  tdSub: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 1,
  },
  catPill: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
  },
  catPillText: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#334155',
  },
  bottomSummaryGrid: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#18181B',
    marginTop: 8,
  },
  terbilangBox: {
    flex: 1.2,
    backgroundColor: '#FAFAFA',
    borderRightWidth: 1,
    borderRightColor: '#18181B',
    padding: 6,
    justifyContent: 'center',
  },
  terbilangLbl: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
  },
  terbilangText: {
    fontSize: 9,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#0F172A',
    lineHeight: 12,
  },
  totalsBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 4,
  },
  totRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  totLbl: {
    fontSize: 8,
    color: '#475569',
  },
  totVal: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  grandTotRow: {
    borderBottomWidth: 0,
    paddingTop: 4,
  },
  grandTotLbl: {
    fontSize: 9,
    fontWeight: '900',
    color: '#09090B',
  },
  grandTotVal: {
    fontSize: 10,
    fontWeight: '900',
    color: '#09090B',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginTop: 8,
  },
  statusText: {
    fontSize: 8,
    color: '#475569',
  },
  statusBold: {
    fontWeight: '800',
    color: '#0F172A',
    ...THEME.typography.tabular,
  },
  signatureGrid: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#18181B',
    marginTop: 8,
    backgroundColor: '#FFFFFF',
  },
  signatureCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 2,
  },
  sigBorderSide: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#18181B',
  },
  sigRole: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
  },
  sigSpace: {
    height: 30,
  },
  sigName: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  sigDate: {
    fontSize: 6.5,
    color: '#64748B',
    marginTop: 1,
  },
  sheetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  sheetFooterText: {
    fontSize: 7,
    color: '#64748B',
  },
  mono: {
    ...THEME.typography.tabular,
  },
  exportBar: {
    padding: THEME.spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  exportButton: {
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: THEME.radii.xs,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
