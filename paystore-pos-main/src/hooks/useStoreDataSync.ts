// Hook for syncing inventory, expenses, held bills, and settings to cloud
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  InventoryItem, Expense, HeldBill, Table,
  setInventory,
  setExpenses,
  setHeldBills,
  setTables,
} from '@/lib/store';

const SYNC_INTERVAL = 90000; // 90 seconds

const getStoreId = (): string | null => {
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
    try { return JSON.parse(activeStore); } catch {}
  }
  return null;
};

const getStoreCode = (): string | null => {
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

let storeSessionInvalidated = false;

const clearStaleSession = () => {
  if (storeSessionInvalidated) return;
  storeSessionInvalidated = true;
  console.warn('[StoreSync] Invalid store detected, clearing stale session');
  localStorage.removeItem('pos_active_store');
  localStorage.removeItem('pos_active_store_data');
  localStorage.removeItem('pos_store_session');
  localStorage.removeItem('pos_is_store_login');
  localStorage.removeItem('pos_store_code');
  // Reset flag after a delay to allow re-login
  setTimeout(() => { storeSessionInvalidated = false; }, 5000);
  if (window.location.pathname !== '/' && window.location.pathname !== '/auth') {
    window.location.href = '/';
  }
};

const callSyncFunction = async (body: any) => {
  if (storeSessionInvalidated) return null;
  try {
    // Include store_code for authentication
    const store_code = getStoreCode();
    const authBody = store_code ? { ...body, store_code } : body;
    console.debug('[StoreSync] sync-store-data request body:', authBody);
    const { data, error } = await supabase.functions.invoke('sync-store-data', { body: authBody });
    console.debug('[StoreSync] sync-store-data response data:', data, 'error:', error);
    if (error) {
      const authStatus = (error as any)?.status ?? (error as any)?.statusCode ?? (error as any)?.status_code;
      const isAuthError = error.name === 'FunctionsHttpError' && (authStatus === 401 || authStatus === 403);
      const message = String(error.message || error.error_description || error.details || '');
      const isRefreshError = message.includes('Invalid Refresh Token') || message.includes('Refresh Token Not Found');

      let errorBody = '';
      try {
        if (typeof (error as any).context?.json === 'function') {
          const jsonBody = await (error as any).context.json();
          errorBody = JSON.stringify(jsonBody);
        }
      } catch {}
      const dataError = data ? String(data?.error || '') : '';
      const combinedError = (message + ' ' + errorBody + ' ' + dataError).trim();

      const shouldClearSession = isRefreshError
        || isAuthError
        || /invalid/i.test(combinedError)
        || /inactive/i.test(combinedError)
        || /authentication required/i.test(combinedError)
        || /access denied/i.test(combinedError);

      if (shouldClearSession) {
        console.warn('[StoreSync] Invalid auth detected, clearing stale session:', combinedError);
        clearStaleSession();
        return null;
      }

      console.warn('[StoreSync] Sync error, not clearing session:', combinedError);
      return null;
    }
    if (data?.error && (String(data.error).includes('Invalid') || String(data.error).includes('inactive') || String(data.error).includes('Authentication required') || String(data.error).includes('Access denied'))) {
      clearStaleSession();
      return null;
    }
    return data;
  } catch (err) {
    console.error('[StoreSync] Exception:', err);
    return null;
  }
};

// ===== INVENTORY SYNC =====
const dbToLocalInventory = (db: any): InventoryItem => ({
  id: db.id,
  name: db.name,
  quantity: Number(db.quantity),
  unit: db.unit,
  minStock: Number(db.min_stock),
  costPerUnit: Number(db.cost_per_unit),
  costUnit: db.cost_unit || 'pcs',
  lastUpdated: new Date(db.updated_at),
  productionYield: db.production_yield ? Number(db.production_yield) : undefined,
  productionYieldUnit: db.production_yield_unit || undefined,
});

const dbToLocalExpense = (db: any): Expense => ({
  id: db.id,
  category: db.category,
  amount: Number(db.amount),
  description: db.description || '',
  date: new Date(db.date),
  paidBy: db.paid_by || '',
  storeId: db.store_id,
});

const dbToLocalHeldBill = (db: any): HeldBill => ({
  id: db.id,
  items: db.items || [],
  tableNumber: db.table_number || undefined,
  customerName: db.customer_name || undefined,
  heldAt: new Date(db.held_at),
});

export const useStoreDataSync = () => {
  const syncInProgress = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync inventory
  const syncInventory = useCallback(async (localItems: InventoryItem[]): Promise<InventoryItem[]> => {
    const storeId = getStoreId();
    if (!storeId || !navigator.onLine) return localItems;

    try {
      // Save local to cloud
      if (localItems.length > 0) {
        await callSyncFunction({ action: 'save', store_id: storeId, data_type: 'inventory', items: localItems });
      }
      // Fetch from cloud
      const data = await callSyncFunction({ action: 'fetch', store_id: storeId, data_type: 'inventory' });
      if (data?.items?.length) {
        const cloudItems = data.items.map(dbToLocalInventory);
        // Merge: cloud wins
        const mergedMap = new Map<string, InventoryItem>();
        localItems.forEach(i => mergedMap.set(i.id, i));
        cloudItems.forEach(i => mergedMap.set(i.id, i));
        const merged = Array.from(mergedMap.values());
        setInventory(merged);
        return merged;
      }
    } catch (err) {
      console.error('[StoreSync] Inventory sync failed:', err);
    }
    return localItems;
  }, []);

  // Sync expenses
  const syncExpenses = useCallback(async (localItems: Expense[]): Promise<Expense[]> => {
    const storeId = getStoreId();
    if (!storeId || !navigator.onLine) return localItems;

    try {
      if (localItems.length > 0) {
        await callSyncFunction({ action: 'save', store_id: storeId, data_type: 'expenses', items: localItems });
      }
      const data = await callSyncFunction({ action: 'fetch', store_id: storeId, data_type: 'expenses' });
      if (data?.items?.length) {
        const cloudItems = data.items.map(dbToLocalExpense);
        const mergedMap = new Map<string, Expense>();
        localItems.forEach(i => mergedMap.set(i.id, i));
        cloudItems.forEach(i => mergedMap.set(i.id, i));
        const merged = Array.from(mergedMap.values());
        setExpenses(merged);
        return merged;
      }
    } catch (err) {
      console.error('[StoreSync] Expenses sync failed:', err);
    }
    return localItems;
  }, []);

  // Sync held bills
  const syncHeldBills = useCallback(async (localItems: HeldBill[]): Promise<HeldBill[]> => {
    const storeId = getStoreId();
    if (!storeId || !navigator.onLine) return localItems;

    try {
      if (localItems.length > 0) {
        await callSyncFunction({ action: 'save', store_id: storeId, data_type: 'held_bills', items: localItems });
      }
      const data = await callSyncFunction({ action: 'fetch', store_id: storeId, data_type: 'held_bills' });
      if (data?.items?.length) {
        const cloudItems = data.items.map(dbToLocalHeldBill);
        const mergedMap = new Map<string, HeldBill>();
        localItems.forEach(i => mergedMap.set(i.id, i));
        cloudItems.forEach(i => mergedMap.set(i.id, i));
        const merged = Array.from(mergedMap.values());
        setHeldBills(merged);
        return merged;
      }
    } catch (err) {
      console.error('[StoreSync] HeldBills sync failed:', err);
    }
    return localItems;
  }, []);

  // Sync tables
  const syncTables = useCallback(async (localItems: Table[]): Promise<Table[]> => {
    const storeId = getStoreId();
    if (!storeId || !navigator.onLine) return localItems;

    try {
      if (localItems.length > 0) {
        await callSyncFunction({ action: 'save', store_id: storeId, data_type: 'tables', items: localItems });
      }
      const data = await callSyncFunction({ action: 'fetch', store_id: storeId, data_type: 'tables' });
      if (data?.items?.length) {
        const cloudItems = data.items as Table[];
        const mergedMap = new Map<string, Table>();
        localItems.forEach(i => mergedMap.set(i.id, i));
        cloudItems.forEach(i => mergedMap.set(i.id, i));
        const merged = Array.from(mergedMap.values());
        setTables(merged);
        return merged;
      }
    } catch (err) {
      console.error('[StoreSync] Tables sync failed:', err);
    }
    return localItems;
  }, []);

  // Sync settings
  const syncSettings = useCallback(async () => {
    const storeId = getStoreId();
    if (!storeId || !navigator.onLine) return;

    try {
      // Gather local settings
      const settings: Record<string, any> = {
        tax_percent: localStorage.getItem('pos_tax_percent') || '5',
        bill_config: localStorage.getItem('pos_bill_config') || '{}',
        country: localStorage.getItem('pos_country') || 'IN',
      };

      await callSyncFunction({ action: 'save', store_id: storeId, data_type: 'settings', settings });

      // Fetch from cloud
      const data = await callSyncFunction({ action: 'fetch', store_id: storeId, data_type: 'settings' });
      if (data?.items?.length) {
        data.items.forEach((s: any) => {
          if (s.setting_key === 'tax_percent') localStorage.setItem('pos_tax_percent', String(s.setting_value));
          if (s.setting_key === 'bill_config') localStorage.setItem('pos_bill_config', typeof s.setting_value === 'string' ? s.setting_value : JSON.stringify(s.setting_value));
          if (s.setting_key === 'country') localStorage.setItem('pos_country', String(s.setting_value));
        });
      }
    } catch (err) {
      console.error('[StoreSync] Settings sync failed:', err);
    }
  }, []);

  // Save single item to cloud immediately
  const saveInventoryToCloud = useCallback(async (items: InventoryItem[]) => {
    const storeId = getStoreId();
    if (!storeId || !navigator.onLine || items.length === 0) return;
    await callSyncFunction({ action: 'save', store_id: storeId, data_type: 'inventory', items });
  }, []);

  const saveExpensesToCloud = useCallback(async (items: Expense[]) => {
    const storeId = getStoreId();
    if (!storeId || !navigator.onLine || items.length === 0) return;
    await callSyncFunction({ action: 'save', store_id: storeId, data_type: 'expenses', items });
  }, []);

  const saveHeldBillsToCloud = useCallback(async (items: HeldBill[]) => {
    const storeId = getStoreId();
    if (!storeId || !navigator.onLine || items.length === 0) return;
    await callSyncFunction({ action: 'save', store_id: storeId, data_type: 'held_bills', items });
  }, []);

  const deleteHeldBillFromCloud = useCallback(async (billId: string) => {
    const storeId = getStoreId();
    if (!storeId || !navigator.onLine) return;
    await callSyncFunction({ action: 'delete', store_id: storeId, data_type: 'held_bills', item_ids: [billId] });
  }, []);

  // Full periodic sync
  const startPeriodicSync = useCallback((
    getLocalInventory: () => InventoryItem[],
    getLocalExpenses: () => Expense[],
    getLocalHeldBills: () => HeldBill[],
    onInventorySync: (items: InventoryItem[]) => void,
    onExpensesSync: (items: Expense[]) => void,
    onHeldBillsSync: (items: HeldBill[]) => void,
    getLocalTables?: () => Table[],
    onTablesSync?: (items: Table[]) => void,
  ) => {
    if (syncTimerRef.current) clearInterval(syncTimerRef.current);

    const doSync = async () => {
      const storeId = getStoreId();
      if (!storeId) {
        console.log('[StoreSync] No store ID, skipping sync');
        return;
      }
      if (syncInProgress.current || !navigator.onLine) return;
      syncInProgress.current = true;
      try {
        const promises: Promise<any>[] = [
          syncInventory(getLocalInventory()),
          syncExpenses(getLocalExpenses()),
          syncHeldBills(getLocalHeldBills()),
        ];
        if (getLocalTables) {
          promises.push(syncTables(getLocalTables()));
        }
        const results = await Promise.all(promises);
        onInventorySync(results[0]);
        onExpensesSync(results[1]);
        onHeldBillsSync(results[2]);
        if (onTablesSync && results[3]) {
          onTablesSync(results[3]);
        }
        await syncSettings();
        console.log('[StoreSync] Full sync complete');
      } finally {
        syncInProgress.current = false;
      }
    };

    doSync();
    syncTimerRef.current = setInterval(doSync, SYNC_INTERVAL);

    const handleOnline = () => doSync();
    window.addEventListener('online', handleOnline);

    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
      window.removeEventListener('online', handleOnline);
    };
  }, [syncInventory, syncExpenses, syncHeldBills, syncTables, syncSettings]);

  return {
    syncInventory,
    syncExpenses,
    syncHeldBills,
    syncTables,
    syncSettings,
    saveInventoryToCloud,
    saveExpensesToCloud,
    saveHeldBillsToCloud,
    deleteHeldBillFromCloud,
    startPeriodicSync,
  };
};
