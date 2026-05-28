import React from 'react';
import { POSLayout } from '@/components/layouts/POSLayout';
import { CustomerPaymentNotifications } from '@/components/pos/CustomerPaymentNotifications';

const CustomerNotificationsPage: React.FC = () => {
  return (
    <POSLayout>
      <CustomerPaymentNotifications />
    </POSLayout>
  );
};

export default CustomerNotificationsPage;
