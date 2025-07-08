const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LocationReport = sequelize.define('LocationReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  locationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Locations',
      key: 'id'
    }
  },
  reporterId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  reportType: {
    type: DataTypes.ENUM('spam', 'inappropriate', 'duplicate', 'fake', 'offensive', 'other'),
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  evidence: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false,
    comment: 'Array of evidence objects with type, content, and metadata'
  },
  status: {
    type: DataTypes.ENUM('pending', 'under_review', 'resolved', 'dismissed'),
    defaultValue: 'pending',
    allowNull: false
  },
  moderatorId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  moderatorNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resolution: {
    type: DataTypes.ENUM('location_removed', 'location_flagged', 'warning_issued', 'no_action', 'user_suspended'),
    allowNull: true
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium',
    allowNull: false
  },
  reportCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false,
    comment: 'Number of times this location has been reported'
  },
  isAnonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Contact email for anonymous reports'
  }
}, {
  tableName: 'LocationReports',
  timestamps: true,
  indexes: [
    { fields: ['locationId'] },
    { fields: ['reporterId'] },
    { fields: ['status'] },
    { fields: ['reportType'] },
    { fields: ['priority'] },
    { fields: ['createdAt'] }
  ]
});

// Define associations
LocationReport.associate = (models) => {
  LocationReport.belongsTo(models.Location, {
    foreignKey: 'locationId',
    as: 'location'
  });
  LocationReport.belongsTo(models.User, {
    foreignKey: 'reporterId',
    as: 'reporter'
  });
  LocationReport.belongsTo(models.User, {
    foreignKey: 'moderatorId',
    as: 'moderator'
  });
};

module.exports = LocationReport; 