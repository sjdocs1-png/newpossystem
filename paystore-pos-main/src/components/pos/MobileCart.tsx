import React, { useState } from 'react';
import { usePOS } from '@/contexts/POSContext';
import { formatCurrency } from '@/lib/store';
import { cn } from '@/lib/utils';
import { smartPrint, getPrintSettings } from '@/lib/printUtils';
import { generateProfessionalBill } from '@/lib/billTemplate';
import { 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  Check,
  ChevronUp,
  ChevronDown,
  UtensilsCrossed,
  ShoppingBag,
  Truck,
  Clock,
  Printer,
  FileText,
  Split,
  Wallet,
  Receipt,
  MoreHorizontal,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PartPaymentDialog } from './PartPaymentDialog';
import { SplitBillDialog } from './SplitBillDialog';
import { usePaymentSound } from '@/hooks/usePaymentSound';
import { usePaymentSettings } from '@/hooks/usePaymentSettings';
import { useSubscription } from '@/hooks/useSubscription';

export const MobileCart: React.FC = () => {
  const {
    cart,
    updateCartQuantity,
    clearCart,
    cartSubtotal,
    currentOrderType,
    setCurrentOrderType,
    directBillPrint,
  } = usePOS();

  const [showPayment, setShowPayment] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'due' | 'wallet' | 'credit'>('cash');
  const [isComplimentary, setIsComplimentary] = useState(false);
  const [complimentaryNote, setComplimentaryNote] = useState('');
  const [showComplimentaryDialog, setShowComplimentaryDialog] = useState(false);
  const [taxPercent, setTaxPercentState] = useState(() => {
    const saved = localStorage.getItem('pos_tax_percent');
    return saved ? Number(saved) : 0;
  });
  const [customTax, setCustomTax] = useState<number | null>(null);
  const [showTaxDialog, setShowTaxDialog] = useState(false);
  
  // Save tax percent to localStorage when changed
  const setTaxPercent = (percent: number) => {
    setTaxPercentState(percent);
    localStorage.setItem('pos_tax_percent', String(percent));
  };
  const [showMorePaymentSheet, setShowMorePaymentSheet] = useState(false);
  const [showPartPaymentDialog, setShowPartPaymentDialog] = useState(false);
  const [showSplitBillDialog, setShowSplitBillDialog] = useState(false);
  const [showBillingSummary, setShowBillingSummary] = useState(false);

  const { playSuccessSound } = usePaymentSound();
  const { settings: paymentSettings } = usePaymentSettings();
  const { canAccess } = useSubscription();
  
  // Additional charges state
  const [discount, setDiscount] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(currentOrderType === 'delivery' ? 40 : 0);
  const [containerCharge, setContainerCharge] = useState(currentOrderType !== 'dine-in' ? 10 : 0);
  const [tip, setTip] = useState(0);
  const [customerPaid, setCustomerPaid] = useState(0);
  
  // Calculate custom tax
  const calculatedTax = customTax !== null ? customTax : (cartSubtotal * taxPercent / 100);
  
  // Calculate totals with all charges
  const totalBeforeRounding = cartSubtotal + calculatedTax + deliveryCharge + containerCharge + tip - discount;
  const roundOff = Math.round(totalBeforeRounding) - totalBeforeRounding;
  const grandTotal = Math.round(totalBeforeRounding);
  const returnToCustomer = customerPaid > grandTotal ? customerPaid - grandTotal : 0;

  const allOrderTypes = [
    { id: 'dine-in' as const, label: 'Dine In', icon: UtensilsCrossed },
    { id: 'takeaway' as const, label: 'Pickup', icon: ShoppingBag },
    { id: 'delivery' as const, label: 'Delivery', icon: Truck },
  ];

  const orderTypes = allOrderTypes.filter(t => {
    if (t.id === 'dine-in' && !canAccess('dineIn')) return false;
    if (t.id === 'takeaway' && !canAccess('takeaway')) return false;
    if (t.id === 'delivery' && !canAccess('delivery')) return false;
    return true;
  });

  const getStoreId = (): string => {
    try {
      const storeData = localStorage.getItem('pos_active_store_data');
      if (storeData) return JSON.parse(storeData)?.id || '';
    } catch {}
    return '';
  };

  const handlePayment = (method: 'cash' | 'card' | 'upi' | 'due' | 'wallet' | 'credit') => {
    setSelectedPaymentMethod(method);
    setShowMorePaymentSheet(false);
  };

  const handlePartPaymentConfirm = async (payments: { method: string; amount: number }[]) => {
    const order = await directBillPrint('cash'); // Part payment recorded as multi-method
    if (order) {
      const paymentDetails = payments.map(p => `${p.method}: ${formatCurrency(p.amount)}`).join(', ');
      toast.success('Part Payment completed!', {
        description: `Bill #${order.billNumber || order.id.slice(-6).toUpperCase()} - ${paymentDetails}`
      });
      setShowPayment(false);
      setIsOpen(false);
    }
  };

  const handleSplitBillConfirm = async (splits: { id: string; name: string; amount: number; paymentMethod: string }[]) => {
    const order = await directBillPrint('cash'); // Split payment recorded
    if (order) {
      toast.success('Split Bill completed!', {
        description: `Bill #${order.billNumber || order.id.slice(-6).toUpperCase()} split between ${splits.length} people`
      });
      setShowPayment(false);
      setIsOpen(false);
    }
  };

  const handlePrintBill = async () => {
    const order = await directBillPrint(selectedPaymentMethod);
    if (order) {
      toast.success('Bill printed!', {
        description: `Bill #${order.billNumber || order.id.slice(-6).toUpperCase()}`
      });
      setShowPayment(false);
      setIsOpen(false);
    }
  };

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (cart.length === 0) {
    return null;
  }

  return (
    <>
      {/* Floating Cart Button */}
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <button className="fixed bottom-4 left-4 right-4 z-50 bg-primary text-primary-foreground py-4 px-6 rounded-2xl shadow-xl flex items-center justify-between active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-white text-primary text-xs font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              </div>
              <span className="font-semibold text-lg">View Cart</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl">{formatCurrency(grandTotal)}</span>
              <ChevronUp className="w-5 h-5" />
            </div>
          </button>
        </DrawerTrigger>

        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b border-border pb-3">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-xl font-bold">Your Order</DrawerTitle>
              <button
                onClick={() => {
                  clearCart();
                  setIsOpen(false);
                }}
                className="text-destructive text-sm font-medium"
              >
                Clear All
              </button>
            </div>
          </DrawerHeader>

          <div className="p-4 overflow-y-auto max-h-[50vh]">
            {/* Order Type */}
            <div className="flex gap-2 mb-4">
              {orderTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setCurrentOrderType(type.id)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1 py-3 rounded-xl text-sm font-medium transition-all',
                    currentOrderType === type.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  )}
                >
                  <type.icon className="w-5 h-5" />
                  {type.label}
                </button>
              ))}
            </div>

            {/* Cart Items */}
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-secondary/50 rounded-xl p-3 flex items-center gap-3"
                >
                  <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-2xl flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      '🍽️'
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">{item.name}</h4>
                    <p className="text-primary font-bold">{formatCurrency(item.price * item.quantity)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      className="w-9 h-9 rounded-lg bg-background flex items-center justify-center"
                    >
                      {item.quantity === 1 ? (
                        <Trash2 className="w-4 h-4 text-destructive" />
                      ) : (
                        <Minus className="w-4 h-4" />
                      )}
                    </button>
                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals & Payment */}
          <div className="border-t border-border p-4 space-y-4 bg-card">
            {!showPayment ? (
            <>
                {/* Bill Summary Toggle Button */}
                <button
                  onClick={() => setShowBillingSummary(!showBillingSummary)}
                  className="w-full flex items-center justify-between p-2 bg-secondary rounded-xl mb-2"
                >
                  <span className="text-sm font-medium">Bill Summary</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary">{formatCurrency(grandTotal)}</span>
                    {showBillingSummary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {/* Expanded Bill Summary */}
                {showBillingSummary && (
                  <div className="space-y-2 p-3 bg-secondary/50 rounded-xl mb-3">
                    {/* Subtotal */}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(cartSubtotal)}</span>
                    </div>

                    {/* Discount */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Discount</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDiscount(Math.max(0, discount - 10))}
                          className="w-7 h-7 rounded-lg bg-background flex items-center justify-center touch-manipulation"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className={cn("w-14 text-center font-medium", discount > 0 && "text-green-600")}>
                          {discount > 0 ? `-₹${discount}` : '₹0'}
                        </span>
                        <button
                          onClick={() => setDiscount(discount + 10)}
                          className="w-7 h-7 rounded-lg bg-background flex items-center justify-center touch-manipulation"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Delivery Charge - only for delivery orders */}
                    {currentOrderType === 'delivery' && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Delivery Charge</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDeliveryCharge(Math.max(0, deliveryCharge - 10))}
                            className="w-7 h-7 rounded-lg bg-background flex items-center justify-center touch-manipulation"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-14 text-center font-medium">₹{deliveryCharge}</span>
                          <button
                            onClick={() => setDeliveryCharge(deliveryCharge + 10)}
                            className="w-7 h-7 rounded-lg bg-background flex items-center justify-center touch-manipulation"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Container Charge - for takeaway and delivery */}
                    {currentOrderType !== 'dine-in' && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Container Charge</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setContainerCharge(Math.max(0, containerCharge - 5))}
                            className="w-7 h-7 rounded-lg bg-background flex items-center justify-center touch-manipulation"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-14 text-center font-medium">₹{containerCharge}</span>
                          <button
                            onClick={() => setContainerCharge(containerCharge + 5)}
                            className="w-7 h-7 rounded-lg bg-background flex items-center justify-center touch-manipulation"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tax with Edit */}
                    <div className="flex justify-between items-center text-sm">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowTaxDialog(true);
                        }}
                        className="text-muted-foreground flex items-center gap-1 touch-manipulation"
                      >
                        Tax ({taxPercent}%)
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Edit</span>
                      </button>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCustomTax(Math.max(0, calculatedTax - 5));
                          }}
                          className="w-7 h-7 rounded-lg bg-background flex items-center justify-center touch-manipulation"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-14 text-center font-medium">{formatCurrency(calculatedTax)}</span>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCustomTax(calculatedTax + 5);
                          }}
                          className="w-7 h-7 rounded-lg bg-background flex items-center justify-center touch-manipulation"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Tip */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Tip</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setTip(Math.max(0, tip - 10))}
                          className="w-7 h-7 rounded-lg bg-background flex items-center justify-center touch-manipulation"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-14 text-center font-medium">₹{tip}</span>
                        <button
                          onClick={() => setTip(tip + 10)}
                          className="w-7 h-7 rounded-lg bg-background flex items-center justify-center touch-manipulation"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Round Off */}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Round Off</span>
                      <span className={cn("font-medium", roundOff < 0 && "text-green-600")}>
                        {roundOff >= 0 ? '+' : ''}₹{roundOff.toFixed(2)}
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border my-2" />

                    {/* Grand Total */}
                    <div className="flex justify-between items-center font-bold">
                      <span>Grand Total</span>
                      <span className="text-lg text-primary">{formatCurrency(grandTotal)}</span>
                    </div>

                    {/* Customer Paid */}
                    <div className="flex justify-between items-center text-sm pt-2">
                      <span className="text-muted-foreground">Customer Paid</span>
                      <input
                        type="number"
                        value={customerPaid || ''}
                        onChange={(e) => setCustomerPaid(Number(e.target.value) || 0)}
                        placeholder="0"
                        className="w-20 text-right border border-border rounded-lg py-1.5 px-2 text-sm bg-background"
                      />
                    </div>

                    {/* Return to Customer */}
                    {returnToCustomer > 0 && (
                      <div className="flex justify-between items-center py-2 bg-green-500/10 px-2 rounded-lg mt-2">
                        <span className="text-green-600 font-medium text-sm">Return</span>
                        <span className="text-green-600 font-bold">{formatCurrency(returnToCustomer)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Collapsed view - just show totals */}
                {!showBillingSummary && (
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(cartSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax ({taxPercent}%)</span>
                      <span>{formatCurrency(calculatedTax)}</span>
                    </div>
                  </div>
                )}
                  
                {/* Complimentary Toggle */}
                <div className="flex items-center justify-between py-2 border-t border-border mb-3">
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
                      className="w-4 h-4 rounded border-border accent-green-500" 
                    />
                    <span className="text-sm font-medium text-foreground">Complimentary</span>
                  </label>
                  {isComplimentary && (
                    <span className="text-xs text-green-600 font-medium">FREE</span>
                  )}
                </div>
                {isComplimentary && complimentaryNote && (
                  <p className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded mb-3">
                    Reason: {complimentaryNote}
                  </p>
                )}

                <button
                  onClick={() => setShowPayment(true)}
                  className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg active:scale-[0.98] transition-transform"
                >
                  Pay {formatCurrency(isComplimentary ? 0 : grandTotal)}
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-center mb-2">Select Payment Method</h3>
                
                {/* Payment Method Grid - 5 columns with More button */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  <button
                    onClick={() => handlePayment('cash')}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all",
                      selectedPaymentMethod === 'cash' 
                        ? "border-success bg-success/10" 
                        : "border-border bg-secondary"
                    )}
                  >
                    <Banknote className="w-5 h-5 text-success" />
                    <span className="text-[10px] font-medium">Cash</span>
                    {selectedPaymentMethod === 'cash' && <Check className="w-3 h-3 text-success" />}
                  </button>
                  <button
                    onClick={() => handlePayment('card')}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all",
                      selectedPaymentMethod === 'card' 
                        ? "border-primary bg-primary/10" 
                        : "border-border bg-secondary"
                    )}
                  >
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span className="text-[10px] font-medium">Card</span>
                    {selectedPaymentMethod === 'card' && <Check className="w-3 h-3 text-primary" />}
                  </button>
                  <button
                    onClick={() => handlePayment('upi')}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all",
                      selectedPaymentMethod === 'upi' 
                        ? "border-purple-500 bg-purple-500/10" 
                        : "border-border bg-secondary"
                    )}
                  >
                    <Smartphone className="w-5 h-5 text-purple-500" />
                    <span className="text-[10px] font-medium">UPI</span>
                    {selectedPaymentMethod === 'upi' && <Check className="w-3 h-3 text-purple-500" />}
                  </button>
                  <button
                    onClick={() => handlePayment('due')}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all",
                      selectedPaymentMethod === 'due' 
                        ? "border-orange-500 bg-orange-500/10" 
                        : "border-border bg-secondary"
                    )}
                  >
                    <Clock className="w-5 h-5 text-orange-500" />
                    <span className="text-[10px] font-medium">Due</span>
                    {selectedPaymentMethod === 'due' && <Check className="w-3 h-3 text-orange-500" />}
                  </button>
                  <button
                    onClick={() => setShowMorePaymentSheet(true)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl border-2 border-border bg-secondary transition-all hover:bg-muted"
                  >
                    <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[10px] font-medium">More</span>
                  </button>
                </div>

                {/* It's Paid Confirmation Popup */}
                  <>
                    {/* Print Button */}
                    <button
                      onClick={handlePrintBill}
                      className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                    >
                      <Printer className="w-5 h-5" />
                      Print Bill
                    </button>

                    <button
                      onClick={() => setShowPayment(false)}
                      className="w-full py-3 text-muted-foreground font-medium mt-2"
                    >
                      Cancel
                    </button>
                  </>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Complimentary Dialog */}
      {showComplimentaryDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 animate-fade-in">
          <div className="bg-card rounded-2xl p-5 w-[90%] max-w-sm shadow-2xl animate-scale-in mx-4">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Complimentary Order</h3>
              <p className="text-xs text-muted-foreground">Provide a reason for this free order</p>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                value={complimentaryNote}
                onChange={(e) => setComplimentaryNote(e.target.value)}
                placeholder="e.g., VIP Guest, Birthday..."
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none text-base"
                autoFocus
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setShowComplimentaryDialog(false);
                  setComplimentaryNote('');
                }}
                className="py-3 rounded-xl bg-secondary text-foreground font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (complimentaryNote.trim()) {
                    setIsComplimentary(true);
                    setShowComplimentaryDialog(false);
                    toast.success('Complimentary enabled', { description: complimentaryNote });
                  } else {
                    toast.error('Please enter a reason');
                  }
                }}
                className="py-3 rounded-xl bg-green-500 text-white font-bold text-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Settings Dialog - Fixed z-index and touch */}
      {showTaxDialog && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTaxDialog(false);
            }
          }}
        >
          <div 
            className="bg-card rounded-2xl p-5 w-[90%] max-w-sm shadow-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Tax Settings</h3>
              <p className="text-xs text-muted-foreground">Adjust tax percentage or amount</p>
            </div>
            
            <div className="space-y-4 mb-4">
              {/* Tax Percentage Presets */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Tax Percentage</label>
                <div className="grid grid-cols-5 gap-2">
                  {[0, 5, 12, 18, 28].map((percent) => (
                    <button
                      key={percent}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTaxPercent(percent);
                        setCustomTax(null);
                      }}
                      className={cn(
                        "py-3 rounded-lg text-sm font-medium transition-all border-2 touch-manipulation",
                        taxPercent === percent && customTax === null
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border"
                      )}
                    >
                      {percent}%
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Custom Tax Amount */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Custom Tax Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <input
                    type="number"
                    value={customTax !== null ? customTax : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomTax(val === '' ? null : (Number(val) || 0));
                    }}
                    placeholder={`Auto: ₹${(cartSubtotal * taxPercent / 100).toFixed(0)}`}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none text-base"
                  />
                </div>
              </div>
              
              {/* No Tax */}
              <button
                onClick={() => {
                  setTaxPercent(0);
                  setCustomTax(0);
                }}
                className="w-full py-2 rounded-lg border border-border text-sm font-medium hover:border-destructive hover:text-destructive transition-colors"
              >
                No Tax (₹0)
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowTaxDialog(false)}
                className="py-2.5 rounded-xl bg-secondary text-foreground font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowTaxDialog(false);
                  toast.success(`Tax: ${formatCurrency(calculatedTax)}`);
                }}
                className="py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* More Payment Options Sheet */}
      <Sheet open={showMorePaymentSheet} onOpenChange={setShowMorePaymentSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh]">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-lg font-bold text-center">More Payment Options</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4 pb-6">
            {/* Payment Options Grid */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handlePayment('cash')}
                className="h-20 rounded-xl border border-border bg-card hover:bg-muted flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <Banknote className="w-6 h-6 text-green-600" />
                <span className="text-sm font-medium">Cash</span>
              </button>
              <button
                onClick={() => handlePayment('card')}
                className="h-20 rounded-xl border border-border bg-card hover:bg-muted flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <CreditCard className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium">Card</span>
              </button>
              <button
                onClick={() => handlePayment('upi')}
                className="h-20 rounded-xl border border-border bg-card hover:bg-muted flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <Smartphone className="w-6 h-6 text-purple-500" />
                <span className="text-sm font-medium">UPI</span>
              </button>
              <button
                onClick={() => handlePayment('due')}
                className="h-20 rounded-xl border border-border bg-card hover:bg-muted flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <Clock className="w-6 h-6 text-orange-500" />
                <span className="text-sm font-medium">Due</span>
              </button>
              <button
                onClick={() => {
                  setShowMorePaymentSheet(false);
                  setShowPartPaymentDialog(true);
                }}
                className="h-20 rounded-xl border border-border bg-card hover:bg-muted flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <Split className="w-6 h-6 text-blue-500" />
                <span className="text-sm font-medium">Part Pay</span>
              </button>
              <button
                onClick={() => {
                  setShowMorePaymentSheet(false);
                  setShowSplitBillDialog(true);
                }}
                className="h-20 rounded-xl border border-border bg-card hover:bg-muted flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <Users className="w-6 h-6 text-indigo-500" />
                <span className="text-sm font-medium">Split Bill</span>
              </button>
              <button
                onClick={() => handlePayment('wallet')}
                className="h-20 rounded-xl border border-border bg-card hover:bg-muted flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <Wallet className="w-6 h-6 text-blue-500" />
                <span className="text-sm font-medium">Wallet</span>
              </button>
              <button
                onClick={() => handlePayment('credit')}
                className="h-20 rounded-xl border border-border bg-card hover:bg-muted flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <Receipt className="w-6 h-6 text-amber-500" />
                <span className="text-sm font-medium">Credit</span>
              </button>
            </div>

            <button
              onClick={() => setShowMorePaymentSheet(false)}
              className="w-full py-3 text-muted-foreground font-medium"
            >
              Cancel
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Part Payment Dialog */}
      <PartPaymentDialog
        open={showPartPaymentDialog}
        onOpenChange={setShowPartPaymentDialog}
        totalAmount={grandTotal}
        onConfirm={handlePartPaymentConfirm}
      />

      {/* Split Bill Dialog */}
      <SplitBillDialog
        open={showSplitBillDialog}
        onOpenChange={setShowSplitBillDialog}
        totalAmount={grandTotal}
        onConfirm={handleSplitBillConfirm}
      />
    </>
  );
};
