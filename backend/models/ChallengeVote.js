const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChallengeVote = sequelize.define('ChallengeVote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  submissionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'submission_id',
    references: {
      model: 'challenge_submissions',
      key: 'id'
    },
    comment: 'Reference to the challenge submission'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'User who cast the vote'
  },
  voteType: {
    type: DataTypes.ENUM('upvote', 'downvote'),
    allowNull: false,
    field: 'vote_type',
    comment: 'Type of vote cast'
  },
  voteWeight: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'vote_weight',
    comment: 'Weight of the vote (can be adjusted based on user reputation)'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Optional reason for the vote'
  },
  isValid: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_valid',
    comment: 'Whether this vote is valid (not flagged for abuse)'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional vote metadata'
  }
}, {
  timestamps: true,
  tableName: 'challenge_votes',
  underscored: true,
  indexes: [
    {
      fields: ['submission_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['vote_type']
    },
    {
      fields: ['is_valid']
    },
    {
      unique: true,
      fields: ['submission_id', 'user_id'],
      name: 'unique_vote_per_user_submission'
    }
  ]
});

// Define associations (commented out for testing)
// ChallengeVote.associate = (models) => {
//   ChallengeVote.belongsTo(models.ChallengeSubmission, {
//     foreignKey: 'submissionId',
//     as: 'submission'
//   });
//   
//   ChallengeVote.belongsTo(models.User, {
//     foreignKey: 'userId',
//     as: 'user'
//   });
// };

module.exports = ChallengeVote; 