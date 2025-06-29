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
    allowNull: true
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
  }
}, {
  timestamps: true
});

// Define associations
User.associate = (models) => {
  // Credit system associations
  User.hasMany(models.CreditTransaction, {
    foreignKey: 'userId',
    as: 'creditTransactions'
  });
  
  User.hasOne(models.UserCreditStats, {
    foreignKey: 'userId',
    as: 'creditStats'
  });

  // Badge system associations
  User.hasMany(models.UserBadge, {
    foreignKey: 'userId',
    as: 'userBadges'
  });
  
  User.belongsToMany(models.Badge, {
    through: models.UserBadge,
    foreignKey: 'userId',
    otherKey: 'badgeId',
    as: 'earnedBadges'
  });
};

module.exports = User; 