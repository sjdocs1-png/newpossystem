import React, { useState } from 'react';
import { Download, ArrowLeft, Monitor, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/contexts/LocaleContext';
import { useAnalytics, TimeRange } from '@/hooks/useAnalytics';
import { printReport, formatReportCurrency } from '@/lib/reportPrintUtils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const CounterSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, formatCurrency } = useLocale();
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const { counterSummary, filteredOrders } = useAnalytics(timeRange);

  const grandTotal = counterSummary.reduce((sum, c) => sum + c.amount, 0);

  // Payment breakdown per counter
  const getPaymentBreakdown = (counterOrders: typeof filteredOrders) => ({
    cash: counterOrders.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0),
    card: counterOrders.filter(o => o.paymentMethod === 'card').reduce((s, o) => s + o.total, 0),
    upi: counterOrders.filter(o => o.paymentMethod === 'upi').reduce((s, o) => s + o.total, 0),
  });

  const totalPayments = getPaymentBreakdown(filteredOrders);

  const handleExport = () => {
    const headers = ['Counter', t('nav.orders'), t('reports.totalSales'), t('pos.cash'), t('pos.card'), 'UPI'];
    const rows = counterSummary.map(c => [c.counter, c.orders, c.amount, '-', '-', '-']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'counter-summary.csv';
    a.click();
  };

  const handlePrint = () => {
    const dateRangeLabel = timeRange === 'today' ? t('common.today') : timeRange === 'week' ? t('common.thisWeek') : t('common.thisMonth');
    printReport(
      { title: 'Counter Summary', subtitle: dateRangeLabel, dateRange: dateRangeLabel, generatedAt: new Date() },
      [
        { type: 'stats', data: [
          { label: t('reports.totalSales'), value: formatReportCurrency(grandTotal) },
          { label: t('reports.totalOrders'), value: counterSummary.reduce((s, c) => s + c.orders, 0) },
          { label: 'Active Counters', value: counterSummary.length },
        ]},
        { title: 'Counter Details', type: 'table', data: {
          headers: ['Counter', t('nav.orders'), t('reports.totalSales')],
          rows: counterSummary.map(c => [c.counter, c.orders, formatReportCurrency(c.amount)])
        }}
      ]
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/reports')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cat-drinks/10 rounded-lg">
              <Monitor className="h-6 w-6 text-cat-drinks" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Counter Summary</h1>
              <p className="text-sm text-muted-foreground">Sales by billing counter</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <TabsList>
              <TabsTrigger value="today">{t('common.today')}</TabsTrigger>
              <TabsTrigger value="week">{t('common.thisWeek')}</TabsTrigger>
              <TabsTrigger value="month">{t('common.thisMonth')}</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            {t('common.print')}
          </Button>
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            {t('common.export')} CSV
          </Button>
        </div>
      </div>

      <div className="pos-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Counter</TableHead>
              <TableHead className="text-right">{t('nav.orders')}</TableHead>
              <TableHead className="text-right">{t('reports.totalSales')}</TableHead>
              <TableHead className="text-right">{t('pos.cash')}</TableHead>
              <TableHead className="text-right">{t('pos.card')}</TableHead>
              <TableHead className="text-right">UPI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {counterSummary.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {t('reports.noSalesData') || 'No data available'}
                </TableCell>
              </TableRow>
            ) : (
              <>
                {counterSummary.map((counter) => (
                  <TableRow key={counter.counter}>
                    <TableCell className="font-medium">{counter.counter}</TableCell>
                    <TableCell className="text-right">{counter.orders}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(counter.amount)}</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">-</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell>{t('common.total')}</TableCell>
                  <TableCell className="text-right">{counterSummary.reduce((s, c) => s + c.orders, 0)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(grandTotal)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalPayments.cash)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalPayments.card)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalPayments.upi)}</TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CounterSummaryPage;
