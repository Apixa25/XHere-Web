const express = require('express');
const app = express();
const userRoutes = require('./routes/userRoutes');

// Add the routes
app.use('/api/user', userRoutes);
app.use('/uploads', express.static('uploads'));

// ... rest of your app configuration ... 