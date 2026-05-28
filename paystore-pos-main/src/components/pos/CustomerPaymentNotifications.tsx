import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  RefreshCw, Loader2, Send, CheckCircle2, XCircle, MessageSquare, Phone,
  Bell, Clock, Search, Filter, Megaphone, AlertCircle
} from 'lucide-react';
import { format, subHours, subDays } from 'date-fns';
import { toast } from 'sonner';

interface NotificationLog {
  id: string;
  type: 'success' | 'failure' | 'refund' | 'due_reminder' | 'promotional';
  customer_phone: string;
  customer_name?: string;
  amount: number;
  status: string;
  sent_at: Date;
  method: 'whatsapp';
  message?: string;
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

const getStoreName = (): string => {
  try {
    const d = localStorage.getItem('pos_active_store_data');
    if (d) return JSON.parse(d)?.storeName || JSON.parse(d)?.store_name || 'Store';
  } catch {}
  return 'Store';
};

export const CustomerPaymentNotifications: React.FC = () => {
  const { formatCurrency } = useLocale();
  const [loading, setLoading] = useState(true);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [dueOrders, setDueOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('payments');
  const [promoMessage, setPromoMessage] = useState('');
  const [promoPhone, setPromoPhone] = useState('');
  const [autoNotify, setAutoNotify] = useState(() => {
    return localStorage.getItem('payment_auto_notify') === 'true';
  });
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);

  const fetchRecent = useCallback(async () => {
    setLoading(true);
    try {
      const storeId = getStoreId();
      if (!storeId) { setLoading(false); return; }

      const last72h = subHours(new Date(), 72);
      const { data: payments } = await supabase
        .from('payments')
        .select('id, amount, status, payment_mode, created_at, internal_order_id, provider_payment_id')
        .eq('store_id', storeId)
        .in('status', ['paid', 'failed', 'refunded'])
        .gte('created_at', last72h.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      setRecentPayments(payments || []);

      // Fetch due orders
      const { data: dues } = await supabase
        .from('orders')
        .select('id, bill_number, total, customer_name, customer_phone, created_at, payment_method')
        .eq('store_id', storeId)
        .eq('payment_method', 'due')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(50);

      setDueOrders(dues || []);

      // Load local notification logs
      try {
        const logs = JSON.parse(localStorage.getItem('payment_notification_logs') || '[]');
        setNotificationLogs(logs.slice(0, 50));
      } catch {}
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecent(); }, [fetchRecent]);

  const addLog = (log: NotificationLog) => {
    const logs = [log, ...notificationLogs].slice(0, 100);
    setNotificationLogs(logs);
    localStorage.setItem('payment_notification_logs', JSON.stringify(logs));
  };

  const sendWhatsAppNotification = (phone: string, payment: any, customerName?: string) => {
    const storeName = getStoreName();
    let message = '';

    if (payment.status === 'paid') {
      message = `✅ Payment Received!\n\nStore: ${storeName}\nAmount: ${formatCurrency(Number(payment.amount))}\nMode: ${payment.payment_mode || 'Online'}\nRef: ${payment.internal_order_id?.slice(0, 12) || 'N/A'}\nDate: ${format(new Date(payment.created_at), 'dd MMM yyyy, hh:mm a')}\n\nThank you for your payment! 🙏`;
    } else if (payment.status === 'failed') {
      message = `❌ Payment Failed\n\nStore: ${storeName}\nAmount: ${formatCurrency(Number(payment.amount))}\nRef: ${payment.internal_order_id?.slice(0, 12) || 'N/A'}\n\nPlease try again or contact the store for assistance.`;
    } else if (payment.status === 'refunded') {
      message = `🔄 Refund Initiated\n\nStore: ${storeName}\nAmount: ${formatCurrency(Number(payment.amount))}\nRef: ${payment.internal_order_id?.slice(0, 12) || 'N/A'}\n\nYour refund is being processed. It may take 5-7 business days.`;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    addLog({
      id: payment.id,
      type: payment.status === 'paid' ? 'success' : payment.status === 'failed' ? 'failure' : 'refund',
      customer_phone: phone,
      customer_name: customerName,
      amount: Number(payment.amount),
      status: 'sent',
      sent_at: new Date(),
      method: 'whatsapp',
    });
    toast.success('WhatsApp notification opened');
  };

  const sendDueReminder = (order: any) => {
    if (!order.customer_phone) {
      toast.error('No phone number available for this customer');
      return;
    }
    const storeName = getStoreName();
    const message = `⏰ Payment Reminder\n\nHi ${order.customer_name || 'Customer'},\n\nYou have a pending payment of ${formatCurrency(Number(order.total))} at ${storeName}.\n\nBill No: #${order.bill_number}\nDate: ${format(new Date(order.created_at), 'dd MMM yyyy')}\n\nPlease clear your dues at your earliest convenience.\n\nThank you! 🙏`;

    const cleanPhone = order.customer_phone.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    addLog({
      id: order.id,
      type: 'due_reminder',
      customer_phone: order.customer_phone,
      customer_name: order.customer_name,
      amount: Number(order.total),
      status: 'sent',
      sent_at: new Date(),
      method: 'whatsapp',
    });
    toast.success('Due reminder sent via WhatsApp');
  };

  const sendPromoNotification = () => {
    if (!promoPhone.trim() || !promoMessage.trim()) {
      toast.error('Enter both phone number and message');
      return;
    }
    const storeName = getStoreName();
    const fullMessage = `📢 ${storeName}\n\n${promoMessage}\n\n🙏 Thank you!`;
    const cleanPhone = promoPhone.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(fullMessage)}`;
    window.open(whatsappUrl, '_blank');

    addLog({
      id: `promo_${Date.now()}`,
      type: 'promotional',
      customer_phone: promoPhone,
      amount: 0,
      status: 'sent',
      sent_at: new Date(),
      method: 'whatsapp',
      message: promoMessage.slice(0, 50),
    });
    setPromoMessage('');
    setPromoPhone('');
    toast.success('Promotional message sent');
  };

  const handleAutoNotifyToggle = (value: boolean) => {
    setAutoNotify(value);
    localStorage.setItem('payment_auto_notify', value.toString());
    toast.success(value ? 'Auto-notify enabled' : 'Auto-notify disabled');
  };

  // Filter payments
  const filteredPayments = recentPayments.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.internal_order_id?.toLowerCase().includes(q) || p.payment_mode?.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          Customer Notifications
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Auto-notify</span>
            <Switch checked={autoNotify} onCheckedChange={handleAutoNotifyToggle} />
          </div>
          <Button variant="outline" size="sm" onClick={fetchRecent}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="pos-card p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{recentPayments.length}</p>
          <p className="text-xs text-muted-foreground">Recent Payments</p>
        </div>
        <div className="pos-card p-3 text-center">
          <p className="text-2xl font-bold text-orange-500">{dueOrders.length}</p>
          <p className="text-xs text-muted-foreground">Pending Dues</p>
        </div>
        <div className="pos-card p-3 text-center">
          <p className="text-2xl font-bold text-green-500">{notificationLogs.filter(l => l.type === 'success').length}</p>
          <p className="text-xs text-muted-foreground">Receipts Sent</p>
        </div>
        <div className="pos-card p-3 text-center">
          <p className="text-2xl font-bold text-primary">{notificationLogs.filter(l => l.type === 'due_reminder').length}</p>
          <p className="text-xs text-muted-foreground">Reminders Sent</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="payments" className="flex-1">
            <Bell className="w-4 h-4 mr-1" />Payment Alerts
          </TabsTrigger>
          <TabsTrigger value="dues" className="flex-1">
            <Clock className="w-4 h-4 mr-1" />Due Reminders
          </TabsTrigger>
          <TabsTrigger value="promo" className="flex-1">
            <Megaphone className="w-4 h-4 mr-1" />Promotional
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1">
            <Send className="w-4 h-4 mr-1" />History
          </TabsTrigger>
        </TabsList>

        {/* Payment Alerts Tab */}
        <TabsContent value="payments" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID or mode..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-card text-sm"
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {filteredPayments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No matching payments</p>
          ) : (
            <div className="space-y-2">
              {filteredPayments.map(p => {
                const alreadySent = notificationLogs.some(l => l.id === p.id);
                return (
                  <div key={p.id} className="pos-card p-3 flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {p.status === 'paid' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> :
                       p.status === 'failed' ? <XCircle className="w-5 h-5 text-destructive" /> :
                       <RefreshCw className="w-5 h-5 text-orange-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{formatCurrency(Number(p.amount))}</span>
                        <Badge variant={p.status === 'paid' ? 'default' : p.status === 'failed' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {p.status}
                        </Badge>
                        {alreadySent && <Badge variant="outline" className="text-[10px] text-green-600">Sent</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), 'dd MMM, hh:mm a')} • {p.payment_mode || 'online'}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const phone = prompt('Enter customer phone number:');
                        if (phone?.trim()) {
                          sendWhatsAppNotification(phone.trim(), p);
                        }
                      }}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      <Phone className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Due Reminders Tab */}
        <TabsContent value="dues" className="space-y-4">
          {dueOrders.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-foreground font-medium">No pending dues!</p>
              <p className="text-sm text-muted-foreground">All customers have cleared their payments</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dueOrders.map(order => (
                <div key={order.id} className="pos-card p-3 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{order.customer_name || 'Unknown'}</span>
                      <span className="text-sm font-bold text-orange-500">{formatCurrency(Number(order.total))}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Bill #{order.bill_number} • {format(new Date(order.created_at), 'dd MMM yyyy')}
                      {order.customer_phone && ` • ${order.customer_phone}`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => sendDueReminder(order)}
                    disabled={!order.customer_phone}
                  >
                    <Send className="w-4 h-4 mr-1" />Remind
                  </Button>
                </div>
              ))}
              <div className="pos-card p-3 bg-orange-500/5 border-orange-500/20">
                <p className="text-sm font-medium text-foreground">
                  Total Pending: {formatCurrency(dueOrders.reduce((s, o) => s + Number(o.total), 0))}
                </p>
                <p className="text-xs text-muted-foreground">{dueOrders.filter(o => o.customer_phone).length} of {dueOrders.length} customers have phone numbers</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Promotional Tab */}
        <TabsContent value="promo" className="space-y-4">
          <div className="pos-card p-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Customer Phone</label>
              <Input
                placeholder="Enter phone number"
                value={promoPhone}
                onChange={e => setPromoPhone(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Message</label>
              <Textarea
                placeholder="Type your promotional message..."
                value={promoMessage}
                onChange={e => setPromoMessage(e.target.value)}
                className="mt-1"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">{promoMessage.length}/500 characters</p>
            </div>
            <Button onClick={sendPromoNotification} className="w-full">
              <Megaphone className="w-4 h-4 mr-2" />
              Send via WhatsApp
            </Button>
          </div>
          <div className="pos-card p-4">
            <p className="text-sm font-medium text-foreground mb-2">Quick Templates</p>
            <div className="space-y-2">
              {[
                '🎉 Special offer! Get 20% off on your next visit. Valid this week only!',
                '🍽️ New items added to our menu! Come try our latest dishes today.',
                '⭐ Thank you for being our loyal customer! Enjoy a complimentary dessert on your next visit.',
              ].map((template, i) => (
                <button
                  key={i}
                  onClick={() => setPromoMessage(template)}
                  className="w-full text-left p-2 rounded-lg border border-border hover:bg-accent text-xs text-foreground"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {notificationLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No notifications sent yet</p>
          ) : (
            <div className="space-y-2">
              {notificationLogs.map((log, idx) => (
                <div key={`${log.id}-${idx}`} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="flex-shrink-0">
                    {log.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> :
                     log.type === 'failure' ? <XCircle className="w-4 h-4 text-destructive" /> :
                     log.type === 'due_reminder' ? <Clock className="w-4 h-4 text-orange-500" /> :
                     log.type === 'promotional' ? <Megaphone className="w-4 h-4 text-primary" /> :
                     <RefreshCw className="w-4 h-4 text-blue-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">
                      {log.type === 'success' ? '✅ Payment receipt' :
                       log.type === 'failure' ? '❌ Failure alert' :
                       log.type === 'due_reminder' ? '⏰ Due reminder' :
                       log.type === 'promotional' ? '📢 Promotional' :
                       '🔄 Refund notice'}
                      {log.amount > 0 && ` — ${formatCurrency(log.amount)}`}
                      {log.customer_name && ` • ${log.customer_name}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      To: {log.customer_phone} • {format(new Date(log.sent_at), 'dd MMM, hh:mm a')}
                      {log.message && ` • "${log.message}"`}
                    </p>
                  </div>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setNotificationLogs([]);
                  localStorage.removeItem('payment_notification_logs');
                  toast.success('History cleared');
                }}
              >
                Clear History
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};