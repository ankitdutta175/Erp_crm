import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(2, 'SKU is required'),
  category: z.string().min(2, 'Category is required'),
  unitPrice: z.number().positive('Unit price must be greater than 0'),
  currentStock: z.number().int().min(0, 'Stock cannot be negative').default(0),
  minStockAlert: z.number().int().min(0).default(10),
  location: z.string().min(2, 'Warehouse location is required'),
  imageUrl: z.string().optional().nullable(),
});

const stockAdjustSchema = z.object({
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  movementType: z.enum(['IN', 'OUT']),
  reason: z.string().min(2, 'Reason for stock change is required'),
});

export const getProducts = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const category = req.query.category as string;
    const lowStock = req.query.lowStock === 'true';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { category: { contains: search } },
        { location: { contains: search } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const [allProducts, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    let products = allProducts;
    if (lowStock) {
      products = products.filter((p) => p.currentStock <= p.minStockAlert);
    }

    res.status(200).json({
      success: true,
      data: products,
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

export const getProductById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = productSchema.parse(req.body);

    const existingSku = await prisma.product.findUnique({ where: { sku: parsed.sku } });
    if (existingSku) {
      res.status(400).json({ success: false, message: `SKU '${parsed.sku}' already exists` });
      return;
    }

    const product = await prisma.product.create({
      data: parsed,
    });

    // Log initial stock if stock > 0
    if (parsed.currentStock > 0) {
      await prisma.stockLog.create({
        data: {
          productId: product.id,
          quantityChanged: parsed.currentStock,
          movementType: 'IN',
          reason: 'Initial stock registration',
          createdBy: req.user?.name || 'System User',
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const parsed = productSchema.parse(req.body);

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    // Check SKU duplicate if changed
    if (parsed.sku !== existing.sku) {
      const skuCheck = await prisma.product.findUnique({ where: { sku: parsed.sku } });
      if (skuCheck) {
        res.status(400).json({ success: false, message: `SKU '${parsed.sku}' is already in use by another product` });
        return;
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: parsed.name,
        sku: parsed.sku,
        category: parsed.category,
        unitPrice: parsed.unitPrice,
        minStockAlert: parsed.minStockAlert,
        location: parsed.location,
        imageUrl: parsed.imageUrl,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const adjustStock = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantity, movementType, reason } = stockAdjustSchema.parse(req.body);

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    if (movementType === 'OUT' && product.currentStock < quantity) {
      res.status(400).json({
        success: false,
        message: `Insufficient stock for product '${product.name}'. Available: ${product.currentStock}, Requested: ${quantity}`,
      });
      return;
    }

    const newStock =
      movementType === 'IN'
        ? product.currentStock + quantity
        : product.currentStock - quantity;

    const [updatedProduct, stockLog] = await prisma.$transaction([
      prisma.product.update({
        where: { id },
        data: { currentStock: newStock },
      }),
      prisma.stockLog.create({
        data: {
          productId: id,
          quantityChanged: quantity,
          movementType,
          reason,
          createdBy: req.user?.name || 'System User',
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: `Stock updated successfully. New Stock: ${updatedProduct.currentStock}`,
      data: {
        product: updatedProduct,
        log: stockLog,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductLogs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const logs = await prisma.stockLog.findMany({
      where: { productId: id },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};
