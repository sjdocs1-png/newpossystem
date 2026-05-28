import React, { useState, useMemo } from 'react';
import { BillingHeader } from '@/components/pos/BillingHeader';
import { MenuGrid } from '@/components/pos/MenuGrid';
import { Cart } from '@/components/pos/Cart';
import { SearchBill } from '@/components/pos/SearchBill';
import { MobileCart } from '@/components/pos/MobileCart';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePOS } from '@/contexts/POSContext';
import { formatCurrency, MenuItem } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Search, X, Plus, Clock, Layers, ChevronRight, PackagePlus } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const UNITS = ['pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'packet', 'plate', 'glass', 'bottle'];

const POSPage: React.FC = () => {
  const isMobile = useIsMobile();
  const [showSearchBill, setShowSearchBill] = useState(false);
  const { menuItems, categories, activeCategory, setActiveCategory, addToCart } = usePOS();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [matchingCategories, setMatchingCategories] = useState<string[]>([]);

  // Others quick-add state (mobile)
  const [showOtherForm, setShowOtherForm] = useState(false);
  const [otherName, setOtherName] = useState('');
  const [otherPrice, setOtherPrice] = useState('');
  const [otherQty, setOtherQty] = useState('1');
  const [otherUnit, setOtherUnit] = useState('pcs');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const duplicateProductMap = useMemo(() => {
    const nameMap: Record<string, string[]> = {};
    menuItems.forEach(item => {
      const lowerName = item.name.toLowerCase();
      if (!nameMap[lowerName]) nameMap[lowerName] = [];
      if (!nameMap[lowerName].includes(item.category)) nameMap[lowerName].push(item.category);
    });
    return nameMap;
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nameHindi?.includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategory, searchQuery]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      const lowerSearch = value.toLowerCase();
      const matchingCats: string[] = [];
      menuItems.forEach(item => {
        if (item.name.toLowerCase().includes(lowerSearch) && !matchingCats.includes(item.category)) {
          matchingCats.push(item.category);
        }
      });
      if (matchingCats.length > 1 && activeCategory === 'all') {
        setMatchingCategories(matchingCats);
        setShowCategorySelector(true);
      } else {
        setShowCategorySelector(false);
      }
    } else {
      setShowCategorySelector(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setActiveCategory(categoryId);
    setShowCategorySelector(false);
  };

  const validateOtherForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!otherName.trim()) errors.name = 'Product name is required';
    if (!otherPrice || parseFloat(otherPrice) <= 0) errors.price = 'Price must be greater than 0';
    if (!otherQty || parseFloat(otherQty) <= 0) errors.qty = 'Quantity must be greater than 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddOther = () => {
    if (!validateOtherForm()) return;
    const qty = Math.max(1, Math.floor(parseFloat(otherQty)));
    const customItem: MenuItem = {
      id: `other_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: `${otherName.trim()} (${otherUnit})`,
      price: parseFloat(otherPrice),
      category: activeCategory !== 'all' ? activeCategory : 'Other',
      isAvailable: true,
    };
    for (let i = 0; i < qty; i++) {
      addToCart(customItem);
    }
    toast.success(`${otherName.trim()} x${qty} added to cart`);
    setOtherName('');
    setOtherPrice('');
    setOtherQty('1');
    setOtherUnit('pcs');
    setFormErrors({});
    setShowOtherForm(false);
  };

  const openOtherForm = () => {
    setFormErrors({});
    setOtherName('');
    setOtherPrice('');
    setOtherQty('1');
    setOtherUnit('pcs');
    setShowOtherForm(true);
  };

  const othersDialog = (
    <Dialog open={showOtherForm} onOpenChange={setShowOtherForm}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-primary" />
            Add Custom Item
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="mob-other-name">Product Name <span className="text-destructive">*</span></Label>
            <Input
              id="mob-other-name"
              placeholder="Enter product name"
              value={otherName}
              onChange={(e) => { setOtherName(e.target.value); setFormErrors(prev => ({ ...prev, name: '' })); }}
              autoFocus
            />
            {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mob-other-price">Rate / Price <span className="text-destructive">*</span></Label>
              <Input
                id="mob-other-price"
                type="number"
                placeholder="0.00"
                value={otherPrice}
                onChange={(e) => { setOtherPrice(e.target.value); setFormErrors(prev => ({ ...prev, price: '' })); }}
                min="0"
                step="0.01"
              />
              {formErrors.price && <p className="text-xs text-destructive">{formErrors.price}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mob-other-qty">Quantity <span className="text-destructive">*</span></Label>
              <Input
                id="mob-other-qty"
                type="number"
                placeholder="1"
                value={otherQty}
                onChange={(e) => { setOtherQty(e.target.value); setFormErrors(prev => ({ ...prev, qty: '' })); }}
                min="1"
                step="1"
              />
              {formErrors.qty && <p className="text-xs text-destructive">{formErrors.qty}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Unit</Label>
            <Select value={otherUnit} onValueChange={setOtherUnit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map(u => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" size="lg" onClick={handleAddOther}>
            <Plus className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="flex flex-col">
        <div className="p-3 bg-card border-b border-border sticky top-0 z-30">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 bg-secondary rounded-xl text-base border-0 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setShowCategorySelector(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded-lg"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </div>
          
          {showCategorySelector && matchingCategories.length > 1 && (
            <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-300 mb-2 font-medium">
                "{searchQuery}" found in multiple categories. Select one:
              </p>
              <div className="flex flex-wrap gap-2">
                {matchingCategories.map((catId) => {
                  const cat = categories.find(c => c.id === catId);
                  return (
                    <button
                      key={catId}
                      onClick={() => handleCategorySelect(catId)}
                      className="px-3 py-1.5 bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-100 rounded-full text-xs font-medium flex items-center gap-1"
                    >
                      {cat?.icon || '📦'} {cat?.name || catId}
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 px-3 py-3 overflow-x-auto no-scrollbar bg-card border-b border-border sticky top-[8.5rem] z-20">
          <button
            onClick={() => { setActiveCategory('all'); setShowCategorySelector(false); }}
            className={cn(
              'px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0',
              activeCategory === 'all'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setShowCategorySelector(false); }}
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

        <div className="flex-1 p-3 pb-24 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {/* Others Button - Always first in the mobile grid */}
            <button
              onClick={openOtherForm}
              className="bg-card rounded-2xl border-2 border-dashed border-primary/30 p-3 text-left transition-all active:scale-[0.97] hover:border-primary"
            >
              <div className="w-full aspect-square rounded-xl bg-primary/5 mb-2 flex flex-col items-center justify-center">
                <PackagePlus className="w-8 h-8 text-primary mb-1" />
                <span className="text-[10px] text-primary font-semibold">Custom Item</span>
              </div>
              <h3 className="font-semibold text-primary text-sm leading-tight">+ Others</h3>
              <div className="mt-1.5">
                <span className="text-muted-foreground text-xs">Add manually</span>
              </div>
            </button>

            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => item.isAvailable && addToCart(item)}
                disabled={!item.isAvailable}
                className={cn(
                  'bg-card rounded-2xl border border-border p-3 text-left transition-all active:scale-[0.97]',
                  !item.isAvailable && 'opacity-50'
                )}
              >
                <div className="w-full aspect-square rounded-xl bg-secondary mb-2 flex items-center justify-center text-4xl relative overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="opacity-50">🍽️</span>
                  )}
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
                  {item.variations && item.variations.length > 0 && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Layers className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-foreground text-sm break-words leading-tight">{item.name}</h3>
                {item.nameHindi && (
                  <p className="text-xs text-muted-foreground truncate">{item.nameHindi}</p>
                )}
                {searchQuery && activeCategory === 'all' && (
                  <span className="inline-block mt-1 px-1.5 py-0.5 bg-secondary text-[10px] text-muted-foreground rounded">
                    {item.category}
                  </span>
                )}
                <div className="flex items-center justify-between mt-1.5">
                  {item.variations && item.variations.length > 0 ? (
                    <span className="text-primary font-bold text-xs">
                      {formatCurrency(Math.min(item.price || Infinity, ...item.variations.map(v => v.price)))}+
                    </span>
                  ) : (
                    <span className="text-primary font-bold text-sm">{formatCurrency(item.price)}</span>
                  )}
                  {item.preparationTime && (
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {item.preparationTime}m
                    </span>
                  )}
                </div>
              </button>
            ))}

          </div>

          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <span className="text-6xl mb-4">🔍</span>
              <p>No items found</p>
              {searchQuery && (
                <button 
                  onClick={() => { setSearchQuery(''); setShowCategorySelector(false); }}
                  className="mt-2 text-primary font-medium text-sm"
                >
                  Clear search
                </button>
              )}
              {activeCategory !== 'all' && (
                <button 
                  onClick={() => setActiveCategory('all')}
                  className="mt-2 text-primary font-medium text-sm"
                >
                  Show all categories
                </button>
              )}
            </div>
          )}
        </div>

        <MobileCart />
        {othersDialog}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="h-screen flex flex-col">
      <BillingHeader />
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <MenuGrid />
        </div>
        <div className="w-[300px] flex-shrink-0 max-h-full overflow-hidden">
          <Cart />
        </div>
      </div>
      <SearchBill isOpen={showSearchBill} onClose={() => setShowSearchBill(false)} />
    </div>
  );
};

export default POSPage;
