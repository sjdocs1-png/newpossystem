import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw, Loader2, AlertTriangle, CheckCircle2, XCircle,
  Download, Shield
} from 'lucide-react';
import { format, startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

type ReconciliationPeriod = 'today' | 'week' | 'month';
type MatchStatus = 'matched' | 'mismatch' | 'missing_provider' | 'missing_local';

interface ReconciliationRecord {
  id: string;
  internal_order_id: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  amount: number;
  status: string;
  payment_mode: string | null;
  business_date: string;
  webhook_verified: boolean;
  created_at: string;
  match_status: MatchStatus;
}

interface ReconciliationSummary {
  total: number;
  matched: number;
  mismatched: number;
  unverified: number;
  totalAmount: number;
  verifiedAmount: number;
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

export const PaymentReconciliation: React.FC = () => {
  const { formatCurrency } = useLocale();
  const [period, setPeriod] = useState<ReconciliationPeriod>('today');
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<ReconciliationRecord[]>([]);
  const [summary, setSummary] = useState<ReconciliationSummary>({
    total: 0, matched: 0, mismatched: 0, unverified: 0,
    totalAmount: 0, verifiedAmount: 0,
  });

  const fetchReconciliation = useCallback(async () => {
    setLoading(true);
    try {
      const storeId = getStoreId();
      if (!storeId) { setLoading(false); return; }

      const now = new Date();
      let startDate: Date;
      if (period === 'today') startDate = startOfDay(now);
      else if (period === 'week') startDate = startOfWeek(now, { weekStartsOn: 1 });
      else startDate = startOfMonth(now);

      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('store_id', storeId)
        .gte('business_date', format(startDate, 'yyyy-MM-dd'))
        .order('created_at', { ascending: false });

      const payments = data || [];

      const reconciled: ReconciliationRecord[] = payments.map(p => {
        let match_status: MatchStatus = 'matched';
        if (p.status === 'paid' && !p.webhook_verified) {
          match_status = 'mismatch'; // Paid but not verified by webhook
        } else if (p.status === 'pending' || p.status === 'created') {
          match_status = 'missing_provider'; // No confirmation from provider
        } else if (p.status === 'failed') {
          match_status = 'missing_local';
        }
        return {
          id: p.id,
          internal_order_id: p.internal_order_id,
          provider_order_id: p.provider_order_id,
          provider_payment_id: p.provider_payment_id,
          amount: Number(p.amount),
          status: p.status,
          payment_mode: p.payment_mode,
          business_date: p.business_date,
          webhook_verified: p.webhook_verified,
          created_at: p.created_at,
          match_status,
        };
      });

      setRecords(reconciled);

      const paid = reconciled.filter(r => r.status === 'paid');
      const verified = paid.filter(r => r.webhook_verified);
      setSummary({
        total: reconciled.length,
        matched: reconciled.filter(r => r.match_status === 'matched').length,
        mismatched: reconciled.filter(r => r.match_status === 'mismatch').length,
        unverified: paid.length - verified.length,
        totalAmount: paid.reduce((s, r) => s + r.amount, 0),
        verifiedAmount: verified.reduce((s, r) => s + r.amount, 0),
      });
    } catch (err) {
      console.error('Reconciliation fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchReconciliation(); }, [fetchReconciliation]);

  const exportCSV = () => {
    const headers = ['Date', 'Order ID', 'Provider Order', 'Provider Payment', 'Amount', 'Status', 'Mode', 'Webhook Verified', 'Match Status'];
    const rows = records.map(r => [
      r.business_date, r.internal_order_id, r.provider_order_id || '', r.provider_payment_id || '',
      r.amount.toString(), r.status, r.payment_mode || '', r.webhook_verified ? 'Yes' : 'No', r.match_status
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reconciliation_${period}_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case 'matched': return <Badge variant="default" className="bg-green-500/20 text-green-600 border-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Matched</Badge>;
      case 'mismatch': return <Badge variant="destructive" className="bg-orange-500/20 text-orange-600 border-orange-500/30"><AlertTriangle className="w-3 h-3 mr-1" />Unverified</Badge>;
      case 'missing_provider': return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'missing_local': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Payment Reconciliation
        </h2>
        <div className="flex items-center gap-2">
          <Tabs value={period} onValueChange={v => setPeriod(v as ReconciliationPeriod)}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" />CSV</Button>
          <Button variant="outline" size="sm" onClick={fetchReconciliation}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="pos-card p-4">
          <p className="text-xs text-muted-foreground">Total Transactions</p>
          <p className="text-xl font-bold text-foreground">{summary.total}</p>
        </div>
        <div className="pos-card p-4">
          <p className="text-xs text-muted-foreground">Matched / Verified</p>
          <p className="text-xl font-bold text-green-500">{summary.matched}</p>
          <p className="text-xs text-muted-foreground mt-1">{formatCurrency(summary.verifiedAmount)}</p>
        </div>
        <div className="pos-card p-4">
          <p className="text-xs text-muted-foreground">Unverified (Webhook)</p>
          <p className="text-xl font-bold text-orange-500">{summary.unverified}</p>
          <p className="text-xs text-muted-foreground mt-1">Need manual check</p>
        </div>
        <div className="pos-card p-4">
          <p className="text-xs text-muted-foreground">Total Collected</p>
          <p className="text-xl font-bold text-foreground">{formatCurrency(summary.totalAmount)}</p>
        </div>
      </div>

      {/* Mismatch Alert */}
      {summary.unverified > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-orange-500/30 bg-orange-500/5">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {summary.unverified} payment(s) not confirmed by webhook
            </p>
            <p className="text-xs text-muted-foreground">
              These payments show as "paid" locally but haven't been verified by the payment gateway webhook. Check your payment gateway dashboard for confirmation.
            </p>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="pos-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reconciliation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  No payment records for this period
                </TableCell>
              </TableRow>
            ) : (
              records.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{r.business_date}</TableCell>
                  <TableCell className="font-mono text-xs">{r.internal_order_id.slice(0, 12)}...</TableCell>
                  <TableCell className="font-medium">{formatCurrency(r.amount)}</TableCell>
                  <TableCell className="capitalize text-xs">{r.payment_mode || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === 'paid' ? 'default' : r.status === 'refunded' ? 'secondary' : 'outline'} className="text-xs">
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(r.match_status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
