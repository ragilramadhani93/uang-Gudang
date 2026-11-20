import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../styles/theme';
import { KasSummary } from '../types';
import { formatRupiah } from '../services/pdfGenerator';

interface HeaderKasProps {
  summary: KasSummary;
}

export const HeaderKas: React.FC<HeaderKasProps> = ({ summary }) => {
  return (
    <View style={styles.container}>
      {/* Industrial label bar */}
      <View style={styles.topLabelRow}>
        <View style={styles.statusIndicator} />
        <Text style={styles.systemTitle}>SISTEM KAS KECIL OPERASIONAL (IMPREST)</Text>
      </View>

      {/* Main Cash on Hand Box */}
      <View style={styles.mainBalanceBox}>
        <Text style={styles.balanceLabel}>CASH ON HAND SAAT INI</Text>
        <Text style={styles.balanceAmount}>{formatRupiah(summary.cashOnHand)}</Text>
        <Text style={styles.balanceSubtext}>Kas fisik riil di brankas / dompet kasir</Text>
      </View>

      {/* 2-Column Split: Plafon & Reimburse */}
      <View style={styles.secondaryGrid}>
        <View style={[styles.gridCell, styles.gridBorderRight]}>
          <Text style={styles.cellLabel}>PLAFON DANA TETAP</Text>
          <Text style={styles.cellValue}>{formatRupiah(summary.plafon)}</Text>
        </View>

        <View style={styles.gridCell}>
          <Text style={[styles.cellLabel, summary.kebutuhanReimburse > 0 && styles.reimburseLabelAlert]}>
            KEBUTUHAN REIMBURSE
          </Text>
          <Text style={[styles.cellValue, summary.kebutuhanReimburse > 0 && styles.reimburseValAlert]}>
            {formatRupiah(summary.kebutuhanReimburse)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.bgCardDark,
    borderRadius: THEME.radii.sm,
    borderWidth: 1,
    borderColor: '#27272A',
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    overflow: 'hidden',
  },
  topLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 7,
    backgroundColor: '#09090B',
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  systemTitle: {
    color: '#A1A1AA',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  mainBalanceBox: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.sm,
  },
  balanceLabel: {
    color: '#A1A1AA',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  balanceAmount: {
    color: THEME.colors.textInverse,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    ...THEME.typography.tabular,
  },
  balanceSubtext: {
    color: '#71717A',
    fontSize: 10.5,
    marginTop: 2,
  },
  secondaryGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#27272A',
    backgroundColor: '#141416',
  },
  gridCell: {
    flex: 1,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm + 2,
  },
  gridBorderRight: {
    borderRightWidth: 1,
    borderRightColor: '#27272A',
  },
  cellLabel: {
    color: '#71717A',
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cellValue: {
    color: '#E4E4E7',
    fontSize: 14,
    fontWeight: '700',
    ...THEME.typography.tabular,
  },
  reimburseLabelAlert: {
    color: '#F59E0B',
  },
  reimburseValAlert: {
    color: '#FBBF24',
  },
});
