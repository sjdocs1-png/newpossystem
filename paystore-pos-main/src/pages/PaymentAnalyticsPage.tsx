import React from 'react';
import { POSLayout } from '@/components/layouts/POSLayout';
import { PaymentAnalyticsDashboard } from '@/components/pos/PaymentAnalyticsDashboard';

const PaymentAnalyticsPage: React.FC = () => {
  return (
    <POSLayout>
      <PaymentAnalyticsDashboard />
    </POSLayout>
  );
};

export default PaymentAnalyticsPage;
