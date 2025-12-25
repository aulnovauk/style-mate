# Stylemate Business Mobile App - UI Design Specification

## Overview

This document outlines the mobile UI screen designs for the Stylemate Business Mobile App. The app enables salon owners and staff to manage their business operations on-the-go, including appointments, services, clients, team management, analytics, and more.

**Target Users:** Salon owners, managers, and staff members

**Platform:** React Native with Expo (iOS & Android)

**Design Philosophy:** Mobile-first, task-oriented, glanceable metrics with quick actions

---

## Development Status Checklist

*Last Updated: December 25, 2025 - Full audit completed. Services & Products now shows all 14 screens developed including complete Inventory module (Dashboard, Products, Stock Adjustment, Purchase Orders, Stocktake, Suppliers). Settings Hub has 11 screens. Payroll module now complete with 6 screens (Overview, Run Wizard, Staff Details, History, Commission Structure, Reports) - Zylu-inspired with automated commission calculations and Indian tax compliance. Total: 49 developed, 1 partial, 10 remaining.*

### Legend
- ✅ **Developed** - Screen is implemented and functional
- 🔄 **Partial** - Screen exists but missing some features
- ❌ **Not Started** - Screen needs to be developed

### Authentication Flow
| Screen | Status | File Path | Notes |
|--------|--------|-----------|-------|
| Phone Login Screen | ❌ Not Started | - | Entry point for business users |
| OTP Verification | ❌ Not Started | - | 6-digit code verification |
| Registration Screen | ❌ Not Started | - | New user signup with PAN/GST |
| Salon Selection | ❌ Not Started | - | Multi-location switcher |

### Main Tab Screens
| Screen | Status | File Path | Notes |
|--------|--------|-----------|-------|
| Dashboard Overview (Home) | ✅ Developed | `app/(tabs)/index.tsx` | KPIs, quick actions, appointments |
| Booking Calendar | ✅ Developed | `app/(tabs)/calendar.tsx` | Day/Week/Month views with staff filter |
| Client List | ✅ Developed | `app/(tabs)/clients.tsx` | Search, filter by VIP/New |
| Team List | ✅ Developed | `app/(tabs)/team.tsx` | Staff status, appointments count |
| More Features Hub | 🔄 Partial | `app/(tabs)/more.tsx` | Menu structure only, links not wired |

### Appointment Management
| Screen | Status | File Path | Notes |
|--------|--------|-----------|-------|
| Appointment Details | ✅ Developed | `app/appointments/[id].tsx` | Client, services, payment, actions |
| New Booking | ✅ Developed | `app/appointments/new-booking.tsx` | Multi-step booking wizard |
| Walk-in/Front Desk | ✅ Developed | `app/appointments/walk-in.tsx` | Quick check-in flow |
| Waitlist Management | ✅ Developed | `app/appointments/waitlist.tsx` | Queue and priority management, filtering, notify clients |
| Checkout/POS | ✅ Developed | `app/appointments/checkout.tsx` | Payment processing, cart, discounts, tips, receipts |

### Client Management
| Screen | Status | File Path | Notes |
|--------|--------|-----------|-------|
| Client Profile (360 View) | ✅ Developed | `app/clients/[id].tsx` | Stats, preferences, visit history |
| Add/Edit Client | ✅ Developed | `app/clients/add-edit.tsx` | Zod validation, phone formatting, marketing preferences, preferred staff |
| Client Import Status | ✅ Developed | `app/clients/import.tsx` | Fresha-style CSV upload, column mapping, preview, error handling, duplicate detection |
| Campaign Assignment | ✅ Developed | `app/clients/campaign-assignment.tsx` | Campaign selection, client assignment, search/filter, bulk select |

### Team Management
| Screen | Status | File Path | Notes |
|--------|--------|-----------|-------|
| Staff Profile | ✅ Developed | `app/team/[id].tsx` | Schedule, services, performance tabs |
| Add/Edit Staff | ✅ Developed | `app/team/add-edit.tsx` | Zod validation, role selection, specialties, compensation settings |
| Staff Schedule | ✅ Developed | `app/team/schedule.tsx` | Day/week views, sweep-line timeline, block time management |
| Leave Management | ✅ Developed | `app/team/leave.tsx` | Balance tracking, approve/reject flow with notes |
| Commissions | ✅ Developed | `app/team/commissions.tsx` | Summary/detail views, payout processing, export functionality |

### Payroll
| Screen | Status | File Path | Notes |
|--------|--------|-----------|-------|
| Payroll Overview | ✅ Developed | `app/payroll/index.tsx` | Summary cards (Total/Staff/Paid/Pending), pay period selector with month navigation, staff payroll list with earnings/deductions breakdown, payment history, Run Payroll & Export actions |
| Payroll Run Wizard | ✅ Developed | `app/payroll/run-wizard.tsx` | 4-step wizard: Select Staff → Review Earnings → Adjustments → Confirm. Staff multi-select, earnings review, one-time adjustments with notes, confirmation with warning |
| Staff Payout Details | ✅ Developed | `app/payroll/[staffId].tsx` | Individual earnings breakdown (base, HRA, allowances, commission, bonus, overtime, tips), deductions (TDS, PF, ESI, professional tax, advances), attendance summary, payment history, download payslip |
| Payment History | ✅ Developed | `app/payroll/history.tsx` | Year selector (2024/2023/2022), payroll cycles list with progress bars, status badges (Completed/Partial/Pending), download reports, summary stats |
| Commission Structure | ✅ Developed | `app/payroll/commission-structure.tsx` | Zylu-inspired: Create/edit commission structures with 3 types (Flat/Percentage/Tiered), service category assignment, activate/deactivate, staff assignment count |
| Payroll Reports | ✅ Developed | `app/payroll/reports.tsx` | 12 report types across 4 categories (Payroll/Tax/Staff/Attendance), PDF/Excel/CSV export, Indian tax compliance (TDS Form 24Q, PF ECR, ESI), recent reports history |

### Services & Products
| Screen | Status | File Path | Notes |
|--------|--------|-----------|-------|
| Services Management | ✅ Developed | `app/services/index.tsx` | Service catalog with category filtering, stats cards (Active/Inactive/Featured), search, collapsible sections, toggle status, duplicate service |
| Add/Edit Service | ✅ Developed | `app/services/add-edit.tsx` | Zod validation, category/gender/price type, duration chips, staff assignment, duplicate support |
| Packages List | ✅ Developed | `app/packages/index.tsx` | Package catalog with stats, search, status filter chips, toggle active/inactive, duplicate package |
| Add/Edit Package | ✅ Developed | `app/packages/add-edit.tsx` | 3-step wizard: Details → Select Services → Pricing with 4 pricing types, Extra Time Modal, premium package support |
| Memberships List | ✅ Developed | `app/memberships/index.tsx` | Fresha-inspired: Plans/Members/Analytics tabs, color-coded plan types (Discount/Credit/Session), stats cards, search, status filters |
| Add/Edit Membership | ✅ Developed | `app/memberships/add-edit.tsx` | 4-step wizard: Type Selection → Details (dynamic) → Payment & Billing → Online Settings, perks support, auto-renewal |
| Membership Members | ✅ Developed | `app/memberships/members.tsx` | Fresha-inspired: Pause/Resume/Cancel lifecycle actions, member list, status filters, send reminder |
| Inventory Dashboard | ✅ Developed | `app/inventory/index.tsx` | Products/Categories/Suppliers/Orders tabs, stats cards (Total/Value/Low Stock/Reorder/Expiring), search, filters, bottom action bar |
| Add/Edit Product | ✅ Developed | `app/inventory/add-edit.tsx` | 4-step wizard: Basic Info → Stock Settings → Pricing → Retail Settings, barcode support, form validation |
| Stock Adjustment | ✅ Developed | `app/inventory/adjust.tsx` | Movement types (Receive/Usage/Adjust/Transfer/Damage/Return/Expired), quantity stepper, batch/expiry tracking, movement history |
| Purchase Orders Create | ✅ Developed | `app/inventory/purchase-orders/create.tsx` | 3-step wizard: Supplier → Products → Review, smart reorder suggestions, vendor selection |
| Purchase Order Detail | ✅ Developed | `app/inventory/purchase-orders/[id].tsx` | PO status tracking (Draft/Sent/Confirmed/Received/Cancelled), receive items with batch/expiry, discrepancy notes |
| Stocktake | ✅ Developed | `app/inventory/stocktake.tsx` | Physical count workflow, search products, variance tracking, discrepancy flagging, apply adjustments |
| Supplier Add/Edit | ✅ Developed | `app/inventory/suppliers/add-edit.tsx` | Contact info, address, payment terms, status management, rating system |

### Analytics & Reports
| Screen | Status | File Path | Notes |
|--------|--------|-----------|-------|
| Analytics Dashboard | ❌ Not Started | - | Revenue, metrics, charts |
| Detailed Reports | ❌ Not Started | - | Exportable business reports |
| ML Predictions | ❌ Not Started | - | AI-powered insights |

### Communication
| Screen | Status | File Path | Notes |
|--------|--------|-----------|-------|
| Chat Inbox | ❌ Not Started | - | Customer messaging center |
| Chat Conversation | ❌ Not Started | - | Individual chat thread |
| Notifications | ❌ Not Started | - | Alert list and preferences |

### Marketing
| Screen | Status | File Path | Notes |
|--------|--------|-----------|-------|
| Promotions/Offers | ❌ Not Started | - | Discount management |
| Marketing Campaigns | ❌ Not Started | - | Campaign creation and tracking |
| Events Hub | ❌ Not Started | - | Event management |

### Settings
| Screen | Status | File Path | Notes |
|--------|--------|-----------|-------|
| Settings Hub | ✅ Developed | `app/settings/index.tsx` | Profile, salon info, notifications, app preferences, security, support - all toggles functional with loading states |
| Language Settings | ✅ Developed | `app/settings/language.tsx` | 8 languages (EN, HI, ES, FR, DE, PT, AR, ZH) with native names, checkmark selection |
| Theme Settings | ✅ Developed | `app/settings/theme.tsx` | Dark/Light/System modes with persistent storage |
| Date Format Settings | ✅ Developed | `app/settings/date-format.tsx` | 5 formats (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD-MMM-YYYY, MMM DD YYYY) |
| Time Format Settings | ✅ Developed | `app/settings/time-format.tsx` | 12-hour/24-hour toggle with examples |
| Change Password | ✅ Developed | `app/settings/change-password.tsx` | Backend API integration, validation, bcrypt hashing |
| Business Information | ✅ Developed | `app/settings/business-info.tsx` | Salon profile, address, contact - email/phone validation, required field checks, unsaved changes warning |
| Working Hours | ✅ Developed | `app/settings/working-hours.tsx` | Per-day open/close times, breaks - time validation (end > start), unsaved changes warning |
| Booking Rules | ✅ Developed | `app/settings/booking-rules.tsx` | Instant booking, group bookings, deals toggles - unsaved changes warning, owner-only access |
| Payment Methods | ✅ Developed | `app/settings/payment-methods.tsx` | Cash, card, UPI, Razorpay toggles - preview mode (pending backend RBAC) |
| Access Control/RBAC | ✅ Developed | `app/settings/access-control.tsx` | Role management, staff permissions - preview mode (pending backend RBAC) |

### Summary Statistics
| Category | Developed | Partial | Not Started | Total |
|----------|-----------|---------|-------------|-------|
| Authentication | 0 | 0 | 4 | 4 |
| Main Tabs | 4 | 1 | 0 | 5 |
| Appointments | 5 | 0 | 0 | 5 |
| Clients | 4 | 0 | 0 | 4 |
| Team | 5 | 0 | 0 | 5 |
| Payroll | 0 | 0 | 3 | 3 |
| Services & Products | 14 | 0 | 0 | 14 |
| Analytics | 0 | 0 | 3 | 3 |
| Communication | 0 | 0 | 3 | 3 |
| Marketing | 0 | 0 | 3 | 3 |
| Settings | 11 | 0 | 0 | 11 |
| **TOTAL** | **43** | **1** | **16** | **60** |

**Development Progress: ~73% Complete (44/60 screens)**

### Fully Implemented Screens

The following 43 screens are fully implemented with production-level code:

**Main Tabs (4 screens):**
1. Dashboard Overview (Home) - `app/(tabs)/index.tsx`
2. Booking Calendar - `app/(tabs)/calendar.tsx`
3. Client List - `app/(tabs)/clients.tsx`
4. Team List - `app/(tabs)/team.tsx`

**Appointments (5 screens):**
5. Appointment Details - `app/appointments/[id].tsx`
6. New Booking - `app/appointments/new-booking.tsx`
7. Walk-in/Front Desk - `app/appointments/walk-in.tsx`
8. Waitlist Management - `app/appointments/waitlist.tsx`
9. Checkout/POS - `app/appointments/checkout.tsx`

**Clients (4 screens):**
10. Client Profile (360 View) - `app/clients/[id].tsx`
11. Add/Edit Client - `app/clients/add-edit.tsx`
12. Client Import - `app/clients/import.tsx`
13. Campaign Assignment - `app/clients/campaign-assignment.tsx`

**Team (5 screens):**
14. Staff Profile - `app/team/[id].tsx`
15. Add/Edit Staff - `app/team/add-edit.tsx`
16. Staff Schedule - `app/team/schedule.tsx`
17. Leave Management - `app/team/leave.tsx`
18. Commissions - `app/team/commissions.tsx`

**Services & Products (14 screens):**
19. Services Management - `app/services/index.tsx`
20. Add/Edit Service - `app/services/add-edit.tsx`
21. Packages List - `app/packages/index.tsx`
22. Add/Edit Package - `app/packages/add-edit.tsx`
23. Memberships List - `app/memberships/index.tsx`
24. Add/Edit Membership - `app/memberships/add-edit.tsx`
25. Membership Members - `app/memberships/members.tsx`
26. Inventory Dashboard - `app/inventory/index.tsx` (Products/Categories/Suppliers/Orders tabs, stats, filters)
27. Add/Edit Product - `app/inventory/add-edit.tsx` (4-step wizard: Basic Info → Stock → Pricing → Retail)
28. Stock Adjustment - `app/inventory/adjust.tsx` (7 movement types, batch/expiry tracking, history)
29. Purchase Orders Create - `app/inventory/purchase-orders/create.tsx` (3-step wizard)
30. Purchase Order Detail - `app/inventory/purchase-orders/[id].tsx` (Status tracking, receive items)
31. Stocktake - `app/inventory/stocktake.tsx` (Physical count, variance tracking)
32. Supplier Add/Edit - `app/inventory/suppliers/add-edit.tsx` (Contact, payment terms, rating)

**Settings (11 screens):**
33. Settings Hub - `app/settings/index.tsx` (Profile, notifications, app preferences, security, support - all functional)
34. Language Settings - `app/settings/language.tsx` (8 languages with native names)
35. Theme Settings - `app/settings/theme.tsx` (Dark/Light/System modes)
36. Date Format Settings - `app/settings/date-format.tsx` (5 date formats)
37. Time Format Settings - `app/settings/time-format.tsx` (12/24 hour)
38. Change Password - `app/settings/change-password.tsx` (Backend API, validation, bcrypt)
39. Business Information - `app/settings/business-info.tsx` (Salon profile, address, contact - email/phone validation, required fields, unsaved changes warning)
40. Working Hours - `app/settings/working-hours.tsx` (Per-day schedules with breaks - time validation, unsaved changes warning)
41. Booking Rules - `app/settings/booking-rules.tsx` (Instant booking, group bookings, deals - owner-only access, unsaved changes warning)
42. Payment Methods - `app/settings/payment-methods.tsx` (Cash, card, UPI, Razorpay - preview mode pending backend RBAC)
43. Access Control/RBAC - `app/settings/access-control.tsx` (Role management, permissions - preview mode pending backend RBAC)

**Partial Implementation (1 screen):**
- More Features Hub - `app/(tabs)/more.tsx` (menu structure only)

---

## Design System

### Brand Colors

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Primary Violet | #8B5CF6 | Primary actions, active states |
| Primary Fuchsia | #D946EF | Gradients, accents |
| Slate 900 | #0F172A | Dark backgrounds |
| Slate 800 | #1E293B | Cards, elevated surfaces |
| Slate 700 | #334155 | Secondary backgrounds |
| White | #FFFFFF | Text on dark, light mode backgrounds |
| Success Green | #22C55E | Positive indicators |
| Warning Amber | #F59E0B | Warnings, pending states |
| Error Red | #EF4444 | Errors, cancellations |

### Typography Scale

| Style | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | 28px | Bold | Screen titles |
| H2 | 22px | Semi-bold | Section headers |
| H3 | 18px | Semi-bold | Card titles |
| Body | 16px | Regular | Primary content |
| Body Small | 14px | Regular | Secondary content |
| Caption | 12px | Regular | Labels, timestamps |

### Spacing System

- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48px
- Screen padding: 16px horizontal
- Card padding: 16px
- Touch target minimum: 44px x 44px

### Component Patterns

- **Cards:** Rounded corners (12px), subtle shadow, slate-800 background
- **Buttons:** Rounded (8px), gradient for primary, outlined for secondary
- **Icons:** Lucide React Native icons, 24px standard size
- **Badges:** Pill shape, gradient background for counts
- **Lists:** Separated with 1px dividers or 8px spacing

---

## Navigation Architecture

### Bottom Tab Navigation (Primary)

```
┌─────────────────────────────────────────────────────────────┐
│  Home  │  Calendar  │  Clients  │  Team  │  More           │
│   🏠   │     📅     │    👥     │   👤   │   ⋯             │
└─────────────────────────────────────────────────────────────┘
```

**Tab Definitions:**
1. **Home** - Dashboard overview with KPIs and quick actions
2. **Calendar** - Booking calendar and appointment management
3. **Clients** - Customer profiles and management
4. **Team** - Staff management and schedules
5. **More** - Access to all other features (Services, Shop, Events, Reports, Settings)

### Stack Navigation Hierarchy

```
App
├── Authentication Flow
│   ├── Phone Login Screen (Enter phone number)
│   ├── OTP Verification
│   ├── Registration Screen (New users only)
│   │   ├── Full Name (required)
│   │   ├── Email ID (required)
│   │   ├── Password (required)
│   │   └── PAN / GST Number (optional - for billing)
│   └── Salon Selection (for multi-location)
│
├── Main Tab Navigator
│   ├── Home Stack
│   │   ├── Dashboard Overview
│   │   ├── Notifications
│   │   └── Quick Actions Modal
│   │
│   ├── Calendar Stack
│   │   ├── Booking Calendar (Day/Week/Month views)
│   │   ├── Appointment Details
│   │   ├── New Booking
│   │   ├── Front Desk Queue
│   │   └── Waitlist Management
│   │
│   ├── Clients Stack
│   │   ├── Client List
│   │   ├── Client Profile (360 view)
│   │   ├── Add/Edit Client
│   │   ├── Client Import Status
│   │   └── Campaign Assignment
│   │
│   ├── Team Stack
│   │   ├── Staff List
│   │   ├── Staff Profile
│   │   ├── Add/Edit Staff
│   │   ├── Staff Schedule
│   │   ├── Payroll Overview
│   │   ├── Payroll Run Wizard
│   │   ├── Leave Management
│   │   └── Commissions
│   │
│   └── More Stack
│       ├── Feature Hub (Grid of all features)
│       ├── Services Management
│       ├── Packages & Memberships
│       ├── Product Catalog
│       ├── Inventory Management
│       ├── Events Hub
│       ├── Analytics & Reports
│       ├── Marketing & Campaigns
│       ├── Chat Inbox
│       └── Settings & Setup
```

---

## Screen Designs

### 0. Authentication Screens

#### 0a. Phone Login Screen

**Purpose:** Initial entry point for business users

**Layout:**

```
┌─────────────────────────────────────────┐
│                                         │
│           Stylemate Business            │
│              [App Logo]                 │
│                                         │
│      Manage your salon on the go        │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  📱 Enter Your Phone Number             │
│  ┌───────────────────────────────────┐  │
│  │ +91  │  98765 43210               │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │         Continue with OTP          │  │ ← Primary CTA
│  └───────────────────────────────────┘  │
│                                         │
│           ─── or continue with ───      │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │  Google  │  │  Apple   │            │ ← Social login
│  └──────────┘  └──────────┘            │
│                                         │
│  By continuing, you agree to our        │
│  Terms of Service & Privacy Policy      │
│                                         │
└─────────────────────────────────────────┘
```

#### 0b. OTP Verification Screen

**Layout:**

```
┌─────────────────────────────────────────┐
│ ← Back                                  │
├─────────────────────────────────────────┤
│                                         │
│        Verify Your Number               │
│                                         │
│  We've sent a 6-digit code to           │
│  +91 98765 43210                        │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  ○   ○   ○   ○   ○   ○         │    │ ← OTP input
│  └─────────────────────────────────┘    │
│                                         │
│  Didn't receive code?                   │
│  Resend in 0:30 │ [Resend OTP]          │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │            Verify                  │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

#### 0c. Registration Screen (New Users)

**Purpose:** Collect business owner details after OTP verification

**Layout:**

```
┌─────────────────────────────────────────┐
│ ← Back        Create Account            │
├─────────────────────────────────────────┤
│                                         │
│  👤 Let's set up your account           │
│                                         │
│  Full Name *                            │
│  ┌───────────────────────────────────┐  │
│  │ Priya Sharma                      │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Email Address *                        │
│  ┌───────────────────────────────────┐  │
│  │ priya@salon.com                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Password *                             │
│  ┌───────────────────────────────────┐  │
│  │ ••••••••              👁          │  │
│  └───────────────────────────────────┘  │
│  Min 8 characters, 1 number, 1 special  │
│                                         │
│  Confirm Password *                     │
│  ┌───────────────────────────────────┐  │
│  │ ••••••••              👁          │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  📋 Business Details (Optional)         │
│                                         │
│  PAN Number                             │
│  ┌───────────────────────────────────┐  │
│  │ ABCDE1234F                        │  │
│  └───────────────────────────────────┘  │
│  For invoice generation                 │
│                                         │
│  GST Number                             │
│  ┌───────────────────────────────────┐  │
│  │ 27AABCU9603R1ZM                   │  │
│  └───────────────────────────────────┘  │
│  For tax compliance                     │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ☑ I agree to Terms & Conditions        │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │        Create Account              │  │ ← Gradient CTA
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Field Specifications:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Full Name | Text | Yes | Min 2 characters |
| Email | Email | Yes | Valid email format |
| Password | Password | Yes | Min 8 chars, 1 number, 1 special |
| Confirm Password | Password | Yes | Must match password |
| PAN Number | Text | No | 10 char alphanumeric (AAAAA0000A) |
| GST Number | Text | No | 15 char alphanumeric |

**Flow Logic:**
- New users → Show Registration Screen after OTP
- Existing users → Skip to Salon Selection after OTP
- Password stored securely with bcrypt hashing
- PAN/GST validated format on client, verified on server

---

### 1. Dashboard Overview (Home)

**Purpose:** Provide at-a-glance business health and quick access to daily operations

**Layout:**

```
┌─────────────────────────────────────────┐
│ 🔔  Stylemate Business      👤 Profile  │ ← Header
├─────────────────────────────────────────┤
│                                         │
│  Good Morning, [Name]                   │
│  📍 [Salon Name]  ▼ (switcher)          │
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Today's │ │ Revenue │ │ New     │   │ ← KPI Cards
│  │ Appts   │ │ Today   │ │ Clients │   │   (Fresha-inspired)
│  │   12    │ │ ₹8,500  │ │    3    │   │
│  │   ↑2    │ │  ↑15%   │ │   ↑1    │   │ ← Trend indicators
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  📅 Today's Schedule                    │ ← Mini Calendar (Fresha-inspired)
│  ┌───────────────────────────────────┐  │
│  │ 10:00 🔵 Priya    11:30 🟢 Rahul │  │ ← Color by staff
│  │ 12:00 🟣 Meera    14:00 ░░ Free  │  │
│  │ 15:30 🔵 Anita    16:00 🟢 Karan │  │
│  │         [View Full Calendar →]    │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  ⚡ Quick Actions                        │ ← Simplified to 3 (Fresha-inspired)
│  ┌──────────────────────────────────┐   │
│  │ ➕ Book  │  🚶 Walk-in │ 💳 Checkout│ │
│  └──────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  ⚠️ Needs Attention (4)                 │ ← Renamed (action-oriented)
│  ┌──────────────────────────────────┐   │
│  │ 🔴 2 pending confirmations       │   │
│  │ 💬 3 unread messages             │   │
│  │ 💰 1 payment pending             │   │
│  │ 🟡 Low stock: Hair Serum         │   │
│  └──────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  📊 Quick Stats                         │
│  ┌──────────────────────────────────┐   │
│  │ This Week: ₹42,500 │ Booked: 85% │   │
│  │ Avg Rating: ⭐ 4.8  │ Reviews: 12 │   │
│  └──────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Components:**
- Salon switcher dropdown (for multi-location businesses)
- KPI metric cards with trend indicators (↑ ↓) - **New Clients metric added**
- **Mini calendar** showing today's schedule at a glance with staff color coding
- **Simplified quick actions** (3 primary: Book, Walk-in, Checkout)
- **"Needs Attention"** section with actionable items and count badge
- Quick stats bar showing weekly performance
- Pull-to-refresh functionality

**Fresha-Inspired Improvements:**
- Compact schedule view on homepage reduces need to navigate to calendar
- Checkout button prominent for faster POS access during busy periods
- Staff color coding provides instant visual recognition
- Action-oriented language ("Needs Attention" vs "Alerts")

---

### 2. Booking Calendar

**Purpose:** Visual calendar for managing appointments

**Layout:**

```
┌─────────────────────────────────────────┐
│ ← Back    Booking Calendar    🔍 Filter │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [Day] [Week] [Month]            │   │ ← View Toggle
│  └─────────────────────────────────┘   │
│                                         │
│  ◀ December 22, 2025 ▶                  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Staff: [All ▼]  Color: [Staff ▼] │  │ ← Color mode toggle
│  └───────────────────────────────────┘  │   (Fresha-inspired)
│                                         │
│  Legend: 🔵 Anjali  🟢 Vikram  🟣 Neha  │ ← Staff color legend
│                                         │
├─────────────────────────────────────────┤
│  TIME  │  APPOINTMENTS                  │
│ ───────┼───────────────────────────────│
│  9:00  │  ░░░░░░░░░░░░░░░░░░░░░░░░░   │
│        │                                │
│ 10:00  │  🔵🔵🔵🔵 Priya - Haircut      │ ← Color by staff
│        │  ✓ Confirmed                   │
│        │                                │
│ 11:00  │  ░░░░░░░░░░░░░░░░░░░░░░░░░   │
│        │                                │
│ 11:30  │  🟢🟢🟢🟢 Rahul - Beard Trim   │
│        │  ⏳ Pending                    │
│        │                                │
│ 12:00  │  🟣🟣🟣🟣🟣🟣 Meera - Full Pkg │
│        │  ✓ Confirmed                   │
│        │                                │
│ 13:00  │  ░░ Lunch Break ░░░░░░░░░░   │
│        │                                │
└─────────────────────────────────────────┘
│                                         │
│           [ ➕ New Booking ]            │ ← FAB
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Day/Week/Month view toggle (segmented control)
- Date navigation with swipe gestures
- Staff filter dropdown
- **Color mode toggle** (Fresha-inspired): Switch between coloring by Staff or Service
- **Dynamic legend** showing color assignments
- Color-coded appointment blocks (staff/service based)
- Tap appointment to view details
- Floating Action Button for new booking
- Drag-to-reschedule (optional)

**Color Mode Options (Fresha-inspired):**
- **By Staff**: Each staff member has a unique color (🔵 Anjali, 🟢 Vikram, 🟣 Neha)
- **By Service**: Colors represent service categories (🔵 Haircut, 🟢 Spa, 🟣 Makeup)
- **By Status**: Traditional view (✓ Confirmed, ⏳ Pending, ❌ Cancelled)

---

### 3. Appointment Details

**Purpose:** View and manage individual appointment

**Layout:**

```
┌─────────────────────────────────────────┐
│ ← Back      Appointment       ⋮ Options │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │    👤                             │  │
│  │  Priya Sharma                     │  │
│  │  📱 +91 98765 43210               │  │
│  │  ✉️ priya@email.com               │  │
│  │  [View Profile] [Call] [Message]  │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  📅 Appointment Details                 │
│  ┌───────────────────────────────────┐  │
│  │ Date: Dec 22, 2025                │  │
│  │ Time: 10:00 AM - 11:30 AM         │  │
│  │ Status: ✓ Confirmed               │  │
│  │ Staff: Anjali                     │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  🛍️ Services Booked                     │
│  ┌───────────────────────────────────┐  │
│  │ Haircut                    ₹500   │  │
│  │ Hair Coloring              ₹1,500 │  │
│  │ ─────────────────────────────────│  │
│  │ Subtotal                   ₹2,000 │  │
│  │ Tax (18% GST)              ₹360   │  │
│  │ ─────────────────────────────────│  │
│  │ Total                      ₹2,360 │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  💳 Payment Status                      │
│  ┌───────────────────────────────────┐  │
│  │ ⏳ Payment Pending                │  │
│  │ [Mark as Paid]                    │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [Check In]  [Reschedule]  [Cancel]     │
│                                         │
└─────────────────────────────────────────┘
```

**Actions:**
- Call/Message client directly
- View full client profile
- Check-in appointment (start service)
- Reschedule with calendar picker
- Cancel with reason selection
- Mark payment as completed
- Options menu: Add services, Apply discount, Print receipt

---

### 4. New Booking Flow (Staff-Initiated)

**Purpose:** Staff creates appointment on behalf of a customer

**Who uses this:** Salon owner or staff member (NOT the customer)

**When to use:**
- Customer calls to book an appointment
- Customer asks in-person for a future booking
- Staff schedules repeat appointment for regular client
- VIP booking requested by premium customer

> **Note:** Customers book their own appointments through the **Customer Mobile App** or website. This Business App feature is for staff to manage bookings on behalf of clients.

**Layout (Step 1 - Select Client):**

```
┌─────────────────────────────────────────┐
│ ✕ Cancel    New Booking                 │
├─────────────────────────────────────────┤
│  Step 1 of 4: Select Client             │
│  ○───●───○───○                          │
├─────────────────────────────────────────┤
│                                         │
│  🔍 Search clients...                   │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [➕ Add Walk-in Guest]                 │
│                                         │
│  Recent Clients                         │
│  ┌───────────────────────────────────┐  │
│  │ 👤 Priya Sharma                   │  │
│  │    Last visit: Dec 15, 2025       │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ 👤 Rahul Verma                    │  │
│  │    Last visit: Dec 10, 2025       │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ 👤 Meera Patel                    │  │
│  │    Last visit: Dec 8, 2025        │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│           [Next: Select Services →]     │
└─────────────────────────────────────────┘
```

**Wizard Steps Overview:**
1. **Select Client** - Search or add walk-in guest
2. **Select Services** - Choose services with staff assignment
3. **Pick Date & Time** - Calendar with available slots
4. **Review & Confirm** - Summary with payment option

---

**Layout (Step 2 - Select Services):**

```
┌─────────────────────────────────────────┐
│ ← Back      New Booking                 │
├─────────────────────────────────────────┤
│  Step 2 of 4: Select Services           │
│  ●───●───○───○                          │
├─────────────────────────────────────────┤
│                                         │
│  👤 Booking for: Priya Sharma           │
│                                         │
│  🔍 Search services...                  │
│                                         │
├─────────────────────────────────────────┤
│  💇 Hair Services                       │
│  ┌───────────────────────────────────┐  │
│  │ ☑ Haircut              ₹500      │  │
│  │   ⏱ 30 min                        │  │
│  │   Staff: [Anjali ▼]               │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ ☑ Hair Coloring        ₹1,500    │  │
│  │   ⏱ 90 min                        │  │
│  │   Staff: [Anjali ▼]               │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ ☐ Hair Spa             ₹800      │  │
│  │   ⏱ 45 min                        │  │
│  └───────────────────────────────────┘  │
│                                         │
│  💅 Nail Services                       │
│  ┌───────────────────────────────────┐  │
│  │ ☐ Manicure             ₹400      │  │
│  │   ⏱ 30 min                        │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  Selected: 2 services • 120 min         │
│  Subtotal: ₹2,000                       │
│                                         │
│  [← Back]        [Next: Pick Time →]    │
└─────────────────────────────────────────┘
```

---

**Layout (Step 3 - Pick Date & Time):**

```
┌─────────────────────────────────────────┐
│ ← Back      New Booking                 │
├─────────────────────────────────────────┤
│  Step 3 of 4: Pick Date & Time          │
│  ●───●───●───○                          │
├─────────────────────────────────────────┤
│                                         │
│  👤 Priya Sharma • 2 services • 120 min │
│  👩‍💼 Staff: Anjali                       │
│                                         │
├─────────────────────────────────────────┤
│  📅 Select Date                         │
│  ┌───────────────────────────────────┐  │
│  │     December 2025                 │  │
│  │  Su  Mo  Tu  We  Th  Fr  Sa       │  │
│  │      1   2   3   4   5   6        │  │
│  │   7   8   9  10  11  12  13       │  │
│  │  14  15  16  17  18  19  20       │  │
│  │  21 [22] 23  24  25  26  27       │  │ ← Selected
│  │  28  29  30  31                   │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  ⏰ Available Time Slots                │
│  ┌───────────────────────────────────┐  │
│  │ ░░ 9:00 AM  │ ✓ 10:00 AM         │  │ ← Booked / Available
│  │ ░░ 11:00 AM │ ✓ 2:00 PM          │  │
│  │ ✓  3:00 PM  │ ✓ 4:00 PM          │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Selected: Dec 22, 2025 at 2:00 PM      │
│  End time: 4:00 PM (120 min duration)   │
│                                         │
│  [← Back]       [Next: Review →]        │
└─────────────────────────────────────────┘
```

**Slot Status Indicators:**
- ✓ Green = Available
- ░░ Gray = Already booked / Unavailable
- 🔵 Blue outline = Selected

---

**Layout (Step 4 - Review & Confirm):**

```
┌─────────────────────────────────────────┐
│ ← Back      New Booking                 │
├─────────────────────────────────────────┤
│  Step 4 of 4: Review & Confirm          │
│  ●───●───●───●                          │
├─────────────────────────────────────────┤
│                                         │
│  📋 Booking Summary                     │
│                                         │
│  👤 Client                              │
│  ┌───────────────────────────────────┐  │
│  │ Priya Sharma                      │  │
│  │ 📱 +91 98765 43210                │  │
│  └───────────────────────────────────┘  │
│                                         │
│  📅 Appointment                         │
│  ┌───────────────────────────────────┐  │
│  │ Dec 22, 2025 (Monday)             │  │
│  │ 2:00 PM - 4:00 PM                 │  │
│  │ Staff: Anjali                     │  │
│  └───────────────────────────────────┘  │
│                                         │
│  🛍️ Services                            │
│  ┌───────────────────────────────────┐  │
│  │ Haircut              30m   ₹500  │  │
│  │ Hair Coloring        90m ₹1,500  │  │
│  │ ────────────────────────────────│  │
│  │ Subtotal                  ₹2,000 │  │
│  │ GST (18%)                   ₹360 │  │
│  │ ════════════════════════════════│  │
│  │ Total                     ₹2,360 │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  💳 Payment Option                      │
│  ┌───────────────────────────────────┐  │
│  │ ○ Pay Now (Razorpay)              │  │
│  │ ● Pay at Salon                    │  │
│  │ ○ Request Advance (₹500)          │  │
│  └───────────────────────────────────┘  │
│                                         │
│  📱 Send Confirmation                   │
│  ☑ SMS to client                        │
│  ☑ WhatsApp reminder (1hr before)       │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │       ✓ Confirm Booking           │  │ ← Gradient CTA
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Booking Flow Features:**
- **Smart staff matching**: Auto-assigns staff based on service skills
- **Conflict detection**: Prevents double-booking
- **Duration calculation**: Auto-calculates total time
- **Buffer time**: Optional gap between appointments
- **Recurring bookings**: Option to repeat weekly/monthly
- **Package redemption**: Apply client's active packages
- **Discount codes**: Apply promo codes at checkout
- **Notes field**: Internal notes for staff

**Post-Booking Actions:**
- Booking added to calendar
- SMS/WhatsApp confirmation sent to client
- Staff notified via push notification
- Payment link sent (if advance requested)

---

### 4b. Walk-in Check-in (Quick Flow)

**Purpose:** Quickly check-in clients who arrive without an appointment

**Key Difference from New Booking:**
| New Booking | Walk-in Check-in |
|-------------|------------------|
| For future appointments | Client is at salon NOW |
| 4-step wizard | 2-step quick flow |
| Pick date & time | Auto-set to current time |
| Sends confirmation SMS | No confirmation needed |
| Plan ahead | Serve immediately |

**Layout (Step 1 - Quick Client Entry):**

```
┌─────────────────────────────────────────┐
│ ✕ Cancel      Walk-in Check-in          │
├─────────────────────────────────────────┤
│                                         │
│  🚶 Walk-in Client                       │
│                                         │
│  🔍 Search existing client...           │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│         ─── or ───                      │
│                                         │
│  ➕ New Guest (Quick Entry)             │
│  ┌───────────────────────────────────┐  │
│  │ Name: ____________________        │  │
│  │ Phone: +91 _______________        │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Recent Walk-ins                        │
│  ┌───────────────────────────────────┐  │
│  │ 👤 Amit Kumar (Today, 10:30 AM)   │  │
│  │ 👤 Sneha Rao (Yesterday)          │  │
│  └───────────────────────────────────┘  │
│                                         │
│          [Next: Select Services →]       │
└─────────────────────────────────────────┘
```

**Layout (Step 2 - Quick Service & Staff Assignment):**

```
┌─────────────────────────────────────────┐
│ ← Back      Walk-in Check-in            │
├─────────────────────────────────────────┤
│                                         │
│  👤 Walk-in: Amit Kumar                 │
│  ⏰ Check-in Time: 2:30 PM              │
│                                         │
├─────────────────────────────────────────┤
│  🛍️ Quick Service Selection             │
│                                         │
│  Popular Services                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Haircut │ │ Beard   │ │ Facial  │   │
│  │  ₹500   │ │  ₹200   │ │  ₹800   │   │
│  │   ☑     │ │   ☐     │ │   ☐     │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Hair Spa│ │ Massage │ │ Waxing  │   │
│  │  ₹600   │ │ ₹1,000  │ │  ₹400   │   │
│  │   ☐     │ │   ☐     │ │   ☐     │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
│  [+ Browse All Services]                │
│                                         │
├─────────────────────────────────────────┤
│  👩‍💼 Available Staff NOW                 │
│  ┌───────────────────────────────────┐  │
│  │ 🟢 Anjali - Free now              │  │
│  │ 🟢 Vikram - Free in 10 min        │  │
│  │ 🔴 Neha - Busy until 3:30 PM      │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Selected: Anjali                       │
│                                         │
├─────────────────────────────────────────┤
│  Services: 1 • Est. Time: 30 min        │
│  Total: ₹500                            │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │      ✓ Check-in & Start           │  │ ← Gradient CTA
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Walk-in Flow Features:**
- **2-step quick process** (vs 4-step for New Booking)
- **Real-time staff availability** - Shows who's free NOW
- **Popular services grid** - Quick tap selection
- **Auto time-stamp** - Check-in time auto-recorded
- **Immediate start** - No confirmation needed, service begins
- **Queue integration** - Can add to Front Desk queue if all staff busy

**Post Check-in:**
- Appointment created with "In Progress" status
- Timer starts for service duration tracking
- Staff receives notification
- Client added to Front Desk view

---

### 5. Client List

**Purpose:** Browse and manage customer database

**Layout:**

```
┌─────────────────────────────────────────┐
│ ☰ Menu        Clients        ➕ Add     │
├─────────────────────────────────────────┤
│                                         │
│  🔍 Search by name or phone...          │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Filter: [All ▼]  Sort: [Recent ▼]      │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 👤 Priya Sharma                   │  │
│  │    📱 +91 98765 43210             │  │
│  │    👑 VIP • 12 visits • ₹24,500   │  │
│  │    Last: Dec 15 • Haircut, Color  │  │
│  │    [Book] [Call] [→]              │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 👤 Rahul Verma                    │  │
│  │    📱 +91 98765 43211             │  │
│  │    🔄 Regular • 8 visits • ₹6,400 │  │
│  │    Last: Dec 10 • Beard Trim      │  │
│  │    [Book] [Call] [→]              │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 👤 Meera Patel                    │  │
│  │    📱 +91 98765 43212             │  │
│  │    ⭐ New • 1 visit • ₹2,500      │  │
│  │    Last: Dec 8 • Facial           │  │
│  │    [Book] [Call] [→]              │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Search by name, phone, or email
- Filter by: All, VIP, Regular, New, Inactive
- Sort by: Recent visit, Name, Total spent
- Quick actions: Book appointment, Call
- Client tier badges (VIP, Regular, New)
- Swipe actions: Edit, Delete

---

### 6. Client Profile (360 View)

**Purpose:** Complete view of customer relationship

**Layout:**

```
┌─────────────────────────────────────────┐
│ ← Back    Client Profile    ⋮ Options   │
├─────────────────────────────────────────┤
│                                         │
│        ┌─────────────────────┐          │
│        │         👤          │          │
│        │    Priya Sharma     │          │
│        │    👑 VIP Client    │          │
│        │  Member since 2023  │          │
│        └─────────────────────┘          │
│                                         │
│  [📱 Call]  [💬 Message]  [📅 Book]     │
│                                         │
├─────────────────────────────────────────┤
│  [Overview] [History] [Preferences]     │ ← Tabs
├─────────────────────────────────────────┤
│                                         │
│  📊 Client Summary                      │
│  ┌───────────────────────────────────┐  │
│  │ Total Visits    │ Total Spent     │  │
│  │      12         │    ₹24,500      │  │
│  ├─────────────────┼─────────────────┤  │
│  │ Avg. Ticket     │ Last Visit      │  │
│  │    ₹2,042       │   Dec 15        │  │
│  └───────────────────────────────────┘  │
│                                         │
│  📝 Contact Information                 │
│  ┌───────────────────────────────────┐  │
│  │ 📱 +91 98765 43210                │  │
│  │ ✉️ priya@email.com                │  │
│  │ 🎂 March 15 (Birthday)            │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ⭐ Favorite Services                   │
│  ┌───────────────────────────────────┐  │
│  │ • Haircut (8 times)               │  │
│  │ • Hair Coloring (5 times)         │  │
│  │ • Deep Conditioning (4 times)     │  │
│  └───────────────────────────────────┘  │
│                                         │
│  📝 Notes                               │
│  ┌───────────────────────────────────┐  │
│  │ Prefers organic products. Allergy │  │
│  │ to ammonia-based dyes.            │  │
│  │ [Edit Notes]                      │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Tabs:**
- **Overview:** Summary stats, contact, favorites, notes
- **History:** All past appointments with details
- **Preferences:** Service preferences, product preferences, communication preferences

---

### 7. Staff List

**Purpose:** View and manage team members

**Layout:**

```
┌─────────────────────────────────────────┐
│ ☰ Menu       Team Management   ➕ Add   │
├─────────────────────────────────────────┤
│                                         │
│  [Active (8)]  [On Leave (2)]  [All]    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 👤 Anjali Kapoor                  │  │
│  │    Senior Stylist                 │  │
│  │    🟢 Available • 3 appts today   │  │
│  │    [Schedule] [Profile →]         │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 👤 Vikram Singh                   │  │
│  │    Barber                         │  │
│  │    🟢 Available • 5 appts today   │  │
│  │    [Schedule] [Profile →]         │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 👤 Neha Sharma                    │  │
│  │    Beauty Therapist               │  │
│  │    🔴 On Leave until Dec 25       │  │
│  │    [Schedule] [Profile →]         │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  Quick Actions                          │
│  ┌───────────────────────────────────┐  │
│  │ 💰 Payroll    │ 📊 Commissions    │  │
│  │ 🏖️ Leave Mgmt │ 📋 Onboarding    │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Tab filters: Active, On Leave, All
- Quick view of today's appointments per staff
- Status indicators (Available, Busy, On Leave)
- Quick access to payroll and team management features

---

### 8. Staff Profile

**Purpose:** Individual staff member details and management

**Layout:**

```
┌─────────────────────────────────────────┐
│ ← Back      Staff Profile    ⋮ Edit     │
├─────────────────────────────────────────┤
│                                         │
│        ┌─────────────────────┐          │
│        │         👤          │          │
│        │   Anjali Kapoor     │          │
│        │   Senior Stylist    │          │
│        │   🟢 Active         │          │
│        └─────────────────────┘          │
│                                         │
│  [📱 Call]  [💬 Message]  [📅 Schedule] │
│                                         │
├─────────────────────────────────────────┤
│  [Details] [Schedule] [Performance]     │
├─────────────────────────────────────────┤
│                                         │
│  📋 Employment Details                  │
│  ┌───────────────────────────────────┐  │
│  │ Role: Senior Stylist              │  │
│  │ Joined: March 2022                │  │
│  │ Base Salary: ₹35,000/month        │  │
│  │ Commission: 15% on services       │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ✂️ Services Offered                    │
│  ┌───────────────────────────────────┐  │
│  │ • Haircuts                        │  │
│  │ • Hair Coloring                   │  │
│  │ • Hair Treatments                 │  │
│  │ • Bridal Styling                  │  │
│  │ [Edit Services]                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  📊 This Month's Stats                  │
│  ┌───────────────────────────────────┐  │
│  │ Appointments    │ Revenue         │  │
│  │      45         │   ₹67,500       │  │
│  ├─────────────────┼─────────────────┤  │
│  │ Commission      │ Rating          │  │
│  │   ₹10,125       │   4.8 ⭐        │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

---

### 9. Payroll Overview

**Purpose:** Manage staff payroll and salary disbursements

**Layout:**

```
┌─────────────────────────────────────────┐
│ ← Back        Payroll         📊 Report │
├─────────────────────────────────────────┤
│                                         │
│  December 2025 Payroll                  │
│  ┌───────────────────────────────────┐  │
│  │     Status: ⏳ Pending            │  │
│  │     Due Date: Dec 31, 2025        │  │
│  │     Total: ₹2,85,000              │  │
│  │     [Process Payroll]             │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  Staff Breakdown                        │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Anjali Kapoor                     │  │
│  │ Base: ₹35,000 + Comm: ₹10,125     │  │
│  │ Total: ₹45,125     [✓ Approved]   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Vikram Singh                      │  │
│  │ Base: ₹30,000 + Comm: ₹8,400      │  │
│  │ Total: ₹38,400     [⏳ Pending]   │  │
│  │                     [Approve]     │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Neha Sharma                       │  │
│  │ Base: ₹28,000 + Comm: ₹6,200      │  │
│  │ - Leave Deduction: ₹2,800         │  │
│  │ Total: ₹31,400     [⏳ Pending]   │  │
│  │                     [Approve]     │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  [View Past Payrolls]                   │
└─────────────────────────────────────────┘
```

---

### 10. Services Management

**Purpose:** Manage service catalog and pricing

**Layout:**

```
┌─────────────────────────────────────────┐
│ ← Back      Services & Pricing   ➕ Add │
├─────────────────────────────────────────┤
│                                         │
│  🔍 Search services...                  │
│                                         │
│  Categories:                            │
│  [All] [Hair] [Skin] [Nails] [Spa]      │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  💇 Hair Services (8)                   │ ← Collapsible
│  ┌───────────────────────────────────┐  │
│  │ Haircut - Women                   │  │
│  │ ₹500 • 45 min • 🟢 Active         │  │
│  │ [Edit] [Toggle]                   │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ Hair Coloring - Full              │  │
│  │ ₹2,000 • 120 min • 🟢 Active      │  │
│  │ [Edit] [Toggle]                   │  │
│  └───────────────────────────────────┘  │
│  [Show More...]                         │
│                                         │
│  💆 Skin Services (5)                   │
│  ┌───────────────────────────────────┐  │
│  │ Classic Facial                    │  │
│  │ ₹800 • 60 min • 🟢 Active         │  │
│  │ [Edit] [Toggle]                   │  │
│  └───────────────────────────────────┘  │
│  [Show More...]                         │
│                                         │
├─────────────────────────────────────────┤
│  Related                                │
│  [📦 Packages] [👑 Memberships]         │
│                                         │
└─────────────────────────────────────────┘
```

---

### 10a. Packages List

**Purpose:** View and manage service bundles/combo packages with discounted pricing

**File Path:** `app/packages/index.tsx`

**Layout:**

```
┌─────────────────────────────────────────┐
│ ← Back        Packages           ➕ Add │
├─────────────────────────────────────────┤
│                                         │
│  Stats Overview                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Total   │ │ Active  │ │ Revenue │   │
│  │   12    │ │    8    │ │ ₹45.2K  │   │
│  │ Packages│ │ [filter]│ │ This Mo │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
│  🔍 Search packages...                  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🎁 Ultimate Pampering Package    │  │
│  │                                   │  │
│  │ Haircut + Facial + Manicure      │  │
│  │ ⏱️ 150 min • 3 services          │  │
│  │                                   │  │
│  │ ₹1,800  ₹2,300  [22% OFF]        │  │
│  │ (package) (regular)   🟢 Active   │  │
│  │                                   │  │
│  │ 📊 32 sold this month            │  │
│  │                                   │  │
│  │ [Edit] [Toggle] [···]            │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🎁 Men's Grooming Special        │  │
│  │                                   │  │
│  │ Haircut + Beard + Face Massage   │  │
│  │ ⏱️ 75 min • 3 services           │  │
│  │                                   │  │
│  │ ₹900  ₹1,200  [25% OFF]          │  │
│  │ (package) (regular)   🔴 Inactive│  │
│  │                                   │  │
│  │ 📊 18 sold this month            │  │
│  │                                   │  │
│  │ [Edit] [Toggle] [···]            │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [Load More...]                         │
│                                         │
└─────────────────────────────────────────┘
```

**Key Features:**
- Stats cards with tap-to-filter (Active/Inactive)
- Search with debounce
- Package cards showing: name, included services, duration, price comparison, savings badge
- Sold count for popularity tracking
- Quick toggle for active/inactive status
- More menu (···) for duplicate, share, delete actions
- Pull-to-refresh
- Empty state with illustration

**API Endpoints:**
- GET `/api/salons/:id/packages` - List all packages
- PATCH `/api/salons/:id/packages/:pkgId/toggle` - Toggle active status
- DELETE `/api/salons/:id/packages/:pkgId` - Delete package

---

### 10b. Add/Edit Package (3-Step Wizard)

**Purpose:** Create or edit service bundles with discounted pricing

**File Path:** `app/packages/add-edit.tsx`

**Fresha-Inspired Improvements:**
- Category selection for bundle organization
- Schedule type: Sequential vs Parallel booking
- Extra time options per service (Processing/Blocked time)
- Tax rate configuration
- Gender availability for online booking

**Step 1: Package Details**

```
┌─────────────────────────────────────────┐
│ ← Cancel   Create Package       [Next] │
├─────────────────────────────────────────┤
│                                         │
│  Step 1 of 3: Package Details           │
│  ○──────────●──────────○                │
│  Details   Services   Pricing           │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Package Name *                         │
│  ┌───────────────────────────────────┐  │
│  │ e.g., Ultimate Pampering Package │  │
│  └───────────────────────────────────┘  │
│  💡 Choose a catchy name               │
│                                         │
│  Description (Optional)                 │
│  ┌───────────────────────────────────┐  │
│  │ Describe what makes this package │  │
│  │ special, include any policies... │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Category *                             │
│  ┌───────────────────────────────────┐  │
│  │ Select category ▼                │  │
│  └───────────────────────────────────┘  │
│  Organize your bundle in the catalog    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ ✨ Pro Tip                        │  │
│  │                                   │  │
│  │ Great packages mix different      │  │
│  │ service types! Try:               │  │
│  │ • Haircut + Beard + Face Massage │  │
│  │ • Full Body Massage + Manicure   │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Step 2: Select Services & Schedule**

```
┌─────────────────────────────────────────┐
│ ← Back    Create Package        [Next] │
├─────────────────────────────────────────┤
│                                         │
│  Step 2 of 3: Select Services           │
│  ●──────────○──────────○                │
│  Details   Services   Pricing           │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Schedule Type *                        │
│  How should services be performed?      │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ (●) Booked in Sequence           │  │
│  │     Services one after another   │  │
│  │     (single staff member)        │  │
│  ├───────────────────────────────────┤  │
│  │ ( ) Booked in Parallel           │  │
│  │     Services at the same time    │  │
│  │     (multiple staff, e.g. mani   │  │
│  │     + pedi simultaneously)       │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Select Services (Min. 2)               │
│                                         │
│  🔍 Search services...                  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  💇 Hair Services                    ▼  │
│  ┌───────────────────────────────────┐  │
│  │ [✓] Haircut - Women          [⋯]│  │
│  │     ⏱️ 45 min • ₹500              │  │
│  │     + Processing: 10 min         │  │ ← Extra time added
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ [ ] Hair Coloring - Full     [⋯]│  │
│  │     ⏱️ 120 min • ₹2,000           │  │
│  └───────────────────────────────────┘  │
│                                         │
│  💆 Skin Services                    ▼  │
│  ┌───────────────────────────────────┐  │
│  │ [✓] Classic Facial           [⋯]│  │
│  │     ⏱️ 60 min • ₹800              │  │
│  └───────────────────────────────────┘  │
│                                         │
│  💅 Nail Services                    ▼  │
│  ┌───────────────────────────────────┐  │
│  │ [✓] Manicure                 [⋯]│  │
│  │     ⏱️ 45 min • ₹400              │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────── Summary ────────────┐ │
│  │ Selected: 3 services              │ │
│  │ Total Duration: 160 min           │ │
│  │ (includes 10 min processing)      │ │
│  │ Regular Price: ₹1,700             │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Extra Time Bottom Sheet (triggered by ⋯ menu):**

```
┌─────────────────────────────────────────┐
│          Add Extra Time                 │
│                                         │
│  Haircut - Women                        │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Time Type *                            │
│  ┌───────────────────────────────────┐  │
│  │ (●) Processing Time              │  │
│  │     Client waits while color     │  │
│  │     sets. Staff can take other   │  │
│  │     bookings during this time.   │  │
│  ├───────────────────────────────────┤  │
│  │ ( ) Blocked Time                 │  │
│  │     Gap between appointments for │  │
│  │     prep, cleanup, or transition.│  │
│  │     No other bookings allowed.   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Duration *                             │
│  ┌───────────────────────────────────┐  │
│  │ [10] [15] [20] [30] [45] [60]    │  │
│  └───────────────────────────────────┘  │
│  Or enter custom: [___] minutes         │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [Remove Extra Time]     [Apply]        │
│                                         │
└─────────────────────────────────────────┘
```

**Step 3: Pricing & Settings**

```
┌─────────────────────────────────────────┐
│ ← Back    Create Package      [Create] │
├─────────────────────────────────────────┤
│                                         │
│  Step 3 of 3: Pricing & Settings        │
│  ●──────────●──────────○                │
│  Details   Services   Pricing           │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Pricing Type *                         │
│  ┌───────────────────────────────────┐  │
│  │ ( ) Service Pricing              │  │
│  │     Total cost of all services   │  │
│  │     combined (₹1,700)            │  │
│  ├───────────────────────────────────┤  │
│  │ (●) Custom Price                 │  │
│  │     Set your own bundle price    │  │
│  ├───────────────────────────────────┤  │
│  │ ( ) Percentage Discount          │  │
│  │     Apply % off total price      │  │
│  ├───────────────────────────────────┤  │
│  │ ( ) Free                         │  │
│  │     No charge for this bundle    │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌─── For "Custom Price" option ─────┐  │
│  │                                   │  │
│  │  Package Price (₹) *             │  │
│  │  ┌─────────────────────────────┐ │  │
│  │  │ ₹ │ 1,400                  │ │  │
│  │  └─────────────────────────────┘ │  │
│  │  Regular total: ₹1,700           │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─── For "Percentage Discount" ─────┐  │
│  │                                   │  │
│  │  Discount Percentage *           │  │
│  │  ┌─────────────────────────────┐ │  │
│  │  │ [10%] [15%] [20%] [25%]    │ │  │
│  │  └─────────────────────────────┘ │  │
│  │  Or custom: [___]%               │  │
│  │                                   │  │
│  │  Final Price: ₹1,445 (15% off)  │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────── 🎉 Great Deal! ─────────────┐ │
│  │                          [18% OFF]│ │
│  │                                   │ │
│  │  Regular Price:  ₹1,700̶           │ │
│  │  Package Price:  ₹1,400           │ │
│  │  Customer Saves: ₹300             │ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Tax Rate                               │
│  ┌───────────────────────────────────┐  │
│  │ 18% GST ▼                        │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Validity (Optional)                    │
│  ┌───────────────────────────────────┐  │
│  │ No expiry ▼                      │  │
│  └───────────────────────────────────┘  │
│  Options: No expiry, 30, 60, 90 days    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Online Booking Settings                │
│  ┌───────────────────────────────────┐  │
│  │ Enable online booking   [toggle] │  │
│  │ Show on Stylemate marketplace    │  │
│  ├───────────────────────────────────┤  │
│  │ Available for:                   │  │
│  │ [Everyone] [Women] [Men]         │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Key Features (Enhanced with Fresha Patterns):**
- 3-step wizard with progress indicator
- **Category selection** for catalog organization
- **Schedule type**: Sequential (same staff) vs Parallel (multiple staff)
- **Extra time per service** via 3-dots menu:
  - Processing time (staff can take other bookings)
  - Blocked time (gap for prep/cleanup)
- Services grouped by category with collapsible sections
- Service search within selection
- **4 Pricing options** (Fresha pattern):
  - **Service Pricing**: Use combined total of all services
  - **Custom Price**: Set a specific bundle price
  - **Percentage Discount**: Apply % off with chip selector
  - **Free**: No charge for promotional bundles
- Real-time calculation: total duration (incl. extra time), regular price, savings, discount %
- Minimum 2 services required validation
- **Tax rate selection** for pricing
- **Gender availability** for online booking
- Unsaved changes warning on back navigation
- Loading states during save

**Validation Rules:**
- Name: required, min 3 chars
- Category: required
- Schedule Type: required
- Services: minimum 2 required
- Pricing Type: required
- Custom Price: must be > 0 and < regular price (if custom pricing selected)
- Discount %: must be 1-99 (if percentage discount selected)

**API Endpoints:**
- GET `/api/salons/:id/services` - List services for selection
- GET `/api/salons/:id/service-categories` - List categories
- POST `/api/salons/:id/packages` - Create package
- PUT `/api/salons/:id/packages/:pkgId` - Update package

---

### 10c. Memberships List

**Purpose:** Manage recurring membership plans and view member analytics (Fresha-inspired patterns)

**File Path:** `app/memberships/index.tsx`

**Design Reference:** Fresha for Business App - Catalog > Memberships

**Layout:**

```
┌─────────────────────────────────────────┐
│ ← Back      Memberships          ➕ Add │
├─────────────────────────────────────────┤
│                                         │
│  [Plans] [Members] [Analytics]          │
│  ════════════════════════════════       │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Quick Stats                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Active  │ │ Recurring│ │ Churn   │   │
│  │ Members │ │ Revenue │ │ Rate    │   │
│  │   156   │ │ ₹78.5K  │ │  4.2%   │   │
│  │ +12 new │ │ /month  │ │ ↓2.1%   │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  PLANS TAB                              │
│  Filter: [All] [One-time] [Recurring]   │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🟦 DISCOUNT                       │  │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│  │
│  │ Gold Member                       │  │
│  │ 15% off all services             │  │
│  │                                   │  │
│  │ ₹2,999 • One-time • 6 months     │  │
│  │ 👥 45 members   📈 ₹1.35L revenue│  │
│  │                                   │  │
│  │ Online Sales: ✓   Redemption: ✓  │  │
│  │ 🟢 Active        [Edit] [···]    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🟪 CREDIT/WALLET                  │  │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│  │
│  │ Premium Wallet                    │  │
│  │ Pay ₹2,000 → Get ₹2,400 credit   │  │
│  │ (20% bonus)                       │  │
│  │                                   │  │
│  │ ₹1,999/month • Recurring         │  │
│  │ 👥 28 members   💳 Auto-renews   │  │
│  │                                   │  │
│  │ Online Sales: ✓   Redemption: ✓  │  │
│  │ 🟢 Active        [Edit] [···]    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🟩 SESSION PACKAGE                │  │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│  │
│  │ Hair Care Club                    │  │
│  │ Sessions included:                │  │
│  │ • 4 Haircuts/month               │  │
│  │ • 2 Hair Spa/month               │  │
│  │ • Unlimited Blow Dry             │  │
│  │                                   │  │
│  │ ₹3,499/month • Recurring         │  │
│  │ 👥 12 members   🔄 Renews 15th   │  │
│  │                                   │  │
│  │ Online Sales: ✓   Redemption: ✓  │  │
│  │ 🟢 Active        [Edit] [···]    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🟦 DISCOUNT                       │  │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│  │
│  │ VIP Platinum                      │  │
│  │ 25% off all services             │  │
│  │                                   │  │
│  │ ₹4,999/year • One-time           │  │
│  │ 👥 8 members    🌟 Limited: 10   │  │
│  │                                   │  │
│  │ Online Sales: ✗   Redemption: ✓  │  │
│  │ ⚪ Inactive       [Edit] [···]    │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Key Features (Fresha-Inspired):**

**Tab Navigation:**
- **Plans**: Catalog of all membership plans
- **Members**: Active membership holders (separate screen 10e)
- **Analytics**: Revenue, retention, churn metrics

**Plan Type Badges (Color-coded):**
- 🟦 **Discount Membership**: Blue - Percentage off services
- 🟪 **Credit/Wallet**: Purple - Pre-paid credit with bonus
- 🟩 **Session Package**: Green - Bundled sessions (like Fresha's service bundles)

**Payment Model Indicators:**
- **One-time**: Single payment, valid for set duration
- **Recurring**: Auto-charged (weekly/monthly/quarterly/annually)
- Show renewal cycle for recurring (e.g., "Renews 15th")

**Plan Card Display:**
- Plan type badge with color accent
- Name and key benefit summary
- Price + billing type + validity
- Member count and revenue generated
- Online sales/redemption status (✓/✗)
- Status indicator (Active/Inactive/Paused)

**More Menu (···) Actions:**
- Duplicate plan
- Toggle active/inactive
- Create Flash Sale (discount on first payment)
- View sales history
- Delete plan

**Empty State:**
- Illustration with "Create Your First Membership"
- Benefits callout: "Boost retention by 40%"
- CTA: "+ Create Membership"

**API Endpoints:**
- GET `/api/salons/:id/membership-plans/manage` - List plans with stats
- GET `/api/salons/:id/membership-analytics` - Analytics dashboard data
- PATCH `/api/membership-plans/:planId/status` - Toggle active/inactive
- POST `/api/membership-plans/:planId/duplicate` - Duplicate plan

---

### 10d. Add/Edit Membership Plan

**Purpose:** Create or edit membership plans with flexible plan types (Fresha-inspired wizard)

**File Path:** `app/memberships/add-edit.tsx`

**Design Reference:** Fresha for Business App - Catalog > Memberships > Add

**Wizard Steps Overview:**
- **Step 1**: Plan Type Selection
- **Step 2**: Plan Details (dynamic based on type)
- **Step 3**: Payment & Billing
- **Step 4**: Online Settings & Review

**Step 1: Plan Type Selection**

```
┌─────────────────────────────────────────┐
│ ← Cancel   Create Membership    Step 1/4│
├─────────────────────────────────────────┤
│  ●───○───○───○  Progress                │
├─────────────────────────────────────────┤
│                                         │
│  Choose Membership Type                 │
│  How will members benefit from this     │
│  membership?                            │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🟦 Discount Membership      [●] ←│  │
│  │                                   │  │
│  │ Members get a percentage discount│  │
│  │ on all or selected services      │  │
│  │                                   │  │
│  │ 💡 Best for: Regular customers   │  │
│  │ who want savings on every visit  │  │
│  │                                   │  │
│  │ Example: 15% off all services    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🟪 Credit/Wallet            [ ] │  │
│  │                                   │  │
│  │ Members pay upfront and receive  │  │
│  │ store credit with bonus value    │  │
│  │                                   │  │
│  │ 💡 Best for: Pre-paid balance    │  │
│  │ with extra value for loyalty     │  │
│  │                                   │  │
│  │ Example: Pay ₹2000, Get ₹2400    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🟩 Session Package          [ ] │  │
│  │                                   │  │
│  │ Members get a fixed number of    │  │
│  │ sessions for specific services   │  │
│  │                                   │  │
│  │ 💡 Best for: Bundled treatments  │  │
│  │ like courses or subscriptions    │  │
│  │                                   │  │
│  │ Example: 4 Haircuts + 2 Facials  │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐│
│  │           Continue →                ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

**Step 2: Plan Details (varies by type)**

**For Discount Membership:**
```
┌─────────────────────────────────────────┐
│ ← Back    Discount Details      Step 2/4│
├─────────────────────────────────────────┤
│  ●───●───○───○  Progress                │
├─────────────────────────────────────────┤
│                                         │
│  Basic Info                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  Membership Name *                      │
│  ┌───────────────────────────────────┐  │
│  │ e.g., Gold Member, VIP Club      │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Description                            │
│  ┌───────────────────────────────────┐  │
│  │ Explain the benefits, policies,  │  │
│  │ and savings to customers...      │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Services & Discount                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  Included Services *                    │
│  ┌───────────────────────────────────┐  │
│  │ [✓] All services                 │  │
│  │ [ ] Select specific services     │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ⚠️ If specific services selected:     │
│  ┌───────────────────────────────────┐  │
│  │ [Edit] Select Services (5 chosen)│  │
│  └───────────────────────────────────┘  │
│                                         │
│  Discount Percentage *                  │
│  ┌───────────────────────────────────┐  │
│  │ [ 5%] [10%] [15%] [20%] [25%]    │  │
│  └───────────────────────────────────┘  │
│  Or enter custom: [  15  ]%             │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Appearance                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  Plan Color                             │
│  ┌───────────────────────────────────┐  │
│  │ 🔵 🟣 🟢 🟠 🔴 🟡 ⚫ [Selected]   │  │
│  └───────────────────────────────────┘  │
│  Color helps identify this plan         │
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐│
│  │           Continue →                ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

**For Credit/Wallet:**
```
┌─────────────────────────────────────────┐
│ ← Back    Credit Details        Step 2/4│
├─────────────────────────────────────────┤
│  ●───●───○───○  Progress                │
├─────────────────────────────────────────┤
│                                         │
│  Basic Info                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  Membership Name *                      │
│  ┌───────────────────────────────────┐  │
│  │ e.g., Premium Wallet, Beauty Bank│  │
│  └───────────────────────────────────┘  │
│                                         │
│  Description                            │
│  ┌───────────────────────────────────┐  │
│  │ Explain the credit value, bonus, │  │
│  │ and how credits can be used...   │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Credit Value                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  Credit Amount (per billing cycle) *    │
│  ┌───────────────────────────────────┐  │
│  │ ₹ │ 2,000                        │  │
│  └───────────────────────────────────┘  │
│  Credit added to member's wallet        │
│                                         │
│  Bonus Percentage *                     │
│  ┌───────────────────────────────────┐  │
│  │ [10%] [15%] [20%] [25%] [30%]    │  │
│  └───────────────────────────────────┘  │
│  Or enter custom: [  20  ]%             │
│                                         │
│  ┌───────────── Live Preview ─────────┐ │
│  │ 💰 Value Breakdown                │ │
│  │ ─────────────────────────────────│ │
│  │ Member pays:  ₹2,000             │ │
│  │ Bonus (20%):  + ₹400             │ │
│  │ ─────────────────────────────────│ │
│  │ Total credit: ₹2,400 ✨          │ │
│  └───────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Applicable Services                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ┌───────────────────────────────────┐  │
│  │ [●] All services                 │  │
│  │ [ ] Select specific services     │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Appearance                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Plan Color                             │
│  ┌───────────────────────────────────┐  │
│  │ 🔵 🟣 🟢 🟠 🔴 🟡 ⚫ [Selected]   │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐│
│  │           Continue →                ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

**For Session Package (Fresha-style Sessions Model):**
```
┌─────────────────────────────────────────┐
│ ← Back    Package Details       Step 2/4│
├─────────────────────────────────────────┤
│  ●───●───○───○  Progress                │
├─────────────────────────────────────────┤
│                                         │
│  Basic Info                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  Membership Name *                      │
│  ┌───────────────────────────────────┐  │
│  │ e.g., Hair Care Club, Glow Plan  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Description                            │
│  ┌───────────────────────────────────┐  │
│  │ Describe what's included and the │  │
│  │ value members receive...         │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Services & Sessions                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  Included Services *                    │
│  Tap to add services with session count │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ [+] Add Service                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ ✂️ Haircut - Women                │  │
│  │ ─────────────────────────────────│  │
│  │ Sessions per billing cycle:       │  │
│  │ [1] [2] [4] [6] [8] [∞ Unlimited] │  │
│  │ Selected: 4 sessions              │  │
│  │                                   │  │
│  │ Regular price: ₹500/session      │  │
│  │ Value: ₹2,000/cycle          [🗑️]│  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 💆 Hair Spa                       │  │
│  │ ─────────────────────────────────│  │
│  │ Sessions per billing cycle:       │  │
│  │ [1] [2] [4] [6] [8] [∞ Unlimited] │  │
│  │ Selected: 2 sessions              │  │
│  │                                   │  │
│  │ Regular price: ₹1,000/session    │  │
│  │ Value: ₹2,000/cycle          [🗑️]│  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 💨 Blow Dry                       │  │
│  │ ─────────────────────────────────│  │
│  │ Sessions per billing cycle:       │  │
│  │ [1] [2] [4] [6] [8] [∞ Unlimited] │  │
│  │ Selected: ∞ Unlimited             │  │
│  │                                   │  │
│  │ Regular price: ₹300/session      │  │
│  │ Value: Unlimited             [🗑️]│  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────── Value Summary ─────────┐│
│  │ 🎉 Great Value Package!            ││
│  │ ──────────────────────────────────│ │
│  │ Total services value:  ₹4,300+    │ │
│  │ (based on 4 Haircuts + 2 Spa)     │ │
│  │                                   │ │
│  │ 💡 Tip: Members who book weekly   │ │
│  │ services are 60% less likely to   │ │
│  │ cancel their membership!          │ │
│  └───────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Appearance                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Plan Color                             │
│  ┌───────────────────────────────────┐  │
│  │ 🔵 🟣 🟢 🟠 🔴 🟡 ⚫ [Selected]   │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐│
│  │           Continue →                ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

**Step 3: Payment & Billing (Fresha-inspired)**

```
┌─────────────────────────────────────────┐
│ ← Back    Payment & Billing     Step 3/4│
├─────────────────────────────────────────┤
│  ●───●───●───○  Progress                │
├─────────────────────────────────────────┤
│                                         │
│  Payment Type *                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ [●] One-time Payment              │  │
│  │     Client pays once upfront      │  │
│  │     Redeem over validity period   │  │
│  │                                   │  │
│  │ [ ] Recurring Payments            │  │
│  │     Auto-charged on renewal date  │  │
│  │     Sessions renew each cycle     │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ⚠️ FOR ONE-TIME PAYMENT:              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  Membership Price *                     │
│  ┌───────────────────────────────────┐  │
│  │ ₹ │ 2,999                        │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Validity Period *                      │
│  ┌───────────────────────────────────┐  │
│  │ [1 mo] [3 mo] [6 mo] [12 mo]     │  │
│  └───────────────────────────────────┘  │
│  Or custom: [  6  ] months              │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ⚠️ FOR RECURRING PAYMENTS:            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  Payment Frequency *                    │
│  ┌───────────────────────────────────┐  │
│  │ [Weekly] [Monthly] [Quarterly]   │  │
│  │ [Every 6 months] [Annually]      │  │
│  └───────────────────────────────────┘  │
│  Selected: Monthly                      │
│                                         │
│  Price per Cycle *                      │
│  ┌───────────────────────────────────┐  │
│  │ ₹ │ 1,999                  /month│  │
│  └───────────────────────────────────┘  │
│                                         │
│  Membership Length *                    │
│  ┌───────────────────────────────────┐  │
│  │ [3 mo] [6 mo] [12 mo] [Ongoing]  │  │
│  └───────────────────────────────────┘  │
│  Ongoing: Renews until cancelled        │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Tax Rate *                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ┌───────────────────────────────────┐  │
│  │ 18% GST ▼                        │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Max Members (Optional)            │  │
│  │ [  Unlimited  ▼]                 │  │
│  │ Limit to create exclusivity      │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐│
│  │           Continue →                ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

**Step 4: Online Settings & Review (Fresha-inspired)**

```
┌─────────────────────────────────────────┐
│ ← Back    Review & Create       Step 4/4│
├─────────────────────────────────────────┤
│  ●───●───●───●  Progress                │
├─────────────────────────────────────────┤
│                                         │
│  Online Settings                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Enable online sales     [🔘 ON]  │  │
│  │ Allow clients to purchase this   │  │
│  │ membership from your booking     │  │
│  │ website and marketplace          │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Enable online redemption[🔘 ON]  │  │
│  │ Allow members to book services   │  │
│  │ using their membership online    │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Terms & Conditions                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ┌───────────────────────────────────┐  │
│  │ Add any rules, policies, or      │  │
│  │ cancellation terms...            │  │
│  │                                   │  │
│  │ Example: Sessions expire at end  │  │
│  │ of billing cycle. No refunds for │  │
│  │ unused sessions.                 │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────── Plan Summary ──────────┐  │
│  │                                   │  │
│  │ 🟦 Discount Membership            │  │
│  │ ─────────────────────────────────│  │
│  │ Gold Member                       │  │
│  │                                   │  │
│  │ ✓ 15% discount on all services  │  │
│  │ ✓ Valid for 6 months            │  │
│  │ ✓ Price: ₹2,999 (one-time)      │  │
│  │ ✓ Tax: 18% GST included         │  │
│  │                                   │  │
│  │ 🌐 Online sales: Enabled         │  │
│  │ 🔄 Online redemption: Enabled    │  │
│  │                                   │  │
│  │ 🎨 Plan color: 🔵 Blue           │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────────┐│
│  │   ∇∇∇  Create Membership  ∇∇∇      ││
│  └─────────────────────────────────────┘│
│                                         │
└─────────────────────────────────────────┘
```

**Key Features (Fresha-Inspired):**
- **4-step wizard** with progress indicator
- **Plan type selection** with visual cards, examples, and best-for descriptions
- **Dynamic form fields** based on selected plan type:
  - Discount: % off, service selection, color
  - Credit/Wallet: Credit amount, bonus %, live value preview
  - Session Package: Services with session counts (1/2/4/6/8/unlimited)
- **Two payment models** (Fresha pattern):
  - One-time: Pay upfront, redeem over validity period
  - Recurring: Auto-charged weekly/monthly/quarterly/annually
- **Payment frequency options** for recurring: Weekly, Monthly, Quarterly, 6-monthly, Annually
- **Membership length options**: 3/6/12 months or "Ongoing" (renews until cancelled)
- **Color customization** for visual identification in catalog
- **Online sales/redemption toggles** (Fresha pattern)
- **Terms & conditions** text area with example template
- **Summary review** before creation with all key details
- **Tax rate selection** with GST support
- **Max members limit** for exclusivity

**Validation Rules:**
- Name: required, min 3 characters
- Plan type: required
- Payment type: required (one-time or recurring)
- Price: required, > 0
- Validity/Duration: required for one-time, 1-36 months
- Payment frequency: required for recurring
- Membership length: required for recurring (or "Ongoing")
- Discount %: 1-50% for discount plans
- Credit amount: required for credit/wallet plans, > 0
- Bonus %: 0-50% for credit/wallet plans
- Included services: min 1 for session package plans
- Sessions: at least 1 or unlimited per service

**API Endpoints:**
- POST `/api/salons/:id/membership-plans` - Create plan
- PUT `/api/membership-plans/:planId` - Update plan
- GET `/api/salons/:id/services` - List services for selection
- GET `/api/salons/:id/tax-rates` - List available tax rates

**Fresha-Inspired UX Patterns:**
- Live value preview for Credit/Wallet plans
- Session chip selectors (1/2/4/6/8/∞)
- Pro tips and retention statistics in Package builder
- Clear payment frequency labels (e.g., "/month")
- Ongoing subscription option for recurring plans
- Flash sale integration for promotional discounts

---

### 10e. Membership Members (Fresha-Inspired)

**Purpose:** View and manage active membership holders with full lifecycle management

**File Path:** `app/memberships/members.tsx`

**Design Reference:** Fresha for Business App - Sales > Memberships Sold

**Layout:**

```
┌─────────────────────────────────────────┐
│ ← Back        Members            🔍 📤  │
├─────────────────────────────────────────┤
│                                         │
│  Quick Stats                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Total   │ │ Active  │ │ Expiring│   │
│  │  186    │ │  156    │ │   12    │   │
│  │ members │ │ 📈 +8%  │ │ this wk │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Filter by Plan                         │
│  [All] [🟦Gold] [🟪Wallet] [🟩Club]     │
│                                         │
│  Filter by Status                       │
│  [All] [Active] [Expiring] [Paused]     │
│  [Expired] [Cancelled]                  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  🟢 ACTIVE (156)                        │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 👤 Priya Sharma                  │  │
│  │    📱 9876543210                 │  │
│  │    ─────────────────────────────│  │
│  │    🟦 Gold Member (Discount)     │  │
│  │    15% off all services          │  │
│  │                                   │  │
│  │    📅 Valid until: Jun 23, 2026  │  │
│  │    💰 Purchased: ₹2,999          │  │
│  │    🔄 Payment: One-time          │  │
│  │                                   │  │
│  │    🟢 Active                      │  │
│  │                                   │  │
│  │    [View Profile]   [⋮ Actions]  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 👤 Rahul Verma                   │  │
│  │    📱 9123456780                 │  │
│  │    ─────────────────────────────│  │
│  │    🟪 Premium Wallet (Credit)    │  │
│  │                                   │  │
│  │    💳 Balance: ₹3,400 remaining  │  │
│  │    📅 Renews: Jan 15, 2026       │  │
│  │    🔄 Payment: ₹1,999/month      │  │
│  │                                   │  │
│  │    🟡 Expiring in 7 days         │  │
│  │                                   │  │
│  │    [View Profile]   [⋮ Actions]  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 👤 Anjali Patel                  │  │
│  │    📱 9988776655                 │  │
│  │    ─────────────────────────────│  │
│  │    🟩 Hair Care Club (Sessions)  │  │
│  │                                   │  │
│  │    📊 Sessions remaining (cycle):│  │
│  │    ✂️ Haircut: 2/4 left         │  │
│  │    💆 Hair Spa: 1/2 left        │  │
│  │    💨 Blow Dry: Unlimited ∞     │  │
│  │                                   │  │
│  │    📅 Renews: Jan 1, 2026        │  │
│  │    🔄 Payment: ₹3,499/month      │  │
│  │                                   │  │
│  │    🟢 Active                      │  │
│  │                                   │  │
│  │    [View Profile]   [⋮ Actions]  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ⏸️ PAUSED (5)                          │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 👤 Meera Kapoor                  │  │
│  │    📱 9876512340                 │  │
│  │    ─────────────────────────────│  │
│  │    🟦 Gold Member (Discount)     │  │
│  │                                   │  │
│  │    ⏸️ Paused since: Dec 10, 2025 │  │
│  │    📝 Reason: Customer request   │  │
│  │                                   │  │
│  │    [Resume]    [View]  [⋮]       │  │
│  └───────────────────────────────────┘  │
│                                         │
│  🔴 EXPIRED (18)                        │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 👤 Vikram Singh                  │  │
│  │    📱 9012345678                 │  │
│  │    ─────────────────────────────│  │
│  │    🟦 Gold Member (Discount)     │  │
│  │                                   │  │
│  │    ❌ Expired: Nov 30, 2025      │  │
│  │    📊 Total savings: ₹4,500      │  │
│  │                                   │  │
│  │    [🔄 Renew]   [View]   [⋮]     │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [Load More...]                         │
│                                         │
└─────────────────────────────────────────┘
```

**Actions Menu (⋮) - Fresha-Inspired:**
```
┌───────────────────────────────────┐
│ Member Actions                    │
├───────────────────────────────────┤
│ 👁️ View Profile                  │
│ 📊 View Booking History           │
│ ───────────────────────────────── │
│ ⏸️ Pause Membership               │
│    Keep plan, stop billing        │
│ ▶️ Resume Membership              │
│    Reactivate paused membership   │
│ ───────────────────────────────── │
│ 🔄 Renew Membership               │
│    Extend or restart              │
│ 📧 Send Reminder                  │
│    Notify about expiry/renewal    │
│ ───────────────────────────────── │
│ ❌ Cancel Membership              │
│    Stop all future renewals       │
│    ⚠️ Cannot be undone           │
└───────────────────────────────────┘
```

**Key Features (Fresha-Inspired):**

**Quick Stats Header:**
- Total members count
- Active members with growth indicator
- Expiring this week count (urgent action needed)

**Member Card Display by Plan Type:**
- **Discount**: Valid until date, purchase price, payment type
- **Credit/Wallet**: Balance remaining, renewal date, price/cycle
- **Session Package**: Sessions used/remaining per service, renewal date

**Status-Based Grouping:**
- 🟢 **Active**: Currently valid and usable
- 🟡 **Expiring**: Within 7 days of expiration (urgent)
- ⏸️ **Paused**: Temporarily stopped (Fresha pattern)
- 🔴 **Expired**: Past validity, show total savings achieved
- ❌ **Cancelled**: Terminated (cannot reactivate - Fresha rule)

**Lifecycle Actions (Fresha Pattern):**
- **Pause**: Stop billing while keeping plan (can resume)
- **Resume**: Reactivate paused membership
- **Renew**: Extend or restart expired membership
- **Cancel**: Permanently stop (with confirmation warning)
- **Send Reminder**: Email/SMS about renewal

**Bulk Actions (Export button 📤):**
- Export to Excel (all members or filtered)
- Send bulk renewal reminders
- Generate membership report

**Filter Chips:**
- Color-coded plan type badges
- Multiple status filters (can select multiple)
- Search by name, phone, email

**API Endpoints:**
- GET `/api/salons/:id/members` - List members with filters and stats
- GET `/api/salons/:id/members/export` - Export to Excel
- PATCH `/api/memberships/:id/pause` - Pause membership
- PATCH `/api/memberships/:id/resume` - Resume paused membership
- PATCH `/api/memberships/:id/cancel` - Cancel membership (irreversible)
- POST `/api/memberships/:id/renew` - Renew expired membership
- POST `/api/memberships/:id/send-reminder` - Send renewal reminder

---

### 11. Analytics Dashboard

**Purpose:** Business insights and performance metrics

**Layout:**

```
┌─────────────────────────────────────────┐
│ ← Back       Analytics        📤 Export │
├─────────────────────────────────────────┤
│                                         │
│  Period: [This Week ▼]                  │
│                                         │
├─────────────────────────────────────────┤
│  Revenue Overview                       │
│  ┌───────────────────────────────────┐  │
│  │         📈 Revenue Chart          │  │
│  │  ₹                                │  │
│  │  50K ─┼────────────────────────   │  │
│  │  40K ─┼──────█─────────────────   │  │
│  │  30K ─┼────█─█─█───────────────   │  │
│  │  20K ─┼──█─█─█─█─█─────────────   │  │
│  │  10K ─┼─█─█─█─█─█─█─█──────────   │  │
│  │       └─M─T─W─T─F─S─S──────────   │  │
│  │                                   │  │
│  │  Total: ₹2,45,000  (+12% ↑)      │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  Key Metrics                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Appts   │ │ Clients │ │ Avg     │   │
│  │ 156     │ │ 89      │ │ Ticket  │   │
│  │ +8% ↑   │ │ +5% ↑   │ │ ₹1,570  │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  Top Services                           │
│  ┌───────────────────────────────────┐  │
│  │ 1. Haircut Women     ₹45,000  █████│ │
│  │ 2. Hair Coloring     ₹38,000  ████ │ │
│  │ 3. Facial            ₹25,000  ███  │ │
│  │ 4. Manicure          ₹18,000  ██   │ │
│  └───────────────────────────────────┘  │
│                                         │
│  Top Staff Performers                   │
│  ┌───────────────────────────────────┐  │
│  │ 1. Anjali    45 appts  ₹67,500   │  │
│  │ 2. Vikram    38 appts  ₹42,000   │  │
│  │ 3. Neha      32 appts  ₹38,000   │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  [📊 Detailed Reports]                  │
│  [🤖 ML Predictions]                    │
└─────────────────────────────────────────┘
```

---

### 12. Settings Hub

**Purpose:** Configure business settings and preferences

**Layout:**

```
┌─────────────────────────────────────────┐
│ ← Back          Settings                │
├─────────────────────────────────────────┤
│                                         │
│  🏪 Business Settings                   │
│  ┌───────────────────────────────────┐  │
│  │ 📋 Business Information         → │  │
│  │ 📍 Location & Contact           → │  │
│  │ 🕐 Working Hours                → │  │
│  │ 🖼️ Photos & Media               → │  │
│  └───────────────────────────────────┘  │
│                                         │
│  📅 Booking Settings                    │
│  ┌───────────────────────────────────┐  │
│  │ ⏰ Booking Rules                 → │  │
│  │ 🔔 Reminders & Notifications    → │  │
│  │ 📝 Cancellation Policy          → │  │
│  └───────────────────────────────────┘  │
│                                         │
│  💳 Payments                            │
│  ┌───────────────────────────────────┐  │
│  │ 💰 Payment Methods              → │  │
│  │ 🧾 Tax Settings                 → │  │
│  │ 🏦 Payout Settings              → │  │
│  └───────────────────────────────────┘  │
│                                         │
│  👥 Team                                │
│  ┌───────────────────────────────────┐  │
│  │ 👤 Shop Admins                  → │  │
│  │ 🔐 Access Permissions           → │  │
│  └───────────────────────────────────┘  │
│                                         │
│  🔧 Advanced                            │
│  ┌───────────────────────────────────┐  │
│  │ 🔗 Integrations                 → │  │
│  │ 📤 Data Export                  → │  │
│  │ 🚀 Publish Salon                → │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

---

### 13. More Features Hub

**Purpose:** Access to all additional features not in bottom tabs

**Layout:**

```
┌─────────────────────────────────────────┐
│         More Features                   │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ ✂️      │ │ 📦      │ │ 👑      │   │
│  │Services │ │Packages │ │Members  │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ 🛍️      │ │ 📊      │ │ 💬      │   │
│  │ Shop    │ │ Reports │ │ Chat    │   │
│  │         │ │         │ │  (3)    │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ 🎉      │ │ 📣      │ │ ⚙️      │   │
│  │ Events  │ │Marketing│ │Settings │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ 🏪      │ │ 💰      │ │ 📋      │   │
│  │Inventory│ │ Payroll │ │ Offers  │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  Account                                │
│  ┌───────────────────────────────────┐  │
│  │ 👤 My Profile                   → │  │
│  │ 🔔 Notifications                → │  │
│  │ ❓ Help & Support               → │  │
│  │ 🚪 Log Out                        │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

---

### 14. Chat Inbox

**Purpose:** Customer communication center

**Layout:**

```
┌─────────────────────────────────────────┐
│ ← Back      Chat Inbox       🔍 Search  │
├─────────────────────────────────────────┤
│                                         │
│  [All (12)]  [Unread (3)]  [Starred]    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 👤 Priya Sharma          2m ago  │  │
│  │ 🔵 Can I reschedule my appoint...│  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 👤 Rahul Verma          15m ago  │  │
│  │ 🔵 What time are you open on...  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 👤 Meera Patel           1h ago  │  │
│  │ 🔵 Do you have any openings fo...│  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 👤 Amit Kumar            3h ago  │  │
│  │    Thanks for the great service! │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 👤 Sneha Gupta      Yesterday    │  │
│  │    Sure, see you then!           │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

---

### 15. Product/Inventory Management

**Purpose:** Comprehensive inventory management with real-time stock tracking, supplier management, purchase orders, and stocktaking (Fresha-inspired)

**Screens in this flow:**
- 15a. Inventory Dashboard (main hub with tabs)
- 15b. Add/Edit Product (multi-step wizard)
- 15c. Stock Adjustment (receive, usage, transfer)
- 15d. Purchase Orders (PO lifecycle)
- 15e. Stocktake (physical inventory count)
- 15f. Supplier Management

---

#### 15a. Inventory Dashboard

**Purpose:** Central hub for all inventory operations with quick access to products, categories, suppliers, and orders

**Layout:**

```
┌─────────────────────────────────────────┐
│ ← Back       Inventory        ➕ Add    │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ 📦      │ │ 💰      │ │ ⚠️      │   │ ← Stats Cards
│  │ Products│ │ Value   │ │ Low     │   │   (Fresha-inspired)
│  │   124   │ │₹2.5L    │ │ Stock   │   │
│  │         │ │ total   │ │   8     │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
│  ┌─────────┐ ┌─────────┐               │
│  │ 🔄      │ │ ⏰      │               │
│  │ Reorder │ │ Expiring│               │
│  │   3     │ │   5     │               │
│  └─────────┘ └─────────┘               │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [Products] [Categories] [Suppliers] [Orders]  │ ← Tab Pills
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  🔍 Search products...        [Filter ▼]│
│                                         │
│  ⚠️ Low Stock Alerts                    │ ← Collapsible Alert Section
│  ┌───────────────────────────────────┐  │
│  │ 🔴 Hair Serum Pro         2 left  │  │
│  │ 🟡 Keratin Shampoo        5 left  │  │
│  │ 🟡 Face Cream             4 left  │  │
│  │ [📋 Create Reorder List]          │  │ ← Fresha: Quick reorder
│  └───────────────────────────────────┘  │
│                                         │
│  All Products (124)              [Sort ▼]│
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ [📷]  Hair Serum Pro              │  │ ← Product image thumbnail
│  │       L'Oreal • Hair Care         │  │ ← Brand + Category
│  │       SKU: HSP001  📊 Barcode     │  │
│  │       ┌────────────────────────┐  │  │
│  │       │ Stock: 2   │ ₹899/unit │  │  │ ← Stock badge + Price
│  │       │   🔴       │  Cost:₹650│  │  │
│  │       └────────────────────────┘  │  │
│  │       [📝 Edit] [📦 Adjust] [🛒 Reorder]│ ← Quick actions
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ [📷]  Keratin Shampoo            │  │
│  │       Matrix • Hair Care          │  │
│  │       SKU: KS002                  │  │
│  │       ┌────────────────────────┐  │  │
│  │       │ Stock: 15  │ ₹450/unit │  │  │
│  │       │   🟢       │  Cost:₹320│  │  │
│  │       └────────────────────────┘  │  │
│  │       [📝 Edit] [📦 Adjust] [🛒 Reorder]│
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  [📥 Import]  [📤 Export]  [📋 Stocktake] │ ← Bottom Action Bar
└─────────────────────────────────────────┘
```

**Categories Tab View:**

```
┌─────────────────────────────────────────┐
│  [Products] [Categories] [Suppliers] [Orders]  │
├─────────────────────────────────────────┤
│                                         │
│  Categories (8)              [➕ Add]   │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 💇 Hair Care               32 items│  │
│  │    └─ Shampoos (12)               │  │ ← Subcategories
│  │    └─ Conditioners (8)            │  │
│  │    └─ Treatments (12)             │  │
│  │    Value: ₹45,000                 │  │
│  │    [Edit] [View Products]         │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 💅 Nail Care               18 items│  │
│  │    └─ Polish (10)                 │  │
│  │    └─ Tools (8)                   │  │
│  │    Value: ₹22,000                 │  │
│  │    [Edit] [View Products]         │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🧴 Skin Care               28 items│  │
│  │    Value: ₹68,000                 │  │
│  │    [Edit] [View Products]         │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Suppliers Tab View:**

```
┌─────────────────────────────────────────┐
│  [Products] [Categories] [Suppliers] [Orders]  │
├─────────────────────────────────────────┤
│                                         │
│  Suppliers (5)               [➕ Add]   │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🏢 L'Oreal Professional           │  │
│  │    📞 +91 98765 43210             │  │
│  │    📧 orders@loreal.com           │  │
│  │    ┌────────────────────────────┐ │  │
│  │    │ Products: 24 │ Rating: ⭐4.8│ │  │
│  │    │ Pending: 2 POs             │ │  │
│  │    └────────────────────────────┘ │  │
│  │    [📝 Edit] [📋 New Order] [📞 Call]│
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🏢 Matrix India                   │  │
│  │    📞 +91 98765 12345             │  │
│  │    📧 supply@matrix.in            │  │
│  │    ┌────────────────────────────┐ │  │
│  │    │ Products: 18 │ Rating: ⭐4.5│ │  │
│  │    │ Pending: 0 POs             │ │  │
│  │    └────────────────────────────┘ │  │
│  │    [📝 Edit] [📋 New Order] [📞 Call]│
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Orders Tab View:**

```
┌─────────────────────────────────────────┐
│  [Products] [Categories] [Suppliers] [Orders]  │
├─────────────────────────────────────────┤
│                                         │
│  [All] [Draft] [Ordered] [Received]     │ ← Status Filter Chips
│                                         │
│  Purchase Orders (12)        [➕ Create]│
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 📋 PO-2024-0042                   │  │
│  │    L'Oreal Professional           │  │
│  │    Ordered: Dec 20 • Due: Dec 27  │  │
│  │    ┌────────────────────────────┐ │  │
│  │    │ Items: 8  │ Total: ₹24,500 │ │  │
│  │    │   🟡 In Transit            │ │  │ ← Status badge
│  │    └────────────────────────────┘ │  │
│  │    [👁 View] [📦 Receive Items]   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 📋 PO-2024-0041                   │  │
│  │    Matrix India                   │  │
│  │    Ordered: Dec 18 • Due: Dec 25  │  │
│  │    ┌────────────────────────────┐ │  │
│  │    │ Items: 5  │ Total: ₹12,800 │ │  │
│  │    │   ✅ Received               │ │  │
│  │    └────────────────────────────┘ │  │
│  │    [👁 View] [📊 View Receipt]    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 📋 PO-2024-0040                   │  │
│  │    L'Oreal Professional           │  │
│  │    Created: Dec 22 (Draft)        │  │
│  │    ┌────────────────────────────┐ │  │
│  │    │ Items: 3  │ Total: ₹8,200  │ │  │
│  │    │   📝 Draft                  │ │  │
│  │    └────────────────────────────┘ │  │
│  │    [✏️ Edit] [📤 Send to Supplier]│  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Component Specifications:**

| Component | Behavior |
|-----------|----------|
| Stats Cards | Tap to filter list (e.g., tap "Low Stock" shows only low stock items) |
| Product Card | Swipe left for delete, long-press for more options |
| Stock Badge | 🔴 Out/Critical (≤ min), 🟡 Low (≤ reorder point), 🟢 Good |
| Filter Dropdown | Category, Supplier, Stock Status, Retail Status |
| Sort Options | Name A-Z, Stock Low-High, Price, Recently Updated |
| Import | CSV upload with column mapping (Fresha pattern) |
| Export | Excel/CSV download with filters applied |

**API Endpoints:**
- GET `/api/salons/:id/products` - List products with filters
- GET `/api/salons/:id/inventory/metrics` - Dashboard stats
- GET `/api/salons/:id/product-categories` - List categories
- GET `/api/salons/:id/vendors` - List suppliers
- GET `/api/salons/:id/purchase-orders` - List POs

---

#### 15b. Add/Edit Product (Multi-Step Wizard)

**Purpose:** Create or edit products with comprehensive details (Fresha-inspired step wizard)

**Step 1: Basic Info**

```
┌─────────────────────────────────────────┐
│ ← Cancel     Add Product       Step 1/4 │
├─────────────────────────────────────────┤
│                                         │
│  ○───●───○───○                          │ ← Progress indicator
│  Basic  Stock  Pricing  Retail          │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  📷 Product Photo                       │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │         [📷 Add Photo]            │  │ ← Tap to upload/camera
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Product Name *                         │
│  ┌───────────────────────────────────┐  │
│  │ Hair Repair Serum                 │  │
│  └───────────────────────────────────┘  │
│                                         │
│  SKU (Auto-generated if blank)          │
│  ┌───────────────────────────────────┐  │
│  │ HRS-001                           │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Barcode (Optional)                     │
│  ┌───────────────────────────────────┐  │
│  │ 8901234567890          [📷 Scan] │  │ ← Barcode scanner
│  └───────────────────────────────────┘  │
│                                         │
│  Brand                                  │
│  ┌───────────────────────────────────┐  │
│  │ L'Oreal Professional          ▼  │  │ ← Dropdown with add new
│  └───────────────────────────────────┘  │
│                                         │
│  Category *                             │
│  ┌───────────────────────────────────┐  │
│  │ Hair Care > Treatments        ▼  │  │ ← Hierarchical selector
│  └───────────────────────────────────┘  │
│                                         │
│  Description                            │
│  ┌───────────────────────────────────┐  │
│  │ Intensive repair serum for       │  │
│  │ damaged hair...                  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Size / Volume                          │
│  ┌───────────────────────────────────┐  │
│  │ 100                    │ ml   ▼ │  │ ← Unit selector
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │             Next Step →           │  │ ← Gradient CTA
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Step 2: Stock Settings**

```
┌─────────────────────────────────────────┐
│ ← Back       Add Product       Step 2/4 │
├─────────────────────────────────────────┤
│                                         │
│  ●───●───○───○                          │
│  Basic  Stock  Pricing  Retail          │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  🔔 Stock Tracking                      │
│  ┌───────────────────────────────────┐  │
│  │ Track stock levels         [ON]  │  │ ← Toggle
│  │ Get alerts for low stock         │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Current Stock *                        │
│  ┌───────────────────────────────────┐  │
│  │ 25                       │ units │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Minimum Stock Level (Alert threshold)  │
│  ┌───────────────────────────────────┐  │
│  │ 5                        │ units │  │
│  └───────────────────────────────────┘  │
│  ℹ️ Alert when stock falls below this   │
│                                         │
│  Reorder Point                          │
│  ┌───────────────────────────────────┐  │
│  │ 10                       │ units │  │
│  └───────────────────────────────────┘  │
│  ℹ️ Suggest reorder when stock reaches  │
│                                         │
│  Reorder Quantity                       │
│  ┌───────────────────────────────────┐  │
│  │ 20                       │ units │  │
│  └───────────────────────────────────┘  │
│  ℹ️ Default quantity for purchase orders│
│                                         │
│  Lead Time (Supplier delivery time)     │
│  ┌───────────────────────────────────┐  │
│  │ 7                        │ days  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Storage Location                       │
│  ┌───────────────────────────────────┐  │
│  │ Shelf A3, Back Room              │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Expiry Date (Optional)                 │
│  ┌───────────────────────────────────┐  │
│  │ 📅 Select date...                │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  [← Previous]            [Next Step →]  │
└─────────────────────────────────────────┘
```

**Step 3: Pricing**

```
┌─────────────────────────────────────────┐
│ ← Back       Add Product       Step 3/4 │
├─────────────────────────────────────────┤
│                                         │
│  ●───●───●───○                          │
│  Basic  Stock  Pricing  Retail          │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Supplier *                             │
│  ┌───────────────────────────────────┐  │
│  │ L'Oreal Professional          ▼  │  │
│  └───────────────────────────────────┘  │
│  [➕ Add New Supplier]                  │
│                                         │
│  Cost Price (Purchase Price) *          │
│  ┌───────────────────────────────────┐  │
│  │ ₹  │ 650                         │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Selling Price (Salon Services) *       │
│  ┌───────────────────────────────────┐  │
│  │ ₹  │ 899                         │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 💰 Margin: ₹249 (38.3%)          │  │ ← Auto-calculated
│  └───────────────────────────────────┘  │
│                                         │
│  Tax Category                           │
│  ┌───────────────────────────────────┐  │
│  │ GST 18%                       ▼  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Supplier SKU (Optional)                │
│  ┌───────────────────────────────────┐  │
│  │ LOreal_HRS_100ml                 │  │
│  └───────────────────────────────────┘  │
│  ℹ️ Supplier's product code for orders  │
│                                         │
├─────────────────────────────────────────┤
│  [← Previous]            [Next Step →]  │
└─────────────────────────────────────────┘
```

**Step 4: Retail Settings (Online Sales)**

```
┌─────────────────────────────────────────┐
│ ← Back       Add Product       Step 4/4 │
├─────────────────────────────────────────┤
│                                         │
│  ●───●───●───●                          │
│  Basic  Stock  Pricing  Retail          │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  🛒 Retail Sales                        │
│  ┌───────────────────────────────────┐  │
│  │ Available for online sale  [OFF] │  │ ← Master toggle
│  │ Customers can purchase online    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ── Settings appear when toggle ON ──   │
│                                         │
│  Retail Price (Customer Price)          │
│  ┌───────────────────────────────────┐  │
│  │ ₹  │ 999                         │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Retail Stock Allocation                │
│  ┌───────────────────────────────────┐  │
│  │ Allocate specific stock    [ON]  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Stock for Online Sales                 │
│  ┌───────────────────────────────────┐  │
│  │ 10          of 25 total units    │  │
│  └───────────────────────────────────┘  │
│  ┌────────────────────────────────┐     │
│  │ █████████░░░░░░░ 40% allocated │     │ ← Visual indicator
│  └────────────────────────────────┘     │
│                                         │
│  Retail Description                     │
│  ┌───────────────────────────────────┐  │
│  │ Professional hair repair serum   │  │
│  │ for salon-quality results at     │  │
│  │ home...                          │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ⭐ Feature on Shop                     │
│  ┌───────────────────────────────────┐  │
│  │ Featured product          [OFF]  │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │          💾 Save Product          │  │ ← Gradient CTA
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Form Validation (Zod Schema):**
```typescript
productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  brandId: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  size: z.string().optional(),
  unit: z.enum(["ml", "g", "oz", "piece", "pack"]),
  trackStock: z.boolean().default(true),
  currentStock: z.number().min(0),
  minimumStock: z.number().min(0),
  reorderPoint: z.number().min(0).optional(),
  reorderQuantity: z.number().min(1).optional(),
  leadTimeDays: z.number().min(1).default(7),
  location: z.string().optional(),
  expiryDate: z.date().optional(),
  vendorId: z.string().optional(),
  costPriceInPaisa: z.number().min(0),
  sellingPriceInPaisa: z.number().min(0),
  taxCategory: z.string().optional(),
  availableForRetail: z.boolean().default(false),
  retailPriceInPaisa: z.number().optional(),
  retailStockAllocated: z.number().optional(),
  retailDescription: z.string().optional(),
  featured: z.boolean().default(false),
});
```

**API Endpoints:**
- POST `/api/salons/:id/products` - Create product
- PUT `/api/salons/:id/products/:productId` - Update product
- DELETE `/api/salons/:id/products/:productId` - Delete product
- POST `/api/salons/:id/products/:productId/photo` - Upload photo

---

#### 15c. Stock Adjustment

**Purpose:** Record stock movements for receiving, usage, adjustments, and transfers

**Layout:**

```
┌─────────────────────────────────────────┐
│ ← Back       Stock Adjustment           │
├─────────────────────────────────────────┤
│                                         │
│  📦 Hair Repair Serum                   │
│  Current Stock: 25 units                │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Adjustment Type *                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ 📥      │ │ 📤      │ │ 🔄      │   │
│  │ Receive │ │ Usage   │ │ Adjust  │   │
│  │  ✓      │ │         │ │         │   │ ← Selected state
│  └─────────┘ └─────────┘ └─────────┘   │
│  ┌─────────┐ ┌─────────┐               │
│  │ ➡️      │ │ 🗑️      │               │
│  │Transfer │ │ Damage/ │               │
│  │         │ │ Loss    │               │
│  └─────────┘ └─────────┘               │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Quantity *                             │
│  ┌─────────────────────────────────────┐│
│  │ [ - ]      15         [ + ]        ││ ← Stepper control
│  └─────────────────────────────────────┘│
│                                         │
│  New Stock Level: 40 units              │ ← Live preview
│                                         │
│  ── For Receive Type ──                 │
│                                         │
│  Purchase Order (Optional)              │
│  ┌───────────────────────────────────┐  │
│  │ PO-2024-0042               ▼     │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Unit Cost                              │
│  ┌───────────────────────────────────┐  │
│  │ ₹  │ 650                         │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Batch Number                           │
│  ┌───────────────────────────────────┐  │
│  │ BATCH-2024-1220                  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Expiry Date                            │
│  ┌───────────────────────────────────┐  │
│  │ 📅 Dec 2026                      │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ── For Usage Type ──                   │
│                                         │
│  Reason                                 │
│  ┌───────────────────────────────────┐  │
│  │ Service usage               ▼    │  │
│  └───────────────────────────────────┘  │
│  Options: Service usage, Sample,        │
│           Personal use, Other           │
│                                         │
│  Staff Member                           │
│  ┌───────────────────────────────────┐  │
│  │ Priya Sharma                 ▼   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ── Common Fields ──                    │
│                                         │
│  Notes                                  │
│  ┌───────────────────────────────────┐  │
│  │ Received from regular order...   │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │         💾 Save Adjustment        │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Stock Movement History (Bottom Sheet):**

```
┌─────────────────────────────────────────┐
│ ─────                                   │ ← Drag handle
│         Stock History                   │
├─────────────────────────────────────────┤
│                                         │
│  Today                                  │
│  ┌───────────────────────────────────┐  │
│  │ 📥 +15 units    10:30 AM          │  │
│  │    Received from PO-2024-0042     │  │
│  │    by Rahul (Admin)               │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Yesterday                              │
│  ┌───────────────────────────────────┐  │
│  │ 📤 -2 units     3:45 PM           │  │
│  │    Service usage                  │  │
│  │    by Priya (Stylist)             │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ 📤 -1 unit      11:20 AM          │  │
│  │    Sample given to client         │  │
│  │    by Anjali (Stylist)            │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Dec 20                                 │
│  ┌───────────────────────────────────┐  │
│  │ 🔄 +5 units     2:00 PM           │  │
│  │    Stock correction               │  │
│  │    by Rahul (Admin)               │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**API Endpoints:**
- POST `/api/salons/:id/stock-movements` - Create movement
- GET `/api/salons/:id/products/:productId/movements` - Get history

---

#### 15d. Purchase Orders

**Purpose:** Create and manage purchase orders for restocking (Fresha-inspired workflow)

**Create Purchase Order:**

```
┌─────────────────────────────────────────┐
│ ← Cancel     New Order        Step 1/3  │
├─────────────────────────────────────────┤
│                                         │
│  ○───●───○                              │
│  Supplier  Items  Review                │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Select Supplier *                      │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🔘 L'Oreal Professional          │  │ ← Radio selection
│  │    24 products • Last order: 5d  │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ ○  Matrix India                  │  │
│  │    18 products • Last order: 12d │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ ○  Wella Professionals           │  │
│  │    15 products • Last order: 20d │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [➕ Add New Supplier]                  │
│                                         │
│  Expected Delivery Date                 │
│  ┌───────────────────────────────────┐  │
│  │ 📅 Dec 27, 2024                  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Notes for Supplier                     │
│  ┌───────────────────────────────────┐  │
│  │ Please deliver between 10-12 AM  │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  [← Cancel]              [Next: Items →]│
└─────────────────────────────────────────┘
```

**Add Items to PO (Step 2):**

```
┌─────────────────────────────────────────┐
│ ← Back       New Order        Step 2/3  │
├─────────────────────────────────────────┤
│                                         │
│  ●───●───○                              │
│  Supplier  Items  Review                │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  L'Oreal Professional                   │
│  🔍 Search products...                  │
│                                         │
│  ⚠️ Suggested Reorders (3)              │ ← Auto-suggestions
│  ┌───────────────────────────────────┐  │
│  │ ☑️ Hair Serum Pro                 │  │
│  │    Stock: 2 🔴 • Reorder: 20      │  │
│  │    Cost: ₹650 × 20 = ₹13,000      │  │
│  │    [Qty: [-] 20 [+]]              │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ ☑️ Repair Shampoo                 │  │
│  │    Stock: 5 🟡 • Reorder: 15      │  │
│  │    Cost: ₹320 × 15 = ₹4,800       │  │
│  │    [Qty: [-] 15 [+]]              │  │
│  └───────────────────────────────────┘  │
│                                         │
│  All Products from Supplier             │
│  ┌───────────────────────────────────┐  │
│  │ ☐ Keratin Conditioner             │  │
│  │    Stock: 18 🟢                   │  │
│  │    Cost: ₹280/unit                │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ ☐ Color Protection Spray          │  │
│  │    Stock: 12 🟢                   │  │
│  │    Cost: ₹450/unit                │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  Selected: 2 items • Total: ₹17,800     │
├─────────────────────────────────────────┤
│  [← Previous]          [Next: Review →] │
└─────────────────────────────────────────┘
```

**Review & Submit (Step 3):**

```
┌─────────────────────────────────────────┐
│ ← Back       New Order        Step 3/3  │
├─────────────────────────────────────────┤
│                                         │
│  ●───●───●                              │
│  Supplier  Items  Review                │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  📋 Order Summary                       │
│                                         │
│  Supplier: L'Oreal Professional         │
│  Expected: Dec 27, 2024                 │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Item              Qty      Amount │  │
│  ├───────────────────────────────────┤  │
│  │ Hair Serum Pro     20    ₹13,000 │  │
│  │ Repair Shampoo     15     ₹4,800 │  │
│  ├───────────────────────────────────┤  │
│  │ Subtotal                 ₹17,800 │  │
│  │ GST (18%)                 ₹3,204 │  │
│  │ Shipping                    ₹500 │  │
│  ├───────────────────────────────────┤  │
│  │ TOTAL                    ₹21,504 │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Notes: Please deliver between 10-12 AM │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │     📝 Save as Draft              │  │ ← Secondary action
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │   📤 Send to Supplier             │  │ ← Primary gradient CTA
│  └───────────────────────────────────┘  │
│  Email/WhatsApp order to supplier       │
│                                         │
└─────────────────────────────────────────┘
```

**Receive Items (from PO Detail):**

```
┌─────────────────────────────────────────┐
│ ← Back       Receive Items              │
├─────────────────────────────────────────┤
│                                         │
│  📋 PO-2024-0042                        │
│  L'Oreal Professional                   │
│  Ordered: Dec 20 • Expected: Dec 27     │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ☑️ Receive All Items                   │ ← Quick action
│                                         │
│  Items to Receive                       │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Hair Serum Pro                    │  │
│  │ Ordered: 20 • Received: 0         │  │
│  │ ┌─────────────────────────────┐   │  │
│  │ │ Receive: [-]   20   [+]    │   │  │
│  │ └─────────────────────────────┘   │  │
│  │ Batch #: [____________]           │  │
│  │ Expiry:  [📅 Select]              │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Repair Shampoo                    │  │
│  │ Ordered: 15 • Received: 0         │  │
│  │ ┌─────────────────────────────┐   │  │
│  │ │ Receive: [-]   15   [+]    │   │  │
│  │ └─────────────────────────────┘   │  │
│  │ Batch #: [____________]           │  │
│  │ Expiry:  [📅 Select]              │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ⚠️ Report Discrepancy                  │
│  ┌───────────────────────────────────┐  │
│  │ Missing/damaged items?     [Add] │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Receipt Notes                          │
│  ┌───────────────────────────────────┐  │
│  │ All items received in good...    │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │      ✅ Confirm Receipt           │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**API Endpoints:**
- POST `/api/salons/:id/purchase-orders` - Create PO
- PUT `/api/salons/:id/purchase-orders/:poId` - Update PO
- POST `/api/salons/:id/purchase-orders/:poId/confirm` - Send to supplier
- POST `/api/salons/:id/purchase-orders/:poId/receive` - Receive items
- GET `/api/salons/:id/purchase-orders/:poId` - Get PO details

---

#### 15e. Stocktake (Physical Inventory Count)

**Purpose:** Perform periodic physical inventory counts and reconcile discrepancies (Fresha feature)

**Layout:**

```
┌─────────────────────────────────────────┐
│ ← Back        Stocktake                 │
├─────────────────────────────────────────┤
│                                         │
│  📋 New Stocktake                       │
│  Started: Dec 24, 2024 10:30 AM         │
│  By: Rahul (Admin)                      │
│                                         │
│  Progress: 45/124 products counted      │
│  ┌────────────────────────────────────┐ │
│  │ ████████████░░░░░░░░░░░░░░░ 36%   │ │
│  └────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  🔍 Search or scan barcode...   [📷]   │
│                                         │
│  [All] [Pending] [Counted] [Discrepancy]│
│                                         │
│  Hair Care (12/32 counted)              │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🧴 Hair Serum Pro                 │  │
│  │    System: 25 • Counted: ___      │  │
│  │    ┌─────────────────────────┐    │  │
│  │    │ Count: [-]   __   [+]   │    │  │ ← Enter actual count
│  │    └─────────────────────────┘    │  │
│  │    [📷 Scan Barcode]              │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🧴 Repair Shampoo          ✅    │  │ ← Counted
│  │    System: 18 • Counted: 18       │  │
│  │    ✓ Match                        │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🧴 Keratin Conditioner     ⚠️    │  │ ← Discrepancy
│  │    System: 15 • Counted: 12       │  │
│  │    ⚠️ -3 units discrepancy        │  │
│  │    [Add Note] [Recount]           │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  Discrepancies: 3 items (₹2,450 value)  │
├─────────────────────────────────────────┤
│  [💾 Save Progress]  [✅ Complete Stocktake]│
└─────────────────────────────────────────┘
```

**Stocktake Summary (After Completion):**

```
┌─────────────────────────────────────────┐
│ ← Back      Stocktake Report            │
├─────────────────────────────────────────┤
│                                         │
│  📋 Stocktake #ST-2024-012              │
│  Completed: Dec 24, 2024 2:45 PM        │
│  Duration: 4h 15m                       │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Summary                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ ✅      │ │ ⚠️      │ │ 💰      │   │
│  │ Matched │ │ Discrep │ │ Value   │   │
│  │   118   │ │    6    │ │ -₹4,200 │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
│  Discrepancies                          │
│  ┌───────────────────────────────────┐  │
│  │ Keratin Conditioner    -3  -₹840 │  │
│  │ Face Serum             -2  -₹1,200│  │
│  │ Nail Polish Set        -1  -₹450 │  │
│  │ Hair Color Tube        +2  +₹600 │  │ ← Overstock
│  │ ...                               │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Actions                                │
│  ┌───────────────────────────────────┐  │
│  │ 📊 Apply Stock Adjustments       │  │ ← Update system stock
│  │    Adjust 6 items to match count │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ 📤 Export Report (PDF/Excel)     │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ 🔄 Start New Stocktake           │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**API Endpoints:**
- POST `/api/salons/:id/stocktakes` - Start stocktake
- PUT `/api/salons/:id/stocktakes/:id/items` - Update counts
- POST `/api/salons/:id/stocktakes/:id/complete` - Complete stocktake
- POST `/api/salons/:id/stocktakes/:id/apply` - Apply adjustments
- GET `/api/salons/:id/stocktakes/:id/report` - Get report

---

#### 15f. Supplier Management

**Purpose:** Add and manage product suppliers with contact info and performance tracking

**Add/Edit Supplier:**

```
┌─────────────────────────────────────────┐
│ ← Cancel      Add Supplier              │
├─────────────────────────────────────────┤
│                                         │
│  Company Name *                         │
│  ┌───────────────────────────────────┐  │
│  │ L'Oreal Professional             │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Contact Person                         │
│  ┌───────────────────────────────────┐  │
│  │ Rajesh Kumar                      │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Phone                                  │
│  ┌───────────────────────────────────┐  │
│  │ +91  │ 98765 43210               │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Email                                  │
│  ┌───────────────────────────────────┐  │
│  │ orders@loreal-pro.in             │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Address                                │
│  ┌───────────────────────────────────┐  │
│  │ 123 Industrial Area, Sector 5    │  │
│  │ Mumbai, Maharashtra 400001       │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Website                                │
│  ┌───────────────────────────────────┐  │
│  │ www.loreal-professional.in       │  │
│  └───────────────────────────────────┘  │
│                                         │
│  GST Number                             │
│  ┌───────────────────────────────────┐  │
│  │ 27AABCL1234A1ZM                  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Payment Terms                          │
│  ┌───────────────────────────────────┐  │
│  │ Net 30 days                   ▼  │  │
│  └───────────────────────────────────┘  │
│  Options: COD, Net 15, Net 30, Net 45   │
│                                         │
│  Notes                                  │
│  ┌───────────────────────────────────┐  │
│  │ Preferred supplier for hair...   │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │          💾 Save Supplier         │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Supplier Detail View:**

```
┌─────────────────────────────────────────┐
│ ← Back      L'Oreal Professional  [✏️] │
├─────────────────────────────────────────┤
│                                         │
│  🏢 L'Oreal Professional                │
│  📞 +91 98765 43210                     │
│  📧 orders@loreal-pro.in                │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ [📞 Call] [📧 Email] [💬 WhatsApp]│  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Performance                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ ⭐      │ │ 📦      │ │ ⏱️      │   │
│  │ Rating  │ │ Orders  │ │ Avg     │   │
│  │  4.8    │ │   24    │ │ Delivery│   │
│  │         │ │ this yr │ │  5 days │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
│  Products from this Supplier (24)       │
│  ┌───────────────────────────────────┐  │
│  │ Hair Serum Pro          Stock: 25│  │
│  │ Repair Shampoo          Stock: 18│  │
│  │ Keratin Conditioner     Stock: 15│  │
│  │ [View All →]                      │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Recent Orders                          │
│  ┌───────────────────────────────────┐  │
│  │ PO-2024-0042  Dec 20  ₹21,504    │  │
│  │ PO-2024-0038  Dec 05  ₹15,200    │  │
│  │ PO-2024-0031  Nov 18  ₹28,750    │  │
│  │ [View All Orders →]               │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │      📋 Create New Order          │  │ ← Primary CTA
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**API Endpoints:**
- POST `/api/salons/:id/vendors` - Create supplier
- PUT `/api/salons/:id/vendors/:vendorId` - Update supplier
- DELETE `/api/salons/:id/vendors/:vendorId` - Delete supplier
- GET `/api/salons/:id/vendors/:vendorId` - Get supplier details

---

#### Inventory Flow Summary

**Screen Navigation:**
```
More Tab
    └── Inventory (15a)
            ├── Products Tab
            │       ├── Add Product → (15b)
            │       ├── Edit Product → (15b)
            │       └── Adjust Stock → (15c)
            ├── Categories Tab
            │       └── Add/Edit Category (Modal)
            ├── Suppliers Tab (15f)
            │       ├── Add Supplier
            │       └── Supplier Detail
            └── Orders Tab (15d)
                    ├── Create PO
                    ├── PO Detail
                    └── Receive Items
            
Bottom Actions:
    ├── Import Products (CSV upload)
    ├── Export Products (Excel/CSV)
    └── Stocktake → (15e)
```

**Mobile-First Optimizations (Fresha-inspired):**

1. **Barcode Scanner** - Camera integration for quick product lookup and stocktaking
2. **Bulk Actions** - Multi-select with swipe gestures for batch operations
3. **Smart Reorder** - AI-suggested reorder quantities based on sales velocity
4. **Low Stock Push Notifications** - Alert when products hit reorder point
5. **Quick Adjust** - One-tap stock adjustment without full form
6. **Offline Support** - Cache products for stocktaking in areas with poor connectivity
7. **Voice Input** - Use voice to record stock counts during stocktake

**File Paths for Implementation:**
- `app/inventory/index.tsx` - Inventory Dashboard (15a)
- `app/inventory/add-edit.tsx` - Add/Edit Product wizard (15b)
- `app/inventory/adjust.tsx` - Stock Adjustment (15c)
- `app/inventory/purchase-orders/index.tsx` - PO List (15d)
- `app/inventory/purchase-orders/create.tsx` - Create PO (15d)
- `app/inventory/purchase-orders/receive.tsx` - Receive Items (15d)
- `app/inventory/stocktake.tsx` - Stocktake (15e)
- `app/inventory/suppliers/index.tsx` - Supplier List (15f)
- `app/inventory/suppliers/add-edit.tsx` - Add/Edit Supplier (15f)

---

## Interaction Patterns

### Pull-to-Refresh
- Available on all list screens
- Shows custom branded loading indicator
- Updates data from server

### Swipe Actions
- **Swipe Left:** Delete/Archive with confirmation
- **Swipe Right:** Quick action (e.g., Call, Book)

### Long Press
- Context menu for additional options
- Haptic feedback on iOS

### Floating Action Button (FAB)
- Primary action per screen
- Gradient background matching brand
- Positioned bottom-right, 16px from edges

### Bottom Sheets
- Used for filters, forms, and confirmations
- Draggable with snap points
- Respects safe areas

### Toast Notifications
- Success: Green background
- Error: Red background
- Info: Violet background
- Auto-dismiss after 3 seconds

### Lower Quick Menus (Contextual Bottom Action Bars)

Contextual action bars that appear at the bottom of specific screens for quick access to frequent actions.

**Dashboard Screen Quick Menu:**
```
┌─────────────────────────────────────────────────────────────┐
│  ➕ New     │  🚶 Walk-in │  💳 Checkout│  💬 Messages     │
│  Booking    │             │             │  (3)             │
└─────────────────────────────────────────────────────────────┘
```
*(Updated with Checkout action - Fresha-inspired)*

**Calendar Screen Quick Menu:**
```
┌─────────────────────────────────────────────────────────────┐
│  ➕ Add     │  🔄 Sync    │  📋 Front   │  ⏰ Waitlist     │
│  Booking    │  Calendar   │  Desk       │  (3)             │
└─────────────────────────────────────────────────────────────┘
```

**Client Profile Quick Menu:**
```
┌─────────────────────────────────────────────────────────────┐
│  📅 Book    │  📞 Call    │  💬 Message │  ⭐ Add to       │
│  Appt       │             │             │  VIP             │
└─────────────────────────────────────────────────────────────┘
```

**Staff Screen Quick Menu:**
```
┌─────────────────────────────────────────────────────────────┐
│  ➕ Add     │  📅 Schedule│  💰 Payroll │  📊 Performance  │
│  Staff      │  View       │  Run        │                  │
└─────────────────────────────────────────────────────────────┘
```

**Appointment Details Quick Menu:**
```
┌─────────────────────────────────────────────────────────────┐
│  ✅ Check   │  🔄 Resched │  ❌ Cancel  │  💳 Payment      │
│  In         │  -ule       │             │                  │
└─────────────────────────────────────────────────────────────┘
```

**Services Management Quick Menu:**
```
┌─────────────────────────────────────────────────────────────┐
│  ➕ Add     │  📦 Packages│  👑 Members │  💰 Pricing      │
│  Service    │             │  -hips      │  Update          │
└─────────────────────────────────────────────────────────────┘
```

**Inventory Screen Quick Menu:**
```
┌─────────────────────────────────────────────────────────────┐
│  ➕ Add     │  📥 Restock │  ⚠️ Low     │  📊 Stock        │
│  Product    │  All        │  Stock (3)  │  Report          │
└─────────────────────────────────────────────────────────────┘
```

**Quick Menu Design Specs:**
- Height: 60px (plus safe area padding)
- Background: Slate 900 with subtle top border
- Icons: 24px, centered above 12px label text
- Touch targets: Full width of each section (equal distribution)
- Active state: Gradient violet-to-fuchsia background
- Badge support: Small pill for counts (e.g., Waitlist, Low Stock)
- Haptic feedback on tap
- Hides on scroll down, shows on scroll up (auto-hide behavior)

---

## Offline Capabilities

### Cached Data
- Client list and recent profiles
- Service catalog
- Staff list
- Today's appointments

### Offline Actions (Queue)
- Create new booking (synced when online)
- Update appointment status
- Add notes to client profiles

### Visual Indicators
- Banner when offline
- Pending sync badge on cached actions
- Last synced timestamp

---

## Accessibility Guidelines

### Touch Targets
- Minimum 44x44pt touch targets
- Adequate spacing between interactive elements

### Color Contrast
- WCAG 2.1 AA compliant contrast ratios
- Don't rely solely on color for information

### Screen Reader Support
- Meaningful labels for all interactive elements
- Proper heading hierarchy
- Announce dynamic content changes

### Motion
- Respect reduced motion preferences
- Provide alternatives to animation-based interactions

---

## Implementation Notes

### Technology Stack
- React Native with Expo SDK 51
- Expo Router for navigation
- NativeWind (Tailwind CSS for React Native)
- React Query for server state
- Zustand for local state
- React Hook Form for forms

### API Integration
- Reuse existing Express.js API endpoints
- JWT authentication with secure token storage
- Optimistic updates for better UX

### Push Notifications
- Firebase Cloud Messaging (FCM)
- Categories: Appointments, Messages, Alerts, Marketing
- Deep linking to relevant screens

---

## Next Steps

1. **Wireframe Creation:** Convert these specs to Figma wireframes
2. **Design System:** Build comprehensive component library
3. **Prototype:** Create interactive prototype for user testing
4. **Development:** Begin implementation with core screens
5. **Testing:** Beta testing with select salon owners

---

---

## Fresha Business App Comparison & Analysis

### Fresha Homepage Design Philosophy

Fresha's business app follows these key design principles:

| Design Aspect | Fresha Approach |
|---------------|-----------------|
| **Layout** | Calendar-centric - appointment calendar is the primary view |
| **Visual Style** | Clean, simplified interface with minimal clutter |
| **Color System** | Color-coded by staff or service for visual management |
| **Navigation** | Horizontal tabs: Calendar, Clients, Sales, Reports, Team, Marketing |
| **Mobile Focus** | Touch-friendly with dedicated iOS/Android apps |

### Fresha Homepage Key Elements

```
┌─────────────────────────────────────────┐
│ 🔔 Notifications    Fresha    👤 Profile│
├─────────────────────────────────────────┤
│                                         │
│  📊 Today's Snapshot                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Bookings│ │ Revenue │ │ Clients │   │
│  │   18    │ │ £1,240  │ │   12    │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  📅 Calendar View (Primary Focus)       │
│  ┌───────────────────────────────────┐  │
│  │    9:00  █████ Sarah - Haircut   │  │
│  │   10:00  █████ Jane - Color      │  │
│  │   11:00  ░░░░░ Available         │  │
│  │   12:00  █████ Mike - Beard      │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  Quick Actions                          │
│  [+ Appointment] [+ Walk-in] [Checkout] │
│                                         │
└─────────────────────────────────────────┘
│ Calendar│ Clients │ Sales │ Team │ More│ ← Bottom Nav
└─────────────────────────────────────────┘
```

### Feature Comparison: Stylemate vs Fresha

| Feature | Stylemate Design | Fresha Design | Notes |
|---------|------------------|---------------|-------|
| **Homepage Focus** | KPI Dashboard with upcoming appointments | Calendar-centric view | Stylemate offers broader overview; Fresha is action-focused |
| **Navigation** | 5-tab bottom nav (Home, Calendar, Clients, Team, More) | 5-tab bottom nav (Calendar, Clients, Sales, Team, More) | Very similar structure |
| **Quick Actions** | 2x2 grid on dashboard | Horizontal row at bottom | Stylemate more prominent; Fresha more compact |
| **KPI Display** | 3 metric cards at top | Today's snapshot panel | Both show key metrics upfront |
| **Staff View** | Separate tab with detailed profiles | Integrated in calendar filter | Stylemate more detailed staff management |
| **Payroll** | Built-in payroll with approval workflow | Team Pay add-on (2024) | Both support payroll |
| **Inventory** | Dedicated inventory screen with alerts | Product management section | Similar capabilities |
| **Chat/Messaging** | Chat inbox with badge count | Chat feature (new 2024) | Both have messaging |
| **Events** | Full events management module | Not available | Stylemate advantage |
| **AI Features** | ML predictions dashboard | Not available | Stylemate advantage |
| **Color Coding** | Status-based (confirmed/pending/cancelled) | Staff or service based | Different approaches |
| **Offline Mode** | Cached data with sync queue | Limited offline support | Stylemate advantage |

### What Stylemate Does Better

1. **Comprehensive Dashboard** - Our home screen provides a complete business overview, not just calendar
2. **Events Management** - Full workshop/class management not available in Fresha
3. **ML/AI Analytics** - Predictive insights for business decisions
4. **Payroll Workflow** - Built-in approval system vs Fresha's add-on
5. **Multi-tier Navigation** - More organized with collapsible sections
6. **Alerts System** - Prominent alerts for low stock, pending actions, messages

### What to Learn from Fresha

1. **Calendar Prominence** - Consider making calendar more prominent on homepage
2. **Simplified Initial View** - Reduce cognitive load on first screen
3. **Color Coding Options** - Add staff/service color coding to calendar
4. **Quick Checkout Flow** - Prominent checkout button for faster POS access
5. **Marketplace Integration** - Consider discovery/marketplace features

### Recommended Enhancements Based on Fresha

**Homepage Improvements:**
```
┌─────────────────────────────────────────┐
│ 🔔  Stylemate Business      👤 Profile  │
├─────────────────────────────────────────┤
│                                         │
│  Good Morning, [Name]                   │
│  📍 [Salon Name]  ▼                     │
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Today's │ │ Revenue │ │ New     │   │
│  │ Appts   │ │ Today   │ │ Clients │   │
│  │   12    │ │ ₹8,500  │ │    3    │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  📅 Today's Schedule (Compact View)     │  ← NEW: Mini calendar
│  ┌───────────────────────────────────┐  │
│  │ 10:00 ██ Priya    11:30 ██ Rahul │  │
│  │ 12:00 ██ Meera    14:00 ░░ Free  │  │
│  │ [View Full Calendar →]            │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│  ⚡ Quick Actions                        │
│  ┌──────────────────────────────────┐   │
│  │ ➕ Book │ 🚶 Walk-in│ 💳 Checkout│   │  ← NEW: Checkout added
│  └──────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  ⚠️ Needs Attention (3)                 │
│  ┌──────────────────────────────────┐   │
│  │ 🔴 2 pending confirmations       │   │
│  │ 💬 3 unread messages             │   │
│  │ 💰 1 payment pending             │   │
│  └──────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Key Changes Inspired by Fresha:**
1. Added compact "Today's Schedule" mini-calendar on dashboard
2. Added "Checkout" to quick actions for faster POS access
3. Renamed "Alerts" to "Needs Attention" for clearer action orientation
4. Added "New Clients" metric (Fresha tracks this prominently)
5. Simplified quick actions to 3 most-used functions

### Calendar Enhancement (Fresha-Inspired)

**Color Coding Options:**
```
┌─────────────────────────────────────────┐
│ ← Back    Booking Calendar    ⚙️ Filter │
├─────────────────────────────────────────┤
│                                         │
│  Color By: [Staff ▼]                    │  ← NEW: Color mode toggle
│                                         │
│  Legend:                                │
│  🔵 Anjali  🟢 Vikram  🟣 Neha          │
│                                         │
├─────────────────────────────────────────┤
│  TIME  │  APPOINTMENTS                  │
│ ───────┼───────────────────────────────│
│  9:00  │  ░░░░░░░░░░░░░░░░░░░░░░░░░   │
│ 10:00  │  🔵🔵🔵🔵 Priya - Haircut      │
│ 11:00  │  ░░░░░░░░░░░░░░░░░░░░░░░░░   │
│ 11:30  │  🟢🟢🟢🟢 Rahul - Beard        │
│ 12:00  │  🟣🟣🟣🟣🟣🟣 Meera - Package  │
│                                         │
└─────────────────────────────────────────┘
```

---

## Summary

Our Stylemate Business Mobile App design is **comprehensive and feature-rich**, offering capabilities beyond Fresha including events management, AI analytics, and detailed payroll workflows. 

The key improvements to adopt from Fresha:
1. **Mini calendar on dashboard** for quick schedule overview
2. **Prominent checkout button** for faster POS operations  
3. **Staff/service color coding** in calendar view
4. **Action-oriented language** ("Needs Attention" vs "Alerts")
5. **Simplified quick actions** focusing on top 3 tasks

Our design maintains the advantage of a **complete business dashboard** while incorporating Fresha's best practices for **quick daily operations**.

---

*Document Version: 1.1*
*Last Updated: December 22, 2025*
*Author: Stylemate Development Team*
