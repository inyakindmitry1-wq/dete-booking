import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ClientPortalPage } from '@/pages/ClientPortalPage';
import { ClientBookingStatusPage } from '@/pages/ClientBookingStatusPage';
import { OwnerPortalPage } from '@/pages/OwnerPortalPage';
import { DemoRoleBar } from '@/components/common/DemoRoleBar';
import { getActiveStudioSlug } from '@/studios';

export function App() {
  const location = useLocation();
  const activeSlug = getActiveStudioSlug();

  return (
    <>
      <DemoRoleBar />
      <Routes>
        {/* Root redirect to active studio preserving search query */}
        <Route
          path="/"
          element={<Navigate to={`/s/${activeSlug}/${location.search}`} replace />}
        />

        {/* Client booking portal */}
        <Route path="/s/:slug" element={<ClientPortalPage />} />
        <Route path="/s/:slug/" element={<ClientPortalPage />} />

        {/* Client booking status & self-service management */}
        <Route path="/s/:slug/booking/:bookingId" element={<ClientBookingStatusPage />} />

        {/* Owner mobile dashboard */}
        <Route path="/s/:slug/owner" element={<OwnerPortalPage />} />
        <Route path="/s/:slug/owner/" element={<OwnerPortalPage />} />

        {/* Fallback */}
        <Route
          path="*"
          element={<Navigate to={`/s/${activeSlug}/${location.search}`} replace />}
        />
      </Routes>
    </>
  );
}
