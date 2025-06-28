const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Location = require('./Location');
const User = require('./User');

const LocationOwnershipHistory = sequelize.define('LocationOwnershipHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  locationId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  buyerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  pricePaid: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  purchasedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false
});

LocationOwnershipHistory.associate = (models) => {
  LocationOwnershipHistory.belongsTo(models.Location, { foreignKey: 'locationId', as: 'location' });
  LocationOwnershipHistory.belongsTo(models.User, { foreignKey: 'buyerId', as: 'buyer' });
};

module.exports = LocationOwnershipHistory; 