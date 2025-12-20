import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UserMinus,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Search,
  Eye,
  Calculator,
  Banknote,
  Loader2
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface StaffExitProps {
  salonId: string;
}

interface ExitRecord {
  id: string;
  staffId: string;
  staffName: string;
  exitType: 'resignation' | 'termination' | 'contract_end' | 'retirement' | 'absconding';
  exitReason?: string;
  resignationDate?: string;
  lastWorkingDate: string;
  noticePeriodServed: number;
  noticePeriodShortfall: number;
  pendingCommissionsPaisa: number;
  pendingTipsPaisa: number;
  leaveEncashmentPaisa: number;
  netSettlementPaisa: number;
  settlementStatus: 'pending' | 'calculated' | 'approved' | 'paid' | 'completed';
  createdAt: string;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  employmentProfile?: {
    id: string;
    noticePeriodDays: number;
  };
}

const initiateExitSchema = z.object({
  staffId: z.string().min(1, 'Please select a staff member'),
  exitType: z.enum(['resignation', 'termination', 'contract_end', 'retirement', 'absconding']),
  exitReason: z.string().optional(),
  resignationDate: z.string().optional(),
  lastWorkingDate: z.string().min(1, 'Last working date is required')
});

type InitiateExitFormData = z.infer<typeof initiateExitSchema>;

export default function StaffExit({ salonId }: StaffExitProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);

  const exitForm = useForm<InitiateExitFormData>({
    resolver: zodResolver(initiateExitSchema),
    defaultValues: {
      staffId: '',
      exitType: 'resignation',
      exitReason: '',
      resignationDate: format(new Date(), 'yyyy-MM-dd'),
      lastWorkingDate: ''
    }
  });

  const { data: staffList } = useQuery<StaffMember[]>({
    queryKey: ['staff-for-exit', salonId],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/salons/${salonId}/staff`);
        return await response.json();
      } catch (error) {
        return [];
      }
    },
    enabled: !!salonId && isExitDialogOpen
  });

  const initiateExitMutation = useMutation({
    mutationFn: async (data: InitiateExitFormData) => {
      const response = await apiRequest('POST', `/api/salons/${salonId}/staff/${data.staffId}/exit`, {
        exitType: data.exitType,
        exitReason: data.exitReason,
        resignationDate: data.resignationDate,
        lastWorkingDate: data.lastWorkingDate
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initiate exit');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exit-records', salonId] });
      toast({ title: "Success", description: "Staff exit initiated successfully" });
      setIsExitDialogOpen(false);
      exitForm.reset();
    },
    onError: (error: Error) => {
      console.error('Initiate exit error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const onSubmitExit = (data: InitiateExitFormData) => {
    initiateExitMutation.mutate(data);
  };

  const { data: exitRecords, isLoading } = useQuery<ExitRecord[]>({
    queryKey: ['exit-records', salonId],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/salons/${salonId}/exit-records`);
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

  const getExitTypeBadge = (type: string) => {
    switch (type) {
      case 'resignation':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Resignation</Badge>;
      case 'termination':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Termination</Badge>;
      case 'contract_end':
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Contract End</Badge>;
      case 'retirement':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Retirement</Badge>;
      case 'absconding':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Absconding</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getSettlementStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>;
      case 'calculated':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Calculated</Badge>;
      case 'approved':
        return <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">Approved</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Paid</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingExits = (exitRecords || []).filter(r => ['pending', 'calculated', 'approved'].includes(r.settlementStatus));
  const completedExits = (exitRecords || []).filter(r => ['paid', 'completed'].includes(r.settlementStatus));

  const stats = {
    total: exitRecords?.length || 0,
    pending: pendingExits.length,
    completed: completedExits.length,
    totalSettlementDue: pendingExits.reduce((sum, r) => sum + r.netSettlementPaisa, 0)
  };

  const clearanceChecklist = [
    { id: 'uniform', label: 'Uniform Returned', description: 'All uniforms and work attire' },
    { id: 'id_card', label: 'ID Card Returned', description: 'Employee ID and access cards' },
    { id: 'tools', label: 'Tools & Equipment', description: 'Salon tools and equipment' },
    { id: 'keys', label: 'Keys Returned', description: 'Salon and locker keys' },
    { id: 'documents', label: 'Documents Cleared', description: 'Experience letter issued' },
    { id: 'pending_dues', label: 'Dues Cleared', description: 'All advances recovered' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Exit & Settlement</h2>
          <p className="text-muted-foreground">Manage staff exits and final settlements</p>
        </div>
        <Button onClick={() => setIsExitDialogOpen(true)}>
          <UserMinus className="h-4 w-4 mr-2" />
          Initiate Exit
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exits</CardTitle>
            <UserMinus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Settlement</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Requires action</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Fully settled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settlement Due</CardTitle>
            <Banknote className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalSettlementDue)}</div>
            <p className="text-xs text-muted-foreground">Pending payment</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Exits
            {stats.pending > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {stats.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed
          </TabsTrigger>
          <TabsTrigger value="clearance" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Clearance Checklist
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Settlements</CardTitle>
              <CardDescription>Staff exits awaiting final settlement</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingExits.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-medium">All Caught Up!</h3>
                  <p className="text-muted-foreground mt-1">
                    No pending staff exits to process
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Member</TableHead>
                        <TableHead>Exit Type</TableHead>
                        <TableHead>Last Working Day</TableHead>
                        <TableHead>Settlement Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingExits.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.staffName}</TableCell>
                          <TableCell>{getExitTypeBadge(record.exitType)}</TableCell>
                          <TableCell>{format(new Date(record.lastWorkingDate), 'dd MMM yyyy')}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(record.netSettlementPaisa)}</TableCell>
                          <TableCell>{getSettlementStatusBadge(record.settlementStatus)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" disabled>
                                <Calculator className="h-4 w-4 mr-1" />
                                Calculate
                              </Button>
                              <Button variant="outline" size="sm" disabled>
                                <Eye className="h-4 w-4 mr-1" />
                                View
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
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Exits</CardTitle>
              <CardDescription>Staff exits with completed settlements</CardDescription>
            </CardHeader>
            <CardContent>
              {completedExits.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Completed Exits</h3>
                  <p className="text-muted-foreground mt-1">
                    Completed exit settlements will appear here
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Member</TableHead>
                        <TableHead>Exit Type</TableHead>
                        <TableHead>Last Working Day</TableHead>
                        <TableHead>Settlement Paid</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedExits.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.staffName}</TableCell>
                          <TableCell>{getExitTypeBadge(record.exitType)}</TableCell>
                          <TableCell>{format(new Date(record.lastWorkingDate), 'dd MMM yyyy')}</TableCell>
                          <TableCell className="font-semibold text-green-600">{formatCurrency(record.netSettlementPaisa)}</TableCell>
                          <TableCell>{getSettlementStatusBadge(record.settlementStatus)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" disabled>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exit Clearance Checklist</CardTitle>
              <CardDescription>Items to verify before completing staff exit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {clearanceChecklist.map((item, index) => (
                  <div key={item.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 text-purple-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-900">Settlement Calculation</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Final settlement includes: Pending Commissions + Tips + Leave Encashment + Gratuity 
                    - Notice Period Recovery - Advance Outstanding - Other Recoveries
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    Ensure all items are verified before processing final payment.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Initiate Staff Exit</DialogTitle>
            <DialogDescription>
              Start the exit process for a staff member
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={exitForm.handleSubmit(onSubmitExit)}>
            <fieldset disabled={initiateExitMutation.isPending}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Select Staff Member</Label>
                  <Select
                    value={exitForm.watch('staffId')}
                    onValueChange={(value) => exitForm.setValue('staffId', value)}
                    disabled={initiateExitMutation.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {(staffList || []).map(staff => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name} ({staff.email || staff.phone})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {exitForm.formState.errors.staffId && (
                    <p className="text-sm text-red-500">{exitForm.formState.errors.staffId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Exit Type</Label>
                  <Select
                    value={exitForm.watch('exitType')}
                    onValueChange={(value: any) => exitForm.setValue('exitType', value)}
                    disabled={initiateExitMutation.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select exit type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resignation">Resignation</SelectItem>
                      <SelectItem value="termination">Termination</SelectItem>
                      <SelectItem value="contract_end">Contract End</SelectItem>
                      <SelectItem value="retirement">Retirement</SelectItem>
                      <SelectItem value="absconding">Absconding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="resignationDate">Resignation/Notice Date</Label>
                    <Input
                      id="resignationDate"
                      type="date"
                      {...exitForm.register('resignationDate')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastWorkingDate">Last Working Date</Label>
                    <Input
                      id="lastWorkingDate"
                      type="date"
                      {...exitForm.register('lastWorkingDate')}
                    />
                    {exitForm.formState.errors.lastWorkingDate && (
                      <p className="text-sm text-red-500">{exitForm.formState.errors.lastWorkingDate.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exitReason">Reason for Exit (optional)</Label>
                  <Textarea
                    id="exitReason"
                    placeholder="Enter reason for exit..."
                    {...exitForm.register('exitReason')}
                  />
                </div>
              </div>
            </fieldset>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsExitDialogOpen(false);
                  exitForm.reset();
                }}
                disabled={initiateExitMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={initiateExitMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {initiateExitMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Initiating...
                  </>
                ) : (
                  <>
                    <UserMinus className="h-4 w-4 mr-2" />
                    Initiate Exit
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
