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
};

module.exports = Location; 