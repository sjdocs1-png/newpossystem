import React from 'react';
import { POSLayout } from '@/components/layouts/POSLayout';
import { DisputeManagement } from '@/components/pos/DisputeManagement';

const DisputesPage: React.FC = () => {
  return (
    <POSLayout>
      <DisputeManagement />
    </POSLayout>
  );
};

export default DisputesPage;
