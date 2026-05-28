import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { realtimeManager } from '@/lib/realtimeManager';
import { useUICustomization } from '@/hooks/useUICustomization';
import { smartPrint } from '@/lib/printUtils';
import { generateProfessionalBill } from '@/lib/billTemplate';
import { playOrderSound } from '@/lib/orderSound';

interface OnlineOrder {
  id: string;
  platform: string;
  platform_order_id: string;
  items: Array<{ name: string; quantity: number; price: number; notes?: string }>;
  subtotal: number;
  tax: number;
  delivery_charge: number;
  total: number;
  commission_percentage: number;
  commission_amount: number;
  net_receivable: number;
  status: string;
  created_at: string;
}

interface QROrder {
  id: string;
  order_number: string;
  table_number: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  items: Array<{ name: string; quantity: number; price: number; notes?: string }>;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  notes: string | null;
  created_at: string;
}

const DEFAULT_ORDER_SETTINGS = {
  autoAcceptOrders: true,
  billPrintAfterAutoaccept: true,
  playSound: true,
};

const getStoreData = () => {
  try {
    const data = localStorage.getItem('pos_active_store_data');
    if (!data) return null;
    const parsed = JSON.parse(data);
    return {
      storeId: parsed?.id as string | null,
      storeName: parsed?.store_name as string | 'Store',
    };
  } catch {
    return null;
  }
};

const buildBillHtml = (order: OnlineOrder | QROrder, source: 'online_orders' | 'qr_orders', storeName: string): string => {
  const items = (order as OnlineOrder | QROrder).items || [];
  const bill = {
    id: order.id,
    billNumber:
      source === 'online_orders'
        ? `ON-${(order as OnlineOrder).platform_order_id || order.id.slice(-6)}`
        : `QR-${(order as QROrder).order_number || order.id.slice(-6)}`,
    createdAt: order.created_at,
    orderType: source === 'online_orders' ? `${(order as OnlineOrder).platform?.toUpperCase() || 'Online'} Order` : 'QR Order',
    tableNumber: source === 'qr_orders' ? (order as QROrder).table_number || undefined : undefined,
    customerName: source === 'qr_orders' ? (order as QROrder).customer_name || undefined : undefined,
    customerPhone: source === 'qr_orders' ? (order as QROrder).customer_phone || undefined : undefined,
    items: items.map(item => ({
      name: item.name,
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0,
      notes: item.notes,
    })),
    subtotal: Number((order as any).subtotal) || 0,
    tax: Number((order as any).tax) || 0,
    discount: 0,
    deliveryCharge: source === 'online_orders' ? Number((order as OnlineOrder).delivery_charge || 0) : undefined,
    total: Number((order as any).total) || 0,
    paymentMethod: 'Pending',
  };

  return generateProfessionalBill(bill as any, { showQRCode: false });
};

const acceptOrder = async (orderId: string, source: 'online_orders' | 'qr_orders') => {
  const updates = source === 'online_orders'
    ? { status: 'accepted' }
    : { status: 'accepted', updated_at: new Date().toISOString() };

  const { error } = await supabase
    .from(source)
    .update(updates)
    .eq('id', orderId);

  if (error) {
    console.error('[OnlineOrderListener] Failed to accept order', error);
    return false;
  }

  console.log('[OnlineOrderListener] Order auto-accepted', orderId, source);
  return true;
};

const printOrder = (order: OnlineOrder | QROrder, source: 'online_orders' | 'qr_orders', storeName: string) => {
  try {
    const billHtml = buildBillHtml(order, source, storeName);
    smartPrint(billHtml, () => {
      console.log('[OnlineOrderListener] Bill printed', order.id);
    });
  } catch (error) {
    console.error('[OnlineOrderListener] Print failed', error);
  }
};

export const OnlineOrderListener = () => {
  const { config: uiConfig } = useUICustomization();
  const processedOrderIdsRef = useRef<Set<string>>(new Set());

  const orderSettings = uiConfig.orderSettings || {};
  const settings = {
    ...DEFAULT_ORDER_SETTINGS,
    autoAcceptOrders: orderSettings.autoAcceptOrders ?? orderSettings.autoAcceptQROrders ?? true,
    billPrintAfterAutoaccept: orderSettings.billPrintAfterAutoaccept ?? orderSettings.autoPrintQROrders ?? true,
    playSound: orderSettings.playSound ?? orderSettings.playOrderAlarm ?? true,
  };

  const handleIncomingOrder = useCallback(async (order: OnlineOrder | QROrder, source: 'online_orders' | 'qr_orders') => {
    if (!order?.id || processedOrderIdsRef.current.has(order.id)) {
      return;
    }

    processedOrderIdsRef.current.add(order.id);
    console.log('[OnlineOrderListener] New order received', { id: order.id, source, settings });

    // 🔔 PLAY SOUND FIRST
    if (settings.playSound) {
      console.log('[OnlineOrderListener] Playing order sound...');
      playOrderSound();
    } else {
      console.log('[OnlineOrderListener] Sound disabled in settings');
    }

    toast.info(`🔔 New order received (${source === 'online_orders' ? 'Online' : 'QR'})`);

    // ✅ AUTO ACCEPT
    if (!settings.autoAcceptOrders) {
      console.log('[OnlineOrderListener] Auto-accept disabled');
      return;
    }

    const accepted = await acceptOrder(order.id, source);
    if (!accepted) {
      processedOrderIdsRef.current.delete(order.id);
      toast.error('Auto accept failed');
      return;
    }

    toast.success('Order auto-accepted');

    // 🧾 AUTO PRINT
    if (settings.billPrintAfterAutoaccept) {
      console.log('[OnlineOrderListener] Auto-printing bill...');
      printOrder(order, source, getStoreData()?.storeName || 'Store');
    } else {
      console.log('[OnlineOrderListener] Auto-print disabled');
    }
  }, [settings]);

  useEffect(() => {
    const storeData = getStoreData();
    if (!storeData?.storeId) {
      return;
    }

    const subscription = realtimeManager.subscribe({
      key: `global-online-order-listener-${storeData.storeId}`,
      channelName: `global-online-order-listener-${storeData.storeId}`,
      storeId: storeData.storeId,
      eventConfigs: [
        {
          event: 'INSERT',
          schema: 'public',
          table: 'online_orders',
          filter: `store_id=eq.${storeData.storeId}`,
        },
        {
          event: 'INSERT',
          schema: 'public',
          table: 'qr_orders',
          filter: `store_id=eq.${storeData.storeId}`,
        },
      ],
      dedupeKey: (payload) => {
        const orderId = payload?.new?.id;
        return orderId ? `${payload.eventType}:${payload.table || payload?.new?.table}:${orderId}` : null;
      },
      eventBatchMs: 100,
      onEvent: (payload) => {
        const order = payload.new as OnlineOrder | QROrder;
        if (!order || order.status !== 'pending') return;

        const source = payload.table === 'qr_orders' ? 'qr_orders' : 'online_orders';
        handleIncomingOrder(order, source);
      },
    });

    return () => {
      realtimeManager.unsubscribe(subscription.config.key);
    };
  }, [uiConfig.orderSettings, handleIncomingOrder]);

  return null;
};
