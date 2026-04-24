const Order = require('../models/Order');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const { normalizeOrderItems } = require('../utils/orderUtils');
const { sendNewOrderEmail } = require('../services/emailService');
const logger = require('../utils/logger');

exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate('items.product');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.product');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch order' });
    }
};

exports.createOrder = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { items, customerName, customerEmail, shippingAddress } = req.body;
        const normalizedItems = normalizeOrderItems(items);
         // 1) Check stock for each item
        let createdOrder;
        await session.withTransaction(async () => {
            const productIds = normalizedItems.map((item) => item.product);
            const products = await Product.find({ _id: { $in: productIds } })
                .session(session)
                .select('_id name price quantityInStock');
            const productMap = new Map(products.map((product) => [String(product._id), product]));

            const snapshotItems = [];
            let totalAmount = 0;

            for (const item of normalizedItems) {
                const product = productMap.get(String(item.product));
                if (!product) {
                    throw new Error(`Product not found: ${item.product}`);
                }
        // 2) Compute total and decrement stock
                const updated = await Product.findOneAndUpdate(
                    { _id: item.product, quantityInStock: { $gte: item.quantity } },
                    { $inc: { quantityInStock: -item.quantity } },
                    { new: true, session }
                );

                if (!updated) {
                    throw new Error(`Not enough stock for product ${product.name}`);
                }

                snapshotItems.push({
                    product: product._id,
                    quantity: item.quantity,
                    price: product.price,
                });
                totalAmount += product.price * item.quantity;
            }

            createdOrder = await Order.create(
                [
                    {
                        items: snapshotItems,
                        totalAmount,
                        status: 'pending',
                        customerName,
                        customerEmail,
                        shippingAddress,
                    },
                ],
                { session }
            );
        });

        const order = createdOrder[0];
        res.status(201).json(order);

        sendNewOrderEmail(order).catch((emailErr) => {
            logger.error({ err: emailErr, orderId: String(order._id) }, 'Failed to send order email');
        });
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to create order' });
    } finally {
        await session.endSession();
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (err) {
        res.status(400).json({ message: 'Failed to update order' });
    }
};


