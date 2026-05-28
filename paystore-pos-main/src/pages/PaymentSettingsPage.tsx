import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentSettingsPanel } from '@/components/pos/PaymentSettingsPanel';
import { PaymentHistoryPage } from '@/components/pos/PaymentHistoryPage';
import { supabase } from '@/integrations/supabase/client';
import { useLocale } from '@/contexts/LocaleContext';
import { Settings, Receipt, BarChart3 } from 'lucide-react';

const PaymentSettingsPage: React.FC = () => {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          💳 Payment Management
        </h1>
        <p className="text-sm text-muted-foreground">Configure payment methods, view history & settlement reports</p>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="settings" className="flex items-center gap-1">
            <Settings className="w-4 h-4" /> Settings
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1">
            <Receipt className="w-4 h-4" /> History
          </TabsTrigger>
          <TabsTrigger value="settlement" className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4" /> Settlement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <div className="rounded-xl border border-border p-4 bg-card">
            <PaymentSettingsPanel />
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="rounded-xl border border-border p-4 bg-card">
            <PaymentHistoryPage />
          </div>
        </TabsContent>

        <TabsContent value="settlement">
          <div className="rounded-xl border border-border p-4 bg-card">
            <SettlementReport />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Settlement Report sub-component
const SettlementReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const { formatCurrency } = useLocale();
  const [stats, setStats] = useState({
    totalCollection: 0,
    cashCollection: 0,
    cardCollection: 0,
    upiCollection: 0,
    pendingSettlement: 0,
    failedCount: 0,
    refundedAmount: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storeData = localStorage.getItem('pos_active_store_data');
        if (!storeData) { setLoading(false); return; }
        const { storeId } = JSON.parse(storeData);
        if (!storeId) { setLoading(false); return; }

        const today = new Date().toISOString().split('T')[0];

        const [{ data: payments }, { data: orders }] = await Promise.all([
          supabase.from('payments').select('amount, status, payment_mode').eq('store_id', storeId).gte('business_date', today),
          supabase.from('orders').select('total, payment_method').eq('store_id', storeId).eq('status', 'completed').gte('created_at', `${today}T00:00:00`),
        ]);

        const paidPayments = (payments || []).filter(p => p.status === 'paid');
        const cashOrders = (orders || []).filter(o => o.payment_method === 'cash');
        const cardOrders = (orders || []).filter(o => o.payment_method === 'card');
        const upiOrders = (orders || []).filter(o => o.payment_method === 'upi');

        setStats({
          totalCollection: (orders || []).reduce((s, o) => s + Number(o.total), 0) + paidPayments.reduce((s, p) => s + Number(p.amount), 0),
          cashCollection: cashOrders.reduce((s, o) => s + Number(o.total), 0),
          cardCollection: cardOrders.reduce((s, o) => s + Number(o.total), 0),
          upiCollection: upiOrders.reduce((s, o) => s + Number(o.total), 0),
          pendingSettlement: (payments || []).filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0),
          failedCount: (payments || []).filter(p => p.status === 'failed').length,
          refundedAmount: (payments || []).filter(p => p.status === 'refunded').reduce((s, p) => s + Number(p.amount), 0),
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  const items = [
    { label: 'Total Collection', value: stats.totalCollection, color: 'text-primary' },
    { label: 'Cash Collection', value: stats.cashCollection, color: 'text-foreground' },
    { label: 'Card Collection', value: stats.cardCollection, color: 'text-blue-500' },
    { label: 'UPI Collection', value: stats.upiCollection, color: 'text-yellow-500' },
    { label: 'Pending Settlement', value: stats.pendingSettlement, color: 'text-warning' },
    { label: 'Refunded', value: stats.refundedAmount, color: 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        Today's Settlement Summary
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map(item => (
          <div key={item.label} className="p-4 rounded-xl bg-secondary text-center">
            <p className={`text-xl font-bold ${item.color}`}>{formatCurrency(item.value)}</p>
            <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
          </div>
        ))}
        <div className="p-4 rounded-xl bg-secondary text-center">
          <p className="text-xl font-bold text-destructive">{stats.failedCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Failed Payments</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSettingsPage;
