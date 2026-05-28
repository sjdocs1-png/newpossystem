import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { invokeFunctionWithResponseFallback } from '@/lib/invokeFunctionWithResponseFallback';
import { useLocale } from '@/contexts/LocaleContext';
import { usePOS } from '@/contexts/POSContext';
import { useOwnerStore } from '@/hooks/useOwnerStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, CreditCard, IndianRupee, Phone, User, Clock, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface CreditEntry {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  bill_number: string | null;
  order_id: string | null;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  payment_status: string;
  notes: string | null;
  created_at: string;
}

interface CreditPayment {
  id: string;
  amount: number;
  payment_method: string;
  received_by: string | null;
  notes: string | null;
  created_at: string;
}

export const CreditLedger: React.FC = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useLocale();
  const { activeStore, isStoreLogin } = usePOS();
  const { selectedStoreId, isOwner } = useOwnerStore();
  const storeId = activeStore?.id || (isOwner ? selectedStoreId : null);

  const [entries, setEntries] = useState<CreditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<CreditEntry | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [payments, setPayments] = useState<CreditPayment[]>([]);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'fetching' | 'saving' | 'failed'>('idle');
  const [latestDbError, setLatestDbError] = useState<string | null>(null);
  const [failedRequests, setFailedRequests] = useState<Array<{ id: string; context: string; payload: any; error: string }>>([]);

  const fetchEntries = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      setSyncStatus('fetching');
      setLatestDbError(null);

      const data = await invokeFunctionWithResponseFallback<{ items?: CreditEntry[]; warning?: string }>('sync-store-data', {
        action: 'fetch',
        store_id: storeId,
        data_type: 'credit_ledger',
        store_code: localStorage.getItem('pos_store_code') || undefined,
      });

      if (data?.warning || !Array.isArray(data.items)) {
        const message = data?.warning || 'Failed to fetch credit ledger';
        console.error('[CreditLedger] fetch via function failed:', message, data);
        if (!isStoreLogin) {
          const { data: directData, error: directError } = await supabase
            .from('credit_ledger')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });
          if (!directError) {
            let items = (directData || []) as CreditEntry[];
            if (filter !== 'all') items = items.filter(i => i.payment_status === filter);
            setEntries(items);
            setSyncStatus('idle');
            setLoading(false);
            return;
          }
          console.error('[CreditLedger] Direct DB fetch failed:', directError);
        }
        setLatestDbError(String(message))
        setFailedRequests(prev => [...prev, { id: crypto.randomUUID(), context: 'fetch-credit-ledger', payload: { action: 'fetch', data_type: 'credit_ledger', store_id: storeId }, error: String(message) }])
        setEntries([])
        setSyncStatus('failed')
      } else {
        let items = (data?.items || []) as CreditEntry[]
        if ((!items || items.length === 0) && !isStoreLogin) {
          console.debug('[CreditLedger] function returns empty, trying direct DB fetch for owner')
          const { data: directData, error: directError } = await supabase
            .from('credit_ledger')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });
          if (!directError) {
            items = (directData || []) as CreditEntry[];
          } else {
            console.error('[CreditLedger] direct DB fallback failed:', directError);
          }
        }
        if (filter !== 'all') items = items.filter(i => i.payment_status === filter);
        setEntries(items);
        setSyncStatus('idle');
      }
    } catch (err) {
      console.error('[CreditLedger] fetchEntries failed:', err);
      if (!isStoreLogin && storeId) {
        const { data: directData, error: directError } = await supabase
          .from('credit_ledger')
          .select('*')
          .eq('store_id', storeId)
          .order('created_at', { ascending: false })
        if (!directError) {
          let items = (directData || []) as CreditEntry[]
          if (filter !== 'all') items = items.filter(i => i.payment_status === filter)
          setEntries(items)
          setSyncStatus('idle')
          setLoading(false)
          return
        }
        console.error('[CreditLedger] direct DB fetch fallback failed:', directError)
      }
      setEntries([])
    }
    setLoading(false);
  }, [storeId, filter, isStoreLogin]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const fetchPayments = async (creditId: string) => {
    try {
      setSyncStatus('fetching');
      setLatestDbError(null);

      const data = await invokeFunctionWithResponseFallback<{ items?: CreditPayment[]; warning?: string }>('sync-store-data', {
        action: 'fetch',
        store_id: storeId,
        data_type: 'credit_payments',
        store_code: localStorage.getItem('pos_store_code') || undefined,
      });
      if (data?.warning || !Array.isArray(data.items)) {
        const message = data?.warning || 'Failed to fetch credit payments';
        console.error('[CreditLedger] fetchPayments via function failed:', message);
        if (!isStoreLogin) {
          const { data: directData, error: directError } = await supabase
            .from('credit_payments')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });
          if (!directError) {
            const items = (directData || []) as CreditPayment[];
            const filteredItems = items.filter((p) => p.credit_id === creditId);
            setPayments(filteredItems);
            setSyncStatus('idle');
            return;
          }
          console.error('[CreditLedger] Direct DB credit payments fetch failed:', directError);
        }
        setLatestDbError(String(message))
        setFailedRequests(prev => [...prev, { id: crypto.randomUUID(), context: 'fetch-credit-payments', payload: { action: 'fetch', data_type: 'credit_payments', store_id: storeId }, error: String(message) }])
        setPayments([])
        setSyncStatus('failed')
      } else {
        const items = (data?.items || []).filter((p: any) => p.credit_id === creditId)
        setPayments(items as CreditPayment[])
        setSyncStatus('idle')
      }
    } catch (err) {
      console.error('[CreditLedger] fetchPayments failed:', err);
      setPayments([]);
    }
  };

  const fetchOrderDetails = async (orderId: string | null) => {
    if (!orderId) {
      setSelectedOrder(null);
      return;
    }

    let orderData: any | null = null;
    if (isStoreLogin) {
      const { data, error } = await supabase.functions.invoke('sync-orders', {
        body: { action: 'fetch', store_id: storeId, store_code: localStorage.getItem('pos_store_code') || undefined }
      });
      if (!error && data?.orders) {
        orderData = (data.orders || []).find((order: any) => order.id === orderId) || null;
      } else {
        console.error('[CreditLedger] Store-login order fetch failed:', error || data?.error);
      }
    } else {
      const { data } = await supabase
      .from('orders')
      .select('id, items, subtotal, tax, discount, total, customer_name, customer_phone')
      .eq('id', orderId)
      .single();
      orderData = data || null;
    }

    setSelectedOrder(orderData || null);
  };

  const handleSelectEntry = async (entry: CreditEntry) => {
    setSelectedEntry(entry);
    await fetchPayments(entry.id);
    await fetchOrderDetails(entry.order_id);
  };

  const handlePayDue = async () => {
    if (!selectedEntry || !storeId) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (amount > selectedEntry.due_amount) {
      toast.error('Amount exceeds due amount');
      return;
    }

    try {
      const payload = {
        action: 'save',
        store_id: storeId,
        store_code: localStorage.getItem('pos_store_code') || undefined,
        data_type: 'credit_payments',
        items: [
          {
            credit_id: selectedEntry.id,
            store_id: storeId,
            amount,
            payment_method: payMethod,
          }
        ]
      }

      try {
        setSyncStatus('saving')
        setLatestDbError(null)
        console.debug('[CreditLedger] save payment payload:', payload)
        const data = await invokeFunctionWithResponseFallback<any>('sync-store-data', payload)
        console.debug('[CreditLedger] save payment response:', { data })

        if (!navigator.onLine) {
          toast.error('Network offline — check your internet connection')
          setLatestDbError('Network offline')
          setFailedRequests(prev => [...prev, { id: crypto.randomUUID(), context: 'credit_payment_save', payload, error: 'Network offline' }])
          setSyncStatus('failed')
          return
        }

        if (data?.warning || data?.error) {
          const msg = data?.warning || data?.error || data?.message || 'Payment failed'
          console.error('[CreditLedger] save payment via function failed:', msg)
          if (!isStoreLogin) {
            try {
              const paymentPayload = {
                store_id: storeId,
                credit_id: selectedEntry.id,
                amount,
                payment_method: payMethod,
                received_by: null,
                notes: null,
                created_at: new Date().toISOString(),
              }

              const { data: directPayment, error: directPaymentError } = await supabase
                .from('credit_payments')
                .insert(paymentPayload)
                .select()
                .single();

              if (!directPaymentError && directPayment) {
                const newPaidAmount = Number(selectedEntry.paid_amount || 0) + amount;
                const newDueAmount = Math.max(0, Number(selectedEntry.total_amount || 0) - newPaidAmount);
                const newStatus = newDueAmount <= 0 ? 'paid' : (newPaidAmount > 0 ? 'partial' : 'unpaid');
                const { error: directUpdateError } = await supabase
                  .from('credit_ledger')
                  .update({ paid_amount: newPaidAmount, due_amount: newDueAmount, payment_status: newStatus, updated_at: new Date().toISOString() })
                  .eq('id', selectedEntry.id)
                  .eq('store_id', storeId);

                if (!directUpdateError) {
                  toast.success(`₹${amount} payment recorded!`);
                  setShowPayDialog(false);
                  setPayAmount('');
                  setSelectedEntry({ ...selectedEntry, paid_amount: newPaidAmount, due_amount: newDueAmount, payment_status: newStatus });
                  await fetchPayments(selectedEntry.id);
                  fetchEntries();
                  setSyncStatus('idle');
                  return;
                }
              }
            } catch (directErr) {
              console.warn('[CreditLedger] direct DB save fallback failed:', directErr);
            }
          }
          setLatestDbError(String(msg))
          setFailedRequests(prev => [...prev, { id: crypto.randomUUID(), context: 'credit_payment_save', payload, error: String(msg) }])
          setSyncStatus('failed')
          toast.error(msg)
          return
        }

        const ledgerFromResp = data?.results?.[0]?.ledger || data?.results?.[0]?.credit || null
        let newPaid = Number(selectedEntry.paid_amount) + amount
        let newDue = Number(selectedEntry.total_amount) - newPaid
        let newStatus = newDue <= 0 ? 'paid' : 'partial'

        if (ledgerFromResp) {
          newPaid = Number(ledgerFromResp.paid_amount || newPaid)
          newDue = Number(ledgerFromResp.due_amount || newDue)
          newStatus = ledgerFromResp.payment_status || newStatus
        }

        toast.success(`₹${amount} payment recorded!`)
        setShowPayDialog(false)
        setPayAmount('')
        setSelectedEntry({ ...selectedEntry, paid_amount: newPaid, due_amount: Math.max(0, newDue), payment_status: newStatus })
        await fetchPayments(selectedEntry.id)
        fetchEntries()
        setSyncStatus('idle')
        return
      } catch (innerErr) {
        console.error('[CreditLedger] save payment function call failed:', innerErr)
        const message = String(innerErr)
        setLatestDbError(message)
        setFailedRequests(prev => [...prev, { id: crypto.randomUUID(), context: 'credit_payment_save', payload, error: message }])
        setSyncStatus('failed')
        if (!navigator.onLine) toast.error('Network offline — check your internet connection')
        else toast.error(message)
        return
      }
    } catch (err) {
      const message = String(err)
      console.error('[CreditLedger] handlePayDue failed:', message)
      setLatestDbError(message)
      setFailedRequests(prev => [...prev, { id: crypto.randomUUID(), context: 'handlePayDue', payload: { selectedEntry, amount, payMethod }, error: message }])
      setSyncStatus('failed')
      if (!navigator.onLine) toast.error('Network offline — check your internet connection')
      else toast.error('Payment failed')
      return;
    }
  };

  const filteredEntries = useMemo(() => {
    const lowerSearch = searchTerm.trim().toLowerCase();
    return entries.filter((entry) => {
      if (filter !== 'all' && entry.payment_status !== filter) return false;
      if (!lowerSearch) return true;
      const nameMatch = entry.customer_name?.toLowerCase().includes(lowerSearch);
      const phoneMatch = entry.customer_phone?.toLowerCase().includes(lowerSearch);
      const billMatch = entry.bill_number?.toLowerCase().includes(lowerSearch);
      return !!(nameMatch || phoneMatch || billMatch);
    });
  }, [entries, filter, searchTerm]);

  const totalOutstanding = filteredEntries.reduce((sum, e) => sum + Number(e.due_amount), 0);
  const totalPaid = filteredEntries.reduce((sum, e) => sum + Number(e.paid_amount), 0);
  const totalCustomers = useMemo(() => new Set(entries.map((entry) => entry.customer_phone || entry.customer_name)).size, [entries]);
  const totalBills = filteredEntries.length;

  const retryFailedRequests = async () => {
    for (const request of failedRequests) {
      try {
        const { data, error } = await supabase.functions.invoke('sync-store-data', { body: request.payload })
        if (!error && !data?.error) {
          setFailedRequests(prev => prev.filter(r => r.id !== request.id))
        }
      } catch (retryErr) {
        console.warn('[CreditLedger] retry failed for request', request.id, retryErr)
      }
    }
    if (failedRequests.length === 0) {
      setSyncStatus('idle')
      setLatestDbError(null)
      fetchEntries()
    }
  }

  const statusColor = (status: string) => {
    if (status === 'paid') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (status === 'partial') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Credit Ledger</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Outstanding Balance</p>
          <p className="text-2xl font-bold text-destructive">{formatCurrency(totalOutstanding)}</p>
          <p className="text-xs text-muted-foreground mt-2">Open invoices: {totalBills}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Collected From Ledger</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(totalPaid)}</p>
          <p className="text-xs text-muted-foreground mt-2">Customers: {totalCustomers}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Pending Credit Bills</p>
          <p className="text-2xl font-bold text-foreground">{totalBills}</p>
          <p className="text-xs text-muted-foreground mt-2">Filtered results based on search and status</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-sm text-muted-foreground">Sync Status</p>
            <p className="font-semibold text-foreground">{syncStatus}</p>
          </div>
          <Button variant="outline" size="sm" onClick={retryFailedRequests} disabled={failedRequests.length === 0}>
            Retry failed
          </Button>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Latest DB error: <span className="text-foreground">{latestDbError || 'None'}</span></p>
          <p>Failed requests: {failedRequests.length}</p>
        </div>
      </div>

      <div className="space-y-3">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search customer name, phone, or bill number"
          className="w-full"
        />

        <div className="flex flex-wrap gap-2">
          {(['all', 'unpaid', 'partial', 'paid'] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Entries List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No credit entries found</p>
        ) : filteredEntries.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No matching credit entries for this search / filter</p>
        ) : filteredEntries.map(entry => (
          <button
            key={entry.id}
            onClick={() => handleSelectEntry(entry)}
            className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-primary transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-foreground">{entry.customer_name}</span>
              </div>
              <Badge className={statusColor(entry.payment_status)}>{entry.payment_status}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{entry.bill_number || 'No bill'}</span>
              <div className="text-right">
                <p className="font-bold text-destructive">Due: {formatCurrency(entry.due_amount)}</p>
                <p className="text-xs text-muted-foreground">of {formatCurrency(entry.total_amount)}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Entry Detail Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Credit Details
            </DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="bg-secondary rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-semibold text-foreground">{selectedEntry.customer_name}</p>
                    {selectedEntry.customer_phone && <p className="text-xs text-muted-foreground mt-1"><Phone className="inline w-3 h-3 mr-1" />{selectedEntry.customer_phone}</p>}
                  </div>
                  <Badge className={statusColor(selectedEntry.payment_status)}>{selectedEntry.payment_status}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div className="rounded-xl bg-background p-3">
                    <p>Total amount</p>
                    <p className="font-semibold text-foreground">{formatCurrency(selectedEntry.total_amount)}</p>
                  </div>
                  <div className="rounded-xl bg-background p-3">
                    <p>Paid</p>
                    <p className="font-semibold text-foreground">{formatCurrency(selectedEntry.paid_amount)}</p>
                  </div>
                  <div className="rounded-xl bg-background p-3 col-span-2">
                    <p>Remaining due</p>
                    <p className="font-semibold text-destructive">{formatCurrency(selectedEntry.due_amount)}</p>
                  </div>
                </div>
              </div>

              {selectedEntry.due_amount > 0 && (
                <Button className="w-full" onClick={() => { setShowPayDialog(true); setPayAmount(String(selectedEntry.due_amount)); }}>
                  <IndianRupee className="w-4 h-4 mr-2" />
                  Pay Due
                </Button>
              )}

              {selectedOrder ? (
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Invoice details</p>
                    <span className="text-xs text-muted-foreground">Order ID: {selectedOrder.id}</span>
                  </div>
                  <div className="space-y-2">
                    {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item: any, index: number) => (
                      <div key={`${item.id}-${index}`} className="flex justify-between text-sm">
                        <span>{item.name} x{item.quantity}</span>
                        <span>{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border pt-3 text-sm space-y-2 text-muted-foreground">
                    <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span></div>
                    <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(selectedOrder.tax)}</span></div>
                    <div className="flex justify-between"><span>Discount</span><span>{formatCurrency(selectedOrder.discount)}</span></div>
                    <div className="flex justify-between"><span className="font-semibold">Total</span><span className="font-semibold text-foreground">{formatCurrency(selectedOrder.total)}</span></div>
                  </div>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl p-4 text-sm text-muted-foreground">
                  Invoice details unavailable for this credit entry.
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Clock className="w-4 h-4" /> Payment Timeline</h4>
                <div className="space-y-2">
                  <div className="bg-card border border-border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Credit created</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-medium">{formatCurrency(selectedEntry.total_amount)}</span>
                      <span className="text-xs text-muted-foreground">{new Date(selectedEntry.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  {payments.length === 0 ? (
                    <div className="bg-card border border-border rounded-lg p-3 text-xs text-muted-foreground">No payments recorded yet.</div>
                  ) : payments.map((payment) => (
                    <div key={payment.id} className="bg-card border border-border rounded-lg p-3">
                      <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-muted-foreground">{payment.payment_method} • {new Date(payment.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pay Due Dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Amount</label>
              <Input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Payment Method</label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handlePayDue}>
              <Plus className="w-4 h-4 mr-2" /> Confirm Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
