import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isSupabasePermissionDeniedError, isSupabaseTableMissingError } from '@/lib/supabaseErrorHelpers';


/**
 * Centralized hook for reading/writing store settings.
 *
 * - Owner/Admin login: read/write directly via DB (RLS)
 * - Store/Staff (store-code) login: proxy through backend function (sync-store-data)
 *
 * Always persists settings via Supabase and does not fallback to localStorage.
 */
export function useStoreSettings() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const getStoreId = useCallback((): string | null => {
    const storeId = localStorage.getItem('pos_store_id');
    if (storeId) return storeId;

    const storeData = localStorage.getItem('pos_active_store_data');
    if (storeData) {
      try {
        const parsed = JSON.parse(storeData);
        return parsed?.id || parsed?.storeId || null;
      } catch {
        return null;
      }
    }

    const activeStore = localStorage.getItem('pos_active_store');
    if (activeStore) {
      try {
        const parsed = JSON.parse(activeStore);
        if (typeof parsed === 'string') return parsed;
        return parsed?.id || parsed?.storeId || null;
      } catch {
        return activeStore;
      }
    }

    const ownerSelectedStoreId = localStorage.getItem('owner_selected_store_id');
    if (ownerSelectedStoreId) return ownerSelectedStoreId;

    const storeLogin = localStorage.getItem('store_login');
    if (storeLogin) {
      try {
        return JSON.parse(storeLogin).store_id || null;
      } catch {
        return null;
      }
    }

    const storeLoginData = localStorage.getItem('pos_store_login_data');
    if (storeLoginData) {
      try {
        return JSON.parse(storeLoginData).store_id || null;
      } catch {
        return null;
      }
    }

    return null;
  }, []);

  const getStoreCode = useCallback((): string | null => {
    const direct = localStorage.getItem('pos_store_code');
    if (direct) return direct;

    const storeData = localStorage.getItem('pos_active_store_data');
    if (storeData) {
      try {
        const parsed = JSON.parse(storeData);
        return parsed?.storeCode || parsed?.store_code || null;
      } catch {
        return null;
      }
    }

    const ownerSelectedStoreCode = localStorage.getItem('owner_selected_store_code');
    if (ownerSelectedStoreCode) return ownerSelectedStoreCode;

    const storeLogin = localStorage.getItem('pos_store_login_data');
    if (storeLogin) {
      try {
        const parsed = JSON.parse(storeLogin);
        return parsed?.store_code || null;
      } catch {
        return null;
      }
    }

    return null;
  }, []);

  const hasJwtSession = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      return !!data.session?.access_token;
    } catch {
      return false;
    }
  }, []);

  const fetchViaFunction = useCallback(async () => {
    const store_id = getStoreId();
    if (!store_id) return null;

    const store_code = getStoreCode();

    const { data, error } = await supabase.functions.invoke('sync-store-data', {
      body: {
        action: 'fetch',
        store_id,
        store_code,
        data_type: 'settings',
      },
    });

    if (error) {
      console.error('[useStoreSettings] Function fetch failed:', error);
      return null;
    }

    const rows = (data as any)?.items || [];
    const out: Record<string, any> = {};
    rows.forEach((r: any) => {
      if (r?.setting_key) out[r.setting_key] = r.setting_value;
    });

    return out;
  }, [getStoreCode, getStoreId]);

  const saveViaFunction = useCallback(async (settings: Record<string, any>) => {
    const store_id = getStoreId();
    if (!store_id) return;

    const store_code = getStoreCode();

    const { error } = await supabase.functions.invoke('sync-store-data', {
      body: {
        action: 'save',
        store_id,
        store_code,
        data_type: 'settings',
        settings,
      },
    });

    if (error) {
      console.error('[useStoreSettings] Function save failed:', error);
      throw error;
    }
  }, [getStoreCode, getStoreId]);



  // Load all settings for current store
  const loadSettings = useCallback(async () => {
    if (!mountedRef.current) return;

    const storeId = getStoreId();
    if (!storeId) {
      setLoadError('Store context unavailable. Cannot load settings.');
      setIsLoaded(true);
      return;
    }

    try {
      if (!navigator.onLine) {
        throw new Error('Offline mode is not supported for settings. Please connect to the network.');
      }

      const jwt = await hasJwtSession();

      if (jwt) {
        const { data, error } = await supabase
          .from('store_settings')
          .select('setting_key, setting_value')
          .eq('store_id', storeId);

        if (error) {
          if (isSupabasePermissionDeniedError(error)) {
            console.warn('Store settings permission denied. Falling back to function fetch.');
            const fnSettings = await fetchViaFunction();
            setSettings(fnSettings || {});
            return;
          }
          console.error('Failed to load store settings from DB:', error);
          throw error;
        }

        const dbSettings: Record<string, any> = {};
        data?.forEach((row) => {
          dbSettings[row.setting_key] = row.setting_value;
        });

        setSettings(dbSettings);
        return;
      }

      const fnSettings = await fetchViaFunction();
      setSettings(fnSettings || {});
      return;
    } catch (err: any) {
      const message = err?.message || 'Failed to load settings from Supabase.';
      console.error('Error loading settings:', err);
      setLoadError(message);
      setSettings({});
    } finally {
      setIsLoaded(true);
    }
  }, [getStoreId, hasJwtSession, fetchViaFunction]);

  useEffect(() => {
    loadSettings();
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getSetting = useCallback(
    <T = any,>(key: string, defaultValue?: T): T => {
      return (settings[key] ?? defaultValue ?? (undefined as any)) as T;
    },
    [settings]
  );

  const saveSetting = useCallback(
    async (key: string, value: any) => {
      const storeId = getStoreId();
      if (!storeId) {
        throw new Error('Missing store_id; cannot save setting');
      }

      const jwt = await hasJwtSession();
      if (!navigator.onLine) {
        throw new Error('Offline mode is not supported for saving settings. Please reconnect.');
      }

      if (jwt) {
        const { error } = await supabase
          .from('store_settings')
          .upsert(
            {
              store_id: storeId,
              setting_key: key,
              setting_value: value,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'store_id,setting_key' }
          );

        if (error) {
          console.error('Failed to save setting to DB:', error);
          throw error;
        }

        setSettings((prev) => ({
          ...prev,
          [key]: value,
        }));
        return;
      }

      await saveViaFunction({ [key]: value });
      setSettings((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [getStoreId, hasJwtSession, saveViaFunction]
  );

  const storeId = getStoreId();

  return {
    settings,
    storeId,
    getSetting,
    saveSetting,
    isLoaded,
    loadError,
    reloadSettings: loadSettings,
  };
}

