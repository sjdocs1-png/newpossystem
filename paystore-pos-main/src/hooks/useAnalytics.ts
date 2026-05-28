import { useMemo, useCallback, useState, useEffect, useContext, useRef } from 'react';
import { POSContext } from '@/contexts/POSContext';
import { Order, CartItem } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { invokeFunctionWithResponseFallback } from '@/lib/invokeFunctionWithResponseFallback';
import { realtimeManager } from '@/lib/realtimeManager';
import { startOfDay, startOfWeek, startOfMonth, isAfter } from 'date-fns';
import { useOwnerStore } from './useOwnerStore';

export type TimeRange = 'today' | 'week' | 'month' | 'all';

export interface AnalyticsSummary {
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  preparingOrders: number;
  readyOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalSales: number;
  todaySales: number;
  weekSales: number;
  monthSales: number;
  avgOrderValue: number;
  totalTables: number;
  activeTables: number;
  availableTables: number;
  reservedTables: number;
  dineInOrders: number;
  takeawayOrders: number;
  deliveryOrders: number;
  onlineOrders: number;
  cashSales: number;
  cardSales: number;
  upiSales: number;
  splitSales: number;
  partSales: number;
  dueSales: number;
  kotCount: number;
  billCount: number;
  heldBillsCount: number;
}

export interface CategorySummary {
  id: string;
  name: string;
  itemCount: number;
  totalQty: number;
  totalAmount: number;
  percentage: number;
}

export interface ItemSummary {
  id: string;
  name: string;
  category: string;
  qty: number;
  amount: number;
  avgPrice: number;
}

export interface OrderTypeSummary {
  type: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface PaymentSummary {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface HourlySales {
  hour: string;
  orders: number;
  amount: number;
}

export interface CounterSummary {
  counter: string;
  orders: number;
  amount: number;
}

export interface CreditLedgerSummary {
  totalCreditSales: number;
  totalPaid: number;
  totalOutstanding: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

// Convert DB row to local Order format
const dbToLocalOrder = (dbOrder: any): Order => ({
  id: dbOrder.id,
  billNumber: dbOrder.bill_number,
  items: Array.isArray(dbOrder.items) ? dbOrder.items : [],
  subtotal: Number(dbOrder.subtotal),
  tax: Number(dbOrder.tax),
  discount: Number(dbOrder.discount),
  total: Number(dbOrder.total),
  status: dbOrder.status,
  orderType: dbOrder.order_type,
  tableNumber: dbOrder.table_number ? Number(dbOrder.table_number) : undefined,
  customerName: dbOrder.customer_name || undefined,
  customerPhone: dbOrder.customer_phone || undefined,
  paymentMethod: dbOrder.payment_method,
  createdAt: new Date(dbOrder.created_at),
  kotPrinted: false,
  billPrinted: dbOrder.status === 'completed',
  isDirectBill: true,
  cancelReason: dbOrder.cancel_reason || undefined,
  cancelledAt: dbOrder.cancelled_at || undefined,
  storeId: dbOrder.store_id,
});

// Get store_id from localStorage for store login mode
const getStoreIdFromStorage = (): string | null => {
  try {
    const storeData = localStorage.getItem('pos_active_store_data');
    if (storeData) {
      const parsed = JSON.parse(storeData);
      if (parsed?.id) return parsed.id;
    }
  } catch {}
  const activeStore = localStorage.getItem('pos_active_store');
  if (activeStore) {
    try { return JSON.parse(activeStore); } catch {}
  }
  return null;
};

const getStoreCodeFromStorage = (): string | null => {
  // Check direct key first
  const direct = localStorage.getItem('pos_store_code');
  if (direct) return direct;
  
  try {
    const storeData = localStorage.getItem('pos_active_store_data');
    if (storeData) {
      const parsed = JSON.parse(storeData);
      if (parsed?.storeCode) return parsed.storeCode;
      if (parsed?.store_code) return parsed.store_code;
    }
  } catch {}
  
  try {
    const storeLogin = localStorage.getItem('pos_store_login_data');
    if (storeLogin) {
      const parsed = JSON.parse(storeLogin);
      if (parsed?.store_code) return parsed.store_code;
    }
  } catch {}
  
  try {
    const session = localStorage.getItem('pos_store_session');
    if (session) {
      const parsed = JSON.parse(session);
      if (parsed?.store_code) return parsed.store_code;
      if (parsed?.storeCode) return parsed.storeCode;
    }
  } catch {}
  
  return null;
};

export const useAnalytics = (timeRange: TimeRange = 'today') => {
  const posContext = useContext(POSContext);
  const { selectedStoreId, isOwner } = useOwnerStore();

  const tables = posContext?.tables || [];
  const heldBills = posContext?.heldBills || [];
  const stores = posContext?.stores || [];
  const isStoreLogin = posContext?.isStoreLogin || false;

  // DB-fetched orders state
  const [dbOrders, setDbOrders] = useState<Order[]>([]);
  const [creditEntries, setCreditEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const ordersFetchRequestId = useRef(0);
  const ledgerFetchRequestId = useRef(0);
  const pendingOrderRefreshRef = useRef<number | null>(null);
  const pendingLedgerRefreshRef = useRef<number | null>(null);
  const lastHeartbeatRef = useRef<number | null>(null);

  // Determine which store_id to query
  const effectiveStoreId = useMemo(() => {
    if (isOwner && selectedStoreId) return selectedStoreId;
    return getStoreIdFromStorage();
  }, [isOwner, selectedStoreId]);

  // Convert QR order row to local Order format
  const qrToLocalOrder = (qr: any): Order => ({
    id: qr.id,
    billNumber: `QR-${qr.order_number}`,
    items: Array.isArray(qr.items) ? qr.items : [],
    subtotal: Number(qr.subtotal),
    tax: Number(qr.tax),
    discount: 0,
    total: Number(qr.total),
    status: 'completed',
    orderType: 'qr',
    customerName: qr.customer_name || undefined,
    customerPhone: qr.customer_phone || undefined,
    paymentMethod: 'cash',
    createdAt: new Date(qr.created_at),
    kotPrinted: false,
    billPrinted: true,
    isDirectBill: true,
    storeId: qr.store_id,
  });

  // Fetch orders from DB (including QR orders)
  const fetchOrdersFromDB = useCallback(async () => {
    if (!effectiveStoreId) {
      setDbOrders([]);
      return;
    }

    const requestId = ++ordersFetchRequestId.current;
    setIsLoading(true);
    try {
      if (isStoreLogin) {
        const { data, error } = await supabase.functions.invoke('sync-orders', {
          body: {
            action: 'fetch',
            store_id: effectiveStoreId,
            store_code: getStoreCodeFromStorage(),
          }
        });

        if (requestId !== ordersFetchRequestId.current) return;

        if (error || !isPlainObject(data) || data?.error) {
          console.error('[useAnalytics] Edge function fetch error:', error || data?.error || 'Invalid payload');
          setDbOrders(posContext?.orders || []);
          return;
        }

        const orders = Array.isArray(data.orders) ? data.orders.map(dbToLocalOrder) : [];
        setDbOrders(orders);
      } else {
        const [ordersRes, qrRes] = await Promise.all([
          supabase
            .from('orders')
            .select('*')
            .eq('store_id', effectiveStoreId)
            .order('created_at', { ascending: false }),
          supabase
            .from('qr_orders')
            .select('*')
            .eq('store_id', effectiveStoreId)
            .in('status', ['completed', 'ready', 'accepted', 'preparing'])
            .order('created_at', { ascending: false }),
        ]);

        if (requestId !== ordersFetchRequestId.current) return;

        if (ordersRes.error || !Array.isArray(ordersRes.data)) {
          console.error('[useAnalytics] DB fetch error:', ordersRes.error || 'Invalid orders response');
          setDbOrders(posContext?.orders || []);
          return;
        }

        const mainOrders = ordersRes.data.map(dbToLocalOrder);
        const existingBillNumbers = new Set(mainOrders.map((o) => o.billNumber));
        const graphQrOrders = Array.isArray(qrRes.data) ? qrRes.data : [];
        const unSyncedQrOrders = graphQrOrders
          .filter((qr: any) => !existingBillNumbers.has(`QR-${qr.order_number}`))
          .map(qrToLocalOrder);

        console.log(`[useAnalytics] Main orders: ${mainOrders.length}, Unsynced QR orders: ${unSyncedQrOrders.length}`);
        setDbOrders([...mainOrders, ...unSyncedQrOrders]);
      }
    } catch (err) {
      if (requestId !== ordersFetchRequestId.current) return;
      console.error('[useAnalytics] Fetch failed:', err);
      setDbOrders(posContext?.orders || []);
    } finally {
      if (requestId === ordersFetchRequestId.current) {
        setIsLoading(false);
      }
    }
  }, [effectiveStoreId, isStoreLogin]);

  const fetchCreditLedgerFromDB = useCallback(async () => {
    if (!effectiveStoreId) {
      setCreditEntries([]);
      return;
    }

    const requestId = ++ledgerFetchRequestId.current;
    try {
      const data = await invokeFunctionWithResponseFallback<{ items?: any[]; warning?: string }>('sync-store-data', {
        action: 'fetch',
        store_id: effectiveStoreId,
        store_code: isStoreLogin ? getStoreCodeFromStorage() : undefined,
        data_type: 'credit_ledger',
      });

      if (requestId !== ledgerFetchRequestId.current) return;
      if (!isPlainObject(data) || data?.warning || !Array.isArray(data.items)) {
        console.error('[useAnalytics] Credit ledger fetch via function failed:', data?.warning || 'Invalid response from function');
        if (!isStoreLogin) {
          const { data: directData, error: directError } = await supabase
            .from('credit_ledger')
            .select('*')
            .eq('store_id', effectiveStoreId)
            .order('created_at', { ascending: false });
          if (!directError && Array.isArray(directData)) {
            setCreditEntries(directData);
            return;
          }
          console.error('[useAnalytics] Direct DB credit ledger fetch failed:', directError);
        }
        setCreditEntries([]);
        return;
      }

      let ledgerItems = Array.isArray(data.items) ? data.items : [];
      if (ledgerItems.length === 0 && !isStoreLogin) {
        const { data: directData, error: directError } = await supabase
          .from('credit_ledger')
          .select('*')
          .eq('store_id', effectiveStoreId)
          .order('created_at', { ascending: false });
        if (!directError && Array.isArray(directData)) {
          ledgerItems = directData;
        } else {
          console.error('[useAnalytics] Direct DB fallback failed:', directError);
        }
      }

      if (requestId === ledgerFetchRequestId.current) {
        setCreditEntries(ledgerItems);
      }
    } catch (err) {
      if (requestId !== ledgerFetchRequestId.current) return;
      console.error('[useAnalytics] Credit ledger fetch failed:', err);
      setCreditEntries([]);
    }
  }, [effectiveStoreId, isStoreLogin]);

  const scheduleOrdersRefresh = useCallback(() => {
    if (pendingOrderRefreshRef.current != null) return;
    pendingOrderRefreshRef.current = window.setTimeout(() => {
      pendingOrderRefreshRef.current = null;
      fetchOrdersFromDB();
    }, 600) as unknown as number;
  }, [fetchOrdersFromDB]);

  const scheduleLedgerRefresh = useCallback(() => {
    if (pendingLedgerRefreshRef.current != null) return;
    pendingLedgerRefreshRef.current = window.setTimeout(() => {
      pendingLedgerRefreshRef.current = null;
      fetchCreditLedgerFromDB();
    }, 600) as unknown as number;
  }, [fetchCreditLedgerFromDB]);

  // Fetch on mount and when store changes
  useEffect(() => {
    fetchOrdersFromDB();
    fetchCreditLedgerFromDB();

    // Refresh every 60 seconds as fallback
    const interval = window.setInterval(() => { fetchOrdersFromDB(); fetchCreditLedgerFromDB(); }, 60000);
    return () => clearInterval(interval);
  }, [fetchOrdersFromDB, fetchCreditLedgerFromDB]);

  // Heartbeat monitor to ensure subscriptions stay healthy
  useEffect(() => {
    if (!effectiveStoreId) return;

    const heartbeatInterval = window.setInterval(() => {
      const diagnostics = realtimeManager.getDiagnostics().find((diag) => diag.key === `analytics-orders-${effectiveStoreId}`);
      if (!diagnostics) return;
      const lastEventAt = diagnostics.lastEventAt;
      if (lastEventAt && Date.now() - lastEventAt > 2 * 60 * 1000) {
        realtimeManager.refreshSubscription(`analytics-orders-${effectiveStoreId}`);
      }
    }, 60000);

    return () => window.clearInterval(heartbeatInterval);
  }, [effectiveStoreId]);

  // Supabase Realtime subscription for instant cross-device sync
  useEffect(() => {
    if (!effectiveStoreId) return;

    const ordersSubscriptionKey = `analytics-orders-${effectiveStoreId}`;
    const ledgerSubscriptionKey = `analytics-ledger-${effectiveStoreId}`;

    realtimeManager.subscribe({
      key: ordersSubscriptionKey,
      channelName: `orders-realtime-${effectiveStoreId}`,
      storeId: effectiveStoreId,
      eventConfigs: [
        { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${effectiveStoreId}` },
        { event: '*', schema: 'public', table: 'qr_orders', filter: `store_id=eq.${effectiveStoreId}` },
      ],
      onEvent: (payload) => {
        console.log('[useAnalytics] Realtime order update:', payload.eventType, payload.table);
        scheduleOrdersRefresh();
      },
      onStatus: (status) => {
        console.log('[useAnalytics] Realtime orders subscription status:', status);
      },
    });

    realtimeManager.subscribe({
      key: ledgerSubscriptionKey,
      channelName: `ledger-realtime-${effectiveStoreId}`,
      storeId: effectiveStoreId,
      eventConfigs: [
        { event: '*', schema: 'public', table: 'credit_ledger', filter: `store_id=eq.${effectiveStoreId}` },
        { event: '*', schema: 'public', table: 'credit_payments', filter: `store_id=eq.${effectiveStoreId}` },
      ],
      onEvent: (payload) => {
        console.log('[useAnalytics] Realtime ledger update:', payload.eventType, payload.table);
        scheduleLedgerRefresh();
      },
      onStatus: (status) => {
        console.log('[useAnalytics] Realtime ledger subscription status:', status);
      },
    });

    return () => {
      realtimeManager.unsubscribe(ordersSubscriptionKey);
      realtimeManager.unsubscribe(ledgerSubscriptionKey);
    };
  }, [effectiveStoreId, scheduleOrdersRefresh, scheduleLedgerRefresh]);

  // Use DB orders as primary source
  const orders = dbOrders.length > 0 ? dbOrders : (posContext?.orders || []);

  // Filter orders by time range
  const filteredOrders = useMemo(() => {
    const filtered = orders.filter(o => o.billPrinted || o.status === 'completed');

    if (timeRange === 'all') return filtered;

    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'today':
        startDate = startOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now);
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      default:
        startDate = startOfDay(now);
    }

    return filtered.filter(order =>
      isAfter(new Date(order.createdAt), startDate)
    );
  }, [orders, timeRange]);

  // All orders for status counts (not just billed)
  const allActiveOrders = useMemo(() => {
    const now = new Date();
    const startDate = startOfDay(now);
    return orders.filter(order =>
      !order.isDirectBill && isAfter(new Date(order.createdAt), startDate)
    );
  }, [orders]);

  // Core Summary
  const summary: AnalyticsSummary = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o =>
      new Date(o.createdAt).toDateString() === today && (o.billPrinted || o.status === 'completed')
    );

    const todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const totalSales = filteredOrders.reduce((sum, o) => sum + o.total, 0);

    const weekStart = startOfWeek(new Date());
    const monthStart = startOfMonth(new Date());
    const weekOrders = orders.filter(o => (o.billPrinted || o.status === 'completed') && isAfter(new Date(o.createdAt), weekStart));
    const monthOrders = orders.filter(o => (o.billPrinted || o.status === 'completed') && isAfter(new Date(o.createdAt), monthStart));

    return {
      totalOrders: filteredOrders.length,
      todayOrders: todayOrders.length,
      pendingOrders: allActiveOrders.filter(o => o.status === 'pending').length,
      preparingOrders: allActiveOrders.filter(o => o.status === 'preparing').length,
      readyOrders: allActiveOrders.filter(o => o.status === 'ready').length,
      completedOrders: allActiveOrders.filter(o => o.status === 'completed').length,
      cancelledOrders: allActiveOrders.filter(o => o.status === 'cancelled').length,
      totalSales,
      todaySales,
      weekSales: weekOrders.reduce((sum, o) => sum + o.total, 0),
      monthSales: monthOrders.reduce((sum, o) => sum + o.total, 0),
      avgOrderValue: filteredOrders.length > 0 ? Math.round(totalSales / filteredOrders.length) : 0,
      totalTables: tables.length,
      activeTables: tables.filter(t => t.status === 'occupied').length,
      availableTables: tables.filter(t => t.status === 'available').length,
      reservedTables: tables.filter(t => t.status === 'reserved').length,
      dineInOrders: filteredOrders.filter(o => o.orderType === 'dine-in').length,
      takeawayOrders: filteredOrders.filter(o => o.orderType === 'takeaway').length,
      deliveryOrders: filteredOrders.filter(o => o.orderType === 'delivery').length,
      onlineOrders: filteredOrders.filter(o => o.orderType === 'online').length,
      cashSales: filteredOrders.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0),
      cardSales: filteredOrders.filter(o => o.paymentMethod === 'card').reduce((s, o) => s + o.total, 0),
      upiSales: filteredOrders.filter(o => o.paymentMethod === 'upi').reduce((s, o) => s + o.total, 0),
      splitSales: filteredOrders.filter(o => o.paymentMethod === 'split').reduce((s, o) => s + o.total, 0),
      dueSales: filteredOrders.filter(o => o.paymentMethod === 'due').reduce((s, o) => s + o.total, 0),
      partSales: filteredOrders.filter(o => o.paymentMethod === 'part').reduce((s, o) => s + o.total, 0),
      kotCount: orders.filter(o => o.kotPrinted && new Date(o.createdAt).toDateString() === today).length,
      billCount: todayOrders.length,
      heldBillsCount: heldBills.length,
    };
  }, [filteredOrders, allActiveOrders, orders, tables, heldBills]);

  // Category Summary
  const categorySummary: CategorySummary[] = useMemo(() => {
    const categoryMap = new Map<string, { itemCount: number; totalQty: number; totalAmount: number }>();

    filteredOrders.forEach(order => {
      if (!Array.isArray(order.items)) return;
      order.items.forEach((item: any) => {
        const category = item.category || 'Uncategorized';
        const existing = categoryMap.get(category) || { itemCount: 0, totalQty: 0, totalAmount: 0 };
        categoryMap.set(category, {
          itemCount: existing.itemCount + 1,
          totalQty: existing.totalQty + (item.quantity || 1),
          totalAmount: existing.totalAmount + ((item.price || 0) * (item.quantity || 1))
        });
      });
    });

    const totalAmount = Array.from(categoryMap.values()).reduce((s, c) => s + c.totalAmount, 0);

    return Array.from(categoryMap.entries()).map(([name, data]) => ({
      id: name,
      name,
      itemCount: data.itemCount,
      totalQty: data.totalQty,
      totalAmount: data.totalAmount,
      percentage: totalAmount > 0 ? Math.round((data.totalAmount / totalAmount) * 100) : 0
    })).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredOrders]);

  // Item Summary
  const itemSummary: ItemSummary[] = useMemo(() => {
    const itemMap = new Map<string, { name: string; category: string; qty: number; amount: number }>();

    filteredOrders.forEach(order => {
      if (!Array.isArray(order.items)) return;
      order.items.forEach((item: any) => {
        const key = item.id || item.name;
        const existing = itemMap.get(key);
        if (existing) {
          existing.qty += (item.quantity || 1);
          existing.amount += (item.price || 0) * (item.quantity || 1);
        } else {
          itemMap.set(key, {
            name: item.name || 'Unknown',
            category: item.category || 'Uncategorized',
            qty: item.quantity || 1,
            amount: (item.price || 0) * (item.quantity || 1)
          });
        }
      });
    });

    return Array.from(itemMap.entries())
      .map(([id, data]) => ({
        id,
        ...data,
        avgPrice: data.qty > 0 ? Math.round(data.amount / data.qty) : 0
      }))
      .sort((a, b) => b.qty - a.qty);
  }, [filteredOrders]);

  // Order Type Summary
  const orderTypeSummary: OrderTypeSummary[] = useMemo(() => {
    const types = ['dine-in', 'takeaway', 'delivery', 'online', 'qr'];
    const total = filteredOrders.length;

    return types.map(type => {
      const typeOrders = filteredOrders.filter(o => o.orderType === type);
      return {
        type: type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '),
        count: typeOrders.length,
        amount: typeOrders.reduce((s, o) => s + o.total, 0),
        percentage: total > 0 ? Math.round((typeOrders.length / total) * 100) : 0
      };
    }).filter(t => t.count > 0);
  }, [filteredOrders]);

  // Payment Summary
  const paymentSummary: PaymentSummary[] = useMemo(() => {
    const methods = ['cash', 'card', 'upi', 'split', 'part', 'due'];
    const total = summary.totalSales;

    return methods.map(method => {
      const methodOrders = filteredOrders.filter(o => o.paymentMethod === method);
      const amount = methodOrders.reduce((s, o) => s + o.total, 0);
      return {
        method: method.charAt(0).toUpperCase() + method.slice(1),
        count: methodOrders.length,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0
      };
    }).filter(p => p.count > 0);
  }, [filteredOrders, summary.totalSales]);

  const creditSummary: CreditLedgerSummary = useMemo(() => {
    // If credit ledger entries are empty (function failing), fallback to computing from orders
    if (!creditEntries || creditEntries.length === 0) {
      const creditOrders = filteredOrders.filter(o => ['due', 'part', 'credit'].includes(o.paymentMethod));
      const totalCreditSales = creditOrders.reduce((s, o) => s + o.total, 0);
      const partialCount = creditOrders.filter(o => o.paymentMethod === 'part').length;
      const unpaidCount = creditOrders.filter(o => o.paymentMethod === 'due' || o.paymentMethod === 'credit').length;
      return {
        totalCreditSales,
        totalPaid: 0,
        totalOutstanding: totalCreditSales,
        paidCount: 0,
        partialCount,
        unpaidCount,
      };
    }

    const creditFiltered = creditEntries.filter(entry => {
      if (timeRange === 'all') return true;
      const now = new Date();
      let startDate: Date;
      switch (timeRange) {
        case 'today':
          startDate = startOfDay(now);
          break;
        case 'week':
          startDate = startOfWeek(now);
          break;
        case 'month':
          startDate = startOfMonth(now);
          break;
        default:
          startDate = startOfDay(now);
      }
      return isAfter(new Date(entry.created_at), startDate);
    });

    return {
      totalCreditSales: creditFiltered.reduce((sum, entry) => sum + Number(entry.total_amount || 0), 0),
      totalPaid: creditFiltered.reduce((sum, entry) => sum + Number(entry.paid_amount || 0), 0),
      totalOutstanding: creditFiltered.reduce((sum, entry) => sum + Number(entry.due_amount || 0), 0),
      paidCount: creditFiltered.filter(entry => entry.payment_status === 'paid').length,
      partialCount: creditFiltered.filter(entry => entry.payment_status === 'partial').length,
      unpaidCount: creditFiltered.filter(entry => entry.payment_status === 'unpaid').length,
    };
  }, [creditEntries, filteredOrders, timeRange]);

  // Hourly Sales (for today)
  const hourlySales: HourlySales[] = useMemo(() => {
    const hours: HourlySales[] = [];
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o =>
      new Date(o.createdAt).toDateString() === today && (o.billPrinted || o.status === 'completed')
    );

    for (let i = 0; i < 24; i++) {
      const hourOrders = todayOrders.filter(o =>
        new Date(o.createdAt).getHours() === i
      );
      hours.push({
        hour: `${i.toString().padStart(2, '0')}:00`,
        orders: hourOrders.length,
        amount: hourOrders.reduce((s, o) => s + o.total, 0)
      });
    }

    return hours;
  }, [orders]);

  // Top Selling Items
  const topSellingItems = useMemo(() => {
    return itemSummary.slice(0, 10);
  }, [itemSummary]);

  // Counter Summary (by store)
  const counterSummary: CounterSummary[] = useMemo(() => {
    if (stores.length === 0) {
      return [{
        counter: 'Default Counter',
        orders: filteredOrders.length,
        amount: summary.totalSales
      }];
    }

    return stores.map(store => {
      const storeOrders = filteredOrders.filter(o => o.storeId === store.id);
      return {
        counter: store.name,
        orders: storeOrders.length,
        amount: storeOrders.reduce((s, o) => s + o.total, 0)
      };
    });
  }, [filteredOrders, stores, summary.totalSales]);

  // Cover Size Summary (party size based on table capacity)
  const coverSizeSummary = useMemo(() => {
    const coverMap = new Map<number, { count: number; amount: number }>();

    filteredOrders
      .filter(o => o.orderType === 'dine-in' && o.tableNumber)
      .forEach(order => {
        const table = tables.find(t => t.number === order.tableNumber);
        const capacity = table?.capacity || 2;
        const existing = coverMap.get(capacity) || { count: 0, amount: 0 };
        coverMap.set(capacity, {
          count: existing.count + 1,
          amount: existing.amount + order.total
        });
      });

    return Array.from(coverMap.entries())
      .map(([size, data]) => ({
        coverSize: size,
        orders: data.count,
        amount: data.amount,
        avgPerCover: data.count > 0 ? Math.round(data.amount / (data.count * size)) : 0
      }))
      .sort((a, b) => a.coverSize - b.coverSize);
  }, [filteredOrders, tables]);

  // Tip Summary
  const tipSummary = useMemo(() => {
    const ordersWithTips = filteredOrders.filter(o => {
      const tipVal = (o as any).tip;
      return tipVal && tipVal > 0;
    });
    const totalTips = ordersWithTips.reduce((s, o) => s + ((o as any).tip || 0), 0);
    return {
      totalTips,
      tipCount: ordersWithTips.length,
      avgTip: ordersWithTips.length > 0 ? Math.round(totalTips / ordersWithTips.length) : 0,
      tipPercentage: summary.totalSales > 0 ? Math.round((totalTips / summary.totalSales) * 100) : 0
    };
  }, [filteredOrders, summary.totalSales]);

  // Discount Summary
  const discountSummary = useMemo(() => {
    const ordersWithDiscount = filteredOrders.filter(o => o.discount > 0);
    const totalDiscount = ordersWithDiscount.reduce((s, o) => s + o.discount, 0);

    return {
      totalDiscount,
      discountCount: ordersWithDiscount.length,
      avgDiscount: ordersWithDiscount.length > 0 ? Math.round(totalDiscount / ordersWithDiscount.length) : 0
    };
  }, [filteredOrders]);

  return {
    summary,
    categorySummary,
    itemSummary,
    orderTypeSummary,
    paymentSummary,
    hourlySales,
    topSellingItems,
    counterSummary,
    coverSizeSummary,
    tipSummary,
    discountSummary,
    filteredOrders,
    isLoading,
    creditSummary,
    refreshData: async () => { await fetchOrdersFromDB(); await fetchCreditLedgerFromDB(); },
  };
};
