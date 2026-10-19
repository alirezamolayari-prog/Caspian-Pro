// Usage: node scripts/build-artifact.mjs  → dist-artifact/caspian-pro.html
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

execSync('npx vite build --config vite.artifact.config.ts', { stdio: 'inherit' });
const dir = 'dist-artifact';
const js = readFileSync(`${dir}/app.js`, 'utf8').replace(/<\/script/gi, '<\\/script');
const cssFile = readdirSync(dir).find((f) => f.endsWith('.css'));
const css = cssFile ? readFileSync(`${dir}/${cssFile}`, 'utf8') : '';
const html = `<title>کاسپین پرو</title>
<meta name="theme-color" content="#0F172A">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300..900&display=swap">
<style>${css}</style>
<div id="root"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>${js}</script>
`;
writeFileSync(`${dir}/caspian-pro.html`, html);
console.log(`wrote ${dir}/caspian-pro.html (${(html.length / 1024).toFixed(0)} KB)`);
