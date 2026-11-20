import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../styles/theme';

interface QuickActionButtonsProps {
  onScanReceipt: () => void;
  onManualInput: () => void;
  onTopUp: () => void;
  loadingScan?: boolean;
}

export const QuickActionButtons: React.FC<QuickActionButtonsProps> = ({
  onScanReceipt,
  onManualInput,
  onTopUp,
  loadingScan = false,
}) => {
  return (
    <View style={styles.container}>
      {/* Primary Action: Scan Struk Camera */}
      <TouchableOpacity
        style={[styles.actionBtn, styles.primaryScanBtn]}
        onPress={onScanReceipt}
        disabled={loadingScan}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name={loadingScan ? 'loading' : 'camera-metering-center'}
          size={18}
          color="#FFFFFF"
          style={styles.btnIcon}
        />
        <View>
          <Text style={styles.primaryBtnTitle}>
            {loadingScan ? 'MEMBACA STRUK...' : 'SCAN STRUK'}
          </Text>
          <Text style={styles.primaryBtnSub}>Gemini Vision AI</Text>
        </View>
      </TouchableOpacity>

      {/* Secondary Action: Input Manual */}
      <TouchableOpacity
        style={[styles.actionBtn, styles.secondaryBtn]}
        onPress={onManualInput}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name="pencil-plus-outline"
          size={16}
          color={THEME.colors.textPrimary}
          style={styles.btnIcon}
        />
        <View>
          <Text style={styles.secondaryBtnTitle}>INPUT MANUAL</Text>
          <Text style={styles.secondaryBtnSub}>Tol / BBM</Text>
        </View>
      </TouchableOpacity>

      {/* Tertiary Action: Catat Top-Up */}
      <TouchableOpacity
        style={[styles.actionBtn, styles.secondaryBtn]}
        onPress={onTopUp}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name="cash-plus"
          size={16}
          color={THEME.colors.income}
          style={styles.btnIcon}
        />
        <View>
          <Text style={styles.secondaryBtnTitle}>TOP-UP KAS</Text>
          <Text style={styles.secondaryBtnSub}>Reimburse Masuk</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: THEME.radii.xs,
    borderWidth: 1,
  },
  btnIcon: {
    marginRight: 6,
  },
  primaryScanBtn: {
    backgroundColor: '#0F172A', // Dark Navy/Charcoal
    borderColor: '#0F172A',
    flex: 1.25,
  },
  primaryBtnTitle: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  primaryBtnSub: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: THEME.colors.bgCard,
    borderColor: THEME.colors.border,
  },
  secondaryBtnTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  secondaryBtnSub: {
    color: THEME.colors.textMuted,
    fontSize: 8.5,
    fontWeight: '500',
  },
});
