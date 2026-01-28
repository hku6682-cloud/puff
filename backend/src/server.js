require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const likeRoutes = require('./routes/likes');
const walletRoutes = require('./routes/wallet');
const notificationRoutes = require('./routes/notifications');
const referralRoutes = require('./routes/referral');

// Middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate Limiting - More lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500 // limit each IP to 500 requests per windowMs (increased for better UX)
});

// More lenient limiter for auth routes (testing/development)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit auth attempts to 100 per 15 minutes
});

// Apply global limiter to all routes except health and auth
app.use((req, res, next) => {
  if (req.path === '/health' || req.path.startsWith('/api/v1/auth')) {
    return next()
  }
  limiter(req, res, next)
})

// Apply auth-specific limiter
app.use('/api/v1/auth', authLimiter)

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Public Routes
app.use('/api/v1/auth', authRoutes);

// Protected Routes
app.use('/api/v1/users', authMiddleware, userRoutes);
app.use('/api/v1/posts', authMiddleware, postRoutes);
app.use('/api/v1/likes', authMiddleware, likeRoutes);
app.use('/api/v1/wallet', authMiddleware, walletRoutes);
app.use('/api/v1/notifications', authMiddleware, notificationRoutes);
app.use('/api/v1/referral', authMiddleware, referralRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Error Handler
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 PUFF Backend running on http://localhost:${PORT}`);
  console.log(`📝 API Documentation: http://localhost:${PORT}/api/v1/docs`);
});

module.exports = app;
