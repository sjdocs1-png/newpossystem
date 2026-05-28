import React, { useState, useEffect } from 'react';
import { Download, ArrowLeft, Users, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/contexts/LocaleContext';
import { useAnalytics, TimeRange } from '@/hooks/useAnalytics';
import { printReport, formatReportCurrency } from '@/lib/reportPrintUtils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface StaffMember {
  user_id: string;
  role: string;
  full_name: string | null;
  email: string;
}

const EmployeeSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, formatCurrency } = useLocale();
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const { filteredOrders } = useAnalytics(timeRange);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);

  useEffect(() => {
    const fetchStaff = async () => {
      const storeId = localStorage.getItem('pos_store_id');
      if (!storeId) return;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('store_id', storeId)
        .eq('is_active', true);

      if (roles && roles.length > 0) {
        const userIds = roles.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        const merged = roles.map(r => {
          const profile = profiles?.find(p => p.id === r.user_id);
          return {
            user_id: r.user_id,
            role: r.role,
            full_name: profile?.full_name || null,
            email: profile?.email || '',
          };
        });
        setStaffMembers(merged);
      }
    };
    fetchStaff();
  }, []);

  // Aggregate order data per staff - orders don't track staff, so show all staff with total store performance
  const totalSales = filteredOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders = filteredOrders.length;
  const totalTips = filteredOrders.reduce((s, o) => s + ((o as any).tip || 0), 0);

  const employees = staffMembers.map(s => ({
    id: s.user_id,
    name: s.full_name || s.email,
    role: s.role.charAt(0).toUpperCase() + s.role.slice(1).replace('_', ' '),
    ordersHandled: totalOrders, // Can't attribute per-staff without tracking
    salesAmount: totalSales,
    tips: totalTips,
  }));

  const handleExport = () => {
    const headers = [t('staff.staffName'), t('staff.role')];
    const rows = employees.map(e => [e.name, e.role]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee-summary.csv';
    a.click();
  };

  const handlePrint = () => {
    const dateRangeLabel = timeRange === 'today' ? t('common.today') : timeRange === 'week' ? t('common.thisWeek') : t('common.thisMonth');
    printReport(
      { title: t('reports.employeeSummary'), subtitle: dateRangeLabel, dateRange: dateRangeLabel, generatedAt: new Date() },
      [
        { type: 'stats', data: [
          { label: t('reports.totalSales'), value: formatReportCurrency(totalSales) },
          { label: t('reports.totalOrders'), value: totalOrders },
          { label: t('reports.tips'), value: formatReportCurrency(totalTips) },
          { label: 'Staff Count', value: employees.length },
        ]},
        { title: t('common.details'), type: 'table', data: {
          headers: [t('staff.staffName'), t('staff.role')],
          rows: employees.map(e => [e.name, e.role])
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
              <Users className="h-6 w-6 text-cat-drinks" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('reports.employeeSummary')}</h1>
              <p className="text-sm text-muted-foreground">{t('reports.staffPerformance')}</p>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="pos-card p-4">
          <p className="text-sm text-muted-foreground">Staff Count</p>
          <p className="text-2xl font-bold text-foreground">{employees.length}</p>
        </div>
        <div className="pos-card p-4">
          <p className="text-sm text-muted-foreground">{t('reports.totalOrders')}</p>
          <p className="text-2xl font-bold text-foreground">{totalOrders}</p>
        </div>
        <div className="pos-card p-4">
          <p className="text-sm text-muted-foreground">{t('reports.totalSales')}</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(totalSales)}</p>
        </div>
        <div className="pos-card p-4">
          <p className="text-sm text-muted-foreground">{t('reports.tips')}</p>
          <p className="text-2xl font-bold text-success">{formatCurrency(totalTips)}</p>
        </div>
      </div>

      <div className="pos-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('staff.staffName')}</TableHead>
              <TableHead>{t('staff.role')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                  No staff data available
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.role}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default EmployeeSummaryPage;
