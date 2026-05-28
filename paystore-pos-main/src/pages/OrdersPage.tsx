import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePOS } from '@/contexts/POSContext';
import { useLocale } from '@/contexts/LocaleContext';
import { Order } from '@/lib/store';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, 
  Search, 
  ChevronDown, 
  Eye, 
  Printer, 
  X, 
  LayoutGrid,
  UtensilsCrossed,
  Truck,
  ShoppingBag,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

type OrderTab = 'current' | 'online' | 'advance';
type OrderTypeFilter = 'all' | 'dine-in' | 'delivery' | 'pickup';
type SortOption = 'latest' | 'oldest' | 'amount-high' | 'amount-low';

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { orders, updateOrderPaymentMethod } = usePOS();
  const { t, formatCurrency } = useLocale();
  const [activeTab, setActiveTab] = useState<OrderTab>('current');
  const [orderTypeFilter, setOrderTypeFilter] = useState<OrderTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('latest');

  // Filter orders based on tab, type, and search
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'online' && order.orderType !== 'online') return false;
    if (activeTab === 'advance') return false;
    if (activeTab === 'current' && order.orderType === 'online') return false;

    if (orderTypeFilter === 'dine-in' && order.orderType !== 'dine-in') return false;
    if (orderTypeFilter === 'delivery' && order.orderType !== 'delivery') return false;
    if (orderTypeFilter === 'pickup' && order.orderType !== 'takeaway') return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesId = order.id.toLowerCase().includes(query);
      const matchesBillNo = order.billNumber?.toString().includes(query);
      const matchesCustomer = order.customerName?.toLowerCase().includes(query);
      const matchesPhone = order.customerPhone?.includes(query);
      if (!matchesId && !matchesBillNo && !matchesCustomer && !matchesPhone) return false;
    }

    return true;
  });

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case 'latest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'amount-high':
        return b.total - a.total;
      case 'amount-low':
        return a.total - b.total;
      default:
        return 0;
    }
  });

  const handleView = (orderId: string) => {
    toast.info(`${t('orders.viewOrder')} ${orderId.slice(-6).toUpperCase()}`);
  };

  const handlePrint = (orderId: string) => {
    toast.success(`${t('common.print')} ${orderId.slice(-6).toUpperCase()}`);
  };

  const handleCancel = (orderId: string) => {
    toast.error(`${t('orders.cancelled')} ${orderId.slice(-6).toUpperCase()}`);
  };

  const tabs = [
    { id: 'current', label: t('orders.currentOrder') },
    { id: 'online', label: t('orders.onlineOrder') },
    { id: 'advance', label: t('orders.advanceOrder') },
  ];

  const typeFilters = [
    { id: 'all', label: t('common.all'), icon: LayoutGrid },
    { id: 'dine-in', label: t('pos.dineIn'), icon: UtensilsCrossed },
    { id: 'delivery', label: t('pos.delivery'), icon: Truck },
    { id: 'pickup', label: t('orders.pickup'), icon: ShoppingBag },
  ];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          {/* Tabs */}
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as OrderTab)}
                className={cn(
                  'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'online' && (
            <Button variant="ghost" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        </div>
      </div>

      {/* Current Order Tab Content */}
      {activeTab === 'current' && (
        <>
          {/* Type Filters */}
          <div className="flex items-center gap-2 p-4 border-b border-border">
            <div className="flex gap-2">
              {typeFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setOrderTypeFilter(filter.id as OrderTypeFilter)}
                  className={cn(
                    'flex flex-col items-center gap-1 px-6 py-3 rounded-lg border transition-all min-w-[80px]',
                    orderTypeFilter === filter.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                  )}
                >
                  <filter.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{filter.label}</span>
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <Button variant="outline" className="text-primary border-primary">
              {t('common.getPastOrders')}
            </Button>
          </div>

          {/* Search and Sort */}
          <div className="flex items-center gap-4 p-4 border-b border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Search className="h-4 w-4" />
                  {t('common.search')}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <div className="p-2">
                  <Input
                    placeholder={t('common.search') + '...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('common.sortBy')}</span>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">{t('common.latestDate')}</SelectItem>
                  <SelectItem value="oldest">{t('common.oldestDate')}</SelectItem>
                  <SelectItem value="amount-high">{t('common.amountHigh')}</SelectItem>
                  <SelectItem value="amount-low">{t('common.amountLow')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Legend */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-muted border border-border" />
                <span>{t('common.savedBill')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span>{t('common.printedBill')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span>{t('common.cancelledBill')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-warning" />
                <span>{t('common.paid')}</span>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="flex-1 overflow-auto p-4">
            {sortedOrders.length > 0 ? (
              <div className="rounded-lg border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('common.orderNo')}</TableHead>
                      <TableHead>{t('pos.orderType')}</TableHead>
                      <TableHead>{t('common.customerPhone')}</TableHead>
                      <TableHead>{t('pos.customerName')}</TableHead>
                      <TableHead>{t('common.paymentType')}</TableHead>
                      <TableHead className="text-right">{t('common.myAmount')}</TableHead>
                      <TableHead className="text-right">{t('common.tax')}</TableHead>
                      <TableHead className="text-right">{t('common.discount')}</TableHead>
                      <TableHead className="text-right">{t('common.grandTotal')}</TableHead>
                      <TableHead>{t('common.created')}</TableHead>
                      <TableHead className="text-center">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedOrders.map((order) => (
                      <TableRow key={order.id} className={cn(
                        order.status === 'completed' && 'bg-success/5',
                        order.status === 'cancelled' && 'bg-destructive/5'
                      )}>
                        <TableCell>
                          <span className="text-primary font-medium underline cursor-pointer">
                            {order.billNumber || order.id.slice(-4).toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="capitalize">{order.orderType}</span>
                            {order.tableNumber && (
                              <span className="text-muted-foreground"> ({order.tableNumber})</span>
                            )}
                            <div className="text-xs text-primary font-medium">
                              ({order.orderType === 'dine-in' ? t('pos.dineIn') : order.orderType === 'takeaway' ? t('pos.takeaway') : order.orderType === 'delivery' ? t('pos.delivery') : order.orderType})
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{order.customerPhone || '-'}</TableCell>
                        <TableCell>{order.customerName || '-'}</TableCell>
                        <TableCell>
                          <Select
                            value={order.paymentMethod || 'cash'}
                            onValueChange={(value: Order['paymentMethod']) => updateOrderPaymentMethod(order.id, value)}
                          >
                            <SelectTrigger className="w-[100px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">{t('pos.cash')}</SelectItem>
                              <SelectItem value="card">{t('pos.card')}</SelectItem>
                              <SelectItem value="upi">{t('pos.upi')}</SelectItem>
                              <SelectItem value="split">{t('pos.split')}</SelectItem>
                              <SelectItem value="part">{t('pos.part')}</SelectItem>
                              <SelectItem value="due">{t('pos.due')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(order.subtotal || order.total)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(order.tax || 0)}</TableCell>
                        <TableCell className="text-right">({formatCurrency(order.discount || 0)})</TableCell>
                        <TableCell className="text-right">
                          <span className="text-primary font-medium underline cursor-pointer">
                            {formatCurrency(order.total)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                            <br />
                            <span className="text-muted-foreground">
                              {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleView(order.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handlePrint(order.id)}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleCancel(order.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <div className="w-24 h-24 mb-4 bg-muted rounded-lg flex items-center justify-center">
                  <X className="h-12 w-12 text-muted-foreground/50" />
                </div>
                <p>{t('orders.noOrdersAvailable')}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Online Order Tab Content */}
      {activeTab === 'online' && (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
          <div className="w-32 h-32 mb-4 flex items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 bg-muted rounded-lg" />
              <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-muted-foreground/30 rounded-lg" />
            </div>
          </div>
          <p className="text-center max-w-md">
            {t('orders.onlineIntegration')}
          </p>
        </div>
      )}

      {/* Advance Order Tab Content */}
      {activeTab === 'advance' && (
        <>
          <div className="flex items-center gap-2 p-4 border-b border-border">
            <div className="flex gap-2">
              <button className="flex flex-col items-center gap-1 px-6 py-3 rounded-lg border border-primary bg-primary/10 text-primary min-w-[80px]">
                <LayoutGrid className="h-5 w-5" />
                <span className="text-xs font-medium">{t('common.all')}</span>
              </button>
              <button className="flex flex-col items-center gap-1 px-6 py-3 rounded-lg border border-border bg-card text-muted-foreground hover:border-primary/50 min-w-[80px]">
                <span className="text-lg font-bold">📅</span>
                <span className="text-xs font-medium">{t('common.today')}</span>
              </button>
              <button className="flex flex-col items-center gap-1 px-6 py-3 rounded-lg border border-border bg-card text-muted-foreground hover:border-primary/50 min-w-[80px]">
                <span className="text-lg font-bold">📅</span>
                <span className="text-xs font-medium">{t('common.thisWeek')}</span>
              </button>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-24 h-24 mb-4 bg-muted rounded-lg flex items-center justify-center">
              <X className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <p>{t('orders.noOrdersAvailable')}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default OrdersPage;