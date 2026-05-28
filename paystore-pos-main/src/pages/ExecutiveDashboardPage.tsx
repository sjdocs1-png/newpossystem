import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, Globe, Sparkles, ChevronRight, 
  Calendar, Filter, Share2, MessageSquare, ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const mrrData = [
  { month: 'JAN', value: 2.8 }, { month: 'FEB', value: 3.1 }, { month: 'MAR', value: 3.4 },
  { month: 'APR', value: 3.6 }, { month: 'MAY', value: 3.9 }, { month: 'JUN', value: 4.2 },
];

const geoData = [
  { region: 'MENA', value: 42, color: 'hsl(var(--primary))' },
  { region: 'EU', value: 31, color: 'hsl(var(--success))' },
  { region: 'US', value: 23, color: 'hsl(var(--warning))' },
];

const segmentData = [
  { name: 'Enterprise', value: 68, color: 'hsl(var(--primary))' },
  { name: 'Professional', value: 22, color: 'hsl(var(--success))' },
  { name: 'Starter', value: 10, color: 'hsl(var(--muted-foreground))' },
];

const kpis = [
  { label: 'MRR', value: '$4.2M', trend: '+8.2%', up: true, span: 2 },
  { label: 'Store Growth', value: '+12.5%', trend: '+1.4%', up: true },
  { label: 'Retention Rate', value: '94.2%', trend: '+0.5%', up: true },
  { label: 'ARPS', value: '$1,240', trend: '-2.1%', up: false },
  { label: 'Churn Rate', value: '2.1%', trend: '-0.3%', up: true },
];

const strategicEvents = [
  { icon: '🎯', title: 'Milestone Reached', desc: '10k+ active stores in MENA', color: 'text-success' },
  { icon: '🚀', title: 'New Market Entry', desc: 'Beta launch in Brazil successful', color: 'text-primary' },
  { icon: '⚠️', title: 'Churn Alert', desc: 'Lapsed accounts in EU sector +2%', color: 'text-warning' },
];

const aiInsights = [
  { tag: 'EXPANSION', tagColor: 'bg-primary', title: 'GCC Market Opportunity', desc: 'High demand signals detected in Qatar and Bahrain markets based on competitor analysis.' },
  { tag: 'OPTIMIZATION', tagColor: 'bg-destructive', title: 'Pricing Optimization', desc: 'Enterprise tier shows 15% price elasticity — consider A/B testing a 5% increase.' },
];

const ExecutiveDashboardPage: React.FC = () => {
  const [dateRange, setDateRange] = useState('Last 30 days');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              Executive Dashboard
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Share2 className="w-3.5 h-3.5" />
              </Button>
            </h1>
            <p className="text-xs text-muted-foreground">PayStore POS • Strategic</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 pb-24">
        {/* Filters */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5">
            <Calendar className="w-3 h-3" /> {dateRange}
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5">
            <Filter className="w-3 h-3" /> All Regions
          </Button>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-3">
          {kpis.map((kpi, i) => (
            <div
              key={i}
              className={cn(
                'bg-card border border-border rounded-2xl p-4',
                i === 0 && 'col-span-2'
              )}
            >
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{kpi.label}</p>
              <p className={cn('font-bold mt-1', i === 0 ? 'text-3xl' : 'text-2xl')}>{kpi.value}</p>
              <p className={cn('text-xs font-medium flex items-center gap-0.5 mt-0.5', kpi.up ? 'text-success' : 'text-destructive')}>
                {kpi.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {kpi.trend}
              </p>
            </div>
          ))}
        </div>

        {/* MRR Growth Chart */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">MRR Growth Over Time</p>
            <span className="text-[10px] text-muted-foreground">● Forecast</span>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mrrData}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `$${v}M`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => [`$${v}M`, 'MRR']}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm font-semibold text-foreground mb-4">Geographic Distribution</p>
          <div className="space-y-3">
            {geoData.map((geo, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-foreground font-medium">{geo.region}</span>
                  <span className="text-primary font-bold">{geo.value}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${geo.value}%`, backgroundColor: geo.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button className="text-xs text-primary font-medium mt-3 flex items-center gap-1">
            View Regional Breakdown <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* AI Strategic Insights */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">AI Strategic Insights</h2>
          </div>

          {aiInsights.map((insight, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={cn('text-[10px] font-bold tracking-widest text-primary-foreground px-2 py-0.5 rounded', insight.tagColor)}>
                  {insight.tag}
                </span>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-foreground text-sm">{insight.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.desc}</p>
            </div>
          ))}
        </div>

        {/* Segmentation by Plan */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm font-semibold text-foreground mb-4">Segmentation by Plan</p>
          <div className="flex items-center gap-4">
            <div className="w-28 h-28 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {segmentData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-foreground">68%</span>
                <span className="text-[8px] text-muted-foreground uppercase">Enterprise</span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {segmentData.map((seg, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="text-foreground">{seg.name} ({seg.value}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Strategic Events */}
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3">Recent Strategic Events</h2>
          <div className="space-y-2">
            {strategicEvents.map((event, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                <span className="text-2xl">{event.icon}</span>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground text-sm">{event.title}</h3>
                  <p className="text-xs text-muted-foreground">{event.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboardPage;
