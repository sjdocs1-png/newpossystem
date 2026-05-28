// Offline-first data store using localStorage

export interface MenuItemVariation {
  id: string;
  menuItemId: string;
  name: string; // e.g., "500ml", "1L", "Small", "Large"
  sku?: string;
  price: number;
  isAvailable: boolean;
  stock?: number;
  sortOrder: number;
  unit?: string; // g, ml, ltr, kg, pcs
}

export interface MenuItem {
  id: string;
  name: string;
  nameHindi?: string;
  price: number;
  category: string;
  color?: string;
  image?: string;
  isAvailable: boolean;
  preparationTime?: number;
  stock?: number; // undefined means unlimited stock
  storeStock?: { [storeId: string]: number }; // Store-wise stock
  stockAlertThreshold?: number; // Optional: Alert when stock falls below this value
  linkedInventoryId?: string; // ID of linked inventory item (legacy single link)
  gramagePerUnit?: number; // Grams of inventory item used per unit sold (legacy)
  ingredients?: MenuItemIngredient[]; // Multiple ingredients for recipe-based linking
  sku?: string; // Stock Keeping Unit code
  barcode?: string; // Barcode value for scanning
  variations?: MenuItemVariation[]; // Sub-variations like sizes (500ml, 1L etc.)
}

export interface Category {
  id: string;
  name: string;
  nameHindi?: string;
  icon: string;
  color: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  billNumber?: string; // Bill number for completed sales
  kotNumber?: string; // KOT number for kitchen orders
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  orderType: 'dine-in' | 'takeaway' | 'delivery' | 'online' | 'qr';
  tableNumber?: number;
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: 'cash' | 'card' | 'upi' | 'split' | 'due' | 'part' | 'wallet' | 'credit';
  createdAt: Date;
  kotPrinted: boolean;
  isDirectBill?: boolean; // True if bill printed without KOT (won't show in orders)
  billPrinted?: boolean; // True if bill has been printed (adds to sales)
  deliveryBoy?: string;
  onlineSource?: 'swiggy' | 'zomato' | 'direct';
  storeId?: string;
  cancelReason?: string; // Reason for cancellation
  cancelledAt?: string; // ISO timestamp when cancelled
}

export interface HeldBill {
  id: string;
  items: CartItem[];
  tableNumber?: number;
  customerName?: string;
  heldAt: Date;
}

export interface Staff {
  id: string;
  name: string;
  role: 'admin' | 'cashier' | 'waiter' | 'kitchen' | 'delivery';
  phone: string;
  pin: string;
  isActive: boolean;
  attendance: AttendanceRecord[];
  facePhotoUrl?: string; // URL to face photo in storage
}

export interface AttendanceRecord {
  date: string;
  checkIn?: Date;
  checkOut?: Date;
  status: 'present' | 'absent' | 'half-day';
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  currentOrderId?: string;
  name?: string; // Custom table name/alias (e.g., "Window Seat", "VIP 1")
  section?: string; // Section this table belongs to
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minStock: number;
  costPerUnit: number;
  costUnit?: string; // Unit for cost calculation (kg, g, ltr, ml, pcs)
  lastUpdated: Date;
  components?: InventoryComponent[]; // Sub-components for this inventory item
  productionYield?: number; // How much is produced from components (in base unit g/ml/pcs)
  productionYieldUnit?: string; // Unit for production yield
}

export interface InventoryComponent {
  id: string;
  childInventoryId: string;
  quantityRequired: number;
  unit: string;
}

export interface MenuItemIngredient {
  id: string;
  inventoryItemId: string;
  quantityRequired: number;
  unit: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: Date;
  paidBy: string;
  storeId?: string;
}

export interface Store {
  id: string;
  name: string;
  storeCode: string;
  password: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  customer_id?: string;
  businessType?: 'restaurant' | 'retail';
  country?: string;
  currencyCode?: string;
  taxType?: string;
  taxPercentage?: number;
  loginEmail?: string;
}

// Generate 8 digit store code
export const generateStoreCode = (): string => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

// Default data - Generic categories for any business type
export const defaultCategories: Category[] = [
  { id: 'general', name: 'General', icon: '📦', color: 'cat-starters' },
  { id: 'grocery', name: 'Grocery', icon: '🛒', color: 'cat-food' },
  { id: 'electronics', name: 'Electronics', icon: '📱', color: 'cat-food' },
  { id: 'hardware', name: 'Hardware', icon: '🔧', color: 'cat-food' },
  { id: 'food', name: 'Food & Beverages', icon: '🍽️', color: 'cat-drinks' },
  { id: 'stationery', name: 'Stationery', icon: '📝', color: 'cat-desserts' },
];

export const defaultMenuItems: MenuItem[] = [
  { id: '1', name: 'Product 1', price: 100, category: 'general', color: 'hsl(142 63% 45%)', isAvailable: true, preparationTime: 0 },
  { id: '2', name: 'Product 2', price: 150, category: 'general', color: 'hsl(28 95% 55%)', isAvailable: true, preparationTime: 0 },
  { id: '3', name: 'Product 3', price: 200, category: 'general', color: 'hsl(204 89% 53%)', isAvailable: true, preparationTime: 0 },
];

export const defaultTables: Table[] = [
  { id: 't1', number: 1, capacity: 2, status: 'available' },
  { id: 't2', number: 2, capacity: 2, status: 'available' },
  { id: 't3', number: 3, capacity: 4, status: 'available' },
  { id: 't4', number: 4, capacity: 4, status: 'available' },
  { id: 't5', number: 5, capacity: 4, status: 'available' },
  { id: 't6', number: 6, capacity: 6, status: 'available' },
  { id: 't7', number: 7, capacity: 6, status: 'available' },
  { id: 't8', number: 8, capacity: 8, status: 'available' },
];

// Storage helper functions
const STORAGE_KEYS = {
  MENU_ITEMS: 'pos_menu_items',
  CATEGORIES: 'pos_categories',
  ORDERS: 'pos_orders',
  HELD_BILLS: 'pos_held_bills',
  STAFF: 'pos_staff',
  TABLES: 'pos_tables',
  INVENTORY: 'pos_inventory',
  EXPENSES: 'pos_expenses',
  SETTINGS: 'pos_settings',
  STORES: 'pos_stores',
  ACTIVE_STORE: 'pos_active_store',
};

// Get the current store-scoped storage key
// This ensures data is isolated per store and doesn't mix across devices/logins
const getScopedKey = (baseKey: string): string => {
  const activeStoreId = storage.get<string | null>(STORAGE_KEYS.ACTIVE_STORE, null);
  // Also check store login data
  if (!activeStoreId) {
    try {
      const storeData = localStorage.getItem('pos_active_store_data');
      if (storeData) {
        const parsed = JSON.parse(storeData);
        if (parsed?.id) return `${baseKey}_${parsed.id}`;
      }
    } catch {}
  }
  if (activeStoreId) return `${baseKey}_${activeStoreId}`;
  return baseKey; // fallback to unscoped
};

export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage error:', error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Storage error:', error);
    }
  },
};

// Initialize default data - only if not already present
// IMPORTANT: Does NOT overwrite existing data
export const initializeData = () => {
  // These are unscoped (global app defaults, only set once ever)
  if (!localStorage.getItem(STORAGE_KEYS.MENU_ITEMS)) {
    storage.set(STORAGE_KEYS.MENU_ITEMS, defaultMenuItems);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    storage.set(STORAGE_KEYS.CATEGORIES, defaultCategories);
  }
  if (!localStorage.getItem(STORAGE_KEYS.TABLES)) {
    storage.set(STORAGE_KEYS.TABLES, defaultTables);
  }
  // Scoped data - initialize only if absent for current store
  const scopedOrders = getScopedKey(STORAGE_KEYS.ORDERS);
  if (!localStorage.getItem(scopedOrders)) {
    storage.set(scopedOrders, []);
  }
  const scopedHeldBills = getScopedKey(STORAGE_KEYS.HELD_BILLS);
  if (!localStorage.getItem(scopedHeldBills)) {
    storage.set(scopedHeldBills, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.STAFF)) {
    storage.set(STORAGE_KEYS.STAFF, []);
  }
  const scopedInventory = getScopedKey(STORAGE_KEYS.INVENTORY);
  if (!localStorage.getItem(scopedInventory)) {
    storage.set(scopedInventory, []);
  }
  const scopedExpenses = getScopedKey(STORAGE_KEYS.EXPENSES);
  if (!localStorage.getItem(scopedExpenses)) {
    storage.set(scopedExpenses, []);
  }
};

// Data access functions
export const getMenuItems = (): MenuItem[] => storage.get(STORAGE_KEYS.MENU_ITEMS, defaultMenuItems);
export const setMenuItems = (items: MenuItem[]) => storage.set(STORAGE_KEYS.MENU_ITEMS, items);

export const getCategories = (): Category[] => storage.get(STORAGE_KEYS.CATEGORIES, defaultCategories);
export const setCategories = (categories: Category[]) => storage.set(STORAGE_KEYS.CATEGORIES, categories);

// Orders, held bills, inventory, expenses are store-scoped
export const getOrders = (): Order[] => storage.get(getScopedKey(STORAGE_KEYS.ORDERS), []);
export const setOrders = (orders: Order[]) => storage.set(getScopedKey(STORAGE_KEYS.ORDERS), orders);
export const addOrder = (order: Order) => {
  const orders = getOrders();
  orders.push(order);
  setOrders(orders);
};

export const getHeldBills = (): HeldBill[] => storage.get(getScopedKey(STORAGE_KEYS.HELD_BILLS), []);
export const setHeldBills = (bills: HeldBill[]) => storage.set(getScopedKey(STORAGE_KEYS.HELD_BILLS), bills);

export const getTables = (): Table[] => storage.get(STORAGE_KEYS.TABLES, defaultTables);
export const setTables = (tables: Table[]) => storage.set(STORAGE_KEYS.TABLES, tables);

export const getStaff = (): Staff[] => storage.get(STORAGE_KEYS.STAFF, []);
export const setStaff = (staff: Staff[]) => storage.set(STORAGE_KEYS.STAFF, staff);

export const getInventory = (): InventoryItem[] => storage.get(getScopedKey(STORAGE_KEYS.INVENTORY), []);
export const setInventory = (items: InventoryItem[]) => storage.set(getScopedKey(STORAGE_KEYS.INVENTORY), items);

export const getExpenses = (): Expense[] => storage.get(getScopedKey(STORAGE_KEYS.EXPENSES), []);
export const setExpenses = (expenses: Expense[]) => storage.set(getScopedKey(STORAGE_KEYS.EXPENSES), expenses);

export const getStores = (): Store[] => storage.get(STORAGE_KEYS.STORES, []);
export const setStores = (stores: Store[]) => storage.set(STORAGE_KEYS.STORES, stores);

export const getActiveStore = (): string | null => storage.get(STORAGE_KEYS.ACTIVE_STORE, null);
export const setActiveStore = (storeId: string | null) => storage.set(STORAGE_KEYS.ACTIVE_STORE, storeId);

// Generate unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Generate bill number (sequential for the day)
export const generateBillNumber = (): string => {
  const today = new Date().toDateString();
  const key = 'pos_bill_counter_' + today;
  const counter = parseInt(localStorage.getItem(key) || '0') + 1;
  localStorage.setItem(key, counter.toString());
  return `B${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${counter.toString().padStart(4, '0')}`;
};

// Generate KOT number (sequential for the day)
export const generateKOTNumber = (): string => {
  const today = new Date().toDateString();
  const key = 'pos_kot_counter_' + today;
  const counter = parseInt(localStorage.getItem(key) || '0') + 1;
  localStorage.setItem(key, counter.toString());
  return `K${counter.toString().padStart(4, '0')}`;
};

// Format currency - now uses locale settings
export const formatCurrency = (amount: number): string => {
  // Get country from localStorage for non-React contexts
  const storedCountry = localStorage.getItem('pos_country') || 'IN';
  
  const currencyConfig: Record<string, { locale: string; currency: string; minFrac: number; maxFrac: number }> = {
    'IN': { locale: 'en-IN', currency: 'INR', minFrac: 0, maxFrac: 0 },
    'OM': { locale: 'ar-OM', currency: 'OMR', minFrac: 2, maxFrac: 3 },
    'SA': { locale: 'ar-SA', currency: 'SAR', minFrac: 2, maxFrac: 2 },
    'DE': { locale: 'de-DE', currency: 'EUR', minFrac: 2, maxFrac: 2 },
    'GB': { locale: 'en-GB', currency: 'GBP', minFrac: 2, maxFrac: 2 },
  };
  
  const config = currencyConfig[storedCountry] || currencyConfig['IN'];
  
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: config.minFrac,
    maximumFractionDigits: config.maxFrac,
  }).format(amount);
};
