import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
  getProductLogs,
} from '../controllers/product.controller';
import { authenticateToken, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getProducts);
router.get('/:id', getProductById);
router.get('/:id/logs', getProductLogs);
router.post('/', requireRoles(['ADMIN', 'WAREHOUSE']), createProduct);
router.put('/:id', requireRoles(['ADMIN', 'WAREHOUSE']), updateProduct);
router.post('/:id/stock', requireRoles(['ADMIN', 'WAREHOUSE']), adjustStock);

export default router;
