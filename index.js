require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const logger = require('./utils/logger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Routes
const routes = require('./routes');

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(pinoHttp({ logger }));
app.use(express.json());
// Note: Multer handles multipart/form-data parsing, so urlencoded is not needed for file uploads

// MongoDB connection
const { MONGODB_URI, PORT, JWT_SECRET, JWT_REFRESH_SECRET } = process.env;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set in environment variables (.env)');
    process.exit(1);
}
if (!JWT_SECRET) {
    console.error('JWT_SECRET is not set in environment variables (.env)');
    process.exit(1);
}
if (!JWT_REFRESH_SECRET) {
    console.error('JWT_REFRESH_SECRET is not set in environment variables (.env)');
    process.exit(1);
}

mongoose
    .connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// Register routes
app.use('/', routes);
app.use(notFoundHandler);
app.use(errorHandler);

const port = PORT || 3000;

app.listen(port, () => {
    console.log(`🚀 Server listening on port ${port}`);
});


