import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  FileSpreadsheet,
  Play,
  Check,
  Clock,
  Download,
  Eye,
  AlertTriangle,
  Calendar,
  Users,
  Banknote,
  Loader2,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";

interface PayrollRunsProps {
  salonId: string;
}

interface PayrollCycle {
  id: string;
  periodYear: number;
  periodMonth: number;
  periodStartDate: string;
  periodEndDate: string;
  status: 'draft' | 'processing' | 'pending_approval' | 'approved' | 'paid' | 'locked';
  totalStaffCount: number;
  totalGrossSalaryPaisa: number;
  totalCommissionsPaisa: number;
  totalDeductionsPaisa: number;
  totalNetPayablePaisa: number;
  processedAt?: string;
  approvedAt?: string;
}

export default function PayrollRuns({ salonId }: PayrollRunsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createMonth, setCreateMonth] = useState((new Date().getMonth() + 1).toString());
  const [createYear, setCreateYear] = useState(currentYear.toString());
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<PayrollCycle | null>(null);

  const createCycleMutation = useMutation({
    mutationFn: async (data: { periodMonth: number; periodYear: number }) => {
      const response = await apiRequest('POST', `/api/salons/${salonId}/payroll-cycles`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payroll cycle');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-cycles', salonId] });
      toast({ title: "Success", description: "Payroll cycle created successfully" });
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error('Create cycle error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const processCycleMutation = useMutation({
    mutationFn: async (cycleId: string) => {
      const response = await apiRequest('POST', `/api/salons/${salonId}/payroll-cycles/${cycleId}/process`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process payroll');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-cycles', salonId] });
      toast({ title: "Success", description: "Payroll processed successfully" });
      setProcessDialogOpen(false);
      setSelectedCycle(null);
    },
    onError: (error: Error) => {
      console.error('Process cycle error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleCreateCycle = () => {
    createCycleMutation.mutate({
      periodMonth: parseInt(createMonth),
      periodYear: parseInt(createYear)
    });
  };

  const handleProcessCycle = (cycle: PayrollCycle) => {
    setSelectedCycle(cycle);
    setProcessDialogOpen(true);
  };

  const { data: payrollCycles, isLoading } = useQuery<PayrollCycle[]>({
    queryKey: ['payroll-cycles', salonId, selectedYear],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/salons/${salonId}/payroll-cycles?year=${selectedYear}`);
        return await response.json();
      } catch (error) {
        return [];
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

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="text-gray-600">Draft</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Processing</Badge>;
      case 'pending_approval':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending Approval</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Approved</Badge>;
      case 'paid':
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Paid</Badge>;
      case 'locked':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Locked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const currentMonth = new Date().getMonth() + 1;
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payroll Runs</h2>
          <p className="text-muted-foreground">Process and manage monthly payroll cycles</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Play className="h-4 w-4 mr-2" />
            Start Payroll Run
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{getMonthName(currentMonth)} {currentYear}</div>
            <p className="text-xs text-muted-foreground">Current payroll period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cycles</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrollCycles?.length || 0}</div>
            <p className="text-xs text-muted-foreground">In {selectedYear}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {payrollCycles?.filter(c => c.status === 'paid').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Completed cycles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {payrollCycles?.filter(c => ['draft', 'processing', 'pending_approval'].includes(c.status)).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Requires action</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll History</CardTitle>
          <CardDescription>View past and current payroll cycles</CardDescription>
        </CardHeader>
        <CardContent>
          {(payrollCycles || []).length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Payroll Cycles</h3>
              <p className="text-muted-foreground mt-1">
                Start your first payroll run to process staff salaries and commissions
              </p>
              <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                <Play className="h-4 w-4 mr-2" />
                Start First Payroll
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Staff Count</TableHead>
                    <TableHead>Gross Salary</TableHead>
                    <TableHead>Commissions</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Payable</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(payrollCycles || []).map((cycle) => (
                    <TableRow key={cycle.id}>
                      <TableCell className="font-medium">
                        {getMonthName(cycle.periodMonth)} {cycle.periodYear}
                      </TableCell>
                      <TableCell>{cycle.totalStaffCount}</TableCell>
                      <TableCell>{formatCurrency(cycle.totalGrossSalaryPaisa)}</TableCell>
                      <TableCell>{formatCurrency(cycle.totalCommissionsPaisa)}</TableCell>
                      <TableCell className="text-red-600">
                        -{formatCurrency(cycle.totalDeductionsPaisa)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(cycle.totalNetPayablePaisa)}
                      </TableCell>
                      <TableCell>{getStatusBadge(cycle.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {cycle.status === 'draft' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleProcessCycle(cycle)}
                              disabled={processCycleMutation.isPending}
                            >
                              {processCycleMutation.isPending && selectedCycle?.id === cycle.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-1" />
                                  Process
                                </>
                              )}
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileSpreadsheet className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900">How Payroll Processing Works</h3>
              <div className="mt-3 grid gap-4 md:grid-cols-4">
                <div className="flex items-start gap-2">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-200 text-purple-700 font-bold text-xs">1</div>
                  <div>
                    <p className="font-medium text-purple-800 text-sm">Start Cycle</p>
                    <p className="text-xs text-purple-600">Create new payroll run</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-200 text-purple-700 font-bold text-xs">2</div>
                  <div>
                    <p className="font-medium text-purple-800 text-sm">Calculate</p>
                    <p className="text-xs text-purple-600">Salary + Commission - Leaves</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-200 text-purple-700 font-bold text-xs">3</div>
                  <div>
                    <p className="font-medium text-purple-800 text-sm">Review & Approve</p>
                    <p className="text-xs text-purple-600">Verify all entries</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-200 text-purple-700 font-bold text-xs">4</div>
                  <div>
                    <p className="font-medium text-purple-800 text-sm">Process Payment</p>
                    <p className="text-xs text-purple-600">Mark as paid</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start Payroll Run</DialogTitle>
            <DialogDescription>
              Create a new payroll cycle for the selected month
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={createMonth} onValueChange={setCreateMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <SelectItem key={month} value={month.toString()}>
                        {getMonthName(month)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={createYear} onValueChange={setCreateYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              This will create a payroll cycle for{' '}
              <span className="font-medium">{getMonthName(parseInt(createMonth))} {createYear}</span>. 
              Once created, you can process it to calculate staff salaries.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={createCycleMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCycle} disabled={createCycleMutation.isPending}>
              {createCycleMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Create Cycle
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Process Payroll Cycle</AlertDialogTitle>
            <AlertDialogDescription>
              This will calculate salaries, commissions, and deductions for all staff members 
              in {selectedCycle && getMonthName(selectedCycle.periodMonth)} {selectedCycle?.periodYear}.
              <br /><br />
              The system will:
              <ul className="list-disc ml-4 mt-2 space-y-1">
                <li>Calculate base salaries and hourly wages</li>
                <li>Add commissions and tips earned</li>
                <li>Apply deductions (PF, ESI, Professional Tax)</li>
                <li>Account for approved leave and LWP</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processCycleMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedCycle && processCycleMutation.mutate(selectedCycle.id)}
              disabled={processCycleMutation.isPending}
            >
              {processCycleMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Process Payroll
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
