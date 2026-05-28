import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import {
  SubscriptionTier,
  BusinessType,
  AddonKey,
  FEATURES,
  BASIC_REPORT_PATHS,
  hasFeatureAccess,
  meetsMinTier,
  getTierLimits,
  getTierLabel,
} from '@/lib/subscriptionConfig';

export function useSubscription() {
  const { customer, userRole } = useSupabaseAuth();
  const [tier, setTier] = useState<SubscriptionTier>('basic');
  const [businessType, setBusinessType] = useState<BusinessType>('restaurant');
  const [enabledAddons, setEnabledAddons] = useState<string[]>([]);
  const [staffLimit, setStaffLimit] = useState(2);
  const [outletLimit, setOutletLimit] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchTier = useCallback(async () => {
    const tierMap: Record<string, SubscriptionTier> = {
      basic: 'basic',
      pro: 'gold',
      gold: 'gold',
      enterprise: 'platinum',
      platinum: 'platinum',
    };

    // Priority 1: Try localStorage (works for store login users who can't query DB)
    console.log('[OwnerAccess] useSubscription: userRole=', userRole?.role, 'pos_active_store_data present=', !!localStorage.getItem('pos_active_store_data'));
    try {
      const storeData = localStorage.getItem('pos_active_store_data');
      if (storeData) {
        const parsed = JSON.parse(storeData);
        if (parsed?.subscription_tier) {
          setTier(tierMap[parsed.subscription_tier] || 'basic');
          setBusinessType((parsed.business_type as BusinessType) || 'restaurant');
          setEnabledAddons(parsed.enabled_addons || []);
          setStaffLimit(parsed.staff_limit || 2);
          setOutletLimit(parsed.outlet_limit || 1);
          console.log('[OwnerAccess] useSubscription: loaded tier from localStorage:', parsed?.subscription_tier);
          setLoading(false);
          return;
        }
      }
    } catch {
      // ignore parse errors
    }

    // Priority 2: Query DB for authenticated users (owner/admin)
    let customerId: string | null = null;

    if (customer?.id) {
      customerId = customer.id;
    } else {
      try {
        const storeData = localStorage.getItem('pos_active_store_data');
        if (storeData) {
          const parsed = JSON.parse(storeData);
          customerId = parsed?.customer_id || null;
        }
      } catch {
        // ignore parse errors
      }
    }

    if (customerId) {
      const { data } = await supabase
        .from('customers')
        .select('subscription_tier, business_type, enabled_addons, staff_limit, outlet_limit')
        .eq('id', customerId)
        .maybeSingle();

      if (data) {
        setTier(tierMap[data.subscription_tier] || 'basic');
        setBusinessType((data.business_type as BusinessType) || 'restaurant');
        setEnabledAddons((data as any).enabled_addons || []);
        setStaffLimit((data as any).staff_limit || 2);
        setOutletLimit((data as any).outlet_limit || 1);
      }
    }

    setLoading(false);
  }, [customer, userRole]);

  useEffect(() => {
    fetchTier();

    const handleStorage = (event: StorageEvent | Event) => {
      if (event instanceof StorageEvent) {
        if (event.key && !event.key.startsWith('pos_active_store_data') && !event.key.startsWith('pos_store_id') && !event.key.startsWith('pos_store_code')) return;
      }
      fetchTier();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('owner_store_selection', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('owner_store_selection', handleStorage);
    };
  }, [fetchTier]);

  const limits = useMemo(() => {
    const baseLimits = getTierLimits(tier, businessType);
    return {
      maxStaff: Math.max(baseLimits.maxStaff, staffLimit),
      maxOutlets: Math.max(baseLimits.maxOutlets, outletLimit),
      maxReports: baseLimits.maxReports,
    };
  }, [tier, businessType, staffLimit, outletLimit]);

  const canAccess = useCallback((featureKey: string): boolean => {
    // Admins bypass all gates
    if (userRole?.role === 'admin') return true;
    return hasFeatureAccess(tier, businessType, featureKey, enabledAddons);
  }, [tier, businessType, enabledAddons, userRole]);

  const canAccessReport = useCallback((reportPath: string): boolean => {
    if (userRole?.role === 'admin') return true;
    if (meetsMinTier(tier, 'gold')) return true;
    // For basic tier, check specific report feature keys
    const reportFeatureMap: Record<string, string> = {
      '/reports/order-summary': 'orderSummaryReport',
      '/reports/executive-sales': 'executiveSaleReport',
      '/reports/employee-summary': 'employeeSummaryReport',
      '/reports/group-summary': 'groupSummaryReport',
      '/reports/variation-summary': 'variationSummaryReport',
      '/reports/cover-size-summary': 'coverSizeSummaryReport',
      '/reports/tip-summary': 'tipSummaryReport',
      '/reports/counter-summary': 'counterSummaryReport',
    };
    const featureKey = reportFeatureMap[reportPath];
    if (featureKey) {
      return hasFeatureAccess(tier, businessType, featureKey, enabledAddons);
    }
    // Only allow explicitly listed basic report paths
    return BASIC_REPORT_PATHS.includes(reportPath);
  }, [tier, userRole, businessType, enabledAddons]);

  const requiresUpgrade = useCallback((featureKey: string): SubscriptionTier | null => {
    if (canAccess(featureKey)) return null;
    const feature = FEATURES[featureKey];
    if (!feature) return null;
    return businessType === 'restaurant' ? feature.restaurant : feature.retail;
  }, [canAccess, businessType]);

  return {
    tier,
    businessType,
    enabledAddons,
    loading,
    limits,
    canAccess,
    canAccessReport,
    requiresUpgrade,
    tierLabel: getTierLabel(tier),
    isGold: meetsMinTier(tier, 'gold'),
    isPlatinum: meetsMinTier(tier, 'platinum'),
    // backward compat
    isPro: meetsMinTier(tier, 'gold'),
    isEnterprise: meetsMinTier(tier, 'platinum'),
  };
}
