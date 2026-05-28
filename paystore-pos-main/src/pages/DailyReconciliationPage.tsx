import React from 'react';
import { POSLayout } from '@/components/layouts/POSLayout';
import { DailyAutoReconciliation } from '@/components/pos/DailyAutoReconciliation';

const DailyReconciliationPage: React.FC = () => {
  return (
    <POSLayout>
      <DailyAutoReconciliation />
    </POSLayout>
  );
};

export default DailyReconciliationPage;