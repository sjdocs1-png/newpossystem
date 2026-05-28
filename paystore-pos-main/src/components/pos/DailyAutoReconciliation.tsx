import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  RefreshCw, Loader2, AlertTriangle, CheckCircle2, XCircle,
  Download, Shield, Clock, TrendingUp, BarChart3
} from 'lucide-react';
import { format, startOfDay, subDays, eachDayOfInterval } from 'date-fns';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { toast } from 'sonner';

interface DailyRecon {
  date: string;
  totalOrders: number;
  totalPayments: number;
  orderAmount: number;
  paymentAmount: number;
  verified: number;
  unverified: number;
  failed: number;
  refunded: number;
  refundedAmount: number;
  mismatch: boolean;
  gap: number;
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

export const DailyAutoReconciliation: React.FC = () => {
  const { formatCurrency } = useLocale();
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [reconData, setReconData] = useState<DailyRecon[]>([]);
  const [autoRecon, setAutoRecon] = useState(() => {
    return localStorage.getItem('auto_reconciliation') === 'true';
  });

  const fetchRecon = useCallback(async () => {
    setLoading(true);
    try {
      const storeId = getStoreId();
      if (!storeId) { setLoading(false); return; }

      const startDate = subDays(new Date(), days);
      const dateRange = eachDayOfInterval({ start: startDate, end: new Date() });

      // Fetch orders for period
      const { data: orders } = await supabase
        .from('orders')
        .select('id, total, payment_method, created_at, status')
        .eq('store_id', storeId)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);

      // Fetch payments for period
      const { data: payments } = await supabase
        .from('payments')
        .select('id, amount, status, webhook_verified, business_date, created_at')
        .eq('store_id', storeId)
        .gte('business_date', format(startDate, 'yyyy-MM-dd'))
        .order('created_at', { ascending: false })
        .limit(1000);

      const dailyData: DailyRecon[] = dateRange.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayOrders = (orders || []).filter(o => format(new Date(o.created_at), 'yyyy-MM-dd') === dateStr);
        const dayPayments = (payments || []).filter(p => p.business_date === dateStr);
        
        const paidPayments = dayPayments.filter(p => p.status === 'paid');
        const verified = paidPayments.filter(p => p.webhook_verified);
        const failed = dayPayments.filter(p => p.status === 'failed');
        const refunded = dayPayments.filter(p => p.status === 'refunded');

        // Online orders only (exclude cash/card from reconciliation)
        const onlineOrders = dayOrders.filter(o => !['cash', 'card'].includes(o.payment_method));
        const orderAmount = onlineOrders.reduce((s, o) => s + Number(o.total), 0);
        const paymentAmount = paidPayments.reduce((s, p) => s + Number(p.amount), 0);
        const refundedAmount = refunded.reduce((s, p) => s + Number(p.amount), 0);
        const gap = orderAmount - paymentAmount;

        return {
          date: dateStr,
          totalOrders: dayOrders.length,
          totalPayments: dayPayments.length,
          orderAmount,
          paymentAmount,
          verified: verified.length,
          unverified: paidPayments.length - verified.length,
          failed: failed.length,
          refunded: refunded.length,
          refundedAmount,
          mismatch: Math.abs(gap) > 1 || (paidPayments.length - verified.length) > 0,
          gap,
        };
      }).reverse(); // Most recent first

      setReconData(dailyData);
    } catch (err) {
      console.error('Reconciliation error:', err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchRecon(); }, [fetchRecon]);

  const handleAutoReconToggle = (value: boolean) => {
    setAutoRecon(value);
    localStorage.setItem('auto_reconciliation', value.toString());
    toast.success(value ? 'Auto-reconciliation enabled' : 'Auto-reconciliation disabled');
  };

  const exportCSV = () => {
    const headers = ['Date', 'Orders', 'Payments', 'Order Amount', 'Payment Amount', 'Gap', 'Verified', 'Unverified', 'Failed', 'Refunded', 'Refund Amount', 'Status'];
    const rows = reconData.map(d => [
      d.date, d.totalOrders, d.totalPayments, d.orderAmount.toFixed(2), d.paymentAmount.toFixed(2),
      d.gap.toFixed(2), d.verified, d.unverified, d.failed, d.refunded, d.refundedAmount.toFixed(2),
      d.mismatch ? 'MISMATCH' : 'OK'
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily_reconciliation_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalMismatches = reconData.filter(d => d.mismatch).length;
  const totalGap = reconData.reduce((s, d) => s + d.gap, 0);
  const totalVerified = reconData.reduce((s, d) => s + d.verified, 0);
  const totalUnverified = reconData.reduce((s, d) => s + d.unverified, 0);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Daily Auto-Reconciliation
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Auto-recon</span>
            <Switch checked={autoRecon} onCheckedChange={handleAutoReconToggle} />
          </div>
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" />CSV</Button>
          <Button variant="outline" size="sm" onClick={fetchRecon}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="pos-card p-3">
          <p className="text-xs text-muted-foreground">Days Analyzed</p>
          <p className="text-xl font-bold text-foreground">{reconData.length}</p>
        </div>
        <div className="pos-card p-3">
          <p className="text-xs text-muted-foreground">Mismatched Days</p>
          <p className={`text-xl font-bold ${totalMismatches > 0 ? 'text-destructive' : 'text-green-500'}`}>{totalMismatches}</p>
        </div>
        <div className="pos-card p-3">
          <p className="text-xs text-muted-foreground">Verified / Unverified</p>
          <p className="text-xl font-bold text-foreground">{totalVerified} / <span className="text-orange-500">{totalUnverified}</span></p>
        </div>
        <div className="pos-card p-3">
          <p className="text-xs text-muted-foreground">Total Gap</p>
          <p className={`text-xl font-bold ${Math.abs(totalGap) > 1 ? 'text-destructive' : 'text-green-500'}`}>
            {formatCurrency(Math.abs(totalGap))}
          </p>
        </div>
      </div>

      {/* Mismatch Alert */}
      {totalMismatches > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {totalMismatches} day(s) have reconciliation mismatches
            </p>
            <p className="text-xs text-muted-foreground">
              This could indicate unverified webhooks, payment failures, or timing discrepancies. Review the affected days below.
            </p>
          </div>
        </div>
      )}

      {/* Daily Table */}
      <div className="pos-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-center">Orders</TableHead>
              <TableHead className="text-center">Payments</TableHead>
              <TableHead className="text-right">Order Amt</TableHead>
              <TableHead className="text-right">Paid Amt</TableHead>
              <TableHead className="text-right">Gap</TableHead>
              <TableHead className="text-center">Verified</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reconData.map(d => (
              <TableRow key={d.date} className={d.mismatch ? 'bg-destructive/5' : ''}>
                <TableCell className="text-xs font-medium">{format(new Date(d.date), 'dd MMM')}</TableCell>
                <TableCell className="text-center text-xs">{d.totalOrders}</TableCell>
                <TableCell className="text-center text-xs">{d.totalPayments}</TableCell>
                <TableCell className="text-right text-xs">{formatCurrency(d.orderAmount)}</TableCell>
                <TableCell className="text-right text-xs">{formatCurrency(d.paymentAmount)}</TableCell>
                <TableCell className={`text-right text-xs font-medium ${Math.abs(d.gap) > 1 ? 'text-destructive' : 'text-green-500'}`}>
                  {d.gap > 0 ? '+' : ''}{formatCurrency(d.gap)}
                </TableCell>
                <TableCell className="text-center text-xs">
                  <span className="text-green-500">{d.verified}</span>
                  {d.unverified > 0 && <span className="text-orange-500"> / {d.unverified}⚠</span>}
                </TableCell>
                <TableCell className="text-center">
                  {d.mismatch ? (
                    <Badge variant="destructive" className="text-[10px]">
                      <AlertTriangle className="w-3 h-3 mr-1" />Mismatch
                    </Badge>
                  ) : (
                    <Badge variant="default" className="text-[10px] bg-green-500/20 text-green-600 border-green-500/30">
                      <CheckCircle2 className="w-3 h-3 mr-1" />OK
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Info */}
      <div className="pos-card p-4">
        <p className="text-sm font-medium text-foreground">How Auto-Reconciliation Works</p>
        <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
          <li>Compares daily online orders against payment gateway records</li>
          <li>Identifies unverified webhooks — payments marked as paid without gateway confirmation</li>
          <li>Calculates gap between order amounts and collected payments</li>
          <li>Cash & card payments are excluded from gateway reconciliation</li>
          <li>Enable auto-recon to get daily mismatch alerts</li>
        </ul>
      </div>
    </div>
  );
};