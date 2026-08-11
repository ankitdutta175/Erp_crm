import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const challanItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
});

const createChallanSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  status: z.enum(['DRAFT', 'CONFIRMED']).default('DRAFT'),
  items: z.array(challanItemSchema).min(1, 'At least one product item is required'),
});

const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']),
});

// Helper to generate auto challan number e.g. CHAL-2026-0004
const generateChallanNumber = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const count = await prisma.salesChallan.count();
  const sequential = (count + 1).toString().padStart(4, '0');
  const candidate = `CHAL-${currentYear}-${sequential}`;

  const exists = await prisma.salesChallan.findUnique({ where: { challanNumber: candidate } });
  if (exists) {
    const timestamp = Date.now().toString().slice(-4);
    return `CHAL-${currentYear}-${sequential}-${timestamp}`;
  }
  return candidate;
};

export const getChallans = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = req.query.status as string;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { challanNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { businessName: { contains: search } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [challans, total] = await Promise.all([
      prisma.salesChallan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, businessName: true, mobile: true, email: true, gstNumber: true },
          },
          items: true,
        },
      }),
      prisma.salesChallan.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: challans,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getChallanById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!challan) {
      res.status(404).json({ success: false, message: 'Sales Challan not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: challan,
    });
  } catch (error) {
    next(error);
  }
};

export const createChallan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { customerId, status, items } = createChallanSchema.parse(req.body);

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    // Fetch product details for snapshot and stock validation
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Verify all products exist and check stock if CONFIRMED
    const itemsWithSnapshots: {
      productId: string;
      productNameSnapshot: string;
      skuSnapshot: string;
      unitPriceSnapshot: number;
      quantity: number;
      totalPrice: number;
    }[] = [];

    let totalQuantity = 0;
    let totalAmount = 0;

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        res.status(400).json({ success: false, message: `Product ID '${item.productId}' not found` });
        return;
      }

      if (status === 'CONFIRMED' && product.currentStock < item.quantity) {
        res.status(400).json({
          success: false,
          message: `Insufficient stock for product '${product.name}' (SKU: ${product.sku}). Available stock: ${product.currentStock}, Requested quantity: ${item.quantity}. Cannot confirm challan.`,
        });
        return;
      }

      const itemTotal = product.unitPrice * item.quantity;
      totalQuantity += item.quantity;
      totalAmount += itemTotal;

      itemsWithSnapshots.push({
        productId: product.id,
        productNameSnapshot: product.name,
        skuSnapshot: product.sku,
        unitPriceSnapshot: product.unitPrice,
        quantity: item.quantity,
        totalPrice: itemTotal,
      });
    }

    const challanNumber = await generateChallanNumber();
    const createdByName = req.user?.name || 'System User';

    // Database transaction to save Challan + Items + reduce stock if CONFIRMED
    const challan = await prisma.$transaction(async (tx) => {
      const createdChallan = await tx.salesChallan.create({
        data: {
          challanNumber,
          customerId,
          totalQuantity,
          totalAmount,
          status,
          createdBy: createdByName,
          items: {
            create: itemsWithSnapshots,
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });

      if (status === 'CONFIRMED') {
        for (const item of items) {
          const product = productMap.get(item.productId)!;
          await tx.product.update({
            where: { id: product.id },
            data: { currentStock: product.currentStock - item.quantity },
          });

          await tx.stockLog.create({
            data: {
              productId: product.id,
              quantityChanged: item.quantity,
              movementType: 'OUT',
              reason: `Stock dispatched via Confirmed Sales Challan #${challanNumber}`,
              createdBy: createdByName,
            },
          });
        }
      }

      return createdChallan;
    });

    res.status(201).json({
      success: true,
      message: `Sales Challan #${challan.challanNumber} created as ${status}`,
      data: challan,
    });
  } catch (error) {
    next(error);
  }
};

export const updateChallanStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status: newStatus } = updateStatusSchema.parse(req.body);

    const existingChallan = await prisma.salesChallan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingChallan) {
      res.status(404).json({ success: false, message: 'Sales Challan not found' });
      return;
    }

    if (existingChallan.status === newStatus) {
      res.status(400).json({ success: false, message: `Challan is already in '${newStatus}' status` });
      return;
    }

    if (existingChallan.status === 'CONFIRMED' && newStatus === 'DRAFT') {
      res.status(400).json({ success: false, message: 'Cannot revert a Confirmed challan to Draft' });
      return;
    }

    const createdByName = req.user?.name || 'System User';

    const updatedChallan = await prisma.$transaction(async (tx) => {
      // If moving from DRAFT to CONFIRMED -> Verify stock & deduct
      if (existingChallan.status === 'DRAFT' && newStatus === 'CONFIRMED') {
        for (const item of existingChallan.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product) {
            throw { status: 400, message: `Product '${item.productNameSnapshot}' not found` };
          }
          if (product.currentStock < item.quantity) {
            throw {
              status: 400,
              message: `Insufficient stock for product '${product.name}' (SKU: ${product.sku}). Available stock: ${product.currentStock}, Requested: ${item.quantity}. Cannot confirm challan.`,
            };
          }

          await tx.product.update({
            where: { id: product.id },
            data: { currentStock: product.currentStock - item.quantity },
          });

          await tx.stockLog.create({
            data: {
              productId: product.id,
              quantityChanged: item.quantity,
              movementType: 'OUT',
              reason: `Stock dispatched via Confirmed Sales Challan #${existingChallan.challanNumber}`,
              createdBy: createdByName,
            },
          });
        }
      }

      // If moving from CONFIRMED to CANCELLED -> Restock items
      if (existingChallan.status === 'CONFIRMED' && newStatus === 'CANCELLED') {
        for (const item of existingChallan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } },
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: 'IN',
              reason: `Stock restored due to Cancellation of Sales Challan #${existingChallan.challanNumber}`,
              createdBy: createdByName,
            },
          });
        }
      }

      return await tx.salesChallan.update({
        where: { id },
        data: { status: newStatus },
        include: { customer: true, items: true },
      });
    });

    res.status(200).json({
      success: true,
      message: `Challan status updated to ${newStatus}`,
      data: updatedChallan,
    });
  } catch (error) {
    next(error);
  }
};
