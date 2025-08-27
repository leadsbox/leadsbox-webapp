import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, Receipt, Users, TrendingUp, MessageSquare, CheckSquare, Calendar, DollarSign, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import { mockAnalytics, getTodayTasks, getOverdueTasks, mockLeads } from '@/data/mockData';

const quickActions = [
  {
    title: 'Create Invoice',
    description: 'Generate a new invoice',
    icon: FileText,
    color: 'bg-blue-500 hover:bg-blue-600',
    href: '/dashboard/invoices/new',
  },
  {
    title: 'Add Receipt',
    description: 'Record a payment receipt',
    icon: Receipt,
    color: 'bg-green-500 hover:bg-green-600',
    href: '/dashboard/receipts/new',
  },
  {
    title: 'New Lead',
    description: 'Add a new potential customer',
    icon: Users,
    color: 'bg-purple-500 hover:bg-purple-600',
    href: '/dashboard/leads/new',
  },
];

const chartConfig = {
  leads: {
    label: 'Leads',
    color: 'hsl(var(--primary))',
  },
  conversions: {
    label: 'Conversions',
    color: 'hsl(var(--secondary))',
  },
};

export default function DashboardHomePage() {
  const [timeRange, setTimeRange] = useState('7d');
  const analytics = mockAnalytics;
  const todayTasks = getTodayTasks();
  const overdueTasks = getOverdueTasks();
  const recentLeads = mockLeads.slice(0, 3);

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your business.
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.title}
              asChild
              className={`${action.color} text-white border-0 hover:shadow-lg transition-all duration-200`}
            >
              <Link to={action.href} className="flex items-center gap-2">
                <action.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{action.title}</span>
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalLeads}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+12.5%</span>
              <span>from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threads</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.activeThreads}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Activity className="h-3 w-3 text-blue-500" />
              <span className="text-blue-500">+3</span>
              <span>new today</span>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(analytics.overview.conversionRate)}</div>
            <Progress value={analytics.overview.conversionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.avgResponseTime}h</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 rotate-180" />
              <span className="text-green-500">-0.3h</span>
              <span>improvement</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leads Over Time Chart */}
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle>Leads Over Time</CardTitle>
            <CardDescription>Daily lead generation for the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.trends.leadsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Pipeline Stage Distribution */}
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle>Pipeline Distribution</CardTitle>
            <CardDescription>Leads by stage</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.trends.conversionsByStage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities and Tasks */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Leads */}
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Recent Leads</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/leads">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">{lead.name}</div>
                  <div className="text-sm text-muted-foreground">{lead.company}</div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      lead.stage === 'NEW' ? 'default' :
                      lead.stage === 'QUALIFIED' ? 'secondary' :
                      lead.stage === 'IN_PROGRESS' ? 'outline' :
                      lead.stage === 'WON' ? 'default' : 'destructive'
                    }
                  >
                    {lead.stage}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">
                    {lead.value ? formatCurrency(lead.value) : 'No value'}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Today's Tasks</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/tasks">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tasks scheduled for today
              </p>
            ) : (
              todayTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-muted-foreground">{task.type}</div>
                  </div>
                  <Badge
                    variant={
                      task.priority === 'HIGH' ? 'destructive' :
                      task.priority === 'MEDIUM' ? 'default' : 'secondary'
                    }
                  >
                    {task.priority}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Tasks Due Today</span>
              </div>
              <Badge variant="outline">{todayTasks.length}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-destructive" />
                <span className="text-sm">Overdue Tasks</span>
              </div>
              <Badge variant="destructive">{overdueTasks.length}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Pipeline Value</span>
              </div>
              <div className="text-sm font-medium">
                {formatCurrency(mockLeads.reduce((sum, lead) => sum + (lead.value || 0), 0))}
              </div>
            </div>
            
            <div className="pt-2">
              <Button asChild className="w-full" variant="outline">
                <Link to="/dashboard/analytics">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Detailed Analytics
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}