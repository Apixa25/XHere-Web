const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LocationComment = sequelize.define('LocationComment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  locationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Locations',
      key: 'id'
    }
  },
  authorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  parentCommentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'LocationComments',
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
  totalPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
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
  isAnonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  mediaUrls: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false
  },
  mediaTypes: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false
  },
  verificationStatus: {
    type: DataTypes.ENUM('unverified', 'pending', 'verified'),
    defaultValue: 'unverified'
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  pointsHistory: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false
  }
});

// Define associations
LocationComment.associate = (models) => {
  LocationComment.belongsTo(models.Location, {
    foreignKey: 'locationId',
    as: 'location'
  });
  LocationComment.belongsTo(models.User, {
    foreignKey: 'authorId',
    as: 'author'
  });
  LocationComment.belongsTo(models.LocationComment, {
    foreignKey: 'parentCommentId',
    as: 'parentComment'
  });
  LocationComment.hasMany(models.LocationComment, {
    foreignKey: 'parentCommentId',
    as: 'replies'
  });
};

module.exports = LocationComment; 