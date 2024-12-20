// server.js
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cors = require('cors');

// Add this at the top of server.js
mongoose.set('strictQuery', false);

const app = express();
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));

// Add test route here
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Update MongoDB connection with better error handling and options
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/your_database_name', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB successfully');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Separate server startup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// MongoDB Models
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profile: {
    name: String,
    preferences: Object
  },
  createdAt: { type: Date, default: Date.now }
});

const locationDataSchema = new mongoose.Schema({
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  },
  content: {
    text: String,
    mediaUrls: [String],
    mediaTypes: [String] // ['image', 'video']
  },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

locationDataSchema.index({ location: '2dsphere' }); // Enable geospatial queries

const User = mongoose.model('User', userSchema);
const LocationData = mongoose.model('LocationData', locationDataSchema);

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// File Upload Configuration
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Auth Routes
app.post('/api/register', async (req, res) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create new user
    const user = new User({
      email: req.body.email,
      password: hashedPassword,
      profile: {
        name: req.body.name
      }
    });

    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ 
      token,
      user: {
        email: user.email,
        name: user.profile?.name,
        _id: user._id
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Location Data Routes
app.post('/api/locations', authenticateToken, upload.array('media'), async (req, res) => {
  try {
    const mediaUrls = req.files ? req.files.map(file => file.path) : [];
    const mediaTypes = req.files ? req.files.map(file => file.mimetype.startsWith('image/') ? 'image' : 'video') : [];

    const locationData = new LocationData({
      location: {
        type: 'Point',
        coordinates: [req.body.longitude, req.body.latitude]
      },
      content: {
        text: req.body.text,
        mediaUrls,
        mediaTypes
      },
      creator: req.user.userId
    });
    await locationData.save();
    res.status(201).json(locationData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/locations/nearby', authenticateToken, async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 1000 } = req.query; // maxDistance in meters
    
    const nearbyLocations = await LocationData.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).populate('creator', 'profile.name');
    
    res.json(nearbyLocations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/locations', authenticateToken, async (req, res) => {
  try {
    const locations = await LocationData.find()
      .populate('creator', 'profile.name email');
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/locations/:id', authenticateToken, async (req, res) => {
  try {
    const location = await LocationData.findById(req.params.id);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Check if the user owns this location
    if (location.creator.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this location' });
    }

    // Delete associated media files
    location.content.mediaUrls.forEach(url => {
      try {
        require('fs').unlinkSync(url);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    });

    await LocationData.findByIdAndDelete(req.params.id);
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const locationRoutes = require('./routes/locationRoutes');

// Route registrations
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);        // Changed from users to user
app.use('/api/location', locationRoutes); // Changed from locations to location
