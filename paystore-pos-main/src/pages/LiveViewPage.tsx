import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePOS } from '@/contexts/POSContext';
import { 
  ArrowLeft, 
  RefreshCw, 
  Eye, 
  FileText, 
  ToggleLeft, 
  ToggleRight,
  ChefHat,
  Truck,
  Package,
  Clock,
  LayoutGrid,
  UtensilsCrossed,
  ShoppingBag,
  Search,
  Volume2,
  VolumeX,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { playOrderSound } from '@/lib/orderSound';

type ViewType = 'orders' | 'kot';
type OrderFilter = 'all' | 'dine-in' | 'delivery' | 'pickup';

export const LiveViewPage: React.FC = () => {
  const navigate = useNavigate();
  const { orders } = usePOS();
  const [activeView, setActiveView] = useState<ViewType>('orders');
  const [viewDetails, setViewDetails] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [orderNoSearch, setOrderNoSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [prevOrderCount, setPrevOrderCount] = useState(orders.length);


  // Auto refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Check for new orders and play sound
  useEffect(() => {
    if (orders.length > prevOrderCount && soundEnabled) {
      playOrderSound();
      toast({
        title: '🔔 New Order!',
        description: `${orders.length - prevOrderCount} new order(s) received`,
      });
    }
    setPrevOrderCount(orders.length);
  }, [orders.length, prevOrderCount, soundEnabled]);

  // Calculate stats
  const foodReadyCount = orders.filter(o => o.status === 'ready').length;
  const dispatchCount = orders.filter(o => o.status === 'completed' && o.orderType === 'delivery').length;
  const deliveryCount = orders.filter(o => o.orderType === 'delivery' && o.status !== 'completed').length;

  // Filter orders based on selected filter
  const filteredOrders = orders.filter(order => {
    if (orderFilter === 'all') return true;
    if (orderFilter === 'dine-in') return order.orderType === 'dine-in';
    if (orderFilter === 'delivery') return order.orderType === 'delivery';
    if (orderFilter === 'pickup') return order.orderType === 'takeaway';
    return true;
  });

  const handleRefresh = useCallback(() => {
    setLastRefresh(new Date());
    toast({ title: 'Refreshed', description: 'Order list updated' });
  }, []);

  const handleMFR = () => {
    if (!orderNoSearch.trim()) {
      toast({ title: 'Enter Order No', description: 'Please enter an order number', variant: 'destructive' });
      return;
    }
    // MFR = Manual Food Ready - marks order as food ready
    toast({ title: 'Food Ready', description: `Order #${orderNoSearch} marked as Food Ready` });
    setOrderNoSearch('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/15 text-warning';
      case 'preparing': return 'bg-info/15 text-info';
      case 'ready': return 'bg-success/15 text-success';
      case 'completed': return 'bg-muted text-muted-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const orderFilters = [
    { id: 'all' as OrderFilter, label: 'All', icon: LayoutGrid },
    { id: 'dine-in' as OrderFilter, label: 'Dine In', icon: UtensilsCrossed },
    { id: 'delivery' as OrderFilter, label: 'Delivery', icon: Truck },
    { id: 'pickup' as OrderFilter, label: 'Pickup', icon: ShoppingBag },
  ];

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-background">
      {/* Sub Header */}
      <div className="bg-card border-b border-border p-3 space-y-3">
        {/* Top Row - Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg">Live View</h1>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
        </div>

        {/* Second Row - View Tabs & Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* View Tabs */}
          <div className="flex gap-2">
            <Button
              variant={activeView === 'orders' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('orders')}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Order View
            </Button>
            <Button
              variant={activeView === 'kot' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('kot')}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              KOT View
            </Button>
          </div>

          {/* View Details Toggle */}
          <Button
            variant={viewDetails ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewDetails(!viewDetails)}
            className="gap-2"
          >
            {viewDetails ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            View Details {viewDetails ? 'ON' : 'OFF'}
          </Button>

          <div className="flex-1" />

          {/* Status Boxes */}
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-success/15 text-success rounded-lg">
              <ChefHat className="w-4 h-4" />
              <span className="text-sm font-medium">Food Ready</span>
              <span className="bg-success text-success-foreground text-xs px-2 py-0.5 rounded-full font-bold">
                {foodReadyCount}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-info/15 text-info rounded-lg">
              <Package className="w-4 h-4" />
              <span className="text-sm font-medium">Dispatch</span>
              <span className="bg-info text-info-foreground text-xs px-2 py-0.5 rounded-full font-bold">
                {dispatchCount}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-warning/15 text-warning rounded-lg">
              <Truck className="w-4 h-4" />
              <span className="text-sm font-medium">Delivery</span>
              <span className="bg-warning text-warning-foreground text-xs px-2 py-0.5 rounded-full font-bold">
                {deliveryCount}
              </span>
            </div>
          </div>

          {/* Sound Toggle */}
          <Button
            variant={soundEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="gap-2"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            Sound {soundEnabled ? 'ON' : 'OFF'}
          </Button>

          {/* Auto Refresh Toggle */}
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", autoRefresh && "animate-spin")} />
            Auto
          </Button>

          {/* Refresh Button */}
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Third Row - Order Type Filters & Order Search */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Order Type Filter Icons */}
          <div className="flex gap-2">
            {orderFilters.map(filter => {
              const IconComponent = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => setOrderFilter(filter.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-xl transition-all min-w-[70px]',
                    orderFilter === filter.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-muted text-secondary-foreground'
                  )}
                >
                  <IconComponent className="w-6 h-6" />
                  <span className="text-xs font-medium">{filter.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1" />

          {/* Order No Search with MFR Button */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Enter Order No"
                value={orderNoSearch}
                onChange={e => setOrderNoSearch(e.target.value)}
                className="pl-10 w-40"
              />
            </div>
            <Button onClick={handleMFR} className="gap-2">
              <ChefHat className="w-4 h-4" />
              MFR
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeView === 'orders' ? (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Active Orders</h2>
            
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No orders found
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map(order => (
                  <div key={order.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold">#{order.id.slice(-6)}</p>
                        <p className="text-xs text-muted-foreground capitalize">{order.orderType}</p>
                      </div>
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', getStatusColor(order.status))}>
                        {order.status}
                      </span>
                    </div>

                    {viewDetails && (
                      <>
                        <div className="border-t border-border pt-3 space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>{item.name} × {item.quantity}</span>
                              <span className="text-muted-foreground">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between font-semibold pt-2 border-t border-border">
                          <span>Total</span>
                          <span className="text-primary">{formatCurrency(order.total)}</span>
                        </div>
                      </>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">KOT View</h2>
            
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No KOTs found
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredOrders.map(order => (
                  <div key={order.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-lg">KOT #{order.id.slice(-4)}</p>
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', getStatusColor(order.status))}>
                        {order.status}
                      </span>
                    </div>

                    <div className="space-y-2 border-t border-border pt-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                            {item.quantity}
                          </span>
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                      <Clock className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleTimeString()}
                      {order.tableNumber && (
                        <>
                          <span>•</span>
                          <span>Table {order.tableNumber}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveViewPage;
