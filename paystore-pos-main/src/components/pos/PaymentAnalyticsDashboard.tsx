import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocale } from '@/contexts/LocaleContext';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, TrendingDown,
  RefreshCw, Loader2, BarChart3, PieChart, Activity, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subDays, subWeeks, startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell
} from 'recharts';

type AnalyticsPeriod = 'today' | 'week' | 'month';

interface DailyData {
  date: string;
  total: number;
  count: number;
}

interface ModeData {
  mode: string;
  total: number;
  count: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--info))', 'hsl(var(--destructive))'];
const MODE_COLORS: Record<string, string> = {
  upi: '#7C3AED',
  card: '#2563EB',
  netbanking: '#059669',
  wallet: '#D97706',
  unknown: '#6B7280',
};

export const PaymentAnalyticsDashboard: React.FC = () => {
  const { formatCurrency } = useLocale();
  const [period, setPeriod] = useState<AnalyticsPeriod>('week');
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [modeData, setModeData] = useState<ModeData[]>([]);
  const [summary, setSummary] = useState({
    totalCollected: 0,
    totalCount: 0,
    avgTransaction: 0,
    successRate: 0,
    refundedAmount: 0,
    refundedCount: 0,
    growthPercent: 0,
  });

  const getStoreId = (): string => {
    try {
      const storeData = localStorage.getItem('pos_active_store_data');
      if (storeData) return JSON.parse(storeData)?.storeId || '';
    } catch {}
    return '';
  };

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const storeId = getStoreId();
      if (!storeId) { setLoading(false); return; }

      const now = new Date();
      let startDate: Date;
      let prevStartDate: Date;

      if (period === 'today') {
        startDate = startOfDay(now);
        prevStartDate = subDays(startDate, 1);
      } else if (period === 'week') {
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        prevStartDate = subWeeks(startDate, 1);
      } else {
        startDate = startOfMonth(now);
        prevStartDate = new Date(startDate);
        prevStartDate.setMonth(prevStartDate.getMonth() - 1);
      }

      // Current period
      const { data: current } = await supabase
        .from('payments')
        .select('amount, status, payment_mode, business_date, created_at')
        .eq('store_id', storeId)
        .gte('business_date', format(startDate, 'yyyy-MM-dd'))
        .order('created_at', { ascending: true });

      // Previous period for growth calc
      const { data: previous } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('store_id', storeId)
        .gte('business_date', format(prevStartDate, 'yyyy-MM-dd'))
        .lt('business_date', format(startDate, 'yyyy-MM-dd'));

      const payments = current || [];
      const prevPayments = previous || [];

      // Summary
      const paid = payments.filter(p => p.status === 'paid');
      const refunded = payments.filter(p => p.status === 'refunded');
      const totalCollected = paid.reduce((s, p) => s + Number(p.amount), 0);
      const prevCollected = prevPayments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
      const growthPercent = prevCollected > 0 ? ((totalCollected - prevCollected) / prevCollected) * 100 : 0;

      setSummary({
        totalCollected,
        totalCount: paid.length,
        avgTransaction: paid.length > 0 ? totalCollected / paid.length : 0,
        successRate: payments.length > 0 ? (paid.length / payments.length) * 100 : 0,
        refundedAmount: refunded.reduce((s, p) => s + Number(p.amount), 0),
        refundedCount: refunded.length,
        growthPercent,
      });

      // Daily breakdown
      const dailyMap: Record<string, { total: number; count: number }> = {};
      paid.forEach(p => {
        const d = p.business_date;
        if (!dailyMap[d]) dailyMap[d] = { total: 0, count: 0 };
        dailyMap[d].total += Number(p.amount);
        dailyMap[d].count++;
      });
      setDailyData(
        Object.entries(dailyMap).map(([date, v]) => ({
          date: format(new Date(date), 'dd MMM'),
          total: v.total,
          count: v.count,
        }))
      );

      // Mode breakdown
      const modeMap: Record<string, { total: number; count: number }> = {};
      paid.forEach(p => {
        const mode = p.payment_mode || 'unknown';
        if (!modeMap[mode]) modeMap[mode] = { total: 0, count: 0 };
        modeMap[mode].total += Number(p.amount);
        modeMap[mode].count++;
      });
      setModeData(
        Object.entries(modeMap)
          .map(([mode, v]) => ({ mode, total: v.total, count: v.count }))
          .sort((a, b) => b.total - a.total)
      );
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Payment Analytics
        </h2>
        <div className="flex items-center gap-2">
          <Tabs value={period} onValueChange={v => setPeriod(v as AnalyticsPeriod)}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="pos-card p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Collected</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(summary.totalCollected)}</p>
              <div className={cn('flex items-center gap-1 text-xs mt-1', summary.growthPercent >= 0 ? 'text-green-500' : 'text-destructive')}>
                {summary.growthPercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(summary.growthPercent).toFixed(1)}% vs prev
              </div>
            </div>
            <div className="p-2 rounded-xl bg-primary/10">
              <Zap className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
        <div className="pos-card p-4">
          <p className="text-xs text-muted-foreground">Transactions</p>
          <p className="text-xl font-bold text-foreground">{summary.totalCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Avg: {formatCurrency(summary.avgTransaction)}</p>
        </div>
        <div className="pos-card p-4">
          <p className="text-xs text-muted-foreground">Success Rate</p>
          <p className="text-xl font-bold text-green-500">{summary.successRate.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground mt-1">{summary.totalCount} of {summary.totalCount + summary.refundedCount} total</p>
        </div>
        <div className="pos-card p-4">
          <p className="text-xs text-muted-foreground">Refunds</p>
          <p className="text-xl font-bold text-destructive">{formatCurrency(summary.refundedAmount)}</p>
          <p className="text-xs text-muted-foreground mt-1">{summary.refundedCount} refunds</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend */}
        <div className="pos-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Collection Trend
          </h3>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [formatCurrency(value), 'Amount']}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12">No data for this period</p>
          )}
        </div>

        {/* Mode Breakdown Pie */}
        <div className="pos-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary" />
            Payment Mode Split
          </h3>
          {modeData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={250}>
                <RechartsPie>
                  <Pie
                    data={modeData}
                    dataKey="total"
                    nameKey="mode"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {modeData.map((entry, idx) => (
                      <Cell key={entry.mode} fill={MODE_COLORS[entry.mode] || COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [formatCurrency(value), 'Amount']}
                  />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {modeData.map((m, idx) => (
                  <div key={m.mode} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: MODE_COLORS[m.mode] || COLORS[idx % COLORS.length] }} />
                    <span className="text-xs text-foreground capitalize flex-1">{m.mode}</span>
                    <span className="text-xs font-medium text-foreground">{formatCurrency(m.total)}</span>
                    <span className="text-[10px] text-muted-foreground">({m.count})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">No payment data</p>
          )}
        </div>
      </div>
    </div>
  );
};
