import { describe, expect, it, vi } from 'vitest';

// tokens.ts eagerly binds Lucide icon components into the urgency map; stub them
// so the module can load under Node without pulling in react-native.
vi.mock('lucide-react-native', () => ({
  Flame: () => null,
  HelpCircle: () => null,
  Package: () => null,
  Trash2: () => null,
}));

import { captureUrgencySelector, urgencySelector } from './tokens';

describe('urgencySelector sizing (円相はみ出し防止)', () => {
  // 捨てたい度は4択で、各列幅 = (画面幅 − sheet padding 24pt) ÷ 4。
  // 320pt級の狭い端末でも ~74pt/列なので、円相の枠(circle)はこれ以下に収める。
  const NARROW_COLUMN = 74;

  it('keeps the circle inside a single option column', () => {
    expect(urgencySelector.circle).toBeLessThanOrEqual(NARROW_COLUMN);
  });

  it('draws the enso larger than the icon yet within the circle', () => {
    expect(urgencySelector.ensoSelected).toBeGreaterThan(urgencySelector.iconSelected);
    expect(urgencySelector.ensoUnselected).toBeGreaterThan(urgencySelector.iconUnselected);
    expect(urgencySelector.ensoSelected).toBeLessThanOrEqual(urgencySelector.circle);
    expect(urgencySelector.ensoUnselected).toBeLessThanOrEqual(urgencySelector.circle);
  });

  it('uses a smaller capture selector and keeps its animated enso inside the review option', () => {
    expect(captureUrgencySelector.circle).toBeLessThan(urgencySelector.circle);
    expect(captureUrgencySelector.ensoSelected).toBeGreaterThan(captureUrgencySelector.iconSelected);
    expect(captureUrgencySelector.ensoSelected).toBeLessThan(captureUrgencySelector.circle);
    expect(captureUrgencySelector.ensoUnselected).toBeLessThan(captureUrgencySelector.circle);
  });
});
