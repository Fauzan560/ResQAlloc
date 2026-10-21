require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const hospitalRoutes = require('./routes/hospitals');
const emergencyRoutes = require('./routes/emergency');
const resourceRoutes = require('./routes/resources');
const referralRoutes = require('./routes/referrals');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ResQAlloc API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    disclaimer: 'This is an academic demonstration application. Not for real-world clinical use.'
  });
});

// Route info
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'ResQAlloc API v1.0',
    endpoints: {
      auth: '/api/auth (POST /login, POST /register, GET /me)',
      hospitals: '/api/hospitals (GET /, GET /:id, POST /, PUT /:id, DELETE /:id)',
      emergency: '/api/emergency (POST /, GET /, GET /:id, PUT /:id/status, POST /:id/select-hospital)',
      resources: '/api/resources (GET /:hospitalId, PUT /:hospitalId, GET /)',
      referrals: '/api/referrals (GET /, GET /:id, PUT /:id/respond)',
      admin: '/api/admin (GET /dashboard, GET /users, PUT /users/:id, GET /audit-logs)',
      health: '/api/health'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║           ResQAlloc API Server               ║
║──────────────────────────────────────────────║
║  Port:        ${PORT}                            ║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(28)}║
║  MongoDB:     ${(process.env.MONGODB_URI || 'localhost').substring(0, 28).padEnd(28)}║
║  ML Service:  ${(process.env.ML_SERVICE_URL || 'http://localhost:5001').substring(0, 28).padEnd(28)}║
╚══════════════════════════════════════════════╝
  `);
});

module.exports = app;
