import { Router, Response } from 'express';
import { db } from '../db';
import { 
  staff,
  salons,
  staffEmploymentProfiles,
  staffSalaryComponents,
  staffLeaveTypes,
  staffLeaveBalances,
  staffLeaveRequests,
  staffAttendance,
  staffPayrollCycles,
  staffPayrollEntries,
  staffExitRecords
} from '@shared/schema';
import { eq, and, desc, sql, gte, lte, count, sum, inArray, or } from 'drizzle-orm';
import { z } from 'zod';
import { requireSalonAccess, requireBusinessOwner, populateUserFromSession, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.use(populateUserFromSession);

router.get('/salons/:salonId/payroll/stats', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;

    const staffResult = await db
      .select({ count: count() })
      .from(staff)
      .where(eq(staff.salonId, salonId));
    const totalStaff = Number(staffResult[0]?.count || 0);

    const leaveRequestsResult = await db
      .select({ count: count() })
      .from(staffLeaveRequests)
      .where(and(
        eq(staffLeaveRequests.salonId, salonId),
        eq(staffLeaveRequests.status, 'pending')
      ));
    const pendingLeaveRequests = Number(leaveRequestsResult[0]?.count || 0);

    const onboardingResult = await db
      .select({ count: count() })
      .from(staffEmploymentProfiles)
      .where(and(
        eq(staffEmploymentProfiles.salonId, salonId),
        or(
          eq(staffEmploymentProfiles.onboardingStatus, 'pending'),
          eq(staffEmploymentProfiles.onboardingStatus, 'in_progress')
        )
      ));
    const pendingOnboarding = Number(onboardingResult[0]?.count || 0);

    const exitsResult = await db
      .select({ count: count() })
      .from(staffExitRecords)
      .where(and(
        eq(staffExitRecords.salonId, salonId),
        eq(staffExitRecords.settlementStatus, 'pending')
      ));
    const pendingExits = Number(exitsResult[0]?.count || 0);

    const salaryResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(
          COALESCE(${staffSalaryComponents.baseSalaryPaisa}, 0) + 
          COALESCE(${staffSalaryComponents.hraAllowancePaisa}, 0) + 
          COALESCE(${staffSalaryComponents.travelAllowancePaisa}, 0) + 
          COALESCE(${staffSalaryComponents.mealAllowancePaisa}, 0) + 
          COALESCE(${staffSalaryComponents.otherAllowancesPaisa}, 0)
        ), 0)`
      })
      .from(staffSalaryComponents)
      .where(and(
        eq(staffSalaryComponents.salonId, salonId),
        eq(staffSalaryComponents.isActive, 1)
      ));
    const totalPayablePaisa = Number(salaryResult[0]?.total || 0);

    const cycleResult = await db
      .select({
        id: staffPayrollCycles.id,
        status: staffPayrollCycles.status,
        processedAt: staffPayrollCycles.processedAt
      })
      .from(staffPayrollCycles)
      .where(eq(staffPayrollCycles.salonId, salonId))
      .orderBy(desc(staffPayrollCycles.periodYear), desc(staffPayrollCycles.periodMonth))
      .limit(1);
    
    const activePayrollCycle = cycleResult.length > 0 ? {
      id: cycleResult[0].id,
      status: cycleResult[0].status
    } : null;

    const lastPayrollResult = await db
      .select({ processedAt: staffPayrollCycles.processedAt })
      .from(staffPayrollCycles)
      .where(and(
        eq(staffPayrollCycles.salonId, salonId),
        eq(staffPayrollCycles.status, 'paid')
      ))
      .orderBy(desc(staffPayrollCycles.processedAt))
      .limit(1);
    
    const lastPayrollDate = lastPayrollResult.length > 0 ? lastPayrollResult[0].processedAt : null;

    res.json({
      totalStaff,
      activePayrollCycle,
      pendingLeaveRequests,
      pendingOnboarding,
      pendingExits,
      totalPayablePaisa,
      lastPayrollDate
    });
  } catch (error: any) {
    console.error('Error fetching payroll stats:', error);
    res.status(500).json({ error: 'Failed to fetch payroll stats', details: error.message });
  }
});

router.get('/salons/:salonId/staff/with-salary', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;

    const staffList = await db
      .select()
      .from(staff)
      .where(eq(staff.salonId, salonId))
      .orderBy(staff.name);

    const staffWithSalary = await Promise.all(staffList.map(async (s) => {
      const profileResult = await db
        .select({
          id: staffEmploymentProfiles.id,
          employmentType: staffEmploymentProfiles.employmentType,
          compensationModel: staffEmploymentProfiles.compensationModel,
          status: staffEmploymentProfiles.status,
          joiningDate: staffEmploymentProfiles.joiningDate,
          onboardingStatus: staffEmploymentProfiles.onboardingStatus
        })
        .from(staffEmploymentProfiles)
        .where(eq(staffEmploymentProfiles.staffId, s.id))
        .limit(1);
      
      const employmentProfile = profileResult.length > 0 ? profileResult[0] : null;

      let salaryComponent = null;
      if (employmentProfile) {
        const salaryResult = await db
          .select({
            id: staffSalaryComponents.id,
            baseSalaryPaisa: staffSalaryComponents.baseSalaryPaisa,
            hourlyRatePaisa: staffSalaryComponents.hourlyRatePaisa,
            hraAllowancePaisa: staffSalaryComponents.hraAllowancePaisa,
            travelAllowancePaisa: staffSalaryComponents.travelAllowancePaisa,
            mealAllowancePaisa: staffSalaryComponents.mealAllowancePaisa,
            otherAllowancesPaisa: staffSalaryComponents.otherAllowancesPaisa,
            pfDeductionPaisa: staffSalaryComponents.pfDeductionPaisa,
            esiDeductionPaisa: staffSalaryComponents.esiDeductionPaisa,
            professionalTaxPaisa: staffSalaryComponents.professionalTaxPaisa,
            tdsDeductionPaisa: staffSalaryComponents.tdsDeductionPaisa,
            effectiveFrom: staffSalaryComponents.effectiveFrom
          })
          .from(staffSalaryComponents)
          .where(and(
            eq(staffSalaryComponents.employmentProfileId, employmentProfile.id),
            eq(staffSalaryComponents.isActive, 1)
          ))
          .limit(1);
        
        salaryComponent = salaryResult.length > 0 ? salaryResult[0] : null;
      }

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        roles: s.roles,
        employmentProfile,
        salaryComponent
      };
    }));

    res.json(staffWithSalary);
  } catch (error: any) {
    console.error('Error fetching staff with salary:', error);
    res.status(500).json({ error: 'Failed to fetch staff with salary', details: error.message });
  }
});

router.get('/salons/:salonId/leave-types', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;

    const leaveTypes = await db
      .select({
        id: staffLeaveTypes.id,
        name: staffLeaveTypes.name,
        code: staffLeaveTypes.code,
        description: staffLeaveTypes.description,
        annualQuota: staffLeaveTypes.annualQuota,
        isPaid: staffLeaveTypes.isPaid,
        allowCarryForward: staffLeaveTypes.allowCarryForward,
        maxCarryForwardDays: staffLeaveTypes.maxCarryForwardDays,
        allowEncashment: staffLeaveTypes.allowEncashment,
        isActive: staffLeaveTypes.isActive
      })
      .from(staffLeaveTypes)
      .where(eq(staffLeaveTypes.salonId, salonId))
      .orderBy(staffLeaveTypes.code);

    res.json(leaveTypes);
  } catch (error: any) {
    console.error('Error fetching leave types:', error);
    res.status(500).json({ error: 'Failed to fetch leave types', details: error.message });
  }
});

const createLeaveTypeSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(10),
  description: z.string().optional(),
  annualQuota: z.number().int().min(0).default(12),
  isPaid: z.boolean().default(true),
  allowCarryForward: z.boolean().default(false),
  maxCarryForwardDays: z.number().int().min(0).default(0),
  allowEncashment: z.boolean().default(false)
});

router.post('/salons/:salonId/leave-types', requireSalonAccess(), requireBusinessOwner(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const body = createLeaveTypeSchema.parse(req.body);

    const result = await db
      .insert(staffLeaveTypes)
      .values({
        salonId,
        name: body.name,
        code: body.code,
        description: body.description || null,
        annualQuota: body.annualQuota,
        isPaid: body.isPaid ? 1 : 0,
        allowCarryForward: body.allowCarryForward ? 1 : 0,
        maxCarryForwardDays: body.maxCarryForwardDays,
        allowEncashment: body.allowEncashment ? 1 : 0,
        isActive: 1
      })
      .returning({ id: staffLeaveTypes.id });

    res.status(201).json({ 
      id: result[0].id,
      message: 'Leave type created successfully' 
    });
  } catch (error: any) {
    console.error('Error creating leave type:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'Leave type with this code already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create leave type', details: error.message });
    }
  }
});

router.get('/salons/:salonId/leave-requests', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const { status, staffId } = req.query;

    let conditions = [eq(staffLeaveRequests.salonId, salonId)];
    
    if (status && status !== 'all') {
      conditions.push(eq(staffLeaveRequests.status, status as string));
    }
    
    if (staffId) {
      conditions.push(eq(staffLeaveRequests.staffId, staffId as string));
    }

    const leaveRequests = await db
      .select({
        id: staffLeaveRequests.id,
        staffId: staffLeaveRequests.staffId,
        leaveTypeId: staffLeaveRequests.leaveTypeId,
        startDate: staffLeaveRequests.startDate,
        endDate: staffLeaveRequests.endDate,
        numberOfDays: staffLeaveRequests.numberOfDays,
        reason: staffLeaveRequests.reason,
        status: staffLeaveRequests.status,
        createdAt: staffLeaveRequests.createdAt,
        staffName: staff.name,
        leaveTypeName: staffLeaveTypes.name,
        leaveTypeCode: staffLeaveTypes.code,
        isPaid: staffLeaveTypes.isPaid
      })
      .from(staffLeaveRequests)
      .leftJoin(staff, eq(staffLeaveRequests.staffId, staff.id))
      .leftJoin(staffLeaveTypes, eq(staffLeaveRequests.leaveTypeId, staffLeaveTypes.id))
      .where(and(...conditions))
      .orderBy(desc(staffLeaveRequests.createdAt));

    res.json(leaveRequests);
  } catch (error: any) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests', details: error.message });
  }
});

router.put('/salons/:salonId/leave-requests/:requestId/approve', requireSalonAccess(), requireBusinessOwner(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, requestId } = req.params;
    const userId = req.user?.id;

    const existingRequest = await db
      .select({ id: staffLeaveRequests.id })
      .from(staffLeaveRequests)
      .where(and(
        eq(staffLeaveRequests.id, requestId),
        eq(staffLeaveRequests.salonId, salonId)
      ))
      .limit(1);
    
    if (existingRequest.length === 0) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    await db
      .update(staffLeaveRequests)
      .set({
        status: 'approved',
        approvedBy: userId || null,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(staffLeaveRequests.id, requestId),
        eq(staffLeaveRequests.salonId, salonId)
      ));

    res.json({ message: 'Leave request approved successfully' });
  } catch (error: any) {
    console.error('Error approving leave request:', error);
    res.status(500).json({ error: 'Failed to approve leave request', details: error.message });
  }
});

router.put('/salons/:salonId/leave-requests/:requestId/reject', requireSalonAccess(), requireBusinessOwner(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, requestId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    const existingRequest = await db
      .select({ id: staffLeaveRequests.id })
      .from(staffLeaveRequests)
      .where(and(
        eq(staffLeaveRequests.id, requestId),
        eq(staffLeaveRequests.salonId, salonId)
      ))
      .limit(1);
    
    if (existingRequest.length === 0) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    await db
      .update(staffLeaveRequests)
      .set({
        status: 'rejected',
        rejectionReason: reason || null,
        approvedBy: userId || null,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(staffLeaveRequests.id, requestId),
        eq(staffLeaveRequests.salonId, salonId)
      ));

    res.json({ message: 'Leave request rejected successfully' });
  } catch (error: any) {
    console.error('Error rejecting leave request:', error);
    res.status(500).json({ error: 'Failed to reject leave request', details: error.message });
  }
});

router.get('/salons/:salonId/payroll-cycles', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const { year } = req.query;

    let conditions = [eq(staffPayrollCycles.salonId, salonId)];
    
    if (year) {
      conditions.push(eq(staffPayrollCycles.periodYear, parseInt(year as string)));
    }

    const payrollCycles = await db
      .select({
        id: staffPayrollCycles.id,
        periodYear: staffPayrollCycles.periodYear,
        periodMonth: staffPayrollCycles.periodMonth,
        periodStartDate: staffPayrollCycles.periodStartDate,
        periodEndDate: staffPayrollCycles.periodEndDate,
        status: staffPayrollCycles.status,
        totalStaffCount: staffPayrollCycles.totalStaffCount,
        totalGrossSalaryPaisa: staffPayrollCycles.totalGrossSalaryPaisa,
        totalCommissionsPaisa: staffPayrollCycles.totalCommissionsPaisa,
        totalDeductionsPaisa: staffPayrollCycles.totalDeductionsPaisa,
        totalNetPayablePaisa: staffPayrollCycles.totalNetPayablePaisa,
        processedAt: staffPayrollCycles.processedAt,
        approvedAt: staffPayrollCycles.approvedAt
      })
      .from(staffPayrollCycles)
      .where(and(...conditions))
      .orderBy(desc(staffPayrollCycles.periodYear), desc(staffPayrollCycles.periodMonth));

    res.json(payrollCycles);
  } catch (error: any) {
    console.error('Error fetching payroll cycles:', error);
    res.status(500).json({ error: 'Failed to fetch payroll cycles', details: error.message });
  }
});

router.get('/salons/:salonId/exit-records', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;

    const exitRecords = await db
      .select({
        id: staffExitRecords.id,
        staffId: staffExitRecords.staffId,
        exitType: staffExitRecords.exitType,
        exitReason: staffExitRecords.exitReason,
        resignationDate: staffExitRecords.resignationDate,
        lastWorkingDate: staffExitRecords.lastWorkingDate,
        noticePeriodServed: staffExitRecords.noticePeriodServed,
        noticePeriodShortfall: staffExitRecords.noticePeriodShortfall,
        pendingCommissionsPaisa: staffExitRecords.pendingCommissionsPaisa,
        pendingTipsPaisa: staffExitRecords.pendingTipsPaisa,
        leaveEncashmentPaisa: staffExitRecords.leaveEncashmentPaisa,
        netSettlementPaisa: staffExitRecords.netSettlementPaisa,
        settlementStatus: staffExitRecords.settlementStatus,
        createdAt: staffExitRecords.createdAt,
        staffName: staff.name
      })
      .from(staffExitRecords)
      .leftJoin(staff, eq(staffExitRecords.staffId, staff.id))
      .where(eq(staffExitRecords.salonId, salonId))
      .orderBy(desc(staffExitRecords.createdAt));

    res.json(exitRecords);
  } catch (error: any) {
    console.error('Error fetching exit records:', error);
    res.status(500).json({ error: 'Failed to fetch exit records', details: error.message });
  }
});

const createLeaveRequestSchema = z.object({
  leaveTypeId: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  numberOfDays: z.number().positive(),
  reason: z.string().optional(),
  isHalfDay: z.boolean().default(false),
  halfDayType: z.enum(['first_half', 'second_half']).optional()
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start <= end;
}, { message: 'Start date must be before or equal to end date' });

router.post('/salons/:salonId/staff/:staffId/leave-requests', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, staffId } = req.params;
    const body = createLeaveRequestSchema.parse(req.body);

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    
    if (startDate < new Date()) {
      return res.status(400).json({ error: 'Cannot create leave request for past dates' });
    }

    const staffMember = await db
      .select({ id: staff.id })
      .from(staff)
      .where(and(eq(staff.id, staffId), eq(staff.salonId, salonId)))
      .limit(1);
    
    if (staffMember.length === 0) {
      return res.status(404).json({ error: 'Staff member not found in this salon' });
    }

    const leaveType = await db
      .select({ id: staffLeaveTypes.id, isPaid: staffLeaveTypes.isPaid })
      .from(staffLeaveTypes)
      .where(and(eq(staffLeaveTypes.id, body.leaveTypeId), eq(staffLeaveTypes.salonId, salonId)))
      .limit(1);
    
    if (leaveType.length === 0) {
      return res.status(404).json({ error: 'Leave type not found in this salon' });
    }

    const leaveBalance = await db
      .select({ id: staffLeaveBalances.id })
      .from(staffLeaveBalances)
      .where(and(
        eq(staffLeaveBalances.staffId, staffId),
        eq(staffLeaveBalances.leaveTypeId, body.leaveTypeId)
      ))
      .limit(1);

    const result = await db
      .insert(staffLeaveRequests)
      .values({
        staffId,
        salonId,
        leaveTypeId: body.leaveTypeId,
        leaveBalanceId: leaveBalance.length > 0 ? leaveBalance[0].id : null,
        startDate,
        endDate,
        numberOfDays: String(body.numberOfDays),
        reason: body.reason || null,
        isHalfDay: body.isHalfDay ? 1 : 0,
        halfDayType: body.halfDayType || null,
        status: 'pending',
        isPaid: leaveType[0].isPaid
      })
      .returning({ id: staffLeaveRequests.id });

    res.status(201).json({
      id: result[0].id,
      message: 'Leave request created successfully'
    });
  } catch (error: any) {
    console.error('Error creating leave request:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create leave request', details: error.message });
  }
});

router.get('/salons/:salonId/employment-profiles', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const { status, onboardingStatus } = req.query;

    let conditions = [eq(staffEmploymentProfiles.salonId, salonId)];
    
    if (status) {
      conditions.push(eq(staffEmploymentProfiles.status, status as string));
    }
    
    if (onboardingStatus) {
      conditions.push(eq(staffEmploymentProfiles.onboardingStatus, onboardingStatus as string));
    }

    const profiles = await db
      .select({
        id: staffEmploymentProfiles.id,
        staffId: staffEmploymentProfiles.staffId,
        employeeCode: staffEmploymentProfiles.employeeCode,
        employmentType: staffEmploymentProfiles.employmentType,
        compensationModel: staffEmploymentProfiles.compensationModel,
        joiningDate: staffEmploymentProfiles.joiningDate,
        probationEndDate: staffEmploymentProfiles.probationEndDate,
        onboardingStatus: staffEmploymentProfiles.onboardingStatus,
        onboardingChecklist: staffEmploymentProfiles.onboardingChecklist,
        contractStartDate: staffEmploymentProfiles.contractStartDate,
        contractEndDate: staffEmploymentProfiles.contractEndDate,
        noticePeriodDays: staffEmploymentProfiles.noticePeriodDays,
        status: staffEmploymentProfiles.status,
        preferredPayoutMethod: staffEmploymentProfiles.preferredPayoutMethod,
        createdAt: staffEmploymentProfiles.createdAt,
        staffName: staff.name,
        staffEmail: staff.email,
        staffPhone: staff.phone
      })
      .from(staffEmploymentProfiles)
      .leftJoin(staff, eq(staffEmploymentProfiles.staffId, staff.id))
      .where(and(...conditions))
      .orderBy(desc(staffEmploymentProfiles.createdAt));

    res.json(profiles);
  } catch (error: any) {
    console.error('Error fetching employment profiles:', error);
    res.status(500).json({ error: 'Failed to fetch employment profiles', details: error.message });
  }
});

const createEmploymentProfileSchema = z.object({
  employeeCode: z.string().optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'freelancer']).default('full_time'),
  compensationModel: z.enum(['fixed_salary', 'hourly', 'commission_only', 'salary_plus_commission']).default('commission_only'),
  joiningDate: z.string().optional(),
  probationEndDate: z.string().optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  noticePeriodDays: z.number().int().min(0).default(30),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfscCode: z.string().optional(),
  bankName: z.string().optional(),
  upiId: z.string().optional(),
  preferredPayoutMethod: z.enum(['bank_transfer', 'upi', 'cash']).default('bank_transfer'),
  panNumber: z.string().optional(),
  aadharNumber: z.string().optional(),
  pfNumber: z.string().optional(),
  esiNumber: z.string().optional()
});

const defaultOnboardingChecklist = {
  documents: [
    { id: 'id_proof', name: 'ID Proof (Aadhar/PAN)', completed: false },
    { id: 'address_proof', name: 'Address Proof', completed: false },
    { id: 'photo', name: 'Passport Photo', completed: false },
    { id: 'bank_details', name: 'Bank Account Details', completed: false }
  ],
  training: [
    { id: 'policies', name: 'Company Policies Review', completed: false },
    { id: 'system_access', name: 'System Access Setup', completed: false },
    { id: 'safety_training', name: 'Safety & Hygiene Training', completed: false }
  ],
  access: [
    { id: 'system_login', name: 'System Login Created', completed: false },
    { id: 'uniform', name: 'Uniform Issued', completed: false },
    { id: 'tools', name: 'Tools & Equipment Issued', completed: false }
  ]
};

router.post('/salons/:salonId/staff/:staffId/employment-profile', requireSalonAccess(), requireBusinessOwner(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, staffId } = req.params;
    const body = createEmploymentProfileSchema.parse(req.body);

    const staffMember = await db
      .select({ id: staff.id })
      .from(staff)
      .where(and(eq(staff.id, staffId), eq(staff.salonId, salonId)))
      .limit(1);
    
    if (staffMember.length === 0) {
      return res.status(404).json({ error: 'Staff member not found in this salon' });
    }

    const existingProfile = await db
      .select({ id: staffEmploymentProfiles.id })
      .from(staffEmploymentProfiles)
      .where(and(
        eq(staffEmploymentProfiles.staffId, staffId),
        eq(staffEmploymentProfiles.salonId, salonId)
      ))
      .limit(1);
    
    if (existingProfile.length > 0) {
      return res.status(400).json({ error: 'Employment profile already exists for this staff member in this salon' });
    }

    const result = await db
      .insert(staffEmploymentProfiles)
      .values({
        staffId,
        salonId,
        employeeCode: body.employeeCode || null,
        employmentType: body.employmentType,
        compensationModel: body.compensationModel,
        joiningDate: body.joiningDate ? new Date(body.joiningDate) : null,
        probationEndDate: body.probationEndDate ? new Date(body.probationEndDate) : null,
        contractStartDate: body.contractStartDate ? new Date(body.contractStartDate) : null,
        contractEndDate: body.contractEndDate ? new Date(body.contractEndDate) : null,
        noticePeriodDays: body.noticePeriodDays,
        bankAccountName: body.bankAccountName || null,
        bankAccountNumber: body.bankAccountNumber || null,
        bankIfscCode: body.bankIfscCode || null,
        bankName: body.bankName || null,
        upiId: body.upiId || null,
        preferredPayoutMethod: body.preferredPayoutMethod,
        panNumber: body.panNumber || null,
        aadharNumber: body.aadharNumber || null,
        pfNumber: body.pfNumber || null,
        esiNumber: body.esiNumber || null,
        onboardingChecklist: defaultOnboardingChecklist,
        onboardingStatus: 'pending',
        status: 'active'
      })
      .returning({ id: staffEmploymentProfiles.id });

    res.status(201).json({
      id: result[0].id,
      message: 'Employment profile created successfully'
    });
  } catch (error: any) {
    console.error('Error creating employment profile:', error);
    res.status(500).json({ error: 'Failed to create employment profile', details: error.message });
  }
});

const updateSalaryComponentSchema = z.object({
  baseSalaryPaisa: z.number().int().min(0).optional(),
  hourlyRatePaisa: z.number().int().min(0).optional(),
  dailyRatePaisa: z.number().int().min(0).optional(),
  hraAllowancePaisa: z.number().int().min(0).optional(),
  travelAllowancePaisa: z.number().int().min(0).optional(),
  mealAllowancePaisa: z.number().int().min(0).optional(),
  otherAllowancesPaisa: z.number().int().min(0).optional(),
  pfDeductionPaisa: z.number().int().min(0).optional(),
  esiDeductionPaisa: z.number().int().min(0).optional(),
  professionalTaxPaisa: z.number().int().min(0).optional(),
  tdsDeductionPaisa: z.number().int().min(0).optional(),
  payoutFrequency: z.enum(['weekly', 'bi_weekly', 'monthly']).optional(),
  payoutDayOfMonth: z.number().int().min(1).max(31).optional(),
  overtimeRateMultiplier: z.string().optional(),
  weeklyWorkHours: z.number().int().min(0).optional(),
  effectiveFrom: z.string()
});

router.put('/salons/:salonId/staff/:staffId/salary-component', requireSalonAccess(), requireBusinessOwner(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, staffId } = req.params;
    const body = updateSalaryComponentSchema.parse(req.body);
    const userId = req.user?.id;

    const staffMember = await db
      .select({ id: staff.id })
      .from(staff)
      .where(and(eq(staff.id, staffId), eq(staff.salonId, salonId)))
      .limit(1);
    
    if (staffMember.length === 0) {
      return res.status(404).json({ error: 'Staff member not found in this salon' });
    }

    const profileResult = await db
      .select({ id: staffEmploymentProfiles.id })
      .from(staffEmploymentProfiles)
      .where(eq(staffEmploymentProfiles.staffId, staffId))
      .limit(1);
    
    if (profileResult.length === 0) {
      return res.status(400).json({ error: 'Employment profile not found. Create employment profile first.' });
    }

    const employmentProfileId = profileResult[0].id;

    await db
      .update(staffSalaryComponents)
      .set({
        isActive: 0,
        effectiveTo: new Date(body.effectiveFrom),
        updatedAt: new Date()
      })
      .where(and(
        eq(staffSalaryComponents.employmentProfileId, employmentProfileId),
        eq(staffSalaryComponents.isActive, 1)
      ));

    const result = await db
      .insert(staffSalaryComponents)
      .values({
        employmentProfileId,
        salonId,
        baseSalaryPaisa: body.baseSalaryPaisa ?? 0,
        hourlyRatePaisa: body.hourlyRatePaisa ?? 0,
        dailyRatePaisa: body.dailyRatePaisa ?? 0,
        hraAllowancePaisa: body.hraAllowancePaisa ?? 0,
        travelAllowancePaisa: body.travelAllowancePaisa ?? 0,
        mealAllowancePaisa: body.mealAllowancePaisa ?? 0,
        otherAllowancesPaisa: body.otherAllowancesPaisa ?? 0,
        pfDeductionPaisa: body.pfDeductionPaisa ?? 0,
        esiDeductionPaisa: body.esiDeductionPaisa ?? 0,
        professionalTaxPaisa: body.professionalTaxPaisa ?? 0,
        tdsDeductionPaisa: body.tdsDeductionPaisa ?? 0,
        payoutFrequency: body.payoutFrequency ?? 'monthly',
        payoutDayOfMonth: body.payoutDayOfMonth ?? 1,
        overtimeRateMultiplier: body.overtimeRateMultiplier ?? '1.50',
        weeklyWorkHours: body.weeklyWorkHours ?? 48,
        effectiveFrom: new Date(body.effectiveFrom),
        isActive: 1,
        createdBy: userId || null
      })
      .returning({ id: staffSalaryComponents.id });

    res.json({
      id: result[0].id,
      message: 'Salary component updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating salary component:', error);
    res.status(500).json({ error: 'Failed to update salary component', details: error.message });
  }
});

const createPayrollCycleSchema = z.object({
  periodYear: z.number().int().min(2020).max(2100),
  periodMonth: z.number().int().min(1).max(12)
});

router.post('/salons/:salonId/payroll-cycles', requireSalonAccess(), requireBusinessOwner(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const body = createPayrollCycleSchema.parse(req.body);
    const userId = req.user?.id;

    const existingCycle = await db
      .select({ id: staffPayrollCycles.id })
      .from(staffPayrollCycles)
      .where(and(
        eq(staffPayrollCycles.salonId, salonId),
        eq(staffPayrollCycles.periodYear, body.periodYear),
        eq(staffPayrollCycles.periodMonth, body.periodMonth)
      ))
      .limit(1);
    
    if (existingCycle.length > 0) {
      return res.status(400).json({ error: 'Payroll cycle already exists for this period' });
    }

    const periodStartDate = new Date(body.periodYear, body.periodMonth - 1, 1);
    const periodEndDate = new Date(body.periodYear, body.periodMonth, 0);

    const result = await db
      .insert(staffPayrollCycles)
      .values({
        salonId,
        periodYear: body.periodYear,
        periodMonth: body.periodMonth,
        periodStartDate,
        periodEndDate,
        status: 'draft',
        totalStaffCount: 0,
        totalGrossSalaryPaisa: 0,
        totalCommissionsPaisa: 0,
        totalDeductionsPaisa: 0,
        totalNetPayablePaisa: 0,
        createdBy: userId || null
      })
      .returning({ id: staffPayrollCycles.id });

    res.status(201).json({
      id: result[0].id,
      message: 'Payroll cycle created successfully'
    });
  } catch (error: any) {
    console.error('Error creating payroll cycle:', error);
    res.status(500).json({ error: 'Failed to create payroll cycle', details: error.message });
  }
});

router.post('/salons/:salonId/payroll-cycles/:cycleId/process', requireSalonAccess(), requireBusinessOwner(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, cycleId } = req.params;
    const userId = req.user?.id;

    const cycleResult = await db
      .select()
      .from(staffPayrollCycles)
      .where(and(
        eq(staffPayrollCycles.id, cycleId),
        eq(staffPayrollCycles.salonId, salonId)
      ))
      .limit(1);
    
    if (cycleResult.length === 0) {
      return res.status(404).json({ error: 'Payroll cycle not found' });
    }

    const cycle = cycleResult[0];
    
    if (cycle.status === 'paid') {
      return res.status(400).json({ error: 'Payroll cycle already paid' });
    }
    
    if (cycle.status === 'processed') {
      return res.status(400).json({ error: 'Payroll cycle already processed. Use approve or pay endpoints.' });
    }

    const staffWithProfiles = await db
      .select({
        staffId: staff.id,
        staffName: staff.name,
        profileId: staffEmploymentProfiles.id,
        compensationModel: staffEmploymentProfiles.compensationModel,
        status: staffEmploymentProfiles.status
      })
      .from(staff)
      .innerJoin(staffEmploymentProfiles, eq(staff.id, staffEmploymentProfiles.staffId))
      .where(and(
        eq(staff.salonId, salonId),
        eq(staffEmploymentProfiles.status, 'active')
      ));

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let processedCount = 0;

    for (const staffMember of staffWithProfiles) {
      const salaryResult = await db
        .select()
        .from(staffSalaryComponents)
        .where(and(
          eq(staffSalaryComponents.employmentProfileId, staffMember.profileId),
          eq(staffSalaryComponents.isActive, 1)
        ))
        .limit(1);

      if (salaryResult.length === 0) continue;

      const salary = salaryResult[0];
      
      const grossSalary = (salary.baseSalaryPaisa || 0) +
        (salary.hraAllowancePaisa || 0) +
        (salary.travelAllowancePaisa || 0) +
        (salary.mealAllowancePaisa || 0) +
        (salary.otherAllowancesPaisa || 0);

      const deductions = (salary.pfDeductionPaisa || 0) +
        (salary.esiDeductionPaisa || 0) +
        (salary.professionalTaxPaisa || 0) +
        (salary.tdsDeductionPaisa || 0);

      const netPayable = grossSalary - deductions;

      await db
        .insert(staffPayrollEntries)
        .values({
          payrollCycleId: cycleId,
          staffId: staffMember.staffId,
          salonId,
          employmentProfileId: staffMember.profileId,
          salaryComponentId: salary.id,
          baseSalaryPaisa: salary.baseSalaryPaisa || 0,
          allowancesPaisa: (salary.hraAllowancePaisa || 0) + (salary.travelAllowancePaisa || 0) + (salary.mealAllowancePaisa || 0) + (salary.otherAllowancesPaisa || 0),
          grossEarningsPaisa: grossSalary,
          totalDeductionsPaisa: deductions,
          netPayablePaisa: netPayable,
          paymentStatus: 'pending'
        });

      totalGross += grossSalary;
      totalDeductions += deductions;
      totalNet += netPayable;
      processedCount++;
    }

    await db
      .update(staffPayrollCycles)
      .set({
        status: 'processed',
        totalStaffCount: processedCount,
        totalGrossSalaryPaisa: totalGross,
        totalDeductionsPaisa: totalDeductions,
        totalNetPayablePaisa: totalNet,
        processedAt: new Date(),
        processedBy: userId || null,
        updatedAt: new Date()
      })
      .where(eq(staffPayrollCycles.id, cycleId));

    res.json({
      message: 'Payroll cycle processed successfully',
      summary: {
        staffProcessed: processedCount,
        totalGrossPaisa: totalGross,
        totalDeductionsPaisa: totalDeductions,
        totalNetPayablePaisa: totalNet
      }
    });
  } catch (error: any) {
    console.error('Error processing payroll cycle:', error);
    res.status(500).json({ error: 'Failed to process payroll cycle', details: error.message });
  }
});

const createExitRecordSchema = z.object({
  exitType: z.enum(['resignation', 'termination', 'retirement', 'contract_end', 'absconding']),
  exitReason: z.string().optional(),
  resignationDate: z.string(),
  lastWorkingDate: z.string(),
  noticePeriodServed: z.number().int().min(0).optional(),
  noticePeriodShortfall: z.number().int().min(0).optional()
});

router.post('/salons/:salonId/staff/:staffId/exit', requireSalonAccess(), requireBusinessOwner(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, staffId } = req.params;
    const body = createExitRecordSchema.parse(req.body);
    const userId = req.user?.id;

    const staffMember = await db
      .select({ id: staff.id })
      .from(staff)
      .where(and(eq(staff.id, staffId), eq(staff.salonId, salonId)))
      .limit(1);
    
    if (staffMember.length === 0) {
      return res.status(404).json({ error: 'Staff member not found in this salon' });
    }

    const existingExit = await db
      .select({ id: staffExitRecords.id })
      .from(staffExitRecords)
      .where(eq(staffExitRecords.staffId, staffId))
      .limit(1);
    
    if (existingExit.length > 0) {
      return res.status(400).json({ error: 'Exit record already exists for this staff member' });
    }

    const profileResult = await db
      .select({ id: staffEmploymentProfiles.id })
      .from(staffEmploymentProfiles)
      .where(eq(staffEmploymentProfiles.staffId, staffId))
      .limit(1);

    const result = await db
      .insert(staffExitRecords)
      .values({
        staffId,
        salonId,
        employmentProfileId: profileResult.length > 0 ? profileResult[0].id : null,
        exitType: body.exitType,
        exitReason: body.exitReason || null,
        resignationDate: new Date(body.resignationDate),
        lastWorkingDate: new Date(body.lastWorkingDate),
        noticePeriodServed: body.noticePeriodServed ?? 0,
        noticePeriodShortfall: body.noticePeriodShortfall ?? 0,
        settlementStatus: 'pending',
        createdBy: userId || null
      })
      .returning({ id: staffExitRecords.id });

    if (profileResult.length > 0) {
      await db
        .update(staffEmploymentProfiles)
        .set({
          status: body.exitType === 'resignation' ? 'resigned' : 'terminated',
          updatedAt: new Date()
        })
        .where(eq(staffEmploymentProfiles.id, profileResult[0].id));
    }

    res.status(201).json({
      id: result[0].id,
      message: 'Exit record created successfully'
    });
  } catch (error: any) {
    console.error('Error creating exit record:', error);
    res.status(500).json({ error: 'Failed to create exit record', details: error.message });
  }
});

export function registerPayrollRoutes(app: any): void {
  app.use('/api', router);
  console.log('✅ Payroll routes registered');
}

export default router;
