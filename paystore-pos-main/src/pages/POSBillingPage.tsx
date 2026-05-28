import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePOS } from '@/contexts/POSContext';
import { useLocale } from '@/contexts/LocaleContext';
import { formatCurrency as formatCurrencyLib, MenuItem, MenuItemVariation } from '@/lib/store';
import { directPrint } from '@/lib/printUtils';
import { generateProfessionalBill, generateKOTContent } from '@/lib/billTemplate';
import { useIsMobile } from '@/hooks/use-mobile';
import MobilePOSPage from './MobilePOSPage';
import { VariationSelectorSheet } from '@/components/pos/VariationSelectorSheet';
import { BarcodeButton } from '@/components/pos/BarcodeButton';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { LinkBarcodeDialog } from '@/components/pos/LinkBarcodeDialog';
import { CustomItemDialog } from '@/components/pos/CustomItemDialog';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Pause, 
  Play, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Scissors, 
  Printer,
  FileText,
  ChevronUp,
  ChevronDown,
  Percent,
  Receipt,
  MapPin,
  Layers,
  MoreHorizontal,
  Wallet,
  Clock,
  SplitSquareHorizontal,
  Check,
  ScanBarcode,
  User,
  PackagePlus,
  QrCode,
  ShoppingBag,
  AlertTriangle,
  Merge
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { SplitBillDialog } from '@/components/pos/SplitBillDialog';
import { DiscountDialog } from '@/components/pos/DiscountDialog';
import { PartPaymentDialog } from '@/components/pos/PartPaymentDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CustomerDetails } from '@/components/pos/CustomerDetails';
import { autoShareBillAfterPrint } from '@/lib/billShareUtils';
import { usePaymentSettings } from '@/hooks/usePaymentSettings';
import { QRMenuGenerator } from '@/components/pos/QRMenuGenerator';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { QROrdersPanel } from '@/components/pos/QROrdersPanel';
import { useSubscription } from '@/hooks/useSubscription';
import { useSalesResetWarning } from '@/hooks/useSalesResetWarning';
import { SalesResetWarningDialog } from '@/components/pos/SalesResetWarningDialog';
import { useUICustomization, ButtonConfig, DEFAULT_CONFIG } from '@/hooks/useUICustomization';
import { useEditMode } from '@/hooks/useEditMode';
import { EditModeToolbar } from '@/components/pos/EditModeToolbar';
import { DraggableButtonGrid } from '@/components/pos/DraggableButtonGrid';
import { useNavigate } from 'react-router-dom';
import { Settings, Pencil, Eye, EyeOff, GripVertical } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import {
  Select as LayoutSelect,
  SelectContent as LayoutSelectContent,
  SelectItem as LayoutSelectItem,
  SelectTrigger as LayoutSelectTrigger,
  SelectValue as LayoutSelectValue,
} from '@/components/ui/select';

export const POSBillingPage: React.FC = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { config: uiConfig, isButtonVisible, toggleButton, reorderButtons, getGroupButtons, updateLayout, updateConfig, resetToDefault } = useUICustomization();
  const editMode = useEditMode();
  const { t, formatCurrency } = useLocale();
  const {
    menuItems,
    categories,
    activeCategory,
    setActiveCategory,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartSubtotal,
    cartTax,
    cartTotal,
    currentOrderType,
    setCurrentOrderType,
    selectedTable,
    setSelectedTable,
    tables,
    placeOrder,
    directBillPrint,
    holdBill,
    heldBills,
    recallBill,
    deleteHeldBill,
  } = usePOS();

  const [searchQuery, setSearchQuery] = useState('');
  const [showHeldBills, setShowHeldBills] = useState(false);
  const [showQROrders, setShowQROrders] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'card' | 'upi' | 'due' | 'part' | 'wallet' | 'credit' | null>(null);
  const [showBillingSummary, setShowBillingSummary] = useState(false);
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showMorePayments, setShowMorePayments] = useState(false);
  const [showPartPaymentDialog, setShowPartPaymentDialog] = useState(false);
  const [partPaymentDetails, setPartPaymentDetails] = useState<{ method: string; amount: number }[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [containerCharge, setContainerCharge] = useState(0);
  const [tip, setTip] = useState(0);
  const [taxPercent, setTaxPercentState] = useState(() => {
    const saved = localStorage.getItem('pos_tax_percent');
    return saved ? Number(saved) : 5;
  });
  const [customTax, setCustomTax] = useState<number | null>(null);
  const [showTaxDialog, setShowTaxDialog] = useState(false);
  const [showCustomItemDialog, setShowCustomItemDialog] = useState(false);
  
  // Save tax percent to localStorage when changed
  const setTaxPercent = (percent: number) => {
    setTaxPercentState(percent);
    localStorage.setItem('pos_tax_percent', String(percent));
  };
  const [selectedTableId, setSelectedTableId] = useState<string | null>(selectedTable?.id || null);
  const [selectedItemForVariation, setSelectedItemForVariation] = useState<MenuItem | null>(null);
  const [variationSheetOpen, setVariationSheetOpen] = useState(false);
  const preparedPrintWindowRef = useRef<Window | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [isComplimentary, setIsComplimentary] = useState(false);
  const [complimentaryNote, setComplimentaryNote] = useState('');
  const [showComplimentaryDialog, setShowComplimentaryDialog] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', address: '', city: '', state: '', pincode: '' });
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const { settings: paymentSettings } = usePaymentSettings();
  const { canAccess } = useSubscription();
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [pendingOrderAction, setPendingOrderAction] = useState<{type: 'direct', paymentMethod: string, action?: string} | null>(null);

  // Sales Reset Warning - global listener
  const {
    showWarning: showSalesResetWarning,
    timeUntilReset,
    formattedResetTime,
    handleResetNow,
    handleExtendTime,
    dismissWarning: dismissSalesResetWarning,
  } = useSalesResetWarning();

  // Initialize barcode scanner for USB/wireless scanner support
  const { unmatchedCode, clearUnmatchedCode } = useBarcodeScanner();

  const filteredItems = useMemo(() => {
    const baseProducts = menuItems.filter(item => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch && item.isAvailable;
    });

    const othersItem: MenuItem = {
      id: `others-${activeCategory}`,
      name: 'Others',
      price: 0,
      category: activeCategory === 'all' ? 'others' : activeCategory,
      color: 'hsl(var(--card))',
      isAvailable: true,
    };

    return [othersItem, ...baseProducts];
  }, [menuItems, activeCategory, searchQuery]);

  // Show simplified mobile layout on phones - AFTER all hooks
  if (isMobile) {
    return <MobilePOSPage />;
  }

  // Get available tables for dropdown
  const availableTables = tables.filter(t => t.status === 'available' || t.id === selectedTableId);

  const handleTableChange = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      setSelectedTable(table);
      setSelectedTableId(tableId);
    }
  };

  // Handle item click - check for variations
  const handleItemClick = (item: MenuItem) => {
    if (item.id.startsWith('others-')) {
      setShowCustomItemDialog(true);
      return;
    }

    if (!item.isAvailable) return;
    
    // If item has variations, show the variation selector popup
    if (item.variations && item.variations.length > 0) {
      setSelectedItemForVariation(item);
      setVariationSheetOpen(true);
    } else {
      addToCart(item);
    }
  };

  const handleAddCustomItem = (item: MenuItem, quantity: number) => {
    for (let i = 0; i < quantity; i++) {
      addToCart(item);
    }
  };

  // Handle variation selection from popup
  const handleVariationSelect = (item: MenuItem, variation?: MenuItemVariation, quantity: number = 1) => {
    const itemToAdd = variation ? {
      ...item,
      price: variation.price,
      name: `${item.name} (${variation.name})`,
      sku: variation.sku || item.sku,
    } : item;
    
    // Add item with specified quantity
    for (let i = 0; i < quantity; i++) {
      addToCart(itemToAdd);
    }
  };

  const allOrderTypes = [
    { id: 'dine-in' as const, label: t('pos.dineIn') },
    { id: 'takeaway' as const, label: t('pos.takeaway') },
    { id: 'delivery' as const, label: t('pos.delivery') },
  ];

  const orderTypes = allOrderTypes.filter(t => {
    if (t.id === 'dine-in' && !canAccess('dineIn')) return false;
    if (t.id === 'takeaway' && !canAccess('takeaway')) return false;
    if (t.id === 'delivery' && !canAccess('delivery')) return false;
    return true;
  });

  // Calculate custom tax
  const calculatedTax = customTax !== null ? customTax : (cartSubtotal * taxPercent / 100);
  const adjustedTotal = cartSubtotal + calculatedTax - discount + deliveryCharge + containerCharge + tip;
  const finalTotal = isComplimentary ? 0 : adjustedTotal;
  const roundOff = Math.round(finalTotal) - finalTotal;

  const handlePaymentSelect = (method: 'cash' | 'card' | 'upi' | 'due' | 'part' | 'wallet' | 'credit') => {
    if (cart.length === 0) {
      toast({ title: t('msg.emptyCart'), description: t('msg.addItemsFirst'), variant: 'destructive' });
      return;
    }

    setSelectedPayment(method);
  };

  const getStoreId = (): string => {
    try {
      const storeData = localStorage.getItem('pos_active_store_data');
      if (storeData) {
        const parsed = JSON.parse(storeData);
        return parsed?.id || parsed?.storeId || '';
      }
    } catch {}
    return '';
  };


  // Generate bill content for printing - using centralized template
  const generateBillContent = (order: any) => {
    return generateProfessionalBill({
      ...order,
      createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt
    });
  };

  // Generate KOT content for printing - using centralized template  
  const generateKOT = (order: any) => {
    return generateKOTContent({
      ...order,
      createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : (order.createdAt || new Date().toISOString()),
      subtotal: order.subtotal || 0,
      tax: order.tax || 0,
      discount: order.discount || 0,
      total: order.total || 0,
      paymentMethod: order.paymentMethod || 'cash'
    });
  };

  const preparePrintWindow = () => {
    console.log('[Print] Button clicked');

    const printWindow = window.open('', '_blank', 'width=420,height=800,menubar=no,toolbar=no,location=no,status=no');

    if (!printWindow) {
      alert('Please allow popups for printing');
      console.log('[Print] Popup blocked');
      return null;
    }

    printWindow.document.open();
    printWindow.document.write(`<!doctype html><html><head><title>Print Bill</title><style>@page{size:80mm auto;margin:2mm}body{font-family:monospace;padding:8px;margin:0}</style></head><body>Preparing bill...</body></html>`);
    printWindow.document.close();

    console.log('[Print] Window opened');
    return printWindow;
  };

  // Complete sale - called when Print/E-Bill or KOT is clicked (counts as sale)
  const completeSale = async (action: 'print' | 'kot', existingPrintWindow?: Window | null) => {
    if (cart.length === 0) {
      toast({ title: t('msg.emptyCart'), description: t('msg.addItemsFirst'), variant: 'destructive' });
      existingPrintWindow?.close();
      return;
    }
    
    if (!selectedPayment) {
      toast({ title: t('common.selectPayment'), description: t('msg.selectPaymentFirst'), variant: 'destructive' });
      existingPrintWindow?.close();
      return;
    }

    // Check for existing held bill or active order on same table
    if (currentOrderType === 'dine-in' && selectedTable) {
      const existingHeldBill = heldBills.find(b => b.tableNumber === selectedTable.number);
      const existingOrder = orders.find(
        o => o.tableNumber === selectedTable.number &&
          !o.isDirectBill &&
          (o.status === 'pending' || o.status === 'preparing' || o.status === 'ready')
      );

      if (existingHeldBill || existingOrder) {
        setPendingOrderAction({type: 'direct', paymentMethod: selectedPayment, action});
        setShowMergeDialog(true);
        existingPrintWindow?.close();
        return;
      }
    }

    // No existing held bill or order, proceed
    const order = await directBillPrint(selectedPayment, customer.name, customer.phone);
    if (!order) {
      existingPrintWindow?.close();
      return;
    }

    if (order) {
      if (action === 'print') {
        const billContent = generateBillContent({
          ...order,
          paymentMethod: selectedPayment,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerEmail: customer.email,
          customerAddress: [customer.address, customer.city, customer.state, customer.pincode].filter(Boolean).join(', '),
        });
        const kotContent = generateKOT(order);

        console.log('[Print] Bill HTML:', billContent);

        directPrint(billContent, () => {
          if (customer.phone || customer.email) {
            autoShareBillAfterPrint({
              customerName: customer.name,
              customerPhone: customer.phone,
              customerEmail: customer.email,
              billNumber: order.id.slice(-6).toUpperCase(),
              total: Math.round(finalTotal),
              items: order.items,
              subtotal: order.subtotal,
              tax: order.tax,
              discount: order.discount,
            });
          }
          setTimeout(() => {
            directPrint(kotContent, () => {
              toast({ title: t('msg.saleComplete'), description: `${t('pos.billNumber')} #${order.id.slice(-6)} - ${t('msg.billKotPrinted')}` });
            });
          }, 500);
        }, existingPrintWindow);
      } else if (action === 'kot') {
        const kotContent = generateKOT(order);
        directPrint(kotContent, () => {
          toast({ title: t('msg.saleComplete'), description: `${t('common.orderNo')} #${order.id.slice(-6)} - ${t('msg.kotSentKitchen')}` });
        });
      }
      
      // Reset states
      setSelectedPayment(null);
      setDiscount(0);
      setDiscountReason('');
      setDeliveryCharge(0);
      setContainerCharge(0);
      setTip(0);
      setCustomer({ name: '', phone: '', email: '', address: '', city: '', state: '', pincode: '' });
    }
  };

  // KOT + Print: Only prints KOT, does NOT count as sale
  const printKOTOnly = () => {
    if (cart.length === 0) {
      toast({ title: t('msg.emptyCart'), description: t('msg.addItemsFirst'), variant: 'destructive' });
      return;
    }

    const kotOrder = {
      id: `KOT-${Date.now()}`,
      kotNumber: `KOT-${Date.now().toString().slice(-6)}`,
      items: cart,
      tableNumber: selectedTable?.number,
      orderType: currentOrderType,
    };

    const kotContent = generateKOT(kotOrder);
    directPrint(kotContent, () => {
      toast({ title: t('msg.kotPrinted'), description: t('msg.kotNotCountedAsSale') });
    });
  };

  const handleHoldBill = () => {
    if (cart.length === 0) return;
    holdBill();
    toast({
      title: t('msg.billHeld'),
      description: t('msg.billSavedForLater'),
    });
    setSelectedPayment(null);
  };

  const handleApplyDiscount = (discountAmount: number, reason: string) => {
    setDiscount(discountAmount);
    setDiscountReason(reason);
    toast({ title: t('msg.discountApplied'), description: `${formatCurrency(discountAmount)} ${t('msg.discountAppliedAmount')}` });
  };

  const handleSplitConfirm = async (splits: any[]) => {
    const order = await directBillPrint('cash', customer.name, customer.phone);
    if (order) {
      toast({ 
        title: t('msg.splitBillComplete'), 
        description: `${t('common.orderNo')} #${order.id.slice(-6)} ${t('msg.splitBetweenCustomers')} ${splits.length}` 
      });
      setSelectedPayment(null);
      setDiscount(0);
    }
  };

  return (
    <>
    {/* Merge Confirmation Dialog */}
    {showMergeDialog && pendingOrderAction && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-[#F8FAFC] rounded-2xl p-6 w-96 shadow-2xl animate-scale-in">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#F59E0B]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-[#F59E0B]" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A]">Merge Order</h3>
            <p className="text-[#64748B] text-sm mt-1">
              Table {selectedTable?.number} has an existing held bill
            </p>
            <p className="text-sm mt-2 text-[#64748B]">
              Do you want to merge the current items with the held bill?
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={async () => {
                setShowMergeDialog(false);
                const order = await directBillPrint(pendingOrderAction.paymentMethod, customer.name, customer.phone);
                if (order && pendingOrderAction.action) {
                  // Handle the action like in completeSale
                  if (pendingOrderAction.action === 'print') {
                    const billContent = generateBillContent({
                      ...order,
                      paymentMethod: pendingOrderAction.paymentMethod,
                      customerName: customer.name,
                      customerPhone: customer.phone,
                      customerEmail: customer.email,
                      customerAddress: [customer.address, customer.city, customer.state, customer.pincode].filter(Boolean).join(', '),
                    });
                    directPrint(billContent, () => {
                      toast({ title: t('msg.saleComplete'), description: `${t('pos.billNumber')} #${order.id.slice(-6)} - ${t('msg.billKotPrinted')}` });
                    });
                  }
                  // Reset states
                  setSelectedPayment(null);
                  setDiscount(0);
                }
                setPendingOrderAction(null);
              }}
              className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all duration-200 border border-[#334155]"
            >
              <Merge className="w-5 h-5" />
              Merge
            </button>
            <button
              onClick={() => {
                setShowMergeDialog(false);
                setPendingOrderAction(null);
                toast.info('Order cancelled');
              }}
              className="w-full bg-[#1E293B] hover:bg-[#334155] text-[#E2E8F0] py-3 rounded-lg font-medium transition-all duration-200 border border-[#334155]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Edit Mode Toolbar */}
    <EditModeToolbar
      isEditMode={editMode.isEditMode}
      onSave={() => {
        editMode.exitEditMode();
        sonnerToast.success('Layout saved successfully!');
      }}
      onCancel={() => {
        const snapshot = editMode.getSnapshot();
        if (snapshot) {
          updateConfig(snapshot);
        }
        editMode.exitEditMode();
        sonnerToast.info('Changes cancelled');
      }}
      onReset={() => {
        resetToDefault();
        editMode.markChanged();
        sonnerToast.success('Reset to default layout');
      }}
      onToggleEditMode={() => {
        if (editMode.isEditMode) {
          editMode.exitEditMode();
        } else {
          editMode.enterEditMode(uiConfig);
        }
      }}
      hasChanges={editMode.hasChanges}
    />

    {/* Edit Mode Inline Layout Panel */}
    {editMode.isEditMode && (
      <div className="fixed top-12 left-0 right-0 z-[99] bg-card border-b border-border shadow-md">
        <div className="flex items-center gap-6 px-4 py-2 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-fit">
            <span className="text-xs font-semibold text-muted-foreground">Menu:</span>
            <select
              value={uiConfig.layout.menuPosition}
              onChange={(e) => { updateLayout({ menuPosition: e.target.value as 'left' | 'right' }); editMode.markChanged(); }}
              className="h-7 text-xs rounded border border-border bg-background px-2"
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div className="flex items-center gap-2 min-w-fit">
            <span className="text-xs font-semibold text-muted-foreground">Order Panel:</span>
            <select
              value={uiConfig.layout.orderPanelPosition}
              onChange={(e) => { updateLayout({ orderPanelPosition: e.target.value as 'left' | 'right' }); editMode.markChanged(); }}
              className="h-7 text-xs rounded border border-border bg-background px-2"
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div className="flex items-center gap-2 min-w-fit">
            <span className="text-xs font-semibold text-muted-foreground">Grid:</span>
            <select
              value={String(uiConfig.layout.menuGridCols)}
              onChange={(e) => { updateLayout({ menuGridCols: Number(e.target.value) }); editMode.markChanged(); }}
              className="h-7 text-xs rounded border border-border bg-background px-2"
            >
              <option value="3">3 cols</option>
              <option value="4">4 cols</option>
              <option value="5">5 cols</option>
              <option value="6">6 cols</option>
            </select>
          </div>
          <div className="flex items-center gap-2 min-w-fit">
            <span className="text-xs font-semibold text-muted-foreground">Categories:</span>
            <select
              value={uiConfig.layout.categoryPosition}
              onChange={(e) => { updateLayout({ categoryPosition: e.target.value as 'left' | 'top' }); editMode.markChanged(); }}
              className="h-7 text-xs rounded border border-border bg-background px-2"
            >
              <option value="left">Left Sidebar</option>
              <option value="top">Top Bar</option>
            </select>
          </div>
          <label className="flex items-center gap-1.5 min-w-fit cursor-pointer">
            <input
              type="checkbox"
              checked={uiConfig.layout.showImages}
              onChange={(e) => { updateLayout({ showImages: e.target.checked }); editMode.markChanged(); }}
              className="w-3.5 h-3.5 rounded accent-primary"
            />
            <span className="text-xs font-semibold text-muted-foreground">Images</span>
          </label>
        </div>
      </div>
    )}

    <div className={cn("h-[calc(100vh-56px)] flex overflow-hidden", editMode.isEditMode && "mt-[88px] h-[calc(100vh-56px-88px)]")}>
      {/* Left Panel - Categories (Vertical) */}
      <div className="w-24 bg-card border-r border-border flex flex-col overflow-hidden">
        <div className="p-2 flex-1 overflow-y-auto no-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              'w-full p-3 rounded-xl text-center text-xs font-medium mb-2 transition-all duration-200',
              activeCategory === 'all'
                ? 'bg-[#2563EB] text-white border border-[#2563EB] shadow-sm'
                : 'bg-white text-[#0F172A] border border-[#CBD5E1] hover:bg-[#EFF6FF] hover:border-[#93C5FD]'
            )}
          >
            {t('common.all')}
          </button>
          {categories.map(cat => {
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'w-full p-3 rounded-lg text-center mb-2 transition-all duration-200 font-medium text-xs',
                  activeCategory === cat.id
                    ? 'bg-[#2563EB] text-white shadow-sm border border-[#2563EB]'
                    : 'bg-white text-[#0F172A] hover:bg-[#EFF6FF] border border-[#CBD5E1]'
                )}
              >
                <span className="text-lg block mb-1">{cat.icon}</span>
                <span className="block truncate">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Center Panel - Menu Items */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Order Type & Search */}
        <div className="p-3 bg-card border-b border-border space-y-3">
          {/* Order Type Tabs */}
          <div className="flex gap-2">
            {orderTypes.map(type => {
              return (
                <Button
                  key={type.id}
                  variant={currentOrderType === type.id ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "px-4 py-2 font-medium text-sm transition-all duration-200 border rounded-lg",
                    currentOrderType === type.id
                      ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-md shadow-slate-900/50'
                      : 'bg-[#1E293B] text-[#CBD5E1] border-[#334155] hover:bg-[#334155] hover:border-[#475569]'
                  )}
                  onClick={() => setCurrentOrderType(type.id)}
                >
                  {type.label}
                </Button>
              );
            })}
            
            {selectedTable && (
              <div className="ml-auto px-3 py-2 bg-[#10B981]/10 text-[#10B981] rounded-lg text-sm font-medium border border-[#10B981]/30">
                {t('common.table')} {selectedTable.number}
              </div>
            )}
          </div>

          {/* Search with Barcode Scanner */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search Product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 border border-[#CBD5E1] bg-white text-slate-900 placeholder:text-slate-500 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20"
              />
            </div>
            {/* Barcode Scanner Button - hidden for basic plan */}
            {canAccess('barcodeScanner') && (
              <BarcodeButton variant="blue" size="default" className="h-10 px-3" showLabel />
            )}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-auto p-3">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${uiConfig.layout.menuGridCols}, minmax(0, 1fr))`,
            }}
          >
            {filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'menu-item text-left relative rounded-lg bg-card overflow-hidden ring-1 ring-border',
                  item.id.startsWith('others-')
                    ? 'ring-2 ring-dashed ring-primary/30 hover:ring-primary p-3'
                    : 'text-foreground shadow-sm hover:ring-primary hover:shadow-md'
                )}
              >
                {item.id.startsWith('others-') ? (
                  <div className="flex h-full min-h-[60px] flex-col items-center justify-center gap-1 text-center">
                    <PackagePlus className="w-6 h-6 text-primary" />
                    <h4 className="font-medium text-xs">Others</h4>
                    <p className="text-[10px] text-muted-foreground">Custom item</p>
                  </div>
                ) : (
                  <>
                    {/* Variation indicator */}
                    {item.variations && item.variations.length > 0 && (
                      <div className="absolute top-1.5 right-1.5 z-10 rounded-full bg-primary p-1 text-primary-foreground">
                        <Layers className="w-2.5 h-2.5" />
                      </div>
                    )}
                    {/* Image area - square, full width */}
                    <div className="w-full aspect-square bg-muted/80 flex items-center justify-center relative">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="w-10 h-10 text-muted-foreground/40" />
                      )}
                      {/* Add button */}
                      <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                    {/* Name & price */}
                    <div className="p-2.5">
                      <h4 className="font-semibold text-xs leading-snug break-words whitespace-normal text-foreground line-clamp-1">{item.name}</h4>
                      {item.variations && item.variations.length > 0 ? (
                        <p className="text-sm font-bold text-primary mt-1">
                          {formatCurrency(Math.min(item.price || Infinity, ...item.variations.map(v => v.price)))}+
                        </p>
                      ) : (
                        <p className="text-sm font-bold text-primary mt-1">{formatCurrency(item.price)}</p>
                      )}
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {t('common.noItemsFound')}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Cart & Billing */}
      <div className="w-[600px] flex-shrink-0 overflow-hidden border-l border-border bg-card flex flex-col">
        {/* Cart Header with Table Select */}
        <div className="p-2 border-b border-border space-y-2">
          <div className="flex items-center justify-between gap-1">
            <h2 className="font-semibold text-sm whitespace-nowrap">{t('common.currentOrder')}</h2>
            <TooltipProvider delayDuration={300}>
               <div className="flex items-center gap-1 flex-nowrap">
                {isButtonVisible('customer') && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 bg-[#1E293B] border-[#334155] text-[#E2E8F0] hover:bg-[#334155] hover:border-[#475569] transition-all duration-200"
                      onClick={() => setShowCustomerDetails(!showCustomerDetails)}
                    >
                      <User className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p>{customer.name || t('common.contact') || 'Contact'}</p></TooltipContent>
                </Tooltip>
                )}
                {isButtonVisible('heldBills') && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 relative bg-[#1E293B] border-[#334155] text-[#E2E8F0] hover:bg-[#334155] hover:border-[#475569] transition-all duration-200"
                      onClick={() => setShowHeldBills(!showHeldBills)}
                    >
                      <Play className="w-3.5 h-3.5" />
                      {heldBills.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#10B981] text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                          {heldBills.length}
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p>{t('common.recall')}</p></TooltipContent>
                </Tooltip>
                )}
                {isButtonVisible('qrMenu') && canAccess('qrMenuOrdering') && <QRMenuGenerator />}
                {isButtonVisible('qrOrders') && canAccess('qrMenuOrdering') && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0 bg-[#1E293B] border-[#334155] text-[#E2E8F0] hover:bg-[#334155] hover:border-[#475569] transition-all duration-200"
                        onClick={() => setShowQROrders(true)}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>Orders</p></TooltipContent>
                  </Tooltip>
                )}
                {/* UI Customization - Edit Mode Toggle + Settings */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={editMode.isEditMode ? "destructive" : "outline"}
                      size="icon"
                      className={cn("h-8 w-8 flex-shrink-0 bg-[#1E293B] border-[#334155] text-[#E2E8F0] hover:bg-[#334155] hover:border-[#475569] transition-all duration-200", editMode.isEditMode && "animate-pulse bg-[#EF4444] border-[#EF4444] text-white hover:bg-[#DC2626]")}
                      onClick={() => {
                        if (editMode.isEditMode) {
                          editMode.exitEditMode();
                        } else {
                          editMode.enterEditMode(uiConfig);
                        }
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p>{editMode.isEditMode ? 'Exit Edit Mode' : 'Edit UI Layout'}</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 bg-[#1E293B] border-[#334155] text-[#E2E8F0] hover:bg-[#334155] hover:border-[#475569] transition-all duration-200"
                      onClick={() => navigate('/ui-customization')}
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p>All Settings</p></TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>

          {/* Table Selection */}
          {canAccess('tableManagement') && currentOrderType === 'dine-in' && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedTableId || ''} onValueChange={handleTableChange}>
                <SelectTrigger className="flex-1 h-9">
                  <SelectValue placeholder={t('tables.selectTable')} />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {tables.map(table => (
                    <SelectItem 
                      key={table.id} 
                      value={table.id}
                      disabled={table.status === 'occupied' && table.id !== selectedTableId}
                    >
                      {t('common.table')} {table.number} ({table.capacity} {t('common.seats')}) - {table.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Customer Details */}
        <CustomerDetails 
          customer={customer} 
          onChange={setCustomer}
          orderType={currentOrderType}
          isOpen={showCustomerDetails}
          onToggle={() => setShowCustomerDetails(false)}
        />

        {/* Held Bills Dropdown */}
        {showHeldBills && heldBills.length > 0 && (
          <div className="p-3 bg-secondary/50 border-b border-border space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{t('common.heldBills').toUpperCase()}</p>
            {heldBills.map(bill => (
              <div
                key={bill.id}
                className="flex items-center gap-2 p-2 bg-card rounded-lg border border-border"
              >
                <button
                  onClick={() => {
                    recallBill(bill.id);
                    setShowHeldBills(false);
                  }}
                  className="flex-1 text-left hover:bg-muted rounded transition-colors p-1"
                >
                  <div className="flex justify-between text-sm">
                    <span>{bill.tableNumber ? `${t('common.table')} ${bill.tableNumber}` : t('pos.takeaway')}</span>
                    <span className="font-medium">{bill.items.length} {t('common.items')}</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    deleteHeldBill(bill.id);
                    sonnerToast.success('Held bill discarded');
                  }}
                  className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                  title="Discard bill"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 min-h-[220px] overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center text-center text-muted-foreground text-sm">
              {t('pos.emptyCart')}
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 text-foreground"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs leading-tight break-words text-foreground">{item.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatCurrency(item.price)} × {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-muted"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center text-xs font-medium text-foreground">{item.quantity}</span>
                  <button
                    onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-muted"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="ml-1 flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-destructive hover:bg-muted"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border bg-card">
        {/* Billing Summary Swipe Up */}
        <div>
          {/* Toggle Button */}
          <button
            onClick={() => setShowBillingSummary(!showBillingSummary)}
            className="w-full p-2 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            {showBillingSummary ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            {showBillingSummary ? t('common.hideDetails') : t('common.showDetails')}
          </button>

          {/* Expandable Summary */}
          {showBillingSummary && (
            <div className="space-y-1.5 border-t border-border bg-secondary/30 p-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('common.subtotal')}</span>
                <span>{formatCurrency(cartSubtotal)}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <button 
                  onClick={() => setShowDiscountDialog(true)}
                  className="text-muted-foreground flex items-center gap-1 hover:text-foreground"
                >
                  <Percent className="w-3 h-3" />
                  {t('common.discount')}
                  <span className="text-xs bg-primary/10 text-primary px-1 rounded">{t('common.more')}</span>
                </button>
                <span className="text-destructive">-{formatCurrency(discount)}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{t('pos.deliveryCharge')}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setDeliveryCharge(Math.max(0, deliveryCharge - 10))} className="w-5 h-5 rounded bg-muted flex items-center justify-center">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-12 text-center">{formatCurrency(deliveryCharge)}</span>
                  <button onClick={() => setDeliveryCharge(deliveryCharge + 10)} className="w-5 h-5 rounded bg-muted flex items-center justify-center">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{t('pos.containerCharge')}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setContainerCharge(Math.max(0, containerCharge - 5))} className="w-5 h-5 rounded bg-muted flex items-center justify-center">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-12 text-center">{formatCurrency(containerCharge)}</span>
                  <button onClick={() => setContainerCharge(containerCharge + 5)} className="w-5 h-5 rounded bg-muted flex items-center justify-center">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <button 
                  onClick={() => setShowTaxDialog(true)}
                  className="text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Receipt className="w-3 h-3" />
                  Tax ({taxPercent}%)
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded cursor-pointer hover:bg-primary/20">Edit</span>
                </button>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => {
                      const newTax = Math.max(0, calculatedTax - 10);
                      setCustomTax(newTax);
                    }} 
                    className="w-5 h-5 rounded bg-muted flex items-center justify-center hover:bg-muted-foreground/20"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-14 text-center">{formatCurrency(calculatedTax)}</span>
                  <button 
                    onClick={() => {
                      const newTax = calculatedTax + 10;
                      setCustomTax(newTax);
                    }} 
                    className="w-5 h-5 rounded bg-muted flex items-center justify-center hover:bg-muted-foreground/20"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('common.roundOff')}</span>
                <span>{roundOff >= 0 ? '+' : ''}{formatCurrency(roundOff)}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{t('pos.tip')}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setTip(Math.max(0, tip - 10))} className="w-5 h-5 rounded bg-muted flex items-center justify-center">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-12 text-center">{formatCurrency(tip)}</span>
                  <button onClick={() => setTip(tip + 10)} className="w-5 h-5 rounded bg-muted flex items-center justify-center">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Complimentary & Total */}
          <div className="space-y-2 border-t border-border p-2">
            {/* Complimentary Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isComplimentary}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setShowComplimentaryDialog(true);
                    } else {
                      setIsComplimentary(false);
                      setComplimentaryNote('');
                    }
                  }}
                  className="w-4 h-4 rounded border-border accent-primary" 
                />
                <span className="text-xs font-medium text-foreground">{t('common.complimentary')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-primary" 
                />
                <span className="text-xs font-medium text-foreground">{t('common.itsPaid')}</span>
              </label>
            </div>
            {isComplimentary && complimentaryNote && (
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded truncate max-w-[150px]">
                  {complimentaryNote}
                </span>
              )}
            </div>
            
            {/* Total */}
            <div className="flex justify-between text-sm font-bold">
              <span>{t('common.total')}</span>
              <span className={cn("text-primary", isComplimentary && "line-through text-muted-foreground")}>
                {formatCurrency(Math.round(isComplimentary ? cartTotal : finalTotal))}
              </span>
            </div>
            {isComplimentary && (
              <div className="flex justify-between text-sm font-bold text-success">
                <span>{t('common.complimentaryTotal')}</span>
                <span>₹0</span>
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="border-t border-[#334155] p-1">
            <p className="text-xs text-[#94A3B8] mb-1 font-semibold">{t('common.selectPayment').toUpperCase()}</p>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => handlePaymentSelect('cash')}
                className={cn(
                  'w-full h-12 rounded-lg flex flex-col items-center justify-center gap-1 transition-all duration-200 border font-medium text-xs',
                  selectedPayment === 'cash'
                    ? 'bg-[#0F172A] border-[#0F172A] text-white shadow-lg shadow-slate-900/50'
                    : 'bg-[#1E293B] border-[#334155] text-[#CBD5E1] hover:bg-[#334155] hover:border-[#475569]',
                  cart.length === 0 && 'opacity-60'
                )}
              >
                  <Banknote className="w-5 h-5" />
                  <span>{t('pos.cash')}</span>
              </button>
              <button
                onClick={() => handlePaymentSelect('card')}
                className={cn(
                  'w-full h-12 rounded-lg flex flex-col items-center justify-center gap-1 transition-all duration-200 border font-medium text-xs',
                  selectedPayment === 'card'
                    ? 'bg-[#0F172A] border-[#0F172A] text-white shadow-lg shadow-slate-900/50'
                    : 'bg-[#1E293B] border-[#334155] text-[#CBD5E1] hover:bg-[#334155] hover:border-[#475569]',
                  cart.length === 0 && 'opacity-60'
                )}
              >
                  <CreditCard className="w-5 h-5" />
                  <span>{t('pos.card')}</span>
              </button>
              <button
                onClick={() => handlePaymentSelect('upi')}
                className={cn(
                  'w-full h-12 rounded-lg flex flex-col items-center justify-center gap-1 transition-all duration-200 border font-medium text-xs',
                  selectedPayment === 'upi'
                    ? 'bg-[#0F172A] border-[#0F172A] text-white shadow-lg shadow-slate-900/50'
                    : 'bg-[#1E293B] border-[#334155] text-[#CBD5E1] hover:bg-[#334155] hover:border-[#475569]',
                  cart.length === 0 && 'opacity-60'
                )}
              >
                  <Smartphone className="w-5 h-5" />
                  <span>{t('pos.upi')}</span>
              </button>
              <button
                onClick={() => {
                  if (cart.length === 0) {
                    toast({ title: t('msg.emptyCart'), description: t('msg.addItemsFirst'), variant: 'destructive' });
                    return;
                  }
                  setShowMorePayments(true);
                }}
                className={cn(
                  'w-full h-12 rounded-lg flex flex-col items-center justify-center gap-1 transition-all duration-200 border font-medium text-xs',
                  ['due', 'part', 'wallet', 'credit'].includes(selectedPayment || '')
                    ? 'bg-[#0F172A] border-[#0F172A] text-white shadow-lg shadow-slate-900/50'
                    : 'bg-[#1E293B] border-[#334155] text-[#CBD5E1] hover:bg-[#334155] hover:border-[#475569]',
                  cart.length === 0 && 'opacity-60'
                )}
              >
                  <MoreHorizontal className="w-5 h-5" />
                  <span>{t('common.more')}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons - Drag & Drop in Edit Mode */}
          <div className={cn("border-t border-border p-1", editMode.isEditMode && "ring-2 ring-primary/30 ring-inset bg-primary/5 relative")}>
            {editMode.isEditMode && (
              <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5">⚡ Action Buttons — Drag to reorder</div>
            )}
            <DraggableButtonGrid
              buttons={getGroupButtons('cart_actions').filter(btn => {
                if ((btn.id === 'kot' || btn.id === 'kotPrint') && !canAccess('kot')) return false;
                if ((btn.id === 'qrMenu' || btn.id === 'qrOrders') && !canAccess('qrMenuOrdering')) return false;
                if (['discount', 'customer', 'qrMenu', 'qrOrders'].includes(btn.id)) return false; // Remove these buttons
                return true;
              })}
              isEditMode={editMode.isEditMode}
              onReorder={(from, to) => {
                reorderButtons('cart_actions', from, to);
                editMode.markChanged();
              }}
              onToggleVisibility={(id) => {
                toggleButton(id);
                editMode.markChanged();
              }}
              renderButton={(btn) => {
                const buttonActions: Record<string, () => void> = {
                  split: () => {
                    if (cart.length === 0) {
                      toast({ title: t('msg.emptyCart'), description: t('msg.addItemsFirst'), variant: 'destructive' });
                      return;
                    }
                    setShowSplitDialog(true);
                  },
                  print: () => {
                    if (cart.length === 0) {
                      toast({ title: t('msg.emptyCart'), description: t('msg.addItemsFirst'), variant: 'destructive' });
                      return;
                    }
                    if (!selectedPayment) {
                      toast({ title: t('common.selectPayment'), description: t('msg.selectPaymentFirst'), variant: 'destructive' });
                      return;
                    }
                    preparedPrintWindowRef.current?.close();
                    preparedPrintWindowRef.current = preparePrintWindow();
                    if (!preparedPrintWindowRef.current) return;
                    completeSale('print', preparedPrintWindowRef.current);
                  },
                  kot: () => {
                    if (cart.length === 0) {
                      toast({ title: t('msg.emptyCart'), description: t('msg.addItemsFirst'), variant: 'destructive' });
                      return;
                    }
                    completeSale('kot');
                  },
                  kotPrint: () => {
                    if (cart.length === 0) {
                      toast({ title: t('msg.emptyCart'), description: t('msg.addItemsFirst'), variant: 'destructive' });
                      return;
                    }
                    printKOTOnly();
                  },
                  hold: () => {
                    if (cart.length === 0) {
                      toast({ title: t('msg.emptyCart'), description: t('msg.addItemsFirst'), variant: 'destructive' });
                      return;
                    }
                    handleHoldBill();
                  },
                  heldBills: () => {
                    if (cart.length === 0) {
                      toast({ title: t('msg.emptyCart'), description: t('msg.addItemsFirst'), variant: 'destructive' });
                      return;
                    }
                    setShowHeldBills(!showHeldBills);
                  },
                  discount: () => setShowDiscountDialog(true),
                };
                const iconMap: Record<string, React.ReactNode> = {
                  split: <Scissors className="w-5 h-5" />,
                  print: <Printer className="w-5 h-5" />,
                  kot: <FileText className="w-5 h-5" />,
                  kotPrint: <Receipt className="w-5 h-5" />,
                  hold: <Pause className="w-5 h-5" />,
                  discount: <Percent className="w-5 h-5" />,
                };
                const actionVariantMap: Record<string, 'red' | 'blue' | 'yellow' | 'green' | 'default' | 'outline'> = {
                  split: 'default',
                  print: 'default',
                  kot: 'default',
                  kotPrint: 'default',
                  hold: 'default',
                  heldBills: 'default',
                  discount: 'default',
                };
                return (
                  <Button
                    variant={actionVariantMap[btn.id] || 'outline'}
                    size="sm"
                    onClick={buttonActions[btn.id] || (() => {})}
                    className="w-full h-10 gap-1 px-2 text-sm bg-[#1E293B] text-[#E2E8F0] border border-[#334155] hover:bg-[#334155] hover:border-[#475569] transition-all duration-200"
                  >
                    {iconMap[btn.id]}
                    {btn.label}
                  </Button>
                );
              }}
            />
          </div>
          </div>
        </div>
        </div>
      </div>

      {/* Split Bill Dialog */}
      <SplitBillDialog
        open={showSplitDialog}
        onOpenChange={setShowSplitDialog}
        totalAmount={Math.round(finalTotal)}
        onConfirm={handleSplitConfirm}
      />

      {/* Discount Dialog */}
      <DiscountDialog
        open={showDiscountDialog}
        onOpenChange={setShowDiscountDialog}
        subtotal={cartSubtotal}
        currentDiscount={discount}
        onApplyDiscount={handleApplyDiscount}
      />

      <CustomItemDialog
        open={showCustomItemDialog}
        onOpenChange={setShowCustomItemDialog}
        onAdd={handleAddCustomItem}
        categoryId={activeCategory}
      />

      {/* Variation Selector Sheet */}
      <VariationSelectorSheet
        item={selectedItemForVariation}
        isOpen={variationSheetOpen}
        onClose={() => {
          setVariationSheetOpen(false);
          setSelectedItemForVariation(null);
        }}
        onSelect={handleVariationSelect}
      />

      {/* More Payment Methods Sheet */}
      <Sheet open={showMorePayments} onOpenChange={setShowMorePayments}>
        <SheetContent side="bottom" className="h-auto max-h-[50vh]">
          <SheetHeader className="pb-4">
            <SheetTitle>{t('common.paymentOptions')}</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3 pb-4">
            {/* Cash */}
            <button
              onClick={() => {
                handlePaymentSelect('cash');
                setShowMorePayments(false);
              }}
              className={cn(
                'h-16 rounded-lg flex flex-col items-center justify-center gap-1 border-2 transition-all duration-200 font-medium',
                selectedPayment === 'cash' 
                  ? 'border-[#0F172A] bg-[#0F172A]/10 text-[#0F172A]' 
                  : 'border-[#334155] bg-[#1E293B] text-[#CBD5E1] hover:border-[#475569] hover:bg-[#334155]'
              )}
            >
              <Banknote className="w-5 h-5" />
              <span className="text-sm">{t('pos.cash')}</span>
            </button>
            
            {/* UPI */}
            <button
              onClick={() => {
                handlePaymentSelect('upi');
                setShowMorePayments(false);
              }}
              className={cn(
                'h-16 rounded-lg flex flex-col items-center justify-center gap-1 border-2 transition-all duration-200 font-medium',
                selectedPayment === 'upi' 
                  ? 'border-[#0F172A] bg-[#0F172A]/10 text-[#0F172A]' 
                  : 'border-[#334155] bg-[#1E293B] text-[#CBD5E1] hover:border-[#475569] hover:bg-[#334155]'
              )}
            >
              <Smartphone className="w-5 h-5" />
              <span className="text-sm">{t('pos.upi')}</span>
            </button>
            
            {/* Card */}
            <button
              onClick={() => {
                handlePaymentSelect('card');
                setShowMorePayments(false);
              }}
              className={cn(
                'h-16 rounded-lg flex flex-col items-center justify-center gap-1 border-2 transition-all duration-200 font-medium',
                selectedPayment === 'card' 
                  ? 'border-[#0F172A] bg-[#0F172A]/10 text-[#0F172A]' 
                  : 'border-[#334155] bg-[#1E293B] text-[#CBD5E1] hover:border-[#475569] hover:bg-[#334155]'
              )}
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-sm">{t('pos.card')}</span>
            </button>
            
            {/* Due */}
            <button
              onClick={() => {
                handlePaymentSelect('due');
                setShowMorePayments(false);
              }}
              className={cn(
                'h-16 rounded-lg flex flex-col items-center justify-center gap-1 border-2 transition-all duration-200 font-medium',
                selectedPayment === 'due' 
                  ? 'border-[#0F172A] bg-[#0F172A]/10 text-[#0F172A]' 
                  : 'border-[#334155] bg-[#1E293B] text-[#CBD5E1] hover:border-[#475569] hover:bg-[#334155]'
              )}
            >
              <Clock className="w-5 h-5" />
              <span className="text-sm">{t('common.due')}</span>
            </button>
            
            {/* Part Payment */}
            <button
              onClick={() => {
                setShowMorePayments(false);
                setShowPartPaymentDialog(true);
              }}
              className={cn(
                'h-16 rounded-lg flex flex-col items-center justify-center gap-1 border-2 transition-all duration-200 font-medium',
                selectedPayment === 'part' 
                  ? 'border-[#0F172A] bg-[#0F172A]/10 text-[#0F172A]' 
                  : 'border-[#334155] bg-[#1E293B] text-[#CBD5E1] hover:border-[#475569] hover:bg-[#334155]'
              )}
            >
              <SplitSquareHorizontal className="w-5 h-5" />
              <span className="text-sm">{t('common.partPayment')}</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Part Payment Dialog */}
      <PartPaymentDialog
        open={showPartPaymentDialog}
        onOpenChange={setShowPartPaymentDialog}
        totalAmount={Math.round(finalTotal)}
        onConfirm={(payments) => {
          setPartPaymentDetails(payments);
          handlePaymentSelect('part');
          toast({
            title: t('common.partPayment'),
            description: payments.map(p => `${p.method}: ${formatCurrency(p.amount)}`).join(', '),
          });
        }}
      />


      {/* Complimentary Dialog */}
      {showComplimentaryDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 animate-fade-in">
          <div className="bg-[#F8FAFC] rounded-2xl p-6 w-[90%] max-w-md shadow-2xl animate-scale-in">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-7 h-7 text-[#10B981]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-1">{t('common.complimentary')}</h3>
              <p className="text-sm text-[#64748B]">{t('common.enterReasonComplimentary')}</p>
            </div>
            
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-sm font-medium text-[#0F172A] mb-1 block">{t('common.reason')} *</label>
                <input
                  type="text"
                  value={complimentaryNote}
                  onChange={(e) => setComplimentaryNote(e.target.value)}
                  placeholder="e.g., VIP Guest, Birthday, Manager Approval"
                  className="w-full px-4 py-3 rounded-lg bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#0F172A] focus:outline-none text-base text-[#0F172A]"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setShowComplimentaryDialog(false);
                  setComplimentaryNote('');
                }}
                className="py-3 rounded-lg bg-[#1E293B] text-[#E2E8F0] font-bold text-base hover:bg-[#334155] transition-all duration-200 border border-[#334155]"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  if (complimentaryNote.trim()) {
                    setIsComplimentary(true);
                    setShowComplimentaryDialog(false);
                    toast({ title: t('msg.complimentaryEnabled'), description: `${t('common.reason')}: ${complimentaryNote}` });
                  } else {
                    toast({ title: t('common.required'), description: t('common.enterReason'), variant: 'destructive' });
                  }
                }}
                className="py-3 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white font-bold text-base transition-all duration-200 border border-[#10B981]"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Settings Dialog */}
      {showTaxDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 animate-fade-in">
          <div className="bg-[#F8FAFC] rounded-2xl p-6 w-[90%] max-w-md shadow-2xl animate-scale-in">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-[#0F172A]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-7 h-7 text-[#0F172A]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-1">{t('settings.taxes')}</h3>
              <p className="text-sm text-[#64748B]">{t('msg.adjustTax') || 'Adjust tax percentage or set custom amount'}</p>
            </div>
            
            <div className="space-y-4 mb-6">
              {/* Tax Percentage Presets */}
              <div>
                <label className="text-sm font-medium text-[#0F172A] mb-2 block">{t('common.tax')} %</label>
                <div className="grid grid-cols-5 gap-2">
                  {[0, 5, 12, 18, 28].map((percent) => (
                    <button
                      key={percent}
                      onClick={() => {
                        setTaxPercent(percent);
                        setCustomTax(null);
                      }}
                      className={cn(
                        "py-2 rounded-lg text-sm font-medium transition-all duration-200 border-2",
                        taxPercent === percent && customTax === null
                          ? "border-[#0F172A] bg-[#0F172A]/10 text-[#0F172A]"
                          : "border-[#CBD5E1] text-[#64748B] hover:border-[#0F172A] hover:bg-[#F1F5F9]"
                      )}
                    >
                      {percent}%
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Custom Tax Amount */}
              <div>
                <label className="text-sm font-medium text-[#0F172A] mb-2 block">{t('msg.customTaxAmount') || 'Or Enter Custom Tax Amount'}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]">₹</span>
                  <input
                    type="number"
                    value={customTax !== null ? customTax : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setCustomTax(null);
                      } else {
                        setCustomTax(Number(val) || 0);
                      }
                    }}
                    placeholder={`Auto: ${formatCurrency(cartSubtotal * taxPercent / 100)}`}
                    className="w-full pl-8 pr-4 py-3 rounded-lg bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#0F172A] focus:outline-none text-lg text-[#0F172A]"
                  />
                </div>
                <p className="text-xs text-[#64748B] mt-1">
                  {t('msg.leaveEmptyForAuto') || `Leave empty to use ${taxPercent}% of subtotal`} ({formatCurrency(cartSubtotal * taxPercent / 100)})
                </p>
              </div>
              
              {/* No Tax Option */}
              <button
                onClick={() => {
                  setTaxPercent(0);
                  setCustomTax(0);
                }}
                className="w-full py-2 rounded-lg border-2 border-[#CBD5E1] text-sm font-medium text-[#64748B] hover:border-[#EF4444] hover:text-[#EF4444] transition-colors duration-200"
              >
                {t('msg.removeAllTax') || 'Remove All Tax'} ({formatCurrency(0)})
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowTaxDialog(false)}
                className="py-3 rounded-lg bg-[#1E293B] text-[#E2E8F0] font-bold text-base hover:bg-[#334155] transition-all duration-200 border border-[#334155]"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  setShowTaxDialog(false);
                  toast({ title: t('msg.taxUpdated'), description: `${t('msg.taxSetTo')} ${formatCurrency(calculatedTax)}` });
                }}
                className="py-3 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-base transition-all duration-200 border border-[#334155]"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

    {/* Link Barcode Dialog */}
    <LinkBarcodeDialog scannedCode={unmatchedCode} onClose={clearUnmatchedCode} />
    
    {/* QR Orders Sheet */}
    <Sheet open={showQROrders} onOpenChange={setShowQROrders}>
      <SheetContent side="right" className="w-[400px] sm:w-[450px]">
        <SheetHeader>
          <SheetTitle>QR Menu Orders</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <QROrdersPanel />
        </div>
      </SheetContent>
    </Sheet>
    {/* Sales Reset Warning Dialog */}
    <SalesResetWarningDialog
      isOpen={showSalesResetWarning}
      timeUntilReset={timeUntilReset}
      resetTimeLabel={formattedResetTime}
      onResetNow={handleResetNow}
      onExtend={handleExtendTime}
      onDismiss={dismissSalesResetWarning}
    />
    </>
  );
};

export default POSBillingPage;
