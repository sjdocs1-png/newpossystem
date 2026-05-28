import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, Store, Plus, Search, 
  LogOut, AlertCircle, CheckCircle, XCircle, Eye, EyeOff,
  Trash2, Ban, ShieldOff, Settings, Crown, UtensilsCrossed, ShoppingBag
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AdminCustomerManagement } from '@/components/admin/AdminCustomerManagement';
import { AdminPlanManagement } from '@/components/admin/AdminPlanManagement';

interface Customer {
  id: string;
  business_name: string;
  owner_name: string;
  owner_email: string;
  phone: string | null;
  subscription_plan: string;
  subscription_start: string;
  subscription_end: string;
  is_active: boolean;
  created_at: string;
  max_stores: number;
  approval_status?: string;
  approved_at?: string;
}

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userRole, logout, isLoading } = useSupabaseAuth();
  const { toast } = useToast();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    business_name: '',
    owner_name: '',
    owner_email: '',
    owner_password: '',
    phone: '',
    subscription_plan: 'monthly',
    subscription_days: 30,
    max_stores: 2,
    business_type: 'restaurant',
    subscription_tier: 'basic',
  });

  useEffect(() => {
    if (!isLoading && (!user || userRole?.role !== 'admin')) {
      navigate('/auth');
    }
  }, [user, userRole, isLoading, navigate]);

  useEffect(() => {
    if (user && userRole?.role === 'admin') {
      fetchCustomers();
    }
  }, [user, userRole]);

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      return;
    }

    setCustomers(data as Customer[]);
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.business_name || !newCustomer.owner_name || !newCustomer.owner_email || !newCustomer.owner_password) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields including password.',
        variant: 'destructive',
      });
      return;
    }

    if (newCustomer.owner_password.length < 6) {
      toast({
        title: 'Invalid Password',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      // Use direct fetch to ensure the access token is passed explicitly to the function.
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        throw new Error('Admin session is missing. Please log in again.');
      }

      console.log('Creating owner with data:', {
        business_name: newCustomer.business_name,
        owner_name: newCustomer.owner_name,
        owner_email: newCustomer.owner_email,
        subscription_tier: newCustomer.subscription_tier,
      });

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-owner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          business_name: newCustomer.business_name,
          owner_name: newCustomer.owner_name,
          owner_email: newCustomer.owner_email,
          owner_password: newCustomer.owner_password,
          phone: newCustomer.phone || null,
          subscription_plan: newCustomer.subscription_plan,
          subscription_days: newCustomer.subscription_days,
          max_stores: newCustomer.max_stores,
          business_type: newCustomer.business_type,
          subscription_tier: newCustomer.subscription_tier,
        }),
      });

      const responseData = await response.json();
      console.log('Raw create-owner response:', response.status, responseData);

      if (!response.ok) {
        const detailedError = responseData?.details ? `${responseData.error}: ${responseData.details}` : responseData?.error || 'Failed to create owner account';
        throw new Error(detailedError);
      }

      if (responseData?.error) {
        const detailedError = responseData.details ? `${responseData.error}: ${responseData.details}` : responseData.error;
        throw new Error(detailedError);
      }

      toast({
        title: 'Owner Account Created!',
        description: `${newCustomer.owner_name} can now login with their email and password.`,
      });

      setShowAddCustomer(false);
      setNewCustomer({
        business_name: '',
        owner_name: '',
        owner_email: '',
        owner_password: '',
        phone: '',
        subscription_plan: 'monthly',
        subscription_days: 30,
        max_stores: 2,
        business_type: 'restaurant',
        subscription_tier: 'basic',
      });
      fetchCustomers();
    } catch (error: any) {
      console.error('Error creating owner:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create owner account',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleCustomerStatus = async (customerId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('customers')
      .update({ is_active: !currentStatus })
      .eq('id', customerId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: currentStatus ? 'Account Disabled' : 'Account Enabled',
      description: currentStatus ? 'Owner access has been disabled.' : 'Owner access has been enabled.',
    });
    fetchCustomers();
  };

  const deleteOwner = async (customerId: string) => {
    try {
      const response = await supabase.functions.invoke('delete-owner', {
        body: { customer_id: customerId }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to delete owner');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: 'Owner Deleted',
        description: 'Owner account and all related data have been deleted.',
      });
      fetchCustomers();
    } catch (error: any) {
      console.error('Error deleting owner:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete owner',
        variant: 'destructive',
      });
    }
  };

  const suspendOwner = async (customerId: string) => {
    const { error } = await supabase
      .from('customers')
      .update({ 
        is_active: false,
        approval_status: 'suspended'
      })
      .eq('id', customerId);

    // Also deactivate user_roles
    await supabase
      .from('user_roles')
      .update({ is_active: false })
      .eq('customer_id', customerId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Account Suspended',
      description: 'Owner account has been suspended. They cannot login anymore.',
      variant: 'destructive',
    });
    fetchCustomers();
  };

  const unsuspendOwner = async (customerId: string) => {
    const { error } = await supabase
      .from('customers')
      .update({ 
        is_active: true,
        approval_status: 'approved'
      })
      .eq('id', customerId);

    // Also reactivate user_roles
    await supabase
      .from('user_roles')
      .update({ is_active: true })
      .eq('customer_id', customerId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Account Restored',
      description: 'Owner account has been restored. They can login again.',
    });
    fetchCustomers();
  };

  const extendSubscription = async (customerId: string, days: number) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const currentEnd = new Date(customer.subscription_end);
    currentEnd.setDate(currentEnd.getDate() + days);

    const { error } = await supabase
      .from('customers')
      .update({ subscription_end: currentEnd.toISOString().split('T')[0] })
      .eq('id', customerId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Subscription Extended',
      description: `Extended by ${days} days.`,
    });
    fetchCustomers();
  };

  const updateMaxStores = async (customerId: string, maxStores: number) => {
    const { error } = await supabase
      .from('customers')
      .update({ max_stores: maxStores })
      .eq('id', customerId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Store Limit Updated',
      description: `Max stores set to ${maxStores}.`,
    });
    fetchCustomers();
  };

  const filteredCustomers = customers.filter(c => 
    (c.approval_status === 'approved' || c.approval_status === 'suspended' || !c.approval_status) && (
      c.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.owner_email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const pendingApprovals = customers.filter(c => c.approval_status === 'pending');
  const activeCustomers = customers.filter(c => c.is_active && c.approval_status !== 'pending').length;
  const expiringCustomers = customers.filter(c => {
    if (c.approval_status === 'pending') return false;
    const daysLeft = differenceInDays(new Date(c.subscription_end), new Date());
    return daysLeft <= 7 && daysLeft > 0;
  }).length;
  const expiredCustomers = customers.filter(c => 
    c.approval_status !== 'pending' && new Date(c.subscription_end) < new Date()
  ).length;

  const approveCustomer = async (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    try {
      const response = await supabase.functions.invoke('approve-owner', {
        body: { 
          customer_id: customerId,
          owner_email: customer.owner_email
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to approve owner');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: 'Owner Approved!',
        description: 'The owner can now login and access their dashboard.',
      });
      fetchCustomers();
    } catch (error: any) {
      console.error('Error approving owner:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve owner',
        variant: 'destructive',
      });
    }
  };

  const rejectCustomer = async (customerId: string) => {
    const { error } = await supabase
      .from('customers')
      .update({ 
        approval_status: 'rejected',
        is_active: false,
      })
      .eq('id', customerId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Request Rejected',
      description: 'The owner request has been rejected.',
    });
    fetchCustomers();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-violet-700 text-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-white/80">Software Management Portal</p>
          </div>
          <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg border-2 border-red-400" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-6">
        {/* Tabs for different sections */}
        <Tabs defaultValue="owners" className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="owners" className="gap-2">
              <Users className="w-4 h-4" />
              Owners
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2">
              <Crown className="w-4 h-4" />
              Plans & Features
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Customer Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="owners" className="mt-6 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Owners</p>
                    <p className="text-2xl font-bold">{customers.length}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold">{activeCustomers}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expiring Soon</p>
                    <p className="text-2xl font-bold">{expiringCustomers}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expired</p>
                    <p className="text-2xl font-bold">{expiredCustomers}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

        {/* Pending Approvals Section */}
        {pendingApprovals.length > 0 && (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <CardTitle className="text-lg text-amber-800 dark:text-amber-400">
                  Pending Approvals ({pendingApprovals.length})
                </CardTitle>
              </div>
              <CardDescription>New owner signup requests awaiting your approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingApprovals.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-4 bg-background rounded-lg border">
                    <div className="space-y-1">
                      <p className="font-medium">{customer.business_name}</p>
                      <p className="text-sm text-muted-foreground">{customer.owner_name} • {customer.owner_email}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="capitalize">{customer.subscription_plan}</Badge>
                        {customer.phone && <span>📞 {customer.phone}</span>}
                        <span>Requested: {format(new Date(customer.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => rejectCustomer(customer.id)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => approveCustomer(customer.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search owners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Owner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Owner Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Step 1: Category Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Step 1: Select Business Category *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewCustomer({...newCustomer, business_type: 'restaurant'})}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        newCustomer.business_type === 'restaurant' 
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' 
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <UtensilsCrossed className={`w-8 h-8 mx-auto mb-2 ${newCustomer.business_type === 'restaurant' ? 'text-orange-600' : 'text-muted-foreground'}`} />
                      <p className="font-medium text-sm">Restaurant</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCustomer({...newCustomer, business_type: 'retail'})}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        newCustomer.business_type === 'retail' 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                          : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      <ShoppingBag className={`w-8 h-8 mx-auto mb-2 ${newCustomer.business_type === 'retail' ? 'text-blue-600' : 'text-muted-foreground'}`} />
                      <p className="font-medium text-sm">Retail Store</p>
                    </button>
                  </div>
                </div>

                {/* Step 2: Plan Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Step 2: Select Plan *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'basic', label: 'Basic', color: 'border-slate-300 bg-slate-50 dark:bg-slate-900', activeColor: 'border-slate-500 ring-2 ring-slate-300' },
                      { value: 'gold', label: 'Gold', color: 'border-amber-200 bg-amber-50 dark:bg-amber-950/20', activeColor: 'border-amber-500 ring-2 ring-amber-300' },
                      { value: 'platinum', label: 'Platinum', color: 'border-violet-200 bg-violet-50 dark:bg-violet-950/20', activeColor: 'border-violet-500 ring-2 ring-violet-300' },
                    ].map(plan => (
                      <button
                        key={plan.value}
                        type="button"
                        onClick={() => setNewCustomer({...newCustomer, subscription_tier: plan.value})}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          newCustomer.subscription_tier === plan.value ? plan.activeColor : plan.color
                        }`}
                      >
                        <Crown className={`w-5 h-5 mx-auto mb-1 ${
                          plan.value === 'gold' ? 'text-amber-500' : plan.value === 'platinum' ? 'text-violet-500' : 'text-muted-foreground'
                        }`} />
                        <p className="font-semibold text-xs">{plan.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Business Name *</Label>
                    <Input
                      value={newCustomer.business_name}
                      onChange={(e) => setNewCustomer({...newCustomer, business_name: e.target.value})}
                      placeholder="Restaurant / Store Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Owner Name *</Label>
                    <Input
                      value={newCustomer.owner_name}
                      onChange={(e) => setNewCustomer({...newCustomer, owner_name: e.target.value})}
                      placeholder="Owner's Full Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Owner Email (Login ID) *</Label>
                    <Input
                      type="email"
                      value={newCustomer.owner_email}
                      onChange={(e) => setNewCustomer({...newCustomer, owner_email: e.target.value})}
                      placeholder="owner@business.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password *</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={newCustomer.owner_password}
                        onChange={(e) => setNewCustomer({...newCustomer, owner_password: e.target.value})}
                        placeholder="Min 6 characters"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Billing Plan</Label>
                      <Select
                        value={newCustomer.subscription_plan}
                        onValueChange={(v) => setNewCustomer({...newCustomer, subscription_plan: v})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Days</Label>
                      <Input
                        type="number"
                        value={newCustomer.subscription_days}
                        onChange={(e) => setNewCustomer({...newCustomer, subscription_days: parseInt(e.target.value) || 30})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Max Stores Allowed</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={newCustomer.max_stores}
                      onChange={(e) => setNewCustomer({...newCustomer, max_stores: parseInt(e.target.value) || 2})}
                    />
                  </div>
                </div>
                <Button onClick={handleAddCustomer} className="w-full" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Owner Account'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Owners</CardTitle>
            <CardDescription>Manage restaurant owners and their subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Business</th>
                    <th className="text-left p-3 font-medium">Owner</th>
                    <th className="text-left p-3 font-medium">Plan</th>
                    <th className="text-left p-3 font-medium">Stores</th>
                    <th className="text-left p-3 font-medium">Expires</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => {
                    const daysLeft = differenceInDays(new Date(customer.subscription_end), new Date());
                    const isExpired = daysLeft < 0;
                    const isExpiring = daysLeft <= 7 && daysLeft > 0;

                    return (
                      <tr key={customer.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{customer.business_name}</p>
                            <p className="text-sm text-muted-foreground">{customer.owner_email}</p>
                          </div>
                        </td>
                        <td className="p-3">{customer.owner_name}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="capitalize">
                            {customer.subscription_plan}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-muted-foreground" />
                            <Select
                              value={String(customer.max_stores)}
                              onValueChange={(v) => updateMaxStores(customer.id, parseInt(v))}
                            >
                              <SelectTrigger className="w-20 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 5, 10, 20, 50].map(n => (
                                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <p>{format(new Date(customer.subscription_end), 'dd MMM yyyy')}</p>
                            <p className={`text-sm ${isExpired ? 'text-destructive' : isExpiring ? 'text-amber-600' : 'text-muted-foreground'}`}>
                              {isExpired ? 'Expired' : `${daysLeft} days left`}
                            </p>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant={customer.approval_status === 'suspended' ? 'destructive' : customer.is_active ? 'default' : 'secondary'}>
                            {customer.approval_status === 'suspended' ? 'Suspended' : customer.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => extendSubscription(customer.id, 30)}
                            >
                              +30 Days
                            </Button>
                            <Button
                              size="sm"
                              variant={customer.is_active ? 'destructive' : 'default'}
                              onClick={() => toggleCustomerStatus(customer.id, customer.is_active)}
                            >
                              {customer.is_active ? 'Disable' : 'Enable'}
                            </Button>
                            {customer.approval_status === 'suspended' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:bg-green-50"
                                onClick={() => unsuspendOwner(customer.id)}
                              >
                                <ShieldOff className="w-4 h-4 mr-1" />
                                Unsuspend
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-amber-600 hover:bg-amber-50"
                                onClick={() => suspendOwner(customer.id)}
                              >
                                <Ban className="w-4 h-4 mr-1" />
                                Suspend
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Owner Account?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete {customer.business_name} ({customer.owner_email}) and all associated data including stores, staff, and menu items. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => deleteOwner(customer.id)}
                                  >
                                    Delete Permanently
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredCustomers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No owners found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="plans" className="mt-6">
            <AdminPlanManagement />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <AdminCustomerManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
