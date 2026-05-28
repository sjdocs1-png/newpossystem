import React from 'react';
import { POSLayout } from '@/components/layouts/POSLayout';
import { PaymentReconciliation } from '@/components/pos/PaymentReconciliation';

const PaymentReconciliationPage: React.FC = () => {
  return (
    <POSLayout>
      <PaymentReconciliation />
    </POSLayout>
  );
};

export default PaymentReconciliationPage;
