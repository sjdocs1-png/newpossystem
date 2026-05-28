import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RefreshCw, Loader2, Landmark, Download, CheckCircle2, Clock, AlertTriangle
} from 'lucide-react';
import { format, startOfMonth, startOfWeek, startOfDay } from 'date-fns';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

type SettlementPeriod = 'today' | 'week' | 'month';

interface Settlement {
  id: string;
  settlement_id: string | null;
  amount: number;
  fee: number;
  tax: number;
  net_amount: number;
  payment_count: number;
  settlement_date: string | null;
  utr: string | null;
  status: string;
  created_at: string;
}

interface SettlementSummary {
  totalSettled: number;
  totalFees: number;
  totalNet: number;
  pendingCount: number;
  settledCount: number;
}

const getStoreId = (): string => {
  try {
    const d = localStorage.getItem('pos_active_store_data');
    if (d) return JSON.parse(d)?.storeId || JSON.parse(d)?.id || '';
    const s = localStorage.getItem('store_login');
    if (s) return JSON.parse(s)?.store_id || '';
  } catch {}
  return '';
};

export const SettlementTracking: React.FC = () => {
  const { formatCurrency } = useLocale();
  const [period, setPeriod] = useState<SettlementPeriod>('month');
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [summary, setSummary] = useState<SettlementSummary>({
    totalSettled: 0, totalFees: 0, totalNet: 0, pendingCount: 0, settledCount: 0,
  });

  // Also compute expected settlements from payments
  const [expectedFromPayments, setExpectedFromPayments] = useState({ total: 0, count: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const storeId = getStoreId();
      if (!storeId) { setLoading(false); return; }

      const now = new Date();
      let startDate: Date;
      if (period === 'today') startDate = startOfDay(now);
      else if (period === 'week') startDate = startOfWeek(now, { weekStartsOn: 1 });
      else startDate = startOfMonth(now);

      // Fetch settlements
      const { data: settlementData } = await supabase
        .from('payment_settlements')
        .select('*')
        .eq('store_id', storeId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      const items: Settlement[] = (settlementData || []).map(s => ({
        ...s,
        amount: Number(s.amount),
        fee: Number(s.fee),
        tax: Number(s.tax),
        net_amount: Number(s.net_amount),
      }));

      setSettlements(items);

      const settled = items.filter(s => s.status === 'settled');
      setSummary({
        totalSettled: settled.reduce((acc, s) => acc + s.amount, 0),
        totalFees: settled.reduce((acc, s) => acc + s.fee + s.tax, 0),
        totalNet: settled.reduce((acc, s) => acc + s.net_amount, 0),
        pendingCount: items.filter(s => s.status === 'pending').length,
        settledCount: settled.length,
      });

      // Fetch paid payments for expected calculation
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('store_id', storeId)
        .eq('status', 'paid')
        .eq('webhook_verified', true)
        .gte('business_date', format(startDate, 'yyyy-MM-dd'));

      const paidPayments = payments || [];
      setExpectedFromPayments({
        total: paidPayments.reduce((s, p) => s + Number(p.amount), 0),
        count: paidPayments.length,
      });
    } catch (err) {
      console.error('Settlement fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const exportCSV = () => {
    const headers = ['Date', 'Settlement ID', 'UTR', 'Amount', 'Fee', 'Tax', 'Net', 'Payments', 'Status'];
    const rows = settlements.map(s => [
      s.settlement_date || '', s.settlement_id || '', s.utr || '',
      s.amount.toString(), s.fee.toString(), s.tax.toString(), s.net_amount.toString(),
      s.payment_count.toString(), s.status,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settlements_${period}_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const gap = expectedFromPayments.total - summary.totalSettled;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Landmark className="w-6 h-6 text-primary" />
          Settlement & Payout Tracking
        </h2>
        <div className="flex items-center gap-2">
          <Tabs value={period} onValueChange={v => setPeriod(v as SettlementPeriod)}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" />CSV</Button>
          <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="pos-card p-4">
          <p className="text-xs text-muted-foreground">Expected (Verified Payments)</p>
          <p className="text-xl font-bold text-foreground">{formatCurrency(expectedFromPayments.total)}</p>
          <p className="text-xs text-muted-foreground mt-1">{expectedFromPayments.count} payments</p>
        </div>
        <div className="pos-card p-4">
          <p className="text-xs text-muted-foreground">Settled Amount</p>
          <p className="text-xl font-bold text-green-500">{formatCurrency(summary.totalSettled)}</p>
          <p className="text-xs text-muted-foreground mt-1">{summary.settledCount} settlements</p>
        </div>
        <div className="pos-card p-4">
          <p className="text-xs text-muted-foreground">Fees & Tax Deducted</p>
          <p className="text-xl font-bold text-orange-500">{formatCurrency(summary.totalFees)}</p>
        </div>
        <div className="pos-card p-4">
          <p className="text-xs text-muted-foreground">Net Received</p>
          <p className="text-xl font-bold text-primary">{formatCurrency(summary.totalNet)}</p>
        </div>
      </div>

      {/* Gap Alert */}
      {gap > 0 && settlements.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-orange-500/30 bg-orange-500/5">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Settlement Gap: {formatCurrency(gap)}
            </p>
            <p className="text-xs text-muted-foreground">
              Difference between verified payments and settled amount. This may be due to pending settlements or processing fees.
            </p>
          </div>
        </div>
      )}

      {/* Settlements Table */}
      <div className="pos-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Settlement ID</TableHead>
              <TableHead>UTR</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Fees</TableHead>
              <TableHead>Net</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {settlements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  No settlement records yet. Settlements are recorded when payouts are received from your payment gateway.
                </TableCell>
              </TableRow>
            ) : (
              settlements.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="text-xs">{s.settlement_date || format(new Date(s.created_at), 'dd MMM')}</TableCell>
                  <TableCell className="font-mono text-xs">{s.settlement_id || '-'}</TableCell>
                  <TableCell className="font-mono text-xs">{s.utr || '-'}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(s.amount)}</TableCell>
                  <TableCell className="text-xs text-orange-500">{formatCurrency(s.fee + s.tax)}</TableCell>
                  <TableCell className="font-medium text-green-600">{formatCurrency(s.net_amount)}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === 'settled' ? 'default' : 'outline'} className="text-xs">
                      {s.status === 'settled' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                      {s.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
