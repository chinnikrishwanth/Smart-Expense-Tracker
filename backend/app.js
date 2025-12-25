const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
require('./db'); // ensures mongoose connects

const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const { getDashboardSummary, getReport } = require('./controllers/budgetController');
const { authenticate } = require('./middlewares/authenticate'); // Your existing authenticate middleware

// Import User model for flexible auth
const User = require('./models/user');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - allows both web frontend and Android app
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com']
    : [
        'http://localhost:5173',      // Vite dev server (React frontend)
        'http://localhost:3000',      // Alternative React port
        'http://localhost:8080',      // Alternative port
        'http://10.0.2.2:5000',       // Android emulator accessing backend
        'http://127.0.0.1:5173',      // Alternative localhost format
        '*'                            // Allow all origins in development (for Android app flexibility)
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'UPI Expense Tracker API'
  });
});

// Routes
app.use('/api/users', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budget', budgetRoutes);

// Flexible auth middleware for your frontend (supports both JWT and email)
const flexibleAuth = async (req, res, next) => {
  try {
    // First try JWT auth
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      const token = header.split(' ')[1];
      const jwt = require('jsonwebtoken');
      const SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
      
      try {
        const decoded = jwt.verify(token, SECRET);
        const user = await User.findById(decoded.id);
        
        if (user) {
          req.user = { id: user._id, _id: user._id, email: user.email };
          return next();
        }
      } catch (jwtErr) {
        // JWT failed, try email-based auth
        console.log('JWT auth failed, trying email-based auth');
      }
    }
    
    // If no JWT or JWT failed, try email from query params (for your existing frontend)
    const { user: userEmail } = req.query;
    if (userEmail) {
      const user = await User.findOne({ email: userEmail });
      
      if (user) {
        req.user = { id: user._id, _id: user._id, email: user.email };
        return next();
      } else {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
    }
    
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Please provide either a valid token or email.'
    });
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Additional routes that frontend expects - using flexible auth
app.get('/api/dashboard-summary', flexibleAuth, getDashboardSummary);
app.get('/api/reports/monthly', flexibleAuth, getReport);

// SMS Processing endpoint - uses JWT auth only
app.post('/api/expenses/process-sms', authenticate, require('./controllers/expenseController').processSMS);

// Add these for backward compatibility with your existing frontend URLs
app.get('/api/budget', flexibleAuth, require('./controllers/budgetController').getBudget);
app.post('/api/budget', flexibleAuth, require('./controllers/budgetController').setBudget);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      message: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('404 - Route not found:', req.originalUrl);
  res.status(404).json({
    success: false,
    error: 'Route not found: ' + req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 API Endpoints:`);
  console.log(`   GET  /api/dashboard-summary?user=email@example.com`);
  console.log(`   GET  /api/reports/monthly?user=email@example.com&month=YYYY-MM`);
  console.log(`   GET  /api/budget?user=email@example.com&month=YYYY-MM (legacy)`);
  console.log(`   GET  /api/budget/budget?user=email@example.com&month=YYYY-MM`);
  console.log(`   POST /api/budget?month=YYYY-MM&amount=50000 (legacy)`);
  console.log(`   POST /api/budget/budget`);
  console.log(`   POST /api/users/register`);
  console.log(`   POST /api/users/login`);
  console.log(`   POST /api/expenses/process-sms (requires JWT token)`);
});

module.exports = app;