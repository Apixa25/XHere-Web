'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class NominationVote extends Model {
    static associate(models) {
      // Define associations here
      NominationVote.belongsTo(models.LocationNomination, {
        foreignKey: 'nominationId',
        as: 'nomination'
      });
      
      NominationVote.belongsTo(models.User, {
        foreignKey: 'voterId',
        as: 'voter'
      });
    }
  }
  
  NominationVote.init({
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
    sequelize,
    modelName: 'NominationVote',
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
  
  return NominationVote;
}; 