export type ParsedPrice =
  | {
      ok: true;
      value: number | null;
    }
  | {
      ok: false;
      message: string;
    };

export function formatPriceInput(price?: number): string {
  return typeof price === 'number' ? String(price) : '';
}

export function formatPriceDisplay(price?: number): string {
  return typeof price === 'number' ? `${price.toLocaleString('ja-JP')}円` : '-';
}

export function parsePriceInput(input: string): ParsedPrice {
  const normalized = normalizeNumberText(input);
  if (!normalized) {
    return { ok: true, value: null };
  }

  if (!/^\d+$/.test(normalized)) {
    return { ok: false, message: '購入価格は数字で入力してください。' };
  }

  return { ok: true, value: Number(normalized) };
}

export function normalizeOptionalText(input: string): string | null {
  const trimmed = input.trim();
  return trimmed ? trimmed : null;
}

export function joinBlockersInput(blockers: string[]): string {
  return blockers.join('、');
}

export function splitBlockersInput(input: string): string[] {
  return input
    .split(/[、,\n]/)
    .map((item) => item.trim().replace(/^#/, ''))
    .filter(Boolean);
}

function normalizeNumberText(input: string): string {
  return input
    .trim()
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/[,\s円¥￥]/g, '');
}
