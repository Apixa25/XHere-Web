const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserBadge = sequelize.define('UserBadge', {
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
    },
    field: 'user_id'
  },
  badgeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Badges',
      key: 'id'
    },
    field: 'badge_id'
  },
  awardedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'awarded_at'
  }
}, {
  tableName: 'user_badges',
  timestamps: false,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'badge_id']
    }
  ]
});

// Define associations
UserBadge.associate = (models) => {
  UserBadge.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  UserBadge.belongsTo(models.Badge, {
    foreignKey: 'badgeId',
    as: 'badge'
  });
};

module.exports = UserBadge; 