import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

interface FeatureGuardProps {
  featureKey: string;
  children: React.ReactNode;
  redirectTo?: string;
}

export const FeatureGuard: React.FC<FeatureGuardProps> = ({ featureKey, children, redirectTo = '/operations' }) => {
  const { canAccess, loading, requiresUpgrade } = useSubscription();

  if (loading) return null;

  if (!canAccess(featureKey)) {
    const needed = requiresUpgrade(featureKey);
    if (needed) {
      toast.error(`This feature requires ${needed.toUpperCase()} plan. Please upgrade.`);
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
