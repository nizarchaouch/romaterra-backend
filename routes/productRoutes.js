const express = require('express');
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductStock,
} = require('../controllers/productController');
const { uploadMultiple } = require('../utils/cloudinary');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authenticateAdmin, uploadMultiple, createProduct);
router.put('/:id', authenticateAdmin, uploadMultiple, updateProduct);
router.delete('/:id', authenticateAdmin, deleteProduct);

// Stock-specific route
router.patch('/:id/stock', authenticateAdmin, updateProductStock);

module.exports = router;


