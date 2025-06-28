const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserCreditStats = sequelize.define('UserCreditStats', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  totalCreditsPurchased: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total credits ever purchased'
  },
  totalCreditsSpent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total credits ever spent'
  },
  totalAmountSpent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total amount spent in cents'
  },
  firstPurchaseDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastPurchaseDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    }
  ]
});

module.exports = UserCreditStats; 