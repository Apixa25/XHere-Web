const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CreditTransaction = sequelize.define('CreditTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  transactionType: {
    type: DataTypes.ENUM('purchase', 'spend', 'refund', 'bonus', 'transfer'),
    allowNull: false
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Amount in credits (positive for gain, negative for loss)'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  stripePaymentIntentId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Stripe payment intent ID for purchases'
  },
  stripeAmount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Amount in cents paid to Stripe'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
    defaultValue: 'completed'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional transaction metadata'
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['transactionType']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['stripePaymentIntentId']
    }
  ]
});

module.exports = CreditTransaction; 