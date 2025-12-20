# Staff Payroll Management System - Design Document

## Implementation Checklist

### Phase 1: Database & Frontend (COMPLETED - December 2025)

| Component | Status | Notes |
|-----------|--------|-------|
| **Database Schema** | ✅ DONE | 9 tables created via SQL |
| staff_employment_profiles | ✅ Created | Employment type, compensation model |
| staff_salary_components | ✅ Created | Base salary, hourly rate, allowances |
| staff_leave_types | ✅ Created | Leave policies with quotas |
| staff_leave_balances | ✅ Created | Per-staff leave tracking |
| staff_leave_requests | ✅ Created | Leave applications workflow |
| staff_attendance | ✅ Created | Clock-in/out tracking |
| staff_payroll_cycles | ✅ Created | Monthly payroll runs |
| staff_payroll_entries | ✅ Created | Individual payroll calculations |
| staff_exit_records | ✅ Created | Exit processing |
| **Frontend Components** | ✅ DONE | 6 components in BusinessDashboard |
| PayrollOverview.tsx | ✅ Created | Dashboard with KPIs |
| SalaryManagement.tsx | ✅ Created | Staff compensation config |
| LeaveManagement.tsx | ✅ Created | Leave types & requests |
| PayrollRuns.tsx | ✅ Created | Monthly payroll processing |
| StaffOnboarding.tsx | ✅ Created | Employment profile setup |
| StaffExit.tsx | ✅ Created | Final settlement processing |
| **Dashboard Navigation** | ✅ DONE | Staff Payroll section with 6 tabs |

### Phase 2: Backend API Routes (COMPLETED - December 2025)

| API Endpoint | Status | Priority |
|--------------|--------|----------|
| GET /api/salons/:salonId/payroll/stats | ✅ DONE | HIGH |
| GET /api/salons/:salonId/staff/with-salary | ✅ DONE | HIGH |
| GET /api/salons/:salonId/leave-types | ✅ DONE | HIGH |
| POST /api/salons/:salonId/leave-types | ✅ DONE | HIGH |
| GET /api/salons/:salonId/leave-requests | ✅ DONE | HIGH |
| POST /api/salons/:salonId/staff/:staffId/leave-requests | ✅ DONE | MEDIUM |
| PUT /api/salons/:salonId/leave-requests/:id/approve | ✅ DONE | MEDIUM |
| PUT /api/salons/:salonId/leave-requests/:id/reject | ✅ DONE | MEDIUM |
| GET /api/salons/:salonId/payroll-cycles | ✅ DONE | HIGH |
| POST /api/salons/:salonId/payroll-cycles | ✅ DONE | HIGH |
| POST /api/salons/:salonId/payroll-cycles/:id/process | ✅ DONE | HIGH |
| GET /api/salons/:salonId/employment-profiles | ✅ DONE | MEDIUM |
| POST /api/salons/:salonId/staff/:staffId/employment-profile | ✅ DONE | MEDIUM |
| PUT /api/salons/:salonId/staff/:staffId/salary-component | ✅ DONE | MEDIUM |
| GET /api/salons/:salonId/exit-records | ✅ DONE | LOW |
| POST /api/salons/:salonId/staff/:staffId/exit | ✅ DONE | LOW |

### Phase 3: Advanced Features (TODO)

| Feature | Status | Notes |
|---------|--------|-------|
| Payroll calculation engine | ❌ TODO | Gross - Deductions = Net |
| Leave balance auto-accrual | ❌ TODO | Monthly/quarterly accrual |
| Payslip PDF generation | ❌ TODO | PDFKit integration |
| Attendance clock-in/out | ❌ TODO | For hourly workers |
| Bank payment integration | ❌ TODO | Optional |

---

## Overview

This document outlines the comprehensive Staff Payroll Management system for Stylemate, covering salary management, leave management, onboarding, exit, and payroll processing.

## Current State Analysis

### Existing Tables (DO NOT MODIFY)
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `staff` | Staff master data | id, salonId, orgId, userId, name, email, phone, roles, gender, photoUrl |
| `commissions` | Commission tracking per service | staffId, bookingId, commissionAmountPaisa, paymentStatus |
| `staffPayouts` | Payout records | staffId, totalAmountPaisa, commissionAmountPaisa, tipsAmountPaisa, status |
| `staffAdjustments` | Manual bonuses/deductions | staffId, adjustmentType, category, amountPaisa, reason |
| `commissionRates` | Commission rate configs | staffId, serviceId, rateType, rateValue, appliesTo |

---

## New Tables Required

### 1. Staff Employment Profiles
Stores employment terms, compensation model, and onboarding status.

```typescript
export const staffEmploymentProfiles = pgTable("staff_employment_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  
  // Employment Details
  employeeCode: varchar("employee_code", { length: 20 }),
  employmentType: varchar("employment_type", { length: 20 }).notNull().default('full_time'), 
  // 'full_time', 'part_time', 'contract', 'freelancer'
  
  compensationModel: varchar("compensation_model", { length: 20 }).notNull().default('commission_only'),
  // 'fixed_salary', 'hourly', 'commission_only', 'salary_plus_commission'
  
  // Onboarding
  joiningDate: timestamp("joining_date"),
  probationEndDate: timestamp("probation_end_date"),
  onboardingStatus: varchar("onboarding_status", { length: 20 }).default('pending'),
  // 'pending', 'in_progress', 'completed', 'on_hold'
  onboardingChecklist: jsonb("onboarding_checklist"), // { documents: [], training: [], access: [] }
  
  // Contract Details
  contractStartDate: timestamp("contract_start_date"),
  contractEndDate: timestamp("contract_end_date"),
  noticePeriodDays: integer("notice_period_days").default(30),
  
  // Employment Status
  status: varchar("status", { length: 20 }).notNull().default('active'),
  // 'active', 'on_leave', 'notice_period', 'terminated', 'resigned'
  
  // Banking Details (for payout)
  bankAccountName: varchar("bank_account_name", { length: 100 }),
  bankAccountNumber: varchar("bank_account_number", { length: 20 }),
  bankIfscCode: varchar("bank_ifsc_code", { length: 11 }),
  bankName: varchar("bank_name", { length: 100 }),
  upiId: varchar("upi_id", { length: 100 }),
  preferredPayoutMethod: varchar("preferred_payout_method", { length: 20 }).default('bank_transfer'),
  // 'bank_transfer', 'upi', 'cash'
  
  // Statutory Compliance (India)
  panNumber: varchar("pan_number", { length: 10 }),
  aadharNumber: varchar("aadhar_number", { length: 12 }),
  pfNumber: varchar("pf_number", { length: 22 }),
  esiNumber: varchar("esi_number", { length: 17 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("staff_employment_profile_unique").on(table.staffId),
  index("staff_employment_salon_idx").on(table.salonId),
]);
```

### 2. Staff Salary Components
Versioned salary structure with effective dating.

```typescript
export const staffSalaryComponents = pgTable("staff_salary_components", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employmentProfileId: varchar("employment_profile_id").notNull()
    .references(() => staffEmploymentProfiles.id, { onDelete: "cascade" }),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  
  // Salary Structure
  baseSalaryPaisa: integer("base_salary_paisa").default(0), // Fixed monthly salary
  hourlyRatePaisa: integer("hourly_rate_paisa").default(0), // For hourly workers
  dailyRatePaisa: integer("daily_rate_paisa").default(0), // For daily wage workers
  
  // Allowances (monthly)
  hraAllowancePaisa: integer("hra_allowance_paisa").default(0),
  travelAllowancePaisa: integer("travel_allowance_paisa").default(0),
  mealAllowancePaisa: integer("meal_allowance_paisa").default(0),
  otherAllowancesPaisa: integer("other_allowances_paisa").default(0),
  
  // Deductions (monthly)
  pfDeductionPaisa: integer("pf_deduction_paisa").default(0),
  esiDeductionPaisa: integer("esi_deduction_paisa").default(0),
  professionalTaxPaisa: integer("professional_tax_paisa").default(0),
  tdsDeductionPaisa: integer("tds_deduction_paisa").default(0),
  
  // Payout Configuration
  payoutFrequency: varchar("payout_frequency", { length: 20 }).default('monthly'),
  // 'weekly', 'bi_weekly', 'monthly'
  payoutDayOfMonth: integer("payout_day_of_month").default(1), // 1-31
  
  // Overtime Configuration
  overtimeRateMultiplier: decimal("overtime_rate_multiplier", { precision: 3, scale: 2 }).default('1.50'),
  weeklyWorkHours: integer("weekly_work_hours").default(48),
  
  // Effective Dating (for version control)
  effectiveFrom: timestamp("effective_from").notNull(),
  effectiveTo: timestamp("effective_to"),
  isActive: integer("is_active").notNull().default(1),
  
  // Audit
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("salary_components_profile_idx").on(table.employmentProfileId),
  index("salary_components_effective_idx").on(table.effectiveFrom, table.effectiveTo),
]);
```

### 3. Staff Leave Types
Salon-specific leave policy definitions.

```typescript
export const staffLeaveTypes = pgTable("staff_leave_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  
  name: varchar("name", { length: 50 }).notNull(), // 'Casual Leave', 'Sick Leave', etc.
  code: varchar("code", { length: 10 }).notNull(), // 'CL', 'SL', 'EL', 'LWP'
  description: text("description"),
  
  // Accrual Rules
  annualQuota: integer("annual_quota").notNull().default(12), // Days per year
  accrualType: varchar("accrual_type", { length: 20 }).default('annual'),
  // 'annual', 'monthly', 'quarterly'
  accrualRate: decimal("accrual_rate", { precision: 5, scale: 2 }).default('1.00'), // Per period
  
  // Carry Forward Rules
  allowCarryForward: integer("allow_carry_forward").default(0),
  maxCarryForwardDays: integer("max_carry_forward_days").default(0),
  carryForwardExpiryMonths: integer("carry_forward_expiry_months").default(3),
  
  // Encashment Rules
  allowEncashment: integer("allow_encashment").default(0),
  maxEncashmentDays: integer("max_encashment_days").default(0),
  encashmentRatePercentage: integer("encashment_rate_percentage").default(100),
  
  // Leave Rules
  isPaid: integer("is_paid").notNull().default(1), // 1 = Paid, 0 = Unpaid (LWP)
  requiresApproval: integer("requires_approval").default(1),
  minDaysNotice: integer("min_days_notice").default(1),
  maxConsecutiveDays: integer("max_consecutive_days").default(5),
  allowHalfDay: integer("allow_half_day").default(1),
  
  // Applicability
  applicableToEmploymentTypes: text("applicable_to_employment_types").array(),
  // ['full_time', 'part_time', 'contract']
  applicableAfterProbation: integer("applicable_after_probation").default(0),
  
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("leave_types_salon_idx").on(table.salonId),
  unique("leave_types_salon_code_unique").on(table.salonId, table.code),
]);
```

### 4. Staff Leave Balances
Per-staff leave balance tracking.

```typescript
export const staffLeaveBalances = pgTable("staff_leave_balances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  leaveTypeId: varchar("leave_type_id").notNull()
    .references(() => staffLeaveTypes.id, { onDelete: "cascade" }),
  
  // Balance Tracking
  year: integer("year").notNull(), // Financial year
  openingBalance: decimal("opening_balance", { precision: 5, scale: 1 }).default('0'),
  accruedDays: decimal("accrued_days", { precision: 5, scale: 1 }).default('0'),
  usedDays: decimal("used_days", { precision: 5, scale: 1 }).default('0'),
  adjustedDays: decimal("adjusted_days", { precision: 5, scale: 1 }).default('0'),
  encashedDays: decimal("encashed_days", { precision: 5, scale: 1 }).default('0'),
  lapsedDays: decimal("lapsed_days", { precision: 5, scale: 1 }).default('0'),
  
  // Calculated: opening + accrued + adjusted - used - encashed - lapsed
  currentBalance: decimal("current_balance", { precision: 5, scale: 1 }).default('0'),
  
  // Carry Forward Tracking
  carryForwardFromPreviousYear: decimal("carry_forward_from_previous_year", { precision: 5, scale: 1 }).default('0'),
  carryForwardExpiryDate: timestamp("carry_forward_expiry_date"),
  
  lastAccrualDate: timestamp("last_accrual_date"),
  lastUpdated: timestamp("last_updated").defaultNow(),
}, (table) => [
  index("leave_balances_staff_idx").on(table.staffId),
  index("leave_balances_type_idx").on(table.leaveTypeId),
  unique("leave_balances_staff_type_year_unique").on(table.staffId, table.leaveTypeId, table.year),
]);
```

### 5. Staff Leave Requests
Leave application and approval workflow.

```typescript
export const staffLeaveRequests = pgTable("staff_leave_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  leaveTypeId: varchar("leave_type_id").notNull()
    .references(() => staffLeaveTypes.id, { onDelete: "restrict" }),
  leaveBalanceId: varchar("leave_balance_id")
    .references(() => staffLeaveBalances.id, { onDelete: "set null" }),
  
  // Leave Details
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  numberOfDays: decimal("number_of_days", { precision: 5, scale: 1 }).notNull(),
  isHalfDay: integer("is_half_day").default(0),
  halfDayType: varchar("half_day_type", { length: 20 }), // 'first_half', 'second_half'
  
  reason: text("reason"),
  attachmentUrls: text("attachment_urls").array(), // Supporting documents
  
  // Workflow Status
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  // 'pending', 'approved', 'rejected', 'cancelled', 'revoked'
  
  // Approval Trail
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  
  // Impact on Payroll
  isPaid: integer("is_paid").default(1),
  payrollProcessed: integer("payroll_processed").default(0),
  payrollCycleId: varchar("payroll_cycle_id"), // Links to payroll when processed
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("leave_requests_staff_idx").on(table.staffId),
  index("leave_requests_dates_idx").on(table.startDate, table.endDate),
  index("leave_requests_status_idx").on(table.status),
]);
```

### 6. Staff Attendance (Optional - for hourly workers)
Daily attendance tracking for hourly/daily wage workers.

```typescript
export const staffAttendance = pgTable("staff_attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  
  date: timestamp("date").notNull(),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  
  // Calculated
  totalHoursWorked: decimal("total_hours_worked", { precision: 5, scale: 2 }).default('0'),
  overtimeHours: decimal("overtime_hours", { precision: 5, scale: 2 }).default('0'),
  
  // Status
  status: varchar("status", { length: 20 }).notNull().default('present'),
  // 'present', 'absent', 'half_day', 'on_leave', 'holiday', 'week_off'
  
  leaveRequestId: varchar("leave_request_id")
    .references(() => staffLeaveRequests.id, { onDelete: "set null" }),
  
  notes: text("notes"),
  markedBy: varchar("marked_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("attendance_staff_idx").on(table.staffId),
  index("attendance_date_idx").on(table.date),
  unique("attendance_staff_date_unique").on(table.staffId, table.date),
]);
```

### 7. Staff Payroll Cycles
Monthly payroll run metadata.

```typescript
export const staffPayrollCycles = pgTable("staff_payroll_cycles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  
  // Period
  periodYear: integer("period_year").notNull(),
  periodMonth: integer("period_month").notNull(), // 1-12
  periodStartDate: timestamp("period_start_date").notNull(),
  periodEndDate: timestamp("period_end_date").notNull(),
  
  // Status
  status: varchar("status", { length: 20 }).notNull().default('draft'),
  // 'draft', 'processing', 'pending_approval', 'approved', 'paid', 'locked'
  
  // Processing
  processedBy: varchar("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  // Totals (denormalized for quick access)
  totalStaffCount: integer("total_staff_count").default(0),
  totalGrossSalaryPaisa: integer("total_gross_salary_paisa").default(0),
  totalCommissionsPaisa: integer("total_commissions_paisa").default(0),
  totalTipsPaisa: integer("total_tips_paisa").default(0),
  totalDeductionsPaisa: integer("total_deductions_paisa").default(0),
  totalNetPayablePaisa: integer("total_net_payable_paisa").default(0),
  
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("payroll_cycles_salon_idx").on(table.salonId),
  index("payroll_cycles_period_idx").on(table.periodYear, table.periodMonth),
  unique("payroll_cycles_salon_period_unique").on(table.salonId, table.periodYear, table.periodMonth),
]);
```

### 8. Staff Payroll Entries
Individual staff payroll calculation per cycle.

```typescript
export const staffPayrollEntries = pgTable("staff_payroll_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  payrollCycleId: varchar("payroll_cycle_id").notNull()
    .references(() => staffPayrollCycles.id, { onDelete: "cascade" }),
  staffId: varchar("staff_id").notNull().references(() => staff.id, { onDelete: "restrict" }),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  employmentProfileId: varchar("employment_profile_id")
    .references(() => staffEmploymentProfiles.id, { onDelete: "set null" }),
  salaryComponentId: varchar("salary_component_id")
    .references(() => staffSalaryComponents.id, { onDelete: "set null" }),
  
  // Earnings Breakdown
  baseSalaryPaisa: integer("base_salary_paisa").default(0),
  hourlyEarningsPaisa: integer("hourly_earnings_paisa").default(0),
  totalHoursWorked: decimal("total_hours_worked", { precision: 6, scale: 2 }).default('0'),
  overtimeEarningsPaisa: integer("overtime_earnings_paisa").default(0),
  overtimeHours: decimal("overtime_hours", { precision: 5, scale: 2 }).default('0'),
  
  // Commissions & Tips (from existing tables)
  commissionEarningsPaisa: integer("commission_earnings_paisa").default(0),
  tipsReceivedPaisa: integer("tips_received_paisa").default(0),
  
  // Allowances
  allowancesPaisa: integer("allowances_paisa").default(0),
  bonusesPaisa: integer("bonuses_paisa").default(0),
  
  // Gross = Base + Hourly + Overtime + Commission + Tips + Allowances + Bonuses
  grossEarningsPaisa: integer("gross_earnings_paisa").default(0),
  
  // Deductions
  pfDeductionPaisa: integer("pf_deduction_paisa").default(0),
  esiDeductionPaisa: integer("esi_deduction_paisa").default(0),
  professionalTaxPaisa: integer("professional_tax_paisa").default(0),
  tdsDeductionPaisa: integer("tds_deduction_paisa").default(0),
  advanceRecoveryPaisa: integer("advance_recovery_paisa").default(0),
  otherDeductionsPaisa: integer("other_deductions_paisa").default(0),
  
  // Leave Impact
  unpaidLeaveDays: decimal("unpaid_leave_days", { precision: 5, scale: 1 }).default('0'),
  leaveDeductionPaisa: integer("leave_deduction_paisa").default(0),
  
  // Total Deductions
  totalDeductionsPaisa: integer("total_deductions_paisa").default(0),
  
  // Net Payable = Gross - Total Deductions
  netPayablePaisa: integer("net_payable_paisa").default(0),
  
  // Payment Status
  paymentStatus: varchar("payment_status", { length: 20 }).default('pending'),
  // 'pending', 'processing', 'paid', 'failed'
  paymentMethod: varchar("payment_method", { length: 20 }),
  paymentReference: text("payment_reference"),
  paidAt: timestamp("paid_at"),
  paidBy: varchar("paid_by").references(() => users.id),
  
  // Linked to existing payout record (for backward compatibility)
  staffPayoutId: varchar("staff_payout_id"),
  
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("payroll_entries_cycle_idx").on(table.payrollCycleId),
  index("payroll_entries_staff_idx").on(table.staffId),
  unique("payroll_entries_cycle_staff_unique").on(table.payrollCycleId, table.staffId),
]);
```

### 9. Staff Exit Records
Offboarding and final settlement.

```typescript
export const staffExitRecords = pgTable("staff_exit_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull().references(() => staff.id, { onDelete: "restrict" }),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  employmentProfileId: varchar("employment_profile_id")
    .references(() => staffEmploymentProfiles.id, { onDelete: "set null" }),
  
  // Exit Details
  exitType: varchar("exit_type", { length: 20 }).notNull(),
  // 'resignation', 'termination', 'contract_end', 'retirement', 'absconding'
  exitReason: text("exit_reason"),
  
  // Dates
  resignationDate: timestamp("resignation_date"),
  lastWorkingDate: timestamp("last_working_date").notNull(),
  noticePeriodServed: integer("notice_period_served").default(0), // Days
  noticePeriodShortfall: integer("notice_period_shortfall").default(0), // Days
  
  // Final Settlement
  pendingCommissionsPaisa: integer("pending_commissions_paisa").default(0),
  pendingTipsPaisa: integer("pending_tips_paisa").default(0),
  leaveEncashmentPaisa: integer("leave_encashment_paisa").default(0),
  noticePeriodRecoveryPaisa: integer("notice_period_recovery_paisa").default(0),
  advanceOutstandingPaisa: integer("advance_outstanding_paisa").default(0),
  gratuityPaisa: integer("gratuity_paisa").default(0),
  otherRecoveriesPaisa: integer("other_recoveries_paisa").default(0),
  
  // Net Settlement = Commissions + Tips + Encashment + Gratuity - Recoveries
  netSettlementPaisa: integer("net_settlement_paisa").default(0),
  
  // Clearance Checklist
  clearanceChecklist: jsonb("clearance_checklist"),
  // { uniform_returned: true, id_card_returned: true, tools_returned: true, ... }
  
  // Settlement Status
  settlementStatus: varchar("settlement_status", { length: 20 }).default('pending'),
  // 'pending', 'calculated', 'approved', 'paid', 'completed'
  
  settledAt: timestamp("settled_at"),
  settledBy: varchar("settled_by").references(() => users.id),
  paymentReference: text("payment_reference"),
  
  // Exit Interview
  exitInterviewNotes: text("exit_interview_notes"),
  rehireEligibility: varchar("rehire_eligibility", { length: 20 }).default('eligible'),
  // 'eligible', 'not_eligible', 'with_conditions'
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("exit_records_staff_idx").on(table.staffId),
  index("exit_records_salon_idx").on(table.salonId),
  index("exit_records_status_idx").on(table.settlementStatus),
]);
```

---

## Business Logic

### Payroll Calculation Formula

```
GROSS EARNINGS =
  Base Salary (prorated for days worked)
  + Hourly Earnings (hours worked × hourly rate)
  + Overtime Earnings (overtime hours × rate × multiplier)
  + Commission Earnings (from commissions table for period)
  + Tips Received (from tips for period)
  + Allowances (HRA + Travel + Meal + Others)
  + Bonuses (from staffAdjustments where type = 'bonus')

DEDUCTIONS =
  PF Deduction
  + ESI Deduction
  + Professional Tax
  + TDS
  + Advance Recovery (from staffAdjustments where type = 'deduction')
  + Leave Deduction (unpaid leave days × per-day salary)
  + Other Deductions

NET PAYABLE = GROSS EARNINGS - DEDUCTIONS
```

### Leave Impact on Payroll

1. **Paid Leave**: No salary deduction
2. **Unpaid Leave (LWP)**: 
   - Per-day deduction = (Base Salary + Fixed Allowances) / Working Days in Month
   - Total deduction = Unpaid Days × Per-day deduction
3. **Half Day**: Counted as 0.5 days

### Monthly Payroll Process

1. **Pre-processing** (1st-5th of month)
   - Finalize previous month's attendance
   - Process pending leave requests
   - Close commission calculations

2. **Processing** (5th-10th)
   - Create payroll cycle for previous month
   - Calculate each staff's payroll entry
   - Pull commissions, tips, adjustments
   - Calculate leave deductions

3. **Review & Approval** (10th-15th)
   - Owner reviews payroll entries
   - Approves or requests corrections

4. **Payment** (15th-20th)
   - Process payments (bank transfer/UPI/cash)
   - Mark entries as paid
   - Generate payslips

---

## UI/UX Flow

### Staff Payroll Section (Sidebar)
```
Financial Management
├── Financial Dashboard
└── Staff Payroll (expanded)
    ├── Overview (dashboard with KPIs)
    ├── Salary Management (define salary structures)
    ├── Leave Management (configure policies, approve leaves)
    ├── Attendance (for hourly workers)
    ├── Payroll Runs (monthly processing)
    ├── Onboarding (new staff setup)
    └── Exit & Settlement (offboarding)
```

### Key Screens

1. **Payroll Overview Dashboard**
   - Monthly payroll status
   - Pending approvals count
   - Total payable this month
   - Staff with unpaid leaves

2. **Salary Management**
   - List all staff with compensation model
   - Edit salary components
   - View salary history

3. **Leave Management**
   - Leave types configuration
   - Leave calendar view
   - Pending leave requests
   - Leave balance summary

4. **Payroll Runs**
   - Create new payroll cycle
   - View payroll entries
   - Approve/reject
   - Process payments
   - Generate payslips

5. **Staff Onboarding**
   - New staff wizard
   - Document upload
   - Employment details form
   - Salary setup

6. **Exit & Settlement**
   - Initiate exit
   - Final settlement calculator
   - Clearance checklist
   - Settlement approval

---

## Migration Plan

### Phase 1: Schema & Basic Setup
1. Create all new tables with migrations
2. Auto-generate employment profiles for existing staff (commission_only mode)
3. Create default leave types (CL, SL, LWP)
4. Initialize leave balances

### Phase 2: Leave Management
5. Build leave types configuration UI
6. Build leave request/approval workflow
7. Build leave balance tracking

### Phase 3: Salary Management
8. Build salary component configuration
9. Build employment profile management
10. Build onboarding workflow

### Phase 4: Payroll Processing
11. Build payroll cycle creation
12. Build payroll calculation engine
13. Build payment processing
14. Build payslip generation

### Phase 5: Exit Management
15. Build exit initiation workflow
16. Build final settlement calculator
17. Build clearance checklist

---

## Backward Compatibility

- Existing `staff` records remain unchanged
- New `staffEmploymentProfiles` created with `compensation_model = 'commission_only'` for existing staff
- Existing commission and payout flows continue to work
- Business owners can optionally upgrade to full salary mode

---

## API Endpoints (Planned)

```
// Employment Profiles
GET    /api/salons/:salonId/staff/:staffId/employment
POST   /api/salons/:salonId/staff/:staffId/employment
PUT    /api/salons/:salonId/staff/:staffId/employment

// Salary Components
GET    /api/salons/:salonId/staff/:staffId/salary
POST   /api/salons/:salonId/staff/:staffId/salary
PUT    /api/salons/:salonId/staff/:staffId/salary/:id

// Leave Types
GET    /api/salons/:salonId/leave-types
POST   /api/salons/:salonId/leave-types
PUT    /api/salons/:salonId/leave-types/:id

// Leave Requests
GET    /api/salons/:salonId/leave-requests
POST   /api/salons/:salonId/staff/:staffId/leave-requests
PUT    /api/salons/:salonId/leave-requests/:id/approve
PUT    /api/salons/:salonId/leave-requests/:id/reject

// Leave Balances
GET    /api/salons/:salonId/staff/:staffId/leave-balances

// Payroll Cycles
GET    /api/salons/:salonId/payroll-cycles
POST   /api/salons/:salonId/payroll-cycles
PUT    /api/salons/:salonId/payroll-cycles/:id/process
PUT    /api/salons/:salonId/payroll-cycles/:id/approve

// Payroll Entries
GET    /api/salons/:salonId/payroll-cycles/:cycleId/entries
PUT    /api/salons/:salonId/payroll-entries/:id/pay

// Exit Records
POST   /api/salons/:salonId/staff/:staffId/exit
GET    /api/salons/:salonId/staff/:staffId/exit
PUT    /api/salons/:salonId/exit-records/:id/settle
```

---

## Security Considerations

- Only business owners and managers can access payroll data
- Salary information is confidential (staff can only see their own)
- Banking details encrypted at rest
- Audit trail for all payroll actions
- PII (PAN, Aadhar) handled as per data protection norms

---

## Document Version

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2025 | Agent | Initial draft |
