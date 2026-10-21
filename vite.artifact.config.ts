// Builds the app as one self-contained page for the Claude preview artifact:
// React comes from cdnjs, Vazirmatn from Google Fonts, everything else is inlined.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import pkg from './package.json' with { type: 'json' };

const shim = (f: string) => fileURLToPath(new URL(`./artifact/${f}`, import.meta.url));

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [react({ jsxRuntime: 'automatic' }), tailwindcss()],
  resolve: {
    alias: [
      { find: /^react\/jsx-(dev-)?runtime$/, replacement: shim('jsx-runtime-shim.js') },
      { find: /^react-dom\/client$/, replacement: shim('react-dom-shim.js') },
      { find: /^react-dom$/, replacement: shim('react-dom-shim.js') },
      { find: /^react$/, replacement: shim('react-shim.js') },
      { find: 'virtual:pwa-register', replacement: shim('pwa-stub.js') },
      { find: '@fontsource-variable/vazirmatn', replacement: shim('empty.css') },
    ],
  },
  build: {
    outDir: 'dist-artifact',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    modulePreload: false,
    rollupOptions: {
      input: fileURLToPath(new URL('./src/main.tsx', import.meta.url)),
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'app.js',
        assetFileNames: '[name][extname]',
      },
    },
  },
});
