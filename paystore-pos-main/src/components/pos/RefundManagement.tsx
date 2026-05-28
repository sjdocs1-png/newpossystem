import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  RefreshCw, Loader2, Search, RotateCcw, CheckCircle2, XCircle,
  AlertTriangle, Clock, DollarSign
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';

const getStoreId = (): string => {
  try {
    const d = localStorage.getItem('pos_active_store_data');
    if (d) return JSON.parse(d)?.storeId || JSON.parse(d)?.id || '';
    const s = localStorage.getItem('store_login');
    if (s) return JSON.parse(s)?.store_id || '';
  } catch {}
  return '';
};

const getStoreCode = (): string => {
  try {
    const s = localStorage.getItem('store_login');
    if (s) return JSON.parse(s)?.store_code || '';
    return localStorage.getItem('pos_store_code') || '';
  } catch {}
  return '';
};

export const RefundManagement: React.FC = () => {
  const { formatCurrency } = useLocale();
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [refundedPayments, setRefundedPayments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [refundReason, setRefundReason] = useState('');
  const [showRefundDialog, setShowRefundDialog] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const storeId = getStoreId();
      if (!storeId) { setLoading(false); return; }

      const since = subDays(new Date(), 30);

      // Fetch paid payments eligible for refund
      const { data: paid } = await supabase
        .from('payments')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'paid')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      // Fetch already refunded payments
      const { data: refunded } = await supabase
        .from('payments')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'refunded')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      setPayments(paid || []);
      setRefundedPayments(refunded || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const initiateRefund = (payment: any) => {
    setSelectedPayment(payment);
    setRefundReason('');
    setShowRefundDialog(true);
  };

  const processRefund = async () => {
    if (!selectedPayment) return;
    setRefunding(true);
    try {
      const storeCode = getStoreCode();
      const { data, error } = await supabase.functions.invoke('process-refund', {
        body: {
          payment_id: selectedPayment.id,
          store_code: storeCode || undefined,
          reason: refundReason || 'Merchant initiated refund',
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Refund of ${formatCurrency(data.amount)} processed successfully`);
      setShowRefundDialog(false);
      setSelectedPayment(null);
      fetchPayments();
    } catch (err: any) {
      console.error('Refund error:', err);
      toast.error(err.message || 'Refund failed. Please try again.');
    } finally {
      setRefunding(false);
    }
  };

  const filteredPayments = payments.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.internal_order_id?.toLowerCase().includes(q) ||
           p.provider_payment_id?.toLowerCase().includes(q) ||
           p.payment_mode?.toLowerCase().includes(q);
  });

  const totalRefunded = refundedPayments.reduce((s, p) => s + Number(p.amount), 0);
  const totalRefundable = payments.filter(p => p.provider_payment_id).reduce((s, p) => s + Number(p.amount), 0);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <RotateCcw className="w-6 h-6 text-primary" />
          Refund Management
        </h2>
        <Button variant="outline" size="sm" onClick={fetchPayments}><RefreshCw className="w-4 h-4" /></Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="pos-card p-3">
          <p className="text-xs text-muted-foreground">Refundable Payments</p>
          <p className="text-xl font-bold text-foreground">{payments.filter(p => p.provider_payment_id).length}</p>
        </div>
        <div className="pos-card p-3">
          <p className="text-xs text-muted-foreground">Refundable Amount</p>
          <p className="text-xl font-bold text-foreground">{formatCurrency(totalRefundable)}</p>
        </div>
        <div className="pos-card p-3">
          <p className="text-xs text-muted-foreground">Refunds Processed</p>
          <p className="text-xl font-bold text-orange-500">{refundedPayments.length}</p>
        </div>
        <div className="pos-card p-3">
          <p className="text-xs text-muted-foreground">Total Refunded</p>
          <p className="text-xl font-bold text-destructive">{formatCurrency(totalRefunded)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by order ID, payment ID, or mode..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Eligible for Refund */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Paid Payments (Last 30 Days)</h3>
        {filteredPayments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No paid payments found</p>
        ) : (
          <div className="space-y-2">
            {filteredPayments.map(p => {
              const canRefund = !!p.provider_payment_id;
              return (
                <div key={p.id} className="pos-card p-3 flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{formatCurrency(Number(p.amount))}</span>
                      <Badge variant="default" className="text-[10px]">{p.payment_mode || 'online'}</Badge>
                      {p.webhook_verified && <Badge variant="outline" className="text-[10px] text-green-600">Verified</Badge>}
                      {!canRefund && <Badge variant="secondary" className="text-[10px]">No Provider ID</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(p.created_at), 'dd MMM yyyy, hh:mm a')} •
                      Order: {p.internal_order_id?.slice(0, 12)}...
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => initiateRefund(p)}
                    disabled={!canRefund}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />Refund
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Refund History */}
      {refundedPayments.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Refund History</h3>
          <div className="space-y-2">
            {refundedPayments.map(p => {
              const providerData = p.provider_data as Record<string, any> | null;
              const refundId = providerData?.refund?.id;
              const refundedAt = providerData?.refunded_at;
              const reason = providerData?.refund_reason;
              return (
                <div key={p.id} className="pos-card p-3 flex items-center gap-3 opacity-80">
                  <RotateCcw className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{formatCurrency(Number(p.amount))}</span>
                      <Badge variant="secondary" className="text-[10px]">Refunded</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {refundedAt ? format(new Date(refundedAt), 'dd MMM yyyy, hh:mm a') : format(new Date(p.updated_at), 'dd MMM yyyy')}
                      {refundId && ` • Ref: ${refundId}`}
                    </p>
                    {reason && <p className="text-xs text-muted-foreground italic">Reason: {reason}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Refund Confirmation Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Confirm Refund
            </DialogTitle>
            <DialogDescription>
              This action will initiate a refund through the payment gateway. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <p className="text-lg font-bold text-foreground">{formatCurrency(Number(selectedPayment.amount))}</p>
                <p className="text-xs text-muted-foreground">
                  Payment ID: {selectedPayment.provider_payment_id?.slice(0, 20)}...
                </p>
                <p className="text-xs text-muted-foreground">
                  Order: {selectedPayment.internal_order_id?.slice(0, 16)}...
                </p>
                <p className="text-xs text-muted-foreground">
                  Date: {format(new Date(selectedPayment.created_at), 'dd MMM yyyy, hh:mm a')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Reason for refund</label>
                <Textarea
                  placeholder="Enter reason..."
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)} disabled={refunding}>Cancel</Button>
            <Button variant="destructive" onClick={processRefund} disabled={refunding}>
              {refunding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RotateCcw className="w-4 h-4 mr-2" />}
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};