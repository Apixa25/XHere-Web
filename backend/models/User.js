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
  name: {
    type: String
  },
  profileImage: {
    type: String
  },
  // ... any other fields you want to add
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema); 