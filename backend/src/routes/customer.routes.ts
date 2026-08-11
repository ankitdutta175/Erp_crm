import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  addFollowUpNote,
} from '../controllers/customer.controller';
import { authenticateToken, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', requireRoles(['ADMIN', 'SALES']), createCustomer);
router.put('/:id', requireRoles(['ADMIN', 'SALES']), updateCustomer);
router.post('/:id/notes', requireRoles(['ADMIN', 'SALES', 'ACCOUNTS']), addFollowUpNote);

export default router;
