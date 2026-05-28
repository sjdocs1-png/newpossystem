import React from 'react';
import { POSLayout } from '@/components/layouts/POSLayout';
import { PaymentAlerts } from '@/components/pos/PaymentAlerts';

const PaymentAlertsPage: React.FC = () => {
  return (
    <POSLayout>
      <PaymentAlerts />
    </POSLayout>
  );
};

export default PaymentAlertsPage;
