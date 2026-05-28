import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePOS } from '@/contexts/POSContext';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

const ItemOnOffPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { menuItems } = usePOS();
  const [searchQuery, setSearchQuery] = useState('');
  const [itemStatuses, setItemStatuses] = useState<Record<string, boolean>>(() => {
    const statuses: Record<string, boolean> = {};
    menuItems.forEach(item => {
      statuses[item.id] = item.isAvailable;
    });
    return statuses;
  });

  const toggleItem = (itemId: string) => {
    setItemStatuses(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const onlineProducts = menuItems.filter(item => itemStatuses[item.id]);
  const offlineProducts = menuItems.filter(item => !itemStatuses[item.id]);

  const filterProducts = (products: typeof menuItems) => {
    return products.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="flex flex-col">
      {/* Page Header with Back Button */}
      <div className="bg-card border-b border-border p-4 flex items-center gap-3 sticky top-0 z-30">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-bold text-lg">Item On/Off Management</h1>
      </div>

      {/* Search */}
      <div className="p-4 bg-card border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-base"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        <Tabs defaultValue="online" className="h-full flex flex-col">
          <TabsList className="grid grid-cols-2 mb-4 h-12">
            <TabsTrigger value="online" className="gap-2 text-base">
              Online Products
              <span className="bg-success/20 text-success text-xs px-2 py-0.5 rounded-full">
                {onlineProducts.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="offline" className="gap-2 text-base">
              Offline Products
              <span className="bg-destructive/20 text-destructive text-xs px-2 py-0.5 rounded-full">
                {offlineProducts.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="online" className="flex-1 overflow-auto space-y-3 m-0">
            {filterProducts(onlineProducts).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <span className="text-4xl block mb-3">📦</span>
                No online products found
              </div>
            ) : (
              filterProducts(onlineProducts).map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-card border border-border rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                  </div>
                  <Switch
                    checked={itemStatuses[item.id]}
                    onCheckedChange={() => toggleItem(item.id)}
                    className="ml-4"
                  />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="offline" className="flex-1 overflow-auto space-y-3 m-0">
            {filterProducts(offlineProducts).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <span className="text-4xl block mb-3">✅</span>
                No offline products found
              </div>
            ) : (
              filterProducts(offlineProducts).map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-card border border-border rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                  </div>
                  <Switch
                    checked={itemStatuses[item.id]}
                    onCheckedChange={() => toggleItem(item.id)}
                    className="ml-4"
                  />
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ItemOnOffPage;
