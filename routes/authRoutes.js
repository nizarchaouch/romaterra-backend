const express = require('express');
const {
    registerAdmin,
    loginAdmin,
    refreshToken,
    logoutAdmin,
} = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');
const { registerSchema, loginSchema, refreshTokenSchema } = require('../validation/schemas');

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), registerAdmin);
router.post('/login', authLimiter, validate(loginSchema), loginAdmin);
router.post('/refresh', authLimiter, validate(refreshTokenSchema), refreshToken);
router.post('/logout', logoutAdmin);

module.exports = router;