import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  UtensilsCrossed, ShoppingBag, Crown, Check, X, Sparkles,
  Receipt, CreditCard, BarChart3, Package, Users, MapPin,
  MessageCircle, Truck, Brain, Building, QrCode, ChefHat, Puzzle
} from 'lucide-react';
import { FEATURES, type SubscriptionTier, type BusinessType } from '@/lib/subscriptionConfig';

const TIER_CONFIG: { value: SubscriptionTier; label: string; color: string; bgColor: string; icon: React.ReactNode }[] = [
  { 
    value: 'basic', label: 'Basic', 
    color: 'text-slate-700 dark:text-slate-300', 
    bgColor: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    icon: <Crown className="w-5 h-5" />
  },
  { 
    value: 'gold', label: 'Gold', 
    color: 'text-amber-700 dark:text-amber-400', 
    bgColor: 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-300 dark:border-amber-700',
    icon: <Crown className="w-5 h-5 text-amber-500" />
  },
  { 
    value: 'platinum', label: 'Platinum', 
    color: 'text-violet-700 dark:text-violet-400', 
    bgColor: 'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-300 dark:border-violet-700',
    icon: <Crown className="w-5 h-5 text-violet-500" />
  },
];

const FEATURE_ICONS: Record<string, React.ReactNode> = {
  billing: <Receipt className="w-4 h-4" />,
  gstInvoice: <CreditCard className="w-4 h-4" />,
  multiplePayments: <CreditCard className="w-4 h-4" />,
  basicReports: <BarChart3 className="w-4 h-4" />,
  menuManagement: <Package className="w-4 h-4" />,
  basicInventory: <Package className="w-4 h-4" />,
  manualInventory: <Package className="w-4 h-4" />,
  customerManagement: <Users className="w-4 h-4" />,
  support247: <MessageCircle className="w-4 h-4" />,
  barcodeScanner: <QrCode className="w-4 h-4" />,
  fullInventory: <Package className="w-4 h-4" />,
  recipeManagement: <ChefHat className="w-4 h-4" />,
  recipeInventory: <ChefHat className="w-4 h-4" />,
  advancedReports: <BarChart3 className="w-4 h-4" />,
  expenseTracking: <CreditCard className="w-4 h-4" />,
  tableManagement: <Building className="w-4 h-4" />,
  qrMenuOrdering: <QrCode className="w-4 h-4" />,
  staffManagement: <Users className="w-4 h-4" />,
  faceVerification: <Users className="w-4 h-4" />,
  geoFencing: <MapPin className="w-4 h-4" />,
  swiggyZomato: <Truck className="w-4 h-4" />,
  teamChat: <MessageCircle className="w-4 h-4" />,
  thirdPartyIntegration: <Puzzle className="w-4 h-4" />,
  multiOutlet: <Building className="w-4 h-4" />,
  centralDashboard: <BarChart3 className="w-4 h-4" />,
  apiIntegrations: <Puzzle className="w-4 h-4" />,
  alertsNotifications: <MessageCircle className="w-4 h-4" />,
  autoStockSystem: <Brain className="w-4 h-4" />,
  smartInventory: <Brain className="w-4 h-4" />,
  deliveryTracking: <Truck className="w-4 h-4" />,
  crmLoyalty: <Users className="w-4 h-4" />,
};

const CATEGORY_CONFIG = [
  { value: 'restaurant' as BusinessType, label: 'Restaurant', icon: UtensilsCrossed, color: 'text-orange-600 dark:text-orange-400' },
  { value: 'retail' as BusinessType, label: 'Retail Store', icon: ShoppingBag, color: 'text-blue-600 dark:text-blue-400' },
];

function getFeaturesForTier(tier: SubscriptionTier, businessType: BusinessType) {
  return Object.values(FEATURES).filter(f => {
    const requiredTier = businessType === 'restaurant' ? f.restaurant : f.retail;
    return requiredTier === tier;
  });
}

function isFeatureIncluded(featureKey: string, tier: SubscriptionTier, businessType: BusinessType): boolean {
  const feature = FEATURES[featureKey];
  if (!feature) return false;
  const requiredTier = businessType === 'restaurant' ? feature.restaurant : feature.retail;
  const tierLevel: Record<SubscriptionTier, number> = { basic: 1, gold: 2, platinum: 3 };
  return tierLevel[tier] >= tierLevel[requiredTier];
}

export const AdminPlanManagement: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<BusinessType>('restaurant');

  const allFeatureKeys = Object.keys(FEATURES);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Plan & Feature Management</h2>
        <p className="text-muted-foreground">View categories, plans, and their feature mappings</p>
      </div>

      {/* Category Selection */}
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as BusinessType)}>
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          {CATEGORY_CONFIG.map(cat => (
            <TabsTrigger key={cat.value} value={cat.value} className="gap-2">
              <cat.icon className={`w-4 h-4 ${cat.color}`} />
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORY_CONFIG.map(cat => (
          <TabsContent key={cat.value} value={cat.value} className="mt-6">
            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TIER_CONFIG.map(tier => {
                const tierFeatures = getFeaturesForTier(tier.value, cat.value);
                const allIncluded = allFeatureKeys.filter(fk => isFeatureIncluded(fk, tier.value, cat.value));
                
                return (
                  <Card key={tier.value} className={`relative overflow-hidden border-2 ${tier.bgColor}`}>
                    {tier.value === 'gold' && (
                      <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-bl-lg">
                        POPULAR
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        {tier.icon}
                        <CardTitle className={tier.color}>{tier.label} Plan</CardTitle>
                      </div>
                      <CardDescription>
                        {tier.value === 'basic' && 'Essential features to get started'}
                        {tier.value === 'gold' && 'Advanced features for growing businesses'}
                        {tier.value === 'platinum' && 'Full suite with AI & multi-outlet'}
                      </CardDescription>
                      <Badge variant="outline" className="w-fit text-xs mt-1">
                        {allIncluded.length} features included
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[350px]">
                        <div className="px-6 pb-6 space-y-1.5">
                          {/* New features at this tier */}
                          {tierFeatures.length > 0 && (
                            <>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2 pb-1">
                                {tier.value === 'basic' ? 'Included' : `New in ${tier.label}`}
                              </p>
                              {tierFeatures.map(f => (
                                <div key={f.key} className="flex items-center gap-2 py-1">
                                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                                  </div>
                                  <span className="text-sm flex items-center gap-1.5">
                                    {FEATURE_ICONS[f.key] || <Sparkles className="w-4 h-4" />}
                                    {f.label}
                                  </span>
                                  {f.isAddon && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Add-on</Badge>
                                  )}
                                </div>
                              ))}
                            </>
                          )}

                          {/* Inherited from lower tiers */}
                          {tier.value !== 'basic' && (
                            <>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-3 pb-1">
                                + Everything in {tier.value === 'gold' ? 'Basic' : 'Gold'}
                              </p>
                              {allIncluded
                                .filter(fk => !tierFeatures.find(tf => tf.key === fk))
                                .slice(0, 5)
                                .map(fk => {
                                  const f = FEATURES[fk];
                                  return (
                                    <div key={fk} className="flex items-center gap-2 py-1 opacity-60">
                                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3 h-3 text-muted-foreground" />
                                      </div>
                                      <span className="text-sm text-muted-foreground">{f.label}</span>
                                    </div>
                                  );
                                })}
                              {allIncluded.filter(fk => !tierFeatures.find(tf => tf.key === fk)).length > 5 && (
                                <p className="text-xs text-muted-foreground pl-7">
                                  +{allIncluded.filter(fk => !tierFeatures.find(tf => tf.key === fk)).length - 5} more...
                                </p>
                              )}
                            </>
                          )}

                          {/* Not included */}
                          {tier.value !== 'platinum' && (
                            <>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-3 pb-1">
                                Not included
                              </p>
                              {allFeatureKeys
                                .filter(fk => !isFeatureIncluded(fk, tier.value, cat.value))
                                .slice(0, 4)
                                .map(fk => {
                                  const f = FEATURES[fk];
                                  return (
                                    <div key={fk} className="flex items-center gap-2 py-1 opacity-40">
                                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                        <X className="w-3 h-3 text-muted-foreground" />
                                      </div>
                                      <span className="text-sm text-muted-foreground line-through">{f.label}</span>
                                    </div>
                                  );
                                })}
                            </>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Full Feature Comparison Table */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Full Feature Comparison — {cat.label}</CardTitle>
                <CardDescription>Complete feature mapping across all plans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Feature</th>
                        {TIER_CONFIG.map(tier => (
                          <th key={tier.value} className={`text-center p-3 font-medium ${tier.color}`}>
                            {tier.label}
                          </th>
                        ))}
                        <th className="text-center p-3 font-medium text-muted-foreground">Add-on?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allFeatureKeys.map(fk => {
                        const f = FEATURES[fk];
                        return (
                          <tr key={fk} className="border-b hover:bg-muted/30">
                            <td className="p-3 flex items-center gap-2">
                              {FEATURE_ICONS[fk] || <Sparkles className="w-4 h-4 text-muted-foreground" />}
                              {f.label}
                            </td>
                            {TIER_CONFIG.map(tier => (
                              <td key={tier.value} className="text-center p-3">
                                {isFeatureIncluded(fk, tier.value, cat.value) ? (
                                  <Check className="w-5 h-5 text-green-500 mx-auto" />
                                ) : (
                                  <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                                )}
                              </td>
                            ))}
                            <td className="text-center p-3">
                              {f.isAddon ? (
                                <Badge variant="outline" className="text-[10px]">Yes</Badge>
                              ) : (
                                <span className="text-muted-foreground/40">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminPlanManagement;
