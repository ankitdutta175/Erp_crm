import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const getDashboardStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [
      totalCustomers,
      customersByStatus,
      totalProducts,
      allProducts,
      totalChallans,
      confirmedChallans,
      draftChallans,
      recentChallans,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.product.count(),
      prisma.product.findMany(),
      prisma.salesChallan.count(),
      prisma.salesChallan.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { totalAmount: true, totalQuantity: true },
        _count: true,
      }),
      prisma.salesChallan.count({ where: { status: 'DRAFT' } }),
      prisma.salesChallan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, businessName: true } },
        },
      }),
    ]);

    const lowStockProducts = allProducts.filter((p) => p.currentStock <= p.minStockAlert);

    res.status(200).json({
      success: true,
      data: {
        customers: {
          total: totalCustomers,
          byStatus: customersByStatus.reduce((acc, curr) => {
            acc[curr.status] = curr._count.status;
            return acc;
          }, {} as Record<string, number>),
        },
        products: {
          total: totalProducts,
          lowStockCount: lowStockProducts.length,
          lowStockItems: lowStockProducts.map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            currentStock: p.currentStock,
            minStockAlert: p.minStockAlert,
            location: p.location,
          })),
        },
        sales: {
          totalChallans,
          confirmedCount: confirmedChallans._count || 0,
          draftCount: draftChallans,
          totalRevenue: confirmedChallans._sum.totalAmount || 0,
          totalItemsSold: confirmedChallans._sum.totalQuantity || 0,
        },
        recentChallans,
      },
    });
  } catch (error) {
    next(error);
  }
};
