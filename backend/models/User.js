const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  profile: {
    name: String,
    profileImage: String
  }
}, {
  timestamps: true  // Adds createdAt and updatedAt fields
});

// Only create the model if it hasn't been created yet
module.exports = mongoose.models.User || mongoose.model('User', userSchema); 