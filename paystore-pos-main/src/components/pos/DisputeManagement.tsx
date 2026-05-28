import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocale } from '@/contexts/LocaleContext';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  RefreshCw, Loader2, AlertTriangle, Plus, CheckCircle2,
  Clock, XCircle, MessageSquare, Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Dispute {
  id: string;
  payment_id: string;
  raised_by: string;
  reason: string;
  description: string | null;
  status: string;
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  payment_amount?: number;
  payment_status?: string;
  internal_order_id?: string;
}

const DISPUTE_REASONS = [
  'Amount mismatch',
  'Double charge',
  'Payment not received',
  'Wrong payment mode recorded',
  'Customer complaint',
  'Unauthorized transaction',
  'Other',
];

const getStoreId = (): string => {
  try {
    const d = localStorage.getItem('pos_active_store_data');
    if (d) return JSON.parse(d)?.storeId || JSON.parse(d)?.id || '';
    const s = localStorage.getItem('store_login');
    if (s) return JSON.parse(s)?.store_id || '';
  } catch {}
  return '';
};

export const DisputeManagement: React.FC = () => {
  const { formatCurrency } = useLocale();
  const { userRole } = useSupabaseAuth();
  const isOwnerOrAdmin = userRole?.role === 'owner' || userRole?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState<Dispute | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved' | 'rejected'>('all');

  // Create form
  const [paymentId, setPaymentId] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Resolve form
  const [resolution, setResolution] = useState('');
  const [resolveAction, setResolveAction] = useState<'resolved' | 'rejected'>('resolved');

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const storeId = getStoreId();
      if (!storeId) { setLoading(false); return; }

      let query = supabase
        .from('payment_disputes')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data } = await query;
      const disputeList = data || [];

      // Fetch payment details for each dispute
      const paymentIds = [...new Set(disputeList.map(d => d.payment_id))];
      const paymentMap: Record<string, any> = {};
      if (paymentIds.length > 0) {
        const { data: payments } = await supabase
          .from('payments')
          .select('id, amount, status, internal_order_id')
          .in('id', paymentIds);
        if (payments) {
          payments.forEach(p => { paymentMap[p.id] = p; });
        }
      }

      setDisputes(disputeList.map(d => ({
        ...d,
        payment_amount: paymentMap[d.payment_id]?.amount ? Number(paymentMap[d.payment_id].amount) : undefined,
        payment_status: paymentMap[d.payment_id]?.status,
        internal_order_id: paymentMap[d.payment_id]?.internal_order_id,
      })));
    } catch (err) {
      console.error('Disputes fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  const handleCreate = async () => {
    if (!paymentId.trim() || !reason) {
      toast.error('Payment ID and reason are required');
      return;
    }
    setSubmitting(true);
    try {
      const storeId = getStoreId();
      const billerName = localStorage.getItem('pos_current_biller') || 'Unknown';

      // Verify payment exists
      const { data: payment } = await supabase
        .from('payments')
        .select('id')
        .eq('id', paymentId.trim())
        .eq('store_id', storeId)
        .maybeSingle();

      if (!payment) {
        toast.error('Payment not found in this store');
        setSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('payment_disputes')
        .insert({
          store_id: storeId,
          payment_id: paymentId.trim(),
          raised_by: billerName,
          reason,
          description: description || null,
        });

      if (error) throw error;
      toast.success('Dispute raised successfully');
      setShowCreateDialog(false);
      setPaymentId('');
      setReason('');
      setDescription('');
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create dispute');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async () => {
    if (!showResolveDialog || !resolution.trim()) {
      toast.error('Resolution notes are required');
      return;
    }
    setSubmitting(true);
    try {
      const billerName = localStorage.getItem('pos_current_biller') || 'Unknown';
      const { error } = await supabase
        .from('payment_disputes')
        .update({
          status: resolveAction,
          resolution,
          resolved_by: billerName,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', showResolveDialog.id);

      if (error) throw error;
      toast.success(`Dispute ${resolveAction === 'resolved' ? 'resolved' : 'rejected'}`);
      setShowResolveDialog(null);
      setResolution('');
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update dispute');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'resolved': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Payment Disputes
        </h2>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-1" />Raise Dispute
          </Button>
          <Button variant="outline" size="sm" onClick={fetchDisputes}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="pos-card p-4 text-center">
          <p className="text-xs text-muted-foreground">Open</p>
          <p className="text-2xl font-bold text-orange-500">{disputes.filter(d => d.status === 'open').length}</p>
        </div>
        <div className="pos-card p-4 text-center">
          <p className="text-xs text-muted-foreground">Resolved</p>
          <p className="text-2xl font-bold text-green-500">{disputes.filter(d => d.status === 'resolved').length}</p>
        </div>
        <div className="pos-card p-4 text-center">
          <p className="text-xs text-muted-foreground">Rejected</p>
          <p className="text-2xl font-bold text-destructive">{disputes.filter(d => d.status === 'rejected').length}</p>
        </div>
      </div>

      {/* Disputes List */}
      {disputes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No disputes found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map(d => (
            <div key={d.id} className="pos-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(d.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{d.reason}</p>
                      <Badge variant={d.status === 'open' ? 'outline' : d.status === 'resolved' ? 'default' : 'destructive'} className="text-xs">
                        {d.status}
                      </Badge>
                    </div>
                    {d.description && <p className="text-xs text-muted-foreground mt-1">{d.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {d.payment_amount !== undefined && <span>Amount: {formatCurrency(d.payment_amount)}</span>}
                      <span>By: {d.raised_by}</span>
                      <span>{format(new Date(d.created_at), 'dd MMM, hh:mm a')}</span>
                    </div>
                    {d.resolution && (
                      <div className="mt-2 p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Resolution: {d.resolution}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          By {d.resolved_by} on {d.resolved_at ? format(new Date(d.resolved_at), 'dd MMM, hh:mm a') : ''}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {d.status === 'open' && isOwnerOrAdmin && (
                  <Button variant="outline" size="sm" onClick={() => { setShowResolveDialog(d); setResolveAction('resolved'); setResolution(''); }}>
                    Resolve
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Raise Payment Dispute</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Payment ID</label>
              <Input value={paymentId} onChange={e => setPaymentId(e.target.value)} placeholder="Paste payment UUID" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Reason</label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent>
                  {DISPUTE_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Description (optional)</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Additional details..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Raise Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={!!showResolveDialog} onOpenChange={v => !v && setShowResolveDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Resolve Dispute</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {showResolveDialog && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p><strong>Reason:</strong> {showResolveDialog.reason}</p>
                {showResolveDialog.payment_amount !== undefined && (
                  <p><strong>Amount:</strong> {formatCurrency(showResolveDialog.payment_amount)}</p>
                )}
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground">Action</label>
              <Select value={resolveAction} onValueChange={(v: any) => setResolveAction(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="resolved">Resolve (Accept)</SelectItem>
                  <SelectItem value="rejected">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Resolution Notes</label>
              <Textarea value={resolution} onChange={e => setResolution(e.target.value)} placeholder="Describe the resolution..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(null)}>Cancel</Button>
            <Button onClick={handleResolve} disabled={submitting} variant={resolveAction === 'rejected' ? 'destructive' : 'default'}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {resolveAction === 'resolved' ? 'Resolve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
