import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

// The page may be embedded without our index.html (preview artifact), so set direction here too.
document.documentElement.lang = 'fa';
document.documentElement.dir = 'rtl';

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
