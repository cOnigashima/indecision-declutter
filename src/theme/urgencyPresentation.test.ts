import { describe, expect, it, vi } from 'vitest';

vi.mock('lucide-react-native', () => ({
  Flame: () => null,
  HelpCircle: () => null,
  Package: () => null,
  Trash2: () => null,
}));

import { Flame, HelpCircle, Package, Trash2 } from 'lucide-react-native';

import { urgency } from './tokens';

describe('urgency presentation', () => {
  it('keeps the handoff label and color mapping', () => {
    expect(
      ([3, 2, 1, 0] as const).map((level) => ({
        label: urgency[level].label,
        color: urgency[level].color,
      }))
    ).toEqual([
      { label: '今すぐ', color: '#dc2626' },
      { label: '捨てたい', color: '#ea580c' },
      { label: '迷い', color: '#ca8a04' },
      { label: '残す', color: '#16a34a' },
    ]);
  });

  it('uses the matching icon for every urgency level', () => {
    expect([urgency[3].icon, urgency[2].icon, urgency[1].icon, urgency[0].icon]).toEqual([
      Flame,
      Trash2,
      HelpCircle,
      Package,
    ]);
  });

  it('provides a matching tint and border for every filter chip', () => {
    expect(
      ([3, 2, 1, 0] as const).map((level) => ({
        background: urgency[level].filterBackground,
        border: urgency[level].filterBorder,
      }))
    ).toEqual([
      { background: 'rgba(220,38,38,0.10)', border: 'rgba(220,38,38,0.28)' },
      { background: 'rgba(234,88,12,0.10)', border: 'rgba(234,88,12,0.28)' },
      { background: 'rgba(202,138,4,0.10)', border: 'rgba(202,138,4,0.28)' },
      { background: 'rgba(22,163,74,0.10)', border: 'rgba(22,163,74,0.28)' },
    ]);
  });
});
