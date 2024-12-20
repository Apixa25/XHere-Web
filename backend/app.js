const express = require('express');
const app = express();
const userRoutes = require('./routes/userRoutes');
const locationRoutes = require('./routes/locationRoutes');

// Add the routes
app.use('/api/user', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/uploads', express.static('uploads'));

// ... rest of your app configuration ... 