import React from 'react';
import { POSLayout } from '@/components/layouts/POSLayout';
import { SettlementTracking } from '@/components/pos/SettlementTracking';

const SettlementPage: React.FC = () => {
  return (
    <POSLayout>
      <SettlementTracking />
    </POSLayout>
  );
};

export default SettlementPage;
