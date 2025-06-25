const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  recipientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'New Message'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Optional reference to a location if the message is about a specific location
  locationId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Locations',
      key: 'id'
    }
  }
}, {
  timestamps: true
});

// Define associations
Message.associate = (models) => {
  Message.belongsTo(models.User, {
    foreignKey: 'senderId',
    as: 'sender'
  });
  Message.belongsTo(models.User, {
    foreignKey: 'recipientId',
    as: 'recipient'
  });
  Message.belongsTo(models.Location, {
    foreignKey: 'locationId',
    as: 'location'
  });
};

module.exports = Message; 