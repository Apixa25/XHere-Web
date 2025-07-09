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
  },
  trustLevel: {
    type: DataTypes.ENUM('new', 'trusted', 'verified', 'moderator'),
    defaultValue: 'new',
    allowNull: false
  },
  reputationScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  qualityLocationsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  totalLocationsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  averageLocationRating: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false
  },
  lastReputationUpdate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reputationHistory: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false
  },
  // New fields for downvote tracking
  totalDownvotesReceived: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Total downvotes received across all user locations'
  },
  downvotedLocationsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Number of locations that have received downvotes'
  },
  lastDownvoteDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date of the most recent downvote received'
  },
  downvotePenaltyLevel: {
    type: DataTypes.ENUM('none', 'warning', 'restricted', 'suspended', 'banned'),
    defaultValue: 'none',
    allowNull: false,
    comment: 'Current penalty level based on downvote history'
  },
  penaltyExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the current penalty expires'
  },
  downvoteHistory: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false,
    comment: 'History of downvote events and penalties'
  },
  isModerator: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
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

  // Location associations
  User.hasMany(models.Location, {
    foreignKey: 'creatorId',
    as: 'createdLocations'
  });

  // Report and appeal associations
  User.hasMany(models.LocationReport, {
    foreignKey: 'reporterId',
    as: 'reportsSubmitted'
  });
  User.hasMany(models.LocationReport, {
    foreignKey: 'moderatorId',
    as: 'reportsReviewed'
  });
  User.hasMany(models.LocationAppeal, {
    foreignKey: 'appellantId',
    as: 'appealsSubmitted'
  });
  User.hasMany(models.LocationAppeal, {
    foreignKey: 'reviewerId',
    as: 'appealsReviewed'
  });
};

module.exports = User; 