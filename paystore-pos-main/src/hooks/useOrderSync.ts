// Hook for syncing orders between localStorage and cloud
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Order, getOrders, setOrders } from '@/lib/store';
import { toast } from 'sonner';

const SYNC_INTERVAL = 60000; // 1 minute
const LAST_SYNC_KEY = 'pos_orders_last_sync';

// Convert DB order to local Order format
const dbToLocal = (dbOrder: any): Order => ({
  id: dbOrder.id,
  billNumber: dbOrder.bill_number,
  items: dbOrder.items || [],
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

// Global flag to prevent further sync after session invalidation
let sessionInvalidated = false;

export const useOrderSync = () => {
  const syncInProgress = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getStoreId = useCallback((): string | null => {
    try {
      const storeData = localStorage.getItem('pos_active_store_data');
      if (storeData) {
        const parsed = JSON.parse(storeData);
        if (parsed?.id) return parsed.id;
        if (parsed?.storeId) return parsed.storeId;
      }
    } catch {}
    
    const activeStore = localStorage.getItem('pos_active_store');
    if (activeStore) {
      try {
        return JSON.parse(activeStore);
      } catch {}
    }
    return null;
  }, []);

  const getStoreCode = useCallback((): string | null => {
    try {
      const storeData = localStorage.getItem('pos_active_store_data');
      if (storeData) {
        const parsed = JSON.parse(storeData);
        if (parsed?.storeCode) return parsed.storeCode;
      }
    } catch {}
    return null;
  }, []);

  // Save orders to cloud
  const saveOrdersToCloud = useCallback(async (ordersToSave: Order[]): Promise<boolean> => {
    if (sessionInvalidated) return false;
    const storeId = getStoreId();
    if (!storeId || ordersToSave.length === 0) return false;

    try {
      const { data, error } = await supabase.functions.invoke('sync-orders', {
        body: {
          action: 'save',
          store_id: storeId,
          store_code: getStoreCode(),
          orders: ordersToSave,
        }
      });

      if (error) {
        console.error('[OrderSync] Save error:', error);
        return false;
      }

      console.log('[OrderSync] Saved', data?.saved_count, 'orders to cloud');
      return true;
    } catch (err) {
      console.error('[OrderSync] Save failed:', err);
      return false;
    }
  }, [getStoreId]);

  // Fetch orders from cloud
  const clearStaleSession = () => {
    if (sessionInvalidated) return;
    sessionInvalidated = true;
    console.warn('[OrderSync] Invalid store detected, clearing stale session');
    if (syncTimerRef.current) { clearInterval(syncTimerRef.current); syncTimerRef.current = null; }
    localStorage.removeItem('pos_active_store');
    localStorage.removeItem('pos_active_store_data');
    localStorage.removeItem('pos_store_session');
    localStorage.removeItem('pos_is_store_login');
    localStorage.removeItem('pos_store_code');
    // Reset flag after delay to allow re-login
    setTimeout(() => { sessionInvalidated = false; }, 5000);
    if (window.location.pathname !== '/' && window.location.pathname !== '/auth') {
      window.location.href = '/';
    }
  };

  const fetchOrdersFromCloud = useCallback(async (): Promise<Order[]> => {
    if (sessionInvalidated) return [];
    const storeId = getStoreId();
    if (!storeId) return [];

    try {
      const lastSync = localStorage.getItem(LAST_SYNC_KEY);

      const { data, error } = await supabase.functions.invoke('sync-orders', {
        body: {
          action: 'fetch',
          store_id: storeId,
          store_code: getStoreCode(),
          last_sync_time: lastSync || undefined,
        }
      });

      if (error) {
        console.error('[OrderSync] Fetch error:', error);
        const authStatus = (error as any)?.status ?? (error as any)?.statusCode ?? (error as any)?.status_code;
        const isAuthError = error.name === 'FunctionsHttpError' && (authStatus === 401 || authStatus === 403);
        let errorBody = '';
        try {
          if (typeof (error as any).context?.json === 'function') {
            const jsonBody = await (error as any).context.json();
            errorBody = JSON.stringify(jsonBody);
          }
        } catch {}
        const dataError = data ? String(data?.error || '') : '';
        const combinedError = ((error.message || '') + ' ' + errorBody + ' ' + dataError).trim();

        const shouldClearSession = isAuthError
          || /invalid/i.test(combinedError)
          || /inactive/i.test(combinedError)
          || /authentication required/i.test(combinedError)
          || /access denied/i.test(combinedError);
        if (shouldClearSession) {
          clearStaleSession();
        } else {
          console.warn('[OrderSync] Non-auth error during order sync, keeping session alive:', combinedError);
        }
        return [];
      }
      if (data?.error && (String(data.error).includes('Invalid') || String(data.error).includes('inactive') || String(data.error).includes('Authentication required') || String(data.error).includes('Access denied'))) {
        clearStaleSession();
        return [];
      }

      const cloudOrders = (data?.orders || []).map(dbToLocal);
      console.log('[OrderSync] Fetched', cloudOrders.length, 'orders from cloud');
      return cloudOrders;
    } catch (err) {
      console.error('[OrderSync] Fetch failed:', err);
      return [];
    }
  }, [getStoreId]);

  // Full sync: merge local and cloud orders
  const syncOrders = useCallback(async (localOrders: Order[]): Promise<Order[]> => {
    if (syncInProgress.current) return localOrders;
    if (!navigator.onLine) return localOrders;

    const storeId = getStoreId();
    if (!storeId) return localOrders;

    syncInProgress.current = true;

    try {
      // 1. Save local orders to cloud
      const unsyncedOrders = localOrders.filter(o => {
        // Save all orders that have storeId matching current store
        return !o.storeId || o.storeId === storeId;
      });

      if (unsyncedOrders.length > 0) {
        await saveOrdersToCloud(unsyncedOrders);
      }

      // 2. Fetch orders from cloud
      const cloudOrders = await fetchOrdersFromCloud();

      // 3. Merge: cloud orders take precedence (newer updated_at)
      const mergedMap = new Map<string, Order>();
      
      // Add local orders first
      localOrders.forEach(o => mergedMap.set(o.id, o));
      
      // Cloud orders override local
      cloudOrders.forEach(o => mergedMap.set(o.id, o));

      const merged = Array.from(mergedMap.values());
      
      // 4. Save merged orders locally
      setOrders(merged);
      
      // 5. Update last sync time
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

      console.log('[OrderSync] Sync complete. Local:', localOrders.length, 'Cloud:', cloudOrders.length, 'Merged:', merged.length);
      
      return merged;
    } catch (err) {
      console.error('[OrderSync] Sync failed:', err);
      return localOrders;
    } finally {
      syncInProgress.current = false;
    }
  }, [getStoreId, saveOrdersToCloud, fetchOrdersFromCloud]);

  // Save a single order immediately to cloud (fire and forget)
  const saveOrderToCloud = useCallback(async (order: Order) => {
    if (!navigator.onLine) {
      console.log('[OrderSync] Offline - order saved locally only');
      return;
    }
    
    const storeId = getStoreId();
    if (!storeId) return;

    // Set storeId on order
    const orderWithStore = { ...order, storeId: storeId };
    
    try {
      await saveOrdersToCloud([orderWithStore]);
    } catch (err) {
      console.error('[OrderSync] Failed to save order to cloud:', err);
    }
  }, [getStoreId, saveOrdersToCloud]);

  // Start periodic sync
  const startPeriodicSync = useCallback((getLocalOrders: () => Order[], onSync: (orders: Order[]) => void) => {
    // Stop existing timer
    if (syncTimerRef.current) {
      clearInterval(syncTimerRef.current);
    }

    // Initial sync
    const doSync = async () => {
      const storeId = getStoreId();
      if (!storeId) {
        console.log('[OrderSync] No store ID, skipping sync');
        return;
      }
      const merged = await syncOrders(getLocalOrders());
      if (merged !== getLocalOrders()) {
        onSync(merged);
      }
    };

    doSync();

    // Periodic sync
    syncTimerRef.current = setInterval(doSync, SYNC_INTERVAL);

    // Sync when coming back online
    const handleOnline = () => {
      toast.info('Back online - syncing orders...');
      doSync();
    };
    window.addEventListener('online', handleOnline);

    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
      }
      window.removeEventListener('online', handleOnline);
    };
  }, [syncOrders]);

  return {
    syncOrders,
    saveOrderToCloud,
    fetchOrdersFromCloud,
    startPeriodicSync,
  };
};
