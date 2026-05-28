import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  Check, 
  AlertCircle, 
  Loader2, 
  ArrowLeft,
  Trash2,
  Plus,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
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
import { getInventory, setInventory, InventoryItem, generateId } from '@/lib/store';
import { convertToBaseUnit, getBaseUnit } from '@/lib/inventoryUtils';
import { normalizeText, attemptFixCorruptedText, removeSpecialChars, cleanItemName } from '@/lib/textEncodingUtils';

interface ParsedInventoryItem {
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  costUnit: string;
  minStock: number;
  isNew?: boolean;
}

interface BulkInventoryUploadProps {
  onBack: () => void;
  onComplete?: () => void;
}

const SUPPORTED_FORMATS = [
  { ext: 'csv', icon: FileSpreadsheet, label: 'CSV', mime: 'text/csv' },
  { ext: 'xlsx', icon: FileSpreadsheet, label: 'Excel', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  { ext: 'txt', icon: FileText, label: 'Text', mime: 'text/plain' },
];

const SAMPLE_CSV = `name,quantity,unit,cost_per_unit,cost_unit,min_stock
Rice,50,kg,45,kg,10
Sugar,25,kg,50,kg,5
Cooking Oil,20,ltr,150,ltr,5
Salt,10,kg,25,kg,2
Tomatoes,15,kg,40,kg,5
Onions,20,kg,35,kg,5
Milk,30,ltr,55,ltr,10
Flour,40,kg,40,kg,10`;

export const BulkInventoryUpload: React.FC<BulkInventoryUploadProps> = ({ onBack, onComplete }) => {
  const [step, setStep] = useState<'upload' | 'review' | 'complete'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedInventoryItem[]>([]);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_inventory.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Sample CSV downloaded!');
  };

  const parseCSV = (content: string): ParsedInventoryItem[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      console.log('CSV: Not enough lines', { lineCount: lines.length });
      return [];
    }

    // Parse header - be more flexible with spaces and case
    const headerLine = lines[0];
    console.log('CSV Header line:', headerLine);
    
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase());
    console.log('CSV Headers detected:', headers);

    const items: ParsedInventoryItem[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and comment lines
      if (!line || line.length === 0 || line.startsWith('#')) continue;

      // Parse CSV with support for quoted fields
      const values = parseCSVLine(line);
      if (values.length < 1) continue;

      console.log(`Row ${i}:`, values);

      // Find the correct name column - try multiple variations
      let nameIdx = headers.findIndex(h => 
        h.includes('name') || h.includes('product') || h.includes('item')
      );
      
      // If not found, look for first non-numeric column
      if (nameIdx === -1) {
        nameIdx = values.findIndex((v, idx) => {
          const val = v.trim();
          // Skip if it's just a number or empty
          if (val === '' || !isNaN(parseFloat(val))) return false;
          return true;
        });
      }

      // Fallback to first column if still not found
      if (nameIdx === -1) nameIdx = 0;

      let name = values[nameIdx] || '';
      name = cleanItemName(name);

      // Skip if name is empty or just numbers
      if (!name || name.length === 0 || !isNaN(parseFloat(name))) {
        console.log(`Skipping row ${i}: empty or numeric name`, { raw: values[nameIdx], cleaned: name });
        continue;
      }

      // Find quantity, unit, cost columns with flexibility
      const quantityIdx = findHeaderIndex(headers, values, ['quantity', 'qty', 'amount'], 1);
      const unitIdx = findHeaderIndex(headers, values, ['unit', 'measure', 'size'], 2);
      const costIdx = findHeaderIndex(headers, values, ['cost_per_unit', 'cost', 'price', 'rate'], 3);
      const costUnitIdx = findHeaderIndex(headers, values, ['cost_unit', 'cost_measure'], 4);
      const minStockIdx = findHeaderIndex(headers, values, ['min_stock', 'minimum', 'min'], 5);

      const item: ParsedInventoryItem = {
        name,
        quantity: parseFloat(values[quantityIdx] || '0') || 0,
        unit: (values[unitIdx] || 'kg').trim(),
        costPerUnit: parseFloat(values[costIdx] || '0') || 0,
        costUnit: (values[costUnitIdx] || 'kg').trim(),
        minStock: parseFloat(values[minStockIdx] || '10') || 10,
        isNew: true
      };

      console.log(`Parsed item ${items.length + 1}:`, item);
      items.push(item);
    }

    console.log(`CSV parsing complete: ${items.length} items parsed`);
    return items;
  };

  // Helper to find header index flexibly
  const findHeaderIndex = (
    headers: string[], 
    values: string[], 
    possibleNames: string[], 
    defaultIdx: number
  ): number => {
    // Try to find by header name
    for (const name of possibleNames) {
      const idx = headers.findIndex(h => h.includes(name));
      if (idx !== -1 && idx < values.length) return idx;
    }
    // Fallback to position-based if we have enough columns
    return Math.min(defaultIdx, values.length - 1);
  };

  // Helper to parse CSV line properly (handles quoted fields)
  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  // Parse Excel-like TSV or Excel copy-paste format
  const parseExcel = (content: string): ParsedInventoryItem[] => {
    // Handle both tab-separated and comma-separated formats
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      console.log('Excel: Not enough lines', { lineCount: lines.length });
      return [];
    }

    // Detect if it's tab-separated or comma-separated
    const firstLine = lines[0];
    const isTSV = firstLine.includes('\t');
    const delimiter = isTSV ? '\t' : ',';

    console.log('Excel Format:', isTSV ? 'TSV' : 'CSV', { firstLine });

    const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase());
    console.log('Excel Headers detected:', headers);

    const items: ParsedInventoryItem[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) continue;

      const values = line.split(delimiter).map(v => v.trim());
      if (values.length < 1) continue;

      console.log(`Excel Row ${i}:`, values);

      // Find the correct name column
      let nameIdx = headers.findIndex(h => 
        h.includes('name') || h.includes('product') || h.includes('item')
      );
      
      // If not found, look for first non-numeric column
      if (nameIdx === -1) {
        nameIdx = values.findIndex((v, idx) => {
          const val = v.trim();
          if (val === '' || !isNaN(parseFloat(val))) return false;
          return true;
        });
      }

      if (nameIdx === -1) nameIdx = 0;

      let name = values[nameIdx] || '';
      name = cleanItemName(name);

      if (!name || name.length === 0 || !isNaN(parseFloat(name))) {
        console.log(`Skipping Excel row ${i}: empty or numeric name`);
        continue;
      }

      const quantityIdx = findHeaderIndex(headers, values, ['quantity', 'qty', 'amount'], 1);
      const unitIdx = findHeaderIndex(headers, values, ['unit', 'measure', 'size'], 2);
      const costIdx = findHeaderIndex(headers, values, ['cost_per_unit', 'cost', 'price', 'rate'], 3);
      const costUnitIdx = findHeaderIndex(headers, values, ['cost_unit', 'cost_measure'], 4);
      const minStockIdx = findHeaderIndex(headers, values, ['min_stock', 'minimum', 'min'], 5);

      const item: ParsedInventoryItem = {
        name,
        quantity: parseFloat(values[quantityIdx] || '0') || 0,
        unit: (values[unitIdx] || 'kg').trim(),
        costPerUnit: parseFloat(values[costIdx] || '0') || 0,
        costUnit: (values[costUnitIdx] || 'kg').trim(),
        minStock: parseFloat(values[minStockIdx] || '10') || 10,
        isNew: true
      };

      console.log(`Parsed Excel item ${items.length + 1}:`, item);
      items.push(item);
    }

    console.log(`Excel parsing complete: ${items.length} items parsed`);
    return items;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    try {
      // Read file with proper UTF-8 encoding
      const arrayBuffer = await file.arrayBuffer();
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const text = decoder.decode(arrayBuffer);

      // Detect file type and parse accordingly
      const fileExt = file.name.toLowerCase().split('.').pop();
      let items: ParsedInventoryItem[] = [];

      if (fileExt === 'xlsx') {
        // For Excel files, parse as TSV/Excel format (tab-separated)
        items = parseExcel(text);
      } else {
        // For CSV and TXT files, use CSV parser
        items = parseCSV(text);
      }

      if (items.length === 0) {
        toast.error('No valid items found in file. Please check the format.');
        console.error('Parse result: 0 items', { fileName: file.name, fileExt, textLength: text.length });
        setIsProcessing(false);
        return;
      }

      console.log(`Successfully parsed ${items.length} items from ${file.name}`);

      // Check existing inventory for duplicates
      const existingInventory = getInventory();
      const itemsWithStatus = items.map(item => ({
        ...item,
        isNew: !existingInventory.some(
          inv => inv.name.toLowerCase() === item.name.toLowerCase()
        )
      }));

      setParsedItems(itemsWithStatus);
      setStep('review');
      toast.success(`Found ${items.length} items in file`);
    } catch (error) {
      console.error('Parse error:', error);
      toast.error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateItem = (index: number, field: keyof ParsedInventoryItem, value: string | number) => {
    setParsedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (index: number) => {
    setParsedItems(prev => prev.filter((_, i) => i !== index));
  };

  const addEmptyItem = () => {
    setParsedItems(prev => [...prev, {
      name: '',
      quantity: 0,
      unit: 'kg',
      costPerUnit: 0,
      costUnit: 'kg',
      minStock: 10,
      isNew: true
    }]);
  };

  const handleImport = () => {
    const validItems = parsedItems.filter(item => item.name.trim() !== '');
    
    if (validItems.length === 0) {
      toast.error('No valid items to import');
      return;
    }

    const existingInventory = getInventory();
    let addedCount = 0;
    let updatedCount = 0;

    validItems.forEach(item => {
      const quantityInBase = convertToBaseUnit(item.quantity, item.unit);
      const baseUnit = getBaseUnit(item.unit);
      const minStockInBase = convertToBaseUnit(item.minStock, item.unit);

      const existingItem = existingInventory.find(
        inv => inv.name.toLowerCase() === item.name.toLowerCase()
      );

      if (existingItem) {
        // Update existing item - add quantity
        existingItem.quantity += quantityInBase;
        existingItem.costPerUnit = item.costPerUnit;
        existingItem.costUnit = item.costUnit;
        existingItem.lastUpdated = new Date();
        updatedCount++;
      } else {
        // Add new item
        const newItem: InventoryItem = {
          id: generateId(),
          name: item.name,
          quantity: quantityInBase,
          unit: baseUnit,
          costPerUnit: item.costPerUnit,
          costUnit: item.costUnit,
          minStock: minStockInBase,
          lastUpdated: new Date()
        };
        existingInventory.push(newItem);
        addedCount++;
      }
    });

    setInventory(existingInventory);
    setStep('complete');
    toast.success(`Imported ${addedCount} new items, updated ${updatedCount} existing items`);
    
    if (onComplete) {
      setTimeout(onComplete, 1500);
    }
  };

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold">Import Complete!</h2>
          <p className="text-muted-foreground">Inventory items have been imported successfully.</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Inventory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-foreground">Bulk Inventory Upload</h1>
          </div>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {step === 'upload' && (
          <div className="space-y-6">
            {/* Supported Formats */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold mb-3">Supported Formats</h3>
              <div className="flex flex-wrap gap-3">
                {SUPPORTED_FORMATS.map((format) => (
                  <div key={format.ext} className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
                    <format.icon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{format.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample Download */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold mb-2">Download Sample Template</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Download a sample CSV file to see the expected format for inventory data.
              </p>
              <Button variant="outline" onClick={downloadSampleCSV}>
                <Download className="w-4 h-4 mr-2" />
                Download Sample CSV
              </Button>
            </div>

            {/* CSV Format Guide */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold mb-2">CSV Format</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Your CSV should have these columns (in order):
              </p>
              <div className="bg-muted/50 rounded-lg p-3 font-mono text-sm overflow-x-auto">
                <p className="text-primary">name, quantity, unit, cost_per_unit, cost_unit, min_stock</p>
                <p className="text-muted-foreground mt-1">Rice, 50, kg, 45, kg, 10</p>
                <p className="text-muted-foreground">Sugar, 25, kg, 50, kg, 5</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Units: kg, g, ltr, ml, pcs
              </p>
            </div>

            {/* Upload Area */}
            <div 
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                isProcessing ? "border-primary bg-primary/5" : "border-border hover:border-primary hover:bg-primary/5"
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
              
              {isProcessing ? (
                <div className="space-y-3">
                  <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
                  <p className="text-muted-foreground">Processing {fileName}...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">Click to upload or drag and drop</p>
                    <p className="text-sm text-muted-foreground">CSV, Excel, or Text files</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Review Items ({parsedItems.length})</h2>
                <p className="text-sm text-muted-foreground">
                  Review and edit items before importing
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addEmptyItem}>
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>

            {/* Items Table */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Name</th>
                      <th className="text-left p-3 text-sm font-medium">Qty</th>
                      <th className="text-left p-3 text-sm font-medium">Unit</th>
                      <th className="text-left p-3 text-sm font-medium">Cost/Unit</th>
                      <th className="text-left p-3 text-sm font-medium">Min Stock</th>
                      <th className="text-left p-3 text-sm font-medium">Status</th>
                      <th className="text-left p-3 text-sm font-medium w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedItems.map((item, index) => (
                      <tr key={index} className="border-t border-border">
                        <td className="p-2">
                          <Input
                            value={item.name}
                            onChange={(e) => updateItem(index, 'name', e.target.value)}
                            className="h-9"
                            placeholder="Item name"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="h-9 w-20"
                          />
                        </td>
                        <td className="p-2">
                          <Select value={item.unit} onValueChange={(v) => updateItem(index, 'unit', v)}>
                            <SelectTrigger className="h-9 w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kg">KG</SelectItem>
                              <SelectItem value="g">G</SelectItem>
                              <SelectItem value="ltr">LTR</SelectItem>
                              <SelectItem value="ml">ML</SelectItem>
                              <SelectItem value="pcs">PCS</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={item.costPerUnit}
                            onChange={(e) => updateItem(index, 'costPerUnit', parseFloat(e.target.value) || 0)}
                            className="h-9 w-24"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={item.minStock}
                            onChange={(e) => updateItem(index, 'minStock', parseFloat(e.target.value) || 0)}
                            className="h-9 w-20"
                          />
                        </td>
                        <td className="p-2">
                          {item.isNew ? (
                            <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">New</span>
                          ) : (
                            <span className="px-2 py-1 bg-warning/10 text-warning text-xs rounded-full">Update</span>
                          )}
                        </td>
                        <td className="p-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={parsedItems.length === 0}>
                <Check className="w-4 h-4 mr-2" />
                Import {parsedItems.length} Items
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
