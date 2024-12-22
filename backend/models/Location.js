const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],  // [longitude, latitude]
      required: true
    }
  },
  content: {
    text: String,
    mediaUrls: [String],
    mediaTypes: [String],
    isAnonymous: { type: Boolean, default: false }
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true  // Adds createdAt and updatedAt fields
});

// Create a 2dsphere index for geospatial queries
locationSchema.index({ location: '2dsphere' });

const Location = mongoose.model('Location', locationSchema);

module.exports = Location; 