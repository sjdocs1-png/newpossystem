import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { realtimeManager } from '@/lib/realtimeManager';
import { useLocale } from '@/contexts/LocaleContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Download, RefreshCw, Search, Filter, Zap,
  CheckCircle2, XCircle, Clock, AlertTriangle, Loader2, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PaymentRecord {
  id: string;
  internal_order_id: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  amount: number;
  status: string;
  payment_mode: string | null;
  payment_provider: string;
  currency: string;
  business_date: string;
  created_at: string;
  webhook_verified: boolean;
  error_message: string | null;
}

type StatusFilter = 'all' | 'paid' | 'pending' | 'failed' | 'expired' | 'refunded';
type TimeFilter = 'today' | 'week' | 'month' | 'all';

export const PaymentHistoryPage: React.FC = () => {
  const { formatCurrency } = useLocale();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [refundTarget, setRefundTarget] = useState<PaymentRecord | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);

  const getStoreId = (): string => {
    try {
      const storeData = localStorage.getItem('pos_active_store_data');
      if (storeData) return JSON.parse(storeData)?.storeId || '';
    } catch {}
    return '';
  };

  const getStoreCode = (): string | null => {
    try {
      const storeData = localStorage.getItem('pos_active_store_data');
      if (storeData) return JSON.parse(storeData)?.storeCode || null;
    } catch {}
    return null;
  };

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const storeId = getStoreId();
      if (!storeId) { setLoading(false); return; }

      let query = supabase
        .from('payments')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const now = new Date();
      if (timeFilter === 'today') {
        query = query.gte('business_date', now.toISOString().split('T')[0]);
      } else if (timeFilter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('business_date', weekAgo.toISOString().split('T')[0]);
      } else if (timeFilter === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('business_date', monthAgo.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPayments((data as PaymentRecord[]) || []);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, timeFilter]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  // Realtime subscription
  useEffect(() => {
    const storeId = getStoreId();
    if (!storeId) return;

    const subscription = realtimeManager.subscribe({
      key: `payment-history-${storeId}`,
      channelName: `payment-history-${storeId}`,
      storeId,
      eventConfigs: [{
        event: '*',
        schema: 'public',
        table: 'payments',
        filter: `store_id=eq.${storeId}`,
      }],
      dedupeKey: (payload) => {
        const record = payload?.new as PaymentRecord | null;
        return record?.id ? `${payload.eventType}:${record.id}:${record?.updated_at || record?.created_at || ''}` : null;
      },
      eventBatchMs: 200,
      onEvent: (payload) => {
        const record = payload.new as PaymentRecord;
        if (!record?.id) return;
        if (payload.eventType === 'INSERT') {
          setPayments(prev => [record, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setPayments(prev => prev.map(p => p.id === record.id ? record : p));
        }
      },
    });

    return () => { realtimeManager.unsubscribe(subscription.config.key); };
  }, [fetchPayments]);

  const filtered = payments.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.internal_order_id.toLowerCase().includes(q) ||
      p.provider_order_id?.toLowerCase().includes(q) ||
      p.provider_payment_id?.toLowerCase().includes(q)
    );
  });

  const summary = {
    total: filtered.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0),
    count: filtered.length,
    paid: filtered.filter(p => p.status === 'paid').length,
    pending: filtered.filter(p => p.status === 'pending').length,
    failed: filtered.filter(p => p.status === 'failed').length,
    refunded: filtered.filter(p => p.status === 'refunded').length,
    refundedAmount: filtered.filter(p => p.status === 'refunded').reduce((s, p) => s + Number(p.amount), 0),
  };

  const exportCSV = () => {
    const headers = ['Date', 'Time', 'Order ID', 'Provider Order ID', 'Payment ID', 'Amount', 'Status', 'Mode', 'Provider', 'Verified', 'Business Date'];
    const rows = filtered.map(p => [
      format(new Date(p.created_at), 'yyyy-MM-dd'),
      format(new Date(p.created_at), 'HH:mm:ss'),
      p.internal_order_id,
      p.provider_order_id || '',
      p.provider_payment_id || '',
      p.amount,
      p.status,
      p.payment_mode || '',
      p.payment_provider,
      p.webhook_verified ? 'Yes' : 'No',
      p.business_date,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const exportDailySummary = () => {
    const paidPayments = filtered.filter(p => p.status === 'paid');
    const modes: Record<string, { count: number; total: number }> = {};
    paidPayments.forEach(p => {
      const mode = p.payment_mode || 'unknown';
      if (!modes[mode]) modes[mode] = { count: 0, total: 0 };
      modes[mode].count++;
      modes[mode].total += Number(p.amount);
    });

    const lines = [
      `Daily Payment Summary - ${format(new Date(), 'dd MMM yyyy')}`,
      '',
      `Total Collected,${summary.total}`,
      `Successful Payments,${summary.paid}`,
      `Pending Payments,${summary.pending}`,
      `Failed Payments,${summary.failed}`,
      `Refunded,${summary.refunded} (${summary.refundedAmount})`,
      '',
      'Payment Mode Breakdown',
      'Mode,Count,Total',
      ...Object.entries(modes).map(([mode, data]) => `${mode},${data.count},${data.total}`),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-summary-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Daily summary exported');
  };

  const handleRefund = async () => {
    if (!refundTarget) return;
    setRefunding(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-refund', {
        body: {
          payment_id: refundTarget.id,
          store_code: getStoreCode(),
          reason: refundReason || 'Merchant initiated refund',
        },
      });
      if (error || data?.error) {
        toast.error(data?.error || error?.message || 'Refund failed');
      } else {
        toast.success(`Refund of ${formatCurrency(Number(refundTarget.amount))} processed successfully`);
        setRefundTarget(null);
        setRefundReason('');
        fetchPayments();
      }
    } catch (err) {
      toast.error('Refund request failed');
    } finally {
      setRefunding(false);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'expired': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'refunded': return <RotateCcw className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const statusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'paid': return 'default';
      case 'failed': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 rounded-xl bg-secondary text-center">
          <p className="text-xl font-bold text-primary">{formatCurrency(summary.total)}</p>
          <p className="text-xs text-muted-foreground">Total Collected</p>
        </div>
        <div className="p-3 rounded-xl bg-secondary text-center">
          <p className="text-xl font-bold text-green-500">{summary.paid}</p>
          <p className="text-xs text-muted-foreground">Successful</p>
        </div>
        <div className="p-3 rounded-xl bg-secondary text-center">
          <p className="text-xl font-bold text-yellow-500">{summary.pending}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="p-3 rounded-xl bg-secondary text-center">
          <p className="text-xl font-bold text-destructive">{summary.failed}</p>
          <p className="text-xs text-muted-foreground">Failed</p>
        </div>
        <div className="p-3 rounded-xl bg-secondary text-center">
          <p className="text-xl font-bold text-blue-500">{summary.refunded}</p>
          <p className="text-xs text-muted-foreground">Refunded</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={timeFilter} onValueChange={v => setTimeFilter(v as TimeFilter)}>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-32">
            <Filter className="w-3 h-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[150px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search order ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none"
          />
        </div>
        <Button variant="outline" size="sm" onClick={fetchPayments}>
          <RefreshCw className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-1" /> CSV
        </Button>
        <Button variant="outline" size="sm" onClick={exportDailySummary}>
          <Download className="w-4 h-4 mr-1" /> Summary
        </Button>
      </div>

      {/* Payment List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Zap className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>No payment records found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(payment => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {statusIcon(payment.status)}
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {formatCurrency(Number(payment.amount))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {payment.internal_order_id.slice(0, 20)}...
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-right">
                {payment.status === 'paid' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-blue-500 hover:text-blue-600"
                    onClick={() => { setRefundTarget(payment); setRefundReason(''); }}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Refund
                  </Button>
                )}
                <div>
                  <Badge variant={statusBadgeVariant(payment.status)} className="uppercase text-[10px]">
                    {payment.status}
                  </Badge>
                  {payment.payment_mode && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{payment.payment_mode}</p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(payment.created_at), 'HH:mm')}
                  <br />
                  {format(new Date(payment.created_at), 'dd MMM')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Refund Confirmation Dialog */}
      <Dialog open={!!refundTarget} onOpenChange={(v) => { if (!v) setRefundTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-blue-500" />
              Process Refund
            </DialogTitle>
          </DialogHeader>
          {refundTarget && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-secondary/50 text-center">
                <p className="text-sm text-muted-foreground">Refund Amount</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(Number(refundTarget.amount))}</p>
                <p className="text-xs text-muted-foreground mt-1">Order: {refundTarget.internal_order_id.slice(0, 25)}...</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Reason (optional)</label>
                <textarea
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  placeholder="Customer complaint, wrong order, etc."
                  className="w-full mt-1 p-3 h-20 rounded-lg border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ Refund will be processed. Amount will be returned to customer's original payment method within 5-7 business days.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRefundTarget(null)} disabled={refunding}>Cancel</Button>
            <Button onClick={handleRefund} disabled={refunding} className="bg-blue-500 hover:bg-blue-600 text-white">
              {refunding ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RotateCcw className="w-4 h-4 mr-1" />}
              Confirm Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
