import React from 'react';
import { POSLayout } from '@/components/layouts/POSLayout';
import { PaymentHistoryPage as PaymentHistory } from '@/components/pos/PaymentHistoryPage';

const PaymentHistoryPageRoute: React.FC = () => {
  return (
    <POSLayout>
      <PaymentHistory />
    </POSLayout>
  );
};

export default PaymentHistoryPageRoute;
