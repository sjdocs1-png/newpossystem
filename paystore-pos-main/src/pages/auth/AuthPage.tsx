import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { Eye, EyeOff, ArrowLeft, LogIn, Check, Clock, Crown, Building2 } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { cn } from '@/lib/utils';

const AuthPage: React.FC = () => {
  const { t } = useLocale();
  const [searchParams] = useSearchParams();
  
  
  const [loginEmail, setLoginEmail] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [isSignup, setIsSignup] = useState(searchParams.get('signup') === 'true');
  const [signupStep, setSignupStep] = useState<'form' | 'membership' | 'pending'>('form');
  const [signupComplete, setSignupComplete] = useState(false);
  const navigate = useNavigate();
  const hasRedirected = useRef(false);
  const { login, signup, resetPassword, isLoading: authLoading, userRole, isAuthenticated } = useSupabaseAuth();
  const { toast } = useToast();


  const ownerSignupSchema = z.object({
    email: z.string().email(t('auth.validEmail')),
    password: z.string().min(6, t('auth.passwordMinLength')),
    fullName: z.string().min(1, t('auth.fullNameRequired')),
    phone: z.string().min(10, t('auth.phoneRequired')),
    businessName: z.string().min(1, t('auth.businessNameRequired')),
  });

  // Hard safety timeout
  useEffect(() => {
    if (!isLoading) return;
    const hardTimeout = setTimeout(() => {
      console.warn('[AuthPage] Hard timeout: forcing loading to stop');
      setIsLoading(false);
      setLoginSuccess(false);
    }, 10000);
    return () => clearTimeout(hardTimeout);
  }, [isLoading]);

  // Role-based redirect helper
  const redirectByRole = (role: string) => {
    switch (role) {
      case 'admin':
        navigate('/admin-dashboard', { replace: true });
        break;
      case 'owner':
        navigate('/dashboard', { replace: true });
        break;
      case 'store_manager':
        navigate('/pos', { replace: true });
        break;
      case 'staff':
        navigate('/staff-dashboard', { replace: true });
        break;
      default:
        navigate('/', { replace: true });
    }
  };

  // Watch for userRole changes after login success
  useEffect(() => {
    if (!loginSuccess || !isAuthenticated || hasRedirected.current) return;

    if (userRole) {
      setIsLoading(false);
      hasRedirected.current = true;
      redirectByRole(userRole.role);
      return;
    }

    // Timeout: if role not found within 4 seconds, check manually
    const timeout = setTimeout(async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          setIsLoading(false);
          setLoginSuccess(false);
          toast({ title: t('auth.loginFailed'), description: t('common.sessionError'), variant: 'destructive' });
          return;
        }

        const { data: roleData } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('is_active', true)
          .maybeSingle();

        if (roleData) {
          setIsLoading(false);
          
          // For store_manager/staff, also save store session
          if (roleData.store_id && (roleData.role === 'store_manager' || roleData.role === 'staff')) {
            const { data: storeData } = await supabase
              .from('stores')
              .select('id, store_name, address, phone, customer_id')
              .eq('id', roleData.store_id)
              .single();
            
            if (storeData) {
              localStorage.setItem('pos_active_store', JSON.stringify(storeData.id));
              localStorage.setItem('pos_store_id', storeData.id);
              localStorage.setItem('pos_store_code', '');
              localStorage.setItem('pos_active_store_data', JSON.stringify({
                id: storeData.id,
                storeId: storeData.id,
                storeName: storeData.store_name,
                storeAddress: storeData.address,
                storePhone: storeData.phone,
                customerId: storeData.customer_id,
                storeCode: null,
              }));
            }
          }
          
          redirectByRole(roleData.role);
          return;
        }

        // No role found - check pending customer
        const { data: customerData } = await supabase
          .from('customers')
          .select('approval_status')
          .eq('owner_email', currentUser.email?.toLowerCase() || '')
          .maybeSingle();

        if (customerData?.approval_status === 'pending') {
          await supabase.auth.signOut();
          setIsLoading(false);
          setLoginSuccess(false);
          toast({ title: t('common.accountPending'), description: t('common.accountPendingDesc'), variant: 'destructive' });
          return;
        }

        await supabase.auth.signOut();
        setIsLoading(false);
        setLoginSuccess(false);
        toast({ title: t('common.accessDenied'), description: t('common.noActiveAccount'), variant: 'destructive' });
      } catch (err) {
        console.error('[AuthPage] Manual role lookup failed:', err);
        setIsLoading(false);
        setLoginSuccess(false);
        toast({ title: t('auth.loginFailed'), description: 'Something went wrong. Please try again.', variant: 'destructive' });
      }
    }, 4000);

    return () => clearTimeout(timeout);
  }, [loginSuccess, isAuthenticated, userRole, navigate]);

  // Auto-redirect already authenticated users
  useEffect(() => {
    if (authLoading || loginSuccess || isLoading || hasRedirected.current) return;
    if (isAuthenticated && userRole) {
      console.log('[AuthPage] Already authenticated with role, redirecting...');
      hasRedirected.current = true;
      redirectByRole(userRole.role);
    }
  }, [authLoading, isAuthenticated, userRole, loginSuccess, isLoading]);

  // Auth loading spinner
  useEffect(() => {
    if (!authLoading) return;
    const authTimeout = setTimeout(() => {
      console.warn('[AuthPage] authLoading stuck, proceeding anyway');
    }, 3000);
    return () => clearTimeout(authTimeout);
  }, [authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const trimmedEmail = loginEmail.trim();
    const trimmedPassword = password.trim();
    const fieldErrors: Record<string, string> = {};

    if (!trimmedEmail) fieldErrors.loginEmail = t('auth.validEmail');
    if (!trimmedPassword) fieldErrors.password = t('auth.passwordRequired');

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      localStorage.removeItem('pos_staff_session');
      localStorage.removeItem('logged_in_staff');
      localStorage.removeItem('pos_is_store_login');
      localStorage.removeItem('pos_active_store_data');
      localStorage.removeItem('pos_store_code');

      const { error } = await login(trimmedEmail, trimmedPassword);

      if (error) {
        setIsLoading(false);
        toast({ title: t('auth.loginFailed'), description: error, variant: 'destructive' });
        return;
      }

      toast({ title: t('common.welcomeBack'), description: t('auth.loginSuccess') });
      setLoginSuccess(true);
      // Don't setIsLoading(false) here - let role redirect handle it
    } catch (err) {
      setIsLoading(false);
      toast({ title: t('auth.loginFailed'), description: 'Something went wrong', variant: 'destructive' });
    }
  };

  

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      ownerSignupSchema.parse({ email, password, fullName, phone, businessName });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }
    }
    
    setSignupStep('membership');
  };

  const handleOwnerSignupComplete = async () => {
    if (!selectedPlan) {
      toast({ title: t('auth.selectPlan'), description: t('auth.selectPlanDesc'), variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const { error: signupError } = await signup(email, password, fullName);
      if (signupError) throw new Error(signupError);

      await new Promise(resolve => setTimeout(resolve, 500));

      const { error: customerError } = await supabase
        .from('customers')
        .insert({
          owner_email: email,
          owner_name: fullName,
          business_name: businessName,
          phone: phone,
          subscription_plan: selectedPlan,
          approval_status: 'pending',
          is_active: false,
        });

      if (customerError) console.error('Customer creation error:', customerError);

      setSignupStep('pending');
      setSignupComplete(true);
      toast({ title: t('auth.signupComplete'), description: t('auth.accountPendingApproval') });
    } catch (error: any) {
      toast({ title: t('auth.signupFailed'), description: error.message || t('common.error'), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const resetEmail = loginEmail.trim();

    if (!resetEmail || !/\S+@\S+\.\S+/.test(resetEmail)) {
      toast({ title: t('common.emailRequired'), description: 'Password reset ke liye email enter karein', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const { error } = await resetPassword(resetEmail);
    setIsLoading(false);

    if (error) {
      toast({ title: t('common.error'), description: error, variant: 'destructive' });
      return;
    }

    toast({ title: t('common.resetEmailSent'), description: t('common.checkEmail') });
  };

  const getHeaderTitle = () => {
    if (signupStep === 'membership') return t('auth.selectPlan');
    if (signupStep === 'pending') return t('auth.pendingApprovalTitle');
    if (isSignup) return t('auth.ownerSignup');
    return t('auth.login');
  };

  const getHeaderSubtitle = () => {
    if (signupStep === 'membership') return t('auth.chooseMembershipPlan');
    if (signupStep === 'pending') return t('auth.awaitingApproval');
    if (isSignup) return t('auth.registerBusiness');
    return 'Email + Password se login karein';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-3 sm:mb-4 h-9 sm:h-10 text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.backToHome')}
        </Button>

        <Card className="border-0 shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 p-4 sm:p-6 rounded-t-lg text-primary-foreground">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-primary-foreground/20 rounded-lg sm:rounded-xl">
                {signupStep === 'membership' ? <Crown className="w-6 h-6 sm:w-8 sm:h-8" /> :
                 signupStep === 'pending' ? <Clock className="w-6 h-6 sm:w-8 sm:h-8" /> :
                 isSignup ? <Building2 className="w-6 h-6 sm:w-8 sm:h-8" /> :
                 <LogIn className="w-6 h-6 sm:w-8 sm:h-8" />}
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold">{getHeaderTitle()}</h1>
                <p className="text-xs sm:text-sm text-primary-foreground/80">{getHeaderSubtitle()}</p>
              </div>
            </div>
          </div>

          <CardContent className="p-4 sm:p-6">
            {signupStep === 'pending' ? (
              // Pending Approval Screen
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold">{t('auth.pendingApprovalTitle')}</h3>
                <p className="text-muted-foreground">{t('auth.pendingApprovalDesc')}</p>
                <div className="bg-secondary/50 rounded-lg p-4 text-left">
                  <p className="text-sm"><strong>{t('auth.business')}:</strong> {businessName}</p>
                  <p className="text-sm"><strong>{t('auth.plan')}:</strong> {selectedPlan}</p>
                  <p className="text-sm"><strong>{t('common.email')}:</strong> {email}</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/')} className="mt-4">
                  {t('common.backToHome')}
                </Button>
              </div>
            ) : signupStep === 'membership' ? (
              // Membership Selection
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold">{t('auth.selectMembershipPlan')}</h3>
                  <p className="text-sm text-muted-foreground">{t('auth.choosePlanFits')}</p>
                </div>

                <div className="space-y-3">
                  {[
                    { id: 'trial', name: t('auth.freeTrial'), price: '₹0', duration: '14 days', features: [t('auth.oneStore'), t('auth.basicPOS'), t('auth.limitedSupport')] },
                    { id: 'monthly', name: t('auth.monthly'), price: '₹999', duration: '/month', features: [t('auth.upTo3Stores'), t('auth.fullPOS'), t('auth.prioritySupport')] },
                    { id: 'yearly', name: t('auth.yearly'), price: '₹9,999', duration: '/year', features: [t('auth.unlimitedStores'), t('auth.fullPOS'), t('auth.support247'), t('auth.twoMonthsFree')] },
                  ].map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className={cn(
                        'w-full p-4 rounded-lg border-2 text-left transition-all relative',
                        selectedPlan === plan.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold">{plan.name}</p>
                          <p className="text-sm text-muted-foreground">{plan.features.join(' • ')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{plan.price}</p>
                          <p className="text-xs text-muted-foreground">{plan.duration}</p>
                        </div>
                      </div>
                      {selectedPlan === plan.id && (
                        <div className="absolute top-2 right-2">
                          <Check className="w-5 h-5 text-primary" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setSignupStep('form')} className="flex-1">
                    {t('auth.back')}
                  </Button>
                  <Button onClick={handleOwnerSignupComplete} disabled={isLoading || !selectedPlan} className="flex-1">
                    {isLoading ? t('auth.creating') : t('auth.completeSignup')}
                  </Button>
                </div>
              </div>
            ) : (
              // Unified Login / Signup Form
              <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4">
                {isSignup && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">{t('common.fullName')} *</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder={t('auth.enterFullName')}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={errors.fullName ? 'border-destructive' : ''}
                      />
                      {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessName">{t('common.businessName')} *</Label>
                      <Input
                        id="businessName"
                        type="text"
                        placeholder={t('auth.businessNamePlaceholder')}
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className={errors.businessName ? 'border-destructive' : ''}
                      />
                      {errors.businessName && <p className="text-sm text-destructive">{errors.businessName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('common.phone')} *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder={t('auth.phonePlaceholder')}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={errors.phone ? 'border-destructive' : ''}
                      />
                      {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="loginEmail">{t('common.email')}</Label>
                  <Input
                    id="loginEmail"
                    type="email"
                    placeholder="Enter your email"
                    value={isSignup ? email : loginEmail}
                    onChange={(e) => {
                      if (isSignup) {
                        setEmail(e.target.value);
                        return;
                      }
                      setLoginEmail(e.target.value);
                    }}
                    className={errors.loginEmail || errors.email ? 'border-destructive' : ''}
                    autoCapitalize="off"
                    autoCorrect="off"
                  />
                  {(errors.loginEmail || errors.email) && <p className="text-sm text-destructive">{errors.loginEmail || errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={isSignup ? t('auth.createPassword') : t('auth.enterPassword')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                {!isSignup && (
                  <Button type="button" variant="link" className="px-0 text-sm" onClick={handleForgotPassword}>
                    {t('auth.forgotPassword')}
                  </Button>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading
                    ? (isSignup ? t('auth.next') : t('auth.loggingIn'))
                    : (isSignup ? t('auth.nextSelectPlan') : t('auth.login'))
                  }
                </Button>

                {!isSignup && (
                  <>
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">{t('common.or') || 'OR'}</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      disabled={isLoading}
                      onClick={async () => {
                        setIsLoading(true);
                        const { error } = await lovable.auth.signInWithOAuth("google", {
                          redirect_uri: window.location.origin,
                        });
                        if (error) {
                          toast({ title: t('auth.loginFailed'), description: error.message || 'Google sign-in failed', variant: 'destructive' });
                        }
                        setIsLoading(false);
                      }}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Sign in with Google
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      disabled={isLoading}
                      onClick={async () => {
                        setIsLoading(true);
                        const { error } = await lovable.auth.signInWithOAuth("apple", {
                          redirect_uri: window.location.origin,
                        });
                        if (error) {
                          toast({ title: t('auth.loginFailed'), description: error.message || 'Apple sign-in failed', variant: 'destructive' });
                        }
                        setIsLoading(false);
                      }}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      Sign in with Apple
                    </Button>
                  </>
                )}

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm"
                    onClick={() => {
                      setIsSignup(!isSignup);
                      setSignupStep('form');
                      setErrors({});
                    }}
                  >
                    {isSignup ? `${t('auth.alreadyHaveAccount')} ${t('auth.login')}` : `${t('auth.dontHaveAccount')} ${t('auth.signUp')}`}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Role info */}
        {!isSignup && signupStep === 'form' && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            Admin, Owner, Store Manager, Staff — sabka email se login
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
