'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LocationNomination extends Model {
    static associate(models) {
      // Define associations here
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
    }
  }
  
  LocationNomination.init({
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
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'expired'),
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
      type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
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
    sequelize,
    modelName: 'LocationNomination',
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
  
  return LocationNomination;
}; 