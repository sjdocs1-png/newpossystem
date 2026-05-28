import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw, Loader2, AlertTriangle, Bell, CheckCircle2,
  XCircle, TrendingDown, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subHours, startOfDay } from 'date-fns';

interface PaymentAlert {
  id: string;
  type: 'failure' | 'low_success_rate' | 'high_refunds' | 'pending_stuck' | 'daily_summary';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  data?: Record<string, any>;
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

export const PaymentAlerts: React.FC = () => {
  const { formatCurrency } = useLocale();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<PaymentAlert[]>([]);

  const analyzePayments = useCallback(async () => {
    setLoading(true);
    try {
      const storeId = getStoreId();
      if (!storeId) { setLoading(false); return; }

      const today = startOfDay(new Date());
      const last24h = subHours(new Date(), 24);

      // Fetch last 24h payments
      const { data } = await supabase
        .from('payments')
        .select('id, amount, status, payment_mode, business_date, created_at, webhook_verified, error_message')
        .eq('store_id', storeId)
        .gte('created_at', last24h.toISOString())
        .order('created_at', { ascending: false });

      const payments = data || [];
      const newAlerts: PaymentAlert[] = [];

      // 1. Recent failures (last 2 hours)
      const last2h = subHours(new Date(), 2);
      const recentFailures = payments.filter(p => p.status === 'failed' && new Date(p.created_at) >= last2h);
      if (recentFailures.length >= 3) {
        newAlerts.push({
          id: 'high_failures',
          type: 'failure',
          severity: 'critical',
          title: `${recentFailures.length} Payment Failures in Last 2 Hours`,
          message: `Multiple payments have failed recently. Common errors: ${[...new Set(recentFailures.map(f => f.error_message).filter(Boolean))].slice(0, 2).join(', ') || 'Unknown'}. Check your payment integration.`,
          timestamp: new Date(),
        });
      } else if (recentFailures.length > 0) {
        recentFailures.forEach(f => {
          newAlerts.push({
            id: `fail_${f.id}`,
            type: 'failure',
            severity: 'warning',
            title: `Payment Failed: ${formatCurrency(Number(f.amount))}`,
            message: f.error_message || 'Payment could not be processed',
            timestamp: new Date(f.created_at),
          });
        });
      }

      // 2. Low success rate
      const todayPayments = payments.filter(p => new Date(p.created_at) >= today);
      if (todayPayments.length >= 5) {
        const successRate = (todayPayments.filter(p => p.status === 'paid').length / todayPayments.length) * 100;
        if (successRate < 70) {
          newAlerts.push({
            id: 'low_success',
            type: 'low_success_rate',
            severity: successRate < 50 ? 'critical' : 'warning',
            title: `Low Success Rate: ${successRate.toFixed(0)}%`,
            message: `Only ${successRate.toFixed(0)}% of today's ${todayPayments.length} payment attempts were successful. Industry average is 90%+.`,
            timestamp: new Date(),
          });
        }
      }

      // 3. Stuck pending payments (>30 min old)
      const stuckPending = payments.filter(p =>
        (p.status === 'pending' || p.status === 'created') &&
        (new Date().getTime() - new Date(p.created_at).getTime()) > 30 * 60 * 1000
      );
      if (stuckPending.length > 0) {
        newAlerts.push({
          id: 'stuck_pending',
          type: 'pending_stuck',
          severity: 'warning',
          title: `${stuckPending.length} Stuck Pending Payment(s)`,
          message: `These payments have been pending for over 30 minutes. They may need manual verification in your payment dashboard.`,
          timestamp: new Date(),
        });
      }

      // 4. High refunds today
      const todayRefunds = todayPayments.filter(p => p.status === 'refunded');
      if (todayRefunds.length >= 3) {
        const refundTotal = todayRefunds.reduce((s, p) => s + Number(p.amount), 0);
        newAlerts.push({
          id: 'high_refunds',
          type: 'high_refunds',
          severity: 'warning',
          title: `${todayRefunds.length} Refunds Today (${formatCurrency(refundTotal)})`,
          message: `Higher than normal refund activity detected. Review recent refund reasons.`,
          timestamp: new Date(),
        });
      }

      // 5. Daily summary
      const paidToday = todayPayments.filter(p => p.status === 'paid');
      if (paidToday.length > 0) {
        const total = paidToday.reduce((s, p) => s + Number(p.amount), 0);
        newAlerts.push({
          id: 'daily_summary',
          type: 'daily_summary',
          severity: 'info',
          title: `Today's Collection: ${formatCurrency(total)}`,
          message: `${paidToday.length} successful payment(s) today. Average: ${formatCurrency(total / paidToday.length)}.`,
          timestamp: new Date(),
        });
      }

      // Sort by severity (critical first)
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      newAlerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

      setAlerts(newAlerts);
    } catch (err) {
      console.error('Payment alerts error:', err);
    } finally {
      setLoading(false);
    }
  }, [formatCurrency]);

  useEffect(() => { analyzePayments(); }, [analyzePayments]);

  const getAlertIcon = (type: PaymentAlert['type']) => {
    switch (type) {
      case 'failure': return <XCircle className="w-5 h-5" />;
      case 'low_success_rate': return <TrendingDown className="w-5 h-5" />;
      case 'high_refunds': return <AlertTriangle className="w-5 h-5" />;
      case 'pending_stuck': return <Clock className="w-5 h-5" />;
      case 'daily_summary': return <CheckCircle2 className="w-5 h-5" />;
    }
  };

  const getSeverityStyles = (severity: PaymentAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'border-destructive/40 bg-destructive/5 text-destructive';
      case 'warning': return 'border-orange-500/40 bg-orange-500/5 text-orange-600';
      case 'info': return 'border-primary/30 bg-primary/5 text-primary';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" />
          Payment Alerts
          {alerts.filter(a => a.severity !== 'info').length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {alerts.filter(a => a.severity !== 'info').length}
            </Badge>
          )}
        </h2>
        <Button variant="outline" size="sm" onClick={analyzePayments}><RefreshCw className="w-4 h-4" /></Button>
      </div>

      {/* Alerts */}
      {alerts.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
          <p className="text-foreground font-medium">All Clear!</p>
          <p className="text-sm text-muted-foreground">No payment alerts at this time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={cn(
                'flex items-start gap-3 p-4 rounded-xl border transition-colors',
                getSeverityStyles(alert.severity)
              )}
            >
              <div className="flex-shrink-0 mt-0.5">{getAlertIcon(alert.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold">{alert.title}</p>
                  <Badge variant="outline" className={cn('text-[10px]', getSeverityStyles(alert.severity))}>
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-xs opacity-80">{alert.message}</p>
                <p className="text-[10px] opacity-50 mt-1">
                  {format(alert.timestamp, 'dd MMM yyyy, hh:mm a')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
