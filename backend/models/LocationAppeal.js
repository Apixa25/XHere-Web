const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LocationAppeal = sequelize.define('LocationAppeal', {
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
  appellantId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  originalReportId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'LocationReports',
      key: 'id'
    }
  },
  appealReason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  evidence: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false,
    comment: 'Array of evidence objects supporting the appeal'
  },
  status: {
    type: DataTypes.ENUM('pending', 'under_review', 'approved', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  },
  reviewerId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  reviewerNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  decision: {
    type: DataTypes.ENUM('location_restored', 'location_remains_removed', 'partial_restoration', 'compensation_granted'),
    allowNull: true
  },
  compensationAmount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Credits awarded as compensation if appeal is successful'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium',
    allowNull: false
  },
  appealCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false,
    comment: 'Number of appeals for this location'
  },
  isUrgent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Whether this appeal requires urgent attention'
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Contact email for appeal updates'
  }
}, {
  tableName: 'LocationAppeals',
  timestamps: true,
  indexes: [
    { fields: ['locationId'] },
    { fields: ['appellantId'] },
    { fields: ['status'] },
    { fields: ['priority'] },
    { fields: ['createdAt'] },
    { fields: ['isUrgent'] }
  ]
});

// Define associations
LocationAppeal.associate = (models) => {
  LocationAppeal.belongsTo(models.Location, {
    foreignKey: 'locationId',
    as: 'location'
  });
  LocationAppeal.belongsTo(models.User, {
    foreignKey: 'appellantId',
    as: 'appellant'
  });
  LocationAppeal.belongsTo(models.User, {
    foreignKey: 'reviewerId',
    as: 'reviewer'
  });
  LocationAppeal.belongsTo(models.LocationReport, {
    foreignKey: 'originalReportId',
    as: 'originalReport'
  });
};

module.exports = LocationAppeal; 