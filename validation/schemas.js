const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

const loginSchema = z.object({
  email: z.email().trim(),
  password: z.string().min(8),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

const registerSchema = z.object({
  email: z.email().trim(),
  password: z.string().min(8),
});

const orderCreateSchema = z.object({
  items: z
    .array(
      z.object({
        product: objectId,
        quantity: z.coerce.number().int().positive(),
      })
    )
    .min(1),
  customerName: z.string().trim().min(1),
  customerEmail: z.email().trim(),
  shippingAddress: z.string().trim().min(5),
});

const orderStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'cancelled']),
});

module.exports = {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  orderCreateSchema,
  orderStatusSchema,
};
