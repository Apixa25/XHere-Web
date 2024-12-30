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
});

module.exports = Location; 