import React from 'react';

import { useStoreSettings } from '@/hooks/useStoreSettings';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Volume2, QrCode, Shield, BarChart3, Settings, Clock } from 'lucide-react';

interface PaymentSettings {
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

export const PaymentSettingsPanel: React.FC = () => {
  const { getSetting, saveSetting } = useStoreSettings();
  const [settings, setSettings] = React.useState<PaymentSettings>(DEFAULT_SETTINGS);
  const [isDirty, setIsDirty] = React.useState(false);

  React.useEffect(() => {
    const loadSettings = async () => {
      const saved = await getSetting('payment_settings');
      if (saved) {
        setSettings({ ...DEFAULT_SETTINGS, ...(saved as Partial<PaymentSettings>) });
      }
    };
    loadSettings();
  }, []);

  const updateSetting = <K extends keyof PaymentSettings>(key: K, value: PaymentSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    await saveSetting('payment_settings', settings as any);
    localStorage.setItem('pos_payment_sound_config', JSON.stringify({
      enabled: settings.enableSound,
      volume: settings.soundVolume / 100,
      repeatCount: settings.soundRepeatCount,
    }));
    setIsDirty(false);
    toast.success('Payment settings saved');
  };

  const SectionTitle: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
      {icon}
      <h3 className="font-semibold text-foreground">{title}</h3>
    </div>
  );

  const ToggleRow: React.FC<{ label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-2">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      {/* General Controls */}
      <div>
        <SectionTitle icon={<Settings className="w-5 h-5 text-primary" />} title="Payment Methods" />
        <div className="space-y-1">
          <ToggleRow label="Cash Payments" checked={settings.enableCash} onChange={v => updateSetting('enableCash', v)} />
          <ToggleRow label="UPI Payments" description="Enable UPI payment method" checked={settings.enableUpi} onChange={v => updateSetting('enableUpi', v)} />
          <ToggleRow label="Card Payments" description="Enable card payment method" checked={settings.enableCard} onChange={v => updateSetting('enableCard', v)} />
          <ToggleRow label="QR Code Billing" description="Show fullscreen QR for customer scanning" checked={settings.enableQrBilling} onChange={v => updateSetting('enableQrBilling', v)} />
          <ToggleRow label="Wallet Payments" description="Enable wallet payment method" checked={settings.enableWallet} onChange={v => updateSetting('enableWallet', v)} />
          <ToggleRow label="Net Banking" description="Enable net banking payment" checked={settings.enableNetbanking} onChange={v => updateSetting('enableNetbanking', v)} />
          <ToggleRow label="Split Payment" description="Allow splitting bill between persons" checked={settings.enableSplitPayment} onChange={v => updateSetting('enableSplitPayment', v)} />
          <ToggleRow label="Partial Payment" description="Allow Card + UPI split" checked={settings.enablePartialPayment} onChange={v => updateSetting('enablePartialPayment', v)} />
        </div>
      </div>

      {/* Auto Settlement Controls */}
      <div>
        <SectionTitle icon={<Shield className="w-5 h-5 text-primary" />} title="Auto Settlement & Verification" />
        <div className="space-y-1">
          <ToggleRow label="Auto Bill Settlement" description="Automatically mark bill as PAID when payment is verified" checked={settings.enableAutoSettlement} onChange={v => updateSetting('enableAutoSettlement', v)} />
          <ToggleRow label="Webhook Verification" description="Verify payments via webhooks" checked={settings.enableWebhookVerification} onChange={v => updateSetting('enableWebhookVerification', v)} />
          <ToggleRow label="Auto Close After Payment" description="Auto close billing screen after successful payment" checked={settings.enableAutoCloseAfterPayment} onChange={v => updateSetting('enableAutoCloseAfterPayment', v)} />
          {settings.enableAutoCloseAfterPayment && (
            <div className="pl-4 space-y-1">
              <Label className="text-sm">Auto Close Delay</Label>
              <Select value={String(settings.autoCloseDelaySeconds)} onValueChange={v => updateSetting('autoCloseDelaySeconds', Number(v))}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 5, 7, 10].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} seconds</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Sound Controls */}
      <div>
        <SectionTitle icon={<Volume2 className="w-5 h-5 text-primary" />} title="Sound Confirmation" />
        <div className="space-y-3">
          <ToggleRow label="Payment Success Sound" description="Play chime on verified payment" checked={settings.enableSound} onChange={v => updateSetting('enableSound', v)} />
          {settings.enableSound && (
            <>
              <div className="space-y-2">
                <Label className="text-sm">Volume: {settings.soundVolume}%</Label>
                <Slider value={[settings.soundVolume]} min={10} max={100} step={10} onValueChange={([v]) => updateSetting('soundVolume', v)} />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Repeat Count</Label>
                <Select value={String(settings.soundRepeatCount)} onValueChange={v => updateSetting('soundRepeatCount', Number(v))}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 time</SelectItem>
                    <SelectItem value="2">2 times</SelectItem>
                    <SelectItem value="3">3 times</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* QR Controls */}
      <div>
        <SectionTitle icon={<QrCode className="w-5 h-5 text-primary" />} title="QR & Timer Controls" />
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-sm">QR Expiry Time</Label>
            <Select value={String(settings.qrExpiryMinutes)} onValueChange={v => updateSetting('qrExpiryMinutes', Number(v))}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <SelectItem key={n} value={String(n)}>{n} minutes</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ToggleRow label="Auto Refresh Expired QR" checked={settings.autoRefreshExpiredQr} onChange={v => updateSetting('autoRefreshExpiredQr', v)} />
          <ToggleRow label="Show Countdown Timer" checked={settings.showCountdown} onChange={v => updateSetting('showCountdown', v)} />
        </div>
      </div>

      {/* Business Date Controls */}
      <div>
        <SectionTitle icon={<Clock className="w-5 h-5 text-primary" />} title="Business Date & Reset" />
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-sm">Daily Sales Reset Time</Label>
            <p className="text-xs text-muted-foreground">Business date changes at this time. Orders after this time count for the next day.</p>
            <Input
              type="time"
              value={settings.businessDateResetTime}
              onChange={e => updateSetting('businessDateResetTime', e.target.value)}
              className="w-40"
            />
          </div>
        </div>
      </div>

      {/* Security Controls */}
      <div>
        <SectionTitle icon={<Shield className="w-5 h-5 text-primary" />} title="Security Controls" />
        <div className="space-y-1">
          <ToggleRow label="Duplicate Webhook Protection" description="Prevent processing same payment twice" checked={settings.duplicateWebhookProtection} onChange={v => updateSetting('duplicateWebhookProtection', v)} />
          <ToggleRow label="Admin-Only Manual Override" description="Only admins can manually mark payments" checked={settings.adminOnlyManualOverride} onChange={v => updateSetting('adminOnlyManualOverride', v)} />
        </div>
      </div>

      {/* Reporting Controls */}
      <div>
        <SectionTitle icon={<BarChart3 className="w-5 h-5 text-primary" />} title="Reporting Controls" />
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-sm">Show Amount As</Label>
            <Select value={settings.showGrossNet} onValueChange={v => updateSetting('showGrossNet', v as 'gross' | 'net')}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gross">Gross Amount</SelectItem>
                <SelectItem value="net">Net Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      {isDirty && (
        <div className="sticky bottom-0 bg-card pt-4 border-t border-border">
          <Button onClick={handleSave} className="w-full">Save Payment Settings</Button>
        </div>
      )}
    </div>
  );
};
