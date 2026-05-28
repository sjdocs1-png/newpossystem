import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { realtimeManager } from '@/lib/realtimeManager';
import { CheckCircle2, Clock, ChefHat, Bell, Package, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playOrderSound } from '@/lib/orderSound';

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Clock, color: 'text-amber-500' },
  { key: 'accepted', label: 'Accepted', icon: CircleDot, color: 'text-blue-500' },
  { key: 'preparing', label: 'Preparing', icon: ChefHat, color: 'text-purple-500' },
  { key: 'ready', label: 'Ready!', icon: Bell, color: 'text-green-500' },
  { key: 'completed', label: 'Completed', icon: Package, color: 'text-gray-500' },
];

const OrderTrackingPage: React.FC = () => {
  const { storeCode, orderNumber } = useParams<{ storeCode: string; orderNumber: string }>();
  const [order, setOrder] = useState<any>(null);
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const prevStatus = useRef<string>('');

  useEffect(() => {
    if (!storeCode || !orderNumber) return;
    fetchOrder();
  }, [storeCode, orderNumber]);

  // Realtime subscription
  useEffect(() => {
    if (!order?.id) return;

    const subscription = realtimeManager.subscribe({
      key: `track-${order.id}`,
      channelName: `track-${order.id}`,
      storeId: order.id,
      eventConfigs: [
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'qr_orders',
          filter: `id=eq.${order.id}`,
        },
      ],
      dedupeKey: (payload) => {
        const updated = payload?.new as any;
        return updated?.id ? `${payload.eventType}:${updated.id}:${updated.updated_at || updated.created_at}` : null;
      },
      eventBatchMs: 150,
      onEvent: (payload) => {
        const updated = payload.new as any;
        if (!updated?.id) return;

        setOrder((prev) => {
          if (!prev) return updated;
          if (new Date(updated.updated_at).getTime() <= new Date(prev.updated_at).getTime()) {
            return prev;
          }
          return updated;
        });

        if (updated.status === 'ready' && prevStatus.current !== 'ready') {
          playOrderSound();

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🔔 Your order is READY!', {
              body: `Order #${updated.order_number} is ready for pickup`,
              icon: '/favicon.ico',
            });
          }
        }
        prevStatus.current = updated.status;
      },
    });

    return () => { realtimeManager.unsubscribe(subscription.config.key); };
  }, [order?.id]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      // First get store by store_code
      const { data: storeData } = await supabase
        .from('stores' as any)
        .select('id, store_name')
        .eq('store_code', storeCode!)
        .eq('is_active', true)
        .single();

      if (!storeData) throw new Error('Store not found');
      setStoreName((storeData as any).store_name);

      // Then get order
      const { data: orderData, error: orderErr } = await supabase
        .from('qr_orders')
        .select('*')
        .eq('store_id', (storeData as any).id)
        .eq('order_number', orderNumber!)
        .single();

      if (orderErr || !orderData) throw new Error('Order not found');
      setOrder(orderData);
      prevStatus.current = orderData.status;
    } catch (e: any) {
      setError(e.message || 'Order not found');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    const idx = STATUS_STEPS.findIndex(s => s.key === order.status);
    return idx >= 0 ? idx : 0;
  };

  const currentStep = getCurrentStepIndex();

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div className="text-center">
          <Clock className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Order Not Found</h1>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const isReady = order.status === 'ready';
  const isCompleted = order.status === 'completed';
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-4 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wider">{storeName}</p>
        <h1 className="text-xl font-bold text-gray-800 mt-1">Order #{order.order_number}</h1>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6 mt-4">
        {/* Status Banner */}
        {isReady && (
          <div className="bg-green-500 text-white rounded-2xl p-5 text-center animate-pulse shadow-lg">
            <Bell className="w-10 h-10 mx-auto mb-2" />
            <h2 className="text-xl font-bold">Your Order is READY! 🎉</h2>
            <p className="text-sm opacity-90 mt-1">Please pick up your order</p>
          </div>
        )}

        {isCancelled && (
          <div className="bg-red-500 text-white rounded-2xl p-5 text-center shadow-lg">
            <h2 className="text-xl font-bold">Order Cancelled ❌</h2>
            <p className="text-sm opacity-90 mt-1">This order has been cancelled</p>
          </div>
        )}

        {/* Progress Steps */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl p-5 shadow-md">
            <h3 className="font-bold text-sm text-gray-600 mb-4">Order Status</h3>
            <div className="space-y-0">
              {STATUS_STEPS.map((step, idx) => {
                const isActive = idx <= currentStep;
                const isCurrent = idx === currentStep;
                const Icon = step.icon;

                return (
                  <div key={step.key} className="flex items-start gap-3">
                    {/* Line + Dot */}
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all',
                        isCurrent ? `${step.color} border-current bg-white shadow-md scale-110` :
                        isActive ? 'text-green-500 border-green-500 bg-green-50' :
                        'text-gray-300 border-gray-200 bg-gray-50'
                      )}>
                        {isActive && !isCurrent ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div className={cn(
                          'w-0.5 h-8',
                          idx < currentStep ? 'bg-green-400' : 'bg-gray-200'
                        )} />
                      )}
                    </div>
                    {/* Label */}
                    <div className={cn('pt-1.5', isCurrent ? 'font-bold text-gray-800' : isActive ? 'text-gray-600' : 'text-gray-400')}>
                      <p className="text-sm">{step.label}</p>
                      {isCurrent && (
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {step.key === 'pending' && 'Waiting for confirmation...'}
                          {step.key === 'accepted' && 'Kitchen has accepted your order'}
                          {step.key === 'preparing' && 'Your food is being prepared 🍳'}
                          {step.key === 'ready' && 'Come and collect! 🎉'}
                          {step.key === 'completed' && 'Thank you for ordering! 🙏'}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-white rounded-2xl p-5 shadow-md">
          <h3 className="font-bold text-sm text-gray-600 mb-3">Order Details</h3>
          <div className="space-y-2">
            {(order.items as any[]).map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.name} × {item.quantity}</span>
                <span className="font-medium text-gray-800">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-orange-600">₹{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="text-center text-xs text-gray-400 pb-6">
          {order.customer_name} · {order.customer_phone}
          <br />
          <span className="text-[10px]">This page updates automatically</span>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
