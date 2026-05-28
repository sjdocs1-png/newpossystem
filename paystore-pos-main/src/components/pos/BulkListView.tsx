import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Search,
  Download,
  Upload,
  Plus,
  CheckCircle2,
  Circle,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getInventory, setInventory, InventoryItem, generateId, formatCurrency } from '@/lib/store';
import { formatQuantityDisplay, convertToBaseUnit, getBaseUnit } from '@/lib/inventoryUtils';
import { isTextCorrupted, attemptFixCorruptedText, removeSpecialChars, cleanItemName } from '@/lib/textEncodingUtils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BulkInventoryUpload } from './BulkInventoryUpload';

interface BulkListViewProps {
  onBack: () => void;
}

interface SelectedItems {
  [key: string]: boolean;
}

export const BulkListView: React.FC<BulkListViewProps> = ({ onBack }) => {
  const [inventory, setLocalInventory] = useState<InventoryItem[]>(getInventory());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'cost'>('name');
  const [filterBy, setFilterBy] = useState<'all' | 'lowStock' | 'highValue'>('all');
  const [selectedItems, setSelectedItems] = useState<SelectedItems>({});
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    quantity: '',
    unit: '',
    costPerUnit: ''
  });

  // Check for corrupted names on load
  const corruptedCount = inventory.filter(item => isTextCorrupted(item.name)).length;

  const handleRepairCorruptedNames = () => {
    const repairedInventory = inventory.map(item => ({
      ...item,
      name: isTextCorrupted(item.name) ? cleanItemName(item.name) : item.name
    }));

    setInventory(repairedInventory);
    setLocalInventory(repairedInventory);
    toast.success(`Repaired ${corruptedCount} item name(s)`);
  };

  // Filter and search inventory
  const filteredInventory = useMemo(() => {
    let filtered = inventory;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (filterBy === 'lowStock') {
      filtered = filtered.filter(item => item.quantity <= item.minStock);
    } else if (filterBy === 'highValue') {
      filtered = filtered.filter(item => (item.quantity * item.costPerUnit) > 5000);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'quantity':
          return b.quantity - a.quantity;
        case 'cost':
          return (b.quantity * b.costPerUnit) - (a.quantity * a.costPerUnit);
        default:
          return 0;
      }
    });

    return filtered;
  }, [inventory, searchQuery, sortBy, filterBy]);

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;
  const allSelected = selectedCount === filteredInventory.length && filteredInventory.length > 0;

  const handleSelectAll = () => {
    const newSelected: SelectedItems = {};
    if (!allSelected) {
      filteredInventory.forEach(item => {
        newSelected[item.id] = true;
      });
    }
    setSelectedItems(newSelected);
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleBulkDelete = () => {
    if (selectedCount === 0) {
      toast.error('Select items to delete');
      return;
    }

    const confirmed = window.confirm(
      `Delete ${selectedCount} item(s)? This action cannot be undone.`
    );
    if (!confirmed) return;

    const updatedInventory = inventory.filter(item => !selectedItems[item.id]);
    setInventory(updatedInventory);
    setLocalInventory(updatedInventory);
    setSelectedItems({});
    toast.success(`Deleted ${selectedCount} item(s)`);
  };

  const handleBulkExport = () => {
    if (filteredInventory.length === 0) {
      toast.error('No items to export');
      return;
    }

    const itemsToExport = selectedCount > 0
      ? filteredInventory.filter(item => selectedItems[item.id])
      : filteredInventory;

    // Create CSV content
    const headers = ['Item Name', 'Quantity', 'Unit', 'Min Stock', 'Cost Per Unit', 'Total Value'];
    const rows = itemsToExport.map(item => [
      item.name,
      formatQuantityDisplay(item.quantity, item.unit),
      item.unit,
      item.minStock,
      formatCurrency(item.costPerUnit),
      formatCurrency(item.quantity * item.costPerUnit)
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory_bulk_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${itemsToExport.length} item(s)`);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setEditFormData({
      quantity: item.quantity.toString(),
      unit: item.unit,
      costPerUnit: item.costPerUnit.toString()
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;

    const quantity = parseFloat(editFormData.quantity);
    const costPerUnit = parseFloat(editFormData.costPerUnit);

    if (!quantity || !costPerUnit) {
      toast.error('Please fill all fields');
      return;
    }

    const updatedInventory = inventory.map(item =>
      item.id === editingItem.id
        ? {
            ...item,
            quantity,
            unit: editFormData.unit as string,
            costPerUnit,
            lastUpdated: new Date()
          }
        : item
    );

    setInventory(updatedInventory);
    setLocalInventory(updatedInventory);
    setShowEditDialog(false);
    setEditingItem(null);
    toast.success(`Updated ${editingItem.name}`);
  };

  const handleDeleteItem = (item: InventoryItem) => {
    const confirmed = window.confirm(`Delete ${item.name}?`);
    if (!confirmed) return;

    const updatedInventory = inventory.filter(i => i.id !== item.id);
    setInventory(updatedInventory);
    setLocalInventory(updatedInventory);
    toast.success('Item deleted');
  };

  const totalInventoryValue = filteredInventory.reduce(
    (sum, item) => sum + (item.quantity * item.costPerUnit),
    0
  );

  const lowStockItems = filteredInventory.filter(item => item.quantity <= item.minStock);

  if (showBulkUpload) {
    return (
      <BulkInventoryUpload
        onBack={() => setShowBulkUpload(false)}
        onComplete={() => {
          setShowBulkUpload(false);
          setLocalInventory(getInventory());
          toast.success('Inventory updated');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">📋 Bulk List</h1>
            <p className="text-xs text-muted-foreground">
              {filteredInventory.length} of {inventory.length} items
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowBulkUpload(true)}
            className="gap-1"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 pb-24">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-card border border-border rounded-lg">
            <p className="text-xs text-muted-foreground">Total Items</p>
            <p className="text-lg font-bold">{filteredInventory.length}</p>
          </div>
          <div className="p-3 bg-card border border-border rounded-lg">
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="text-lg font-bold">{formatCurrency(totalInventoryValue)}</p>
          </div>
          {lowStockItems.length > 0 && (
            <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg col-span-2">
              <p className="text-xs text-warning">
                ⚠️ {lowStockItems.length} item(s) low on stock
              </p>
            </div>
          )}
          {corruptedCount > 0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg col-span-2 flex items-center justify-between">
              <p className="text-xs text-destructive">
                ❌ {corruptedCount} item name(s) corrupted
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRepairCorruptedNames}
                className="text-destructive hover:text-destructive h-6"
              >
                Repair
              </Button>
            </div>
          )}
        </div>

        {/* Filters and Search */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFilterBy(filterBy === 'all' ? 'lowStock' : 'all')}
              className={filterBy !== 'all' ? 'bg-primary/10' : ''}
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {/* Filter and Sort Controls */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Filter</Label>
              <Select value={filterBy} onValueChange={(v) => setFilterBy(v as any)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="lowStock">Low Stock</SelectItem>
                  <SelectItem value="highValue">High Value</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Sort By</Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="quantity">Quantity</SelectItem>
                  <SelectItem value="cost">Total Value</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedCount > 0 && (
          <div className="sticky top-24 z-10 bg-card border border-primary/30 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium flex-1">{selectedCount} selected</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkExport}
              className="gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
              className="gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        )}

        {/* Select All Checkbox */}
        {filteredInventory.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <button
              onClick={handleSelectAll}
              className={cn(
                'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                allSelected
                  ? 'bg-primary border-primary'
                  : 'border-muted-foreground'
              )}
            >
              {allSelected && <CheckCircle2 className="w-4 h-4 text-background" />}
            </button>
            <span className="text-sm font-medium">
              {allSelected ? 'Deselect All' : 'Select All'}
            </span>
          </div>
        )}

        {/* Inventory Items List */}
        <div className="space-y-2">
          {filteredInventory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">No items found</p>
              <Button onClick={() => setShowBulkUpload(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Items
              </Button>
            </div>
          ) : (
            filteredInventory.map(item => (
              <div
                key={item.id}
                className={cn(
                  'p-3 bg-card border rounded-lg transition-all',
                  selectedItems[item.id]
                    ? 'border-primary bg-primary/5'
                    : 'border-border/60',
                  item.quantity <= item.minStock && 'border-warning/50'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleSelectItem(item.id)}
                    className={cn(
                      'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5',
                      selectedItems[item.id]
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground'
                    )}
                  >
                    {selectedItems[item.id] && (
                      <CheckCircle2 className="w-4 h-4 text-background" />
                    )}
                  </button>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm truncate">{item.name}</h3>
                      {item.quantity <= item.minStock && (
                        <span className="text-xs px-2 py-0.5 bg-warning/10 text-warning rounded">
                          Low
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-muted-foreground">
                      <div>
                        <p className="text-muted-foreground">Qty:</p>
                        <p className="font-medium text-foreground">
                          {formatQuantityDisplay(item.quantity, item.unit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cost:</p>
                        <p className="font-medium text-foreground">
                          {formatCurrency(item.costPerUnit)} / {item.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Min Stock:</p>
                        <p className="font-medium text-foreground">{item.minStock}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Value:</p>
                        <p className="font-medium text-foreground">
                          {formatCurrency(item.quantity * item.costPerUnit)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditItem(item)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteItem(item)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editingItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm">Quantity</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={editFormData.quantity}
                  onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                  placeholder="0"
                  step="0.01"
                />
                <Select value={editFormData.unit} onValueChange={(v) => setEditFormData({ ...editFormData, unit: v })}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">KG</SelectItem>
                    <SelectItem value="g">GM</SelectItem>
                    <SelectItem value="ltr">LTR</SelectItem>
                    <SelectItem value="ml">ML</SelectItem>
                    <SelectItem value="pcs">PCS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sm">Cost Per Unit (₹)</Label>
              <Input
                type="number"
                value={editFormData.costPerUnit}
                onChange={(e) => setEditFormData({ ...editFormData, costPerUnit: e.target.value })}
                placeholder="0"
                step="0.01"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} className="flex-1">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
