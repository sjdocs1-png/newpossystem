import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/contexts/LocaleContext';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { countries, languages, CountryCode, LanguageCode } from '@/lib/i18n';
import {
  ArrowLeft, 
  Globe, 
  Languages, 
  Moon, 
  Sun, 
  Store,
  Bell,
  Shield,
  Printer,
  Receipt,
  Database,
  Users,
  Settings as SettingsIcon,
  ChevronRight,
  Smartphone,
  CreditCard,
  MapPin,
  Palette,
  Volume2,
  Wifi,
  HardDrive,
  Clock,
  ToggleLeft,
  UtensilsCrossed,
  Truck,
  ShoppingBag,
  Grid3X3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminOwnerSettings } from '@/components/pos/AdminOwnerSettings';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { useSubscription } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFeatureToggles } from '@/hooks/useFeatureToggles';

// Settings section item component
const SettingRow: React.FC<{
  icon: React.ElementType;
  label: string;
  description?: string;
  children: React.ReactNode;
  iconColor?: string;
}> = ({ icon: Icon, label, description, children, iconColor = 'text-primary' }) => (
  <div className="flex items-center justify-between py-3.5 border-b border-border/50 last:border-0">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className={`w-9 h-9 rounded-lg bg-muted/80 flex items-center justify-center shrink-0`}>
        <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
      </div>
    </div>
    <div className="shrink-0 ml-3">{children}</div>
  </div>
);

// Settings group card
const SettingsGroup: React.FC<{
  title: string;
  icon: React.ElementType;
  iconColor?: string;
  children: React.ReactNode;
}> = ({ title, icon: Icon, iconColor = 'text-primary', children }) => (
  <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
    <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center">
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
    <div className="px-4">{children}</div>
  </div>
);

// Navigation item for section switching
const SectionNavItem: React.FC<{
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
  iconColor?: string;
}> = ({ icon: Icon, label, active, onClick, iconColor }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all text-left ${
      active
        ? 'bg-primary/15 text-primary'
        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
    }`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-primary' : (iconColor || 'text-muted-foreground')}`} />
    <span className="text-sm font-medium">{label}</span>
    {active && <ChevronRight className="w-4 h-4 ml-auto text-primary" />}
  </button>
);

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, country, language, setCountry, setLanguage, currentCountry, availableLanguages } = useLocale();
  const { userRole } = useSupabaseAuth();
  const { theme, toggleTheme } = useTheme();
  const { getSetting, saveSetting, isLoaded } = useStoreSettings();
  const isMobile = useIsMobile();
  const { toggles, updateToggle } = useFeatureToggles();
  const [activeSection, setActiveSection] = useState('general');
  
  // Settings state backed by DB
  const [notifSettings, setNotifSettings] = useState({ newOrder: true, lowStock: true, cancelled: true });
  const [securitySettings, setSecuritySettings] = useState({ pinLogin: false, backup: true });
  const [printerSettings, setPrinterSettings] = useState({ printBill: true, printKOT: true });
  const [billingSettings, setBillingSettings] = useState({ tip: false, containerCharge: false, deliveryCharge: false });

  useEffect(() => {
    if (!isLoaded) return;
    const n = getSetting('pos_settings_notifications');
    if (n) setNotifSettings(prev => ({ ...prev, ...n }));
    const s = getSetting('pos_settings_security');
    if (s) setSecuritySettings(prev => ({ ...prev, ...s }));
    const p = getSetting('pos_settings_printer');
    if (p) setPrinterSettings(prev => ({ ...prev, ...p }));
    const b = getSetting('pos_settings_billing');
    if (b) setBillingSettings(prev => ({ ...prev, ...b }));
  }, [isLoaded, getSetting]);

  const updateNotif = (key: string, value: boolean) => {
    const updated = { ...notifSettings, [key]: value };
    setNotifSettings(updated);
    saveSetting('pos_settings_notifications', updated);
  };
  const updateSecurity = (key: string, value: boolean) => {
    const updated = { ...securitySettings, [key]: value };
    setSecuritySettings(updated);
    saveSetting('pos_settings_security', updated);
  };
  const updatePrinter = (key: string, value: boolean) => {
    const updated = { ...printerSettings, [key]: value };
    setPrinterSettings(updated);
    saveSetting('pos_settings_printer', updated);
  };
  const updateBilling = (key: string, value: boolean) => {
    const updated = { ...billingSettings, [key]: value };
    setBillingSettings(updated);
    saveSetting('pos_settings_billing', updated);
  };

  const isAdmin = userRole?.role === 'admin';
  const isOwner = userRole?.role === 'owner';
  const isAdminOrOwner = isAdmin || isOwner;
  const { canAccess } = useSubscription();

  const handleCountryChange = (value: string) => {
    setCountry(value as CountryCode);
    toast.success(t('msg.saved'));
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value as LanguageCode);
    toast.success(t('msg.saved'));
  };

  const sections = [
    { id: 'general', label: t('settings.general'), icon: SettingsIcon, color: 'text-blue-400' },
    { id: 'features', label: 'Features', icon: ToggleLeft, color: 'text-emerald-400' },
    { id: 'display', label: t('settings.display'), icon: Palette, color: 'text-purple-400' },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell, color: 'text-amber-400' },
    { id: 'security', label: t('settings.security'), icon: Shield, color: 'text-green-400' },
    { id: 'printer', label: t('settings.printer'), icon: Printer, color: 'text-cyan-400' },
    { id: 'billing', label: t('settings.billing'), icon: Receipt, color: 'text-rose-400' },
    ...(isAdminOrOwner ? [{ id: 'admin', label: t('admin.ownerSettings'), icon: Users, color: 'text-orange-400' }] : []),
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'features':
        return (
          <div className="space-y-4">
            {/* Billing Mode */}
            <SettingsGroup title="Billing Mode" icon={Store} iconColor="text-emerald-400">
              <div className="py-3 space-y-3">
                <p className="text-xs text-muted-foreground">Select your business type. General Store hides restaurant-specific features (KOT, Tables, Dine-In).</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateToggle('billingMode', 'restaurant')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all border',
                      toggles.billingMode === 'restaurant'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                    )}
                  >
                    <UtensilsCrossed className="w-4 h-4" />
                    Restaurant
                  </button>
                  <button
                    onClick={() => updateToggle('billingMode', 'general')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all border',
                      toggles.billingMode === 'general'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                    )}
                  >
                    <Store className="w-4 h-4" />
                    General Store
                  </button>
                </div>
              </div>
            </SettingsGroup>

            {/* Feature Toggles */}
            <SettingsGroup title="Feature Toggles" icon={ToggleLeft} iconColor="text-emerald-400">
              <SettingRow icon={Grid3X3} label="Tables" description="Show/hide table management" iconColor="text-blue-400">
                <Switch checked={toggles.tableEnabled} onCheckedChange={(v) => updateToggle('tableEnabled', v)} />
              </SettingRow>
              <SettingRow icon={Receipt} label="KOT (Kitchen Order Ticket)" description="Hide KOT, KOT & Print buttons from billing" iconColor="text-orange-400">
                <Switch checked={toggles.kotEnabled} onCheckedChange={(v) => updateToggle('kotEnabled', v)} />
              </SettingRow>
              <SettingRow icon={Truck} label="Delivery" description="Show/hide delivery option" iconColor="text-cyan-400">
                <Switch checked={toggles.deliveryEnabled} onCheckedChange={(v) => updateToggle('deliveryEnabled', v)} />
              </SettingRow>
              <SettingRow icon={ShoppingBag} label="Takeaway" description="Show/hide takeaway option" iconColor="text-purple-400">
                <Switch checked={toggles.takeawayEnabled} onCheckedChange={(v) => updateToggle('takeawayEnabled', v)} />
              </SettingRow>
              <SettingRow icon={UtensilsCrossed} label="Dine-In" description="Show/hide dine-in option" iconColor="text-green-400">
                <Switch checked={toggles.dineInEnabled} onCheckedChange={(v) => updateToggle('dineInEnabled', v)} />
              </SettingRow>
            </SettingsGroup>

            {toggles.billingMode === 'general' && (
              <div className="p-3 rounded-xl bg-muted/50 border border-border/60 text-xs text-muted-foreground">
                💡 <strong>General Store Mode:</strong> KOT, Tables & Dine-In are auto-disabled. Billing focuses on direct sales with barcode scanning, cash/card payments.
              </div>
            )}
          </div>
        );

      case 'general':
        return (
          <div className="space-y-4">
            <SettingsGroup title={t('settings.country')} icon={Globe} iconColor="text-blue-400">
              <SettingRow icon={MapPin} label={t('settings.country')} description={currentCountry?.name} iconColor="text-blue-400">
                <Select value={country} onValueChange={handleCountryChange}>
                  <SelectTrigger className="w-[140px] h-9 text-xs bg-muted/50 border-border/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(countries).map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className="flex items-center gap-2">
                          <span>{c.flag}</span>
                          <span>{c.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow icon={CreditCard} label={t('settings.currency')} description={currentCountry?.currency?.code} iconColor="text-emerald-400">
                <span className="text-sm text-muted-foreground font-medium">{currentCountry?.currency?.symbol}</span>
              </SettingRow>
            </SettingsGroup>

            <SettingsGroup title={t('settings.language')} icon={Languages} iconColor="text-purple-400">
              <SettingRow icon={Languages} label={t('settings.language')} description={languages[language]?.nativeName} iconColor="text-purple-400">
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-[140px] h-9 text-xs bg-muted/50 border-border/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLanguages.map((langCode) => (
                      <SelectItem key={langCode} value={langCode}>
                        {languages[langCode]?.nativeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>
            </SettingsGroup>
          </div>
        );

      case 'display':
        return (
          <SettingsGroup title={t('settings.display')} icon={Palette} iconColor="text-purple-400">
            <SettingRow icon={theme === 'dark' ? Moon : Sun} label={t('settings.theme')} description={theme === 'dark' ? t('settings.darkMode') : t('settings.lightMode')} iconColor="text-purple-400">
              <div className="flex items-center gap-2">
                <Sun className="w-3.5 h-3.5 text-muted-foreground" />
                <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                <Moon className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </SettingRow>
          </SettingsGroup>
        );

      case 'notifications':
        return (
          <SettingsGroup title={t('settings.notifications')} icon={Bell} iconColor="text-amber-400">
            <SettingRow icon={Bell} label={t('orders.newOrder')} description="New order alerts" iconColor="text-amber-400">
              <Switch checked={notifSettings.newOrder} onCheckedChange={(v) => updateNotif('newOrder', v)} />
            </SettingRow>
            <SettingRow icon={Database} label={t('inventory.lowStock')} description="Stock warning alerts" iconColor="text-red-400">
              <Switch checked={notifSettings.lowStock} onCheckedChange={(v) => updateNotif('lowStock', v)} />
            </SettingRow>
            <SettingRow icon={Bell} label={t('orders.cancelled')} description="Cancellation alerts" iconColor="text-rose-400">
              <Switch checked={notifSettings.cancelled} onCheckedChange={(v) => updateNotif('cancelled', v)} />
            </SettingRow>
          </SettingsGroup>
        );

      case 'security':
        return (
          <SettingsGroup title={t('settings.security')} icon={Shield} iconColor="text-green-400">
            <SettingRow icon={Shield} label={t('staff.pin')} description={t('auth.enterPin')} iconColor="text-green-400">
              <Switch checked={securitySettings.pinLogin} onCheckedChange={(v) => updateSecurity('pinLogin', v)} />
            </SettingRow>
            <SettingRow icon={HardDrive} label={t('settings.backup')} description={t('common.enabled')} iconColor="text-blue-400">
              <Switch checked={securitySettings.backup} onCheckedChange={(v) => updateSecurity('backup', v)} />
            </SettingRow>
          </SettingsGroup>
        );

      case 'printer':
        return (
          <SettingsGroup title={t('settings.printer')} icon={Printer} iconColor="text-cyan-400">
            <SettingRow icon={Receipt} label={t('pos.printBill')} description="Auto print on checkout" iconColor="text-cyan-400">
              <Switch checked={printerSettings.printBill} onCheckedChange={(v) => updatePrinter('printBill', v)} />
            </SettingRow>
            {canAccess('kot') && (
              <SettingRow icon={Printer} label={t('pos.printKOT')} description="Kitchen order ticket" iconColor="text-teal-400">
                <Switch checked={printerSettings.printKOT} onCheckedChange={(v) => updatePrinter('printKOT', v)} />
              </SettingRow>
            )}
          </SettingsGroup>
        );

      case 'billing':
        return (
          <SettingsGroup title={t('settings.billing')} icon={Receipt} iconColor="text-rose-400">
            <SettingRow icon={CreditCard} label={t('pos.tip')} description="Enable tip option" iconColor="text-rose-400">
              <Switch checked={billingSettings.tip} onCheckedChange={(v) => updateBilling('tip', v)} />
            </SettingRow>
            <SettingRow icon={Store} label={t('pos.containerCharge')} description="Packaging charges" iconColor="text-orange-400">
              <Switch checked={billingSettings.containerCharge} onCheckedChange={(v) => updateBilling('containerCharge', v)} />
            </SettingRow>
            <SettingRow icon={MapPin} label={t('pos.deliveryCharge')} description="Delivery fee" iconColor="text-indigo-400">
              <Switch checked={billingSettings.deliveryCharge} onCheckedChange={(v) => updateBilling('deliveryCharge', v)} />
            </SettingRow>
          </SettingsGroup>
        );

      case 'admin':
        return isAdminOrOwner ? <AdminOwnerSettings /> : null;

      default:
        return null;
    }
  };

  // Mobile: scrollable section chips + content
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">{t('nav.settings')}</h1>
              <p className="text-xs text-muted-foreground">{sections.find(s => s.id === activeSection)?.label}</p>
            </div>
          </div>

          {/* Scrollable section chips */}
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                  activeSection === section.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                <section.icon className="w-3.5 h-3.5" />
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pb-24 space-y-4">
          {renderSectionContent()}
        </div>
      </div>
    );
  }

  // Desktop: sidebar + content
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('nav.settings')}</h1>
            <p className="text-sm text-muted-foreground">{t('settings.general')}</p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar navigation */}
          <div className="w-56 shrink-0">
            <div className="bg-card rounded-xl border border-border/60 p-2 space-y-0.5 sticky top-6">
              {sections.map((section) => (
                <SectionNavItem
                  key={section.id}
                  icon={section.icon}
                  label={section.label}
                  active={activeSection === section.id}
                  onClick={() => setActiveSection(section.id)}
                  iconColor={section.color}
                />
              ))}
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 min-w-0">
            {renderSectionContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
