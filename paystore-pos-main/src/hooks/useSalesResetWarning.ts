import { useState, useEffect, useCallback, useRef } from 'react';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { usePaymentSettings } from '@/hooks/usePaymentSettings';
import {
  formatBusinessResetTime,
  getBusinessDayWindow,
  getTimeUntil,
  getWarningStage,
  BusinessDayWarningStage,
} from '@/lib/businessDayManager';

interface SalesResetConfig {
  enabled: boolean;
  resetMode: 'hours' | 'daily';
  resetHours: number;
  resetTime: string; // HH:mm for daily mode
  lastResetTime: string | null;
  warningMinutes: number;
}

const DEFAULT_CONFIG: SalesResetConfig = {
  enabled: true,
  resetMode: 'daily',
  resetHours: 24,
  resetTime: '06:00',
  lastResetTime: null,
  warningMinutes: 30,
};

const WARNING_STORAGE_KEY = 'pos_sales_reset_warning_last_stage';

const loadStoredWarningState = () => {
  try {
    const stored = localStorage.getItem(WARNING_STORAGE_KEY);
    if (!stored) return { businessDate: '', stage: 'none' as BusinessDayWarningStage };
    return JSON.parse(stored) as { businessDate: string; stage: BusinessDayWarningStage };
  } catch {
    return { businessDate: '', stage: 'none' as BusinessDayWarningStage };
  }
};

const saveStoredWarningState = (businessDate: string, stage: BusinessDayWarningStage) => {
  localStorage.setItem(WARNING_STORAGE_KEY, JSON.stringify({ businessDate, stage }));
};

export const useSalesResetWarning = () => {
  const { getSetting, saveSetting, isLoaded } = useStoreSettings();
  const { settings: paymentSettings, loaded: paymentLoaded } = usePaymentSettings();
  const [config, setConfig] = useState<SalesResetConfig>(DEFAULT_CONFIG);
  const [showWarning, setShowWarning] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState('0m');
  const [formattedResetTime, setFormattedResetTime] = useState(formatBusinessResetTime(DEFAULT_CONFIG.resetTime));
  const [lastStoredStage, setLastStoredStage] = useState<{ businessDate: string; stage: BusinessDayWarningStage }>({ businessDate: '', stage: 'none' });
  const lastStageRef = useRef<BusinessDayWarningStage>('none');

  const getCurrentStoreId = useCallback((): string | null => {
    const activeStoreData = localStorage.getItem('pos_active_store_data');
    if (activeStoreData) {
      try {
        const parsed = JSON.parse(activeStoreData);
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

    return localStorage.getItem('pos_store_id');
  }, []);

  const getAlertMinutes = useCallback(() => {
    const dedicated = getSetting<number>('sale_reset_alert_minutes_before');
    if (dedicated !== undefined && dedicated !== null) return Number(dedicated) || 30;

    const restaurantConfig = getSetting<Record<string, any>>('pos_restaurant_config', {});
    return Number(restaurantConfig?.saleResetAlertMinutes) || 30;
  }, [getSetting]);

  useEffect(() => {
    if (!isLoaded) return;

    const storeId = getCurrentStoreId();
    const saved = getSetting<SalesResetConfig>('pos_sales_reset_config');
    const merged = saved ? { ...DEFAULT_CONFIG, ...saved } : { ...DEFAULT_CONFIG, lastResetTime: new Date().toISOString() };
    const warningMinutes = getAlertMinutes();
    const normalized = { ...merged, warningMinutes };

    if (!normalized.lastResetTime) {
      normalized.lastResetTime = new Date().toISOString();
      if (storeId) {
        saveSetting('pos_sales_reset_config', normalized).catch(() => undefined);
      }
    }

    if (!saved && storeId) {
      saveSetting('pos_sales_reset_config', normalized).catch(() => undefined);
    }

    setConfig(normalized);
  }, [isLoaded, getAlertMinutes, getCurrentStoreId, getSetting, saveSetting]);

  useEffect(() => {
    setLastStoredStage(loadStoredWarningState());
  }, []);

  useEffect(() => {
    if (!paymentLoaded) return;
    setFormattedResetTime(formatBusinessResetTime(paymentSettings.businessDateResetTime || config.resetTime));
  }, [paymentLoaded, paymentSettings.businessDateResetTime, config.resetTime]);

  useEffect(() => {
    if (!config.enabled || !paymentLoaded) return;

    const refreshState = () => {
      const now = new Date();
      const resetTime = paymentSettings.businessDateResetTime || config.resetTime || DEFAULT_CONFIG.resetTime;
      const warningMinutes = config.warningMinutes || getAlertMinutes();

      const window = getBusinessDayWindow(resetTime, undefined, now);
      const stage = getWarningStage(window.nextResetAt, warningMinutes, now);
      const timeLeft = getTimeUntil(window.nextResetAt, now);
      setTimeUntilReset(timeLeft);
      setFormattedResetTime(formatBusinessResetTime(resetTime));

      const shouldShow = stage !== 'none';
      const shouldTrigger = window.businessDate !== lastStoredStage.businessDate || stage !== lastStoredStage.stage;

      if (shouldShow && shouldTrigger) {
        setShowWarning(true);
        saveStoredWarningState(window.businessDate, stage);
        setLastStoredStage({ businessDate: window.businessDate, stage });
        lastStageRef.current = stage;
      } else if (!shouldShow) {
        setShowWarning(false);
      }
    };

    refreshState();
    const interval = window.setInterval(refreshState, 15000);
    return () => window.clearInterval(interval);
  }, [config, paymentSettings.businessDateResetTime, paymentLoaded, lastStoredStage]);

  const handleResetNow = useCallback(() => {
    localStorage.setItem('pos_orders', '[]');

    const updatedConfig = { ...config, lastResetTime: new Date().toISOString() };
    if (getCurrentStoreId()) {
      saveSetting('pos_sales_reset_config', updatedConfig).catch(() => undefined);
    }
    setConfig(updatedConfig);
    setShowWarning(false);
    window.location.reload();
  }, [config, getCurrentStoreId, saveSetting]);

  const handleExtendTime = useCallback((minutesToAdd: number = 30, manualTime?: string) => {
    const now = new Date();
    const resetTime = paymentSettings.businessDateResetTime || config.resetTime || DEFAULT_CONFIG.resetTime;
    const currentWindow = getBusinessDayWindow(resetTime, undefined, now);
    const extendedReset = manualTime
      ? (() => {
          const [hours, minutes] = manualTime.split(':').map(Number);
          const manualDate = new Date(currentWindow.nextResetAt);
          manualDate.setHours(hours, minutes, 0, 0);
          return manualDate;
        })()
      : new Date(currentWindow.nextResetAt.getTime() + minutesToAdd * 60 * 1000);

    const updatedConfig = {
      ...config,
      resetMode: 'daily',
      resetTime: `${extendedReset.getHours().toString().padStart(2, '0')}:${extendedReset.getMinutes().toString().padStart(2, '0')}`,
      lastResetTime: config.lastResetTime || now.toISOString(),
    };

    if (getCurrentStoreId()) {
      saveSetting('pos_sales_reset_config', updatedConfig).catch(() => undefined);
    }
    setConfig(updatedConfig);
    setShowWarning(false);
  }, [config, getCurrentStoreId, paymentSettings.businessDateResetTime, saveSetting]);

  const dismissWarning = useCallback(() => {
    setShowWarning(false);
  }, []);

  return {
    showWarning,
    timeUntilReset,
    formattedResetTime,
    config,
    handleResetNow,
    handleExtendTime,
    dismissWarning,
  };
};
