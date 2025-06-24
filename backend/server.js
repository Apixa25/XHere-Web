// server.js
const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const sequelize = require('./config/database');
const initializeDatabase = require('./config/init-db');
const { authenticateToken } = require('./middleware/auth');
const fs = require('fs');
const { scheduleCleanup } = require('./scripts/cleanupExpiredLocations');

// Debug database configuration
console.log('=== DATABASE DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('Config:', JSON.stringify(config, null, 2));
console.log('Sequelize config:', sequelize.config);
console.log('=== END DEBUG ===');

// Import models
const User = require('./models/User');
const Location = require('./models/Location');

const app = express();

// CORS middleware - Enhanced for mobile compatibility
const allowedOrigins = [
  'http://localhost:3000', 
  'http://localhost:3001', 
  'http://10.0.2.2:3000', 
  'https://xhere-api.herokuapp.com',
  'https://xhere.world',
  'https://www.xhere.world',
  'https://api.xhere.world',
  'https://xhere-web-front-end.onrender.com',
  'https://xhere-api.onrender.com',
  'https://xhere-web.onrender.com',
  // Add mobile-specific origins
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'https://localhost'
];

// Enhanced CORS configuration for mobile
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) {
      console.log('🌐 CORS: Allowing request with no origin (mobile app)');
      return callback(null, true);
    }
    
    console.log('🌐 CORS request from origin:', origin);
    console.log('🌐 Allowed origins:', allowedOrigins);
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS: Origin allowed');
      callback(null, true);
    } else {
      // For mobile browsers, be more permissive
      if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.')) {
        console.log('✅ CORS: Allowing local/mobile origin:', origin);
        callback(null, true);
      } else {
        console.log('❌ CORS: Origin blocked:', origin);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'User-Agent',
    'Cache-Control',
    'Pragma'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Add explicit OPTIONS handling for preflight requests
app.options('*', cors());

// Simple root endpoint for testing
app.get('/', (req, res) => {
  console.log('🏠 Root endpoint hit from:', req.get('Origin') || 'unknown');
  res.json({
    message: 'XHere API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: {
      allowedOrigins: allowedOrigins,
      requestOrigin: req.get('Origin')
    }
  });
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make sure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint for production monitoring
app.get('/api/health', async (req, res) => {
  try {
    console.log('🏥 Health check requested from:', req.get('Origin') || 'unknown origin');
    
    // Test database connection
    await sequelize.authenticate();
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      cors: {
        allowedOrigins: allowedOrigins,
        requestOrigin: req.get('Origin'),
        isAllowed: allowedOrigins.includes(req.get('Origin') || '')
      }
    };
    
    console.log('✅ Health check response:', healthData);
    res.json(healthData);
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Temporary debug endpoint to check image paths
app.get('/api/debug/images', async (req, res) => {
  try {
    console.log('🔍 Debug images endpoint requested');
    
    const Location = require('./models/Location');
    const User = require('./models/User');
    const fs = require('fs');
    const path = require('path');
    
    await sequelize.authenticate();
    
    const debugData = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uploadsDirectory: {
        exists: fs.existsSync(path.join(__dirname, 'uploads')),
        path: path.join(__dirname, 'uploads')
      }
    };
    
    // Check locations with media
    const locations = await Location.findAll();
    const locationsWithMedia = locations.filter(loc => 
      loc.content?.mediaUrls && loc.content.mediaUrls.length > 0
    );
    
    debugData.locations = {
      total: locations.length,
      withMedia: locationsWithMedia.length,
      mediaDetails: locationsWithMedia.map(loc => ({
        id: loc.id,
        text: loc.content?.text?.substring(0, 50) + '...',
        mediaUrls: loc.content?.mediaUrls || [],
        mediaTypes: loc.content?.mediaTypes || [],
        filesExist: (loc.content?.mediaUrls || []).map(url => {
          const filePath = path.join(__dirname, url);
          return {
            url: url,
            exists: fs.existsSync(filePath),
            size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0
          };
        })
      }))
    };
    
    // Check users with profile pictures
    const users = await User.findAll();
    const usersWithPictures = users.filter(user => user.profile?.pictureUrl);
    
    debugData.users = {
      total: users.length,
      withPictures: usersWithPictures.length,
      pictureDetails: usersWithPictures.map(user => {
        const pictureUrl = user.profile?.pictureUrl;
        const filePath = path.join(__dirname, pictureUrl);
        return {
          email: user.email,
          pictureUrl: pictureUrl,
          exists: fs.existsSync(filePath),
          size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0
        };
      })
    };
    
    // List uploads directory contents
    const uploadsDir = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const listFiles = (dir, prefix = '') => {
        const items = fs.readdirSync(dir);
        const files = [];
        items.forEach(item => {
          const itemPath = path.join(dir, item);
          const stats = fs.statSync(itemPath);
          files.push({
            name: item,
            path: itemPath.replace(__dirname, ''),
            isDirectory: stats.isDirectory(),
            size: stats.size,
            modified: stats.mtime
          });
        });
        return files;
      };
      
      debugData.uploadsDirectory.contents = listFiles(uploadsDir);
    }
    
    console.log('✅ Debug images response generated');
    res.json(debugData);
    
  } catch (error) {
    console.error('❌ Debug images error:', error);
    res.status(500).json({
      error: 'Debug failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  const origin = req.get('Origin');
  console.log('🧪 CORS test requested from:', origin);
  
  res.json({
    message: 'CORS test successful',
    timestamp: new Date().toISOString(),
    requestOrigin: origin,
    allowedOrigins: allowedOrigins,
    isAllowed: allowedOrigins.includes(origin || ''),
    headers: {
      'Access-Control-Allow-Origin': res.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': res.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': res.get('Access-Control-Allow-Headers')
    }
  });
});

// Initialize database
initializeDatabase()
  .then(() => {
    console.log('Database initialized successfully');
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

// Add this before your routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Rest of the middleware and route configurations remain the same
// Reference existing configurations from:

// Update the media deletion endpoint for PostgreSQL
app.delete('/api/locations/:locationId/media/:mediaIndex', authenticateToken, async (req, res) => {
  try {
    const { locationId, mediaIndex } = req.params;
    
    const location = await Location.findByPk(locationId);
    
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    if (location.creatorId !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this media' });
    }

    const index = parseInt(mediaIndex, 10);
    const content = location.content;
    
    if (index < 0 || index >= content.mediaUrls.length) {
      return res.status(400).json({ message: 'Invalid media index' });
    }

    content.mediaUrls.splice(index, 1);
    content.mediaTypes.splice(index, 1);
    location.content = content;
    
    await location.save();

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ message: 'Error deleting media', error: error.message });
  }
});

const authRoutes = require('./routes/authRoutes');
const locationRoutes = require('./routes/locationRoutes');
const userRoutes = require('./routes/userRoutes');
const voteRoutes = require('./routes/voteRoutes');
const adminRoutes = require('./routes/adminRoutes');
const commentRoutes = require('./routes/commentRoutes');

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/comments', commentRoutes);

// Add this debug log
console.log('Available routes:', app._router.stack
  .filter(r => r.route)
  .map(r => ({
    path: r.route.path,
    methods: Object.keys(r.route.methods)
  }))
);

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  console.error('❌ Request details:', {
    method: req.method,
    url: req.url,
    origin: req.get('Origin'),
    userAgent: req.get('User-Agent'),
    headers: req.headers
  });
  
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Cross-origin request not allowed',
      details: err.message,
      allowedOrigins: allowedOrigins,
      requestOrigin: req.get('Origin')
    });
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

try {
  scheduleCleanup();
  console.log('Cleanup scheduler initialized');
} catch (error) {
  console.error('Failed to initialize cleanup scheduler:', error);
}
