import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { usePOS } from '@/contexts/POSContext';
import { 
  Store, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  X,
  MapPin,
  Phone,
  Shield,
  Crown,
  Building,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  Printer,
  FileText,
  RefreshCw,
  Camera,
  Clock,
  Calendar,
  Fingerprint
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { invokeFunctionWithResponseFallback } from '@/lib/invokeFunctionWithResponseFallback';
import { SettingsPage as POSSettingsPanel } from '@/components/pos/POSSettingsPanel';
import { KOTSettings } from '@/components/pos/KOTSettings';
import { SalesResetSettings } from '@/components/pos/SalesResetSettings';
import FaceCaptureDialog from '@/components/pos/FaceCaptureDialog';
import { useStoreSettings } from '@/hooks/useStoreSettings';

interface StoreData {
  id: string;
  store_name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  store_code: string | null;
}

interface StaffData {
  id: string;
  user_id: string;
  role: string;
  store_id: string | null;
  is_active: boolean;
  email?: string;
  full_name?: string;
  staff_code: string | null;
}

interface CreateStaffResponse {
  success?: boolean;
  error?: string;
  staff_code?: string;
  password?: string;
  pin?: string;
}

type SettingsSection = 'stores' | 'printer' | 'kot' | 'sales-reset';

const settingsSections = [
  { id: 'stores' as const, label: 'Stores & Staff', icon: Building },
  { id: 'printer' as const, label: 'Printer & Bill', icon: Printer },
  { id: 'kot' as const, label: 'KOT Settings', icon: FileText },
  { id: 'sales-reset' as const, label: 'Sales Reset', icon: RefreshCw },
];

export const StoreStaffSettings: React.FC = () => {
  const { userRole, customer, isOwner, isAdmin, hasRole } = useSupabaseAuth();
  const { isStoreLogin, activeStore } = usePOS();
  
  const [activeSection, setActiveSection] = useState<SettingsSection>('stores');
  const [stores, setStores] = useState<StoreData[]>([]);
  const [staff, setStaff] = useState<StaffData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);
  const deletingRef = useRef<Set<string>>(new Set());
  
  // Dialogs
  const [showAddStore, setShowAddStore] = useState(false);
  const [showEditStore, setShowEditStore] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreData | null>(null);
  const [showStorePassword, setShowStorePassword] = useState(false);
  
  // Form states
  const [newStore, setNewStore] = useState({ name: '', email: '', address: '', phone: '', password: '' });
  const [editStore, setEditStore] = useState({ name: '', address: '', phone: '', password: '' });
  const [newStaff, setNewStaff] = useState({ 
    name: '', 
    email: '',
    role: 'staff' as 'store_manager' | 'staff',
    storeId: '',
    password: '',
    workStartTime: '09:00',
    workEndTime: '18:00',
    fingerprintEnabled: false,
    salary: '',
    shiftSchedule: {
      monday: { start: '09:00', end: '18:00', enabled: true },
      tuesday: { start: '09:00', end: '18:00', enabled: true },
      wednesday: { start: '09:00', end: '18:00', enabled: true },
      thursday: { start: '09:00', end: '18:00', enabled: true },
      friday: { start: '09:00', end: '18:00', enabled: true },
      saturday: { start: '09:00', end: '18:00', enabled: false },
      sunday: { start: '09:00', end: '18:00', enabled: false }
    }
  });
  const [createdStaffCredentials, setCreatedStaffCredentials] = useState<{staffCode: string, password: string} | null>(null);
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  
  // Face capture states
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [facePhotoBlob, setFacePhotoBlob] = useState<Blob | null>(null);
  const [facePhotoPreview, setFacePhotoPreview] = useState<string | null>(null);
  const [isUploadingFace, setIsUploadingFace] = useState(false);
  const { getSetting, saveSetting, isLoaded } = useStoreSettings();

  const canManageSettings = isOwner() || isAdmin();
  const isStoreManager = hasRole(['store_manager']);
  const isStaffOnly = hasRole(['staff']) && !isStoreManager && !canManageSettings;
  const isStoreLoginMode = isStoreLogin && activeStore;
  const canManageStaff = canManageSettings || isStoreManager || isStoreLoginMode;

  useEffect(() => {
    if (userRole?.customer_id || isAdmin() || isStoreLoginMode) {
      fetchStores();
      fetchStaff();
    }
  }, [userRole, isStoreLoginMode]);

  const fetchStores = async () => {
    try {
      let query = supabase.from('stores').select('id, customer_id, store_name, address, phone, store_code, latitude, longitude, is_active, created_at, updated_at');
      
      if (isStoreLoginMode && activeStore?.id) {
        query = query.eq('id', activeStore.id);
      } else if (!isAdmin() && userRole?.customer_id) {
        query = query.eq('customer_id', userRole.customer_id);
        if (isStoreManager && userRole?.store_id) {
          query = query.eq('id', userRole.store_id);
        }
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast.error('Failed to load stores');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      if (isStoreLoginMode && activeStore?.id) {
        const storeCode = (() => { try { const d = localStorage.getItem('pos_active_store_data'); return d ? JSON.parse(d)?.storeCode : null; } catch { return null; } })();
        try {
          const resp = await invokeFunctionWithResponseFallback<{ staff?: StaffData[] }>('get-store-staff', { store_id: activeStore.id, store_code: storeCode });
          if (resp?.staff) setStaff(resp.staff);
        } catch (err) {
          console.error('get-store-staff failed:', err);
        }
        return;
      }
      
      let query = supabase.from('user_roles').select('*').in('role', ['store_manager', 'staff']);
      
      if (!isAdmin() && userRole?.customer_id) {
        query = query.eq('customer_id', userRole.customer_id);
        if (isStoreManager && userRole?.store_id) {
          query = query.eq('store_id', userRole.store_id);
        }
      }
      
      const { data: rolesData, error: rolesError } = await query;
      if (rolesError) throw rolesError;

      const staffList: StaffData[] = [];
      for (const role of (rolesData || [])) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', role.user_id)
          .maybeSingle();
        
        staffList.push({
          ...role,
          email: profileData?.email || `Staff ${role.staff_code}`,
          full_name: profileData?.full_name || `Staff Member`,
          staff_code: role.staff_code
        });
      }
      setStaff(staffList);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleAddStore = async () => {
    if (!newStore.name) {
      toast.error('Store name is required');
      return;
    }
    if (!newStore.email.trim()) {
      toast.error('Store email is required');
      return;
    }
    if (!newStore.password || newStore.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    const maxStores = customer?.max_stores || 2;
    if (stores.length >= maxStores) {
      toast.error(`Your plan allows maximum ${maxStores} stores.`);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-store', {
        body: {
          customer_id: userRole?.customer_id,
          store_name: newStore.name,
          email: newStore.email.trim().toLowerCase(),
          address: newStore.address || null,
          phone: newStore.phone || null,
          password: newStore.password,
        }
      });
      if (error || data?.error || !data?.success) throw new Error(data?.error || error?.message || 'Failed to add store');
      
      toast.success('Store added successfully!');
      setNewStore({ name: '', email: '', address: '', phone: '', password: '' });
      setShowAddStore(false);
      fetchStores();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add store');
    }
  };

  const handleUpdateStore = async () => {
    if (!editingStore || !editStore.name) {
      toast.error('Store name is required');
      return;
    }

    try {
      const updateData: Record<string, any> = {
        store_name: editStore.name,
        address: editStore.address || null,
        phone: editStore.phone || null
      };
      if (editStore.password && editStore.password.length >= 6) {
        updateData.password = editStore.password;
      }
      
      const { error } = await supabase.from('stores').update(updateData).eq('id', editingStore.id);
      if (error) throw error;
      
      toast.success('Store updated!');
      setShowEditStore(false);
      setEditingStore(null);
      fetchStores();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update store');
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!confirm('Are you sure you want to delete this store?')) return;

    try {
      const { error } = await supabase.from('stores').delete().eq('id', storeId);
      if (error) throw error;
      
      toast.success('Store deleted');
      fetchStores();
      fetchStaff();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete store');
    }
  };

  const openEditDialog = (store: StoreData) => {
    setEditingStore(store);
    setEditStore({
      name: store.store_name,
      address: store.address || '',
      phone: store.phone || '',
      password: ''
    });
    setShowEditStore(true);
  };

  // Face capture handlers
  const handleFaceCapture = useCallback((blob: Blob) => {
    setFacePhotoBlob(blob);
    const previewUrl = URL.createObjectURL(blob);
    setFacePhotoPreview(previewUrl);
    setShowFaceCapture(false);
  }, []);

  const getFaceUploadFileName = (storeId: string, fileExtension: string) => {
    return `staff/${storeId}/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;
  };

  const uploadFacePhoto = async (file: File | Blob, storeId: string): Promise<string | null> => {
    if (!storeId) {
      console.error('uploadFacePhoto: missing storeId');
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('uploadFacePhoto: no authenticated session');
      return null;
    }

    const fileExtension = file instanceof File
      ? file.name.split('.').pop() || 'jpeg'
      : 'jpeg';
    const fileName = getFaceUploadFileName(storeId, fileExtension);
    const contentType = file.type || `image/${fileExtension}`;
    console.log('Uploading staff face photo', { fileName, storeId, userId: session.user?.id });

    const { data, error } = await supabase.storage
      .from('staff-faces')
      .upload(fileName, file, {
        contentType,
        upsert: true
      });
    
    if (error) {
      console.error('Face upload error:', error, data, { fileName, storeId });
      return null;
    }
    
    console.log('Face upload path:', fileName, 'storeId:', storeId);
    const { data: publicUrl } = supabase.storage
      .from('staff-faces')
      .getPublicUrl(fileName);
    
    return publicUrl?.publicUrl || null;
  };

  const handleAddStaff = async () => {
    const storeIdToUse = isStoreLoginMode ? activeStore?.id : newStaff.storeId;
    const customerIdToUse = isStoreLoginMode ? activeStore?.customer_id : userRole?.customer_id;
    
    if (!newStaff.name || !newStaff.email.trim() || !storeIdToUse) {
      toast.error('Name, email and store are required');
      return;
    }
    if (!facePhotoBlob) {
      toast.error('Face photo is required for staff registration');
      return;
    }
    if (newStaff.password && newStaff.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Authentication expired. Please login again.');
      return;
    }

    setIsUploadingFace(true);
    try {
      // Upload face photo first
        const faceUrl = await uploadFacePhoto(facePhotoBlob, storeIdToUse);

      const requestBody: Record<string, any> = {
        name: newStaff.name,
        email: newStaff.email.trim().toLowerCase(),
        role: newStaff.role,
        store_id: storeIdToUse,
        customer_id: customerIdToUse,
        face_photo_url: faceUrl,
        work_start_time: newStaff.workStartTime + ':00',
        work_end_time: newStaff.workEndTime + ':00',
        fingerprint_enabled: newStaff.fingerprintEnabled,
        salary: newStaff.salary ? Number(newStaff.salary) : 0
      };
      if (newStaff.password) requestBody.password = newStaff.password;
      if (isStoreLoginMode && activeStore?.id) requestBody.store_login_id = activeStore.id;
      
      const response = await invokeFunctionWithResponseFallback<CreateStaffResponse>('create-staff', requestBody);
      
      setCreatedStaffCredentials({
        staffCode: response.staff_code || '',
        password: response.password || ''
      });
      
      toast.success(`Staff account created for ${newStaff.name}!`);
      setNewStaff({ 
        name: '', email: '', role: 'staff', storeId: '', password: '', 
        workStartTime: '09:00', workEndTime: '18:00', fingerprintEnabled: false,
        salary: '',
        shiftSchedule: {
          monday: { start: '09:00', end: '18:00', enabled: true },
          tuesday: { start: '09:00', end: '18:00', enabled: true },
          wednesday: { start: '09:00', end: '18:00', enabled: true },
          thursday: { start: '09:00', end: '18:00', enabled: true },
          friday: { start: '09:00', end: '18:00', enabled: true },
          saturday: { start: '09:00', end: '18:00', enabled: false },
          sunday: { start: '09:00', end: '18:00', enabled: false }
        }
      });
      setFacePhotoBlob(null);
      setFacePhotoPreview(null);
      fetchStaff();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create staff');
    } finally {
      setIsUploadingFace(false);
    }
  };

  const handleDeleteStaff = async (staffId: string, staffName?: string) => {
    if (deletingRef.current.has(staffId)) return;
    if (!confirm(`Remove ${staffName || 'this staff member'}?`)) return;

    deletingRef.current.add(staffId);
    setDeletingStaffId(staffId);
    
    try {
      const storeCode = (() => { try { const d = localStorage.getItem('pos_active_store_data'); return d ? JSON.parse(d)?.storeCode : null; } catch { return null; } })();
      try {
        const resp = await invokeFunctionWithResponseFallback<{ success?: boolean; error?: string }>('delete-staff', { staff_id: staffId, store_login_id: isStoreLoginMode ? activeStore?.id : undefined, store_code: isStoreLoginMode ? storeCode : undefined });
        if (resp?.error || resp?.success === false) throw new Error(resp?.error || 'Failed to delete staff');
      } catch (err: any) {
        throw err;
      }
      
      setStaff(prev => prev.filter(s => s.id !== staffId));
      toast.success('Staff removed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove staff');
    } finally {
      deletingRef.current.delete(staffId);
      setDeletingStaffId(null);
    }
  };

  const getStoreStaff = (storeId: string) => staff.filter(s => s.store_id === storeId);

  const roleColors: Record<string, string> = {
    store_manager: 'bg-primary/20 text-primary',
    staff: 'bg-success/20 text-success'
  };

  if (!canManageSettings && !isStoreManager && !isStoreLoginMode) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-lg font-bold mb-1">Access Denied</h2>
          <p className="text-sm text-muted-foreground">You don't have permission to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {settingsSections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap',
              activeSection === section.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            )}
          >
            <section.icon className="w-4 h-4" />
            {section.label}
          </button>
        ))}
      </div>

      {/* Subscription Info */}
      {activeSection === 'stores' && (isOwner() || isAdmin()) && customer && (
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3 mb-3">
            <Crown className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Subscription Plan</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Plan</p>
              <p className="font-medium capitalize">{customer.subscription_plan || 'Standard'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Business</p>
              <p className="font-medium">{customer.business_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Stores</p>
              <p className="font-medium">{stores.length} / {customer.max_stores || 2}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Staff</p>
              <p className="font-medium">{staff.length} (Unlimited)</p>
            </div>
          </div>
        </div>
      )}

      {/* Printer & Bill Settings */}
      {activeSection === 'printer' && (
        <div className="rounded-xl border border-border p-4">
          <POSSettingsPanel />
        </div>
      )}

      {/* KOT Settings */}
      {activeSection === 'kot' && (
        <div className="rounded-xl border border-border p-4">
          <KOTSettings />
        </div>
      )}

      {/* Sales Reset Settings */}
      {activeSection === 'sales-reset' && (
        <div className="rounded-xl border border-border p-4">
          <SalesResetSettings />
        </div>
      )}

      {/* Stores Section */}
      {activeSection === 'stores' && canManageSettings && !isStoreLoginMode && (
        <div className="rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Stores</h2>
            </div>
            <Button 
              onClick={() => setShowAddStore(true)}
              disabled={stores.length >= (customer?.max_stores || 2)}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Store
            </Button>
          </div>
          
          {stores.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No stores yet. Add your first store.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {stores.map(store => (
                <div key={store.id} className="bg-secondary/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Store className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="font-medium">{store.store_name}</h3>
                        <p className="text-xs text-primary font-mono">ID: {store.store_code || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(store)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteStore(store.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {store.address && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {store.address}
                    </p>
                  )}
                  {store.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {store.phone}
                    </p>
                  )}
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">{getStoreStaff(store.id).length} staff members</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Staff Section */}
      {activeSection === 'stores' && (
        <div className="rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Staff</h2>
            </div>
            {canManageStaff && !isStaffOnly && (
              <Button onClick={() => setShowAddStaff(true)} size="sm">
                <Plus className="w-4 h-4 mr-1" /> Add Staff
              </Button>
            )}
          </div>
          
          {staff.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No staff members yet.</p>
          ) : (
            <div className="space-y-3">
              {stores.map(store => {
                const storeStaff = getStoreStaff(store.id);
                if (storeStaff.length === 0) return null;
                
                return (
                  <div key={store.id}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Store className="w-4 h-4" /> {store.store_name}
                    </h3>
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {storeStaff.map(member => (
                        <div key={member.id} className="bg-secondary/50 rounded-lg p-3 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{member.full_name || member.email}</p>
                            <p className="text-xs text-primary font-mono">ID: {member.staff_code || 'N/A'}</p>
                            <span className={cn('text-xs px-2 py-0.5 rounded-full', roleColors[member.role])}>
                              {member.role === 'store_manager' ? 'Store Manager' : 'Staff'}
                            </span>
                          </div>
                          {canManageStaff && !isStaffOnly && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteStaff(member.id, member.full_name || member.email)}
                              disabled={deletingStaffId === member.id}
                            >
                              {deletingStaffId === member.id ? (
                                <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4 text-destructive" />
                              )}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Store Dialog */}
      {showAddStore && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Create New Store</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowAddStore(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium mb-2 block">Store Name *</label>
                <Input
                  placeholder="Restaurant Name"
                  value={newStore.name}
                  onChange={e => setNewStore(prev => ({ ...prev, name: e.target.value }))}
                  className="h-11"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Login Email *</label>
                <Input
                  type="email"
                  placeholder="store@example.com"
                  value={newStore.email}
                  onChange={e => setNewStore(prev => ({ ...prev, email: e.target.value }))}
                  className="h-11"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Address</label>
                <Input
                  placeholder="Store Address"
                  value={newStore.address}
                  onChange={e => setNewStore(prev => ({ ...prev, address: e.target.value }))}
                  className="h-11"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Phone</label>
                <Input
                  placeholder="+91 9876543210"
                  value={newStore.phone}
                  onChange={e => setNewStore(prev => ({ ...prev, phone: e.target.value }))}
                  className="h-11"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Login Password *</label>
                <div className="relative">
                  <Input
                    type={showStorePassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={newStore.password}
                    onChange={e => setNewStore(prev => ({ ...prev, password: e.target.value }))}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStorePassword(!showStorePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showStorePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground bg-primary/10 p-3 rounded-lg">
                Store login email aur password se login hoga.
              </p>
              <Button onClick={handleAddStore} className="w-full h-11">
                <Plus className="w-4 h-4 mr-2" /> Create Store
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Store Dialog */}
      {showEditStore && editingStore && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Store</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowEditStore(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Store Name *</label>
                <Input
                  placeholder="Enter store name"
                  value={editStore.name}
                  onChange={e => setEditStore(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Address</label>
                <Input
                  placeholder="Enter address"
                  value={editStore.address}
                  onChange={e => setEditStore(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Phone</label>
                <Input
                  placeholder="Enter phone"
                  value={editStore.phone}
                  onChange={e => setEditStore(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Login Password</label>
                <Input
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={editStore.password}
                  onChange={e => setEditStore(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <Button onClick={handleUpdateStore} className="w-full">
                <Edit className="w-4 h-4 mr-2" /> Update Store
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Dialog */}
      {showAddStaff && !createdStaffCredentials && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Create New Staff</h2>
              <Button variant="ghost" size="icon" onClick={() => {
                setShowAddStaff(false);
                setFacePhotoBlob(null);
                setFacePhotoPreview(null);
              }}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-5">
              {/* Face Photo Capture */}
              <div>
                <label className="text-sm font-medium mb-2 block">Face Photo *</label>
                {facePhotoPreview ? (
                  <div className="flex items-center gap-4">
                    <img 
                      src={facePhotoPreview} 
                      alt="Face preview" 
                      className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => setShowFaceCapture(true)}
                      className="gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Retake Photo
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowFaceCapture(true)}
                    className="w-full h-20 border-dashed gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Capture Face Photo
                  </Button>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Staff Name *</label>
                <Input
                  placeholder="Staff's Full Name"
                  value={newStaff.name}
                  onChange={e => setNewStaff(prev => ({ ...prev, name: e.target.value }))}
                  className="h-11"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Login Email *</label>
                <Input
                  type="email"
                  placeholder="staff@example.com"
                  value={newStaff.email}
                  onChange={e => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                  className="h-11"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Role *</label>
                <select
                  value={newStaff.role}
                  onChange={e => setNewStaff(prev => ({ ...prev, role: e.target.value as 'store_manager' | 'staff' }))}
                  className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm"
                >
                  {canManageSettings && !isStoreLoginMode && <option value="store_manager">Store Manager</option>}
                  <option value="staff">Staff</option>
                </select>
              </div>
              {!isStoreLoginMode && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Assign to Store *</label>
                  <select
                    value={newStaff.storeId}
                    onChange={e => setNewStaff(prev => ({ ...prev, storeId: e.target.value }))}
                    className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm"
                  >
                    <option value="">Select store</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>{store.store_name}</option>
                    ))}
                  </select>
                </div>
              )}
              {isStoreLoginMode && activeStore && (
                <div className="bg-secondary/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Store</p>
                  <p className="font-medium">{activeStore.name}</p>
                </div>
              )}
              {/* Working Hours */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Default Working Hours
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Start Time</label>
                    <Input
                      type="time"
                      value={newStaff.workStartTime}
                      onChange={e => setNewStaff(prev => ({ ...prev, workStartTime: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">End Time</label>
                    <Input
                      type="time"
                      value={newStaff.workEndTime}
                      onChange={e => setNewStaff(prev => ({ ...prev, workEndTime: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Shift Schedule */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Weekly Shift Schedule
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map(day => (
                    <div key={day} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <Checkbox
                        checked={newStaff.shiftSchedule[day].enabled}
                        onCheckedChange={(checked) => setNewStaff(prev => ({
                          ...prev,
                          shiftSchedule: {
                            ...prev.shiftSchedule,
                            [day]: { ...prev.shiftSchedule[day], enabled: !!checked }
                          }
                        }))}
                      />
                      <span className="w-20 text-sm font-medium capitalize">{day}</span>
                      <Input
                        type="time"
                        value={newStaff.shiftSchedule[day].start}
                        onChange={e => setNewStaff(prev => ({
                          ...prev,
                          shiftSchedule: {
                            ...prev.shiftSchedule,
                            [day]: { ...prev.shiftSchedule[day], start: e.target.value }
                          }
                        }))}
                        disabled={!newStaff.shiftSchedule[day].enabled}
                        className="h-8 w-24 text-xs"
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={newStaff.shiftSchedule[day].end}
                        onChange={e => setNewStaff(prev => ({
                          ...prev,
                          shiftSchedule: {
                            ...prev.shiftSchedule,
                            [day]: { ...prev.shiftSchedule[day], end: e.target.value }
                          }
                        }))}
                        disabled={!newStaff.shiftSchedule[day].enabled}
                        className="h-8 w-24 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Fingerprint Authentication Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Fingerprint Authentication</p>
                    <p className="text-xs text-muted-foreground">Allow biometric check-in/out</p>
                  </div>
                </div>
                <Switch
                  checked={newStaff.fingerprintEnabled}
                  onCheckedChange={(checked) => setNewStaff(prev => ({ ...prev, fingerprintEnabled: checked }))}
                />
              </div>

              {/* Salary */}
              <div>
                <label className="text-sm font-medium mb-2 block">Monthly Salary (₹)</label>
                <Input
                  type="number"
                  placeholder="e.g. 15000"
                  value={newStaff.salary}
                  onChange={e => setNewStaff(prev => ({ ...prev, salary: e.target.value }))}
                  className="h-11"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Password (Optional)</label>
                <div className="relative">
                  <Input
                    type={showStaffPassword ? 'text' : 'password'}
                    placeholder="Leave blank to auto-generate"
                    value={newStaff.password}
                    onChange={e => setNewStaff(prev => ({ ...prev, password: e.target.value }))}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffPassword(!showStaffPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button onClick={handleAddStaff} className="w-full h-11" disabled={isUploadingFace}>
                {isUploadingFace ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" /> Create Staff
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Face Capture Dialog */}
      <FaceCaptureDialog
        open={showFaceCapture}
        onOpenChange={setShowFaceCapture}
        onCapture={handleFaceCapture}
        title="Capture Staff Face"
      />

      {/* Staff Created Success Dialog */}
      {createdStaffCredentials && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-xl font-bold text-success">Staff Created!</h2>
              <p className="text-muted-foreground mt-1">Save these credentials</p>
            </div>
            
            <div className="space-y-4 bg-secondary/50 p-4 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Login Email:</span>
                <span className="font-bold text-sm break-all text-right">{createdStaffCredentials.staffCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Password:</span>
                <span className="font-mono font-bold text-lg">{createdStaffCredentials.password}</span>
              </div>
            </div>
            
            <p className="text-xs text-destructive mt-4 text-center">
              ⚠️ These credentials won't be shown again!
            </p>
            
            <Button 
              onClick={() => {
                setCreatedStaffCredentials(null);
                setShowAddStaff(false);
              }} 
              className="w-full mt-6"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};