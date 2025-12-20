import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Wallet,
  Users,
  CalendarOff,
  FileSpreadsheet,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Banknote,
  ArrowRight
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface PayrollOverviewProps {
  salonId: string;
}

export default function PayrollOverview({ salonId }: PayrollOverviewProps) {
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  interface PayrollStats {
    totalStaff: number;
    activePayrollCycle: { status: string } | null;
    pendingLeaveRequests: number;
    pendingOnboarding: number;
    pendingExits: number;
    totalPayablePaisa: number;
    lastPayrollDate: string | null;
  }

  const { data: payrollStats, isLoading } = useQuery<PayrollStats>({
    queryKey: ['payroll-stats', salonId],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/salons/${salonId}/payroll/stats`);
        return await response.json();
      } catch (error) {
        return {
          totalStaff: 0,
          activePayrollCycle: null,
          pendingLeaveRequests: 0,
          pendingOnboarding: 0,
          pendingExits: 0,
          totalPayablePaisa: 0,
          lastPayrollDate: null
        };
      }
    },
    enabled: !!salonId,
    staleTime: 30000
  });

  const formatCurrency = (paisa: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(paisa / 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payroll Overview</h2>
          <p className="text-muted-foreground">
            Manage staff salaries, leaves, and payroll for {currentMonth}
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Clock className="h-3 w-3 mr-1" />
          Current Period: {currentMonth}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{payrollStats?.totalStaff || 0}</div>
            <p className="text-xs text-blue-600 mt-1">Active team members</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Monthly Payable</CardTitle>
            <Banknote className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(payrollStats?.totalPayablePaisa || 0)}
            </div>
            <p className="text-xs text-green-600 mt-1">Estimated this month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Pending Leaves</CardTitle>
            <CalendarOff className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">{payrollStats?.pendingLeaveRequests || 0}</div>
            <p className="text-xs text-amber-600 mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Payroll Status</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {payrollStats?.activePayrollCycle ? (
                <>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    {payrollStats.activePayrollCycle.status}
                  </Badge>
                </>
              ) : (
                <Badge variant="outline" className="text-gray-500">No Active Cycle</Badge>
              )}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              {payrollStats?.lastPayrollDate 
                ? `Last run: ${formatDistanceToNow(new Date(payrollStats.lastPayrollDate))} ago`
                : 'No payroll run yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Action Required
            </CardTitle>
            <CardDescription>Items that need your attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(payrollStats?.pendingLeaveRequests || 0) > 0 && (
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-3">
                  <CalendarOff className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-900">{payrollStats?.pendingLeaveRequests} Leave Requests</p>
                    <p className="text-sm text-amber-700">Pending approval</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-amber-700">
                  Review <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {(payrollStats?.pendingOnboarding || 0) > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">{payrollStats?.pendingOnboarding} Staff Onboarding</p>
                    <p className="text-sm text-blue-700">Incomplete profiles</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-blue-700">
                  Complete <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {(payrollStats?.pendingExits || 0) > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-900">{payrollStats?.pendingExits} Pending Settlements</p>
                    <p className="text-sm text-red-700">Exit clearance required</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-red-700">
                  Process <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {(payrollStats?.pendingLeaveRequests || 0) === 0 && 
             (payrollStats?.pendingOnboarding || 0) === 0 && 
             (payrollStats?.pendingExits || 0) === 0 && (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-green-700">All caught up! No pending actions.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common payroll tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start h-auto py-3" disabled>
              <FileSpreadsheet className="h-5 w-5 mr-3 text-purple-600" />
              <div className="text-left">
                <p className="font-medium">Run Monthly Payroll</p>
                <p className="text-sm text-muted-foreground">Process payroll for {currentMonth}</p>
              </div>
            </Button>

            <Button variant="outline" className="w-full justify-start h-auto py-3" disabled>
              <Users className="h-5 w-5 mr-3 text-blue-600" />
              <div className="text-left">
                <p className="font-medium">Add New Staff</p>
                <p className="text-sm text-muted-foreground">Onboard a new team member</p>
              </div>
            </Button>

            <Button variant="outline" className="w-full justify-start h-auto py-3" disabled>
              <Banknote className="h-5 w-5 mr-3 text-green-600" />
              <div className="text-left">
                <p className="font-medium">Update Salary Structure</p>
                <p className="text-sm text-muted-foreground">Modify staff compensation</p>
              </div>
            </Button>

            <Button variant="outline" className="w-full justify-start h-auto py-3" disabled>
              <CalendarOff className="h-5 w-5 mr-3 text-amber-600" />
              <div className="text-left">
                <p className="font-medium">Configure Leave Policies</p>
                <p className="text-sm text-muted-foreground">Set up leave types and rules</p>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started with Staff Payroll</CardTitle>
          <CardDescription>Complete these steps to set up payroll for your team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">1</div>
              <div>
                <p className="font-medium">Configure Leave Types</p>
                <p className="text-sm text-muted-foreground">Set up CL, SL, EL policies</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">2</div>
              <div>
                <p className="font-medium">Set Up Staff Salaries</p>
                <p className="text-sm text-muted-foreground">Define compensation model</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">3</div>
              <div>
                <p className="font-medium">Complete Onboarding</p>
                <p className="text-sm text-muted-foreground">Add employment details</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">4</div>
              <div>
                <p className="font-medium">Run First Payroll</p>
                <p className="text-sm text-muted-foreground">Process monthly payroll</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
