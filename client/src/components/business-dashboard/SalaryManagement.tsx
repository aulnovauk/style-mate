import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Banknote,
  Users,
  Edit,
  Plus,
  Search,
  Filter,
  Building2,
  Clock,
  Wallet,
  TrendingUp,
  IndianRupee,
  Loader2,
  Save,
  X
} from "lucide-react";

interface SalaryManagementProps {
  salonId: string;
}

interface StaffWithSalary {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: string[];
  employmentProfile?: {
    id: string;
    employmentType: string;
    compensationModel: string;
    status: string;
    joiningDate?: string;
  };
  salaryComponent?: {
    id: string;
    baseSalaryPaisa: number;
    hourlyRatePaisa: number;
    totalAllowancesPaisa: number;
    totalDeductionsPaisa: number;
    effectiveFrom: string;
  };
}

const employmentProfileSchema = z.object({
  employeeCode: z.string().optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'freelancer']),
  compensationModel: z.enum(['fixed_salary', 'hourly', 'commission_only', 'salary_plus_commission']),
  joiningDate: z.string().optional(),
  probationEndDate: z.string().optional(),
  noticePeriodDays: z.coerce.number().int().min(0).default(30),
  preferredPayoutMethod: z.enum(['bank_transfer', 'upi', 'cash']).default('bank_transfer'),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfscCode: z.string().optional(),
  bankName: z.string().optional(),
  upiId: z.string().optional(),
  panNumber: z.string().optional(),
  aadharNumber: z.string().optional()
});

type EmploymentProfileFormData = z.infer<typeof employmentProfileSchema>;

const salaryComponentSchema = z.object({
  baseSalaryPaisa: z.coerce.number().int().min(0).default(0),
  hourlyRatePaisa: z.coerce.number().int().min(0).default(0),
  hraAllowancePaisa: z.coerce.number().int().min(0).default(0),
  travelAllowancePaisa: z.coerce.number().int().min(0).default(0),
  mealAllowancePaisa: z.coerce.number().int().min(0).default(0),
  otherAllowancesPaisa: z.coerce.number().int().min(0).default(0),
  pfDeductionPaisa: z.coerce.number().int().min(0).default(0),
  esiDeductionPaisa: z.coerce.number().int().min(0).default(0),
  professionalTaxPaisa: z.coerce.number().int().min(0).default(0),
  payoutFrequency: z.enum(['weekly', 'bi_weekly', 'monthly']).default('monthly'),
  effectiveFrom: z.string()
});

type SalaryComponentFormData = z.infer<typeof salaryComponentSchema>;

export default function SalaryManagement({ salonId }: SalaryManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompensationModel, setSelectedCompensationModel] = useState("all");
  const [isCreateProfileDialogOpen, setIsCreateProfileDialogOpen] = useState(false);
  const [isEditSalaryDialogOpen, setIsEditSalaryDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffWithSalary | null>(null);

  const profileForm = useForm<EmploymentProfileFormData>({
    resolver: zodResolver(employmentProfileSchema),
    defaultValues: {
      employmentType: 'full_time',
      compensationModel: 'commission_only',
      noticePeriodDays: 30,
      preferredPayoutMethod: 'bank_transfer'
    }
  });

  const salaryForm = useForm<SalaryComponentFormData>({
    resolver: zodResolver(salaryComponentSchema),
    defaultValues: {
      baseSalaryPaisa: 0,
      hourlyRatePaisa: 0,
      hraAllowancePaisa: 0,
      travelAllowancePaisa: 0,
      mealAllowancePaisa: 0,
      otherAllowancesPaisa: 0,
      pfDeductionPaisa: 0,
      esiDeductionPaisa: 0,
      professionalTaxPaisa: 0,
      payoutFrequency: 'monthly',
      effectiveFrom: new Date().toISOString().split('T')[0]
    }
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: EmploymentProfileFormData) => {
      if (!selectedStaff) throw new Error('No staff selected');
      const response = await apiRequest('POST', `/api/salons/${salonId}/staff/${selectedStaff.id}/employment-profile`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create employment profile');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-with-salary', salonId] });
      toast({ title: "Success", description: "Employment profile created successfully" });
      setIsCreateProfileDialogOpen(false);
      setSelectedStaff(null);
      profileForm.reset();
    },
    onError: (error: Error) => {
      console.error('Create profile error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const updateSalaryMutation = useMutation({
    mutationFn: async (data: SalaryComponentFormData) => {
      if (!selectedStaff) throw new Error('No staff selected');
      const response = await apiRequest('PUT', `/api/salons/${salonId}/staff/${selectedStaff.id}/salary-component`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update salary component');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-with-salary', salonId] });
      toast({ title: "Success", description: "Salary component updated successfully" });
      setIsEditSalaryDialogOpen(false);
      setSelectedStaff(null);
      salaryForm.reset();
    },
    onError: (error: Error) => {
      console.error('Update salary error:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleOpenCreateProfile = (staff: StaffWithSalary) => {
    setSelectedStaff(staff);
    profileForm.reset({
      employmentType: 'full_time',
      compensationModel: 'commission_only',
      noticePeriodDays: 30,
      preferredPayoutMethod: 'bank_transfer',
      joiningDate: new Date().toISOString().split('T')[0]
    });
    setIsCreateProfileDialogOpen(true);
  };

  const handleOpenEditSalary = (staff: StaffWithSalary) => {
    setSelectedStaff(staff);
    const sc = staff.salaryComponent;
    salaryForm.reset({
      baseSalaryPaisa: sc?.baseSalaryPaisa || 0,
      hourlyRatePaisa: sc?.hourlyRatePaisa || 0,
      hraAllowancePaisa: 0,
      travelAllowancePaisa: 0,
      mealAllowancePaisa: 0,
      otherAllowancesPaisa: 0,
      pfDeductionPaisa: 0,
      esiDeductionPaisa: 0,
      professionalTaxPaisa: 0,
      payoutFrequency: 'monthly',
      effectiveFrom: new Date().toISOString().split('T')[0]
    });
    setIsEditSalaryDialogOpen(true);
  };

  const onSubmitProfile = (data: EmploymentProfileFormData) => {
    createProfileMutation.mutate(data);
  };

  const onSubmitSalary = (data: SalaryComponentFormData) => {
    updateSalaryMutation.mutate(data);
  };

  const rupeeToNumber = (paisa: number) => Math.round(paisa / 100);
  const numberToPaisa = (rupees: number) => Math.round(rupees * 100);

  const { data: staffList, isLoading } = useQuery<StaffWithSalary[]>({
    queryKey: ['staff-with-salary', salonId],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/salons/${salonId}/staff/with-salary`);
        return await response.json();
      } catch (error) {
        try {
          const staffResponse = await apiRequest('GET', `/api/salons/${salonId}/staff`);
          const staffData = await staffResponse.json();
          return (staffData || []).map((staff: any) => ({
            ...staff,
            employmentProfile: null,
            salaryComponent: null
          }));
        } catch {
          return [];
        }
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

  const getCompensationBadge = (model?: string) => {
    switch (model) {
      case 'fixed_salary':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Fixed Salary</Badge>;
      case 'hourly':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Hourly</Badge>;
      case 'commission_only':
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Commission Only</Badge>;
      case 'salary_plus_commission':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Salary + Commission</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-500">Not Set</Badge>;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>;
      case 'on_leave':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">On Leave</Badge>;
      case 'notice_period':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Notice Period</Badge>;
      case 'terminated':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Terminated</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-500">New</Badge>;
    }
  };

  const filteredStaff = (staffList || []).filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModel = selectedCompensationModel === "all" || 
                        staff.employmentProfile?.compensationModel === selectedCompensationModel;
    return matchesSearch && matchesModel;
  });

  const summaryStats = {
    totalStaff: staffList?.length || 0,
    fixedSalary: staffList?.filter(s => s.employmentProfile?.compensationModel === 'fixed_salary').length || 0,
    commissionOnly: staffList?.filter(s => !s.employmentProfile || s.employmentProfile?.compensationModel === 'commission_only').length || 0,
    salaryPlusCommission: staffList?.filter(s => s.employmentProfile?.compensationModel === 'salary_plus_commission').length || 0
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Salary Management</h2>
          <p className="text-muted-foreground">Configure staff compensation and salary structures</p>
        </div>
        <Badge variant="outline" className="text-sm py-1 px-3">
          Select a staff member below to configure
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalStaff}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fixed Salary</CardTitle>
            <Banknote className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summaryStats.fixedSalary}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Only</CardTitle>
            <Wallet className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{summaryStats.commissionOnly}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salary + Commission</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summaryStats.salaryPlusCommission}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Salary Overview</CardTitle>
          <CardDescription>View and manage salary structures for all staff members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCompensationModel} onValueChange={setSelectedCompensationModel}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="fixed_salary">Fixed Salary</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="commission_only">Commission Only</SelectItem>
                <SelectItem value="salary_plus_commission">Salary + Commission</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Compensation Model</TableHead>
                  <TableHead>Base Salary</TableHead>
                  <TableHead>Allowances</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No staff members found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{staff.name}</p>
                          <p className="text-sm text-muted-foreground">{staff.email || staff.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(staff.roles || []).slice(0, 2).map((role, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {role}
                            </Badge>
                          ))}
                          {(staff.roles?.length || 0) > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{(staff.roles?.length || 0) - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getCompensationBadge(staff.employmentProfile?.compensationModel)}
                      </TableCell>
                      <TableCell>
                        {staff.salaryComponent?.baseSalaryPaisa 
                          ? formatCurrency(staff.salaryComponent.baseSalaryPaisa)
                          : <span className="text-muted-foreground">-</span>
                        }
                      </TableCell>
                      <TableCell>
                        {staff.salaryComponent?.totalAllowancesPaisa 
                          ? formatCurrency(staff.salaryComponent.totalAllowancesPaisa)
                          : <span className="text-muted-foreground">-</span>
                        }
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(staff.employmentProfile?.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!staff.employmentProfile ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleOpenCreateProfile(staff)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Setup Profile
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleOpenEditSalary(staff)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit Salary
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <IndianRupee className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Setting Up Salary Structures</h3>
              <p className="text-sm text-blue-700 mt-1">
                To set up salary for a staff member, first complete their employment profile in the 
                Staff Onboarding section, then configure their salary components here.
              </p>
              <p className="text-sm text-blue-600 mt-2">
                Supported models: Fixed Salary, Hourly Rate, Commission Only, or Salary + Commission (hybrid)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCreateProfileDialogOpen} onOpenChange={(open) => {
        setIsCreateProfileDialogOpen(open);
        if (!open) {
          profileForm.reset();
          setSelectedStaff(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Employment Profile</DialogTitle>
            <DialogDescription>
              Set up employment details for {selectedStaff?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={profileForm.handleSubmit(onSubmitProfile)}>
            <fieldset disabled={createProfileMutation.isPending}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeCode">Employee Code</Label>
                  <Input
                    id="employeeCode"
                    placeholder="e.g., EMP001"
                    {...profileForm.register('employeeCode')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joiningDate">Joining Date</Label>
                  <Input
                    id="joiningDate"
                    type="date"
                    {...profileForm.register('joiningDate')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employment Type</Label>
                  <Select
                    value={profileForm.watch('employmentType')}
                    onValueChange={(value: any) => profileForm.setValue('employmentType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full Time</SelectItem>
                      <SelectItem value="part_time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="freelancer">Freelancer</SelectItem>
                    </SelectContent>
                  </Select>
                  {profileForm.formState.errors.employmentType && (
                    <p className="text-sm text-red-500">{profileForm.formState.errors.employmentType.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Compensation Model</Label>
                  <Select
                    value={profileForm.watch('compensationModel')}
                    onValueChange={(value: any) => profileForm.setValue('compensationModel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed_salary">Fixed Salary</SelectItem>
                      <SelectItem value="hourly">Hourly Rate</SelectItem>
                      <SelectItem value="commission_only">Commission Only</SelectItem>
                      <SelectItem value="salary_plus_commission">Salary + Commission</SelectItem>
                    </SelectContent>
                  </Select>
                  {profileForm.formState.errors.compensationModel && (
                    <p className="text-sm text-red-500">{profileForm.formState.errors.compensationModel.message}</p>
                  )}
                </div>
              </div>

              <Separator />
              <h4 className="font-medium">Payout Settings</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Payout Method</Label>
                  <Select
                    value={profileForm.watch('preferredPayoutMethod')}
                    onValueChange={(value: any) => profileForm.setValue('preferredPayoutMethod', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="noticePeriodDays">Notice Period (Days)</Label>
                  <Input
                    id="noticePeriodDays"
                    type="number"
                    min={0}
                    {...profileForm.register('noticePeriodDays')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    placeholder="e.g., HDFC Bank"
                    {...profileForm.register('bankName')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccountNumber">Account Number</Label>
                  <Input
                    id="bankAccountNumber"
                    placeholder="Account number"
                    {...profileForm.register('bankAccountNumber')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankIfscCode">IFSC Code</Label>
                  <Input
                    id="bankIfscCode"
                    placeholder="e.g., HDFC0001234"
                    {...profileForm.register('bankIfscCode')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upiId">UPI ID</Label>
                  <Input
                    id="upiId"
                    placeholder="e.g., name@upi"
                    {...profileForm.register('upiId')}
                  />
                </div>
              </div>

              <Separator />
              <h4 className="font-medium">Identity Documents</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="panNumber">PAN Number</Label>
                  <Input
                    id="panNumber"
                    placeholder="e.g., ABCDE1234F"
                    {...profileForm.register('panNumber')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aadharNumber">Aadhar Number</Label>
                  <Input
                    id="aadharNumber"
                    placeholder="12 digit number"
                    {...profileForm.register('aadharNumber')}
                  />
                </div>
              </div>
            </div>
            </fieldset>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateProfileDialogOpen(false)}
                disabled={createProfileMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createProfileMutation.isPending}>
                {createProfileMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Profile
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditSalaryDialogOpen} onOpenChange={(open) => {
        setIsEditSalaryDialogOpen(open);
        if (!open) {
          salaryForm.reset();
          setSelectedStaff(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Salary Components</DialogTitle>
            <DialogDescription>
              Configure salary structure for {selectedStaff?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={salaryForm.handleSubmit(onSubmitSalary)}>
            <fieldset disabled={updateSalaryMutation.isPending}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="effectiveFrom">Effective From</Label>
                <Input
                  id="effectiveFrom"
                  type="date"
                  {...salaryForm.register('effectiveFrom')}
                />
                {salaryForm.formState.errors.effectiveFrom && (
                  <p className="text-sm text-red-500">{salaryForm.formState.errors.effectiveFrom.message}</p>
                )}
              </div>

              <Separator />
              <h4 className="font-medium">Base Compensation (in Rupees)</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseSalary">Base Salary (Monthly)</Label>
                  <Input
                    id="baseSalary"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={rupeeToNumber(salaryForm.watch('baseSalaryPaisa'))}
                    onChange={(e) => salaryForm.setValue('baseSalaryPaisa', numberToPaisa(Number(e.target.value)))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={rupeeToNumber(salaryForm.watch('hourlyRatePaisa'))}
                    onChange={(e) => salaryForm.setValue('hourlyRatePaisa', numberToPaisa(Number(e.target.value)))}
                  />
                </div>
              </div>

              <Separator />
              <h4 className="font-medium">Allowances (in Rupees)</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hra">HRA Allowance</Label>
                  <Input
                    id="hra"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={rupeeToNumber(salaryForm.watch('hraAllowancePaisa'))}
                    onChange={(e) => salaryForm.setValue('hraAllowancePaisa', numberToPaisa(Number(e.target.value)))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="travel">Travel Allowance</Label>
                  <Input
                    id="travel"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={rupeeToNumber(salaryForm.watch('travelAllowancePaisa'))}
                    onChange={(e) => salaryForm.setValue('travelAllowancePaisa', numberToPaisa(Number(e.target.value)))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meal">Meal Allowance</Label>
                  <Input
                    id="meal"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={rupeeToNumber(salaryForm.watch('mealAllowancePaisa'))}
                    onChange={(e) => salaryForm.setValue('mealAllowancePaisa', numberToPaisa(Number(e.target.value)))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="other">Other Allowances</Label>
                  <Input
                    id="other"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={rupeeToNumber(salaryForm.watch('otherAllowancesPaisa'))}
                    onChange={(e) => salaryForm.setValue('otherAllowancesPaisa', numberToPaisa(Number(e.target.value)))}
                  />
                </div>
              </div>

              <Separator />
              <h4 className="font-medium">Deductions (in Rupees)</h4>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pf">PF Deduction</Label>
                  <Input
                    id="pf"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={rupeeToNumber(salaryForm.watch('pfDeductionPaisa'))}
                    onChange={(e) => salaryForm.setValue('pfDeductionPaisa', numberToPaisa(Number(e.target.value)))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="esi">ESI Deduction</Label>
                  <Input
                    id="esi"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={rupeeToNumber(salaryForm.watch('esiDeductionPaisa'))}
                    onChange={(e) => salaryForm.setValue('esiDeductionPaisa', numberToPaisa(Number(e.target.value)))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pt">Professional Tax</Label>
                  <Input
                    id="pt"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={rupeeToNumber(salaryForm.watch('professionalTaxPaisa'))}
                    onChange={(e) => salaryForm.setValue('professionalTaxPaisa', numberToPaisa(Number(e.target.value)))}
                  />
                </div>
              </div>

              <Separator />
              <div className="space-y-2">
                <Label>Payout Frequency</Label>
                <Select
                  value={salaryForm.watch('payoutFrequency')}
                  onValueChange={(value: any) => salaryForm.setValue('payoutFrequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            </fieldset>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditSalaryDialogOpen(false)}
                disabled={updateSalaryMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateSalaryMutation.isPending}>
                {updateSalaryMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
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
