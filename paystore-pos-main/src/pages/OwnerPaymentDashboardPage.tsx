import React from 'react';
import { POSLayout } from '@/components/layouts/POSLayout';
import { OwnerMultiStoreDashboard } from '@/components/pos/OwnerMultiStoreDashboard';

const OwnerPaymentDashboardPage: React.FC = () => {
  return (
    <POSLayout>
      <OwnerMultiStoreDashboard />
    </POSLayout>
  );
};

export default OwnerPaymentDashboardPage;
