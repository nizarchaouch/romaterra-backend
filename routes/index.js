const express = require('express');
const productRoutes = require('./productRoutes');
const categoryRoutes = require('./categoryRoutes');
const collectionRoutes = require('./collectionRoutes');
const orderRoutes = require('./orderRoutes');
const authRoutes = require('./authRoutes');

const router = express.Router();

// Root route
router.get('/', (req, res) => {
    res.send('Romaterra backend is running');
});

// Domain routes
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/collections', collectionRoutes);
router.use('/orders', orderRoutes);
router.use('/auth', authRoutes);

module.exports = router;