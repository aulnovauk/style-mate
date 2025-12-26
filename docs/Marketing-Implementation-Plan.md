# Marketing & Offers Implementation Plan

## Executive Summary

This document outlines the production-level implementation plan for the Marketing & Offers section (screens 17a-17j) of the Stylemate Business Mobile App. The implementation follows existing codebase patterns, uses centralized theming, and incorporates industry best practices from Fresha, Boulevard, Vagaro, Mindbody, GlossGenius, and Square.

---

## 1. File Structure

```
mobile/apps/stylemate-business/
├── app/
│   └── marketing/
│       ├── index.tsx                    # 17a. Offers Dashboard (main hub)
│       ├── offers/
│       │   ├── index.tsx                # 17b. Offers List
│       │   ├── create.tsx               # 17c. Create/Edit Offer (4-step wizard)
│       │   ├── [id].tsx                 # 17d. Offer Details
│       │   └── welcome.tsx              # 17e. Welcome Offers
│       ├── campaigns/
│       │   ├── index.tsx                # 17f. Campaigns Dashboard
│       │   ├── create.tsx               # 17g. Create Campaign (4-step wizard)
│       │   └── [id].tsx                 # 17h. Campaign Details
│       └── automations/
│           ├── index.tsx                # 17i. Marketing Automations List
│           └── [id].tsx                 # 17j. Automation Configuration
├── components/
│   └── marketing/
│       ├── KPIStatCard.tsx              # Reusable stat card with gradients
│       ├── GradientPill.tsx             # Status badges with gradient backgrounds
│       ├── SegmentedTabs.tsx            # Active/Scheduled/Archived tabs
│       ├── StatusBadge.tsx              # Offer/Campaign status indicators
│       ├── StepWizard.tsx               # 4-step wizard navigation
│       ├── SummaryTile.tsx              # Review step summary tiles
│       ├── OfferCard.tsx                # Offer list item card
│       ├── CampaignCard.tsx             # Campaign list item card
│       ├── AutomationCard.tsx           # Automation workflow card
│       ├── MessagePreview.tsx           # WhatsApp/SMS message preview
│       ├── QuotaMeter.tsx               # Message quota progress bar
│       ├── DeliveryFunnel.tsx           # Campaign delivery funnel visualization
│       └── PromoCodeInput.tsx           # Promo code generator/validator
└── constants/
    └── theme.ts                         # Existing - no changes needed

mobile/packages/core/src/
├── hooks/
│   └── useBusinessApi.ts                # Add marketing hooks here
└── services/
    └── businessApi.ts                   # Add marketing API methods here

server/routes/
└── marketing.ts                         # New - Marketing API endpoints
```

---

## 2. Shared Components

### 2.1 KPIStatCard.tsx
Reusable stat card matching dashboard pattern:
- Props: `{ icon, iconGradient, value, label, trend, trendType, onPress? }`
- Uses `LinearGradient` from expo-linear-gradient
- Matches existing `StatCard` in dashboard

### 2.2 SegmentedTabs.tsx
Tab pills for filtering:
- Props: `{ tabs: { label, value, count? }[], activeTab, onTabChange }`
- Active tab uses gradient background
- Badge count support

### 2.3 StatusBadge.tsx
Consistent status indicators:
- Props: `{ status: 'active' | 'paused' | 'scheduled' | 'expired' | 'pending' | 'completed' | 'sending' | 'archived' }`
- Color mapping to theme COLORS
- Compact and full variants

### 2.4 StepWizard.tsx
Shared 4-step wizard navigation:
- Props: `{ currentStep, totalSteps, stepTitles, onNext, onBack, nextLabel?, isNextDisabled? }`
- Step indicator dots with checkmarks for completed
- Back/Next buttons with gradient CTAs

### 2.5 OfferCard.tsx
Offer list item:
- Props: `{ offer: OfferSummary, onPress, onEdit, onDuplicate, onArchive, showSwipeActions? }`
- Usage progress bar
- Status badge, discount display
- Quick actions (edit, duplicate, archive)

### 2.6 CampaignCard.tsx
Campaign list item:
- Props: `{ campaign: CampaignSummary, onPress, onPause?, onDuplicate? }`
- Channel badges (WhatsApp/SMS)
- Delivery funnel mini-view
- Send progress indicator

### 2.7 AutomationCard.tsx
Automation workflow card:
- Props: `{ automation: AutomationWorkflow, onToggle, onConfigure }`
- Trigger type icon
- Performance stats (sent, converted, attributed revenue)
- Active/Off toggle

### 2.8 MessagePreview.tsx
WhatsApp/SMS message preview:
- Props: `{ message, channel, variables, previewData }`
- Phone mockup frame
- Variable substitution preview

### 2.9 QuotaMeter.tsx
Message quota usage:
- Props: `{ used, total, resetDate }`
- Progress bar with percentage
- GlossGenius-inspired design

### 2.10 DeliveryFunnel.tsx
Campaign delivery funnel:
- Props: `{ sent, delivered, read, clicked }`
- Visual funnel with percentages
- Color-coded stages

---

## 3. API Types & Hooks

### 3.1 New Types (businessApi.ts)

```typescript
// === OFFERS ===

export interface OfferDashboardStats {
  totalOffers: number;
  activeOffers: number;
  totalRedemptions: number;
  attributedRevenue: { value: number; formatted: string };
  conversionRate: number;
}

export interface SlowDayAlert {
  date: string;
  dayName: string;
  occupancy: number;
  suggestedAction: string;
}

export interface OfferDashboardResponse {
  stats: OfferDashboardStats;
  slowDayAlerts: SlowDayAlert[];
  topPerformingOffers: OfferSummary[];
  recentActivity: OfferActivity[];
}

export interface OfferSummary {
  id: string;
  title: string;
  type: 'promo_code' | 'flash_sale' | 'intro_offer' | 'staff_special';
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  promoCode?: string;
  status: 'active' | 'paused' | 'scheduled' | 'expired' | 'archived';
  usageCount: number;
  usageLimit?: number;
  validFrom: string;
  validUntil?: string;
  attributedRevenue: { value: number; formatted: string };
  conversionRate: number;
  imageUrl?: string;
}

export interface OfferDetail extends OfferSummary {
  description: string;
  targeting: {
    audience: 'all' | 'new' | 'vip' | 'inactive' | 'custom';
    customSegmentId?: string;
    servicesScope: 'all' | 'categories' | 'products' | 'services';
    categoryIds?: string[];
    staffScope: 'all' | 'specific';
    staffIds?: string[];
  };
  limits: {
    perClient: number;
    totalUsage?: number;
    minPurchase?: number;
    maxDiscount?: number;
  };
  distribution: {
    onlineCheckout: boolean;
    posCheckout: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OfferPerformance {
  totalRedemptions: number;
  uniqueClients: number;
  attributedRevenue: { value: number; formatted: string };
  avgOrderValue: { value: number; formatted: string };
  conversionRate: number;
  byDate: { date: string; redemptions: number; revenue: number }[];
  byChannel: { channel: string; count: number }[];
}

export interface CreateOfferParams {
  title: string;
  description?: string;
  type: 'promo_code' | 'flash_sale' | 'intro_offer' | 'staff_special';
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  promoCode?: string;
  targeting: OfferDetail['targeting'];
  limits: OfferDetail['limits'];
  distribution: OfferDetail['distribution'];
  validFrom: string;
  validUntil?: string;
  isScheduled?: boolean;
  imageUrl?: string;
}

export interface WelcomeOffer {
  id: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  validityDays: number;
  usageLimit: number;
  isActive: boolean;
  assignedCount: number;
  redeemedCount: number;
}

// === CAMPAIGNS ===

export interface CampaignDashboardStats {
  totalSent: number;
  readRate: number;
  clickRate: number;
  attributedRevenue: { value: number; formatted: string };
}

export interface MessageQuota {
  used: number;
  total: number;
  resetDate: string;
}

export interface SmartSuggestion {
  type: 'win_back' | 'rebook' | 'birthday' | 'fill_slots';
  title: string;
  description: string;
  targetCount: number;
  suggestedAction: string;
}

export interface CampaignDashboardResponse {
  stats: CampaignDashboardStats;
  quota: MessageQuota;
  suggestions: SmartSuggestion[];
  recentCampaigns: CampaignSummary[];
}

export interface CampaignSummary {
  id: string;
  name: string;
  channel: 'whatsapp' | 'sms' | 'both';
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'failed';
  targetCount: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  clickedCount: number;
  scheduledAt?: string;
  sentAt?: string;
  completedAt?: string;
  linkedOfferId?: string;
  attributedRevenue?: { value: number; formatted: string };
}

export interface CampaignDetail extends CampaignSummary {
  message: string;
  variables: string[];
  audience: {
    type: 'all' | 'segment' | 'custom';
    segmentId?: string;
    filters?: object;
  };
  recipients: CampaignRecipient[];
  createdAt: string;
  updatedAt: string;
}

export interface CampaignRecipient {
  id: string;
  name: string;
  phone: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'clicked' | 'failed';
  deliveredAt?: string;
  readAt?: string;
  clickedAt?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  category: 'promotional' | 'reminder' | 'follow_up' | 'custom';
  message: string;
  variables: string[];
}

export interface CreateCampaignParams {
  name: string;
  channel: 'whatsapp' | 'sms' | 'both';
  message: string;
  audience: CampaignDetail['audience'];
  linkedOfferId?: string;
  scheduledAt?: string;
  sendNow?: boolean;
}

// === AUTOMATIONS ===

export interface AutomationWorkflow {
  id: string;
  type: 'rebook_reminder' | 'birthday' | 'win_back' | 'review_request' | 'fill_slow_days';
  name: string;
  description: string;
  isActive: boolean;
  trigger: {
    type: string;
    value: number;
    unit: 'days' | 'hours' | 'weeks';
  };
  message: string;
  linkedOfferId?: string;
  performance: AutomationStats;
}

export interface AutomationStats {
  sent30d: number;
  converted30d: number;
  conversionRate: number;
  attributedRevenue: { value: number; formatted: string };
}

export interface UpdateAutomationParams {
  isActive?: boolean;
  trigger?: AutomationWorkflow['trigger'];
  message?: string;
  linkedOfferId?: string;
}

export interface AutomationsListResponse {
  automations: AutomationWorkflow[];
}
```

### 3.2 New Hooks (useBusinessApi.ts)

```typescript
// === OFFERS HOOKS ===

export function useOffersDashboard(): UseApiState<OfferDashboardResponse>
export function useOffersList(filters?: { status?: string; type?: string; search?: string }): UseApiState<{ offers: OfferSummary[]; total: number }>
export function useOfferDetail(id: string | undefined): UseApiState<OfferDetail>
export function useOfferPerformance(id: string | undefined): UseApiState<OfferPerformance>
export function useOfferMutations(): {
  createOffer: (params: CreateOfferParams) => Promise<MutationResult>;
  updateOffer: (id: string, params: Partial<CreateOfferParams>) => Promise<MutationResult>;
  toggleOffer: (id: string) => Promise<MutationResult>;
  duplicateOffer: (id: string) => Promise<MutationResult>;
  archiveOffer: (id: string) => Promise<MutationResult>;
  deleteOffer: (id: string) => Promise<MutationResult>;
  generatePromoCode: () => Promise<{ code: string }>;
  validatePromoCode: (code: string) => Promise<{ isValid: boolean; message?: string }>;
  isSubmitting: boolean;
}
export function useWelcomeOffers(): UseApiState<{ offers: WelcomeOffer[]; stats: { active: number; assigned: number; redeemed: number } }>
export function useWelcomeOfferMutations(): {
  createWelcomeOffer: (params: Omit<WelcomeOffer, 'id' | 'assignedCount' | 'redeemedCount'>) => Promise<MutationResult>;
  updateWelcomeOffer: (id: string, params: Partial<WelcomeOffer>) => Promise<MutationResult>;
  toggleWelcomeOffer: (id: string) => Promise<MutationResult>;
  deleteWelcomeOffer: (id: string) => Promise<MutationResult>;
  isSubmitting: boolean;
}

// === CAMPAIGNS HOOKS ===

export function useCampaignsDashboard(): UseApiState<CampaignDashboardResponse>
export function useCampaignsList(filters?: { status?: string; channel?: string }): UseApiState<{ campaigns: CampaignSummary[]; total: number }>
export function useCampaignDetail(id: string | undefined): UseApiState<CampaignDetail>
export function useCampaignRecipients(id: string | undefined, page?: number): UseApiState<{ recipients: CampaignRecipient[]; total: number; page: number }>
export function useMessageTemplates(): UseApiState<{ templates: MessageTemplate[] }>
export function useCampaignMutations(): {
  createCampaign: (params: CreateCampaignParams) => Promise<MutationResult>;
  updateCampaign: (id: string, params: Partial<CreateCampaignParams>) => Promise<MutationResult>;
  pauseCampaign: (id: string) => Promise<MutationResult>;
  resumeCampaign: (id: string) => Promise<MutationResult>;
  duplicateCampaign: (id: string) => Promise<MutationResult>;
  deleteCampaign: (id: string) => Promise<MutationResult>;
  isSubmitting: boolean;
}

// === AUTOMATIONS HOOKS ===

export function useAutomationsList(): UseApiState<AutomationsListResponse>
export function useAutomationDetail(id: string | undefined): UseApiState<AutomationWorkflow>
export function useAutomationMutations(): {
  updateAutomation: (id: string, params: UpdateAutomationParams) => Promise<MutationResult>;
  toggleAutomation: (id: string) => Promise<MutationResult>;
  testAutomation: (id: string, testPhone: string) => Promise<MutationResult>;
  isSubmitting: boolean;
}
```

---

## 4. Backend API Endpoints

### 4.1 Offers Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/salons/:salonId/marketing/offers/dashboard` | Dashboard stats, slow day alerts, top offers |
| GET | `/api/salons/:salonId/marketing/offers` | List offers with filters |
| POST | `/api/salons/:salonId/marketing/offers` | Create new offer |
| GET | `/api/salons/:salonId/marketing/offers/:id` | Get offer details |
| PATCH | `/api/salons/:salonId/marketing/offers/:id` | Update offer |
| POST | `/api/salons/:salonId/marketing/offers/:id/toggle` | Toggle active status |
| POST | `/api/salons/:salonId/marketing/offers/:id/duplicate` | Duplicate offer |
| POST | `/api/salons/:salonId/marketing/offers/:id/archive` | Archive offer |
| DELETE | `/api/salons/:salonId/marketing/offers/:id` | Delete offer |
| GET | `/api/salons/:salonId/marketing/offers/:id/performance` | Performance analytics |
| POST | `/api/salons/:salonId/marketing/offers/generate-code` | Generate unique promo code |
| GET | `/api/salons/:salonId/marketing/offers/validate-code/:code` | Validate promo code uniqueness |
| GET | `/api/salons/:salonId/marketing/welcome-offers` | List welcome offers |
| POST | `/api/salons/:salonId/marketing/welcome-offers` | Create welcome offer |
| PATCH | `/api/salons/:salonId/marketing/welcome-offers/:id` | Update welcome offer |
| POST | `/api/salons/:salonId/marketing/welcome-offers/:id/toggle` | Toggle welcome offer |
| DELETE | `/api/salons/:salonId/marketing/welcome-offers/:id` | Delete welcome offer |

### 4.2 Campaigns Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/salons/:salonId/marketing/campaigns/dashboard` | Dashboard stats, quota, suggestions |
| GET | `/api/salons/:salonId/marketing/campaigns` | List campaigns with filters |
| POST | `/api/salons/:salonId/marketing/campaigns` | Create campaign |
| GET | `/api/salons/:salonId/marketing/campaigns/:id` | Get campaign details |
| PATCH | `/api/salons/:salonId/marketing/campaigns/:id` | Update campaign |
| POST | `/api/salons/:salonId/marketing/campaigns/:id/send` | Start sending campaign |
| POST | `/api/salons/:salonId/marketing/campaigns/:id/pause` | Pause campaign |
| POST | `/api/salons/:salonId/marketing/campaigns/:id/resume` | Resume campaign |
| POST | `/api/salons/:salonId/marketing/campaigns/:id/duplicate` | Duplicate campaign |
| DELETE | `/api/salons/:salonId/marketing/campaigns/:id` | Delete campaign |
| GET | `/api/salons/:salonId/marketing/campaigns/:id/recipients` | Get recipients with pagination |
| GET | `/api/salons/:salonId/marketing/templates` | List message templates |

### 4.3 Automations Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/salons/:salonId/marketing/automations` | List all automations |
| GET | `/api/salons/:salonId/marketing/automations/:id` | Get automation details |
| PATCH | `/api/salons/:salonId/marketing/automations/:id` | Update automation config |
| POST | `/api/salons/:salonId/marketing/automations/:id/toggle` | Toggle automation |
| POST | `/api/salons/:salonId/marketing/automations/:id/test` | Send test message |

---

## 5. Implementation Order & Dependencies

### Phase 1: Foundation (Week 1)
**Goal:** Set up infrastructure and shared components

| Task | Priority | Dependencies | Complexity |
|------|----------|--------------|------------|
| 1.1 Create folder structure | High | None | Low |
| 1.2 Build shared components (KPIStatCard, StatusBadge, SegmentedTabs) | High | Theme | Medium |
| 1.3 Build StepWizard component | High | Theme | Medium |
| 1.4 Add Marketing API types to businessApi.ts | High | None | Medium |
| 1.5 Add Marketing hooks to useBusinessApi.ts | High | Types | Medium |
| 1.6 Create backend marketing.ts routes (stubs) | High | Schema | Medium |
| 1.7 Add database schema for offers, campaigns, automations | High | Drizzle | High |

### Phase 2: Offers Module (Week 2)
**Goal:** Complete offers functionality

| Task | Priority | Dependencies | Complexity |
|------|----------|--------------|------------|
| 2.1 17a. Offers Dashboard screen | High | Hooks, Components | Medium |
| 2.2 17b. Offers List screen | High | Hooks, Components | High |
| 2.3 OfferCard component | High | Theme | Medium |
| 2.4 PromoCodeInput component | Medium | None | Medium |
| 2.5 17c. Create/Edit Offer wizard | High | StepWizard, Hooks | High |
| 2.6 17d. Offer Details screen | High | Hooks | Medium |
| 2.7 17e. Welcome Offers screen | Medium | Hooks | Medium |
| 2.8 Backend: Offers CRUD APIs | High | Schema | High |
| 2.9 Backend: Promo code generation | Medium | Offers | Low |

### Phase 3: Campaigns Module (Week 3)
**Goal:** Complete campaigns functionality

| Task | Priority | Dependencies | Complexity |
|------|----------|--------------|------------|
| 3.1 17f. Campaigns Dashboard screen | High | Hooks, Components | Medium |
| 3.2 QuotaMeter component | Medium | Theme | Low |
| 3.3 MessagePreview component | Medium | Theme | Medium |
| 3.4 CampaignCard component | Medium | Theme | Medium |
| 3.5 17g. Create Campaign wizard | High | StepWizard, Hooks | High |
| 3.6 17h. Campaign Details screen | High | DeliveryFunnel, Hooks | Medium |
| 3.7 DeliveryFunnel component | Medium | Theme | Medium |
| 3.8 Backend: Campaigns CRUD APIs | High | Schema | High |
| 3.9 Backend: Message sending integration (Twilio/WhatsApp) | High | Campaigns | High |

### Phase 4: Automations Module (Week 4)
**Goal:** Complete automations functionality

| Task | Priority | Dependencies | Complexity |
|------|----------|--------------|------------|
| 4.1 17i. Marketing Automations List screen | High | Hooks, Components | Medium |
| 4.2 AutomationCard component | Medium | Theme | Medium |
| 4.3 17j. Automation Configuration screen | High | Hooks | High |
| 4.4 Backend: Automations APIs | High | Schema | Medium |
| 4.5 Backend: Automation scheduler (node-cron) | High | Automations | High |

### Phase 5: Integration & Polish (Week 5)
**Goal:** Connect all pieces and polish

| Task | Priority | Dependencies | Complexity |
|------|----------|--------------|------------|
| 5.1 Link Marketing from More menu | High | All screens | Low |
| 5.2 Deep linking between screens | High | All screens | Medium |
| 5.3 Error handling & loading states | High | All screens | Medium |
| 5.4 Pull-to-refresh across all screens | Medium | All screens | Low |
| 5.5 Bulk actions implementation | Medium | Offers List | Medium |
| 5.6 Analytics & attribution tracking | High | Backend | High |
| 5.7 Testing & bug fixes | High | All | High |

---

## 6. Screen-by-Screen Breakdown

### 6.1 Screen 17a: Offers Dashboard

**File:** `app/marketing/index.tsx`

**Components Used:**
- KPIStatCard (4x): Active Offers, Total Redemptions, Attributed Revenue, Conversion Rate
- SlowDayAlert cards with "Fill Slots" CTA
- Quick Actions grid (Create Offer, View All, Automations, Campaigns)
- Recent Activity list

**API Hooks:**
- `useOffersDashboard()`

**Navigation:**
- "Create Offer" → `/marketing/offers/create`
- "View All Offers" → `/marketing/offers`
- "Campaigns" → `/marketing/campaigns`
- "Automations" → `/marketing/automations`

**Complexity:** Medium

---

### 6.2 Screen 17b: Offers List

**File:** `app/marketing/offers/index.tsx`

**Components Used:**
- SegmentedTabs (Active, Scheduled, Archived)
- Search input
- OfferCard (list items)
- Bulk action bottom sheet

**API Hooks:**
- `useOffersList({ status, type, search })`
- `useOfferMutations()` for bulk actions

**Features:**
- Status filtering via tabs
- Search by offer name
- Swipe actions (Edit, Pause, Delete)
- Bulk select mode
- FAB to create new offer

**Complexity:** High

---

### 6.3 Screen 17c: Create/Edit Offer (4-Step Wizard)

**File:** `app/marketing/offers/create.tsx`

**Components Used:**
- StepWizard
- InputField, ToggleField (from events pattern)
- PromoCodeInput
- Chip selectors for targeting
- SummaryTile for review step

**Steps:**
1. **Details:** Type, Title, Description, Discount, Promo Code, Image
2. **Targeting:** Audience, Services, Staff, Usage Limits
3. **Distribution:** Online/POS channels, Validity dates, Schedule
4. **Review:** Summary preview, Create/Save Draft buttons

**API Hooks:**
- `useOfferMutations()` (createOffer, updateOffer, generatePromoCode)
- `useOfferDetail(editId)` for edit mode

**Complexity:** High

---

### 6.4 Screen 17d: Offer Details

**File:** `app/marketing/offers/[id].tsx`

**Components Used:**
- Header with offer image/gradient
- KPIStatCard row (Times Used, Revenue, Conversion, Days Left)
- Usage progress bar
- Details section
- Action buttons (Edit, Duplicate, Archive, Delete)

**API Hooks:**
- `useOfferDetail(id)`
- `useOfferPerformance(id)`
- `useOfferMutations()` for actions

**Complexity:** Medium

---

### 6.5 Screen 17e: Welcome Offers

**File:** `app/marketing/offers/welcome.tsx`

**Components Used:**
- Stats row (Active, Assigned, Redeemed)
- Welcome offer cards
- Create/Edit bottom sheet

**API Hooks:**
- `useWelcomeOffers()`
- `useWelcomeOfferMutations()`

**Complexity:** Medium

---

### 6.6 Screen 17f: Campaigns Dashboard

**File:** `app/marketing/campaigns/index.tsx`

**Components Used:**
- QuotaMeter
- KPIStatCard row (Total Sent, Read Rate, Click Rate, Revenue)
- SegmentedTabs (One-Time, Automated, Scheduled)
- Smart Suggestions card
- CampaignCard list

**API Hooks:**
- `useCampaignsDashboard()`
- `useAutomationsList()` for Automated tab

**Complexity:** Medium

---

### 6.7 Screen 17g: Create Campaign (4-Step Wizard)

**File:** `app/marketing/campaigns/create.tsx`

**Components Used:**
- StepWizard
- Channel selector (WhatsApp, SMS, Both)
- MessagePreview
- Template picker
- Audience selector
- Date/Time picker

**Steps:**
1. **Details:** Name, Channel, Linked Offer
2. **Message:** Template, Content, Variables, Preview
3. **Schedule:** Send Now or Schedule, Date/Time
4. **Review:** Summary, Target count, Launch button

**API Hooks:**
- `useMessageTemplates()`
- `useCampaignMutations()` (createCampaign)
- `useOffersList()` for linked offer picker

**Complexity:** High

---

### 6.8 Screen 17h: Campaign Details

**File:** `app/marketing/campaigns/[id].tsx`

**Components Used:**
- Header with status badge
- DeliveryFunnel visualization
- Stats row (Delivered, Read, Clicked)
- Message preview
- Recipients list with pagination

**API Hooks:**
- `useCampaignDetail(id)`
- `useCampaignRecipients(id, page)`
- `useCampaignMutations()` (pause, resume)

**Complexity:** Medium

---

### 6.9 Screen 17i: Marketing Automations List

**File:** `app/marketing/automations/index.tsx`

**Components Used:**
- AutomationCard (per workflow type)
- Quick toggle switch
- Performance stats per automation

**Automations:**
- Rebook Reminder
- Birthday Offer
- Win-Back Campaign
- Post-Visit Review Request
- Fill Slow Days (smart)

**API Hooks:**
- `useAutomationsList()`
- `useAutomationMutations()` (toggle)

**Complexity:** Medium

---

### 6.10 Screen 17j: Automation Configuration

**File:** `app/marketing/automations/[id].tsx`

**Components Used:**
- InputField, ToggleField
- Trigger configuration (days/hours selector)
- MessagePreview
- Linked offer picker
- Test send button

**API Hooks:**
- `useAutomationDetail(id)`
- `useAutomationMutations()` (update, test)
- `useOffersList()` for linked offer

**Complexity:** Medium/High

---

## 7. Database Schema Additions

```sql
-- Offers table
CREATE TABLE offers (
  id SERIAL PRIMARY KEY,
  salon_id INTEGER NOT NULL REFERENCES salons(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- promo_code, flash_sale, intro_offer, staff_special
  discount_type VARCHAR(20) NOT NULL, -- percentage, fixed
  discount_value DECIMAL(10, 2) NOT NULL,
  promo_code VARCHAR(50) UNIQUE,
  status VARCHAR(20) DEFAULT 'active', -- active, paused, scheduled, expired, archived
  targeting JSONB, -- audience, services, staff config
  limits JSONB, -- per_client, total, min_purchase, max_discount
  distribution JSONB, -- online_checkout, pos_checkout
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP,
  image_url TEXT,
  usage_count INTEGER DEFAULT 0,
  attributed_revenue DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Welcome offers table
CREATE TABLE welcome_offers (
  id SERIAL PRIMARY KEY,
  salon_id INTEGER NOT NULL REFERENCES salons(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  min_purchase DECIMAL(10, 2),
  max_discount DECIMAL(10, 2),
  validity_days INTEGER DEFAULT 30,
  usage_limit INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  assigned_count INTEGER DEFAULT 0,
  redeemed_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE campaigns (
  id SERIAL PRIMARY KEY,
  salon_id INTEGER NOT NULL REFERENCES salons(id),
  name VARCHAR(255) NOT NULL,
  channel VARCHAR(20) NOT NULL, -- whatsapp, sms, both
  status VARCHAR(20) DEFAULT 'draft', -- draft, scheduled, sending, completed, paused, failed
  message TEXT NOT NULL,
  variables JSONB,
  audience JSONB, -- type, segment_id, filters
  linked_offer_id INTEGER REFERENCES offers(id),
  target_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  completed_at TIMESTAMP,
  attributed_revenue DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaign recipients table
CREATE TABLE campaign_recipients (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  phone VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, read, clicked, failed
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  clicked_at TIMESTAMP,
  error_message TEXT
);

-- Marketing automations table
CREATE TABLE marketing_automations (
  id SERIAL PRIMARY KEY,
  salon_id INTEGER NOT NULL REFERENCES salons(id),
  type VARCHAR(50) NOT NULL, -- rebook_reminder, birthday, win_back, review_request, fill_slow_days
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  trigger_config JSONB, -- type, value, unit
  message TEXT NOT NULL,
  linked_offer_id INTEGER REFERENCES offers(id),
  sent_count_30d INTEGER DEFAULT 0,
  converted_count_30d INTEGER DEFAULT 0,
  attributed_revenue_30d DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Offer redemptions table (for attribution tracking)
CREATE TABLE offer_redemptions (
  id SERIAL PRIMARY KEY,
  offer_id INTEGER NOT NULL REFERENCES offers(id),
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  booking_id INTEGER REFERENCES bookings(id),
  discount_amount DECIMAL(10, 2) NOT NULL,
  order_total DECIMAL(10, 2) NOT NULL,
  source VARCHAR(50), -- online, pos, campaign, automation
  source_id INTEGER, -- campaign_id or automation_id
  redeemed_at TIMESTAMP DEFAULT NOW()
);
```

---

## 8. Acceptance Criteria

### General
- [ ] All screens follow centralized theme from `constants/theme.ts`
- [ ] Loading states with skeletons or ActivityIndicator
- [ ] Error states with retry buttons
- [ ] Pull-to-refresh on all list screens
- [ ] Empty states with helpful messages
- [ ] Keyboard avoidance on forms
- [ ] Form validation with inline errors

### Screen-Specific

**17a. Offers Dashboard**
- [ ] KPI stats load and display correctly
- [ ] Slow Day alerts appear when occupancy < 50%
- [ ] Quick actions navigate to correct screens
- [ ] Pull-to-refresh updates stats

**17b. Offers List**
- [ ] Tab filtering works (Active/Scheduled/Archived)
- [ ] Search filters by offer title
- [ ] Swipe actions work (Edit, Pause, Delete)
- [ ] Bulk select mode enables/disables correctly
- [ ] FAB navigates to create screen

**17c. Create/Edit Offer**
- [ ] Step navigation works correctly
- [ ] Promo code generation works
- [ ] Promo code validation shows uniqueness
- [ ] Form validation prevents advancing with invalid data
- [ ] Preview updates in real-time
- [ ] Create/Update API calls succeed with toast feedback
- [ ] Unsaved changes prompt on back navigation

**17d. Offer Details**
- [ ] Performance stats load correctly
- [ ] Usage progress bar reflects actual usage
- [ ] Edit navigates to wizard with pre-filled data
- [ ] Duplicate creates copy and navigates to edit
- [ ] Archive moves offer to archived status
- [ ] Delete shows confirmation and removes offer

**17e. Welcome Offers**
- [ ] Stats show correct counts
- [ ] Toggle updates status immediately
- [ ] Create/Edit bottom sheet works
- [ ] Delete shows confirmation

**17f. Campaigns Dashboard**
- [ ] Quota meter shows correct usage
- [ ] KPI stats are accurate
- [ ] Tab filtering works (One-Time/Automated/Scheduled)
- [ ] Smart suggestions appear with action buttons
- [ ] Recent campaigns list loads

**17g. Create Campaign**
- [ ] Channel selection works
- [ ] Template picker loads templates
- [ ] Message preview updates with variables
- [ ] Audience count updates based on selection
- [ ] Schedule date/time picker works
- [ ] Create/Schedule API succeeds

**17h. Campaign Details**
- [ ] Delivery funnel shows accurate percentages
- [ ] Recipients list paginates correctly
- [ ] Pause/Resume changes status immediately
- [ ] Message preview displays correctly

**17i. Automations List**
- [ ] All automation types display
- [ ] Quick toggle updates status
- [ ] Performance stats are accurate
- [ ] Configure navigates to detail screen

**17j. Automation Configuration**
- [ ] Trigger settings save correctly
- [ ] Message preview updates
- [ ] Linked offer selector works
- [ ] Test send delivers message
- [ ] Save updates automation

---

## 9. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| WhatsApp API complexity | Start with SMS-only, add WhatsApp in Phase 2 |
| Attribution tracking accuracy | Use 7-day attribution window, track source_id |
| Message quota overruns | Implement quota checks before sending |
| Promo code collision | UUID-based generation with uniqueness check |
| Slow Day detection accuracy | Use historical booking data, tune threshold |

---

## 10. Success Metrics

- **Adoption:** 50% of salons use at least one offer
- **Engagement:** Average 2 campaigns per month per salon
- **Revenue:** 10% of bookings use an offer code
- **Retention:** Win-back automation recovers 20% of inactive clients
- **Performance:** All screens load within 2 seconds

---

## Appendix: Color Mapping

| Status | Color (from theme.ts) |
|--------|----------------------|
| Active | `COLORS.green` (#22C55E) |
| Paused | `COLORS.amber` (#F59E0B) |
| Scheduled | `COLORS.blue` (#3B82F6) |
| Expired | `COLORS.red` (#EF4444) |
| Archived | `COLORS.textMuted` (#64748B) |
| Pending | `COLORS.amber` (#F59E0B) |
| Completed | `COLORS.green` (#22C55E) |
| Sending | `COLORS.blue` (#3B82F6) |
| Failed | `COLORS.red` (#EF4444) |
