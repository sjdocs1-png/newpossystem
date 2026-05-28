import React from 'react';
import { POSLayout } from '@/components/layouts/POSLayout';
import { RefundManagement } from '@/components/pos/RefundManagement';

const RefundManagementPage: React.FC = () => {
  return (
    <POSLayout>
      <RefundManagement />
    </POSLayout>
  );
};

export default RefundManagementPage;