import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTenant } from '@/hooks/useTenant';
import { useOwnerAuth } from '@/hooks/useOwnerAuth';
import { OwnerLoginPage } from './OwnerLoginPage';
import { OwnerHeader } from '@/components/owner/OwnerHeader';
import { OwnerBottomNav, OwnerTab } from '@/components/owner/OwnerBottomNav';
import { ScheduleView } from '@/components/owner/ScheduleView';
import { AnalyticsView } from '@/components/owner/AnalyticsView';
import { SettingsView } from '@/components/owner/SettingsView';
import { BookingDetailsDrawer } from '@/components/owner/BookingDetailsDrawer';
import { ManualBlockDrawer } from '@/components/owner/ManualBlockDrawer';
import { api } from '@/lib/api';
import { DbBooking } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export const OwnerPortalPage: React.FC = () => {
  const { tenant, isLoading: isTenantLoading } = useTenant();
  const { isAuthenticated, isLoading: isAuthLoading, ownerEmail, logout } = useOwnerAuth(tenant?.id);

  const [activeTab, setActiveTab] = useState<OwnerTab>('schedule');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // Modals & Drawers
  const [selectedBooking, setSelectedBooking] = useState<DbBooking | null>(null);
  const [isManualBlockOpen, setIsManualBlockOpen] = useState(false);

  // Fetch schedule
  const {
    data: scheduleData,
    isLoading: isScheduleLoading,
    refetch: refetchSchedule,
  } = useQuery({
    queryKey: ['owner-schedule', tenant?.id, selectedDate],
    queryFn: () => (tenant ? api.getOwnerSchedule(tenant.id, selectedDate) : null),
    enabled: Boolean(tenant && isAuthenticated),
  });

  if (isTenantLoading || isAuthLoading) {
    return (
      <div className="min-h-screen bg-background p-4 max-w-lg mx-auto space-y-4 pt-10">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!tenant) return null;

  if (!isAuthenticated) {
    return <OwnerLoginPage tenant={tenant} />;
  }

  const resources = scheduleData?.resources || [];
  const bookings = scheduleData?.bookings || [];
  const occupancies = scheduleData?.occupancies || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top Header */}
      <OwnerHeader
        tenant={tenant}
        ownerEmail={ownerEmail}
        onLogout={logout}
      />

      {/* Main Content Area */}
      <main className="max-w-xl mx-auto px-4 pt-4">
        {activeTab === 'schedule' && (
          <ScheduleView
            tenant={tenant}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            resources={resources}
            bookings={bookings}
            occupancies={occupancies}
            onSelectBooking={setSelectedBooking}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsView tenant={tenant} />}

        {activeTab === 'settings' && <SettingsView tenant={tenant} />}
      </main>

      {/* Bottom Navigation */}
      <OwnerBottomNav
        currentTab={activeTab}
        onTabChange={setActiveTab}
        onQuickBlockClick={() => setIsManualBlockOpen(true)}
      />

      {/* Booking Details Drawer */}
      <BookingDetailsDrawer
        isOpen={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        booking={selectedBooking}
        tenant={tenant}
        onUpdated={() => refetchSchedule()}
      />

      {/* Manual Bay Block Drawer */}
      <ManualBlockDrawer
        isOpen={isManualBlockOpen}
        onClose={() => setIsManualBlockOpen(false)}
        tenant={tenant}
        resources={resources}
        selectedDate={selectedDate}
        onCreated={() => refetchSchedule()}
      />
    </div>
  );
};
