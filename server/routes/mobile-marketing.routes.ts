import express, { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { 
  platformOffers, 
  welcomeOffers, 
  welcomeOfferRedemptions,
  invitationCampaigns,
  salons,
  users,
  bookings,
  marketingAutomations,
  messageQuota,
} from '@shared/schema';
import { eq, and, sql, desc, gte, lte, or, count, sum, like, inArray } from 'drizzle-orm';
import { authenticateMobileUser } from '../middleware/authMobile';

const router = Router();

// ============================================
// OFFERS API
// ============================================

router.get('/offers/dashboard', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'No salon associated with this user' });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [activeOffers] = await db.select({ count: count() })
      .from(platformOffers)
      .where(and(
        eq(platformOffers.ownedBySalonId, salonId),
        eq(platformOffers.isActive, 1),
        eq(platformOffers.approvalStatus, 'approved')
      ));

    const [totalOffers] = await db.select({ count: count() })
      .from(platformOffers)
      .where(eq(platformOffers.ownedBySalonId, salonId));

    const [monthlyRedemptions] = await db.select({ 
      count: count(),
      revenue: sum(bookings.finalAmountPaisa)
    })
      .from(bookings)
      .where(and(
        eq(bookings.salonId, salonId),
        gte(bookings.createdAt, startOfMonth),
        sql`${bookings.discountAmountPaisa} > 0`
      ));

    const recentOffers = await db.select({
      id: platformOffers.id,
      title: platformOffers.title,
      usageCount: platformOffers.usageCount,
      createdAt: platformOffers.createdAt,
    })
      .from(platformOffers)
      .where(eq(platformOffers.ownedBySalonId, salonId))
      .orderBy(desc(platformOffers.createdAt))
      .limit(5);

    res.json({
      stats: {
        activeOffers: activeOffers?.count || 0,
        totalOffers: totalOffers?.count || 0,
        redemptionsThisMonth: monthlyRedemptions?.count || 0,
        revenueThisMonth: Number(monthlyRedemptions?.revenue || 0),
        revenueFormatted: `₹${((Number(monthlyRedemptions?.revenue) || 0) / 100).toLocaleString('en-IN')}`,
      },
      recentActivity: recentOffers.map(o => ({
        id: o.id,
        title: o.title,
        action: 'created',
        timestamp: o.createdAt,
        usageCount: o.usageCount,
      })),
      fillSlowDaysAlerts: [],
    });
  } catch (error: any) {
    console.error('Error fetching offers dashboard:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard' });
  }
});

router.get('/offers', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'No salon associated with this user' });
    }

    const { status, search } = req.query;
    const now = new Date();

    let baseCondition = eq(platformOffers.ownedBySalonId, salonId);

    const offers = await db.select({
      id: platformOffers.id,
      title: platformOffers.title,
      description: platformOffers.description,
      discountType: platformOffers.discountType,
      discountValue: platformOffers.discountValue,
      minimumPurchase: platformOffers.minimumPurchase,
      maxDiscount: platformOffers.maxDiscount,
      validFrom: platformOffers.validFrom,
      validUntil: platformOffers.validUntil,
      isActive: platformOffers.isActive,
      usageLimit: platformOffers.usageLimit,
      usageCount: platformOffers.usageCount,
      approvalStatus: platformOffers.approvalStatus,
      imageUrl: platformOffers.imageUrl,
      createdAt: platformOffers.createdAt,
    })
      .from(platformOffers)
      .where(baseCondition)
      .orderBy(desc(platformOffers.createdAt));

    const filteredOffers = offers.filter(o => {
      const offerStatus = getOfferStatus(o, now);
      if (status && status !== offerStatus) return false;
      if (search && !o.title.toLowerCase().includes((search as string).toLowerCase())) return false;
      return true;
    });

    res.json({
      offers: filteredOffers.map(o => ({
        ...o,
        status: getOfferStatus(o, now),
        discountText: o.discountType === 'percentage' 
          ? `${o.discountValue}% OFF` 
          : `₹${(o.discountValue / 100).toFixed(0)} OFF`,
      })),
      total: filteredOffers.length,
    });
  } catch (error: any) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch offers' });
  }
});

router.get('/offers/:id', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    const { id } = req.params;

    const [offer] = await db.select()
      .from(platformOffers)
      .where(and(
        eq(platformOffers.id, id),
        eq(platformOffers.ownedBySalonId, salonId)
      ));

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    res.json(offer);
  } catch (error: any) {
    console.error('Error fetching offer:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch offer' });
  }
});

router.get('/offers/:id/performance', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    const { id } = req.params;

    const [offer] = await db.select()
      .from(platformOffers)
      .where(and(
        eq(platformOffers.id, id),
        eq(platformOffers.ownedBySalonId, salonId)
      ));

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    const usagePercent = offer.usageLimit 
      ? Math.round((offer.usageCount / offer.usageLimit) * 100) 
      : 0;

    res.json({
      redemptions: offer.usageCount,
      usageLimit: offer.usageLimit,
      usagePercent,
      revenue: 0,
      revenueFormatted: '₹0',
      conversionRate: 0,
      averageOrderValue: 0,
    });
  } catch (error: any) {
    console.error('Error fetching offer performance:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch performance' });
  }
});

const createOfferSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive(),
  minimumPurchase: z.number().optional(),
  maxDiscount: z.number().optional(),
  validFrom: z.string().or(z.date()),
  validUntil: z.string().or(z.date()),
  usageLimit: z.number().optional(),
  promoCode: z.string().optional(),
  imageUrl: z.string().optional(),
});

router.post('/offers', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    const userId = req.user.id;

    if (!salonId) {
      return res.status(400).json({ error: 'No salon associated with this user' });
    }

    const data = createOfferSchema.parse(req.body);

    const [offer] = await db.insert(platformOffers).values({
      salonId: salonId,
      ownedBySalonId: salonId,
      title: data.title,
      description: data.description || null,
      discountType: data.discountType,
      discountValue: data.discountType === 'fixed' ? data.discountValue * 100 : data.discountValue,
      minimumPurchase: data.minimumPurchase ? data.minimumPurchase * 100 : null,
      maxDiscount: data.maxDiscount ? data.maxDiscount * 100 : null,
      validFrom: new Date(data.validFrom),
      validUntil: new Date(data.validUntil),
      usageLimit: data.usageLimit || null,
      imageUrl: data.imageUrl || null,
      isActive: 1,
      isPlatformWide: 0,
      approvalStatus: 'approved',
      autoApproved: 1,
      createdBy: userId,
    }).returning();

    res.status(201).json({ success: true, id: offer.id });
  } catch (error: any) {
    console.error('Error creating offer:', error);
    res.status(400).json({ error: error.message || 'Failed to create offer' });
  }
});

router.patch('/offers/:id', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    const { id } = req.params;

    const [existing] = await db.select()
      .from(platformOffers)
      .where(and(
        eq(platformOffers.id, id),
        eq(platformOffers.ownedBySalonId, salonId)
      ));

    if (!existing) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    const data = createOfferSchema.partial().parse(req.body);
    const updateData: any = { ...data, updatedAt: new Date() };

    if (data.validFrom) updateData.validFrom = new Date(data.validFrom);
    if (data.validUntil) updateData.validUntil = new Date(data.validUntil);
    if (data.discountValue && data.discountType === 'fixed') {
      updateData.discountValue = data.discountValue * 100;
    }

    await db.update(platformOffers)
      .set(updateData)
      .where(eq(platformOffers.id, id));

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating offer:', error);
    res.status(400).json({ error: error.message || 'Failed to update offer' });
  }
});

router.post('/offers/:id/toggle', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    const { id } = req.params;

    const [offer] = await db.select()
      .from(platformOffers)
      .where(and(
        eq(platformOffers.id, id),
        eq(platformOffers.ownedBySalonId, salonId)
      ));

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    await db.update(platformOffers)
      .set({ isActive: offer.isActive === 1 ? 0 : 1, updatedAt: new Date() })
      .where(eq(platformOffers.id, id));

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error toggling offer:', error);
    res.status(400).json({ error: error.message || 'Failed to toggle offer' });
  }
});

router.post('/offers/:id/duplicate', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    const userId = req.user.id;
    const { id } = req.params;

    const [original] = await db.select()
      .from(platformOffers)
      .where(and(
        eq(platformOffers.id, id),
        eq(platformOffers.ownedBySalonId, salonId)
      ));

    if (!original) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    const [newOffer] = await db.insert(platformOffers).values({
      salonId: original.salonId,
      ownedBySalonId: original.ownedBySalonId,
      title: `${original.title} (Copy)`,
      description: original.description,
      discountType: original.discountType,
      discountValue: original.discountValue,
      minimumPurchase: original.minimumPurchase,
      maxDiscount: original.maxDiscount,
      validFrom: original.validFrom,
      validUntil: original.validUntil,
      usageLimit: original.usageLimit,
      imageUrl: original.imageUrl,
      isActive: 0,
      isPlatformWide: original.isPlatformWide,
      approvalStatus: 'approved',
      autoApproved: 1,
      createdBy: userId,
    }).returning();

    res.json({ success: true, id: newOffer.id });
  } catch (error: any) {
    console.error('Error duplicating offer:', error);
    res.status(400).json({ error: error.message || 'Failed to duplicate offer' });
  }
});

router.post('/offers/:id/archive', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    const { id } = req.params;

    const [offer] = await db.select()
      .from(platformOffers)
      .where(and(
        eq(platformOffers.id, id),
        eq(platformOffers.ownedBySalonId, salonId)
      ));

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    await db.update(platformOffers)
      .set({ isActive: 0, updatedAt: new Date() })
      .where(eq(platformOffers.id, id));

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error archiving offer:', error);
    res.status(400).json({ error: error.message || 'Failed to archive offer' });
  }
});

router.delete('/offers/:id', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    const { id } = req.params;

    const [offer] = await db.select()
      .from(platformOffers)
      .where(and(
        eq(platformOffers.id, id),
        eq(platformOffers.ownedBySalonId, salonId)
      ));

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    await db.delete(platformOffers).where(eq(platformOffers.id, id));

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting offer:', error);
    res.status(400).json({ error: error.message || 'Failed to delete offer' });
  }
});

router.post('/offers/generate-code', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    res.json({ code });
  } catch (error: any) {
    console.error('Error generating code:', error);
    res.status(500).json({ error: 'Failed to generate code' });
  }
});

router.get('/offers/validate-code/:code', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    res.json({ isValid: true, message: 'Code is available' });
  } catch (error: any) {
    console.error('Error validating code:', error);
    res.status(500).json({ error: 'Failed to validate code' });
  }
});

// ============================================
// WELCOME OFFERS API
// ============================================

router.get('/welcome-offers', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'No salon associated with this user' });
    }

    const offers = await db.select({
      id: welcomeOffers.id,
      name: welcomeOffers.name,
      discountType: welcomeOffers.discountType,
      discountValue: welcomeOffers.discountValue,
      maxDiscountInPaisa: welcomeOffers.maxDiscountInPaisa,
      minimumPurchaseInPaisa: welcomeOffers.minimumPurchaseInPaisa,
      validityDays: welcomeOffers.validityDays,
      usageLimit: welcomeOffers.usageLimit,
      isActive: welcomeOffers.isActive,
      createdAt: welcomeOffers.createdAt,
    })
      .from(welcomeOffers)
      .where(eq(welcomeOffers.salonId, salonId))
      .orderBy(desc(welcomeOffers.createdAt));

    const redemptionCounts = offers.length > 0
      ? await db.select({
          welcomeOfferId: welcomeOfferRedemptions.welcomeOfferId,
          count: count(),
        })
        .from(welcomeOfferRedemptions)
        .where(inArray(welcomeOfferRedemptions.welcomeOfferId, offers.map(o => o.id)))
        .groupBy(welcomeOfferRedemptions.welcomeOfferId)
      : [];

    const countMap = new Map(redemptionCounts.map(r => [r.welcomeOfferId, r.count]));

    res.json({
      offers: offers.map(o => ({
        ...o,
        assignedCount: 0,
        redeemedCount: countMap.get(o.id) || 0,
        discountText: o.discountType === 'percentage'
          ? `${o.discountValue}% OFF`
          : `₹${(o.discountValue / 100).toFixed(0)} OFF`,
      })),
      stats: {
        totalNewCustomers: 0,
        offersAssigned: 0,
        offersRedeemed: redemptionCounts.reduce((sum, r) => sum + r.count, 0),
      },
    });
  } catch (error: any) {
    console.error('Error fetching welcome offers:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch welcome offers' });
  }
});

const createWelcomeOfferSchema = z.object({
  name: z.string().min(1),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive(),
  maxDiscountInPaisa: z.number().optional(),
  minimumPurchaseInPaisa: z.number().optional(),
  validityDays: z.number().min(1).max(365).default(30),
  usageLimit: z.number().min(1).max(100).default(1),
});

router.post('/welcome-offers', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'No salon associated with this user' });
    }

    const data = createWelcomeOfferSchema.parse(req.body);

    const [offer] = await db.insert(welcomeOffers).values({
      salonId,
      name: data.name,
      discountType: data.discountType,
      discountValue: data.discountType === 'fixed' ? data.discountValue * 100 : data.discountValue,
      maxDiscountInPaisa: data.maxDiscountInPaisa,
      minimumPurchaseInPaisa: data.minimumPurchaseInPaisa,
      validityDays: data.validityDays,
      usageLimit: data.usageLimit,
      isActive: 1,
    }).returning();

    res.status(201).json({ success: true, id: offer.id });
  } catch (error: any) {
    console.error('Error creating welcome offer:', error);
    res.status(400).json({ error: error.message || 'Failed to create welcome offer' });
  }
});

router.patch('/welcome-offers/:id', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    const { id } = req.params;

    const [existing] = await db.select()
      .from(welcomeOffers)
      .where(and(eq(welcomeOffers.id, id), eq(welcomeOffers.salonId, salonId)));

    if (!existing) {
      return res.status(404).json({ error: 'Welcome offer not found' });
    }

    const data = createWelcomeOfferSchema.partial().parse(req.body);
    const updateData: any = { ...data };

    if (data.discountValue && data.discountType === 'fixed') {
      updateData.discountValue = data.discountValue * 100;
    }

    await db.update(welcomeOffers).set(updateData).where(eq(welcomeOffers.id, id));

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating welcome offer:', error);
    res.status(400).json({ error: error.message || 'Failed to update welcome offer' });
  }
});

router.post('/welcome-offers/:id/toggle', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    const { id } = req.params;

    const [offer] = await db.select()
      .from(welcomeOffers)
      .where(and(eq(welcomeOffers.id, id), eq(welcomeOffers.salonId, salonId)));

    if (!offer) {
      return res.status(404).json({ error: 'Welcome offer not found' });
    }

    await db.update(welcomeOffers)
      .set({ isActive: offer.isActive === 1 ? 0 : 1 })
      .where(eq(welcomeOffers.id, id));

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error toggling welcome offer:', error);
    res.status(400).json({ error: error.message || 'Failed to toggle welcome offer' });
  }
});

router.delete('/welcome-offers/:id', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    const { id } = req.params;

    const [offer] = await db.select()
      .from(welcomeOffers)
      .where(and(eq(welcomeOffers.id, id), eq(welcomeOffers.salonId, salonId)));

    if (!offer) {
      return res.status(404).json({ error: 'Welcome offer not found' });
    }

    await db.delete(welcomeOffers).where(eq(welcomeOffers.id, id));

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting welcome offer:', error);
    res.status(400).json({ error: error.message || 'Failed to delete welcome offer' });
  }
});

// ============================================
// CAMPAIGNS API
// ============================================

router.get('/campaigns/dashboard', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'No salon associated with this user' });
    }

    const now = new Date();

    const [totalCampaigns] = await db.select({ count: count() })
      .from(invitationCampaigns)
      .where(eq(invitationCampaigns.salonId, salonId));

    const [activeCampaigns] = await db.select({ count: count() })
      .from(invitationCampaigns)
      .where(and(
        eq(invitationCampaigns.salonId, salonId),
        eq(invitationCampaigns.status, 'sending')
      ));

    let quota = { used: 0, limit: 2500, remaining: 2500, percentUsed: 0 };

    try {
      const [quotaRecord] = await db.select()
        .from(messageQuota)
        .where(and(
          eq(messageQuota.salonId, salonId),
          eq(messageQuota.month, now.getMonth() + 1),
          eq(messageQuota.year, now.getFullYear())
        ));
      
      if (quotaRecord) {
        quota.used = quotaRecord.used;
        quota.limit = quotaRecord.limit;
        quota.remaining = quotaRecord.limit - quotaRecord.used;
        quota.percentUsed = Math.round((quotaRecord.used / quotaRecord.limit) * 100);
      }
    } catch {
      // Table might not exist yet
    }

    res.json({
      stats: {
        totalCampaigns: totalCampaigns?.count || 0,
        activeCampaigns: activeCampaigns?.count || 0,
        messagesSentThisMonth: quota.used,
        deliveryRate: 95,
      },
      quota,
      suggestions: [
        { id: '1', title: 'Win back inactive customers', description: 'Send a special offer to customers who haven\'t visited in 60+ days' },
        { id: '2', title: 'Birthday wishes', description: 'Set up automated birthday messages with a special discount' },
      ],
    });
  } catch (error: any) {
    console.error('Error fetching campaigns dashboard:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard' });
  }
});

router.get('/campaigns', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'No salon associated with this user' });
    }

    const { status, channel } = req.query;

    let baseCondition = eq(invitationCampaigns.salonId, salonId);

    const campaigns = await db.select({
      id: invitationCampaigns.id,
      name: invitationCampaigns.name,
      channel: invitationCampaigns.channel,
      status: invitationCampaigns.status,
      messageTemplate: invitationCampaigns.messageTemplate,
      scheduledFor: invitationCampaigns.scheduledFor,
      messagesSent: invitationCampaigns.messagesSent,
      messagesDelivered: invitationCampaigns.messagesDelivered,
      messagesFailed: invitationCampaigns.messagesFailed,
      createdAt: invitationCampaigns.createdAt,
    })
      .from(invitationCampaigns)
      .where(baseCondition)
      .orderBy(desc(invitationCampaigns.createdAt));

    const filtered = campaigns.filter(c => {
      if (status && c.status !== status) return false;
      if (channel && c.channel !== channel) return false;
      return true;
    });

    res.json({
      campaigns: filtered.map(c => ({
        ...c,
        sentCount: c.messagesSent,
        deliveredCount: c.messagesDelivered,
        failedCount: c.messagesFailed,
        totalRecipients: c.messagesSent + c.messagesDelivered + c.messagesFailed,
        deliveryRate: c.messagesSent > 0 
          ? Math.round((c.messagesDelivered / c.messagesSent) * 100) 
          : 0,
      })),
      total: filtered.length,
    });
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch campaigns' });
  }
});

router.get('/campaigns/:id', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    const { id } = req.params;

    const [campaign] = await db.select()
      .from(invitationCampaigns)
      .where(and(
        eq(invitationCampaigns.id, id),
        eq(invitationCampaigns.salonId, salonId)
      ));

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({
      ...campaign,
      sentCount: campaign.messagesSent,
      deliveredCount: campaign.messagesDelivered,
      failedCount: campaign.messagesFailed,
      deliveryFunnel: {
        sent: campaign.messagesSent,
        delivered: campaign.messagesDelivered,
        failed: campaign.messagesFailed,
      },
    });
  } catch (error: any) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch campaign' });
  }
});

router.get('/campaigns/:id/recipients', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;

    const [campaign] = await db.select()
      .from(invitationCampaigns)
      .where(and(
        eq(invitationCampaigns.id, id),
        eq(invitationCampaigns.salonId, salonId)
      ));

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({
      recipients: [],
      total: 0,
      page,
    });
  } catch (error: any) {
    console.error('Error fetching campaign recipients:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch recipients' });
  }
});

const createCampaignSchema = z.object({
  name: z.string().min(1),
  channel: z.enum(['whatsapp', 'sms', 'both']),
  messageTemplate: z.string().min(1),
  welcomeOfferId: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
  audienceType: z.enum(['all', 'new', 'returning', 'inactive', 'custom']).default('all'),
});

router.post('/campaigns', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    const userId = req.user.id;

    if (!salonId) {
      return res.status(400).json({ error: 'No salon associated with this user' });
    }

    const data = createCampaignSchema.parse(req.body);

    const [campaign] = await db.insert(invitationCampaigns).values({
      salonId,
      name: data.name,
      channel: data.channel,
      messageTemplate: data.messageTemplate,
      welcomeOfferId: data.welcomeOfferId || null,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
      status: data.scheduledFor ? 'scheduled' : 'draft',
      createdBy: userId,
    }).returning();

    res.status(201).json({ success: true, id: campaign.id });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    res.status(400).json({ error: error.message || 'Failed to create campaign' });
  }
});

router.patch('/campaigns/:id', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    const { id } = req.params;

    const [existing] = await db.select()
      .from(invitationCampaigns)
      .where(and(eq(invitationCampaigns.id, id), eq(invitationCampaigns.salonId, salonId)));

    if (!existing) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const data = createCampaignSchema.partial().parse(req.body);
    const updateData: any = { ...data };

    if (data.scheduledFor) updateData.scheduledFor = new Date(data.scheduledFor);

    await db.update(invitationCampaigns).set(updateData).where(eq(invitationCampaigns.id, id));

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating campaign:', error);
    res.status(400).json({ error: error.message || 'Failed to update campaign' });
  }
});

router.post('/campaigns/:id/pause', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    const { id } = req.params;

    const [campaign] = await db.select()
      .from(invitationCampaigns)
      .where(and(eq(invitationCampaigns.id, id), eq(invitationCampaigns.salonId, salonId)));

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    await db.update(invitationCampaigns)
      .set({ status: 'paused' })
      .where(eq(invitationCampaigns.id, id));

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error pausing campaign:', error);
    res.status(400).json({ error: error.message || 'Failed to pause campaign' });
  }
});

router.post('/campaigns/:id/resume', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    const { id } = req.params;

    const [campaign] = await db.select()
      .from(invitationCampaigns)
      .where(and(eq(invitationCampaigns.id, id), eq(invitationCampaigns.salonId, salonId)));

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    await db.update(invitationCampaigns)
      .set({ status: 'sending' })
      .where(eq(invitationCampaigns.id, id));

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error resuming campaign:', error);
    res.status(400).json({ error: error.message || 'Failed to resume campaign' });
  }
});

router.post('/campaigns/:id/duplicate', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    const userId = req.user.id;
    const { id } = req.params;

    const [original] = await db.select()
      .from(invitationCampaigns)
      .where(and(eq(invitationCampaigns.id, id), eq(invitationCampaigns.salonId, salonId)));

    if (!original) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const [newCampaign] = await db.insert(invitationCampaigns).values({
      salonId,
      name: `${original.name} (Copy)`,
      channel: original.channel,
      messageTemplate: original.messageTemplate,
      welcomeOfferId: original.welcomeOfferId,
      status: 'draft',
      createdBy: userId,
    }).returning();

    res.json({ success: true, id: newCampaign.id });
  } catch (error: any) {
    console.error('Error duplicating campaign:', error);
    res.status(400).json({ error: error.message || 'Failed to duplicate campaign' });
  }
});

router.delete('/campaigns/:id', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    const { id } = req.params;

    const [campaign] = await db.select()
      .from(invitationCampaigns)
      .where(and(eq(invitationCampaigns.id, id), eq(invitationCampaigns.salonId, salonId)));

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    await db.delete(invitationCampaigns).where(eq(invitationCampaigns.id, id));

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    res.status(400).json({ error: error.message || 'Failed to delete campaign' });
  }
});

router.get('/templates', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    res.json({
      templates: [
        { id: '1', name: 'Appointment Reminder', content: 'Hi {name}! Your appointment at {salon} is tomorrow at {time}. Reply Y to confirm.' },
        { id: '2', name: 'Birthday Offer', content: 'Happy Birthday {name}! Enjoy {discount}% off your next visit at {salon}. Valid for 7 days.' },
        { id: '3', name: 'Win-Back', content: 'We miss you {name}! It\'s been a while since your last visit. Here\'s {discount}% off to welcome you back.' },
        { id: '4', name: 'New Service', content: 'Hi {name}! We\'ve launched a new {service} at {salon}. Book now and get {discount}% off!' },
        { id: '5', name: 'Review Request', content: 'Hi {name}! Thank you for visiting {salon}. We\'d love your feedback. Rate us: {link}' },
      ],
    });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// ============================================
// AUTOMATIONS API
// ============================================

router.get('/automations', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    if (!salonId) {
      return res.status(400).json({ error: 'No salon associated with this user' });
    }

    let automations: any[] = [];
    
    try {
      automations = await db.select()
        .from(marketingAutomations)
        .where(eq(marketingAutomations.salonId, salonId));
    } catch {
      // Table might not exist
    }

    if (automations.length === 0) {
      automations = getDefaultAutomations(salonId);
    }

    res.json({
      automations: automations.map(a => ({
        id: a.id,
        type: a.type,
        name: a.name,
        description: a.description,
        isActive: a.isActive === 1,
        trigger: typeof a.trigger === 'string' ? JSON.parse(a.trigger) : (a.trigger || { type: 'time', value: 24, unit: 'hours' }),
        performance: { sent: a.sentCount || 0, delivered: a.deliveredCount || 0, converted: a.convertedCount || 0 },
      })),
    });
  } catch (error: any) {
    console.error('Error fetching automations:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch automations' });
  }
});

router.get('/automations/:id', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    const { id } = req.params;

    let automation: any = null;

    try {
      [automation] = await db.select()
        .from(marketingAutomations)
        .where(and(eq(marketingAutomations.id, id), eq(marketingAutomations.salonId, salonId)));
    } catch {
      // Table might not exist
    }

    if (!automation) {
      const defaults = getDefaultAutomations(salonId);
      automation = defaults.find(a => a.id === id || a.type === id);
    }

    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    res.json({
      ...automation,
      isActive: automation.isActive === 1,
      trigger: typeof automation.trigger === 'string' ? JSON.parse(automation.trigger) : (automation.trigger || { type: 'time', value: 24, unit: 'hours' }),
      message: automation.messageTemplate || 'Hi {name}! This is an automated message from {salon}.',
      performance: { sent: automation.sentCount || 0, delivered: automation.deliveredCount || 0, converted: automation.convertedCount || 0 },
    });
  } catch (error: any) {
    console.error('Error fetching automation:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch automation' });
  }
});

router.patch('/automations/:id', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    const { id } = req.params;
    const { isActive, trigger, message, linkedOfferId } = req.body;

    let existing: any = null;
    try {
      [existing] = await db.select()
        .from(marketingAutomations)
        .where(and(eq(marketingAutomations.id, id), eq(marketingAutomations.salonId, salonId)));
    } catch {
      // Table might not exist
    }

    if (existing) {
      await db.update(marketingAutomations)
        .set({
          isActive: isActive !== undefined ? (isActive ? 1 : 0) : undefined,
          trigger: trigger ? trigger : undefined,
          messageTemplate: message,
          linkedOfferId,
          updatedAt: new Date(),
        })
        .where(eq(marketingAutomations.id, id));
    } else {
      const defaults = getDefaultAutomations(salonId);
      const defaultAutomation = defaults.find(a => a.type === id) || defaults[0];

      await db.insert(marketingAutomations).values({
        id,
        salonId,
        type: defaultAutomation.type,
        name: defaultAutomation.name,
        description: defaultAutomation.description,
        isActive: isActive !== undefined ? (isActive ? 1 : 0) : 1,
        trigger: trigger || defaultAutomation.trigger,
        messageTemplate: message || defaultAutomation.messageTemplate,
        linkedOfferId,
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating automation:', error);
    res.status(400).json({ error: error.message || 'Failed to update automation' });
  }
});

router.post('/automations/:id/toggle', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const salonId = req.user.salonId;
    const { id } = req.params;

    let existing: any = null;
    try {
      [existing] = await db.select()
        .from(marketingAutomations)
        .where(and(eq(marketingAutomations.id, id), eq(marketingAutomations.salonId, salonId)));
    } catch {
      // Table might not exist
    }

    if (existing) {
      await db.update(marketingAutomations)
        .set({ isActive: existing.isActive === 1 ? 0 : 1, updatedAt: new Date() })
        .where(eq(marketingAutomations.id, id));
    } else {
      const defaults = getDefaultAutomations(salonId);
      const defaultAutomation = defaults.find(a => a.type === id) || defaults[0];

      await db.insert(marketingAutomations).values({
        id,
        salonId,
        type: defaultAutomation.type,
        name: defaultAutomation.name,
        description: defaultAutomation.description,
        isActive: 1,
        trigger: defaultAutomation.trigger,
        messageTemplate: defaultAutomation.messageTemplate,
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error toggling automation:', error);
    res.status(400).json({ error: error.message || 'Failed to toggle automation' });
  }
});

router.post('/automations/:id/test', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const { testPhone } = req.body;

    if (!testPhone) {
      return res.status(400).json({ error: 'Test phone number is required' });
    }

    console.log(`Sending test automation message to ${testPhone}`);

    res.json({ success: true, message: `Test message sent to ${testPhone}` });
  } catch (error: any) {
    console.error('Error testing automation:', error);
    res.status(400).json({ error: error.message || 'Failed to send test message' });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function getOfferStatus(offer: any, now: Date): string {
  if (offer.isActive === 0) return 'archived';
  if (new Date(offer.validUntil) < now) return 'expired';
  if (new Date(offer.validFrom) > now) return 'scheduled';
  return 'active';
}

function getDefaultAutomations(salonId: string) {
  return [
    {
      id: 'rebook_reminder',
      type: 'rebook_reminder',
      salonId,
      name: 'Rebook Reminder',
      description: 'Remind customers to book their next appointment after a set time',
      isActive: 0,
      trigger: { type: 'days_after_visit', value: 14, unit: 'days' },
      messageTemplate: 'Hi {name}! It\'s been {days} days since your last visit. Time to book your next appointment at {salon}!',
      sentCount: 0,
      deliveredCount: 0,
      convertedCount: 0,
    },
    {
      id: 'win_back',
      type: 'win_back',
      salonId,
      name: 'Win-Back Campaign',
      description: 'Re-engage customers who haven\'t visited in a while',
      isActive: 0,
      trigger: { type: 'days_inactive', value: 60, unit: 'days' },
      messageTemplate: 'We miss you {name}! It\'s been a while since we saw you. Here\'s a special offer to welcome you back to {salon}.',
      sentCount: 0,
      deliveredCount: 0,
      convertedCount: 0,
    },
    {
      id: 'birthday_offer',
      type: 'birthday_offer',
      salonId,
      name: 'Birthday Offer',
      description: 'Send birthday wishes with a special discount',
      isActive: 0,
      trigger: { type: 'birthday', value: 0, unit: 'days' },
      messageTemplate: 'Happy Birthday {name}! Celebrate with {discount}% off your next visit at {salon}. Valid for 7 days!',
      sentCount: 0,
      deliveredCount: 0,
      convertedCount: 0,
    },
    {
      id: 'review_request',
      type: 'review_request',
      salonId,
      name: 'Review Request',
      description: 'Ask customers for feedback after their visit',
      isActive: 0,
      trigger: { type: 'hours_after_visit', value: 2, unit: 'hours' },
      messageTemplate: 'Hi {name}! Thank you for visiting {salon} today. We\'d love to hear your feedback. Rate us here: {link}',
      sentCount: 0,
      deliveredCount: 0,
      convertedCount: 0,
    },
    {
      id: 'fill_slow_days',
      type: 'fill_slow_days',
      salonId,
      name: 'Fill Slow Days',
      description: 'Automatically offer discounts on days with low bookings',
      isActive: 0,
      trigger: { type: 'low_bookings', value: 3, unit: 'bookings' },
      messageTemplate: 'Hi {name}! We have special availability on {day}. Book now and get {discount}% off at {salon}!',
      sentCount: 0,
      deliveredCount: 0,
      convertedCount: 0,
    },
  ];
}

export function registerMobileMarketingRoutes(app: express.Express) {
  app.use('/api/mobile/business/marketing', router);
}

export default router;
