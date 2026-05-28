// POS Context - Force rebuild timestamp: 2026-02-09T12:00
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { invokeFunctionWithResponseFallback } from '@/lib/invokeFunctionWithResponseFallback';
import { normalizeCustomerReference } from '@/lib/customerReference';
import { showLowStockAlert, showOutOfStockAlert } from '@/lib/notifications';
import { formatQuantityDisplay, convertToBaseUnit } from '@/lib/inventoryUtils';
import { useOrderSync } from '@/hooks/useOrderSync';
import { useStoreDataSync } from '@/hooks/useStoreDataSync';
import { useStoreInitializer } from '@/hooks/useStoreInitializer';
import {
  MenuItem,
  MenuItemIngredient,
  CartItem,
  Category,
  Order,
  HeldBill,
  Table,
  Store,
  getCategories,
  getOrders,
  setOrders,
  getHeldBills,
  setHeldBills,
  getTables,
  setTables,
  setCategories,
  getStores,
  setStores as setStoresStorage,
  getActiveStore,
  setActiveStore as setActiveStoreStorage,
  initializeData,
  generateId,
  generateBillNumber,
  generateKOTNumber,
  generateStoreCode,
  addOrder as addOrderToStorage,
  defaultCategories,
  getInventory,
  setInventory,
  getExpenses,
  setExpenses,
  Expense,
} from '@/lib/store';

interface POSContextType {
  // Menu & Categories
  menuItems: MenuItem[];
  categories: Category[];
  activeCategory: string;
  setActiveCategory: (id: string) => void;
  toggleItemAvailability: (id: string) => void;
  addMenuItems: (items: Omit<MenuItem, 'id' | 'isAvailable'>[]) => void;
  addCategory: (category: Omit<Category, 'color'>) => void;
  deleteMenuItem: (id: string) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  syncCategoriesFromMenu: () => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartTax: number;
  cartTotal: number;
  discount: number;
  setDiscount: (amount: number) => void;

  // Orders
  orders: Order[];
  recentBills: Order[]; // Completed bills for recent display
  currentOrderType: 'dine-in' | 'takeaway' | 'delivery' | 'online';
  setCurrentOrderType: (type: 'dine-in' | 'takeaway' | 'delivery' | 'online') => void;
  selectedTable: Table | null;
  setSelectedTable: (table: Table | null) => void;
  placeOrder: (paymentMethod: 'cash' | 'card' | 'upi' | 'split' | 'due' | 'part' | 'wallet' | 'credit') => Promise<Order | null> | Order | null;
  createKOTOrder: () => Promise<Order | null>; // Create order for KOT only (no sales)
  printBillForOrder: (orderId: string, paymentMethod: 'cash' | 'card' | 'upi' | 'split' | 'due' | 'part' | 'wallet' | 'credit') => Promise<Order | null>; // Print bill for existing KOT order
  directBillPrint: (paymentMethod: 'cash' | 'card' | 'upi' | 'split' | 'due' | 'part' | 'wallet' | 'credit', customerName?: string, customerPhone?: string) => Promise<Order | null>; // Direct bill without KOT (not in orders)
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  updateOrderPaymentMethod: (orderId: string, paymentMethod: Order['paymentMethod']) => void;
  cancelOrder: (orderId: string, reason?: string) => void;
  clearAllOrders: () => void;
  
  // Held Bills
  heldBills: HeldBill[];
  holdBill: () => void;
  recallBill: (billId: string) => void;
  deleteHeldBill: (billId: string) => void;
  getTableHeldBills: (tableNumber?: number) => HeldBill[]; // Get held bills for a specific table

  // Tables
  tables: Table[];
  updateTableStatus: (tableId: string, status: 'available' | 'occupied' | 'reserved') => void;

  // KOT
  printKOT: (order: Order) => void;

  // Online status
  isOnline: boolean;

  // Today's stats
  todayStats: {
    totalSales: number;
    orderCount: number;
    avgOrderValue: number;
  };

  // Stores
  stores: Store[];
  activeStore: Store | null;
  setActiveStoreId: (storeId: string | null) => void;
  addStore: (store: Omit<Store, 'id' | 'createdAt' | 'isActive' | 'storeCode'> & { email?: string }) => Store;
  loginStore: (storeCode: string, password: string) => Promise<Store | null>;
  logoutStore: () => void;
  updateStore: (id: string, updates: Partial<Store>) => void;
  deleteStore: (id: string) => void;
  getStoreSales: (storeId: string) => number;
  isStoreLogin: boolean; // True when logged in via store login (not owner login)

  // Low stock items
  lowStockItems: MenuItem[];
}

export const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItemsState] = useState<MenuItem[]>([]);
  const [categories, setCategoriesState] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrdersState] = useState<Order[]>([]);
  const [heldBills, setHeldBillsState] = useState<HeldBill[]>([]);
  const [tables, setTablesState] = useState<Table[]>([]);
  const [currentOrderType, setCurrentOrderType] = useState<'dine-in' | 'takeaway' | 'delivery' | 'online'>('dine-in');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [discount, setDiscount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [stores, setStoresState] = useState<Store[]>([]);
  const [activeStoreId, setActiveStoreIdState] = useState<string | null>(null);
  const [isStoreLogin, setIsStoreLogin] = useState<boolean>(() => {
    return localStorage.getItem('pos_is_store_login') === 'true';
  });

  // Helper to get store_code for edge function auth
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

  const getCurrentStoreId = useCallback((): string | null => {
    try {
      const storeData = localStorage.getItem('pos_active_store_data');
      if (storeData) {
        const parsed = JSON.parse(storeData);
        return parsed?.id || null;
      }
    } catch {
      return null;
    }
    return null;
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsStoreLogin(false);
        localStorage.removeItem('store_login');
        localStorage.removeItem('pos_store_session');
        localStorage.removeItem('pos_store_login_data');
        localStorage.removeItem('pos_is_store_login');
        localStorage.removeItem('pos_store_code');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Order cloud sync
  const { saveOrderToCloud, startPeriodicSync: startOrderSync } = useOrderSync();

  // Store data cloud sync (inventory, expenses, held bills, settings)
  const { startPeriodicSync: startStoreDataSync, deleteHeldBillFromCloud, saveHeldBillsToCloud } = useStoreDataSync();

  // Store initializer for first-time login full download
  const { initializeStoreSession } = useStoreInitializer();

  // Fetch menu items from database based on active store (with ingredients)
  const fetchMenuItems = useCallback(async (storeId: string | null) => {
    if (!storeId) {
      setMenuItemsState([]);
      return;
    }

    try {
      let data: any[] | null = null;
      let ingredientsData: any[] = [];
      let variationsData: any[] = [];

      if (isStoreLogin) {
        // Use edge function for store login (no auth session)
        const { data: result, error: fnError } = await supabase.functions.invoke('sync-store-data', {
          body: { action: 'fetch', store_id: storeId, data_type: 'menu_items', store_code: getStoreCode() }
        });
        if (fnError || result?.error) {
          console.error('Error fetching menu items via edge function:', fnError || result?.error);
          toast.error('Failed to load menu items');
          return;
        }
        data = result?.items || [];
        ingredientsData = result?.ingredients || [];
        variationsData = result?.variations || [];
      } else {
        // Direct DB access for authenticated users
        const { data: dbData, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('store_id', storeId);

        if (error) {
          console.error('Error fetching menu items:', error);
          toast.error('Failed to load menu items');
          return;
        }
        data = dbData;
      }

      // Fetch all ingredients for this store's menu items
      const menuItemIds = (data || []).map(item => item.id);
      const ingredientsMap: Record<string, MenuItemIngredient[]> = {};
      const variationsMap: Record<string, MenuItem['variations']> = {};
      
      if (menuItemIds.length > 0) {
        // For store login, ingredientsData and variationsData are already fetched
        if (isStoreLogin) {
          ingredientsData.forEach((ing: any) => {
            if (!ingredientsMap[ing.menu_item_id]) {
              ingredientsMap[ing.menu_item_id] = [];
            }
            ingredientsMap[ing.menu_item_id].push({
              id: ing.id,
              inventoryItemId: ing.inventory_item_id,
              quantityRequired: Number(ing.quantity_required),
              unit: ing.unit
            });
          });
          variationsData.forEach((variation: any) => {
            if (!variationsMap[variation.menu_item_id]) {
              variationsMap[variation.menu_item_id] = [];
            }
            variationsMap[variation.menu_item_id]!.push({
              id: variation.id,
              menuItemId: variation.menu_item_id,
              name: variation.name,
              sku: variation.sku || undefined,
              price: Number(variation.price),
              isAvailable: variation.is_available,
              stock: variation.stock || undefined,
              sortOrder: variation.sort_order,
              unit: variation.unit || undefined,
            });
          });
        } else {
          // Fetch ingredients directly for authenticated users
          const { data: ingsData, error: ingredientsError } = await supabase
            .from('menu_item_ingredients')
            .select('*')
            .in('menu_item_id', menuItemIds);

          if (!ingredientsError && ingsData) {
            ingsData.forEach(ing => {
              if (!ingredientsMap[ing.menu_item_id]) {
                ingredientsMap[ing.menu_item_id] = [];
              }
              ingredientsMap[ing.menu_item_id].push({
                id: ing.id,
                inventoryItemId: ing.inventory_item_id,
                quantityRequired: Number(ing.quantity_required),
                unit: ing.unit
              });
            });
          }

          // Fetch variations
          const { data: varsData, error: variationsError } = await supabase
            .from('menu_item_variations')
            .select('*')
            .in('menu_item_id', menuItemIds)
            .order('sort_order', { ascending: true });

          if (!variationsError && varsData) {
            varsData.forEach(variation => {
              if (!variationsMap[variation.menu_item_id]) {
                variationsMap[variation.menu_item_id] = [];
              }
              variationsMap[variation.menu_item_id]!.push({
                id: variation.id,
                menuItemId: variation.menu_item_id,
                name: variation.name,
                sku: variation.sku || undefined,
                price: Number(variation.price),
                isAvailable: variation.is_available,
                stock: variation.stock || undefined,
                sortOrder: variation.sort_order,
                unit: variation.unit || undefined,
              });
            });
          }
        }
      }

      const items: MenuItem[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        nameHindi: item.name_hindi || undefined,
        price: Number(item.price),
        category: item.category,
        image: item.image_url || undefined,
        isAvailable: item.is_available,
        preparationTime: item.preparation_time || undefined,
        stock: item.stock || undefined,
        linkedInventoryId: item.linked_inventory_id || undefined,
        gramagePerUnit: item.gramage_per_unit ? Number(item.gramage_per_unit) : undefined,
        ingredients: ingredientsMap[item.id] || [],
        sku: (item as Record<string, unknown>).sku as string | undefined,
        barcode: (item as Record<string, unknown>).barcode as string | undefined,
        variations: variationsMap[item.id] || [],
      }));

      setMenuItemsState(items);

      // Sync categories from menu items AND save to DB
      const uniqueCategoryIds = [...new Set(items.map(item => item.category).filter(Boolean))];
      
      const menuCategories: Category[] = uniqueCategoryIds.map(catId => ({
        id: catId,
        name: catId.charAt(0).toUpperCase() + catId.slice(1).replace(/-/g, ' '),
        icon: '📦',
        color: 'cat-food'
      }));

      if (menuCategories.length > 0) {
        setCategoriesState(menuCategories);
        // Save categories to DB
        const stId = storeId;
        if (stId) {
          try {
            if (isStoreLogin) {
              await supabase.functions.invoke('sync-store-data', {
                body: { action: 'save', store_id: stId, data_type: 'categories', store_code: getStoreCode(), items: menuCategories }
              });
            } else {
              // Direct DB: delete and re-insert
              await supabase.from('store_categories').delete().eq('store_id', stId);
              if (menuCategories.length > 0) {
                await supabase.from('store_categories').insert(
                  menuCategories.map((c, idx) => ({
                    store_id: stId,
                    category_id: c.id,
                    name: c.name,
                    icon: c.icon,
                    color: c.color,
                    sort_order: idx,
                  }))
                );
              }
            }
          } catch (e) {
            console.error('Failed to save categories to DB:', e);
          }
        }
      }

      // Check for low stock items
      const lowStock = items.filter(item => {
        if (item.stockAlertThreshold !== undefined && item.stock !== undefined) {
          return item.stock <= item.stockAlertThreshold && item.stock > 0;
        }
        return false;
      });

      const outOfStock = items.filter(item => item.stock === 0);

      if (lowStock.length > 0) {
        toast.warning(`${lowStock.length} items have low stock!`, {
          description: lowStock.slice(0, 3).map(i => `${i.name} (${i.stock})`).join(', ')
        });
        
        if (localStorage.getItem('push_notifications_enabled') === 'true') {
          showLowStockAlert(lowStock.map(i => ({ name: i.name, stock: i.stock || 0 })));
        }
      }

      if (outOfStock.length > 0 && localStorage.getItem('push_notifications_enabled') === 'true') {
        showOutOfStockAlert(outOfStock.map(i => ({ name: i.name })));
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  }, [isStoreLogin]);

  // Validate and sync store data from database
  const validateStoreLogin = useCallback(async () => {
    if (isStoreLogin) {
      const storedData = localStorage.getItem('pos_active_store_data');
      if (!storedData) {
        setIsStoreLogin(false);
        setActiveStoreIdState(null);
        return;
      }
      
      try {
        const store = JSON.parse(storedData);
        if (!store?.id || !store?.storeCode) {
          localStorage.removeItem('pos_active_store_data');
          localStorage.removeItem('pos_is_store_login');
          setIsStoreLogin(false);
          setActiveStoreIdState(null);
          toast.error('Store session invalid. Please login again.');
          return;
        }

        // Validate store actually exists in DB via edge function
        try {
          const { data, error } = await supabase.functions.invoke('sync-store-data', {
            body: { action: 'fetch', store_id: store.id, data_type: 'settings', store_code: getStoreCode() }
          });
          if (error || data?.error) {
            console.warn('Store validation failed, clearing stale session:', data?.error || error);
            localStorage.removeItem('pos_active_store_data');
            localStorage.removeItem('pos_is_store_login');
            localStorage.removeItem('pos_active_store');
            setIsStoreLogin(false);
            setActiveStoreIdState(null);
            toast.error('Store session expired or invalid. Please login again.');
            return;
          }
        } catch (validationError) {
          console.warn('Store validation network error, keeping session:', validationError);
          // Network error - keep session (offline mode)
        }
      } catch (e) {
        console.error('Error validating store:', e);
        localStorage.removeItem('pos_active_store_data');
        localStorage.removeItem('pos_is_store_login');
        setIsStoreLogin(false);
        setActiveStoreIdState(null);
      }
    } else {
      // For owner login, validate activeStoreId against actual stores AND sync store list from DB
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('customer_id, role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!roleData?.customer_id) return;

      // Fetch actual stores from DB
      let query = supabase
        .from('stores')
        .select('id, store_name, store_code, address, phone, customer_id, business_type, country, currency_code, tax_type, tax_percentage, is_active, created_at, updated_at');

      // Admins see all stores, owners see their own
      if (roleData.role !== 'admin') {
        query = query.eq('customer_id', roleData.customer_id);
      }
      query = query.eq('is_active', true);

      const { data: validStores } = await query;

      if (!validStores || validStores.length === 0) {
        // Clear any stale store data from localStorage to prevent 401 sync errors
        localStorage.removeItem('pos_active_store_data');
        localStorage.removeItem('pos_active_store');
        localStorage.removeItem('pos_store_code');
        localStorage.removeItem('pos_is_store_login');
        setActiveStoreIdState(null);
        // Also clear stale stores from localStorage
        setStoresState([]);
        setStoresStorage([]);
        console.log('[POSContext] Owner has no stores, cleared stale store data');
        return;
      }

      // Fetch login emails for each store via user_roles + profiles
      const storeIds = validStores.map(s => s.id);
      const { data: storeRoles } = await supabase
        .from('user_roles')
        .select('store_id, user_id, role')
        .in('store_id', storeIds)
        .eq('is_active', true);

      const emailMap: Record<string, string> = {};
      if (storeRoles && storeRoles.length > 0) {
        const userIds = [...new Set(storeRoles.map(r => r.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);
        
        if (profilesData) {
          const profileMap: Record<string, string> = {};
          profilesData.forEach(p => { profileMap[p.id] = p.email; });
          // Prefer store_manager, then staff, then any role
          storeRoles.forEach(r => {
            if (r.store_id && profileMap[r.user_id]) {
              if (!emailMap[r.store_id] || r.role === 'store_manager') {
                emailMap[r.store_id] = profileMap[r.user_id];
              }
            }
          });
        }
      }

      // Sync stores state from DB (replaces any stale localStorage entries)
      const dbStores: Store[] = validStores.map(s => ({
        id: s.id,
        name: s.store_name,
        storeCode: s.store_code || '',
        password: '',
        address: s.address || undefined,
        phone: s.phone || undefined,
        isActive: s.is_active ?? true,
        createdAt: new Date(s.created_at),
        customer_id: s.customer_id,
        businessType: (s.business_type as 'restaurant' | 'retail') || 'restaurant',
        country: s.country || 'India',
        currencyCode: s.currency_code || 'INR',
        taxType: s.tax_type || 'GST',
        taxPercentage: s.tax_percentage ?? 0,
        loginEmail: emailMap[s.id] || undefined,
      }));
      setStoresState(dbStores);
      setStoresStorage(dbStores);
      console.log('[POSContext] Synced', dbStores.length, 'stores from DB');

      const currentStoreId = getActiveStore();
      const isValidStore = validStores.some(s => s.id === currentStoreId);

      if (!isValidStore && validStores.length > 0) {
        const selectedStore = validStores[0];
        console.log('Invalid store ID detected, setting first valid store:', selectedStore.id);
        setActiveStoreStorage(selectedStore.id);
        setActiveStoreIdState(selectedStore.id);
        localStorage.setItem('pos_active_store', JSON.stringify(selectedStore.id));
        localStorage.setItem('pos_store_id', selectedStore.id);
        if (selectedStore.store_code) {
          localStorage.setItem('pos_store_code', selectedStore.store_code);
        }
        localStorage.setItem('pos_active_store_data', JSON.stringify({
          id: selectedStore.id,
          storeId: selectedStore.id,
          storeName: selectedStore.store_name,
          storeAddress: selectedStore.address || null,
          storePhone: selectedStore.phone || null,
          customerId: selectedStore.customer_id || null,
          customer_id: selectedStore.customer_id || null,
          storeCode: selectedStore.store_code || null,
          store_code: selectedStore.store_code || null,
          business_type: (selectedStore.business_type as string) || null,
          subscription_tier: selectedStore.subscription_tier || null,
          enabled_addons: selectedStore.enabled_addons || [],
          staff_limit: selectedStore.staff_limit || 2,
          outlet_limit: selectedStore.outlet_limit || 1,
        }));
        localStorage.setItem('owner_selected_store_id', selectedStore.id);
        toast.info(`Store set to: ${selectedStore.store_name}`);
      }
    }
  }, [isStoreLogin]);

  // Initialize data on mount
  useEffect(() => {
    initializeData();
    
    const cats = getCategories();
    if (cats.length === 0) {
      setCategoriesState(defaultCategories);
      setCategories(defaultCategories);
    } else {
      setCategoriesState(cats);
    }
    
    setOrdersState(getOrders());
    setHeldBillsState(getHeldBills());
    setTablesState(getTables());
    setStoresState(getStores());
    
    const storedActiveStore = getActiveStore();
    setActiveStoreIdState(storedActiveStore);
    
    // Validate store login
    void validateStoreLogin();

    const syncActiveStoreFromStorage = () => {
      const currentStoreId = getActiveStore();
      setActiveStoreIdState(currentStoreId);
    };

    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('storage', syncActiveStoreFromStorage);
    window.addEventListener('owner_store_selection', syncActiveStoreFromStorage);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', syncActiveStoreFromStorage);
      window.removeEventListener('owner_store_selection', syncActiveStoreFromStorage);
    };
  }, [getActiveStore, initializeData, validateStoreLogin]); // add deps to avoid stale closures

  // Re-validate store and load data when auth state changes (critical for multi-device login)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user && !isStoreLogin) {
        console.log('[POSContext] Auth state changed to SIGNED_IN, re-validating store...');

        window.setTimeout(() => {
          void (async () => {
            await validateStoreLogin();

            const storeId = getActiveStore();
            if (storeId) {
              setActiveStoreIdState(storeId);
            }
          })();
        }, 0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isStoreLogin, validateStoreLogin]);

  // Start periodic order sync with cloud
  useEffect(() => {
    const cleanup = startOrderSync(
      () => getOrders(),
      (syncedOrders) => setOrdersState(syncedOrders)
    );
    return cleanup;
  }, [startOrderSync]);

  // Start periodic store data sync (inventory, expenses, held bills, tables, settings)
  useEffect(() => {
    const cleanup = startStoreDataSync(
      () => getInventory(),
      () => getExpenses(),
      () => getHeldBills(),
      (inv) => { setInventory(inv); },
      (exp) => { setExpenses(exp); },
      (hb) => { setHeldBillsState(hb); setHeldBills(hb); },
      () => getTables(),
      (tbl) => { setTablesState(tbl); setTables(tbl); },
    );
    return cleanup;
  }, [startStoreDataSync]);

  // Fetch menu items and initialize store when active store changes
  useEffect(() => {
    const storeId = isStoreLogin 
      ? getCurrentStoreId()
      : activeStoreId || getCurrentStoreId();
    
    if (storeId) {
      fetchMenuItems(storeId);
      
      // Initialize store session (full cloud download on first login per store)
      initializeStoreSession(storeId, isStoreLogin, {
        onOrders: (orders) => setOrdersState(orders),
        onInventory: () => {}, // Inventory is managed by useStoreDataSync
        onExpenses: () => {},
        onHeldBills: (bills) => setHeldBillsState(bills),
        onTables: (tbl) => setTablesState(tbl),
      });
    } else {
      setMenuItemsState([]);
    }
  }, [activeStoreId, isStoreLogin, fetchMenuItems, initializeStoreSession]);

  // Cart calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartTax = Math.round(cartSubtotal * 0.05); // 5% GST
  const cartTotal = cartSubtotal + cartTax - discount;

  // Today's stats - only count orders with billPrinted = true (actual sales)
  const todayStats = React.useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(
      (order) => new Date(order.createdAt).toDateString() === today && order.billPrinted === true
    );
    const totalSales = todayOrders.reduce((sum, order) => sum + order.total, 0);
    const orderCount = todayOrders.length;
    const avgOrderValue = orderCount > 0 ? Math.round(totalSales / orderCount) : 0;
    return { totalSales, orderCount, avgOrderValue };
  }, [orders]);

  // Recent bills - completed bills with billPrinted = true
  const recentBills = React.useMemo(() => {
    const today = new Date().toDateString();
    return orders
      .filter(order => 
        new Date(order.createdAt).toDateString() === today && 
        order.billPrinted === true
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
  }, [orders]);

  const toggleItemAvailability = async (id: string) => {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;

    const storeId = activeStoreId || getCurrentStoreId();

    if (isStoreLogin && storeId) {
      const { data, error } = await supabase.functions.invoke('sync-store-data', {
        body: { action: 'update', store_id: storeId, data_type: 'menu_items', item_id: id, updates: { is_available: !item.isAvailable }, store_code: getStoreCode() }
      });
      if (error || data?.error) {
        toast.error('Failed to update item availability');
        return;
      }
    } else {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !item.isAvailable })
        .eq('id', id);

      if (error) {
        toast.error('Failed to update item availability');
        return;
      }
    }

    setMenuItemsState((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isAvailable: !item.isAvailable } : item))
    );
  };

  const addMenuItems = async (items: Omit<MenuItem, 'id' | 'isAvailable'>[]) => {
    const storeId = activeStoreId || getCurrentStoreId();

    if (!storeId) {
      toast.error('Please select a store first');
      return;
    }

    if (isStoreLogin) {
      // Use edge function for store login
      const { data: result, error: fnError } = await supabase.functions.invoke('sync-store-data', {
        body: { action: 'save', store_id: storeId, data_type: 'menu_items', store_code: getStoreCode(), items: items.map(item => ({
          name: item.name,
          nameHindi: item.nameHindi || null,
          price: item.price,
          category: item.category,
          isAvailable: true,
          preparationTime: item.preparationTime || null,
          stock: item.stock || null,
          image: item.image || null,
          linkedInventoryId: item.linkedInventoryId || null,
          gramagePerUnit: item.gramagePerUnit || 0,
          sku: item.sku || null,
        })) }
      });

      if (fnError || result?.error) {
        toast.error('Failed to add items');
        console.error('Error adding items:', fnError || result?.error);
        return;
      }

      const newItems: MenuItem[] = (result?.items || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        nameHindi: item.name_hindi || undefined,
        price: Number(item.price),
        category: item.category,
        image: item.image_url || undefined,
        isAvailable: item.is_available,
        preparationTime: item.preparation_time || undefined,
        stock: item.stock || undefined,
        linkedInventoryId: item.linked_inventory_id || undefined,
        gramagePerUnit: item.gramage_per_unit ? Number(item.gramage_per_unit) : undefined,
        sku: item.sku || undefined,
      }));
      
      setMenuItemsState(prev => [...prev, ...newItems]);
      toast.success(`${newItems.length} item(s) added`);
    } else {
      const dbItems = items.map(item => ({
        store_id: storeId,
        name: item.name,
        name_hindi: item.nameHindi || null,
        price: item.price,
        category: item.category,
        is_available: true,
        preparation_time: item.preparationTime || null,
        stock: item.stock || null,
        image_url: item.image || null,
        linked_inventory_id: item.linkedInventoryId || null,
        gramage_per_unit: item.gramagePerUnit || 0,
      }));

      const { data, error } = await supabase
        .from('menu_items')
        .insert(dbItems)
        .select();

      if (error) {
        toast.error('Failed to add items');
        console.error('Error adding items:', error);
        return;
      }

      const newItems: MenuItem[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        nameHindi: item.name_hindi || undefined,
        price: Number(item.price),
        category: item.category,
        image: item.image_url || undefined,
        isAvailable: item.is_available,
        preparationTime: item.preparation_time || undefined,
        stock: item.stock || undefined,
        linkedInventoryId: item.linked_inventory_id || undefined,
        gramagePerUnit: item.gramage_per_unit ? Number(item.gramage_per_unit) : undefined,
      }));
      
      setMenuItemsState(prev => [...prev, ...newItems]);
      toast.success(`${newItems.length} item(s) added`);
    }
  };

  const addCategory = async (category: Omit<Category, 'color'>) => {
    if (categories.some(c => c.id === category.id)) {
      return;
    }
    
    const newCategory: Category = {
      ...category,
      color: 'cat-food'
    };
    
    const updatedCategories = [...categories, newCategory];
    setCategoriesState(updatedCategories);
    
    // Save to DB
    const storeId = activeStoreId || getCurrentStoreId();
    if (storeId) {
      try {
        if (isStoreLogin) {
          await supabase.functions.invoke('sync-store-data', {
            body: { action: 'save', store_id: storeId, data_type: 'categories', store_code: getStoreCode(), items: updatedCategories }
          });
        } else {
          await supabase.from('store_categories').delete().eq('store_id', storeId);
          await supabase.from('store_categories').insert(
            updatedCategories.map((c, idx) => ({
              store_id: storeId,
              category_id: c.id,
              name: c.name,
              icon: c.icon,
              color: c.color,
              sort_order: idx,
            }))
          );
        }
      } catch (e) {
        console.error('Failed to save category to DB:', e);
      }
    }
  };

  const deleteMenuItem = async (id: string) => {
    const storeId = activeStoreId || getCurrentStoreId();

    if (isStoreLogin && storeId) {
      const { data, error } = await supabase.functions.invoke('sync-store-data', {
        body: { action: 'delete', store_id: storeId, data_type: 'menu_items', item_ids: [id], store_code: getStoreCode() }
      });
      if (error || data?.error) {
        toast.error('Failed to delete item');
        return;
      }
    } else {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Failed to delete item');
        return;
      }
    }

    setMenuItemsState(prev => prev.filter(item => item.id !== id));
    toast.success('Item deleted');
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.nameHindi !== undefined) dbUpdates.name_hindi = updates.nameHindi;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.isAvailable !== undefined) dbUpdates.is_available = updates.isAvailable;
    if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
    if (updates.preparationTime !== undefined) dbUpdates.preparation_time = updates.preparationTime;
    if (updates.image !== undefined) dbUpdates.image_url = updates.image;
    if (updates.linkedInventoryId !== undefined) dbUpdates.linked_inventory_id = updates.linkedInventoryId || null;
    if (updates.gramagePerUnit !== undefined) dbUpdates.gramage_per_unit = updates.gramagePerUnit || 0;
    if (updates.sku !== undefined) dbUpdates.sku = updates.sku;

    const storeId = activeStoreId || getCurrentStoreId();

    if (isStoreLogin && storeId) {
      const { data, error } = await supabase.functions.invoke('sync-store-data', {
        body: { 
          action: 'update', store_id: storeId, data_type: 'menu_items', item_id: id, updates: dbUpdates,
          store_code: getStoreCode(),
          ...(updates.ingredients !== undefined ? { ingredients: updates.ingredients } : {}),
          ...(updates.variations !== undefined ? { variations: updates.variations } : {}),
        }
      });
      if (error || data?.error) {
        toast.error('Failed to update item');
        console.error('Error updating item:', error || data?.error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('menu_items')
        .update(dbUpdates)
        .eq('id', id);

      if (error) {
        toast.error('Failed to update item');
        console.error('Error updating item:', error);
        return;
      }

      // Handle ingredients update - save to database
      if (updates.ingredients !== undefined) {
        await supabase
          .from('menu_item_ingredients')
          .delete()
          .eq('menu_item_id', id);

        if (updates.ingredients.length > 0) {
          const ingredientsToInsert = updates.ingredients.map(ing => ({
            menu_item_id: id,
            inventory_item_id: ing.inventoryItemId,
            quantity_required: ing.quantityRequired,
            unit: ing.unit
          }));

          const { error: ingError } = await supabase
            .from('menu_item_ingredients')
            .insert(ingredientsToInsert);

          if (ingError) {
            console.error('Error saving ingredients:', ingError);
            toast.error('Failed to save recipe ingredients');
          }
        }
      }
    }

    setMenuItemsState(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  // Sync categories based on menu items - ONLY show categories from menu
  const syncCategoriesFromMenu = () => {
    const uniqueCategoryIds = [...new Set(menuItems.map(item => item.category).filter(Boolean))];
    
    // Create categories ONLY from menu items
    const menuCategories: Category[] = uniqueCategoryIds.map(catId => ({
      id: catId,
      name: catId.charAt(0).toUpperCase() + catId.slice(1).replace(/-/g, ' '),
      icon: '📦',
      color: 'cat-food'
    }));

    if (menuCategories.length > 0) {
      setCategoriesState(menuCategories);
      setCategories(menuCategories);
    }
  };

  const clearAllOrders = () => {
    setOrdersState([]);
    setOrders([]);
  };

  const addToCart = useCallback((item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantity } : item)));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setSelectedTable(null);
  };

  // Helper function to reduce stock and inventory (supports recipe-based deduction with auto-production)
  const reduceStock = async (cartItems: CartItem[]) => {
    console.log('[reduceStock] Starting stock reduction for', cartItems.length, 'items');
    const stockChanges: string[] = [];
    const inventoryChanges: string[] = [];
    const autoProductionLog: string[] = [];
    
    // Get current inventory from localStorage - create a deep copy
    const currentInventory = JSON.parse(JSON.stringify(getInventory())) as typeof getInventory extends () => infer T ? T : never;
    let inventoryUpdated = false;

    console.log('[reduceStock] Current inventory items:', currentInventory.length);

    // Load inventory components from database for accurate deduction
    const { data: componentsData } = await supabase
      .from('inventory_components')
      .select('*');
    
    // Build components map
    const componentsMap: Record<string, { childInventoryId: string; quantityRequired: number; unit: string }[]> = {};
    if (componentsData) {
      componentsData.forEach(c => {
        if (!componentsMap[c.parent_inventory_id]) {
          componentsMap[c.parent_inventory_id] = [];
        }
        componentsMap[c.parent_inventory_id].push({
          childInventoryId: c.child_inventory_id,
          quantityRequired: Number(c.quantity_required),
          unit: c.unit
        });
      });
    }

    // Auto-production helper: produces item from components if stock is insufficient
    // Now supports PARTIAL PRODUCTION - will use whatever ingredients are available
    // and produce as much as possible, even if it can't cover the full demand
    const autoProduceIfNeeded = (inventoryId: string, requiredQuantity: number): number => {
      const invItemIndex = currentInventory.findIndex(i => i.id === inventoryId);
      if (invItemIndex === -1) return 0;

      const invItem = currentInventory[invItemIndex];
      
      // If we have enough stock, no need to produce
      if (invItem.quantity >= requiredQuantity) {
        return requiredQuantity; // We can fulfill the full requirement
      }

      // Check if this item has components (can be produced)
      const itemComponents = componentsMap[inventoryId] || invItem.components || [];
      if (itemComponents.length === 0) {
        console.log('[AutoProduce] No recipe for:', invItem.name, '- cannot auto-produce');
        return invItem.quantity; // Return whatever stock we have
      }

      const shortfall = requiredQuantity - Math.max(0, invItem.quantity);
      console.log('[AutoProduce]', invItem.name, 'shortfall:', shortfall, invItem.unit);

      // Use productionYield if defined, otherwise fallback to sum of components
      let yieldPerBatch: number;
      if (invItem.productionYield && invItem.productionYield > 0) {
        yieldPerBatch = invItem.productionYield;
        console.log('[AutoProduce] Using configured yield:', yieldPerBatch, invItem.productionYieldUnit || invItem.unit);
      } else {
        yieldPerBatch = itemComponents.reduce((sum, c) => {
          return sum + convertToBaseUnit(c.quantityRequired, c.unit);
        }, 0);
        console.log('[AutoProduce] Using calculated yield (sum of components):', yieldPerBatch);
      }

      if (yieldPerBatch <= 0) {
        console.log('[AutoProduce] Invalid yield per batch:', yieldPerBatch);
        return invItem.quantity;
      }

      // How many batches do we need ideally?
      const batchesNeededIdeal = Math.ceil(shortfall / yieldPerBatch);
      
      console.log('[AutoProduce] Yield per batch:', yieldPerBatch, '- Batches needed (ideal):', batchesNeededIdeal);

      // Calculate max batches we can produce based on available components
      let maxBatchesPossible = batchesNeededIdeal;
      
      for (const component of itemComponents) {
        const childItem = currentInventory.find(i => i.id === component.childInventoryId);
        if (!childItem) {
          console.log('[AutoProduce] Component not found:', component.childInventoryId);
          maxBatchesPossible = 0;
          break;
        }

        const componentQtyPerBatch = convertToBaseUnit(component.quantityRequired, component.unit);
        
        // How many batches can this component support?
        const batchesFromThisComponent = componentQtyPerBatch > 0 
          ? Math.floor(childItem.quantity / componentQtyPerBatch) 
          : 0;
        
        console.log('[AutoProduce] Component:', childItem.name, 
          '- Have:', childItem.quantity, childItem.unit,
          '- Per batch:', componentQtyPerBatch,
          '- Can make:', batchesFromThisComponent, 'batches');
        
        // Limit by the component with least availability
        maxBatchesPossible = Math.min(maxBatchesPossible, batchesFromThisComponent);
      }

      console.log('[AutoProduce] Max batches possible:', maxBatchesPossible, 'of', batchesNeededIdeal, 'needed');

      // If no batches possible, don't produce anything but still allow stock to go negative
      if (maxBatchesPossible <= 0) {
        console.log('[AutoProduce] Cannot produce any batches - insufficient ingredients');
        toast.warning(`Cannot auto-produce ${invItem.name}`, {
          description: `Insufficient ingredients. Stock will go negative.`,
        });
        return invItem.quantity; // Return current stock (may be 0 or negative)
      }

      // Produce as many batches as possible
      const batchesToProduce = maxBatchesPossible;
      
      console.log('[AutoProduce] Starting PARTIAL production of', invItem.name, '- producing', batchesToProduce, 'batches');

      // Deduct components for the batches we're producing
      for (const component of itemComponents) {
        const componentQtyNeeded = convertToBaseUnit(component.quantityRequired, component.unit) * batchesToProduce;
        const childItemIndex = currentInventory.findIndex(i => i.id === component.childInventoryId);
        
        if (childItemIndex !== -1) {
          const oldQty = currentInventory[childItemIndex].quantity;
          currentInventory[childItemIndex] = {
            ...currentInventory[childItemIndex],
            quantity: currentInventory[childItemIndex].quantity - componentQtyNeeded,
            lastUpdated: new Date()
          };
          console.log('[AutoProduce] Used component:', currentInventory[childItemIndex].name, 
            '- Deducted:', componentQtyNeeded, 
            '- Old:', oldQty, '-> New:', currentInventory[childItemIndex].quantity);
          
          // Track ingredient usage in inventory changes
          inventoryChanges.push(`${currentInventory[childItemIndex].name}: ${formatQuantityDisplay(oldQty, currentInventory[childItemIndex].unit)} → ${formatQuantityDisplay(currentInventory[childItemIndex].quantity, currentInventory[childItemIndex].unit)} (used in production)`);
        }
      }

      // Add produced quantity to parent item
      const quantityProduced = yieldPerBatch * batchesToProduce;
      const oldParentQty = currentInventory[invItemIndex].quantity;
      currentInventory[invItemIndex] = {
        ...currentInventory[invItemIndex],
        quantity: currentInventory[invItemIndex].quantity + quantityProduced,
        lastUpdated: new Date()
      };
      
      inventoryUpdated = true;
      autoProductionLog.push(`${invItem.name}: ${formatQuantityDisplay(quantityProduced, invItem.unit)} auto-produced`);
      
      console.log('[AutoProduce] SUCCESS:', invItem.name, 'produced', quantityProduced, invItem.unit,
        '- Stock:', oldParentQty, '->', currentInventory[invItemIndex].quantity);
      
      const isPartial = batchesToProduce < batchesNeededIdeal;
      if (isPartial) {
        toast.warning(`🏭 Partial Production: ${invItem.name}`, {
          description: `Produced ${formatQuantityDisplay(quantityProduced, invItem.unit)} (not enough ingredients for full demand)`,
          duration: 5000,
        });
      } else {
        toast.success(`🏭 Auto-Produced: ${invItem.name}`, {
          description: `${formatQuantityDisplay(quantityProduced, invItem.unit)} from components`,
          duration: 5000,
        });
      }

      // Return the new stock level after production
      return currentInventory[invItemIndex].quantity;
    };

    // Helper to deduct from inventory item
    // If item has components AND stock is insufficient, try auto-production first (partial if needed)
    // Then deduct from the produced stock - ingredients are ALWAYS deducted during production
    const deductInventoryItem = (inventoryId: string, quantityToDeduct: number) => {
      const invItemIndex = currentInventory.findIndex(i => i.id === inventoryId);
      if (invItemIndex === -1) {
        console.log('[reduceStock] Inventory item not found:', inventoryId);
        return;
      }

      const invItem = currentInventory[invItemIndex];
      console.log('[reduceStock] Deducting from', invItem.name, '- current stock:', invItem.quantity, '- need:', quantityToDeduct);

      // Check if stock is insufficient - always try to auto-produce if possible
      if (invItem.quantity < quantityToDeduct) {
        // Check if this item can be auto-produced from components
        const itemComponents = componentsMap[inventoryId] || invItem.components || [];
        
        if (itemComponents.length > 0) {
          console.log('[reduceStock] Stock insufficient, attempting auto-production for:', invItem.name);
          // Try to auto-produce - this now does PARTIAL production and returns new stock level
          // Ingredients are deducted during this process
          const stockAfterProduction = autoProduceIfNeeded(inventoryId, quantityToDeduct);
          console.log('[reduceStock] Stock after auto-production attempt:', stockAfterProduction);
        }
      }

      // Now deduct from the inventory item (after potential auto-production)
      // Re-fetch the item as it may have been updated by auto-production
      const updatedInvItemIndex = currentInventory.findIndex(i => i.id === inventoryId);
      if (updatedInvItemIndex === -1) return;
      
      const updatedInvItem = currentInventory[updatedInvItemIndex];
      const oldQuantity = updatedInvItem.quantity;
      const newQuantity = updatedInvItem.quantity - quantityToDeduct;
      
      console.log('[reduceStock] Final deduction from', updatedInvItem.name, ':', oldQuantity, '->', newQuantity, '(deducted:', quantityToDeduct, updatedInvItem.unit + ')');
      
      // Update the item in place
      currentInventory[updatedInvItemIndex] = {
        ...updatedInvItem,
        quantity: newQuantity,
        lastUpdated: new Date()
      };
      inventoryUpdated = true;
      
      inventoryChanges.push(`${updatedInvItem.name}: ${formatQuantityDisplay(oldQuantity, updatedInvItem.unit)} → ${formatQuantityDisplay(newQuantity, updatedInvItem.unit)}`);
      
      // Alert if stock went negative
      if (newQuantity < 0 && oldQuantity >= 0) {
        toast.error(`⚠️ ${updatedInvItem.name} NEGATIVE STOCK!`, {
          description: `Stock is now ${formatQuantityDisplay(newQuantity, updatedInvItem.unit)} - Please restock immediately!`,
          duration: 10000,
        });
      } else if (newQuantity < 0) {
        // Already negative, show how much more negative
        toast.warning(`${updatedInvItem.name}: ${formatQuantityDisplay(newQuantity, updatedInvItem.unit)}`, {
          description: `Stock deficit increased`,
          duration: 5000,
        });
      }
    };
    
    for (const cartItem of cartItems) {
      const menuItem = menuItems.find(m => m.id === cartItem.id);
      if (!menuItem) {
        console.log('[reduceStock] Menu item not found:', cartItem.id);
        continue;
      }
      
      console.log('[reduceStock] Processing menu item:', menuItem.name, 'qty:', cartItem.quantity, 'ingredients:', menuItem.ingredients?.length || 0, 'linkedInventoryId:', menuItem.linkedInventoryId, 'gramagePerUnit:', menuItem.gramagePerUnit);
      
      // Update menu item stock if defined
      if (menuItem.stock !== undefined && menuItem.stock !== null) {
        const oldStock = menuItem.stock;
        const newStock = Math.max(0, menuItem.stock - cartItem.quantity);
        
        // Update in database
        await supabase
          .from('menu_items')
          .update({ stock: newStock })
          .eq('id', cartItem.id);
        
        stockChanges.push(`${menuItem.name}: ${oldStock} → ${newStock}`);
        
        // Update local state
        setMenuItemsState(prev => prev.map(item => 
          item.id === cartItem.id ? { ...item, stock: newStock } : item
        ));
      }
      
      // NEW: Recipe-based deduction (multiple ingredients)
      if (menuItem.ingredients && menuItem.ingredients.length > 0) {
        console.log('[reduceStock] Using recipe-based deduction for:', menuItem.name, '- cart qty:', cartItem.quantity);
        for (const ingredient of menuItem.ingredients) {
          // Convert ingredient quantity to base unit (g, ml, pcs) then multiply by cart quantity
          const ingredientInBaseUnit = convertToBaseUnit(ingredient.quantityRequired, ingredient.unit);
          const totalQtyNeeded = ingredientInBaseUnit * cartItem.quantity;
          
          const invItem = currentInventory.find(i => i.id === ingredient.inventoryItemId);
          console.log('[reduceStock] Ingredient:', invItem?.name || ingredient.inventoryItemId, 
            '- Recipe:', ingredient.quantityRequired, ingredient.unit,
            '- Converted to base:', ingredientInBaseUnit,
            '- x Cart qty', cartItem.quantity, '=', totalQtyNeeded);
          
          deductInventoryItem(ingredient.inventoryItemId, totalQtyNeeded);
        }
      }
      // LEGACY: Single inventory link with gramage
      else if (menuItem.linkedInventoryId && menuItem.gramagePerUnit && menuItem.gramagePerUnit > 0) {
        console.log('[reduceStock] Using legacy gramage deduction for:', menuItem.name);
        const gramageUsed = menuItem.gramagePerUnit * cartItem.quantity;
        deductInventoryItem(menuItem.linkedInventoryId, gramageUsed);
      } else {
        console.log('[reduceStock] No inventory link for:', menuItem.name, '- skipping deduction');
      }
    }
    
    // Save updated inventory to localStorage
    if (inventoryUpdated) {
      console.log('[reduceStock] Saving updated inventory to localStorage, items updated:', inventoryChanges.length);
      setInventory(currentInventory);
    }
    
    // Show stock update notification
    if (stockChanges.length > 0) {
      toast.success('Stock Updated', {
        description: stockChanges.slice(0, 3).join(', ') + (stockChanges.length > 3 ? ` +${stockChanges.length - 3} more` : ''),
        duration: 3000,
      });
    }
    
    // Show inventory update notification
    if (inventoryChanges.length > 0) {
      toast.success('Inventory Deducted', {
        description: inventoryChanges.slice(0, 3).join(', ') + (inventoryChanges.length > 3 ? ` +${inventoryChanges.length - 3} more` : ''),
        duration: 4000,
      });
    }

    // Show auto-production notification summary
    if (autoProductionLog.length > 0) {
      console.log('[reduceStock] Auto-production summary:', autoProductionLog);
    }
  };

  // DB-first bill/KOT number generation
  const generateBillNumberFromDB = useCallback(async (): Promise<string> => {
    const storeId = activeStoreId || getCurrentStoreId();
    if (storeId) {
      try {
        if (isStoreLogin) {
          const { data } = await supabase.functions.invoke('sync-store-data', {
            body: { action: 'increment', store_id: storeId, data_type: 'bill_counter', counter_type: 'bill', store_code: getStoreCode() }
          });
          if (data?.counter) {
            return `B${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${data.counter.toString().padStart(4, '0')}`;
          }
        } else {
          const { data, error } = await supabase.rpc('increment_bill_counter', { p_store_id: storeId });
          if (!error && data) {
            return `B${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${data.toString().padStart(4, '0')}`;
          }
        }
      } catch (e) {
        console.error('Failed to get bill number from DB:', e);
      }
    }
    return generateBillNumber(); // fallback to localStorage
  }, [isStoreLogin, activeStoreId, getStoreCode]);

  const generateKOTNumberFromDB = useCallback(async (): Promise<string> => {
    const storeId = activeStoreId || getCurrentStoreId();
    if (storeId) {
      try {
        if (isStoreLogin) {
          const { data } = await supabase.functions.invoke('sync-store-data', {
            body: { action: 'increment', store_id: storeId, data_type: 'bill_counter', counter_type: 'kot', store_code: getStoreCode() }
          });
          if (data?.counter) {
            return `K${data.counter.toString().padStart(4, '0')}`;
          }
        } else {
          const { data, error } = await supabase.rpc('increment_kot_counter', { p_store_id: storeId });
          if (!error && data) {
            return `K${data.toString().padStart(4, '0')}`;
          }
        }
      } catch (e) {
        console.error('Failed to get KOT number from DB:', e);
      }
    }
    return generateKOTNumber(); // fallback
  }, [isStoreLogin, activeStoreId, getStoreCode]);

  // Create KOT order - shows in orders, no sales added
  // Auto-merges if the selected table already has an active order
  const createKOTOrder = async (): Promise<Order | null> => {
    if (cart.length === 0) return null;

    // Check for existing held bill on same table
    if (currentOrderType === 'dine-in' && selectedTable) {
      const existingHeldBill = heldBills.find(
        (b) => b.tableNumber === selectedTable.number
      );

      if (existingHeldBill) {
        // Auto-merge cart items into held bill instead of creating new KOT
        const mergedItems = [...existingHeldBill.items];

        for (const cartItem of cart) {
          const existingIdx = mergedItems.findIndex(
            (i) => i.id === cartItem.id && (i.notes || '') === (cartItem.notes || '')
          );

          if (existingIdx >= 0) {
            mergedItems[existingIdx] = {
              ...mergedItems[existingIdx],
              quantity: mergedItems[existingIdx].quantity + cartItem.quantity,
            };
          } else {
            mergedItems.push({ ...cartItem });
          }
        }

        // Update the existing held bill with merged items
        const updatedHeldBill: HeldBill = {
          ...existingHeldBill,
          items: mergedItems,
          heldAt: new Date(),
        };

        const updatedHeldBills = heldBills.map(
          (b) => (b.id === existingHeldBill.id ? updatedHeldBill : b)
        );

        setHeldBillsState(updatedHeldBills);
        setHeldBills(updatedHeldBills);
        toast.success(
          `Items merged into Table ${selectedTable.number} held bill (not yet sent to kitchen)`
        );
        clearCart();
        return null; // Return null to indicate we merged with held bill, not created KOT
      }
    }

    // Check for existing active order on same table
    if (currentOrderType === 'dine-in' && selectedTable) {
      const existingOrder = orders.find(
        o => o.tableNumber === selectedTable.number &&
          !o.isDirectBill &&
          (o.status === 'pending' || o.status === 'preparing' || o.status === 'ready')
      );

      if (existingOrder) {
        // Auto-merge: add new cart items into existing order
        const mergedItems = [...existingOrder.items];
        for (const cartItem of cart) {
          const existingIdx = mergedItems.findIndex(
            i => i.id === cartItem.id && i.notes === cartItem.notes
          );
          if (existingIdx >= 0) {
            mergedItems[existingIdx] = {
              ...mergedItems[existingIdx],
              quantity: mergedItems[existingIdx].quantity + cartItem.quantity,
            };
          } else {
            mergedItems.push({ ...cartItem });
          }
        }

        const newSubtotal = mergedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const newTax = existingOrder.tax; // Retain tax calculation
        const newTotal = newSubtotal + newTax - (existingOrder.discount || 0);

        const updatedOrder: Order = {
          ...existingOrder,
          items: mergedItems,
          subtotal: newSubtotal,
          total: newTotal,
        };

        const updatedOrders = orders.map(o => o.id === existingOrder.id ? updatedOrder : o);
        setOrdersState(updatedOrders);
        setOrders(updatedOrders);
        saveOrderToCloud(updatedOrder);

        toast.success(`Items merged into Table ${selectedTable.number} order`);
        clearCart();
        return updatedOrder;
      }
    }

    const kotNumber = await generateKOTNumberFromDB();
    const order: Order = {
      id: generateId(),
      kotNumber,
      items: [...cart],
      subtotal: cartSubtotal,
      tax: cartTax,
      discount,
      total: cartTotal,
      status: 'pending',
      orderType: currentOrderType,
      tableNumber: selectedTable?.number,
      createdAt: new Date(),
      kotPrinted: true,
      billPrinted: false,
      isDirectBill: false,
      storeId: activeStoreId || undefined,
    };

    addOrderToStorage(order);
    saveOrderToCloud(order);
    setOrdersState(getOrders());

    if (currentOrderType === 'dine-in' && selectedTable) {
      updateTableStatus(selectedTable.id, 'occupied');
    }

    clearCart();
    return order;
  };

  // Print bill for existing KOT order - adds to sales
  const printBillForOrder = async (orderId: string, paymentMethod: 'cash' | 'card' | 'upi' | 'split' | 'due' | 'part'): Promise<Order | null> => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;

    if (paymentMethod === 'due' && !order.customerName?.trim() && !order.customerPhone?.trim()) {
      toast.error('Please select customer before printing a Due bill');
      return null;
    }

    const billNumber = await generateBillNumberFromDB();
    const updatedOrder: Order = {
      ...order,
      billNumber,
      paymentMethod,
      billPrinted: true,
      status: 'completed'
    };

    const updatedOrders = orders.map(o => o.id === orderId ? updatedOrder : o);
    setOrdersState(updatedOrders);
    setOrders(updatedOrders);
    await saveOrderToCloud(updatedOrder);

    if (paymentMethod === 'due' && activeStoreId) {
      const customerRef = normalizeCustomerReference({
        customerId: updatedOrder.customerPhone || updatedOrder.customerName,
        customerPhone: updatedOrder.customerPhone,
        customerName: updatedOrder.customerName,
      })
      const payload: any = {
        action: 'save',
        data_type: 'sale',
        store_id: activeStoreId,
        record_id: updatedOrder.id,
        payload: {
          customer_id: customerRef.customer_id,
          customer_phone: customerRef.customer_phone,
          customer_name: customerRef.customer_name,
          payment_mode: 'DUE',
          bill_no: updatedOrder.billNumber,
        },
      }

      if (isStoreLogin) {
        payload.store_code = getStoreCode();
      }

      console.log('DUE LEDGER PAYLOAD', JSON.stringify(payload, null, 2));

      try {
        const resp = await invokeFunctionWithResponseFallback<any>('sync-store-data', payload);
        console.debug('[POS] sale save response (bill print due ledger):', resp);
      } catch (ledgerException) {
        console.error('[POS] Failed to save due ledger entry via function:', ledgerException);
        if (!navigator.onLine) toast.error('Network offline — check your internet connection');
        else toast.error(String(ledgerException));
      }
    }

    reduceStock(order.items);

    if (order.orderType === 'dine-in' && order.tableNumber) {
      const table = tables.find(t => t.number === order.tableNumber);
      if (table) {
        updateTableStatus(table.id, 'available');
      }
    }

    return updatedOrder;
  };

  // Direct bill print - no KOT, doesn't show in orders (only in recent bills)
  const directBillPrint = async (
    paymentMethod: 'cash' | 'card' | 'upi' | 'split' | 'due' | 'part' | 'wallet' | 'credit',
    customerName?: string,
    customerPhone?: string
  ): Promise<Order | null> => {
    if (cart.length === 0) return null;

    const billNumber = await generateBillNumberFromDB();

    let orderItems = [...cart];
    let orderSubtotal = cartSubtotal;
    let orderTax = cartTax;
    let orderTotal = cartTotal;

    // Check for existing held bill on same table and merge
    if (currentOrderType === 'dine-in' && selectedTable) {
      const existingHeldBill = heldBills.find(
        (b) => b.tableNumber === selectedTable.number
      );

      if (existingHeldBill) {
        // Merge cart items into held bill
        const mergedItems = [...existingHeldBill.items];

        for (const cartItem of cart) {
          const existingIdx = mergedItems.findIndex(
            (i) => i.id === cartItem.id && (i.notes || '') === (cartItem.notes || '')
          );

          if (existingIdx >= 0) {
            mergedItems[existingIdx] = {
              ...mergedItems[existingIdx],
              quantity: mergedItems[existingIdx].quantity + cartItem.quantity,
            };
          } else {
            mergedItems.push({ ...cartItem });
          }
        }

        // Use merged items for the order
        orderItems = mergedItems;
        orderSubtotal = mergedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        orderTax = Math.round(orderSubtotal * 0.05);
        orderTotal = orderSubtotal + orderTax - discount;

        // Delete the held bill since order is completed
        deleteHeldBill(existingHeldBill.id);
      }
    }

    const order: Order = {
      id: generateId(),
      billNumber,
      items: orderItems,
      subtotal: orderSubtotal,
      tax: orderTax,
      discount,
      total: orderTotal,
      status: 'completed',
      orderType: currentOrderType,
      tableNumber: selectedTable?.number,
      paymentMethod,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      createdAt: new Date(),
      kotPrinted: false,
      billPrinted: true,
      isDirectBill: true,
      storeId: activeStoreId || undefined,
    };

    if (paymentMethod === 'due' && !order.customerName?.trim() && !order.customerPhone?.trim()) {
      toast.error('Please select customer before printing a Due bill');
      return null;
    }

    addOrderToStorage(order);
    await saveOrderToCloud(order);

    if (paymentMethod === 'due' && activeStoreId) {
      const customerRef = normalizeCustomerReference({
        customerId: order.customerPhone || order.customerName,
        customerPhone: order.customerPhone,
        customerName: order.customerName,
      })
      const payload: any = {
        action: 'save',
        data_type: 'sale',
        store_id: activeStoreId,
        record_id: order.id,
        payload: {
          customer_id: customerRef.customer_id,
          customer_phone: customerRef.customer_phone,
          customer_name: customerRef.customer_name,
          payment_mode: 'DUE',
          bill_no: order.billNumber,
        },
      }

      if (isStoreLogin) {
        payload.store_code = getStoreCode();
      }

      console.log('DUE LEDGER PAYLOAD', JSON.stringify(payload, null, 2));

      try {
        const resp = await invokeFunctionWithResponseFallback<any>('sync-store-data', payload);
        console.debug('[POS] sale save response (direct bill due ledger):', resp);
      } catch (ledgerException) {
        console.error('Error saving due ledger entry (function call failed, direct bill):', ledgerException);
        if (!navigator.onLine) toast.error('Network offline — check your internet connection');
        else toast.error(String(ledgerException));
      }
    }

    setOrdersState(getOrders());

    reduceStock(orderItems);

    if (currentOrderType === 'dine-in' && selectedTable) {
      updateTableStatus(selectedTable.id, 'available');
    }

    clearCart();
    return order;
  };

  // Legacy placeOrder - kept for compatibility
  const placeOrder = (paymentMethod: 'cash' | 'card' | 'upi' | 'split' | 'due' | 'part' | 'wallet' | 'credit'): Order | null => {
    // Fire and forget the async version
    directBillPrint(paymentMethod);
    return null; // Async now, callers should use directBillPrint
  };

  // Update order status
  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    const updatedOrder = orders.find(o => o.id === orderId);
    const updatedOrders = orders.map(o => 
      o.id === orderId ? { ...o, status } : o
    );
    setOrdersState(updatedOrders);
    setOrders(updatedOrders);
    if (updatedOrder) saveOrderToCloud({ ...updatedOrder, status });
  };

  // Update order payment method
  const updateOrderPaymentMethod = (orderId: string, paymentMethod: Order['paymentMethod']) => {
    const updatedOrder = orders.find(o => o.id === orderId);
    const updatedOrders = orders.map(o => 
      o.id === orderId ? { ...o, paymentMethod } : o
    );
    setOrdersState(updatedOrders);
    setOrders(updatedOrders);
    if (updatedOrder) saveOrderToCloud({ ...updatedOrder, paymentMethod });
    toast.success('Payment method updated');
  };

  // Cancel order with reason
  const cancelOrder = (orderId: string, reason?: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const cancelledOrder = { 
      ...order, 
      status: 'cancelled' as const,
      cancelReason: reason,
      cancelledAt: new Date().toISOString()
    };

    const updatedOrders = orders.map(o => 
      o.id === orderId ? cancelledOrder : o
    );
    setOrdersState(updatedOrders);
    setOrders(updatedOrders);
    saveOrderToCloud(cancelledOrder); // Sync cancellation to cloud

    // Free up table if dine-in
    if (order.orderType === 'dine-in' && order.tableNumber) {
      const table = tables.find(t => t.number === order.tableNumber);
      if (table) {
        updateTableStatus(table.id, 'available');
      }
    }

    toast.info(`Order #${order.kotNumber || order.id.slice(-6).toUpperCase()} cancelled`);
  };

  const holdBill = () => {
    if (cart.length === 0) return;

    // Check if there's already a held bill for the selected table
    if (selectedTable) {
      const existingHeldBill = heldBills.find(
        (b) => b.tableNumber === selectedTable.number
      );

      if (existingHeldBill) {
        // Auto-merge: add new cart items into existing held bill
        const mergedItems = [...existingHeldBill.items];

        for (const cartItem of cart) {
          // Find existing item by id and notes (to handle different variations/special requests)
          const existingIdx = mergedItems.findIndex(
            (i) => i.id === cartItem.id && (i.notes || '') === (cartItem.notes || '')
          );

          if (existingIdx >= 0) {
            // Item exists, update quantity
            mergedItems[existingIdx] = {
              ...mergedItems[existingIdx],
              quantity: mergedItems[existingIdx].quantity + cartItem.quantity,
            };
          } else {
            // New item, add to list
            mergedItems.push({ ...cartItem });
          }
        }

        // Update the existing held bill with merged items
        const updatedHeldBill: HeldBill = {
          ...existingHeldBill,
          items: mergedItems,
          heldAt: new Date(), // Update the held time to reflect the merge
        };

        const updatedHeldBills = heldBills.map(
          (b) => (b.id === existingHeldBill.id ? updatedHeldBill : b)
        );

        setHeldBillsState(updatedHeldBills);
        setHeldBills(updatedHeldBills);
        toast.success(
          `Items merged into Table ${selectedTable.number} held bill`
        );
        clearCart();
        return;
      }
    }

    // No existing held bill found, create a new one
    const bill: HeldBill = {
      id: generateId(),
      items: [...cart],
      tableNumber: selectedTable?.number,
      heldAt: new Date(),
    };

    const newHeldBills = [...heldBills, bill];
    setHeldBillsState(newHeldBills);
    setHeldBills(newHeldBills);
    clearCart();
  };

  const recallBill = (billId: string) => {
    const bill = heldBills.find((b) => b.id === billId);
    if (!bill) return;

    setCart(bill.items);
    if (bill.tableNumber) {
      const table = tables.find((t) => t.number === bill.tableNumber);
      if (table) setSelectedTable(table);
    }
    deleteHeldBill(billId);
  };

  const deleteHeldBill = (billId: string) => {
    const newHeldBills = heldBills.filter((b) => b.id !== billId);
    setHeldBillsState(newHeldBills);
    setHeldBills(newHeldBills);
    // Delete from cloud
    deleteHeldBillFromCloud(billId);
    // Also save the updated list
    saveHeldBillsToCloud(newHeldBills);
  };

  const getTableHeldBills = (tableNumber?: number): HeldBill[] => {
    if (tableNumber === undefined) {
      return heldBills;
    }
    return heldBills.filter((b) => b.tableNumber === tableNumber);
  };

  const updateTableStatus = (tableId: string, status: 'available' | 'occupied' | 'reserved') => {
    const newTables = tables.map((t) => (t.id === tableId ? { ...t, status } : t));
    setTablesState(newTables);
    setTables(newTables);
  };

  const printKOT = (order: Order) => {
    // In a real app, this would send to a thermal printer
    console.log('Printing KOT:', order);
    const updatedOrders = orders.map((o) =>
      o.id === order.id ? { ...o, kotPrinted: true, status: 'preparing' as const } : o
    );
    setOrdersState(updatedOrders);
    setOrders(updatedOrders);
  };

  // Store management - for store login, get from localStorage; otherwise from stores state
  const activeStore = React.useMemo(() => {
    const currentStoreId = activeStoreId || getCurrentStoreId();
    if (isStoreLogin) {
      const storedData = localStorage.getItem('pos_active_store_data');
      if (storedData) {
        try {
          return JSON.parse(storedData) as Store;
        } catch {
          return null;
        }
      }
    }
    if (currentStoreId) {
      return stores.find(s => s.id === currentStoreId) || null;
    }
    return null;
  }, [isStoreLogin, stores, activeStoreId, getCurrentStoreId]);

  const setActiveStoreId = (storeId: string | null) => {
    setActiveStoreIdState(storeId);
    setActiveStoreStorage(storeId);
  };

  const addStore = (storeData: Omit<Store, 'id' | 'createdAt' | 'isActive' | 'storeCode'> & { email?: string }): Store => {
    // Create a temporary local store object for immediate UI response
    const tempStore: Store = {
      ...storeData,
      id: generateId(),
      storeCode: generateStoreCode(),
      isActive: true,
      createdAt: new Date()
    };

    // Persist to Supabase asynchronously
    (async () => {
      try {
        // Get customer_id from auth context or localStorage
        const { data: { user } } = await supabase.auth.getUser();
        let customerId: string | null = null;
        let useEdgeFunction = false;

        if (user) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('customer_id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle();
          customerId = roleData?.customer_id || null;
        }

        if (!customerId) {
          // Try from store login - needs edge function (no RLS auth)
          const storeDataStr = localStorage.getItem('pos_active_store_data');
          if (storeDataStr) {
            const parsed = JSON.parse(storeDataStr);
            customerId = parsed.customer_id || null;
            useEdgeFunction = true;
          }
        }

        if (!customerId) {
          toast.error('Cannot create store: no business account linked');
          return;
        }

        if (!storeData.email?.trim()) {
          toast.error('Store email is required');
          return;
        }

        const storePayload = {
          customer_id: customerId,
          store_name: storeData.name,
          email: storeData.email.trim().toLowerCase(),
          password: storeData.password || null,
          address: storeData.address || null,
          phone: storeData.phone || null,
          business_type: storeData.businessType || 'restaurant',
          country: storeData.country || 'India',
          currency_code: storeData.currencyCode || 'INR',
          tax_type: storeData.taxType || 'GST',
          tax_percentage: storeData.taxPercentage ?? 0,
        };

        let dbStore: { id: string; store_code: string | null; store_name: string } | null = null;

        const { data, error } = await supabase.functions.invoke('create-store', {
          body: {
            ...storePayload,
            email: storeData.email?.trim().toLowerCase(),
          }
        });

        if (error || !data?.success) {
          console.error('Failed to create store via edge function:', error || data?.error);
          toast.error(data?.error || 'Failed to create store');
          return;
        }

        dbStore = data.store;

        if (!dbStore) return;

        // Update the local store with actual DB values
        const finalStore: Store = {
          ...storeData,
          id: dbStore.id,
          storeCode: dbStore.store_code || tempStore.storeCode,
          name: dbStore.store_name,
          isActive: true,
          createdAt: new Date()
        };

        setStoresState(prev => {
          const withoutTemp = prev.filter(s => s.id !== tempStore.id);
          return [...withoutTemp, finalStore];
        });
        setStoresStorage([...stores.filter(s => s.id !== tempStore.id), finalStore]);
        toast.success('Store created successfully!');
      } catch (err) {
        console.error('Store creation error:', err);
        toast.error('Failed to create store');
      }
    })();

    // Return temp store immediately for UI
    const updatedStores = [...stores, tempStore];
    setStoresState(updatedStores);
    setStoresStorage(updatedStores);
    return tempStore;
  };

  const loginStore = async (storeCode: string, password: string): Promise<Store | null> => {
    try {
      // Input validation - allow 8-digit codes or STR##### ref codes
      const sanitizedStoreCode = storeCode.trim().replace(/[<>'"&]/g, '');
      const sanitizedPassword = password.trim();

      const isValidFormat = /^[0-9]{8}$/.test(sanitizedStoreCode) || /^STR[0-9]{5}$/i.test(sanitizedStoreCode);
      if (!isValidFormat) {
        toast.error('Invalid store code format. Use 8 digits or STR#####.');
        return null;
      }

      if (sanitizedPassword.length < 4 || sanitizedPassword.length > 50) {
        toast.error('Invalid password format');
        return null;
      }

      // Use secure edge function for store login
      const { data, error } = await supabase.functions.invoke('secure-store-login', {
        body: { 
          store_code: sanitizedStoreCode, 
          password: sanitizedPassword 
        }
      });
      
      if (error) {
        console.error('Store login error:', error);
        toast.error('Login failed. Please try again.');
        return null;
      }

      if (data?.error) {
        toast.error(data.error);
        return null;
      }
      
      if (data?.success) {
        const store: Store = {
          id: data.store_id,
          name: data.store_name,
          address: data.store_address || '',
          phone: data.store_phone || '',
          storeCode: sanitizedStoreCode,
          // SECURITY: Don't store password in localStorage
          password: '',
          isActive: true,
          createdAt: new Date(),
          customer_id: data.customer_id
        };
        
        setActiveStoreIdState(data.store_id);
        setActiveStoreStorage(data.store_id);
        setIsStoreLogin(true);
        localStorage.setItem('pos_is_store_login', 'true');
        // Store store_code directly for reliable auth
        localStorage.setItem('pos_store_code', sanitizedStoreCode);
        // Store only non-sensitive data
        localStorage.setItem('pos_active_store_data', JSON.stringify({
          id: store.id,
          name: store.name,
          address: store.address,
          phone: store.phone,
          storeCode: store.storeCode,
          store_code: sanitizedStoreCode,
          customer_id: store.customer_id,
          subscription_tier: data.subscription_tier || 'basic',
          business_type: data.business_type || 'restaurant',
          enabled_addons: data.enabled_addons || [],
          staff_limit: data.staff_limit || 2,
          outlet_limit: data.outlet_limit || 1,
        }));
        
        return store;
      }
      
      toast.error('Invalid store code or password');
      return null;
    } catch (error) {
      console.error('Store login error:', error);
      toast.error('An unexpected error occurred');
      return null;
    }
  };

  const logoutStore = () => {
    setActiveStoreIdState(null);
    setActiveStoreStorage(null);
    setIsStoreLogin(false);
    localStorage.removeItem('pos_is_store_login');
    localStorage.removeItem('pos_active_store_data');
    localStorage.removeItem('pos_store_code');
    // IMPORTANT: Do NOT clear localStorage data (orders, inventory, etc.)
    // Data is scoped by store_id and will be naturally isolated on next login
    // Clearing would cause data loss for the business
  };

  const updateStore = (id: string, updates: Partial<Store>) => {
    const updatedStores = stores.map(store => 
      store.id === id ? { ...store, ...updates } : store
    );
    setStoresState(updatedStores);
    setStoresStorage(updatedStores);
  };

  const deleteStore = (id: string) => {
    const updatedStores = stores.filter(store => store.id !== id);
    setStoresState(updatedStores);
    setStoresStorage(updatedStores);
    if (activeStoreId === id) {
      setActiveStoreId(null);
    }
    toast.success('Store deleted');
  };

  const getStoreSales = (storeId: string): number => {
    const today = new Date().toDateString();
    return orders
      .filter(order => 
        order.storeId === storeId && 
        new Date(order.createdAt).toDateString() === today &&
        order.status === 'completed'
      )
      .reduce((sum, order) => sum + order.total, 0);
  };

  // Low stock items - based on per-item stockAlertThreshold
  const lowStockItems = menuItems.filter(item => {
    if (item.stockAlertThreshold !== undefined && item.stock !== undefined) {
      return item.stock <= item.stockAlertThreshold;
    }
    return false;
  });

  return (
    <POSContext.Provider
      value={{
        menuItems,
        categories,
        activeCategory,
        setActiveCategory,
        toggleItemAvailability,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartSubtotal,
        cartTax,
        cartTotal,
        discount,
        setDiscount,
        orders,
        recentBills,
        currentOrderType,
        setCurrentOrderType,
        selectedTable,
        setSelectedTable,
        placeOrder,
        createKOTOrder,
        printBillForOrder,
        directBillPrint,
        updateOrderStatus,
        updateOrderPaymentMethod,
        cancelOrder,
        clearAllOrders,
        heldBills,
        holdBill,
        recallBill,
        deleteHeldBill,
        getTableHeldBills,
        tables,
        updateTableStatus,
        printKOT,
        isOnline,
        todayStats,
        addMenuItems,
        addCategory,
        deleteMenuItem,
        updateMenuItem,
        syncCategoriesFromMenu,
        stores,
        activeStore,
        setActiveStoreId,
        addStore,
        loginStore,
        logoutStore,
        updateStore,
        deleteStore,
        getStoreSales,
        isStoreLogin,
        lowStockItems,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};

// Safe version that returns null instead of throwing - for components that may render outside provider
export const usePOSSafe = () => {
  return useContext(POSContext);
};
