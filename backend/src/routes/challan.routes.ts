import { Router } from 'express';
import {
  getChallans,
  getChallanById,
  createChallan,
  updateChallanStatus,
} from '../controllers/challan.controller';
import { authenticateToken, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getChallans);
router.get('/:id', getChallanById);
router.post('/', requireRoles(['ADMIN', 'SALES']), createChallan);
router.put('/:id/status', requireRoles(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']), updateChallanStatus);

export default router;
