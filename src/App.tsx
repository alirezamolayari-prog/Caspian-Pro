import { useEffect, useRef, type ReactNode } from 'react';
import { BottomNav } from './components/layout/BottomNav';
import { Toaster } from './components/ui/Feedback';
import type { ModuleId } from './data/catalog';
import { AdvertisingPage } from './features/advertising/AdvertisingPage';
import { BoothPage } from './features/booth/BoothPage';
import { HomePage } from './features/home/HomePage';
import { LogisticsPage } from './features/logistics/LogisticsPage';
import { MaintenancePage } from './features/maintenance/MaintenancePage';
import { NotificationsPage } from './features/notifications/NotificationsPage';
import { NotificationPrompt } from './features/onboarding/NotificationPrompt';
import { ParkingPage } from './features/parking/ParkingPage';
import { ProfilePage } from './features/profile/ProfilePage';
import { RequestsPage } from './features/requests/RequestsPage';
import { SecurityPage } from './features/security/SecurityPage';
import { ServicesPage } from './features/services/ServicesPage';
import { SupportPage } from './features/support/SupportPage';
import { useBackgroundSimulation } from './hooks/useBackgroundSimulation';
import { useRoute, type Route } from './lib/router';
import { useUi } from './store/ui';

const MODULE_PAGES: Record<ModuleId, () => ReactNode> = {
  services: () => <ServicesPage />,
  logistics: () => <LogisticsPage />,
  security: () => <SecurityPage />,
  booth: () => <BoothPage />,
  advertising: () => <AdvertisingPage />,
  maintenance: () => <MaintenancePage />,
  support: () => <SupportPage />,
  parking: () => <ParkingPage />,
};

function renderRoute(route: Route): ReactNode {
  if (route.module) return MODULE_PAGES[route.module]();
  switch (route.tab) {
    case 'requests':
      return <RequestsPage />;
    case 'notifications':
      return <NotificationsPage />;
    case 'profile':
      return <ProfilePage />;
    default:
      return <HomePage />;
  }
}

export default function App() {
  const route = useRoute();
  const mainRef = useRef<HTMLElement>(null);
  const syncSystemTheme = useUi((s) => s.syncSystemTheme);
  const key = route.module ?? route.tab;
  const first = useRef(true);

  useBackgroundSimulation();

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    mq?.addEventListener?.('change', syncSystemTheme);
    return () => mq?.removeEventListener?.('change', syncSystemTheme);
  }, [syncSystemTheme]);

  // New screen: start at the top and move screen-reader focus to it.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }, [key]);

  return (
    <div className="relative mx-auto min-h-dvh max-w-md overflow-x-hidden bg-bg theme-fade sm:border-x sm:border-line">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-[200] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:font-bold focus:text-on-primary"
      >
        رفتن به محتوای اصلی
      </a>
      <main id="main" ref={mainRef} tabIndex={-1} className="pb-32 outline-none" key={key}>
        {renderRoute(route)}
      </main>
      <BottomNav active={route.tab} />
      <Toaster />
      <NotificationPrompt />
    </div>
  );
}
