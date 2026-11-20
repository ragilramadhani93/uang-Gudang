import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from './src/styles/theme';
import { initDatabase } from './src/database/db';
import { KasLogScreen } from './src/screens/KasLogScreen';
import { LembarBuktiScreen } from './src/screens/LembarBuktiScreen';
import { PengaturanScreen } from './src/screens/PengaturanScreen';

type TabType = 'kas' | 'bukti' | 'pengaturan';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('kas');
  const [dbReady, setDbReady] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function setup() {
      try {
        await initDatabase();
        setDbReady(true);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setDbReady(true);
      }
    }
    setup();
  }, []);

  const handleDataReset = () => {
    setRefreshKey((prev) => prev + 1);
    setActiveTab('kas');
  };

  if (!dbReady) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingTitle}>MEMULAI TRACKER KAS OPERASIONAL GUDANG</Text>
        <Text style={styles.loadingSub}>Inisialisasi Database Lokal SQLite (Imprest Engine)...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />

      {/* Top Application Bar */}
      <View style={styles.appTopBar}>
        <View style={styles.topBarBrand}>
          <View style={styles.topBarAccentSquare} />
          <View>
            <Text style={styles.appName}>OPS GUDANG</Text>
            <Text style={styles.appTagline}>Tracker Kas Harian &bull; Standalone</Text>
          </View>
        </View>

        <View style={styles.offlineBadge}>
          <MaterialCommunityIcons name="wifi-strength-4" size={12} color="#10B981" />
          <Text style={styles.offlineText}>LOCAL OFFLINE</Text>
        </View>
      </View>

      {/* Screen Container */}
      <View style={styles.screenContainer}>
        {activeTab === 'kas' && <KasLogScreen key={`kas-${refreshKey}`} />}
        {activeTab === 'bukti' && <LembarBuktiScreen key={`bukti-${refreshKey}`} />}
        {activeTab === 'pengaturan' && (
          <PengaturanScreen key={`cfg-${refreshKey}`} onDataReset={handleDataReset} />
        )}
      </View>

      {/* Tactile Industrial Bottom Navigation Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'kas' && styles.tabBtnActive]}
          onPress={() => setActiveTab('kas')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={activeTab === 'kas' ? 'cash-register' : 'book-outline'}
            size={19}
            color={activeTab === 'kas' ? '#FFFFFF' : '#71717A'}
          />
          <Text style={[styles.tabText, activeTab === 'kas' && styles.tabTextActive]}>
            KAS & LOG
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'bukti' && styles.tabBtnActive]}
          onPress={() => setActiveTab('bukti')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={activeTab === 'bukti' ? 'file-document' : 'file-document-outline'}
            size={19}
            color={activeTab === 'bukti' ? '#FFFFFF' : '#71717A'}
          />
          <Text style={[styles.tabText, activeTab === 'bukti' && styles.tabTextActive]}>
            BUKTI PDF A4
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'pengaturan' && styles.tabBtnActive]}
          onPress={() => setActiveTab('pengaturan')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={activeTab === 'pengaturan' ? 'cog' : 'cog-outline'}
            size={19}
            color={activeTab === 'pengaturan' ? '#FFFFFF' : '#71717A'}
          />
          <Text style={[styles.tabText, activeTab === 'pengaturan' && styles.tabTextActive]}>
            PENGATURAN
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#09090B',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#09090B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.8,
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSub: {
    color: '#71717A',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  appTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: 10,
    backgroundColor: '#09090B',
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  topBarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarAccentSquare: {
    width: 14,
    height: 14,
    backgroundColor: '#D97706', // Safety Amber
    borderRadius: 2,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  appTagline: {
    color: '#71717A',
    fontSize: 8.5,
    fontWeight: '600',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 2,
  },
  offlineText: {
    color: '#10B981',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: THEME.colors.bgApp,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#09090B',
    borderTopWidth: 1,
    borderTopColor: '#27272A',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 3,
  },
  tabBtnActive: {
    backgroundColor: '#18181B',
  },
  tabText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#71717A',
    marginTop: 3,
    letterSpacing: 0.4,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
