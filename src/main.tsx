import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { isServerMode } from './api/config';
import { fetchParking } from './api/http';
import { setParkingSource } from './api/parking';
import './index.css';

// The page may be embedded without our index.html (preview artifact), so set direction here too.
document.documentElement.lang = 'fa';
document.documentElement.dir = 'rtl';

registerSW({ immediate: true });

if (isServerMode()) setParkingSource({ getSubscription: fetchParking });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
