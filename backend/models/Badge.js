const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Badge = sequelize.define('Badge', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  criteria: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: 'Badge earning criteria'
  },
  iconUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'icon_url'
  }
}, {
  timestamps: true,
  tableName: 'badges',
  underscored: true
});

// Define associations
Badge.associate = (models) => {
  Badge.hasMany(models.UserBadge, {
    foreignKey: 'badgeId',
    as: 'userBadges'
  });
  Badge.belongsToMany(models.User, {
    through: models.UserBadge,
    foreignKey: 'badgeId',
    otherKey: 'userId',
    as: 'users'
  });
};

module.exports = Badge; 