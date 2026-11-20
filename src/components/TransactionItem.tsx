import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../styles/theme';
import { Transaction } from '../types';
import { formatRupiah } from '../services/pdfGenerator';

interface TransactionItemProps {
  transaction: Transaction;
  runningBalance: number;
  onPress: (transaction: Transaction) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  runningBalance,
  onPress,
}) => {
  const isIncome = transaction.masuk > 0;
  const isExpense = transaction.keluar > 0;
  const amount = isIncome ? transaction.masuk : transaction.keluar;

  const getBadgeStyle = (category: string) => {
    switch (category) {
      case 'Tol':
        return THEME.colors.badgeTol;
      case 'Bensin':
        return THEME.colors.badgeBensin;
      case 'Plafon Awal':
        return THEME.colors.badgePlafon;
      case 'Penyesuaian':
        return THEME.colors.badgePenyesuaian;
      case 'Top-Up':
        return THEME.colors.badgeTopUp;
      default:
        return THEME.colors.badgeLainnya;
    }
  };

  const badgeTheme = getBadgeStyle(transaction.kategori);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(transaction)}
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        <View style={styles.metaLeft}>
          <Text style={styles.dateText}>{transaction.tanggal}</Text>
          <Text style={styles.voucherText}>{transaction.no_bukti}</Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: badgeTheme.bg, borderColor: badgeTheme.border },
            ]}
          >
            <Text style={[styles.badgeText, { color: badgeTheme.text }]}>
              {transaction.kategori.toUpperCase()}
            </Text>
          </View>
        </View>

        {transaction.foto_uri ? (
          <View style={styles.photoIndicator}>
            <MaterialCommunityIcons name="camera" size={13} color="#D97706" />
            <Text style={styles.photoText}>STRUK</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.contentRow}>
        <View style={styles.descCol}>
          <Text style={styles.descText} numberOfLines={2}>
            {transaction.keterangan}
          </Text>

          {(transaction.plat_nomor || transaction.rute) && (
            <View style={styles.extraTagRow}>
              {transaction.plat_nomor ? (
                <Text style={styles.extraTag}>Plat: {transaction.plat_nomor}</Text>
              ) : null}
              {transaction.rute ? (
                <Text style={styles.extraTag}>Rute: {transaction.rute}</Text>
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.amountCol}>
          <Text
            style={[
              styles.amountText,
              isIncome ? styles.amountIncome : styles.amountExpense,
            ]}
          >
            {isIncome ? `+ ${formatRupiah(amount)}` : `- ${formatRupiah(amount)}`}
          </Text>
          <Text style={styles.runningBalanceText}>
            Saldo: {formatRupiah(runningBalance)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderLight,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    ...THEME.typography.tabular,
  },
  voucherText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    ...THEME.typography.tabular,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 2,
  },
  badgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  photoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  photoText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#B45309',
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  descCol: {
    flex: 1,
  },
  descText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    lineHeight: 17,
  },
  extraTagRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 3,
  },
  extraTag: {
    fontSize: 9.5,
    color: THEME.colors.textSecondary,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 13,
    fontWeight: '800',
    ...THEME.typography.tabular,
  },
  amountIncome: {
    color: THEME.colors.income,
  },
  amountExpense: {
    color: THEME.colors.expense,
  },
  runningBalanceText: {
    fontSize: 9.5,
    color: THEME.colors.textMuted,
    marginTop: 2,
    ...THEME.typography.tabular,
  },
});
