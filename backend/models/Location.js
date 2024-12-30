const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Location = sequelize.define('Location', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  location: {
    type: DataTypes.GEOMETRY('POINT'),
    allowNull: false
  },
  content: {
    type: DataTypes.JSONB,
    defaultValue: {
      text: '',
      mediaUrls: [],
      mediaTypes: [],
      isAnonymous: false
    }
  },
  creatorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  indexes: [
    {
      using: 'GIST',
      fields: ['location']
    }
  ]
});

// Define associations
Location.associate = (models) => {
  Location.belongsTo(models.User, {
    foreignKey: 'creatorId',
    as: 'creator'
  });
};

module.exports = Location; 