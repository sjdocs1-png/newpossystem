import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Calculator, Target, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

const forecastData = [
  { month: "Mar", revenue: 285000, expenses: 195000, profit: 90000, forecast: 290000 },
  { month: "Apr", revenue: 310000, expenses: 205000, profit: 105000, forecast: 315000 },
  { month: "May", revenue: 340000, expenses: 210000, profit: 130000, forecast: 345000 },
  { month: "Jun", revenue: 365000, expenses: 220000, profit: 145000, forecast: 370000 },
  { month: "Jul", revenue: 0, expenses: 0, profit: 0, forecast: 395000 },
  { month: "Aug", revenue: 0, expenses: 0, profit: 0, forecast: 420000 },
  { month: "Sep", revenue: 0, expenses: 0, profit: 0, forecast: 445000 },
  { month: "Oct", revenue: 0, expenses: 0, profit: 0, forecast: 465000 },
  { month: "Nov", revenue: 0, expenses: 0, profit: 0, forecast: 490000 },
  { month: "Dec", revenue: 0, expenses: 0, profit: 0, forecast: 520000 },
];

const breakdownData = [
  { source: "Dine-in", current: 180000, projected: 210000 },
  { source: "Takeaway", current: 95000, projected: 115000 },
  { source: "Online", current: 55000, projected: 80000 },
  { source: "Delivery", current: 35000, projected: 60000 },
];

const RevenueForecastPage = () => {
  const [growthRate, setGrowthRate] = useState([8]);
  const [seasonalFactor, setSeasonalFactor] = useState([5]);
  const [timeRange, setTimeRange] = useState("6months");

  const adjustedForecast = forecastData.map((d) => ({
    ...d,
    simulated: d.forecast ? Math.round(d.forecast * (1 + (growthRate[0] - 8) / 100) * (1 + (seasonalFactor[0] - 5) / 100)) : 0,
  }));

  const totalRevenue = 365000;
  const totalExpenses = 220000;
  const totalProfit = totalRevenue - totalExpenses;
  const profitMargin = ((totalProfit / totalRevenue) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">📈 Revenue Forecast</h1>
            <p className="text-xs text-muted-foreground">AI-powered predictions</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[110px] h-8 text-xs rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">3 Months</SelectItem>
                <SelectItem value="6months">6 Months</SelectItem>
                <SelectItem value="1year">1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 pb-24">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Expected Revenue</p>
                <p className="text-2xl font-bold text-foreground mt-1">₹3.65L</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">+12.4%</span>
                  <span className="text-xs text-muted-foreground">vs last month</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Expenses</p>
                <p className="text-2xl font-bold text-foreground mt-1">₹2.20L</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-red-500 font-medium">+4.8%</span>
                  <span className="text-xs text-muted-foreground">vs last month</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Net Profit</p>
                <p className="text-2xl font-bold text-foreground mt-1">₹1.45L</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">+18.2%</span>
                  <span className="text-xs text-muted-foreground">vs last month</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Profit Margin</p>
                <p className="text-2xl font-bold text-foreground mt-1">{profitMargin}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">+2.1%</span>
                  <span className="text-xs text-muted-foreground">improvement</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                <Target className="w-5 h-5 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forecast Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue & Forecast Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={adjustedForecast}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} className="text-xs" />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, ""]} />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="Actual Revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="forecast" name="AI Forecast" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.1} strokeDasharray="6 3" strokeWidth={2} />
                <Area type="monotone" dataKey="simulated" name="Simulated" stroke="hsl(var(--chart-4))" fill="hsl(var(--chart-4))" fillOpacity={0.08} strokeDasharray="3 3" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Simulator */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="w-4 h-4" /> Scenario Simulator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Growth Rate</span>
                <span className="font-semibold text-foreground">{growthRate[0]}%</span>
              </div>
              <Slider value={growthRate} onValueChange={setGrowthRate} min={0} max={25} step={1} />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Conservative</span>
                <span>Aggressive</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Seasonal Factor</span>
                <span className="font-semibold text-foreground">{seasonalFactor[0]}%</span>
              </div>
              <Slider value={seasonalFactor} onValueChange={setSeasonalFactor} min={-10} max={20} step={1} />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Off-season</span>
                <span>Peak</span>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Simulated Q3 Forecast</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Revenue</span>
                  <span className="font-semibold text-foreground">
                    ₹{(adjustedForecast.slice(4, 7).reduce((s, d) => s + d.simulated, 0) / 100000).toFixed(1)}L
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Projected Profit</span>
                  <span className="font-semibold text-green-600">
                    ₹{((adjustedForecast.slice(4, 7).reduce((s, d) => s + d.simulated, 0) * 0.38) / 100000).toFixed(1)}L
                  </span>
                </div>
              </div>
            </div>

            <Button className="w-full" size="sm" variant="outline">
              Export Forecast Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Revenue by Source — Current vs Projected</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={breakdownData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="source" className="text-xs" />
              <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} className="text-xs" />
              <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, ""]} />
              <Legend />
              <Bar dataKey="current" name="Current" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="projected" name="Projected" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default RevenueForecastPage;
