import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Reads the token blocks from index.css and checks WCAG AA pairs in both themes. */
const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  const body = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6}|rgba\([^)]+\))/g)].map((m) => [m[1]!, m[2]!]),
  );
}

/** Flattens an rgba() token over an opaque background into a hex colour. */
function over(color: string, bg: string): string {
  const m = /rgba\(([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\)/.exec(color);
  if (!m) return color;
  const a = Number(m[4]);
  const hex = [1, 3, 5].map((i, k) => {
    const c = Math.round(Number(m[k + 1]) * a + parseInt(bg.slice(i, i + 2), 16) * (1 - a));
    return c.toString(16).padStart(2, '0');
  });
  return `#${hex.join('')}`;
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const ratio = (a: string, b: string) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (l1 + 0.05) / (l2 + 0.05);
};

const light = block(':root');
const dark = { ...light, ...block(":root[data-theme='dark']") };

describe.each([
  ['light', light],
  ['dark', dark],
])('%s theme contrast', (_, t) => {
  const pairs: Array<[string, string]> = [
    ['text', 'bg'],
    ['text', 'surface'],
    ['text-2', 'surface'],
    ['text-2', 'bg'],
    ['text-2', 'surface-2'],
    ['accent-ink', 'surface'],
    ['accent-ink', 'bg'],
    ['on-accent', 'accent'],
    ['on-header', 'header'],
    ['on-header-2', 'header'],
    ['on-header-2', 'header-2'],
    ['danger', 'surface'],
    ['success', 'surface'],
    ['warning', 'surface'],
    ['info', 'surface'],
  ];
  it.each(pairs)('%s on %s is at least 4.5:1', (fg, bg) => {
    expect(ratio(t[fg]!, t[bg]!)).toBeGreaterThanOrEqual(4.5);
  });
  // Badges: tone text on its translucent tint, laid over the card surface.
  it.each(['success', 'danger', 'warning', 'info'])('%s badge text on its tint', (tone) => {
    expect(ratio(t[tone]!, over(t[`${tone}-soft`]!, t.surface!))).toBeGreaterThanOrEqual(4.5);
  });
  it('gold badge text on its tint', () => {
    expect(ratio(t['accent-ink']!, over(t['accent-soft']!, t.surface!))).toBeGreaterThanOrEqual(
      4.5,
    );
  });
});
