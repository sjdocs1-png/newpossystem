import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface LinkedServicesSettingsProps {
  onBack: () => void;
}

interface LinkedServicesSettingsState {
  // Inventory Settings
  enableAutoConsumption: boolean;
  resetStockOnDayStart: boolean;
  outOfStockAction: 'hide' | 'disable';
  useRealTimeStockManagement: boolean;

  // Day End Settings
  enableManualDayEnd: boolean;
  dontAllowDayEndActiveTable: boolean;
  dontAllowDayEndUnsyncOrders: boolean;
  restrictEditAfterDayEnd: boolean;

  // Loyalty Settings
  sendLoyaltyDefault: boolean;
  applyLoyaltyDelivery: boolean;
  applyLoyaltyPickUp: boolean;
  applyLoyaltyDineIn: boolean;
  sendLoyaltyDataOn: 'printBill' | 'settleAndSave';

  // KDS Settings
  kdsLiveScreenUpdate: boolean;
  markKotDoneOnAllItems: boolean;

  // Captain App Settings
  printKotFromCaptainApp: boolean;
  allowDiscountFromCaptainApp: boolean;
  notifyCaptainOnFoodReady: 'itemReady' | 'kotReady' | 'none';

  // e-Invoice Settings
  enableEInvoice: boolean;

  // Barcode Settings
  prefixForBarcode: string;
  noOfCharactersForWeight: string;
  weightDenominator: string;
  allowMultipleItemsInBarcode: boolean;

  // Expense Settings
  restrictExpenseCurrentDate: boolean;

  // Invoice Structure
  invoicePrefix: string;
  invoiceNumberLength: string;
  invoiceSuffix: string;
}

const defaultSettings: LinkedServicesSettingsState = {
  enableAutoConsumption: false,
  resetStockOnDayStart: false,
  outOfStockAction: 'hide',
  useRealTimeStockManagement: false,
  enableManualDayEnd: false,
  dontAllowDayEndActiveTable: false,
  dontAllowDayEndUnsyncOrders: false,
  restrictEditAfterDayEnd: false,
  sendLoyaltyDefault: true,
  applyLoyaltyDelivery: true,
  applyLoyaltyPickUp: true,
  applyLoyaltyDineIn: true,
  sendLoyaltyDataOn: 'settleAndSave',
  kdsLiveScreenUpdate: true,
  markKotDoneOnAllItems: true,
  printKotFromCaptainApp: true,
  allowDiscountFromCaptainApp: false,
  notifyCaptainOnFoodReady: 'none',
  enableEInvoice: false,
  prefixForBarcode: '',
  noOfCharactersForWeight: '5',
  weightDenominator: '1000',
  allowMultipleItemsInBarcode: false,
  restrictExpenseCurrentDate: false,
  invoicePrefix: '',
  invoiceNumberLength: '',
  invoiceSuffix: '',
};

const menuItems = [
  { id: 'inventory', label: 'Inventory Settings' },
  { id: 'dayEnd', label: 'Day End Settings' },
  { id: 'loyalty', label: 'Loyalty Settings' },
  { id: 'kds', label: 'KDS Settings' },
  { id: 'captainApp', label: 'Captain App Settings' },
  { id: 'eInvoice', label: 'e-Invoice settings' },
  { id: 'barcode', label: 'Barcode settings' },
  { id: 'expense', label: 'Expense settings' },
  { id: 'invoiceStructure', label: 'Invoice Structure' },
];

const LinkedServicesSettings: React.FC<LinkedServicesSettingsProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<LinkedServicesSettingsState>(defaultSettings);
  const [activeSection, setActiveSection] = useState('inventory');

  useEffect(() => {
    const savedSettings = localStorage.getItem('linkedServicesSettings');
    if (savedSettings) {
      setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('linkedServicesSettings', JSON.stringify(settings));
    toast.success('Linked services settings saved successfully');
  };

  const updateSetting = <K extends keyof LinkedServicesSettingsState>(
    key: K,
    value: LinkedServicesSettingsState[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Outlet Settings &gt; Connected services</h1>
          </div>
          <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
            &lt; Back
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 border-r border-border bg-card flex-shrink-0">
          <ScrollArea className="h-full">
            <div className="py-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors border-l-4 ${
                    activeSection === item.id
                      ? 'border-l-primary text-primary bg-primary/5 font-medium'
                      : 'border-l-transparent text-foreground hover:bg-muted/50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-6 bg-muted/30">
            <div className="max-w-3xl space-y-6">
              
              {/* Inventory Settings */}
              <section id="inventory" className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-sm">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Inventory Settings</h2>
                  <p className="text-sm text-muted-foreground">
                    The following settings configures the Inventory module in billing screen
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="enableAutoConsumption"
                      checked={settings.enableAutoConsumption}
                      onCheckedChange={(checked) => updateSetting('enableAutoConsumption', !!checked)}
                    />
                    <div>
                      <Label htmlFor="enableAutoConsumption" className="text-sm">
                        Enable auto consumption for Inventory
                      </Label>
                      <p className="text-xs text-primary mt-1">This setting is only available in cloud login.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="resetStockOnDayStart"
                      checked={settings.resetStockOnDayStart}
                      onCheckedChange={(checked) => updateSetting('resetStockOnDayStart', !!checked)}
                    />
                    <Label htmlFor="resetStockOnDayStart" className="text-sm">
                      Reset your stock on a day start
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Action when items goes out of stock</Label>
                    <RadioGroup
                      value={settings.outOfStockAction}
                      onValueChange={(value) => updateSetting('outOfStockAction', value as 'hide' | 'disable')}
                      className="flex gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="hide" id="hideItems" />
                        <Label htmlFor="hideItems" className="text-sm font-normal">Hide items</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="disable" id="disableItems" />
                        <Label htmlFor="disableItems" className="text-sm font-normal">Disable items</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="useRealTimeStockManagement"
                      checked={settings.useRealTimeStockManagement}
                      onCheckedChange={(checked) => updateSetting('useRealTimeStockManagement', !!checked)}
                    />
                    <Label htmlFor="useRealTimeStockManagement" className="text-sm">
                      Use Real-Time stock management
                    </Label>
                  </div>
                </div>
              </section>

              {/* Day End Settings */}
              <section id="dayEnd" className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-sm">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Day End Settings</h2>
                  <p className="text-sm text-muted-foreground">
                    The following settings helps in configures enabling Day End module in billing screen
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="enableManualDayEnd"
                      checked={settings.enableManualDayEnd}
                      onCheckedChange={(checked) => updateSetting('enableManualDayEnd', !!checked)}
                    />
                    <div>
                      <Label htmlFor="enableManualDayEnd" className="text-sm">
                        Enable Manual Day End
                      </Label>
                      <p className="text-xs text-primary mt-1">This setting is only available in cloud login.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="dontAllowDayEndActiveTable"
                      checked={settings.dontAllowDayEndActiveTable}
                      onCheckedChange={(checked) => updateSetting('dontAllowDayEndActiveTable', !!checked)}
                    />
                    <div>
                      <Label htmlFor="dontAllowDayEndActiveTable" className="text-sm">
                        Don't allow Day End if there is any active table on Table View Screen.
                      </Label>
                      <p className="text-xs text-primary mt-1">This setting is only available in cloud login.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="dontAllowDayEndUnsyncOrders"
                      checked={settings.dontAllowDayEndUnsyncOrders}
                      onCheckedChange={(checked) => updateSetting('dontAllowDayEndUnsyncOrders', !!checked)}
                    />
                    <div>
                      <Label htmlFor="dontAllowDayEndUnsyncOrders" className="text-sm">
                        Don't allow Day End if there is any un-sync orders data
                      </Label>
                      <p className="text-xs text-primary mt-1">This setting is only available in cloud login.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="restrictEditAfterDayEnd"
                      checked={settings.restrictEditAfterDayEnd}
                      onCheckedChange={(checked) => updateSetting('restrictEditAfterDayEnd', !!checked)}
                    />
                    <div>
                      <Label htmlFor="restrictEditAfterDayEnd" className="text-sm">
                        Restrict editing the order once the manual day end operation has been completed
                      </Label>
                      <p className="text-xs text-primary mt-1">This setting is only available in cloud login.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Loyalty Settings */}
              <section id="loyalty" className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-sm">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Loyalty Settings</h2>
                  <p className="text-sm text-muted-foreground">
                    The following settings pertains to configuring the loyalty settings in the billing screen
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="sendLoyaltyDefault"
                      checked={settings.sendLoyaltyDefault}
                      onCheckedChange={(checked) => updateSetting('sendLoyaltyDefault', !!checked)}
                    />
                    <Label htmlFor="sendLoyaltyDefault" className="text-sm">
                      Make "Send Loyalty" option set as default on Billing screen.
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Apply Loyalty points when order punched as</Label>
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="applyLoyaltyDelivery"
                          checked={settings.applyLoyaltyDelivery}
                          onCheckedChange={(checked) => updateSetting('applyLoyaltyDelivery', !!checked)}
                        />
                        <Label htmlFor="applyLoyaltyDelivery" className="text-sm font-normal">Delivery</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="applyLoyaltyPickUp"
                          checked={settings.applyLoyaltyPickUp}
                          onCheckedChange={(checked) => updateSetting('applyLoyaltyPickUp', !!checked)}
                        />
                        <Label htmlFor="applyLoyaltyPickUp" className="text-sm font-normal">Pick Up</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="applyLoyaltyDineIn"
                          checked={settings.applyLoyaltyDineIn}
                          onCheckedChange={(checked) => updateSetting('applyLoyaltyDineIn', !!checked)}
                        />
                        <Label htmlFor="applyLoyaltyDineIn" className="text-sm font-normal">Dine In</Label>
                      </div>
                    </div>
                    <p className="text-xs text-primary">
                      Above settings enabled POS system to apply loyalty points on selected order types.
                    </p>
                    <p className="text-xs text-primary">This setting is only available in cloud login.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Send Loyalty Data (Only for Table Order) :</Label>
                    <RadioGroup
                      value={settings.sendLoyaltyDataOn}
                      onValueChange={(value) => updateSetting('sendLoyaltyDataOn', value as 'printBill' | 'settleAndSave')}
                      className="flex gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="printBill" id="printBill" />
                        <Label htmlFor="printBill" className="text-sm font-normal">Print Bill</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="settleAndSave" id="settleAndSave" />
                        <Label htmlFor="settleAndSave" className="text-sm font-normal">Settle & Save</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </section>

              {/* KDS Settings */}
              <section id="kds" className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-sm">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">KDS settings</h2>
                  <p className="text-sm text-muted-foreground">
                    The following settings would be used to configure the Kitchen Display System or KDS
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="kdsLiveScreenUpdate"
                      checked={settings.kdsLiveScreenUpdate}
                      onCheckedChange={(checked) => updateSetting('kdsLiveScreenUpdate', !!checked)}
                    />
                    <div>
                      <Label htmlFor="kdsLiveScreenUpdate" className="text-sm">
                        From KDS/KOT live screen send update to order screen.
                      </Label>
                      <p className="text-xs text-primary mt-1">
                        In case of any update (like marking an item/order ready) in KDS or KOT live view, the update would be also be present in Order screen.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="markKotDoneOnAllItems"
                      checked={settings.markKotDoneOnAllItems}
                      onCheckedChange={(checked) => updateSetting('markKotDoneOnAllItems', !!checked)}
                    />
                    <div>
                      <Label htmlFor="markKotDoneOnAllItems" className="text-sm">
                        On marking done all items on KDS, Mark KOT as done.
                      </Label>
                      <p className="text-xs text-primary mt-1">
                        Enabling the setting would mark the full KOT done at all places (including online aggregators) when all the items are marked done.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Captain App Settings */}
              <section id="captainApp" className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-sm">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Captain App settings</h2>
                  <p className="text-sm text-muted-foreground">
                    The following settings pertains to configuring the Captain App print settings.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="printKotFromCaptainApp"
                      checked={settings.printKotFromCaptainApp}
                      onCheckedChange={(checked) => updateSetting('printKotFromCaptainApp', !!checked)}
                    />
                    <Label htmlFor="printKotFromCaptainApp" className="text-sm">
                      Print KOT from Captain App
                    </Label>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="allowDiscountFromCaptainApp"
                      checked={settings.allowDiscountFromCaptainApp}
                      onCheckedChange={(checked) => updateSetting('allowDiscountFromCaptainApp', !!checked)}
                    />
                    <div>
                      <Label htmlFor="allowDiscountFromCaptainApp" className="text-sm">
                        Allow Discount from Captain APP (Applicable for Dine-In orders only)
                      </Label>
                      <p className="text-xs text-primary mt-1">This setting is only available in cloud login.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Notify captain users once the food ready is marked</Label>
                    <RadioGroup
                      value={settings.notifyCaptainOnFoodReady}
                      onValueChange={(value) => updateSetting('notifyCaptainOnFoodReady', value as 'itemReady' | 'kotReady' | 'none')}
                      className="flex gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="itemReady" id="itemReady" />
                        <Label htmlFor="itemReady" className="text-sm font-normal">Item Ready</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="kotReady" id="kotReady" />
                        <Label htmlFor="kotReady" className="text-sm font-normal">KOT Ready</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="none" id="noneNotify" />
                        <Label htmlFor="noneNotify" className="text-sm font-normal">None</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </section>

              {/* e-Invoice Settings */}
              <section id="eInvoice" className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-sm">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">e-Invoice settings</h2>
                  <p className="text-sm text-muted-foreground">
                    The following settings pertains to configuring the e-Invoice settings.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="enableEInvoice"
                      checked={settings.enableEInvoice}
                      onCheckedChange={(checked) => updateSetting('enableEInvoice', !!checked)}
                    />
                    <Label htmlFor="enableEInvoice" className="text-sm">
                      Enable e-Invoice
                    </Label>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                    <p className="text-sm font-medium text-primary">Please consider below scenario if you want to generate e-Invoice:</p>
                    <ol className="text-xs text-primary space-y-1 list-decimal list-inside">
                      <li>Please enter & verify Outlet GST information.</li>
                      <li>Please enter proper Customer GST no. while printing the bill from POS.</li>
                      <li>Outlet must have CGST and SGST taxes in their TAX configuration.</li>
                      <li>Currently IGST tax is not supported.</li>
                      <li>If you want to cancel e-Invoice(if already generated) then you must cancel the Order.</li>
                      <li>Please disable configuration(if any) for apply tax on Delivery charge, Service charge and Packing charge.</li>
                      <li>Please enter proper HSN No. for every item.</li>
                      <li>You can not create/cancel e-Invoice older than two days.</li>
                      <li>Please recharge eInvoice credits from marketplace services. Without eInvoice credits service does not work.</li>
                    </ol>
                    <p className="text-xs text-primary mt-2">This setting is only available in cloud login.</p>
                  </div>
                </div>
              </section>

              {/* Barcode Settings */}
              <section id="barcode" className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-sm">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Barcode settings</h2>
                  <p className="text-sm text-muted-foreground">
                    The following settings pertains to configuring the Barcode settings.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prefixForBarcode" className="text-sm">Prefix for Barcode :</Label>
                    <Input
                      id="prefixForBarcode"
                      value={settings.prefixForBarcode}
                      onChange={(e) => updateSetting('prefixForBarcode', e.target.value)}
                      className="max-w-xs"
                    />
                    <p className="text-xs text-primary">
                      This field is required if want to activate this service settings in POS.
                    </p>
                    <p className="text-xs text-primary">This setting is only available in cloud login.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="noOfCharactersForWeight" className="text-sm">No. of Characters to calculate Weight :</Label>
                    <Input
                      id="noOfCharactersForWeight"
                      value={settings.noOfCharactersForWeight}
                      onChange={(e) => updateSetting('noOfCharactersForWeight', e.target.value)}
                      className="max-w-xs"
                    />
                    <p className="text-xs text-primary">This setting is only available in cloud login.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weightDenominator" className="text-sm">Weight Denominator :</Label>
                    <Input
                      id="weightDenominator"
                      value={settings.weightDenominator}
                      onChange={(e) => updateSetting('weightDenominator', e.target.value)}
                      className="max-w-xs"
                    />
                    <p className="text-xs text-primary">This setting is only available in cloud login.</p>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="allowMultipleItemsInBarcode"
                      checked={settings.allowMultipleItemsInBarcode}
                      onCheckedChange={(checked) => updateSetting('allowMultipleItemsInBarcode', !!checked)}
                    />
                    <Label htmlFor="allowMultipleItemsInBarcode" className="text-sm">
                      Allow entries of multiple items in single barcode/ QR code
                    </Label>
                  </div>
                </div>
              </section>

              {/* Expense Settings */}
              <section id="expense" className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-sm">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Expense settings</h2>
                  <p className="text-sm text-muted-foreground">
                    The following settings pertains to configuring the Expense settings.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="restrictExpenseCurrentDate"
                      checked={settings.restrictExpenseCurrentDate}
                      onCheckedChange={(checked) => updateSetting('restrictExpenseCurrentDate', !!checked)}
                    />
                    <div>
                      <Label htmlFor="restrictExpenseCurrentDate" className="text-sm">
                        Restrict users to add expense and withdrawal for current date only.
                      </Label>
                      <p className="text-xs text-primary mt-1">
                        If the configuration is enabled then the users would only be able to add expense and withdrawal for current date.
                      </p>
                      <p className="text-xs text-primary">This setting is only available in cloud login.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Invoice Structure */}
              <section id="invoiceStructure" className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-sm">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Invoice Structure</h2>
                  <p className="text-sm text-muted-foreground">
                    The following settings pertains to configuring the Invoice Structure.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Invoice structure<span className="text-destructive">*</span>:</Label>
                    <div className="flex gap-4">
                      <Input
                        placeholder="Prefix"
                        value={settings.invoicePrefix}
                        onChange={(e) => updateSetting('invoicePrefix', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Number Length"
                        value={settings.invoiceNumberLength}
                        onChange={(e) => updateSetting('invoiceNumberLength', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Suffix"
                        value={settings.invoiceSuffix}
                        onChange={(e) => updateSetting('invoiceSuffix', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                    <p className="text-sm font-medium text-primary">Note : Enter any values from configured sets :</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>{'{yy}'} : Ex. 18 [current year]</p>
                      <p>{'{yyyy}'} : Ex. 2018 [current year]</p>
                      <p>{'{mm}'} : Ex. 01 [current month]</p>
                      <p>{'{mmm}'} : Ex. Jan [current month]</p>
                      <p>{'{dd}'} : Ex. 01 [current day]</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">If Ex:</Label>
                      <Input
                        value="{yy}/ABC"
                        readOnly
                        className="max-w-[150px] bg-muted"
                      />
                      <Input
                        value="2"
                        readOnly
                        className="max-w-[100px] bg-muted"
                      />
                      <Input
                        value=""
                        readOnly
                        className="max-w-[150px] bg-muted"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-primary">means invoice will be</Label>
                      <Input
                        value="18/ABC02"
                        readOnly
                        className="max-w-[150px] bg-muted"
                      />
                    </div>
                  </div>
                </div>
              </section>

            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-border bg-primary/10 p-4 flex justify-end gap-3">
            <Button variant="outline" onClick={onBack}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkedServicesSettings;
