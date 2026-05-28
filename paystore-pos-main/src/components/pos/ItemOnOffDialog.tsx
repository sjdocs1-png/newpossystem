import React, { useState } from 'react';
import { usePOS } from '@/contexts/POSContext';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ItemOnOffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ItemOnOffDialog: React.FC<ItemOnOffDialogProps> = ({ open, onOpenChange }) => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            Item On/Off Management
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="online" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="online" className="gap-2">
              Online Products
              <span className="bg-success/20 text-success text-xs px-1.5 py-0.5 rounded-full">
                {onlineProducts.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="offline" className="gap-2">
              Offline Products
              <span className="bg-destructive/20 text-destructive text-xs px-1.5 py-0.5 rounded-full">
                {offlineProducts.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="online" className="flex-1 overflow-auto space-y-2 m-0">
            {filterProducts(onlineProducts).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No online products found
              </div>
            ) : (
              filterProducts(onlineProducts).map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <Switch
                    checked={itemStatuses[item.id]}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="offline" className="flex-1 overflow-auto space-y-2 m-0">
            {filterProducts(offlineProducts).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No offline products found
              </div>
            ) : (
              filterProducts(offlineProducts).map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <Switch
                    checked={itemStatuses[item.id]}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ItemOnOffDialog;
