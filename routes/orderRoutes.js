const express = require('express');
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
} = require('../controllers/orderController');
const { authenticateAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { checkoutLimiter } = require('../middleware/rateLimit');
const { orderCreateSchema, orderStatusSchema } = require('../validation/schemas');

const router = express.Router();

router.get('/', authenticateAdmin, getOrders);
router.get('/:id', authenticateAdmin, getOrderById);
router.post('/', checkoutLimiter, validate(orderCreateSchema), createOrder);
router.patch('/:id/status', authenticateAdmin, validate(orderStatusSchema), updateOrderStatus);

module.exports = router;





