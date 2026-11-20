export const THEME = {
  colors: {
    bgApp: '#F5F5F0',
    bgCard: '#FFFFFF',
    bgCardDark: '#18181B',
    border: '#E2E2DC',
    borderStrong: '#18181B',
    borderLight: '#ECECE7',
    
    // Text colors
    textPrimary: '#111315',
    textSecondary: '#52525B',
    textMuted: '#71717A',
    textInverse: '#FFFFFF',
    textInverseMuted: '#A1A1AA',

    // Industrial Accent
    accent: '#D97706', // Safety Ochre/Amber
    accentDark: '#B45309',
    accentLight: '#FEF3C7',

    // Status / Flow
    income: '#15803D', // Masuk
    incomeBg: '#DCFCE7',
    expense: '#B91C1C', // Keluar
    expenseBg: '#FEE2E2',

    // Category Badges
    badgeTol: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
    badgeBensin: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
    badgePlafon: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
    badgePenyesuaian: { bg: '#F4F4F5', text: '#3F3F46', border: '#E4E4E7' },
    badgeTopUp: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
    badgeLainnya: { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  radii: {
    none: 0,
    xs: 2,
    sm: 4,
    md: 6,
  },
  typography: {
    tabular: {
      fontVariant: ['tabular-nums'] as const,
    },
  },
};
