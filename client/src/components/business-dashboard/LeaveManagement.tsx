import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarOff,
  Plus,
  Settings,
  Check,
  X,
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  FileText,
  Edit,
  Trash2,
  Loader2,
  Save
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface LeaveManagementProps {
  salonId: string;
}

interface LeaveType {
  id: string;
  name: string;
  code: string;
  annualQuota: number;
  isPaid: boolean;
  allowCarryForward: boolean;
  maxCarryForwardDays: number;
  allowEncashment: boolean;
  isActive: boolean;
}

interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  isPaid: boolean;
  createdAt: string;
}

const createLeaveTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required').max(5, 'Code must be 5 characters or less'),
  annualQuota: z.coerce.number().int().min(0).default(0),
  isPaid: z.boolean().default(true),
  allowCarryForward: z.boolean().default(false),
  maxCarryForwardDays: z.coerce.number().int().min(0).default(0),
  allowEncashment: z.boolean().default(false),
  encashmentRatePercent: z.coerce.number().min(0).max(100).default(100),
  minDaysForEncashment: z.coerce.number().int().min(0).default(0)
});

type CreateLeaveTypeFormData = z.infer<typeof createLeaveTypeSchema>;

export default function LeaveManagement({ salonId }: LeaveManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("requests");
  const [isAddLeaveTypeDialogOpen, setIsAddLeaveTypeDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const leaveTypeForm = useForm<CreateLeaveTypeFormData>({
    resolver: zodResolver(createLeaveTypeSchema),
    defaultValues: {
      name: '',
      code: '',
      annualQuota: 12,
      isPaid: true,
      allowCarryForward: false,
      maxCarryForwardDays: 0,
      allowEncashment: false,
      encashmentRatePercent: 100,
      minDaysForEncashment: 0
    }
  });

  const createLeaveTypeMutation = useMutation({
    mutationFn: async (data: CreateLeaveTypeFormData) => {
      const response = await apiRequest('POST', `/api/salons/${salonId}/leave-types`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create leave type');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types', salonId] });
      toast({ title: "Success", description: "Leave type created successfully" });
      setIsAddLeaveTypeDialogOpen(false);
      leaveTypeForm.reset();
    },
    onError: (error: Error) => {
      console.error('Create leave type error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await apiRequest('PUT', `/api/salons/${salonId}/leave-requests/${requestId}/approve`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve request');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests', salonId] });
      toast({ title: "Success", description: "Leave request approved" });
      setApproveDialogOpen(false);
      setSelectedRequest(null);
    },
    onError: (error: Error) => {
      console.error('Approve request error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const response = await apiRequest('PUT', `/api/salons/${salonId}/leave-requests/${requestId}/reject`, { reason });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject request');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests', salonId] });
      toast({ title: "Success", description: "Leave request rejected" });
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectReason("");
    },
    onError: (error: Error) => {
      console.error('Reject request error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleApprove = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setApproveDialogOpen(true);
  };

  const handleReject = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };

  const onSubmitLeaveType = (data: CreateLeaveTypeFormData) => {
    createLeaveTypeMutation.mutate(data);
  };

  const { data: leaveTypes, isLoading: loadingTypes } = useQuery<LeaveType[]>({
    queryKey: ['leave-types', salonId],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/salons/${salonId}/leave-types`);
        return await response.json();
      } catch (error) {
        return [];
      }
    },
    enabled: !!salonId,
    staleTime: 30000
  });

  const { data: leaveRequests, isLoading: loadingRequests } = useQuery<LeaveRequest[]>({
    queryKey: ['leave-requests', salonId],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/salons/${salonId}/leave-requests`);
        return await response.json();
      } catch (error) {
        return [];
      }
    },
    enabled: !!salonId,
    staleTime: 30000
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rejected</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRequests = (leaveRequests || []).filter(request => {
    if (filterStatus === "all") return true;
    return request.status === filterStatus;
  });

  const pendingCount = (leaveRequests || []).filter(r => r.status === 'pending').length;

  const defaultLeaveTypes: LeaveType[] = [
    { id: '1', name: 'Casual Leave', code: 'CL', annualQuota: 12, isPaid: true, allowCarryForward: false, maxCarryForwardDays: 0, allowEncashment: false, isActive: true },
    { id: '2', name: 'Sick Leave', code: 'SL', annualQuota: 12, isPaid: true, allowCarryForward: false, maxCarryForwardDays: 0, allowEncashment: false, isActive: true },
    { id: '3', name: 'Earned Leave', code: 'EL', annualQuota: 15, isPaid: true, allowCarryForward: true, maxCarryForwardDays: 30, allowEncashment: true, isActive: true },
    { id: '4', name: 'Leave Without Pay', code: 'LWP', annualQuota: 0, isPaid: false, allowCarryForward: false, maxCarryForwardDays: 0, allowEncashment: false, isActive: true }
  ];

  const displayLeaveTypes = leaveTypes && leaveTypes.length > 0 ? leaveTypes : defaultLeaveTypes;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Leave Management</h2>
          <p className="text-muted-foreground">Configure leave policies and manage leave requests</p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="text-sm">
            {pendingCount} Pending Approval{pendingCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Leave Requests
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="types" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Leave Types
          </TabsTrigger>
          <TabsTrigger value="balances" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Staff Balances
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Leave Requests</CardTitle>
                  <CardDescription>Review and approve staff leave applications</CardDescription>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Requests</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Leave Requests</h3>
                  <p className="text-muted-foreground mt-1">
                    {filterStatus === 'pending' 
                      ? 'No pending leave requests to review'
                      : 'No leave requests found'}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Member</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.staffName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{request.leaveTypeCode}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{format(new Date(request.startDate), 'dd MMM')}</p>
                              <p className="text-muted-foreground">to {format(new Date(request.endDate), 'dd MMM yyyy')}</p>
                            </div>
                          </TableCell>
                          <TableCell>{request.numberOfDays}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{request.reason || '-'}</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell className="text-right">
                            {request.status === 'pending' ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleApprove(request)}
                                  disabled={approveRequestMutation.isPending || rejectRequestMutation.isPending}
                                >
                                  {approveRequestMutation.isPending && selectedRequest?.id === request.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleReject(request)}
                                  disabled={approveRequestMutation.isPending || rejectRequestMutation.isPending}
                                >
                                  {rejectRequestMutation.isPending && selectedRequest?.id === request.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <X className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                {request.status === 'approved' ? 'Approved' : request.status === 'rejected' ? 'Rejected' : 'Processed'}
                              </Badge>
                            )}
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

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Leave Types Configuration</CardTitle>
                  <CardDescription>Define leave policies and quotas for your salon</CardDescription>
                </div>
                <Button onClick={() => setIsAddLeaveTypeDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Leave Type
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {displayLeaveTypes.map((leaveType) => (
                  <Card key={leaveType.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{leaveType.name}</h4>
                            <Badge variant="outline" className="text-xs">{leaveType.code}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {leaveType.annualQuota > 0 
                              ? `${leaveType.annualQuota} days per year`
                              : 'Unlimited (unpaid)'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {leaveType.isPaid ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Paid</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Unpaid</Badge>
                          )}
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          {leaveType.allowCarryForward ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-muted-foreground">Carry Forward</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {leaveType.allowEncashment ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-muted-foreground">Encashment</span>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
                        <Button variant="ghost" size="sm" disabled>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900">Leave Policy Guidelines</h3>
                  <ul className="text-sm text-amber-700 mt-2 space-y-1">
                    <li>• CL (Casual Leave) - For personal work, short notice allowed</li>
                    <li>• SL (Sick Leave) - For health issues, may require medical certificate</li>
                    <li>• EL (Earned Leave) - Planned leaves, advance notice required</li>
                    <li>• LWP (Leave Without Pay) - Deducted from salary, use when balance exhausted</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Leave Balances</CardTitle>
              <CardDescription>Current leave balance for all staff members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Balances Configured</h3>
                <p className="text-muted-foreground mt-1">
                  Staff leave balances will appear here once leave types are configured
                  and staff onboarding is complete.
                </p>
                <Button variant="outline" className="mt-4" disabled>
                  Initialize Leave Balances
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddLeaveTypeDialogOpen} onOpenChange={(open) => {
        setIsAddLeaveTypeDialogOpen(open);
        if (!open) leaveTypeForm.reset();
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Leave Type</DialogTitle>
            <DialogDescription>
              Create a new leave type with policies and quotas
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={leaveTypeForm.handleSubmit(onSubmitLeaveType)}>
            <fieldset disabled={createLeaveTypeMutation.isPending}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Leave Type Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Casual Leave"
                    {...leaveTypeForm.register('name')}
                  />
                  {leaveTypeForm.formState.errors.name && (
                    <p className="text-sm text-red-500">{leaveTypeForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    placeholder="e.g., CL"
                    maxLength={5}
                    {...leaveTypeForm.register('code')}
                  />
                  {leaveTypeForm.formState.errors.code && (
                    <p className="text-sm text-red-500">{leaveTypeForm.formState.errors.code.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="annualQuota">Annual Quota (Days)</Label>
                  <Input
                    id="annualQuota"
                    type="number"
                    min={0}
                    {...leaveTypeForm.register('annualQuota')}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="isPaid"
                    checked={leaveTypeForm.watch('isPaid')}
                    onCheckedChange={(checked) => leaveTypeForm.setValue('isPaid', checked)}
                  />
                  <Label htmlFor="isPaid">Paid Leave</Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowCarryForward"
                    checked={leaveTypeForm.watch('allowCarryForward')}
                    onCheckedChange={(checked) => leaveTypeForm.setValue('allowCarryForward', checked)}
                  />
                  <Label htmlFor="allowCarryForward">Allow Carry Forward</Label>
                </div>
                {leaveTypeForm.watch('allowCarryForward') && (
                  <div className="ml-6 space-y-2">
                    <Label htmlFor="maxCarryForwardDays">Max Carry Forward Days</Label>
                    <Input
                      id="maxCarryForwardDays"
                      type="number"
                      min={0}
                      className="w-32"
                      {...leaveTypeForm.register('maxCarryForwardDays')}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowEncashment"
                    checked={leaveTypeForm.watch('allowEncashment')}
                    onCheckedChange={(checked) => leaveTypeForm.setValue('allowEncashment', checked)}
                  />
                  <Label htmlFor="allowEncashment">Allow Encashment</Label>
                </div>
                {leaveTypeForm.watch('allowEncashment') && (
                  <div className="ml-6 grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="encashmentRatePercent">Encashment Rate (%)</Label>
                      <Input
                        id="encashmentRatePercent"
                        type="number"
                        min={0}
                        max={100}
                        {...leaveTypeForm.register('encashmentRatePercent')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minDaysForEncashment">Min Days for Encashment</Label>
                      <Input
                        id="minDaysForEncashment"
                        type="number"
                        min={0}
                        {...leaveTypeForm.register('minDaysForEncashment')}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            </fieldset>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddLeaveTypeDialogOpen(false);
                  leaveTypeForm.reset();
                }}
                disabled={createLeaveTypeMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createLeaveTypeMutation.isPending}>
                {createLeaveTypeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Leave Type
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Leave Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve the leave request for{' '}
              <span className="font-medium">{selectedRequest?.staffName}</span>?
              <br /><br />
              <span className="text-muted-foreground">
                {selectedRequest?.leaveTypeName} ({selectedRequest?.numberOfDays} day{selectedRequest?.numberOfDays !== 1 ? 's' : ''})
                <br />
                From {selectedRequest?.startDate && format(new Date(selectedRequest.startDate), 'dd MMM yyyy')} to{' '}
                {selectedRequest?.endDate && format(new Date(selectedRequest.endDate), 'dd MMM yyyy')}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approveRequestMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRequest && approveRequestMutation.mutate(selectedRequest.id)}
              disabled={approveRequestMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveRequestMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                'Approve'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Leave Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject the leave request for{' '}
              <span className="font-medium">{selectedRequest?.staffName}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="rejectReason">Reason for Rejection (optional)</Label>
            <Textarea
              id="rejectReason"
              placeholder="Enter reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setRejectReason("")}
              disabled={rejectRequestMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRequest && rejectRequestMutation.mutate({ 
                requestId: selectedRequest.id, 
                reason: rejectReason 
              })}
              disabled={rejectRequestMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {rejectRequestMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
