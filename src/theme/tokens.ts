import { Flame, HelpCircle, Package, Trash2 } from 'lucide-react-native';

import type { UrgencyLevel } from '../types/item';

export const colors = {
  washi: '#f4f1ea',
  washiShu: '#f6efe8',
  washiSheet: '#efece3',
  confirmSheet: '#eeecea',
  note: '#fbfaf6',
  noteAlt: '#faf8f3',
  card: '#ffffff',
  sumi: '#2a2a2c',
  kachi: '#2c2e63',
  shu: '#9e3b2c',
  nibiiro: '#57565b',
  subtextDark: '#6b6459',
  subtext: '#8f887c',
  subtextLight: '#b0a89a',
  border: 'rgba(0,0,0,0.08)',
  borderLight: 'rgba(0,0,0,0.06)',
  check: '#4a8060',
  photoDark: '#17171a',
  photoLight: '#e7e2d8',
  viewer: '#0c0c0e',
  white: '#ffffff',
  dangerText: '#b5443a',
  kachiOverlay: 'rgba(44,46,99,0.78)',
  shuOverlay: 'rgba(146,56,46,0.78)',
  shuTintStrong: 'rgba(158,59,44,0.14)',
  shuTint: 'rgba(158,59,44,0.08)',
  photoScrim: 'rgba(0,0,0,0.5)',
  cameraGuideShade: 'rgba(0,0,0,0.2)',
  cameraGuideLine: 'rgba(255,255,255,0.62)',
  translucentCard: 'rgba(255,255,255,0.92)',
} as const;

export const fonts = {
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
  serif: 'ShipporiMincho_400Regular',
  serifMedium: 'ShipporiMincho_500Medium',
  serifSemiBold: 'ShipporiMincho_600SemiBold',
  serifBold: 'ShipporiMincho_700Bold',
  mono: 'Menlo',
} as const;

export const radii = {
  card: 12,
  sheet: 26,
  button: 14,
  pill: 9999,
  input: 12,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 32,
} as const;

export const urgency = {
  3: {
    label: '今すぐ',
    color: '#dc2626',
    filterBackground: 'rgba(220,38,38,0.10)',
    filterBorder: 'rgba(220,38,38,0.28)',
    icon: Flame,
  },
  2: {
    label: '捨てたい',
    color: '#ea580c',
    filterBackground: 'rgba(234,88,12,0.10)',
    filterBorder: 'rgba(234,88,12,0.28)',
    icon: Trash2,
  },
  1: {
    label: '迷い',
    color: '#ca8a04',
    editColor: '#a8892e',
    filterBackground: 'rgba(202,138,4,0.10)',
    filterBorder: 'rgba(202,138,4,0.28)',
    icon: HelpCircle,
  },
  0: {
    label: '残す',
    color: '#16a34a',
    filterBackground: 'rgba(22,163,74,0.10)',
    filterBorder: 'rgba(22,163,74,0.28)',
    icon: Package,
  },
} satisfies Record<
  UrgencyLevel,
  {
    label: string;
    color: string;
    editColor?: string;
    filterBackground: string;
    filterBorder: string;
    icon: typeof HelpCircle;
  }
>;

// 撮影画面の捨てたい度セレクタ寸法。円相はアイコンより大きく見せつつ、
// 各選択肢の列幅（画面幅を4等分 ≒ 狭い端末で74pt）の内側に収める。
// 円相は枠(circle)より一回り小さくして余白を取り、選択時のアニメーション
// （EnsoMark）が枠へ触れて滲み出さないようにする。
export const urgencySelector = {
  circle: 72,
  ensoSelected: 54,
  ensoUnselected: 50,
  iconSelected: 34,
  iconUnselected: 31,
} as const;

// 撮影レビューは4択と「写しを収める」ボタンを同じシートに収めるため、
// 50ptアイコン枠に寄せた専用寸法を使う。円相のアニメーションも枠内に収める。
export const captureUrgencySelector = {
  circle: 60,
  ensoSelected: 46,
  ensoUnselected: 42,
  iconSelected: 24,
  iconUnselected: 22,
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  fab: {
    shadowColor: colors.kachi,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  button: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
} as const;
