import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

function channel(value: number): number {
  const scaled = value / 255;
  return scaled <= 0.04045
    ? scaled / 12.92
    : ((scaled + 0.055) / 1.055) ** 2.4;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sat = s / 100;
  const light = l / 100;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return light - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return [f(0), f(8), f(4)].map((part) => Math.round(part * 255)) as [
    number,
    number,
    number,
  ];
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const lum = (rgb: [number, number, number]) =>
    0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
  const [hi, lo] = [lum(a), lum(b)].sort((left, right) => right - left);
  return (hi! + 0.05) / (lo! + 0.05);
}

function rootTokens(): Map<string, [number, number, number]> {
  const css = readFileSync('src/app/globals.css', 'utf8');
  const block = css.match(/:root\s*\{([\s\S]*?)\n {2}\}/);
  if (!block?.[1]) throw new Error(':root が見つかりません');
  const tokens = new Map<string, [number, number, number]>();
  const pattern = /--([\w-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/g;
  let match: RegExpExecArray | null = pattern.exec(block[1]);
  while (match) {
    const name = match[1];
    const h = match[2];
    const s = match[3];
    const l = match[4];
    if (name && h && s && l) {
      tokens.set(name, hslToRgb(Number(h), Number(s), Number(l)));
    }
    match = pattern.exec(block[1]);
  }
  return tokens;
}

describe('塗りの文字色コントラスト', () => {
  test('accent・destructive・success は白文字と地の文字で AA を満たす', () => {
    const tokens = rootTokens();
    const accent = tokens.get('accent');
    const destructive = tokens.get('destructive');
    const success = tokens.get('success');
    const background = tokens.get('background');
    const accentForeground = tokens.get('accent-foreground');
    const destructiveForeground = tokens.get('destructive-foreground');
    const successForeground = tokens.get('success-foreground');
    if (
      !accent ||
      !destructive ||
      !success ||
      !background ||
      !accentForeground ||
      !destructiveForeground ||
      !successForeground
    ) {
      throw new Error('色トークンが足りません');
    }

    expect(contrast(accent, accentForeground)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(accent, background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(destructive, destructiveForeground)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(success, successForeground)).toBeGreaterThanOrEqual(4.5);
  });
});
