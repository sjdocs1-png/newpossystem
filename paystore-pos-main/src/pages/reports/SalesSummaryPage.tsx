import React, { useState } from 'react';
import { useAnalytics, TimeRange } from '@/hooks/useAnalytics';
import { formatCurrency } from '@/lib/store';
import { Download, ArrowLeft, TrendingUp, Printer, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { printReport, formatReportCurrency } from '@/lib/reportPrintUtils';
import { exportToCSV, exportToPrintableHTML, type ExportColumn } from '@/lib/reportExportUtils';

const SalesSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const { summary, paymentSummary, orderTypeSummary, discountSummary, filteredOrders } = useAnalytics(timeRange);

  const exportColumns: ExportColumn[] = [
    { key: 'billNumber', header: 'Bill No' },
    { key: 'date', header: 'Date' },
    { key: 'orderType', header: 'Order Type' },
    { key: 'paymentMethod', header: 'Payment' },
    { key: 'subtotal', header: 'Subtotal', format: (v) => formatReportCurrency(v) },
    { key: 'discount', header: 'Discount', format: (v) => formatReportCurrency(v) },
    { key: 'tax', header: 'Tax', format: (v) => formatReportCurrency(v) },
    { key: 'total', header: 'Total', format: (v) => formatReportCurrency(v) },
  ];

  const exportData = filteredOrders.map(o => ({
    billNumber: o.billNumber || o.id.slice(-6).toUpperCase(),
    date: new Date(o.createdAt).toLocaleString(),
    orderType: o.orderType,
    paymentMethod: o.paymentMethod || 'cash',
    subtotal: o.subtotal || 0,
    discount: o.discount || 0,
    tax: o.tax || 0,
    total: o.total,
  }));

  const handleExportCSV = () => {
    exportToCSV(exportData, exportColumns, `sales-summary-${timeRange}`);
  };

  const handleExportPDF = () => {
    const dateRangeLabel = timeRange === 'today' ? 'Today' : timeRange === 'week' ? 'This Week' : 'This Month';
    exportToPrintableHTML(exportData, exportColumns, 'Sales Summary Report', {
      dateRange: dateRangeLabel,
    });
  };

  const handlePrint = () => {
    const dateRangeLabel = timeRange === 'today' ? 'Today' : timeRange === 'week' ? 'This Week' : 'This Month';
    
    printReport(
      {
        title: 'Sales Summary Report',
        subtitle: `${dateRangeLabel} Overview`,
        dateRange: dateRangeLabel,
      },
      [
        {
          title: 'Summary',
          type: 'stats',
          data: [
            { label: 'Total Sales', value: formatReportCurrency(summary.totalSales) },
            { label: 'Total Orders', value: summary.totalOrders },
            { label: 'Avg Order Value', value: formatReportCurrency(summary.avgOrderValue) },
            { label: 'Total Discount', value: formatReportCurrency(discountSummary.totalDiscount) },
          ],
        },
        {
          title: 'Payment Methods',
          type: 'list',
          data: paymentSummary.map(p => ({
            label: p.method,
            value: formatReportCurrency(p.amount),
            subtext: `${p.count} orders (${p.percentage.toFixed(1)}%)`,
          })),
        },
        {
          title: 'Order Types',
          type: 'list',
          data: orderTypeSummary.map(t => ({
            label: t.type,
            value: formatReportCurrency(t.amount),
            subtext: `${t.count} orders (${t.percentage.toFixed(1)}%)`,
          })),
        },
        {
          title: 'Recent Orders',
          type: 'table',
          data: {
            headers: ['Bill #', 'Time', 'Type', 'Payment', 'Amount'],
            rows: filteredOrders.slice(0, 20).map(o => [
              o.billNumber || o.id.slice(-6).toUpperCase(),
              new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              o.orderType,
              o.paymentMethod || 'Cash',
              formatReportCurrency(o.total),
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
            <div className="p-2 bg-warning/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-warning" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Sales Summary</h1>
              <p className="text-sm text-muted-foreground">Complete sales overview</p>
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
          <Button variant="outline" onClick={handleExportPDF} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            PDF
          </Button>
          <Button onClick={handleExportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="pos-card p-5">
          <p className="text-sm text-muted-foreground">Total Sales</p>
          <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(summary.totalSales)}</p>
        </div>
        <div className="pos-card p-5">
          <p className="text-sm text-muted-foreground">Total Orders</p>
          <p className="text-2xl font-bold text-foreground mt-1">{summary.totalOrders}</p>
        </div>
        <div className="pos-card p-5">
          <p className="text-sm text-muted-foreground">Avg Order Value</p>
          <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(summary.avgOrderValue)}</p>
        </div>
        <div className="pos-card p-5">
          <p className="text-sm text-muted-foreground">Total Discount</p>
          <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(discountSummary.totalDiscount)}</p>
        </div>
      </div>

      {/* Payment & Order Type Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="pos-card p-5">
          <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
          <div className="space-y-4">
            {paymentSummary.map((payment) => (
              <div key={payment.method} className="flex items-center justify-between">
                <span className="text-foreground">{payment.method}</span>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${payment.percentage}%` }}
                    />
                  </div>
                  <span className="font-semibold text-foreground w-24 text-right">{formatCurrency(payment.amount)}</span>
                  <span className="text-xs text-muted-foreground w-16 text-right">{payment.count} orders</span>
                </div>
              </div>
            ))}
            {paymentSummary.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No data</p>
            )}
          </div>
        </div>

        <div className="pos-card p-5">
          <h3 className="text-lg font-semibold mb-4">Order Types</h3>
          <div className="space-y-4">
            {orderTypeSummary.map((type) => (
              <div key={type.type} className="flex items-center justify-between">
                <span className="text-foreground">{type.type}</span>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-success rounded-full"
                      style={{ width: `${type.percentage}%` }}
                    />
                  </div>
                  <span className="font-semibold text-foreground w-24 text-right">{formatCurrency(type.amount)}</span>
                  <span className="text-xs text-muted-foreground w-16 text-right">{type.count} orders</span>
                </div>
              </div>
            ))}
            {orderTypeSummary.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesSummaryPage;