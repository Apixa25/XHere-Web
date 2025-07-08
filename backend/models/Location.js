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
  keywords: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false,
    get() {
      const keywords = this.getDataValue('keywords');
      return keywords || [];
    }
  },
  locationType: {
    type: DataTypes.ENUM('general', 'yard_sale', 'crime', 'interesting', 'event', 'market', 'food_truck', 'church', 'historical', 'for_sale'),
    defaultValue: 'general',
    allowNull: false
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
  locationStatus: {
    type: DataTypes.ENUM('pending', 'verified', 'flagged', 'removed'),
    defaultValue: 'pending',
    allowNull: false
  },
  statusUpdatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the location status was last updated'
  },
  statusReason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Reason for status change (e.g., "5+ positive ratings", "5+ negative ratings")'
  },
  voters: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false,
    get() {
      const voters = this.getDataValue('voters');
      return voters || [];
    }
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
  },
  autoDelete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  deleteAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  credits: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  // Official Location System Fields
  isOfficial: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  officialBoundary: {
    type: DataTypes.GEOMETRY('POINT'),
    allowNull: true,
    comment: 'Center point of the 150-foot official boundary'
  },
  officialOwnerId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'User who made this location official'
  },
  officializedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the location was made official'
  },
  requiresApproval: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Whether this location requires moderator approval'
  }
});

// Define associations
Location.associate = (models) => {
  Location.hasMany(models.LocationComment, {
    foreignKey: 'locationId',
    as: 'comments'
  });
  Location.belongsTo(models.User, {
    foreignKey: 'creatorId',
    as: 'creator'
  });
  Location.belongsTo(models.User, {
    foreignKey: 'officialOwnerId',
    as: 'officialOwner'
  });
  // Add report and appeal associations
  Location.hasMany(models.LocationReport, {
    foreignKey: 'locationId',
    as: 'reports'
  });
  Location.hasMany(models.LocationAppeal, {
    foreignKey: 'locationId',
    as: 'appeals'
  });
};

module.exports = Location; 