import { Routes, Route, Navigate } from 'react-router-dom';
import { ClientPortalPage } from '@/pages/ClientPortalPage';
import { ClientBookingStatusPage } from '@/pages/ClientBookingStatusPage';
import { OwnerPortalPage } from '@/pages/OwnerPortalPage';

const defaultTenant = import.meta.env.VITE_DEFAULT_TENANT || 'sokol';

export function App() {
  return (
    <Routes>
      {/* Root redirect to default tenant */}
      <Route path="/" element={<Navigate to={`/s/${defaultTenant}/`} replace />} />

      {/* Client booking portal */}
      <Route path="/s/:slug" element={<ClientPortalPage />} />
      <Route path="/s/:slug/" element={<ClientPortalPage />} />

      {/* Client booking status & self-service management */}
      <Route path="/s/:slug/booking/:bookingId" element={<ClientBookingStatusPage />} />

      {/* Owner mobile dashboard */}
      <Route path="/s/:slug/owner" element={<OwnerPortalPage />} />
      <Route path="/s/:slug/owner/" element={<OwnerPortalPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={`/s/${defaultTenant}/`} replace />} />
    </Routes>
  );
}
