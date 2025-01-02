const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Location = sequelize.define('Location', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  location: {
    type: DataTypes.GEOMETRY('POINT'),
    allowNull: false
  },
  content: {
    type: DataTypes.JSONB,
    defaultValue: {
      text: '',
      mediaUrls: [],
      mediaTypes: [],
      isAnonymous: false
    }
  },
  creatorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  upvotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  downvotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  verificationStatus: {
    type: DataTypes.ENUM('unverified', 'pending', 'verified'),
    defaultValue: 'unverified'
  },
  voters: {
    type: DataTypes.JSONB,
    defaultValue: [] // Will store user IDs who have voted
  },
  totalPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  pointsHistory: {
    type: DataTypes.JSONB,
    defaultValue: [],  // Will store point transactions
    allowNull: false
  }
});

module.exports = Location; 