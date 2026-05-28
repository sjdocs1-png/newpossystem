// Hook to force-download all store data on first login per device
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  setOrders, setInventory, setExpenses, setHeldBills, setTables,
  Order, InventoryItem, Expense, HeldBill, Table
} from '@/lib/store';
import { toast } from 'sonner';

const INIT_KEY_PREFIX = 'pos_initialized_';

export const useStoreInitializer = () => {
  const initInProgress = useRef(false);

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

  /**
   * Full cloud download for a store. Called on first login per device/store combo.
   * Downloads: orders (last 30 days), inventory, expenses, held_bills, tables, settings
   */
  const fullCloudDownload = useCallback(async (
    storeId: string, 
    isStoreLogin: boolean,
    callbacks: {
      onOrders: (orders: Order[]) => void;
      onInventory: (items: InventoryItem[]) => void;
      onExpenses: (expenses: Expense[]) => void;
      onHeldBills: (bills: HeldBill[]) => void;
      onTables: (tables: Table[]) => void;
    }
  ): Promise<boolean> => {
    console.log('[StoreInit] Starting full cloud download for store:', storeId);

    try {
      if (isStoreLogin) {
        // Use edge function for store login
        const storeCode = getStoreCode();
        
        // Fetch orders
        const { data: ordersResult } = await supabase.functions.invoke('sync-orders', {
          body: { action: 'fetch', store_id: storeId, store_code: storeCode }
        });
        
        if (ordersResult?.orders) {
          const orders: Order[] = ordersResult.orders.map((o: any) => ({
            id: o.id,
            billNumber: o.bill_number,
            items: o.items || [],
            subtotal: Number(o.subtotal),
            tax: Number(o.tax),
            discount: Number(o.discount),
            total: Number(o.total),
            status: o.status,
            orderType: o.order_type,
            tableNumber: o.table_number ? Number(o.table_number) : undefined,
            customerName: o.customer_name || undefined,
            customerPhone: o.customer_phone || undefined,
            paymentMethod: o.payment_method,
            createdAt: new Date(o.created_at),
            kotPrinted: false,
            billPrinted: o.status === 'completed',
            isDirectBill: true,
            storeId: o.store_id,
          }));
          setOrders(orders);
          callbacks.onOrders(orders);
          console.log('[StoreInit] Downloaded', orders.length, 'orders');
        }
        
        // Fetch inventory, expenses, held_bills via sync-store-data
        for (const dataType of ['inventory', 'expenses', 'held_bills', 'tables'] as const) {
          try {
            const { data } = await supabase.functions.invoke('sync-store-data', {
              body: { action: 'fetch', store_id: storeId, data_type: dataType, store_code: storeCode }
            });
            
            if (data?.items) {
              switch (dataType) {
                case 'inventory':
                  setInventory(data.items);
                  callbacks.onInventory(data.items);
                  break;
                case 'expenses':
                  setExpenses(data.items);
                  callbacks.onExpenses(data.items);
                  break;
                case 'held_bills':
                  setHeldBills(data.items);
                  callbacks.onHeldBills(data.items);
                  break;
                case 'tables':
                  setTables(data.items);
                  callbacks.onTables(data.items);
                  break;
              }
              console.log('[StoreInit] Downloaded', data.items.length, dataType);
            }
          } catch (err) {
            console.warn('[StoreInit] Failed to download', dataType, ':', err);
          }
        }
      } else {
        // Direct DB access for owner/admin
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Fetch orders
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .eq('store_id', storeId)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false });
        
        if (ordersData) {
          const orders: Order[] = ordersData.map((o: any) => ({
            id: o.id,
            billNumber: o.bill_number,
            items: o.items || [],
            subtotal: Number(o.subtotal),
            tax: Number(o.tax),
            discount: Number(o.discount),
            total: Number(o.total),
            status: o.status,
            orderType: o.order_type,
            tableNumber: o.table_number ? Number(o.table_number) : undefined,
            customerName: o.customer_name || undefined,
            customerPhone: o.customer_phone || undefined,
            paymentMethod: o.payment_method,
            createdAt: new Date(o.created_at),
            kotPrinted: false,
            billPrinted: o.status === 'completed',
            isDirectBill: true,
            storeId: o.store_id,
          }));
          setOrders(orders);
          callbacks.onOrders(orders);
          console.log('[StoreInit] Downloaded', orders.length, 'orders via direct DB');
        }

        // Fetch inventory
        const { data: invData } = await supabase
          .from('inventory_items')
          .select('*')
          .eq('store_id', storeId);
        if (invData) {
          const items = invData.map((i: any) => ({
            id: i.id,
            name: i.name,
            quantity: Number(i.quantity),
            unit: i.unit,
            minStock: Number(i.min_stock),
            costPerUnit: Number(i.cost_per_unit),
            costUnit: i.cost_unit || 'pcs',
            productionYield: i.production_yield ? Number(i.production_yield) : undefined,
            productionYieldUnit: i.production_yield_unit || undefined,
            lastUpdated: new Date(i.updated_at),
          }));
          setInventory(items);
          callbacks.onInventory(items);
        }

        // Fetch expenses
        const { data: expData } = await supabase
          .from('expenses')
          .select('*')
          .eq('store_id', storeId);
        if (expData) {
          const expenses = expData.map((e: any) => ({
            id: e.id,
            amount: Number(e.amount),
            category: e.category,
            description: e.description || '',
            date: new Date(e.date),
            paidBy: e.paid_by || '',
          }));
          setExpenses(expenses);
          callbacks.onExpenses(expenses);
        }

        // Fetch held bills
        const { data: hbData } = await supabase
          .from('held_bills')
          .select('*')
          .eq('store_id', storeId);
        if (hbData) {
          const bills = hbData.map((b: any) => ({
            id: b.id,
            items: b.items || [],
            tableNumber: b.table_number,
            customerName: b.customer_name || undefined,
            heldAt: new Date(b.held_at),
          }));
          setHeldBills(bills);
          callbacks.onHeldBills(bills);
        }
      }

      return true;
    } catch (err) {
      console.error('[StoreInit] Full cloud download failed:', err);
      return false;
    }
  }, [getStoreCode]);

  /**
   * Initialize store session - forces full download on first login per store
   */
  const initializeStoreSession = useCallback(async (
    storeId: string,
    isStoreLogin: boolean,
    callbacks: {
      onOrders: (orders: Order[]) => void;
      onInventory: (items: InventoryItem[]) => void;
      onExpenses: (expenses: Expense[]) => void;
      onHeldBills: (bills: HeldBill[]) => void;
      onTables: (tables: Table[]) => void;
    }
  ) => {
    if (initInProgress.current) return;
    initInProgress.current = true;

    const initKey = `${INIT_KEY_PREFIX}${storeId}`;
    const alreadyInitialized = localStorage.getItem(initKey);

    try {
      if (!alreadyInitialized) {
        console.log('[StoreInit] First login for store', storeId, '- starting full download');
        toast.info('Syncing store data...', { duration: 3000 });
        
        const success = await fullCloudDownload(storeId, isStoreLogin, callbacks);
        
        if (success) {
          localStorage.setItem(initKey, new Date().toISOString());
          toast.success('Store data synced successfully!');
        } else {
          toast.error('Some data failed to sync. Will retry.');
        }
      } else {
        console.log('[StoreInit] Store', storeId, 'already initialized on this device');
      }
    } finally {
      initInProgress.current = false;
    }
  }, [fullCloudDownload]);

  /**
   * Force re-sync (clear initialization flag and re-download)
   */
  const forceResync = useCallback(async (
    storeId: string,
    isStoreLogin: boolean,
    callbacks: {
      onOrders: (orders: Order[]) => void;
      onInventory: (items: InventoryItem[]) => void;
      onExpenses: (expenses: Expense[]) => void;
      onHeldBills: (bills: HeldBill[]) => void;
      onTables: (tables: Table[]) => void;
    }
  ) => {
    const initKey = `${INIT_KEY_PREFIX}${storeId}`;
    localStorage.removeItem(initKey);
    await initializeStoreSession(storeId, isStoreLogin, callbacks);
  }, [initializeStoreSession]);

  return {
    initializeStoreSession,
    forceResync,
  };
};
