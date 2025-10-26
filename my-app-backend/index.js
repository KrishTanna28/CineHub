import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import session from 'express-session';
import connectDB from './config/database.js';
import './config/cloudinary.js'; // Initialize Cloudinary
import passport from './config/passport.js';
import cache from './utils/cache.js';
import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import authRoutes from './routes/authRoutes.js';
import movieRoutes from './routes/movie.routes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config({ path: '../.env' });

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Connect to Redis cache (non-blocking, runs in background)
cache.connect().then(() => {
  if (cache.isConnected) {
    console.log('✅ Redis cache enabled');
  }
}).catch(err => {
  // Error already logged in cache.connect()
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (for OAuth)
app.use(session({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Request logging middleware (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'MovieHub Express Backend is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/users', userRoutes);
app.use('/upload', uploadRoutes);
app.use('/auth', authRoutes);
app.use('/movies', movieRoutes);
app.use('/reviews', reviewRoutes);

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Express Backend running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
