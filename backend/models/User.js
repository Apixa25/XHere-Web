const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  profile: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  reputation: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  badges: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  googleId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  credits: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    allowNull: false
  },
  votesGiven: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  earnedBadges: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  }
}, {
  timestamps: true
});

module.exports = User; 