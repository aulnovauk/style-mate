/**
 * Stylemate - Mobile Inventory Management API Routes
 * 
 * APIs for inventory management in business mobile app:
 * - Products CRUD
 * - Product Categories CRUD
 * - Vendors/Suppliers CRUD
 * - Stock movements and adjustments
 * - Purchase Orders management
 * - Stocktake functionality
 */

import type { Express, Response } from "express";
import { db } from "../db";
import { 
  products, 
  productCategories, 
  vendors, 
  stockMovements, 
  purchaseOrders, 
  purchaseOrderItems,
  salons,
  staff
} from "@shared/schema";
import { eq, and, sql, desc, asc, gte, lte, like, or, isNull, count } from "drizzle-orm";
import { authenticateMobileUser } from "../middleware/authMobile";
import { z } from "zod";

// Validation schemas
const createProductSchema = z.object({
  categoryId: z.string().optional(),
  vendorId: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  brand: z.string().optional(),
  size: z.string().optional(),
  unit: z.string().default("piece"),
  costPriceInPaisa: z.number().int().min(0),
  sellingPriceInPaisa: z.number().int().min(0).optional(),
  currentStock: z.number().default(0),
  minimumStock: z.number().default(0),
  maximumStock: z.number().optional(),
  reorderPoint: z.number().optional(),
  reorderQuantity: z.number().optional(),
  leadTimeDays: z.number().int().default(7),
  expiryDate: z.string().optional(),
  batchNumber: z.string().optional(),
  barcode: z.string().optional(),
  location: z.string().optional(),
  isActive: z.number().default(1),
  isRetailItem: z.number().default(0),
  trackStock: z.number().default(1),
  lowStockAlert: z.number().default(1),
  availableForRetail: z.number().default(0),
  retailPriceInPaisa: z.number().int().min(0).optional(),
  retailDescription: z.string().optional(),
  retailStockAllocated: z.number().optional(),
  featured: z.number().default(0),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  imageUrl: z.string().optional(),
});

const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  parentCategoryId: z.string().optional(),
  isActive: z.number().default(1),
  sortOrder: z.number().default(0),
});

const createVendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().default("India"),
  website: z.string().optional(),
  taxId: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive", "suspended"]).default("active"),
});

const stockAdjustmentSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(["receive", "usage", "adjustment", "transfer", "damage", "return", "expired"]),
  quantity: z.number().min(0.001),
  reason: z.string().optional(),
  notes: z.string().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  unitCostInPaisa: z.number().int().optional(),
});

const createPurchaseOrderSchema = z.object({
  vendorId: z.string().min(1, "Vendor is required"),
  expectedDeliveryDate: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().min(0.001),
    unitCostInPaisa: z.number().int().min(0),
  })).min(1, "At least one item is required"),
});

const receivePurchaseOrderSchema = z.object({
  items: z.array(z.object({
    itemId: z.string().min(1),
    receivedQuantity: z.number().min(0),
    batchNumber: z.string().optional(),
    expiryDate: z.string().optional(),
  })),
  notes: z.string().optional(),
});

const stocktakeSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    countedQuantity: z.number().min(0),
    notes: z.string().optional(),
  })),
  notes: z.string().optional(),
});

// Helper to get user's salon access
async function getUserSalonId(userId: string): Promise<string | null> {
  const staffRecord = await db.query.staff.findFirst({
    where: and(eq(staff.userId, userId), eq(staff.isActive, 1)),
  });
  if (staffRecord) return staffRecord.salonId;

  const ownedSalon = await db.query.salons.findFirst({
    where: eq(salons.ownerId, userId),
  });
  return ownedSalon?.id || null;
}

// Format currency
function formatCurrency(paisa: number): string {
  return `₹${(paisa / 100).toLocaleString("en-IN")}`;
}

// Generate PO number
function generatePONumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PO-${year}${month}-${random}`;
}

export function registerMobileInventoryRoutes(app: Express) {
  
  // ===== INVENTORY DASHBOARD STATS =====
  
  app.get("/api/mobile/business/inventory/stats", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      if (!salonId) return res.status(403).json({ error: "No salon access found" });

      // Get product counts
      const allProducts = await db.select().from(products).where(eq(products.salonId, salonId));
      
      const totalProducts = allProducts.length;
      const activeProducts = allProducts.filter(p => p.isActive === 1).length;
      
      // Calculate stock value
      let totalStockValue = 0;
      let lowStockCount = 0;
      let outOfStockCount = 0;
      let reorderNeededCount = 0;
      const expiringCount = 0; // Would need date comparison logic
      
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      for (const product of allProducts) {
        const currentStock = Number(product.currentStock) || 0;
        const minStock = Number(product.minimumStock) || 0;
        const reorderPoint = Number(product.reorderPoint) || minStock;
        const costPerUnit = product.costPriceInPaisa || 0;
        
        totalStockValue += currentStock * costPerUnit;
        
        if (currentStock === 0) {
          outOfStockCount++;
        } else if (currentStock <= minStock) {
          lowStockCount++;
        }
        
        if (currentStock <= reorderPoint && currentStock > 0) {
          reorderNeededCount++;
        }
      }
      
      // Get category count
      const categoryCount = await db.select({ count: count() })
        .from(productCategories)
        .where(and(eq(productCategories.salonId, salonId), eq(productCategories.isActive, 1)));
      
      // Get vendor count
      const vendorCount = await db.select({ count: count() })
        .from(vendors)
        .where(and(eq(vendors.salonId, salonId), eq(vendors.status, "active")));
      
      // Get pending orders count
      const pendingOrders = await db.select({ count: count() })
        .from(purchaseOrders)
        .where(and(
          eq(purchaseOrders.salonId, salonId),
          or(eq(purchaseOrders.status, "draft"), eq(purchaseOrders.status, "sent"), eq(purchaseOrders.status, "confirmed"))
        ));

      res.json({
        success: true,
        stats: {
          totalProducts,
          activeProducts,
          totalStockValue,
          totalStockValueFormatted: formatCurrency(totalStockValue),
          lowStockCount,
          outOfStockCount,
          reorderNeededCount,
          expiringCount,
          categoryCount: categoryCount[0]?.count || 0,
          vendorCount: vendorCount[0]?.count || 0,
          pendingOrdersCount: pendingOrders[0]?.count || 0,
        },
      });
    } catch (error) {
      console.error("Inventory stats error:", error);
      res.status(500).json({ error: "Failed to fetch inventory stats" });
    }
  });

  // ===== INVENTORY ANALYTICS =====
  app.get("/api/mobile/business/inventory/analytics", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      if (!salonId) return res.status(403).json({ error: "No salon access found" });

      const { period = 'week' } = req.query;
      
      // Calculate date range based on period
      const now = new Date();
      const startDate = new Date();
      if (period === 'month') {
        startDate.setDate(startDate.getDate() - 30);
      } else {
        startDate.setDate(startDate.getDate() - 7);
      }

      // Get stock movements for the period
      const movements = await db.select({
        movement: stockMovements,
        productName: products.name,
        staffFirstName: staff.firstName,
        staffLastName: staff.lastName,
      })
      .from(stockMovements)
      .leftJoin(products, eq(stockMovements.productId, products.id))
      .leftJoin(staff, eq(stockMovements.staffId, staff.id))
      .where(and(
        eq(stockMovements.salonId, salonId),
        gte(stockMovements.createdAt, startDate)
      ))
      .orderBy(desc(stockMovements.createdAt))
      .limit(100);

      // Calculate trend summary
      let totalStockIn = 0;
      let totalStockOut = 0;
      
      for (const m of movements) {
        const qty = Number(m.movement.quantity) || 0;
        const type = m.movement.type;
        if (type === 'receive' || type === 'return') {
          totalStockIn += qty;
        } else if (type === 'usage' || type === 'damage' || type === 'expired') {
          totalStockOut += qty;
        }
      }

      // Calculate turnover rate (simplified: stock out / average stock)
      const allProducts = await db.select().from(products).where(eq(products.salonId, salonId));
      const totalStock = allProducts.reduce((sum, p) => sum + (Number(p.currentStock) || 0), 0);
      const productCount = allProducts.length;
      const avgStock = productCount > 0 ? totalStock / productCount : 0;
      // Guard against division by zero - if no stock, return 0
      const turnoverRate = avgStock > 0 ? Math.round((totalStockOut / avgStock) * 10) / 10 : 0;

      // Group movements by day for trend chart
      const dayMap = new Map<string, { inbound: number; outbound: number }>();
      const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      for (const m of movements) {
        const date = new Date(m.movement.createdAt!);
        const dayKey = dayLabels[date.getDay()];
        
        if (!dayMap.has(dayKey)) {
          dayMap.set(dayKey, { inbound: 0, outbound: 0 });
        }
        
        const qty = Number(m.movement.quantity) || 0;
        const type = m.movement.type;
        const entry = dayMap.get(dayKey)!;
        
        if (type === 'receive' || type === 'return') {
          entry.inbound += qty;
        } else if (type === 'usage' || type === 'damage' || type === 'expired') {
          entry.outbound += qty;
        }
      }

      const stockTrends = dayLabels.map(day => ({
        day,
        inbound: dayMap.get(day)?.inbound || 0,
        outbound: dayMap.get(day)?.outbound || 0,
      }));

      // Get recent stock changes (last 10 movements)
      const recentChanges = movements.slice(0, 10).map(m => {
        const type = m.movement.type as string;
        let changeType: 'added' | 'used' | 'adjusted' | 'delivery' = 'adjusted';
        let title = 'Stock Adjusted';
        
        if (type === 'receive') {
          changeType = 'delivery';
          title = 'Stock Received';
        } else if (type === 'usage') {
          changeType = 'used';
          title = 'Stock Used';
        } else if (type === 'return') {
          changeType = 'added';
          title = 'Stock Returned';
        } else if (type === 'adjustment') {
          changeType = 'adjusted';
          title = 'Stock Adjusted';
        } else if (type === 'damage' || type === 'expired') {
          changeType = 'used';
          title = type === 'damage' ? 'Damaged Stock' : 'Expired Stock';
        }
        
        const staffName = m.staffFirstName && m.staffLastName 
          ? `${m.staffFirstName} ${m.staffLastName}` 
          : 'System';
        
        return {
          id: m.movement.id,
          type: changeType,
          title,
          productName: m.productName || 'Unknown Product',
          quantity: Number(m.movement.quantity) || 0,
          by: staffName,
          timestamp: m.movement.createdAt ? new Date(m.movement.createdAt).toISOString() : new Date().toISOString(),
        };
      });

      // Get top selling products (based on usage movements)
      const productUsageMap = new Map<string, { name: string; category: string; units: number; revenue: number }>();
      
      for (const m of movements) {
        if (m.movement.type === 'usage' && m.movement.productId) {
          const productId = m.movement.productId;
          const qty = Number(m.movement.quantity) || 0;
          const unitCost = Number(m.movement.unitCostInPaisa) || 0;
          
          if (!productUsageMap.has(productId)) {
            const product = allProducts.find(p => p.id === productId);
            productUsageMap.set(productId, {
              name: m.productName || 'Unknown',
              category: product?.categoryId ? 'General' : 'Uncategorized',
              units: 0,
              revenue: 0,
            });
          }
          
          const entry = productUsageMap.get(productId)!;
          entry.units += qty;
          entry.revenue += qty * unitCost;
        }
      }

      const topSellingProducts = Array.from(productUsageMap.entries())
        .map(([id, data]) => ({
          id,
          name: data.name,
          category: data.category,
          unitsSold: data.units,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.unitsSold - a.unitsSold)
        .slice(0, 5);

      res.json({
        topSellingProducts,
        stockTrends,
        recentChanges,
        trendSummary: {
          stockIn: totalStockIn,
          stockOut: totalStockOut,
          turnoverRate,
        },
      });
    } catch (error) {
      console.error("Inventory analytics error:", error);
      res.status(500).json({ error: "Failed to fetch inventory analytics" });
    }
  });

  // ===== PRODUCTS =====
  
  app.get("/api/mobile/business/inventory/products", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      if (!salonId) return res.status(403).json({ error: "No salon access found" });

      const { 
        search, 
        categoryId, 
        vendorId, 
        stockStatus, 
        isActive,
        isRetail,
        sortBy = "name",
        sortOrder = "asc",
        limit = "50",
        offset = "0"
      } = req.query;

      let query = db.select({
        product: products,
        categoryName: productCategories.name,
        vendorName: vendors.name,
      })
      .from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
      .leftJoin(vendors, eq(products.vendorId, vendors.id))
      .where(eq(products.salonId, salonId))
      .$dynamic();

      // Apply filters
      const conditions: any[] = [eq(products.salonId, salonId)];
      
      if (search) {
        conditions.push(or(
          like(products.name, `%${search}%`),
          like(products.sku, `%${search}%`),
          like(products.barcode, `%${search}%`),
          like(products.brand, `%${search}%`)
        ));
      }
      
      if (categoryId) conditions.push(eq(products.categoryId, categoryId as string));
      if (vendorId) conditions.push(eq(products.vendorId, vendorId as string));
      if (isActive !== undefined) conditions.push(eq(products.isActive, parseInt(isActive as string)));
      if (isRetail === "1") conditions.push(eq(products.availableForRetail, 1));

      // Build final query
      const results = await db.select({
        product: products,
        categoryName: productCategories.name,
        vendorName: vendors.name,
      })
      .from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
      .leftJoin(vendors, eq(products.vendorId, vendors.id))
      .where(and(...conditions))
      .orderBy(sortOrder === "desc" ? desc(products.name) : asc(products.name))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

      // Process results with stock status
      const productList = results.map(({ product, categoryName, vendorName }) => {
        const currentStock = Number(product.currentStock) || 0;
        const minStock = Number(product.minimumStock) || 0;
        const reorderPoint = Number(product.reorderPoint) || minStock;
        
        let stockStatus: "out" | "low" | "good" | "overstock" = "good";
        if (currentStock === 0) stockStatus = "out";
        else if (currentStock <= minStock) stockStatus = "low";
        else if (product.maximumStock && currentStock > Number(product.maximumStock)) stockStatus = "overstock";
        
        return {
          ...product,
          categoryName,
          vendorName,
          stockStatus,
          costPriceFormatted: formatCurrency(product.costPriceInPaisa),
          sellingPriceFormatted: product.sellingPriceInPaisa ? formatCurrency(product.sellingPriceInPaisa) : null,
          retailPriceFormatted: product.retailPriceInPaisa ? formatCurrency(product.retailPriceInPaisa) : null,
        };
      });

      // Filter by stock status if specified
      let filteredProducts = productList;
      if (stockStatus) {
        filteredProducts = productList.filter(p => p.stockStatus === stockStatus);
      }

      res.json({ success: true, products: filteredProducts });
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/mobile/business/inventory/products/:id", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      if (!salonId) return res.status(403).json({ error: "No salon access found" });

      const { id } = req.params;

      const result = await db.select({
        product: products,
        categoryName: productCategories.name,
        vendorName: vendors.name,
      })
      .from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
      .leftJoin(vendors, eq(products.vendorId, vendors.id))
      .where(and(eq(products.id, id), eq(products.salonId, salonId)))
      .limit(1);

      if (result.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      const { product, categoryName, vendorName } = result[0];
      const currentStock = Number(product.currentStock) || 0;
      const minStock = Number(product.minimumStock) || 0;
      
      let stockStatus: "out" | "low" | "good" | "overstock" = "good";
      if (currentStock === 0) stockStatus = "out";
      else if (currentStock <= minStock) stockStatus = "low";
      else if (product.maximumStock && currentStock > Number(product.maximumStock)) stockStatus = "overstock";

      // Get recent stock movements
      const movements = await db.select({
        movement: stockMovements,
        staffName: staff.name,
      })
      .from(stockMovements)
      .leftJoin(staff, eq(stockMovements.staffId, staff.id))
      .where(eq(stockMovements.productId, id))
      .orderBy(desc(stockMovements.createdAt))
      .limit(20);

      res.json({
        success: true,
        product: {
          ...product,
          categoryName,
          vendorName,
          stockStatus,
          costPriceFormatted: formatCurrency(product.costPriceInPaisa),
          sellingPriceFormatted: product.sellingPriceInPaisa ? formatCurrency(product.sellingPriceInPaisa) : null,
          retailPriceFormatted: product.retailPriceInPaisa ? formatCurrency(product.retailPriceInPaisa) : null,
        },
        movements: movements.map(({ movement, staffName }) => ({
          ...movement,
          staffName,
          createdAtFormatted: new Date(movement.createdAt!).toLocaleString("en-IN"),
        })),
      });
    } catch (error) {
      console.error("Get product error:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/mobile/business/inventory/products", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      if (!salonId) return res.status(403).json({ error: "No salon access found" });

      const validated = createProductSchema.parse(req.body);

      // Check for duplicate SKU
      const existingSku = await db.select().from(products)
        .where(and(eq(products.salonId, salonId), eq(products.sku, validated.sku)))
        .limit(1);

      if (existingSku.length > 0) {
        return res.status(400).json({ error: "A product with this SKU already exists" });
      }

      const [newProduct] = await db.insert(products).values({
        salonId,
        ...validated,
        currentStock: String(validated.currentStock),
        minimumStock: String(validated.minimumStock),
        maximumStock: validated.maximumStock ? String(validated.maximumStock) : null,
        reorderPoint: validated.reorderPoint ? String(validated.reorderPoint) : null,
        reorderQuantity: validated.reorderQuantity ? String(validated.reorderQuantity) : null,
        expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
        metadata: validated.imageUrl ? { imageUrl: validated.imageUrl } : {},
      }).returning();

      // Create initial stock movement if starting with stock
      if (validated.currentStock > 0) {
        await db.insert(stockMovements).values({
          salonId,
          productId: newProduct.id,
          type: "receive",
          quantity: String(validated.currentStock),
          unit: validated.unit,
          previousStock: "0",
          newStock: String(validated.currentStock),
          reason: "Initial stock",
          referenceType: "initial_stock",
        });
      }

      res.status(201).json({ success: true, product: newProduct });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Create product error:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.put("/api/mobile/business/inventory/products/:id", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      if (!salonId) return res.status(403).json({ error: "No salon access found" });

      const { id } = req.params;
      const validated = createProductSchema.partial().parse(req.body);

      // Verify product belongs to salon
      const existing = await db.select().from(products)
        .where(and(eq(products.id, id), eq(products.salonId, salonId)))
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Check for duplicate SKU if changing
      if (validated.sku && validated.sku !== existing[0].sku) {
        const existingSku = await db.select().from(products)
          .where(and(eq(products.salonId, salonId), eq(products.sku, validated.sku)))
          .limit(1);

        if (existingSku.length > 0) {
          return res.status(400).json({ error: "A product with this SKU already exists" });
        }
      }

      const updateData: any = { ...validated, updatedAt: new Date() };
      if (validated.currentStock !== undefined) updateData.currentStock = String(validated.currentStock);
      if (validated.minimumStock !== undefined) updateData.minimumStock = String(validated.minimumStock);
      if (validated.maximumStock !== undefined) updateData.maximumStock = String(validated.maximumStock);
      if (validated.reorderPoint !== undefined) updateData.reorderPoint = String(validated.reorderPoint);
      if (validated.reorderQuantity !== undefined) updateData.reorderQuantity = String(validated.reorderQuantity);
      if (validated.expiryDate) updateData.expiryDate = new Date(validated.expiryDate);
      if (validated.imageUrl) updateData.metadata = { ...(existing[0].metadata as Record<string, unknown> || {}), imageUrl: validated.imageUrl };

      const [updated] = await db.update(products)
        .set(updateData)
        .where(eq(products.id, id))
        .returning();

      res.json({ success: true, product: updated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Update product error:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/mobile/business/inventory/products/:id", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      if (!salonId) return res.status(403).json({ error: "No salon access found" });

      const { id } = req.params;

      // Verify product belongs to salon
      const existing = await db.select().from(products)
        .where(and(eq(products.id, id), eq(products.salonId, salonId)))
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Soft delete by setting isActive to 0
      await db.update(products)
        .set({ isActive: 0, updatedAt: new Date() })
        .where(eq(products.id, id));

      res.json({ success: true, message: "Product deleted" });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // ===== CATEGORIES =====
  
  app.get("/api/mobile/business/inventory/categories", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      if (!salonId) return res.status(403).json({ error: "No salon access found" });

      const categories = await db.select()
        .from(productCategories)
        .where(eq(productCategories.salonId, salonId))
        .orderBy(asc(productCategories.sortOrder), asc(productCategories.name));

      // Get product count per category
      const categoriesWithCount = await Promise.all(categories.map(async (cat) => {
        const productCount = await db.select({ count: count() })
          .from(products)
          .where(and(eq(products.categoryId, cat.id), eq(products.isActive, 1)));
        
        return {
          ...cat,
          productCount: productCount[0]?.count || 0,
        };
      }));

      res.json({ success: true, categories: categoriesWithCount });
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/mobile/business/inventory/categories", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      if (!salonId) return res.status(403).json({ error: "No salon access found" });

      const validated = createCategorySchema.parse(req.body);

      const [newCategory] = await db.insert(productCategories).values({
        salonId,
        ...validated,
      }).returning();

      res.status(201).json({ success: true, category: newCategory });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Create category error:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  app.put("/api/mobile/business/inventory/categories/:id", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      if (!salonId) return res.status(403).json({ error: "No salon access found" });

      const { id } = req.params;
      const validated = createCategorySchema.partial().parse(req.body);

      const [updated] = await db.update(productCategories)
        .set(validated)
        .where(and(eq(productCategories.id, id), eq(productCategories.salonId, salonId)))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.json({ success: true, category: updated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Update category error:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/mobile/business/inventory/categories/:id", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      if (!salonId) return res.status(403).json({ error: "No salon access found" });

      const { id } = req.params;

      // Check if category has products
      const productCount = await db.select({ count: count() })
        .from(products)
        .where(and(eq(products.categoryId, id), eq(products.isActive, 1)));

      if ((productCount[0]?.count || 0) > 0) {
        return res.status(400).json({ error: "Cannot delete category with products. Move or delete products first." });
      }

      await db.delete(productCategories)
        .where(and(eq(productCategories.id, id), eq(productCategories.salonId, salonId)));

      res.json({ success: true, message: "Category deleted" });
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // ===== VENDORS/SUPPLIERS =====
  
  app.get("/api/mobile/business/inventory/vendors", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      if (!salonId) return res.status(403).json({ error: "No salon access found" });

      const { search, status } = req.query;
      
      let conditions: any[] = [eq(vendors.salonId, salonId)];
      if (status) conditions.push(eq(vendors.status, status as string));
      if (search) {
        conditions.push(or(
          like(vendors.name, `%${search}%`),
          like(vendors.contactPerson, `%${search}%`),
          like(vendors.email, `%${search}%`)
        ));
      }

      const vendorList = await db.select()
        .from(vendors)
        .where(and(...conditions))
        .orderBy(asc(vendors.name));

      // Get product count and order stats per vendor
      const vendorsWithStats = await Promise.all(vendorList.map(async (vendor) => {
        const productCount = await db.select({ count: count() })
          .from(products)
          .where(and(eq(products.vendorId, vendor.id), eq(products.isActive, 1)));

        const orderStats = await db.select({ 
          count: count(),
          total: sql<number>`SUM(${purchaseOrders.totalInPaisa})`
        })
        .from(purchaseOrders)
        .where(eq(purchaseOrders.vendorId, vendor.id));

        return {
          ...vendor,
          productCount: productCount[0]?.count || 0,
          orderCount: orderStats[0]?.count || 0,
          totalOrdered: orderStats[0]?.total || 0,
          totalOrderedFormatted: formatCurrency(orderStats[0]?.total || 0),
        };
      }));

      res.json({ success: true, vendors: vendorsWithStats });
    } catch (error) {
      console.error("Get vendors error:", error);
      res.status(500).json({ error: "Failed to fetch vendors" });
    }
  });

  app.get("/api/mobile/business/inventory/vendors/:id", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      if (!salonId) return res.status(403).json({ error: "No salon access found" });

      const { id } = req.params;

      const vendor = await db.select()
        .from(vendors)
        .where(and(eq(vendors.id, id), eq(vendors.salonId, salonId)))
        .limit(1);

      if (vendor.length === 0) {
        return res.status(404).json({ error: "Vendor not found" });
      }

      // Get products from this vendor
      const vendorProducts = await db.select()
        .from(products)
        .where(and(eq(products.vendorId, id), eq(products.isActive, 1)))
        .orderBy(asc(products.name));

      // Get recent orders
      const recentOrders = await db.select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.vendorId, id))
        .orderBy(desc(purchaseOrders.createdAt))
        .limit(10);

      res.json({
        success: true,
        vendor: vendor[0],
        products: vendorProducts.map(p => ({
          ...p,
          costPriceFormatted: formatCurrency(p.costPriceInPaisa),
        })),
        recentOrders: recentOrders.map(order => ({
          ...order,
          totalFormatted: formatCurrency(order.totalInPaisa),
          orderDateFormatted: new Date(order.orderDate).toLocaleDateString("en-IN"),
        })),
      });
    } catch (error) {
      console.error("Get vendor error:", error);
      res.status(500).json({ error: "Failed to fetch vendor" });
    }
  });

  app.post("/api/mobile/business/inventory/vendors", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      if (!salonId) return res.status(403).json({ error: "No salon access found" });

      const validated = createVendorSchema.parse(req.body);

      const [newVendor] = await db.insert(vendors).values({
        salonId,
        ...validated,
        email: validated.email || null,
      }).returning();

      res.status(201).json({ success: true, vendor: newVendor });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Create vendor error:", error);
      res.status(500).json({ error: "Failed to create vendor" });
    }
  });

  app.put("/api/mobile/business/inventory/vendors/:id", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      if (!salonId) return res.status(403).json({ error: "No salon access found" });

      const { id } = req.params;
      const validated = createVendorSchema.partial().parse(req.body);

      const [updated] = await db.update(vendors)
        .set({ ...validated, updatedAt: new Date() })
        .where(and(eq(vendors.id, id), eq(vendors.salonId, salonId)))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Vendor not found" });
      }

      res.json({ success: true, vendor: updated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Update vendor error:", error);
      res.status(500).json({ error: "Failed to update vendor" });
    }
  });

  // ===== STOCK ADJUSTMENTS =====
  
  app.post("/api/mobile/business/inventory/stock-adjustment", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      if (!salonId) return res.status(403).json({ error: "No salon access found" });

      const validated = stockAdjustmentSchema.parse(req.body);

      // Get current product
      const product = await db.select()
        .from(products)
        .where(and(eq(products.id, validated.productId), eq(products.salonId, salonId)))
        .limit(1);

      if (product.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      const currentStock = Number(product[0].currentStock) || 0;
      let newStock: number;

      // Calculate new stock based on movement type
      switch (validated.type) {
        case "receive":
        case "return":
          newStock = currentStock + validated.quantity;
          break;
        case "usage":
        case "damage":
        case "expired":
          newStock = Math.max(0, currentStock - validated.quantity);
          break;
        case "adjustment":
          newStock = validated.quantity; // Direct set
          break;
        case "transfer":
          newStock = currentStock - validated.quantity;
          break;
        default:
          newStock = currentStock;
      }

      // Get staff record for logging
      const staffRecord = await db.query.staff.findFirst({
        where: and(eq(staff.userId, userId), eq(staff.isActive, 1)),
      });

      // Create stock movement record
      const [movement] = await db.insert(stockMovements).values({
        salonId,
        productId: validated.productId,
        type: validated.type,
        quantity: String(validated.quantity),
        unit: product[0].unit,
        unitCostInPaisa: validated.unitCostInPaisa || product[0].costPriceInPaisa,
        totalCostInPaisa: (validated.unitCostInPaisa || product[0].costPriceInPaisa) * validated.quantity,
        previousStock: String(currentStock),
        newStock: String(newStock),
        reason: validated.reason,
        notes: validated.notes,
        batchNumber: validated.batchNumber,
        expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
        staffId: staffRecord?.id,
        referenceType: "manual_adjustment",
      }).returning();

      // Update product stock
      await db.update(products)
        .set({ 
          currentStock: String(newStock),
          batchNumber: validated.batchNumber || product[0].batchNumber,
          expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : product[0].expiryDate,
          updatedAt: new Date(),
        })
        .where(eq(products.id, validated.productId));

      res.json({
        success: true,
        movement,
        previousStock: currentStock,
        newStock,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Stock adjustment error:", error);
      res.status(500).json({ error: "Failed to adjust stock" });
    }
  });

  app.get("/api/mobile/business/inventory/stock-movements", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      if (!salonId) return res.status(403).json({ error: "No salon access found" });

      const { productId, type, startDate, endDate, limit = "50" } = req.query;

      let conditions: any[] = [eq(stockMovements.salonId, salonId)];
      if (productId) conditions.push(eq(stockMovements.productId, productId as string));
      if (type) conditions.push(eq(stockMovements.type, type as string));
      if (startDate) conditions.push(gte(stockMovements.createdAt, new Date(startDate as string)));
      if (endDate) conditions.push(lte(stockMovements.createdAt, new Date(endDate as string)));

      const movements = await db.select({
        movement: stockMovements,
        productName: products.name,
        productSku: products.sku,
        staffName: staff.name,
      })
      .from(stockMovements)
      .leftJoin(products, eq(stockMovements.productId, products.id))
      .leftJoin(staff, eq(stockMovements.staffId, staff.id))
      .where(and(...conditions))
      .orderBy(desc(stockMovements.createdAt))
      .limit(parseInt(limit as string));

      res.json({
        success: true,
        movements: movements.map(({ movement, productName, productSku, staffName }) => ({
          ...movement,
          productName,
          productSku,
          staffName,
          createdAtFormatted: new Date(movement.createdAt!).toLocaleString("en-IN"),
        })),
      });
    } catch (error) {
      console.error("Get stock movements error:", error);
      res.status(500).json({ error: "Failed to fetch stock movements" });
    }
  });

  // ===== PURCHASE ORDERS =====
  
  app.get("/api/mobile/business/inventory/purchase-orders", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      if (!salonId) return res.status(403).json({ error: "No salon access found" });

      const { status, vendorId, limit = "50" } = req.query;

      let conditions: any[] = [eq(purchaseOrders.salonId, salonId)];
      if (status) conditions.push(eq(purchaseOrders.status, status as string));
      if (vendorId) conditions.push(eq(purchaseOrders.vendorId, vendorId as string));

      const orders = await db.select({
        order: purchaseOrders,
        vendorName: vendors.name,
      })
      .from(purchaseOrders)
      .leftJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
      .where(and(...conditions))
      .orderBy(desc(purchaseOrders.createdAt))
      .limit(parseInt(limit as string));

      res.json({
        success: true,
        orders: orders.map(({ order, vendorName }) => ({
          ...order,
          vendorName,
          totalFormatted: formatCurrency(order.totalInPaisa),
          orderDateFormatted: new Date(order.orderDate).toLocaleDateString("en-IN"),
          expectedDeliveryFormatted: order.expectedDeliveryDate 
            ? new Date(order.expectedDeliveryDate).toLocaleDateString("en-IN") 
            : null,
        })),
      });
    } catch (error) {
      console.error("Get purchase orders error:", error);
      res.status(500).json({ error: "Failed to fetch purchase orders" });
    }
  });

  app.get("/api/mobile/business/inventory/purchase-orders/:id", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      if (!salonId) return res.status(403).json({ error: "No salon access found" });

      const { id } = req.params;

      const order = await db.select({
        order: purchaseOrders,
        vendorName: vendors.name,
        vendorEmail: vendors.email,
        vendorPhone: vendors.phone,
      })
      .from(purchaseOrders)
      .leftJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
      .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.salonId, salonId)))
      .limit(1);

      if (order.length === 0) {
        return res.status(404).json({ error: "Purchase order not found" });
      }

      // Get order items
      const items = await db.select({
        item: purchaseOrderItems,
        productName: products.name,
        productSku: products.sku,
        productUnit: products.unit,
      })
      .from(purchaseOrderItems)
      .leftJoin(products, eq(purchaseOrderItems.productId, products.id))
      .where(eq(purchaseOrderItems.purchaseOrderId, id));

      const { order: po, vendorName, vendorEmail, vendorPhone } = order[0];

      res.json({
        success: true,
        order: {
          ...po,
          vendorName,
          vendorEmail,
          vendorPhone,
          totalFormatted: formatCurrency(po.totalInPaisa),
          subtotalFormatted: formatCurrency(po.subtotalInPaisa),
          taxFormatted: formatCurrency(po.taxInPaisa),
          shippingFormatted: formatCurrency(po.shippingInPaisa),
          discountFormatted: formatCurrency(po.discountInPaisa),
          orderDateFormatted: new Date(po.orderDate).toLocaleDateString("en-IN"),
        },
        items: items.map(({ item, productName, productSku, productUnit }) => ({
          ...item,
          productName,
          productSku,
          productUnit,
          unitCostFormatted: formatCurrency(item.unitCostInPaisa),
          totalCostFormatted: formatCurrency(item.totalCostInPaisa),
        })),
      });
    } catch (error) {
      console.error("Get purchase order error:", error);
      res.status(500).json({ error: "Failed to fetch purchase order" });
    }
  });

  app.post("/api/mobile/business/inventory/purchase-orders", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      if (!salonId) return res.status(403).json({ error: "No salon access found" });

      const validated = createPurchaseOrderSchema.parse(req.body);

      // Calculate totals
      let subtotal = 0;
      for (const item of validated.items) {
        subtotal += item.quantity * item.unitCostInPaisa;
      }

      const orderNumber = generatePONumber();

      // Create purchase order
      const [newOrder] = await db.insert(purchaseOrders).values({
        salonId,
        vendorId: validated.vendorId,
        orderNumber,
        status: "draft",
        expectedDeliveryDate: validated.expectedDeliveryDate ? new Date(validated.expectedDeliveryDate) : null,
        subtotalInPaisa: subtotal,
        totalInPaisa: subtotal,
        notes: validated.notes,
        internalNotes: validated.internalNotes,
        createdBy: userId,
      }).returning();

      // Create order items
      for (const item of validated.items) {
        const product = await db.select().from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (product.length > 0) {
          await db.insert(purchaseOrderItems).values({
            purchaseOrderId: newOrder.id,
            productId: item.productId,
            quantity: String(item.quantity),
            unit: product[0].unit,
            unitCostInPaisa: item.unitCostInPaisa,
            totalCostInPaisa: Math.round(item.quantity * item.unitCostInPaisa),
          });
        }
      }

      res.status(201).json({ success: true, order: newOrder });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Create purchase order error:", error);
      res.status(500).json({ error: "Failed to create purchase order" });
    }
  });

  app.put("/api/mobile/business/inventory/purchase-orders/:id/status", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      if (!salonId) return res.status(403).json({ error: "No salon access found" });

      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ["draft", "sent", "confirmed", "received", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const [updated] = await db.update(purchaseOrders)
        .set({ 
          status, 
          updatedAt: new Date(),
          approvedBy: status === "confirmed" ? userId : undefined,
        })
        .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.salonId, salonId)))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Purchase order not found" });
      }

      res.json({ success: true, order: updated });
    } catch (error) {
      console.error("Update PO status error:", error);
      res.status(500).json({ error: "Failed to update purchase order status" });
    }
  });

  app.post("/api/mobile/business/inventory/purchase-orders/:id/receive", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      if (!salonId) return res.status(403).json({ error: "No salon access found" });

      const { id } = req.params;
      const validated = receivePurchaseOrderSchema.parse(req.body);

      // Get PO and verify
      const po = await db.select()
        .from(purchaseOrders)
        .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.salonId, salonId)))
        .limit(1);

      if (po.length === 0) {
        return res.status(404).json({ error: "Purchase order not found" });
      }

      // Get staff record
      const staffRecord = await db.query.staff.findFirst({
        where: and(eq(staff.userId, userId), eq(staff.isActive, 1)),
      });

      // Process each item
      for (const receiveItem of validated.items) {
        // Get PO item
        const poItem = await db.select({
          item: purchaseOrderItems,
          product: products,
        })
        .from(purchaseOrderItems)
        .leftJoin(products, eq(purchaseOrderItems.productId, products.id))
        .where(eq(purchaseOrderItems.id, receiveItem.itemId))
        .limit(1);

        if (poItem.length === 0 || !poItem[0].product) continue;

        const { item, product } = poItem[0];
        const currentStock = Number(product.currentStock) || 0;
        const newStock = currentStock + receiveItem.receivedQuantity;

        // Update PO item received quantity
        await db.update(purchaseOrderItems)
          .set({ receivedQuantity: String((Number(item.receivedQuantity) || 0) + receiveItem.receivedQuantity) })
          .where(eq(purchaseOrderItems.id, receiveItem.itemId));

        // Create stock movement
        await db.insert(stockMovements).values({
          salonId,
          productId: product.id,
          type: "receive",
          quantity: String(receiveItem.receivedQuantity),
          unit: product.unit,
          unitCostInPaisa: item.unitCostInPaisa,
          totalCostInPaisa: Math.round(receiveItem.receivedQuantity * item.unitCostInPaisa),
          previousStock: String(currentStock),
          newStock: String(newStock),
          reason: "Purchase order received",
          reference: po[0].orderNumber,
          referenceId: id,
          referenceType: "purchase_order",
          staffId: staffRecord?.id,
          batchNumber: receiveItem.batchNumber,
          expiryDate: receiveItem.expiryDate ? new Date(receiveItem.expiryDate) : null,
        });

        // Update product stock
        await db.update(products)
          .set({ 
            currentStock: String(newStock),
            batchNumber: receiveItem.batchNumber || product.batchNumber,
            expiryDate: receiveItem.expiryDate ? new Date(receiveItem.expiryDate) : product.expiryDate,
            updatedAt: new Date(),
          })
          .where(eq(products.id, product.id));
      }

      // Check if all items received
      const allItems = await db.select().from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.purchaseOrderId, id));

      const allReceived = allItems.every(item => 
        Number(item.receivedQuantity) >= Number(item.quantity)
      );

      // Update PO status
      await db.update(purchaseOrders)
        .set({ 
          status: allReceived ? "received" : "confirmed",
          actualDeliveryDate: allReceived ? new Date() : undefined,
          receivedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(purchaseOrders.id, id));

      res.json({ success: true, message: "Items received successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Receive items error:", error);
      res.status(500).json({ error: "Failed to receive items" });
    }
  });

  // ===== STOCKTAKE =====
  
  app.post("/api/mobile/business/inventory/stocktake", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      if (!salonId) return res.status(403).json({ error: "No salon access found" });

      const validated = stocktakeSchema.parse(req.body);

      // Get staff record
      const staffRecord = await db.query.staff.findFirst({
        where: and(eq(staff.userId, userId), eq(staff.isActive, 1)),
      });

      const adjustments: any[] = [];

      for (const item of validated.items) {
        // Get current product
        const product = await db.select()
          .from(products)
          .where(and(eq(products.id, item.productId), eq(products.salonId, salonId)))
          .limit(1);

        if (product.length === 0) continue;

        const currentStock = Number(product[0].currentStock) || 0;
        const countedQuantity = item.countedQuantity;
        const discrepancy = countedQuantity - currentStock;

        if (discrepancy !== 0) {
          // Create adjustment movement
          const [movement] = await db.insert(stockMovements).values({
            salonId,
            productId: item.productId,
            type: "adjustment",
            quantity: String(Math.abs(discrepancy)),
            unit: product[0].unit,
            previousStock: String(currentStock),
            newStock: String(countedQuantity),
            reason: `Stocktake adjustment: ${discrepancy > 0 ? 'surplus' : 'shortage'}`,
            notes: item.notes || validated.notes,
            staffId: staffRecord?.id,
            referenceType: "stocktake",
          }).returning();

          // Update product stock
          await db.update(products)
            .set({ currentStock: String(countedQuantity), updatedAt: new Date() })
            .where(eq(products.id, item.productId));

          adjustments.push({
            productId: item.productId,
            productName: product[0].name,
            previousStock: currentStock,
            countedQuantity,
            discrepancy,
            movementId: movement.id,
          });
        }
      }

      res.json({
        success: true,
        message: `Stocktake completed. ${adjustments.length} adjustments made.`,
        adjustments,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Stocktake error:", error);
      res.status(500).json({ error: "Failed to complete stocktake" });
    }
  });

  // ===== REORDER SUGGESTIONS =====
  
  app.get("/api/mobile/business/inventory/reorder-suggestions", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const salonId = await getUserSalonId(userId);
      if (!salonId) return res.status(403).json({ error: "No salon access found" });

      const productList = await db.select({
        product: products,
        vendorName: vendors.name,
      })
      .from(products)
      .leftJoin(vendors, eq(products.vendorId, vendors.id))
      .where(and(
        eq(products.salonId, salonId),
        eq(products.isActive, 1),
        eq(products.trackStock, 1)
      ));

      const suggestions = productList
        .filter(({ product }) => {
          const currentStock = Number(product.currentStock) || 0;
          const reorderPoint = Number(product.reorderPoint) || Number(product.minimumStock) || 0;
          return currentStock <= reorderPoint;
        })
        .map(({ product, vendorName }) => {
          const currentStock = Number(product.currentStock) || 0;
          const reorderQuantity = Number(product.reorderQuantity) || 
            (Number(product.maximumStock) || 100) - currentStock;

          return {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            vendorId: product.vendorId,
            vendorName,
            currentStock,
            reorderPoint: Number(product.reorderPoint) || Number(product.minimumStock) || 0,
            suggestedQuantity: Math.max(1, reorderQuantity),
            estimatedCost: reorderQuantity * product.costPriceInPaisa,
            estimatedCostFormatted: formatCurrency(reorderQuantity * product.costPriceInPaisa),
            leadTimeDays: product.leadTimeDays,
            urgency: currentStock === 0 ? "critical" : "low",
          };
        })
        .sort((a, b) => {
          if (a.urgency === "critical" && b.urgency !== "critical") return -1;
          if (a.urgency !== "critical" && b.urgency === "critical") return 1;
          return a.currentStock - b.currentStock;
        });

      res.json({ success: true, suggestions });
    } catch (error) {
      console.error("Reorder suggestions error:", error);
      res.status(500).json({ error: "Failed to get reorder suggestions" });
    }
  });
}
