import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UserPlus,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  Edit,
  Eye,
  Save,
  Loader2,
  X
} from "lucide-react";
import { format } from "date-fns";

interface StaffOnboardingProps {
  salonId: string;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: string[];
  createdAt: string;
  employmentProfile?: {
    id: string;
    onboardingStatus: 'pending' | 'in_progress' | 'completed' | 'on_hold';
    employmentType: string;
    compensationModel: string;
    joiningDate?: string;
    status: string;
  };
}

const ROLE_OPTIONS = [
  "Stylist",
  "Colorist",
  "Nail Technician",
  "Makeup Artist",
  "Esthetician",
  "Massage Therapist",
  "Barber",
  "Lash Technician",
  "Waxing Specialist",
  "Receptionist",
  "Manager"
];

const addStaffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone must be at least 10 digits").optional().or(z.literal("")),
  roles: z.array(z.string()).min(1, "Select at least one role")
});

type AddStaffFormData = z.infer<typeof addStaffSchema>;

const onboardingFormSchema = z.object({
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'freelance']),
  compensationModel: z.enum(['fixed_salary', 'hourly', 'commission_only', 'salary_plus_commission']),
  joiningDate: z.string().optional()
});

type OnboardingFormData = z.infer<typeof onboardingFormSchema>;

export default function StaffOnboarding({ salonId }: StaffOnboardingProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = useState(false);
  const [isOnboardingDialogOpen, setIsOnboardingDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addStaffForm = useForm<AddStaffFormData>({
    resolver: zodResolver(addStaffSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      roles: []
    }
  });

  const onboardingForm = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingFormSchema),
    defaultValues: {
      employmentType: 'full_time',
      compensationModel: 'fixed_salary',
      joiningDate: ''
    }
  });

  const { data: staffList, isLoading } = useQuery<StaffMember[]>({
    queryKey: ['staff-onboarding', salonId],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/salons/${salonId}/staff`);
        return await response.json();
      } catch (error) {
        return [];
      }
    },
    enabled: !!salonId,
    staleTime: 30000
  });

  const addStaffMutation = useMutation({
    mutationFn: async (data: AddStaffFormData) => {
      const response = await apiRequest('POST', `/api/salons/${salonId}/staff`, {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        roles: data.roles,
        specialties: []
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add staff member');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-onboarding', salonId] });
      toast({
        title: "Staff Added",
        description: "New staff member has been added successfully. Complete their onboarding to set up payroll.",
      });
      setIsAddStaffDialogOpen(false);
      addStaffForm.reset();
      setSelectedRoles([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const createProfileMutation = useMutation({
    mutationFn: async ({ staffId, data }: { staffId: string; data: OnboardingFormData }) => {
      const response = await apiRequest('POST', `/api/salons/${salonId}/staff/${staffId}/employment-profile`, {
        employmentType: data.employmentType,
        compensationModel: data.compensationModel,
        joiningDate: data.joiningDate || null,
        onboardingStatus: 'in_progress'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create employment profile');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-onboarding', salonId] });
      toast({
        title: "Onboarding Started",
        description: "Employment profile created. Continue to Salary Management to configure compensation.",
      });
      setIsOnboardingDialogOpen(false);
      onboardingForm.reset();
      setSelectedStaff(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev => {
      const newRoles = prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role];
      addStaffForm.setValue('roles', newRoles);
      return newRoles;
    });
  };

  const onSubmitAddStaff = (data: AddStaffFormData) => {
    addStaffMutation.mutate(data);
  };

  const onSubmitOnboarding = (data: OnboardingFormData) => {
    if (selectedStaff) {
      createProfileMutation.mutate({ staffId: selectedStaff.id, data });
    }
  };

  const handleStartOnboarding = (staff: StaffMember) => {
    setSelectedStaff(staff);
    if (staff.employmentProfile) {
      onboardingForm.reset({
        employmentType: staff.employmentProfile.employmentType as any || 'full_time',
        compensationModel: staff.employmentProfile.compensationModel as any || 'fixed_salary',
        joiningDate: staff.employmentProfile.joiningDate || ''
      });
    } else {
      onboardingForm.reset({
        employmentType: 'full_time',
        compensationModel: 'fixed_salary',
        joiningDate: ''
      });
    }
    setIsOnboardingDialogOpen(true);
  };

  const getOnboardingStatusBadge = (status?: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>;
      case 'on_hold':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">On Hold</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-500">Not Started</Badge>;
    }
  };

  const getOnboardingProgress = (staff: StaffMember) => {
    if (!staff.employmentProfile) return 0;
    const profile = staff.employmentProfile;
    let progress = 25;
    if (profile.employmentType) progress += 25;
    if (profile.compensationModel) progress += 25;
    if (profile.joiningDate) progress += 25;
    return progress;
  };

  const filteredStaff = (staffList || []).filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.email?.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterStatus === "all") return matchesSearch;
    const onboardingStatus = staff.employmentProfile?.onboardingStatus || 'not_started';
    return matchesSearch && onboardingStatus === filterStatus;
  });

  const stats = {
    total: staffList?.length || 0,
    completed: staffList?.filter(s => s.employmentProfile?.onboardingStatus === 'completed').length || 0,
    inProgress: staffList?.filter(s => s.employmentProfile?.onboardingStatus === 'in_progress').length || 0,
    pending: staffList?.filter(s => !s.employmentProfile || s.employmentProfile?.onboardingStatus === 'pending').length || 0
  };

  const onboardingChecklist = [
    { id: 'basic_info', label: 'Basic Information', description: 'Name, contact, roles' },
    { id: 'employment_type', label: 'Employment Type', description: 'Full-time, part-time, contract' },
    { id: 'compensation', label: 'Compensation Model', description: 'Salary, hourly, commission' },
    { id: 'banking', label: 'Banking Details', description: 'Account for salary credit' },
    { id: 'documents', label: 'Documents', description: 'ID proof, PAN, Aadhar' },
    { id: 'leave_setup', label: 'Leave Balance', description: 'Initialize leave quotas' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Staff Onboarding</h2>
          <p className="text-muted-foreground">Complete employee profiles and employment setup</p>
        </div>
        <Button onClick={() => setIsAddStaffDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add New Staff
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Onboarding Status</CardTitle>
          <CardDescription>Track and complete employment profile setup for each staff member</CardDescription>
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
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Staff Members</h3>
              <p className="text-muted-foreground mt-1">
                Click "Add New Staff" to add your first team member
              </p>
              <Button className="mt-4" onClick={() => setIsAddStaffDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Staff
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Onboarding Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((staff) => {
                    const progress = getOnboardingProgress(staff);
                    const hasProfile = !!staff.employmentProfile;
                    return (
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
                          </div>
                        </TableCell>
                        <TableCell>
                          {staff.employmentProfile?.joiningDate 
                            ? format(new Date(staff.employmentProfile.joiningDate), 'dd MMM yyyy')
                            : <span className="text-muted-foreground">Not set</span>
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={progress} className="h-2 w-24" />
                            <span className="text-sm text-muted-foreground">{progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getOnboardingStatusBadge(staff.employmentProfile?.onboardingStatus)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {hasProfile ? (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleStartOnboarding(staff)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleStartOnboarding(staff)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Start Onboarding
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Onboarding Checklist</CardTitle>
          <CardDescription>Steps required to complete staff onboarding</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {onboardingChecklist.map((item, index) => (
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

      <Dialog open={isAddStaffDialogOpen} onOpenChange={(open) => {
        setIsAddStaffDialogOpen(open);
        if (!open) {
          addStaffForm.reset();
          setSelectedRoles([]);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Staff Member</DialogTitle>
            <DialogDescription>
              Add a new team member to your salon. You can complete their onboarding after adding.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={addStaffForm.handleSubmit(onSubmitAddStaff)}>
            <fieldset disabled={addStaffMutation.isPending}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., John Doe"
                    {...addStaffForm.register('name')}
                  />
                  {addStaffForm.formState.errors.name && (
                    <p className="text-sm text-red-500">{addStaffForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g., john@example.com"
                      {...addStaffForm.register('email')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="e.g., 9876543210"
                      {...addStaffForm.register('phone')}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Roles *</Label>
                  <p className="text-sm text-muted-foreground mb-2">Select the roles this staff member will perform</p>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                    {ROLE_OPTIONS.map((role) => (
                      <div key={role} className="flex items-center space-x-2">
                        <Checkbox
                          id={`role-${role}`}
                          checked={selectedRoles.includes(role)}
                          onCheckedChange={() => handleRoleToggle(role)}
                        />
                        <Label htmlFor={`role-${role}`} className="text-sm font-normal cursor-pointer">
                          {role}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {addStaffForm.formState.errors.roles && (
                    <p className="text-sm text-red-500">{addStaffForm.formState.errors.roles.message}</p>
                  )}
                </div>
              </div>
            </fieldset>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddStaffDialogOpen(false)}
                disabled={addStaffMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addStaffMutation.isPending}>
                {addStaffMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Staff
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isOnboardingDialogOpen} onOpenChange={(open) => {
        setIsOnboardingDialogOpen(open);
        if (!open) {
          onboardingForm.reset();
          setSelectedStaff(null);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedStaff?.employmentProfile ? 'View Onboarding' : 'Start Onboarding'}
            </DialogTitle>
            <DialogDescription>
              {selectedStaff?.name} - Set up employment profile and compensation details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onboardingForm.handleSubmit(onSubmitOnboarding)}>
            <fieldset disabled={createProfileMutation.isPending || !!selectedStaff?.employmentProfile}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="employmentType">Employment Type *</Label>
                  <Select
                    value={onboardingForm.watch('employmentType')}
                    onValueChange={(value) => onboardingForm.setValue('employmentType', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full Time</SelectItem>
                      <SelectItem value="part_time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compensationModel">Compensation Model *</Label>
                  <Select
                    value={onboardingForm.watch('compensationModel')}
                    onValueChange={(value) => onboardingForm.setValue('compensationModel', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select compensation model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed_salary">Fixed Salary</SelectItem>
                      <SelectItem value="hourly">Hourly Rate</SelectItem>
                      <SelectItem value="commission_only">Commission Only</SelectItem>
                      <SelectItem value="salary_plus_commission">Salary + Commission</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="joiningDate">Joining Date</Label>
                  <Input
                    id="joiningDate"
                    type="date"
                    {...onboardingForm.register('joiningDate')}
                  />
                </div>

                {selectedStaff?.employmentProfile && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      This staff member already has an employment profile. To update compensation details, 
                      go to <strong>Salary Management</strong>.
                    </p>
                  </div>
                )}
              </div>
            </fieldset>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOnboardingDialogOpen(false)}
                disabled={createProfileMutation.isPending}
              >
                {selectedStaff?.employmentProfile ? 'Close' : 'Cancel'}
              </Button>
              {!selectedStaff?.employmentProfile && (
                <Button type="submit" disabled={createProfileMutation.isPending}>
                  {createProfileMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Start Onboarding
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
