import React, { useState } from 'react';
import { Download, ArrowLeft, FolderTree, Printer } from 'lucide-react';
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

const GroupSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, formatCurrency } = useLocale();
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const { categorySummary, summary } = useAnalytics(timeRange);

  const grandTotal = categorySummary.reduce((sum, g) => sum + g.totalAmount, 0);

  const handleExport = () => {
    const headers = [t('reports.group'), t('common.items'), t('reports.totalSales'), '%'];
    const rows = categorySummary.map(g => [g.name, g.itemCount, g.totalAmount, `${g.percentage}%`]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'group-summary.csv';
    a.click();
  };

  const handlePrint = () => {
    const dateRangeLabel = timeRange === 'today' ? t('common.today') : timeRange === 'week' ? t('common.thisWeek') : t('common.thisMonth');
    const totalItems = categorySummary.reduce((s, g) => s + g.itemCount, 0);
    printReport(
      { title: t('reports.groupSummary'), subtitle: dateRangeLabel, dateRange: dateRangeLabel, generatedAt: new Date() },
      [
        { type: 'stats', data: [
          { label: t('reports.totalSales'), value: formatReportCurrency(grandTotal) },
          { label: t('common.total') + ' ' + t('common.items'), value: totalItems },
          { label: t('reports.group'), value: categorySummary.length },
        ]},
        { title: t('common.details'), type: 'table', data: {
          headers: [t('reports.group'), t('common.items'), t('reports.totalSales'), '%'],
          rows: categorySummary.map(g => [g.name, g.itemCount, formatReportCurrency(g.totalAmount), `${g.percentage}%`])
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
            <div className="p-2 bg-success/10 rounded-lg">
              <FolderTree className="h-6 w-6 text-success" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('reports.groupSummary')}</h1>
              <p className="text-sm text-muted-foreground">{t('reports.salesByGroup')}</p>
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
              <TableHead>{t('reports.group')}</TableHead>
              <TableHead className="text-right">{t('common.items')}</TableHead>
              <TableHead className="text-right">{t('reports.totalSales')}</TableHead>
              <TableHead className="text-right">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categorySummary.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  {t('reports.noSalesData') || 'No data available'}
                </TableCell>
              </TableRow>
            ) : (
              <>
                {categorySummary.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell className="text-right">{group.itemCount}</TableCell>
                    <TableCell className="text-right">{formatCurrency(group.totalAmount)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${group.percentage}%` }}
                          />
                        </div>
                        <span className="w-10">{group.percentage}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell>{t('common.total')}</TableCell>
                  <TableCell className="text-right">{categorySummary.reduce((s, g) => s + g.itemCount, 0)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(grandTotal)}</TableCell>
                  <TableCell className="text-right">100%</TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default GroupSummaryPage;
