// Warm Neutral Design System - Colors

export const colors = {
  // Backgrounds
  bgPrimary: '#FAFAF8',
  bgSecondary: '#F4F3F0',
  bgCard: '#FFFFFF',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textTertiary: '#9B9B9B',
  textInverse: '#FFFFFF',

  // Borders & Dividers
  borderDefault: '#E8E8E4',
  borderFocus: '#3D3D3D',
  divider: '#F0EFEC',

  // Accent
  accentPrimary: '#3D3D3D',
  accentHover: '#2A2A2A',
  accentSubtle: '#EAEAE6',

  // Status
  accentSuccess: '#4A7A5B',
  accentWarning: '#C4973B',
  accentDanger: '#B85C4D',
  statusPendingBg: '#FDF6E8',
  statusPendingText: '#C4973B',
  statusConfirmedBg: '#EDF5EF',
  statusConfirmedText: '#4A7A5B',
  statusCancelledBg: '#F5F4F2',
  statusCancelledText: '#9B9B9B',
} as const;

export const typography = {
  headingXL: { fontSize: 26, fontWeight: '700', letterSpacing: -0.3 },
  headingLG: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2 },
  headingMD: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  bodyMedium: { fontSize: 15, fontWeight: '500' },
  bodySmall: { fontSize: 13, fontWeight: '400' },
  caption: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  chip: { fontSize: 13, fontWeight: '500' },
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  button: {
    shadowColor: '#3D3D3D',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
} as const;

// Quick access shortcuts (legacy-friendly)
export const theme = {
  primary: colors.accentPrimary,
  primaryHover: colors.accentHover,
  accent: colors.accentPrimary,

  background: colors.bgPrimary,
  surface: colors.bgCard,
  highlight: colors.borderDefault,

  text: colors.textPrimary,
  textSecondary: colors.textSecondary,
  textMuted: colors.textTertiary,

  success: colors.accentSuccess,
  warning: colors.accentWarning,
  error: colors.accentDanger,

  swipeRight: colors.accentSuccess,
  swipeLeft: colors.accentDanger,
} as const;
