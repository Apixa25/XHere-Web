const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Location = require('./Location');
const User = require('./User');

const LocationOwnership = sequelize.define('LocationOwnership', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  locationId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  currentPrice: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100
  },
  purchaseCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  isOfficial: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  timestamps: true
});

LocationOwnership.associate = (models) => {
  LocationOwnership.belongsTo(models.Location, { foreignKey: 'locationId', as: 'location' });
  LocationOwnership.belongsTo(models.User, { foreignKey: 'ownerId', as: 'owner' });
};

module.exports = LocationOwnership; 