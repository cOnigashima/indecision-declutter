import { describe, expect, it } from 'vitest';

import {
  formatPriceDisplay,
  formatPriceInput,
  joinBlockersInput,
  normalizeOptionalText,
  parsePriceInput,
  splitBlockersInput,
} from './itemForm';

describe('itemForm', () => {
  it('formats price for input and display', () => {
    expect(formatPriceInput(3200)).toBe('3200');
    expect(formatPriceInput(0)).toBe('0');
    expect(formatPriceInput(undefined)).toBe('');
    expect(formatPriceDisplay(3200)).toBe('3,200円');
    expect(formatPriceDisplay(0)).toBe('0円');
    expect(formatPriceDisplay(undefined)).toBe('-');
  });

  it('parses price input and treats blank input as clearing the value', () => {
    expect(parsePriceInput(' 3,200円 ')).toEqual({ ok: true, value: 3200 });
    expect(parsePriceInput('３２００')).toEqual({ ok: true, value: 3200 });
    expect(parsePriceInput('￥１２,３００')).toEqual({ ok: true, value: 12300 });
    expect(parsePriceInput('¥ 0')).toEqual({ ok: true, value: 0 });
    expect(parsePriceInput('')).toEqual({ ok: true, value: null });
    expect(parsePriceInput('   円  ')).toEqual({ ok: true, value: null });
    expect(parsePriceInput('三千円')).toEqual({ ok: false, message: '購入価格は数字で入力してください。' });
    expect(parsePriceInput('1200.50')).toEqual({ ok: false, message: '購入価格は数字で入力してください。' });
    expect(parsePriceInput('-1200')).toEqual({ ok: false, message: '購入価格は数字で入力してください。' });
  });

  it('normalizes optional text fields', () => {
    expect(normalizeOptionalText(' 食器棚 ')).toBe('食器棚');
    expect(normalizeOptionalText('   ')).toBeNull();
  });

  it('joins and splits blocker input', () => {
    expect(joinBlockersInput(['思い出', '高かった'])).toBe('思い出、高かった');
    expect(splitBlockersInput('#思い出、高かった\nいつか使う')).toEqual(['思い出', '高かった', 'いつか使う']);
    expect(splitBlockersInput(' 思い出 、 , #高かった\n\nいつか使う ')).toEqual(['思い出', '高かった', 'いつか使う']);
  });
});
