'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LocationNomination = sequelize.define('LocationNomination', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  locationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Locations',
      key: 'id'
    }
  },
  nominatorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'failed'),
    defaultValue: 'pending',
    allowNull: false
  },
  votesRequired: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
    allowNull: false
  },
  currentVotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  creatorResponse: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'expired'),
    defaultValue: 'pending',
    allowNull: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP + INTERVAL \'7 days\'')
  },
  creditsSpent: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'LocationNominations',
  timestamps: true,
  indexes: [
    {
      fields: ['locationId']
    },
    {
      fields: ['nominatorId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['expiresAt']
    },
    {
      fields: ['locationId', 'status']
    }
  ]
});

// Define associations
LocationNomination.associate = (models) => {
  LocationNomination.belongsTo(models.Location, {
    foreignKey: 'locationId',
    as: 'location'
  });
  
  LocationNomination.belongsTo(models.User, {
    foreignKey: 'nominatorId',
    as: 'nominator'
  });
  
  LocationNomination.hasMany(models.NominationVote, {
    foreignKey: 'nominationId',
    as: 'votes'
  });
};

module.exports = LocationNomination; 