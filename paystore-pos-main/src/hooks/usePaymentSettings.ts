import { useState, useEffect, useCallback } from 'react';
import { useStoreSettings } from '@/hooks/useStoreSettings';

export interface PaymentSettings {
  enableCash: boolean;
  enableCard: boolean;
  enableUpi: boolean;
  enableQrBilling: boolean;
  enableAutoSettlement: boolean;
  enableWebhookVerification: boolean;
  enableWallet: boolean;
  enableNetbanking: boolean;
  enableSplitPayment: boolean;
  enablePartialPayment: boolean;
  enableSound: boolean;
  enableAutoCloseAfterPayment: boolean;
  autoCloseDelaySeconds: number;
  qrExpiryMinutes: number;
  autoRefreshExpiredQr: boolean;
  showCountdown: boolean;
  soundVolume: number;
  soundRepeatCount: number;
  duplicateWebhookProtection: boolean;
  adminOnlyManualOverride: boolean;
  showGrossNet: 'gross' | 'net';
  businessDateResetTime: string;
}

const DEFAULT_SETTINGS: PaymentSettings = {
  enableCash: true,
  enableCard: true,
  enableUpi: true,
  enableQrBilling: true,
  enableAutoSettlement: true,
  enableWebhookVerification: true,
  enableWallet: false,
  enableNetbanking: false,
  enableSplitPayment: true,
  enablePartialPayment: true,
  enableSound: true,
  enableAutoCloseAfterPayment: false,
  autoCloseDelaySeconds: 3,
  qrExpiryMinutes: 5,
  autoRefreshExpiredQr: true,
  showCountdown: true,
  soundVolume: 80,
  soundRepeatCount: 1,
  duplicateWebhookProtection: true,
  adminOnlyManualOverride: true,
  showGrossNet: 'gross',
  businessDateResetTime: '06:00',
};

export function usePaymentSettings() {
  const { getSetting } = useStoreSettings();
  const [settings, setSettings] = useState<PaymentSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await getSetting('payment_settings');
        if (saved) {
          setSettings({ ...DEFAULT_SETTINGS, ...(saved as Partial<PaymentSettings>) });
        }
      } catch {}
      setLoaded(true);
    };
    load();
  }, []);

  return { settings, loaded };
}
