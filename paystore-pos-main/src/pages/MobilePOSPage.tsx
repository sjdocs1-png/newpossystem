import React, { useMemo, useState } from 'react';
import { usePOS } from '@/contexts/POSContext';
import { formatCurrency } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Search, X, Plus, Minus, Clock, ScanBarcode, Layers, ShoppingCart, Banknote, CreditCard, Smartphone, Scissors, Trash2, PackagePlus, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MobileCart } from '@/components/pos/MobileCart';
import { BarcodeButton } from '@/components/pos/BarcodeButton';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { useSubscription } from '@/hooks/useSubscription';
import { LinkBarcodeDialog } from '@/components/pos/LinkBarcodeDialog';
import { VariationSelectorSheet } from '@/components/pos/VariationSelectorSheet';
import { CustomItemDialog } from '@/components/pos/CustomItemDialog';
import { QRMenuGenerator } from '@/components/pos/QRMenuGenerator';
import { QROrdersPanel } from '@/components/pos/QROrdersPanel';
import { MenuItem, MenuItemVariation } from '@/lib/store';

const MobilePOSPage: React.FC = () => {
  const { menuItems, categories, activeCategory, setActiveCategory, addToCart, cart, updateCartQuantity, clearCart, cartSubtotal, activeStore } = usePOS();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemForVariation, setSelectedItemForVariation] = useState<MenuItem | null>(null);
  const [variationSheetOpen, setVariationSheetOpen] = useState(false);
  const [showInlineCart, setShowInlineCart] = useState(false);
  const [showCustomItemDialog, setShowCustomItemDialog] = useState(false);
  const [showQROrders, setShowQROrders] = useState(false);
  const { canAccess } = useSubscription();

  const { unmatchedCode, clearUnmatchedCode } = useBarcodeScanner();

  const handleItemClick = (item: MenuItem) => {
    if (item.id.startsWith('others-')) {
      setShowCustomItemDialog(true);
      return;
    }

    if (!item.isAvailable) return;
    if (item.variations && item.variations.length > 0) {
      setSelectedItemForVariation(item);
      setVariationSheetOpen(true);
    } else {
      addToCart(item);
    }
  };

  const handleVariationSelect = (item: MenuItem, variation?: MenuItemVariation, quantity: number = 1) => {
    const itemToAdd = variation ? {
      ...item,
      price: variation.price,
      name: `${item.name} (${variation.name})`,
      sku: variation.sku || item.sku,
    } : item;
    for (let i = 0; i < quantity; i++) {
      addToCart(itemToAdd);
    }
  };

  const handleAddCustomItem = (item: MenuItem, quantity: number) => {
    for (let i = 0; i < quantity; i++) {
      addToCart(item);
    }
  };

  const filteredItems = useMemo(() => {
    const baseProducts = menuItems.filter(item => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch = !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nameHindi?.includes(searchQuery);
      return matchesCategory && matchesSearch;
    });

    const othersItem: MenuItem = {
      id: `others-${activeCategory}`,
      name: 'Others',
      price: 0,
      category: activeCategory === 'all' ? 'others' : activeCategory,
      isAvailable: true,
    };

    const products = [othersItem, ...baseProducts];
    console.log('Product List:', products);
    return products;
  }, [menuItems, activeCategory, searchQuery]);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getStockInfo = (item: MenuItem) => {
    const stock = item.stock;
    if (stock === null || stock === undefined) return null;
    if (stock <= 5) return { label: `${stock} left`, isLow: true };
    if (stock <= 20) return { label: `${stock} left`, isLow: false };
    return { label: `${stock} left`, isLow: false };
  };

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-56px)] overflow-x-hidden">
        {/* Search Bar */}
        <div className="p-3 bg-card border-b border-border">
          <div className="flex gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-w-0 pl-12 pr-10 py-3.5 bg-secondary rounded-xl text-base border-0 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded-lg"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {canAccess('qrMenuOrdering') && (
                <>
                  <QRMenuGenerator buttonClassName="h-[52px] w-[52px] rounded-xl flex-shrink-0" />
                  <Button
                    variant="yellow"
                    size="icon"
                    className="h-[52px] w-[52px] rounded-xl flex-shrink-0"
                    onClick={() => setShowQROrders(true)}
                  >
                    <QrCode className="w-5 h-5" />
                  </Button>
                </>
              )}
              {canAccess('barcodeScanner') && activeStore?.businessType !== 'restaurant' && (
                <BarcodeButton
                  size="icon"
                  className="h-[52px] w-[52px] rounded-xl flex-shrink-0"
                />
              )}
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 px-3 py-3 overflow-x-auto no-scrollbar bg-card border-b border-border">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              'px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-2',
              activeCategory === 'all'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            <span>🍽️</span> All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 flex-shrink-0',
                activeCategory === cat.id
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-secondary text-secondary-foreground'
              )}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 p-3 overflow-y-auto" style={{ paddingBottom: cart.length > 0 ? (showInlineCart ? '380px' : '100px') : '16px' }}>
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const stockInfo = getStockInfo(item);
              const isOthers = item.id.startsWith('others-');

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  disabled={!item.isAvailable}
                  className={cn(
                    'bg-card rounded-2xl border border-border text-left transition-all active:scale-[0.97] overflow-hidden',
                    !item.isAvailable && 'opacity-50',
                    isOthers && 'border-2 border-dashed border-primary/30 hover:border-primary'
                  )}
                >
                  {isOthers ? (
                    <div className="flex min-h-[188px] flex-col items-center justify-center gap-2 p-3 text-center">
                      <PackagePlus className="w-10 h-10 text-primary" />
                      <h3 className="font-semibold text-primary text-sm">Others</h3>
                      <p className="text-xs text-muted-foreground">Add custom item</p>
                    </div>
                  ) : (
                    <>
                      {/* Image Area */}
                      <div className="w-full aspect-[4/3] bg-secondary flex items-center justify-center text-4xl relative overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="opacity-50 text-5xl">🍽️</span>
                        )}

                        {/* Low Stock Badge */}
                        {stockInfo?.isLow && (
                          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-1 rounded-md">
                            Low Stock
                          </div>
                        )}

                        {/* Variation indicator */}
                        {item.variations && item.variations.length > 0 && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1.5">
                            <Layers className="w-3 h-3" />
                          </div>
                        )}

                        {/* Add button overlay */}
                        {item.isAvailable && (
                          <div className="absolute bottom-2 right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                            <Plus className="w-5 h-5 text-primary-foreground" />
                          </div>
                        )}

                        {!item.isAvailable && (
                          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                            <span className="text-xs font-medium text-muted-foreground">Unavailable</span>
                          </div>
                        )}
                      </div>

                      {/* Item Info */}
                      <div className="p-3">
                        <h3 className="font-semibold text-foreground text-sm truncate">{item.name}</h3>
                        {item.nameHindi && (
                          <p className="text-xs text-muted-foreground truncate">{item.nameHindi}</p>
                        )}
                        <div className="flex items-center justify-between mt-1.5">
                          {item.variations && item.variations.length > 0 ? (
                            <span className="text-primary font-bold text-base">
                              {formatCurrency(Math.min(item.price || Infinity, ...item.variations.map(v => v.price)))}+
                            </span>
                          ) : (
                            <span className="text-primary font-bold text-base">{formatCurrency(item.price)}</span>
                          )}
                          {stockInfo && (
                            <span className={cn(
                              'text-xs font-medium',
                              stockInfo.isLow ? 'text-destructive' : 'text-muted-foreground'
                            )}>
                              {stockInfo.label}
                            </span>
                          )}
                          {!stockInfo && item.preparationTime && (
                            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {item.preparationTime}m
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <span className="text-6xl mb-4">🔍</span>
              <p>No items found</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-primary font-medium text-sm"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>

        {/* Persistent Bottom Cart Sheet */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl shadow-2xl">
            {/* Drag Handle */}
            <button
              onClick={() => setShowInlineCart(!showInlineCart)}
              className="w-full flex justify-center pt-2 pb-1"
            >
              <div className="w-10 h-1.5 bg-muted-foreground/30 rounded-full" />
            </button>

            {/* Cart Header */}
            <div className="px-4 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground text-lg">Current Order</h3>
                <span className="text-muted-foreground text-sm">({itemCount} items)</span>
              </div>
              <button
                onClick={() => clearCart()}
                className="text-destructive text-sm font-semibold uppercase"
              >
                Clear
              </button>
            </div>

            {/* Expandable Cart Items */}
            {showInlineCart && (
              <div className="px-4 max-h-[200px] overflow-y-auto space-y-3 pb-3 border-t border-border pt-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground text-sm truncate">{item.name}</h4>
                      <p className="text-muted-foreground text-xs">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"
                      >
                        {item.quantity === 1 ? (
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        ) : (
                          <Minus className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Payment Methods + Charge Button */}
            <div className="px-4 pb-4 pt-2 space-y-3">
              {/* Payment Method Icons */}
              <div className="flex gap-2">
                <button className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl bg-secondary/80 border border-border transition-all active:scale-[0.97]">
                  <Banknote className="w-5 h-5 text-success" />
                  <span className="text-[10px] font-medium text-foreground">Cash</span>
                </button>
                <button className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl bg-secondary/80 border border-border transition-all active:scale-[0.97]">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <span className="text-[10px] font-medium text-foreground">Card</span>
                </button>
                <button className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl bg-secondary/80 border border-border transition-all active:scale-[0.97]">
                  <Smartphone className="w-5 h-5 text-info" />
                  <span className="text-[10px] font-medium text-foreground">UPI</span>
                </button>
                <button className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl bg-secondary/80 border border-border transition-all active:scale-[0.97]">
                  <Scissors className="w-5 h-5 text-warning" />
                  <span className="text-[10px] font-medium text-foreground">Split</span>
                </button>
              </div>

              {/* Charge Button */}
              <button
                onClick={() => setShowInlineCart(false)}
                className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-lg active:scale-[0.98] transition-transform flex items-center justify-between px-6 shadow-lg shadow-primary/20"
              >
                <span>Charge</span>
                <span>{formatCurrency(cartSubtotal)}</span>
              </button>
            </div>
          </div>
        )}

        {/* Full Cart Drawer for checkout - opens on Charge click */}
        <MobileCart />
      </div>

      <CustomItemDialog
        open={showCustomItemDialog}
        onOpenChange={setShowCustomItemDialog}
        onAdd={handleAddCustomItem}
        categoryId={activeCategory}
      />

      <VariationSelectorSheet
        item={selectedItemForVariation}
        isOpen={variationSheetOpen}
        onClose={() => {
          setVariationSheetOpen(false);
          setSelectedItemForVariation(null);
        }}
        onSelect={handleVariationSelect}
      />

      <LinkBarcodeDialog scannedCode={unmatchedCode} onClose={clearUnmatchedCode} />

      <Sheet open={showQROrders} onOpenChange={setShowQROrders}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[75vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>QR Menu Orders</SheetTitle>
          </SheetHeader>
          <div className="mt-4 px-4 pb-6">
            <QROrdersPanel />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MobilePOSPage;
