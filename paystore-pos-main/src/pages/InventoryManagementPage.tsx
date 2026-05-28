import React, { useState, useEffect } from 'react';
import { getInventory, setInventory, InventoryItem, generateId } from '@/lib/store';
import { Package, Plus, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const InventoryManagementPage: React.FC = () => {
  const [inventory, setInventoryState] = useState<InventoryItem[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    unit: '',
    minStock: 0,
    costPerUnit: 0
  });

  useEffect(() => {
    setInventoryState(getInventory());
  }, []);

  const lowStockItems = inventory.filter(item => item.quantity <= item.minStock);

  const handleSave = () => {
    if (!formData.name || !formData.unit) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    let updatedInventory;
    if (editItem) {
      updatedInventory = inventory.map(item => 
        item.id === editItem.id 
          ? { ...item, ...formData, lastUpdated: new Date() }
          : item
      );
    } else {
      const newItem: InventoryItem = {
        id: generateId(),
        ...formData,
        lastUpdated: new Date()
      };
      updatedInventory = [...inventory, newItem];
    }

    setInventory(updatedInventory);
    setInventoryState(updatedInventory);
    setShowDialog(false);
    setEditItem(null);
    setFormData({ name: '', quantity: 0, unit: '', minStock: 0, costPerUnit: 0 });
    
    toast({ title: 'Success', description: editItem ? 'Item updated' : 'Item added' });
  };

  const handleDelete = (id: string) => {
    const updatedInventory = inventory.filter(item => item.id !== id);
    setInventory(updatedInventory);
    setInventoryState(updatedInventory);
    toast({ title: 'Deleted', description: 'Item removed from inventory' });
  };

  const openEdit = (item: InventoryItem) => {
    setEditItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      minStock: item.minStock,
      costPerUnit: item.costPerUnit
    });
    setShowDialog(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">Manage your stock items</p>
        </div>
        <Button onClick={() => { setEditItem(null); setShowDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="pos-card p-4 mb-6 bg-warning/5 border-warning/30">
          <div className="flex items-center gap-2 text-warning mb-2">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-semibold">Low Stock Alert</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {lowStockItems.length} item(s) are running low on stock
          </p>
        </div>
      )}

      {/* Inventory Table */}
      <div className="pos-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left p-4 font-medium">Item</th>
              <th className="text-left p-4 font-medium">Quantity</th>
              <th className="text-left p-4 font-medium">Unit</th>
              <th className="text-left p-4 font-medium">Min Stock</th>
              <th className="text-left p-4 font-medium">Cost/Unit</th>
              <th className="text-left p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => (
              <tr key={item.id} className="border-t border-border">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Package className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={cn(
                    'font-semibold',
                    item.quantity <= item.minStock && 'text-destructive'
                  )}>
                    {item.quantity}
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">{item.unit}</td>
                <td className="p-4 text-muted-foreground">{item.minStock}</td>
                <td className="p-4">₹{item.costPerUnit}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {inventory.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No inventory items. Add your first item.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Name *</label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Item name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Quantity</label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Unit *</label>
                <Input
                  value={formData.unit}
                  onChange={e => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="kg, liters, pcs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Min Stock Level</label>
                <Input
                  type="number"
                  value={formData.minStock}
                  onChange={e => setFormData({ ...formData, minStock: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Cost per Unit (₹)</label>
                <Input
                  type="number"
                  value={formData.costPerUnit}
                  onChange={e => setFormData({ ...formData, costPerUnit: Number(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave}>
                {editItem ? 'Update' : 'Add Item'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryManagementPage;
