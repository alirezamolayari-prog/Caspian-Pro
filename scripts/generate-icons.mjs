// Renders public/favicon.svg into the PNG icons the PWA manifest and iOS need.
// Usage: node scripts/generate-icons.mjs   (uses Playwright's Chromium)
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const svg = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8');
const targets = [
  { file: 'pwa-192.png', size: 192, pad: 0 },
  { file: 'pwa-512.png', size: 512, pad: 0 },
  { file: 'apple-touch-icon.png', size: 180, pad: 0, square: true },
  { file: 'pwa-maskable-512.png', size: 512, pad: 0.12, square: true },
];

// PW_CHROMIUM lets you point at an existing Chromium instead of downloading one.
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
const page = await browser.newPage();
for (const t of targets) {
  const inner = Math.round(t.size * (1 - t.pad * 2));
  const body = t.square ? svg.replace('rx="112"', 'rx="0"') : svg;
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(
    `<html><body style="margin:0;background:${t.square ? '#0F172A' : 'transparent'};display:grid;place-items:center;width:${t.size}px;height:${t.size}px">
      <div style="width:${inner}px;height:${inner}px">${body.replace('<svg ', '<svg width="100%" height="100%" ')}</div></body></html>`,
  );
  const buf = await page.screenshot({ omitBackground: !t.square });
  await writeFile(new URL(`../public/${t.file}`, import.meta.url), buf);
  console.log('wrote', t.file);
}
await browser.close();
