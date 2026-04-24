const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
};

const sendNewOrderEmail = async (order) => {
  const to = process.env.ADMIN_ORDER_EMAIL;
  const mailer = getTransporter();
  if (!to || !mailer) {
    logger.warn('Skipping admin order email: SMTP or ADMIN_ORDER_EMAIL is not configured');
    return;
  }

  const itemCount = order.items.reduce((acc, item) => acc + item.quantity, 0);

  await mailer.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `New order received: ${order._id}`,
    text: [
      `Order ID: ${order._id}`,
      `Customer: ${order.customerName} (${order.customerEmail})`,
      `Total amount: ${order.totalAmount}`,
      `Items count: ${itemCount}`,
      `Shipping address: ${order.shippingAddress}`,
      `Created at: ${order.createdAt}`,
    ].join('\n'),
  });
};

module.exports = {
  sendNewOrderEmail,
};
