import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { realtimeManager } from '@/lib/realtimeManager';
import { useInventoryDeduction } from '@/hooks/useInventoryDeduction';
import { usePOS } from '@/contexts/POSContext';
import { useLocale } from '@/contexts/LocaleContext';
import { useUICustomization } from '@/hooks/useUICustomization';
import { playOrderSound } from '@/lib/orderSound';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Clock, QrCode, Printer, Settings, Truck, Smartphone, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { smartPrint } from '@/lib/printUtils';
import { generateProfessionalBill } from '@/lib/billTemplate';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface QROrder {
  id: string;
  order_number: string;
  table_number: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  items: any[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  notes: string | null;
  created_at: string;
  platform_type?: string | null;
  platform_order_id?: string | null;
  platform_customer_id?: string | null;
  delivery_address?: string | null;
  delivery_instructions?: string | null;
  estimated_delivery_time?: string | null;
  delivery_fee?: number | null;
  platform_commission?: number | null;
}

// Generate KOT HTML for thermal printer
const generateKOT = (order: QROrder, storeName: string): string => {
  const now = new Date(order.created_at).toLocaleString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const itemsHtml = order.items.map((item: any) =>
    `<tr><td style="font-size:18px;font-weight:900;padding:6px 0;">${item.name}</td><td style="font-size:20px;font-weight:900;text-align:right;padding:6px 0;">×${item.quantity}</td></tr>`
  ).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    @page{size:80mm auto;margin:2mm}
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Arial Black',Arial,sans-serif;width:80mm;max-width:80mm;margin:0 auto;padding:10px 8px;color:#000;background:#fff}
  </style></head><body>
    <div style="text-align:center;border-bottom:3px dashed #000;padding-bottom:10px;margin-bottom:10px">
      <div style="font-size:28px;font-weight:900;letter-spacing:2px">🍳 KOT</div>
      <div style="font-size:14px;font-weight:700;margin-top:4px">${storeName}</div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:700;margin-bottom:8px">
      <span>Order #${order.order_number}</span>
      <span>QR ORDER</span>
    </div>
    <div style="font-size:12px;margin-bottom:8px">${now}</div>
    ${order.customer_name ? `<div style="font-size:13px;font-weight:700;margin-bottom:4px">Customer: ${order.customer_name}</div>` : ''}
    <table style="width:100%;border-collapse:collapse;border-top:2px solid #000;border-bottom:2px solid #000;margin:8px 0">${itemsHtml}</table>
    ${order.notes ? `<div style="font-size:12px;font-weight:600;border:1px dashed #000;padding:6px;margin-top:8px;border-radius:4px">📝 ${order.notes}</div>` : ''}
    <div style="text-align:center;margin-top:12px;font-size:11px;color:#666">--- QR Menu Order ---</div>
  </body></html>`;
};

export const QROrdersPanel: React.FC = () => {
  const { activeStore } = usePOS();
  const { formatCurrency } = useLocale();
  const { deductInventoryForOrder } = useInventoryDeduction();
  const { config: uiConfig, updateConfig } = useUICustomization();
  const orderSettings = uiConfig.orderSettings || {};
  const [orders, setOrders] = useState<QROrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<QROrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddPlatformOrder, setShowAddPlatformOrder] = useState(false);
  const [platformOrderData, setPlatformOrderData] = useState({
    platform_type: 'swiggy' as 'swiggy' | 'zomato',
    platform_order_id: '',
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    delivery_instructions: '',
    items: [] as any[],
    notes: '',
  });

  const storeId = activeStore?.id;
  const storeName = activeStore?.name || 'Store';

  // Print KOT + Bill for QR order
  const autoPrintOrder = useCallback((order: QROrder) => {
    try {
      console.log('[QR Order] Starting auto-print for order:', order.order_number);
      // 1. Print KOT
      const kotHtml = generateKOT(order, storeName);
      smartPrint(kotHtml, () => {
        console.log('[QR Order] KOT printed, now printing bill');
        // 2. Print Customer Bill after KOT
        const billHtml = generateProfessionalBill({
          id: order.id,
          billNumber: `QR-${order.order_number}`,
          createdAt: order.created_at,
          orderType: 'QR Order',
          customerName: order.customer_name || undefined,
          customerPhone: order.customer_phone || undefined,
          items: order.items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          subtotal: order.subtotal,
          tax: order.tax,
          discount: 0,
          total: order.total,
          paymentMethod: 'Pending',
        });
        smartPrint(billHtml);
        console.log('[QR Order] Bill printed successfully');
      });
    } catch (e) {
      console.error('[QR Order] Auto print failed:', e);
    }
  }, [storeName]);

  // Strong phone ring style alarm
  useEffect(() => {
    if (!storeId) return;
    fetchOrders();

    const subscription = realtimeManager.subscribe({
      key: `qr-orders-page-refresh-${storeId}`,
      channelName: `qr-orders-page-refresh-${storeId}`,
      storeId,
      eventConfigs: [
        {
          event: 'INSERT',
          schema: 'public',
          table: 'qr_orders',
          filter: `store_id=eq.${storeId}`,
        },
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'qr_orders',
          filter: `store_id=eq.${storeId}`,
        },
      ],
      dedupeKey: (payload) => {
        const order = payload?.new as QROrder | null;
        return order?.id ? `${payload.eventType}:${order.id}:${order.updated_at || order.created_at}` : null;
      },
      eventBatchMs: 200,
      onEvent: (payload) => {
        const newOrder = payload.new as QROrder;
        if (!newOrder?.id) return;

        if (payload.eventType === 'INSERT') {
          setOrders(prev => [newOrder, ...prev]);
          playOrderSound();
          return;
        }

        if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => (o.id === newOrder.id ? newOrder : o)));
        }
      },
    });

    return () => { realtimeManager.unsubscribe(subscription.config.key); };
  }, [storeId]);

  const fetchOrders = async () => {
    if (!storeId) return;
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabase
      .from('qr_orders')
      .select('*')
      .eq('store_id', storeId)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });

    if (!error && data) setOrders(data as QROrder[]);
    setLoading(false);
  };

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('qr_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    
    if (error) {
      toast.error('Failed to update order');
      return;
    }

    // When QR order is completed, insert into main orders table for sales/reports
    if (status === 'completed') {
      const order = orders.find(o => o.id === orderId);
      if (order && storeId) {
        try {
          // Check if already inserted (prevent duplicates)
          const { data: existing } = await supabase
            .from('orders')
            .select('id')
            .eq('bill_number', `QR-${order.order_number}`)
            .eq('store_id', storeId)
            .maybeSingle();

          if (!existing) {
            // Enrich items with category from menu_items
            const { data: menuItems } = await supabase
              .from('menu_items')
              .select('name, category')
              .eq('store_id', storeId);

            const categoryMap = new Map<string, string>();
            (menuItems || []).forEach((mi: any) => {
              categoryMap.set(mi.name.toLowerCase().trim(), mi.category);
            });

            const enrichedItems = (order.items || []).map((item: any) => ({
              ...item,
              category: item.category || categoryMap.get((item.name || '').toLowerCase().trim()) || 'General',
            }));

            const billNumber = `QR-${order.order_number}`;
            const { error: insertError } = await supabase.from('orders').insert({
              store_id: storeId,
              bill_number: billNumber,
              items: enrichedItems as any,
              subtotal: order.subtotal,
              tax: order.tax,
              discount: 0,
              total: order.total,
              payment_method: 'cash',
              status: 'completed',
              order_type: 'qr',
              customer_name: order.customer_name || null,
              customer_phone: order.customer_phone || null,
              table_number: order.table_number || null,
              created_at: order.created_at,
            });
            
            if (insertError) {
              console.error(`[QROrders] ❌ Failed to insert QR-${order.order_number} into orders:`, insertError);
              toast.error(`Failed to add QR order to sales: ${insertError.message}`);
            } else {
              console.log(`[QROrders] ✅ Order QR-${order.order_number} pushed to sales with categories`);
              toast.success(`QR Order #${order.order_number} added to sales reports`);

              // Deduct inventory for QR order items
              try {
                const itemsForDeduction = enrichedItems.map((item: any) => ({
                  id: item.id || item.name,
                  name: item.name,
                  quantity: item.quantity || 1,
                  category: item.category,
                }));
                await deductInventoryForOrder(storeId, itemsForDeduction);
                console.log(`[QROrders] 📦 Inventory deducted for QR-${order.order_number}`);
              } catch (invErr) {
                console.error('[QROrders] Inventory deduction error:', invErr);
              }
            }
          } else {
            console.log(`[QROrders] ⏩ Order QR-${order.order_number} already in sales, skipped`);
          }
        } catch (e) {
          console.error('[QROrders] Failed to add to orders table:', e);
        }
      }
    }

    toast.success(`Order ${status}`);
    setSelectedOrder(null);
  };

  const manualPrint = (order: QROrder) => {
    autoPrintOrder(order);
    toast.success('Print sent!');
  };

  const createPlatformOrder = async () => {
    if (!storeId || !platformOrderData.platform_order_id || !platformOrderData.customer_name) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const orderNumber = `P${Date.now().toString().slice(-6)}`;
      const { data, error } = await supabase.from('qr_orders').insert({
        store_id: storeId,
        order_number: orderNumber,
        platform_type: platformOrderData.platform_type,
        platform_order_id: platformOrderData.platform_order_id,
        customer_name: platformOrderData.customer_name,
        customer_phone: platformOrderData.customer_phone || null,
        delivery_address: platformOrderData.delivery_address || null,
        delivery_instructions: platformOrderData.delivery_instructions || null,
        items: platformOrderData.items,
        subtotal: 0,
        tax: 0,
        total: 0,
        status: 'pending',
        notes: platformOrderData.notes || null,
      }).select().single();

      if (error) throw error;

      setOrders(prev => [data as QROrder, ...prev]);
      setShowAddPlatformOrder(false);
      setPlatformOrderData({
        platform_type: 'swiggy',
        platform_order_id: '',
        customer_name: '',
        customer_phone: '',
        delivery_address: '',
        delivery_instructions: '',
        items: [],
        notes: '',
      });
      toast.success('Platform order created successfully');
    } catch (error) {
      console.error('Error creating platform order:', error);
      toast.error('Failed to create platform order');
    }
  };

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'preparing': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'ready': return 'bg-green-100 text-green-800 border-green-300';
      case 'completed': return 'bg-gray-100 text-gray-600 border-gray-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  const getPlatformInfo = (platformType?: string | null) => {
    switch (platformType) {
      case 'swiggy':
        return { icon: '🍔', color: 'bg-orange-100 text-orange-800 border-orange-300', label: 'Swiggy' };
      case 'zomato':
        return { icon: '🍕', color: 'bg-red-100 text-red-800 border-red-300', label: 'Zomato' };
      case 'direct':
        return { icon: '📱', color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Direct' };
      default:
        return { icon: '📱', color: 'bg-green-100 text-green-800 border-green-300', label: 'QR Menu' };
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <QrCode className="w-4 h-4 text-primary" />
          QR Orders
          {pendingCount > 0 && (
            <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 animate-pulse">
              {pendingCount} new
            </Badge>
          )}
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setShowAddPlatformOrder(true)} className="text-xs h-7">
            <Plus className="w-3 h-3 mr-1" />
            Platform Order
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)} className="text-xs h-7">
            <Settings className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchOrders} className="text-xs h-7">
            Refresh
          </Button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <QrCode className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No QR orders today
        </div>
      ) : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {orders.map(order => (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={cn(
                'w-full text-left rounded-xl p-3 border transition-all hover:shadow-md',
                order.status === 'pending' ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20' : 'bg-card border-border'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">#{order.order_number}</span>
                  {order.customer_name && (
                    <span className="text-xs text-muted-foreground">· {order.customer_name}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Badge className={cn('text-[10px] px-1.5 border', getPlatformInfo(order.platform_type).color)}>
                    {getPlatformInfo(order.platform_type).icon} {getPlatformInfo(order.platform_type).label}
                  </Badge>
                  <Badge className={cn('text-[10px] px-1.5 border', getStatusColor(order.status))}>
                    {order.status}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-muted-foreground">
                  {order.items.length} items · {formatCurrency(order.total)}
                  {order.platform_order_id && (
                    <span className="ml-2 font-mono text-[10px]">({order.platform_order_id})</span>
                  )}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Clock className="w-3 h-3" /> {timeAgo(order.created_at)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Order #{selectedOrder?.order_number}
              {selectedOrder?.platform_type && (
                <Badge className={cn('text-xs', getPlatformInfo(selectedOrder.platform_type).color)}>
                  {getPlatformInfo(selectedOrder.platform_type).icon} {getPlatformInfo(selectedOrder.platform_type).label}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder?.customer_name && `Customer: ${selectedOrder.customer_name}`}
              {selectedOrder?.customer_phone && ` · ${selectedOrder.customer_phone}`}
              {selectedOrder?.platform_order_id && (
                <div className="mt-1 text-xs font-mono">
                  Platform ID: {selectedOrder.platform_order_id}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Platform-specific delivery info */}
              {(selectedOrder.platform_type === 'swiggy' || selectedOrder.platform_type === 'zomato') && (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Truck className="w-4 h-4" />
                    <span>Delivery Details</span>
                  </div>
                  {selectedOrder.delivery_address && (
                    <div className="text-xs">
                      <span className="font-medium">Address:</span> {selectedOrder.delivery_address}
                    </div>
                  )}
                  {selectedOrder.delivery_instructions && (
                    <div className="text-xs">
                      <span className="font-medium">Instructions:</span> {selectedOrder.delivery_instructions}
                    </div>
                  )}
                  {selectedOrder.estimated_delivery_time && (
                    <div className="text-xs">
                      <span className="font-medium">ETA:</span> {new Date(selectedOrder.estimated_delivery_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {(selectedOrder.delivery_fee || selectedOrder.platform_commission) && (
                    <div className="flex justify-between text-xs pt-1 border-t border-orange-200">
                      {selectedOrder.delivery_fee && selectedOrder.delivery_fee > 0 && (
                        <span>Delivery Fee: {formatCurrency(selectedOrder.delivery_fee)}</span>
                      )}
                      {selectedOrder.platform_commission && selectedOrder.platform_commission > 0 && (
                        <span>Commission: {formatCurrency(selectedOrder.platform_commission)}</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Items */}
              <div className="space-y-2">
                {selectedOrder.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.name} × {item.quantity}</span>
                    <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-sm">
                  <p className="font-medium text-xs text-yellow-700 dark:text-yellow-400 mb-1">Notes</p>
                  <p className="text-yellow-800 dark:text-yellow-300">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Print Button */}
              <Button variant="outline" className="w-full" onClick={() => manualPrint(selectedOrder)}>
                <Printer className="w-4 h-4 mr-2" /> Print KOT + Bill
              </Button>

              {/* Action buttons */}
              {selectedOrder.status === 'pending' && (
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => updateStatus(selectedOrder.id, 'accepted')}>
                    <Check className="w-4 h-4 mr-1" /> Accept
                  </Button>
                  <Button variant="destructive" onClick={() => updateStatus(selectedOrder.id, 'cancelled')}>
                    <X className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              )}
              {selectedOrder.status === 'accepted' && (
                <Button className="w-full" onClick={() => updateStatus(selectedOrder.id, 'preparing')}>
                  Start Preparing
                </Button>
              )}
              {selectedOrder.status === 'preparing' && (
                <Button className="w-full" onClick={() => updateStatus(selectedOrder.id, 'ready')}>
                  Mark Ready
                </Button>
              )}
              {selectedOrder.status === 'ready' && (
                <Button className="w-full" onClick={() => updateStatus(selectedOrder.id, 'completed')}>
                  Complete Order
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              QR Order Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Auto-Accept Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div>
                <p className="text-sm font-medium">Auto-Accept Orders</p>
                <p className="text-xs text-muted-foreground">Automatically accept new QR orders</p>
              </div>
              <input
                type="checkbox"
                checked={orderSettings.autoAcceptQROrders ?? true}
                onChange={(e) => {
                  const newSettings = { ...orderSettings, autoAcceptQROrders: e.target.checked };
                  updateConfig({ ...uiConfig, orderSettings: newSettings });
                }}
                className="w-5 h-5 rounded cursor-pointer"
              />
            </div>

            {/* Auto-Print Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div>
                <p className="text-sm font-medium">Auto-Print KOT & Bill</p>
                <p className="text-xs text-muted-foreground">Automatically print when order arrives</p>
              </div>
              <input
                type="checkbox"
                checked={orderSettings.autoPrintQROrders ?? true}
                onChange={(e) => {
                  const newSettings = { ...orderSettings, autoPrintQROrders: e.target.checked };
                  updateConfig({ ...uiConfig, orderSettings: newSettings });
                }}
                className="w-5 h-5 rounded cursor-pointer"
              />
            </div>

            {/* Alarm Sound Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div>
                <p className="text-sm font-medium">Play Order Alarm</p>
                <p className="text-xs text-muted-foreground">Loud alert sound for new orders</p>
              </div>
              <input
                type="checkbox"
                checked={orderSettings.playOrderAlarm ?? true}
                onChange={(e) => {
                  const newSettings = { ...orderSettings, playOrderAlarm: e.target.checked };
                  updateConfig({ ...uiConfig, orderSettings: newSettings });
                }}
                className="w-5 h-5 rounded cursor-pointer"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Platform Order Dialog */}
      <Dialog open={showAddPlatformOrder} onOpenChange={setShowAddPlatformOrder}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Platform Order
            </DialogTitle>
            <DialogDescription>
              Manually add orders from Swiggy or Zomato
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Platform Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Platform</Label>
              <select
                value={platformOrderData.platform_type}
                onChange={(e) => setPlatformOrderData(prev => ({ ...prev, platform_type: e.target.value as 'swiggy' | 'zomato' }))}
                className="w-full p-3 bg-secondary rounded-lg border-none"
              >
                <option value="swiggy">🍔 Swiggy</option>
                <option value="zomato">🍕 Zomato</option>
              </select>
            </div>

            {/* Platform Order ID */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Platform Order ID *</Label>
              <Input
                placeholder="Enter Swiggy/Zomato order ID"
                value={platformOrderData.platform_order_id}
                onChange={(e) => setPlatformOrderData(prev => ({ ...prev, platform_order_id: e.target.value }))}
              />
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Customer Name *</Label>
                <Input
                  placeholder="Customer name"
                  value={platformOrderData.customer_name}
                  onChange={(e) => setPlatformOrderData(prev => ({ ...prev, customer_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Phone</Label>
                <Input
                  placeholder="Phone number"
                  value={platformOrderData.customer_phone}
                  onChange={(e) => setPlatformOrderData(prev => ({ ...prev, customer_phone: e.target.value }))}
                />
              </div>
            </div>

            {/* Delivery Address */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Delivery Address</Label>
              <Textarea
                placeholder="Full delivery address"
                value={platformOrderData.delivery_address}
                onChange={(e) => setPlatformOrderData(prev => ({ ...prev, delivery_address: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Delivery Instructions */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Delivery Instructions</Label>
              <Textarea
                placeholder="Any special delivery instructions"
                value={platformOrderData.delivery_instructions}
                onChange={(e) => setPlatformOrderData(prev => ({ ...prev, delivery_instructions: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Order Notes</Label>
              <Textarea
                placeholder="Any additional notes"
                value={platformOrderData.notes}
                onChange={(e) => setPlatformOrderData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>

            <Button onClick={createPlatformOrder} className="w-full">
              <Plus className="w-4 h-4 mr-2" /> Create Platform Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
