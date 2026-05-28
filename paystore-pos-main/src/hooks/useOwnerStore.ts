import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export interface SelectedStore {
  id: string;
  store_name: string;
  store_code: string | null;
  address: string | null;
  phone?: string | null;
  customer_id?: string | null;
  subscription_tier?: string | null;
  business_type?: string | null;
  enabled_addons?: string[];
  staff_limit?: number;
  outlet_limit?: number;
}

const buildActiveStoreData = (store: SelectedStore) => {
  return {
    id: store.id,
    storeId: store.id,
    storeName: store.store_name,
    storeAddress: store.address,
    storePhone: store.phone || null,
    customerId: store.customer_id || null,
    customer_id: store.customer_id || null,
    storeCode: store.store_code || null,
    store_code: store.store_code || null,
    subscription_tier: store.subscription_tier || null,
    business_type: store.business_type || null,
    enabled_addons: store.enabled_addons || [],
    staff_limit: store.staff_limit || 2,
    outlet_limit: store.outlet_limit || 1,
  };
};

export const useOwnerStore = () => {
  const { userRole, isAuthenticated } = useSupabaseAuth();
  const normalizeRole = (role?: string | null) => role?.toLowerCase().trim() || '';
  const currentRole = normalizeRole(userRole?.role);
  const isOwner = currentRole === 'owner' || currentRole === 'admin';
  
  const [selectedStore, setSelectedStore] = useState<SelectedStore | null>(() => {
    const storeId = localStorage.getItem('owner_selected_store_id');
    const storeName = localStorage.getItem('owner_selected_store_name');
    const storeCode = localStorage.getItem('owner_selected_store_code');
    const storeAddress = localStorage.getItem('owner_selected_store_address');
    const storePhone = localStorage.getItem('owner_selected_store_phone');
    const customerId = localStorage.getItem('owner_selected_store_customer_id');
    if (storeId && storeName) {
      const store: SelectedStore = {
        id: storeId,
        store_name: storeName,
        store_code: storeCode || null,
        address: storeAddress || null,
        phone: storePhone || null,
      };
      if (customerId) store.customer_id = customerId;
      const activeStoreData = localStorage.getItem('pos_active_store_data');
      if (!activeStoreData) {
        localStorage.setItem('pos_active_store_data', JSON.stringify(buildActiveStoreData(store)));
        localStorage.setItem('pos_active_store', JSON.stringify(store.id));
        localStorage.setItem('pos_store_id', store.id);
        if (store.store_code) {
          localStorage.setItem('pos_store_code', store.store_code);
        }
      }
      return store;
    }
    return null;
  });

  const [shouldShowStoreSelection, setShouldShowStoreSelection] = useState(false);

  // Check if owner needs to select store on first login
  useEffect(() => {
    if (isOwner && isAuthenticated) {
      const hasSelectedStore = localStorage.getItem('owner_store_selection_done');
      if (!hasSelectedStore) {
        setShouldShowStoreSelection(true);
      }
    }
  }, [isOwner, isAuthenticated]);

  const selectStore = useCallback((store: SelectedStore | null) => {
    if (store) {
      localStorage.setItem('owner_selected_store_id', store.id);
      localStorage.setItem('owner_selected_store_name', store.store_name);
      localStorage.setItem('owner_selected_store_code', store.store_code || '');
      localStorage.setItem('owner_selected_store_address', store.address || '');
      localStorage.setItem('owner_selected_store_phone', store.phone || '');
      if (store.customer_id) {
        localStorage.setItem('owner_selected_store_customer_id', store.customer_id);
      } else {
        localStorage.removeItem('owner_selected_store_customer_id');
      }
      localStorage.setItem('pos_active_store', JSON.stringify(store.id));
      localStorage.setItem('pos_store_id', store.id);
      if (store.store_code) {
        localStorage.setItem('pos_store_code', store.store_code);
      }
      localStorage.setItem('pos_active_store_data', JSON.stringify(buildActiveStoreData(store)));
      setSelectedStore(store);
    } else {
      localStorage.removeItem('owner_selected_store_id');
      localStorage.removeItem('owner_selected_store_name');
      localStorage.removeItem('owner_selected_store_code');
      localStorage.removeItem('owner_selected_store_address');
      localStorage.removeItem('owner_selected_store_phone');
      localStorage.removeItem('owner_selected_store_customer_id');
      localStorage.removeItem('pos_active_store_data');
      localStorage.removeItem('pos_active_store');
      localStorage.removeItem('pos_store_id');
      localStorage.removeItem('pos_store_code');
      setSelectedStore(null);
    }
    // Notify other contexts (POSContext) that owner selection changed
    try {
      window.dispatchEvent(new Event('owner_store_selection'));
    } catch (e) {
      // ignore
    }
    localStorage.setItem('owner_store_selection_done', 'true');
    setShouldShowStoreSelection(false);
  }, []);

  const getSelectedStoreId = useCallback((): string | null => {
    return selectedStore?.id || null;
  }, [selectedStore]);

  const getSelectedStoreName = useCallback((): string => {
    return selectedStore?.store_name || 'All Stores';
  }, [selectedStore]);

  const clearStoreSelection = useCallback(() => {
    localStorage.removeItem('owner_selected_store_id');
    localStorage.removeItem('owner_selected_store_name');
    localStorage.removeItem('owner_selected_store_code');
    localStorage.removeItem('owner_selected_store_address');
    localStorage.removeItem('owner_selected_store_phone');
    localStorage.removeItem('owner_selected_store_customer_id');
    localStorage.removeItem('owner_store_selection_done');
    localStorage.removeItem('pos_active_store_data');
    localStorage.removeItem('pos_active_store');
    localStorage.removeItem('pos_store_id');
    localStorage.removeItem('pos_store_code');
    setSelectedStore(null);
    try { window.dispatchEvent(new Event('owner_store_selection')); } catch {}
  }, []);

  const dismissStoreSelection = useCallback(() => {
    localStorage.setItem('owner_store_selection_done', 'true');
    setShouldShowStoreSelection(false);
  }, []);

  return {
    selectedStore,
    selectedStoreId: selectedStore?.id || null,
    selectedStoreName: selectedStore?.store_name || 'All Stores',
    shouldShowStoreSelection,
    isOwner,
    selectStore,
    getSelectedStoreId,
    getSelectedStoreName,
    clearStoreSelection,
    dismissStoreSelection
  };
};
