import React, { useState } from 'react';
import { useAnalytics, TimeRange } from '@/hooks/useAnalytics';
import { formatCurrency } from '@/lib/store';
import { Download, ArrowLeft, Package, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { printReport, formatReportCurrency } from '@/lib/reportPrintUtils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const ItemSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const { itemSummary, summary } = useAnalytics(timeRange);

  const handleExport = () => {
    const headers = ['Item', 'Category', 'Quantity', 'Amount', 'Avg Price'];
    const rows = itemSummary.map(i => [i.name, i.category, i.qty, i.amount, i.avgPrice]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'item-summary.csv';
    a.click();
  };

  const handlePrint = () => {
    const dateRangeLabel = timeRange === 'today' ? 'Today' : timeRange === 'week' ? 'This Week' : 'This Month';
    
    printReport(
      {
        title: 'Item Summary Report',
        subtitle: `${dateRangeLabel} Breakdown`,
        dateRange: dateRangeLabel,
      },
      [
        {
          title: 'Summary',
          type: 'stats',
          data: [
            { label: 'Unique Items', value: itemSummary.length },
            { label: 'Total Quantity', value: itemSummary.reduce((s, i) => s + i.qty, 0) },
            { label: 'Total Revenue', value: formatReportCurrency(summary.totalSales) },
            { label: 'Avg Item Price', value: formatReportCurrency(summary.totalSales / itemSummary.reduce((s, i) => s + i.qty, 0) || 0) },
          ],
        },
        {
          title: 'Item Details',
          type: 'table',
          data: {
            headers: ['#', 'Item', 'Category', 'Qty', 'Amount', 'Avg Price'],
            rows: itemSummary.map((item, idx) => [
              idx + 1,
              item.name,
              item.category,
              item.qty,
              formatReportCurrency(item.amount),
              formatReportCurrency(item.avgPrice),
            ]),
          },
        },
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
            <div className="p-2 bg-success/10 rounded-lg">
              <Package className="h-6 w-6 text-success" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Item Summary</h1>
              <p className="text-sm text-muted-foreground">Sales breakdown by item</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="pos-card p-4">
          <p className="text-sm text-muted-foreground">Unique Items</p>
          <p className="text-2xl font-bold text-foreground">{itemSummary.length}</p>
        </div>
        <div className="pos-card p-4">
          <p className="text-sm text-muted-foreground">Total Quantity</p>
          <p className="text-2xl font-bold text-foreground">{itemSummary.reduce((s, i) => s + i.qty, 0)}</p>
        </div>
        <div className="pos-card p-4">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.totalSales)}</p>
        </div>
      </div>

      <div className="pos-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Avg Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itemSummary.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              <>
                {itemSummary.map((item, idx) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">{item.qty}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.avgPrice)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-right">{itemSummary.reduce((s, i) => s + i.qty, 0)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(summary.totalSales)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ItemSummaryPage;