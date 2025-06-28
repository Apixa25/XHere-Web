'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NominationVote = sequelize.define('NominationVote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nominationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'LocationNominations',
      key: 'id'
    }
  },
  voterId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  voteType: {
    type: DataTypes.ENUM('upvote', 'downvote'),
    allowNull: false
  }
}, {
  tableName: 'NominationVotes',
  timestamps: true,
  indexes: [
    {
      fields: ['nominationId']
    },
    {
      fields: ['voterId']
    },
    {
      fields: ['nominationId', 'voterId'],
      unique: true
    },
    {
      fields: ['voteType']
    }
  ]
});

// Define associations
NominationVote.associate = (models) => {
  NominationVote.belongsTo(models.LocationNomination, {
    foreignKey: 'nominationId',
    as: 'nomination'
  });
  
  NominationVote.belongsTo(models.User, {
    foreignKey: 'voterId',
    as: 'voter'
  });
};

module.exports = NominationVote; 