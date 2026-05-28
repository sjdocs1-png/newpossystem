import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search,
  Monitor,
  Calculator,
  Link2,
  Printer,
  Users,
  Globe,
  Settings,
  ChevronRight,
  MapPin,
  Languages,
  LayoutGrid,
  CreditCard,
  MessageSquare,
  Bike,
  Clock,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import DisplaySettings from '@/components/pos/DisplaySettings';
import CalculationsSettings from '@/components/pos/CalculationsSettings';
import LinkedServicesSettings from '@/components/pos/LinkedServicesSettings';
import PrintSettings from '@/components/pos/PrintSettings';
import CustomerSettings from '@/components/pos/CustomerSettings';
import OnlineOrderSettings from '@/components/pos/OnlineOrderSettings';
import BillingSystemSettings from '@/components/pos/BillingSystemSettings';
import { StoreLocationSettings } from '@/components/pos/StoreLocationSettings';
import LocaleSettings from '@/components/pos/LocaleSettings';
import CashSettings from '@/components/pos/CashSettings';
import TableSettings from '@/components/pos/TableSettings';
import DuePaymentSettings from '@/components/pos/DuePaymentSettings';
import FeedbackSettings from '@/components/pos/FeedbackSettings';
import DeliveryBoySettings from '@/components/pos/DeliveryBoySettings';
import StaffShiftSettings from '@/components/pos/StaffShiftSettings';
import { useOwnerStore } from '@/hooks/useOwnerStore';

interface SettingItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: () => void;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

type ActiveView = 'main' | 'display' | 'calculations' | 'linkedServices' | 'print' | 'customer' | 'onlineOrder' | 'billingSystem' | 'storeLocation' | 'locale' | 'cash' | 'tables' | 'duePayment' | 'feedback' | 'deliveryBoys' | 'staffShifts';

const OwnerSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const viewParam = searchParams.get('view') as ActiveView | null;
  const [activeView, setActiveView] = useState<ActiveView>(viewParam && viewParam !== 'main' ? viewParam : 'main');
  const { selectedStoreId, selectedStoreName } = useOwnerStore();

  // Update activeView when URL changes
  useEffect(() => {
    const view = searchParams.get('view') as ActiveView | null;
    if (view && view !== activeView) {
      setActiveView(view);
    }
  }, [searchParams]);

  // Update URL when activeView changes
  const handleSetActiveView = (view: ActiveView) => {
    setActiveView(view);
    if (view === 'main') {
      setSearchParams({});
    } else {
      setSearchParams({ view });
    }
  };

  const settingSections: SettingSection[] = [
    {
      title: 'Billing Screen',
      items: [
        {
          id: 'display',
          icon: Monitor,
          title: 'Display',
          description: 'Customise what appears on the billing screen.',
          action: () => handleSetActiveView('display')
        },
        {
          id: 'calculations',
          icon: Calculator,
          title: 'Calculations',
          description: 'Configure service charges and rounding rules.',
          action: () => handleSetActiveView('calculations')
        },
        {
          id: 'linked-services',
          icon: Link2,
          title: 'Linked Services',
          description: 'Set how add-ons services work with your POS system.',
          action: () => handleSetActiveView('linkedServices')
        },
        {
          id: 'print',
          icon: Printer,
          title: 'Print',
          description: 'Manage printing rules for Bill and KOT.',
          action: () => handleSetActiveView('print')
        },
        {
          id: 'customer',
          icon: Users,
          title: 'Customer',
          description: 'Configure phone validation and dues.',
          action: () => handleSetActiveView('customer')
        },
      ]
    },
    {
      title: 'Online/Advance Order',
      items: [
        {
          id: 'online-order-config',
          icon: Globe,
          title: 'Online/Advance Order Configuration',
          description: 'Control auto-accept, timings, and cancellations.',
          action: () => handleSetActiveView('onlineOrder')
        },
      ]
    },
    {
      title: 'System Setting',
      items: [
        {
          id: 'billing-system',
          icon: Settings,
          title: 'Billing System',
          description: 'Set how your POSS updates with the central system.',
          action: () => handleSetActiveView('billingSystem')
        },
      ]
    },
    {
      title: 'Cash Management',
      items: [
        {
          id: 'cash-settings',
          icon: Wallet,
          title: 'Withdrawal & Cash Top-up',
          description: 'Configure cash withdrawal and top-up limits and approvals.',
          action: () => handleSetActiveView('cash')
        },
        {
          id: 'due-payment',
          icon: CreditCard,
          title: 'Due Payment',
          description: 'Configure credit limits, reminders and late fees.',
          action: () => handleSetActiveView('duePayment')
        },
      ]
    },
    {
      title: 'Table Management',
      items: [
        {
          id: 'table-settings',
          icon: LayoutGrid,
          title: 'Table Settings',
          description: 'Configure tables, sections, advance booking and reservations.',
          action: () => handleSetActiveView('tables')
        },
      ]
    },
    {
      title: 'Delivery',
      items: [
        {
          id: 'delivery-boys',
          icon: Bike,
          title: 'Delivery Boys',
          description: 'Manage delivery personnel, tracking and charges.',
          action: () => handleSetActiveView('deliveryBoys')
        },
      ]
    },
    {
      title: 'Customer Experience',
      items: [
        {
          id: 'feedback',
          icon: MessageSquare,
          title: 'Feedback',
          description: 'Configure customer feedback collection and ratings.',
          action: () => handleSetActiveView('feedback')
        },
      ]
    },
    {
      title: 'Store Settings',
      items: [
        {
          id: 'store-location',
          icon: MapPin,
          title: 'Store Location',
          description: 'Set GPS coordinates for staff check-in verification.',
          action: () => handleSetActiveView('storeLocation')
        },
        {
          id: 'staff-shifts',
          icon: Clock,
          title: 'Staff Working Hours',
          description: 'Configure shift timings and biometric settings for staff.',
          action: () => handleSetActiveView('staffShifts')
        },
      ]
    },
    {
      title: 'Language & Region',
      items: [
        {
          id: 'locale',
          icon: Languages,
          title: 'Language & Currency',
          description: 'Set your country, language and currency preferences.',
          action: () => handleSetActiveView('locale')
        },
      ]
    }
  ];

  const filteredSections = settingSections.map(section => ({
    ...section,
    items: section.items.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  if (activeView === 'display') {
    return <DisplaySettings onBack={() => handleSetActiveView('main')} />;
  }

  if (activeView === 'calculations') {
    return <CalculationsSettings onBack={() => handleSetActiveView('main')} />;
  }

  if (activeView === 'linkedServices') {
    return <LinkedServicesSettings onBack={() => handleSetActiveView('main')} />;
  }

  if (activeView === 'print') {
    return <PrintSettings onBack={() => handleSetActiveView('main')} />;
  }

  if (activeView === 'customer') {
    return <CustomerSettings onBack={() => handleSetActiveView('main')} />;
  }

  if (activeView === 'onlineOrder') {
    return <OnlineOrderSettings onBack={() => handleSetActiveView('main')} />;
  }

  if (activeView === 'billingSystem') {
    return <BillingSystemSettings onBack={() => handleSetActiveView('main')} />;
  }

  if (activeView === 'storeLocation') {
    // Get store ID from context or localStorage
    let storeId = selectedStoreId;
    if (!storeId) {
      const storeLogin = localStorage.getItem('store_login');
      if (storeLogin) {
        try {
          const parsed = JSON.parse(storeLogin);
          storeId = parsed.store_id;
        } catch (e) {}
      }
    }

    if (!storeId) {
      return (
        <div className="min-h-screen bg-background">
          <div className="sticky top-0 z-10 bg-background border-b border-border">
            <div className="flex items-center gap-4 p-4">
              <Button variant="ghost" size="icon" onClick={() => handleSetActiveView('main')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold">Store Location</h1>
            </div>
          </div>
          <div className="max-w-2xl mx-auto p-4">
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Store Selected</h3>
              <p className="text-muted-foreground">Please select a store first to configure its location.</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex items-center gap-4 p-4">
            <Button variant="ghost" size="icon" onClick={() => handleSetActiveView('main')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Store Location</h1>
          </div>
        </div>
        <div className="max-w-2xl mx-auto p-4">
          <StoreLocationSettings storeId={storeId} storeName={selectedStoreName} />
        </div>
      </div>
    );
  }

  if (activeView === 'locale') {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <LocaleSettings onBack={() => handleSetActiveView('main')} />
        </div>
      </div>
    );
  }

  if (activeView === 'cash') {
    return <CashSettings onBack={() => handleSetActiveView('main')} />;
  }

  if (activeView === 'tables') {
    return <TableSettings onBack={() => handleSetActiveView('main')} />;
  }

  if (activeView === 'duePayment') {
    return <DuePaymentSettings onBack={() => handleSetActiveView('main')} />;
  }

  if (activeView === 'feedback') {
    return <FeedbackSettings onBack={() => handleSetActiveView('main')} />;
  }

  if (activeView === 'deliveryBoys') {
    return <DeliveryBoySettings onBack={() => handleSetActiveView('main')} />;
  }


  if (activeView === 'staffShifts') {
    // Get store ID and customer ID from context or localStorage
    let storeId = selectedStoreId;
    let customerId = '';
    
    if (!storeId) {
      const storeLogin = localStorage.getItem('store_login');
      if (storeLogin) {
        try {
          const parsed = JSON.parse(storeLogin);
          storeId = parsed.store_id;
          customerId = parsed.customer_id;
        } catch (e) {}
      }
    }

    // Try to get customer ID from owner session
    const ownerSession = localStorage.getItem('owner_session');
    if (ownerSession) {
      try {
        const parsed = JSON.parse(ownerSession);
        customerId = parsed.customer_id || customerId;
      } catch (e) {}
    }

    if (!storeId) {
      return (
        <div className="min-h-screen bg-background">
          <div className="sticky top-0 z-10 bg-background border-b border-border">
            <div className="flex items-center gap-4 p-4">
              <Button variant="ghost" size="icon" onClick={() => handleSetActiveView('main')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold">Staff Working Hours</h1>
            </div>
          </div>
          <div className="max-w-2xl mx-auto p-4">
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Store Selected</h3>
              <p className="text-muted-foreground">Please select a store first to configure staff shifts.</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex items-center gap-4 p-4">
            <Button variant="ghost" size="icon" onClick={() => handleSetActiveView('main')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Staff Working Hours</h1>
              {selectedStoreName && (
                <p className="text-sm text-muted-foreground">{selectedStoreName}</p>
              )}
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto p-4">
          <StaffShiftSettings storeId={storeId} customerId={customerId} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Outlet Settings</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {filteredSections.map((section) => (
          <div key={section.title} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 bg-muted/30 border-b border-border">
              <h2 className="font-semibold text-foreground">{section.title}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="flex items-start gap-4 p-4 text-left hover:bg-muted/50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium text-foreground">{item.title}</h3>
                      <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {filteredSections.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No settings found</h3>
            <p className="text-muted-foreground">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerSettingsPage;