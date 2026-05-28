import React, { useState } from 'react';
import { User, Store, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface StaffLoginProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin?: (staffData: any) => void;
}

export const StaffLogin: React.FC<StaffLoginProps> = ({ isOpen, onClose, onLogin }) => {
  const [storeCode, setStoreCode] = useState('');
  const [staffCode, setStaffCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'store' | 'staff'>('store');
  const [storeData, setStoreData] = useState<any>(null);

  const handleStoreCodeSubmit = async () => {
    if (!storeCode || storeCode.length !== 8) {
      toast.error('Enter valid 8-digit Store Code');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, customer_id, store_name, address, phone, store_code, latitude, longitude, is_active, created_at, updated_at')
        .eq('store_code', storeCode)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast.error('Store not found or inactive');
        return;
      }

      setStoreData(data);
      setStep('staff');
      toast.success(`Store: ${data.store_name}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to find store');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffLogin = async () => {
    if (!staffCode || staffCode.length !== 8) {
      toast.error('Enter valid 8-digit Staff Code');
      return;
    }

    if (!password || password.length < 4) {
      toast.error('Enter valid PIN or password');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('staff-login', {
        body: {
          staff_code: staffCode,
          password,
          store_id: storeData.id,
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.success) throw new Error('Login failed');

      localStorage.setItem('pos_active_store_data', JSON.stringify({
        id: data.store_id || storeData.id,
        storeId: data.store_id || storeData.id,
        storeName: data.store_name || storeData.store_name,
        storeAddress: data.store_address || storeData.address || null,
        storePhone: data.store_phone || storeData.phone || null,
        customerId: data.customer_id || storeData.customer_id,
        storeCode: data.store_code || storeData.store_code || null,
      }));

      const staffSession = {
        id: data.staff_code || staffCode,
        user_id: data.user_id,
        name: data.name || 'Staff',
        email: data.email || '',
        role: data.role,
        store_id: data.store_id || storeData.id,
        store_name: storeData.store_name,
        staff_code: data.staff_code || staffCode
      };

      localStorage.setItem('pos_staff_session', JSON.stringify(staffSession));
      localStorage.setItem('logged_in_staff', JSON.stringify({
        id: data.staff_code || staffCode,
        name: data.name || 'Staff',
        role: data.role,
        phone: data.store_phone || storeData.phone || '',
        store_id: data.store_id || storeData.id,
      }));
      
      toast.success(`Welcome ${staffSession.name}!`);
      onLogin?.(staffSession);
      onClose();
      
      setStoreCode('');
      setStaffCode('');
      setPassword('');
      setStep('store');
      setStoreData(null);
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep('store');
    setStaffCode('');
    setPassword('');
    setStoreData(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card rounded-xl p-6 w-[400px] shadow-2xl animate-scale-in">
        {step === 'store' ? (
          <>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Store Login</h2>
              <p className="text-sm text-muted-foreground">Enter 8-digit Store Code</p>
            </div>

            <div className="space-y-4">
              <Input
                placeholder="Enter Store Code (8 digits)"
                value={storeCode}
                onChange={(e) => setStoreCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={8}
              />
              
              <Button 
                onClick={handleStoreCodeSubmit} 
                className="w-full"
                disabled={isLoading || storeCode.length !== 8}
              >
                {isLoading ? 'Checking...' : 'Continue'}
              </Button>
              
              <Button variant="ghost" onClick={onClose} className="w-full">
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Staff Login</h2>
              <p className="text-sm text-primary font-medium">{storeData?.store_name}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Staff ID</label>
                <Input
                  placeholder="8-digit Staff ID"
                  value={staffCode}
                  onChange={(e) => setStaffCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  className="text-center text-xl tracking-widest font-mono"
                  maxLength={8}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
              
              <Button 
                onClick={handleStaffLogin} 
                className="w-full"
                disabled={isLoading || staffCode.length !== 8 || password.length < 4}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
              
              <Button variant="ghost" onClick={handleBack} className="w-full">
                ← Back to Store
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};