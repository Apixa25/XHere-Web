const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChallengeReward = sequelize.define('ChallengeReward', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  challengeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'challenge_id',
    references: {
      model: 'challenges',
      key: 'id'
    },
    comment: 'Reference to the challenge'
  },
  submissionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'submission_id',
    references: {
      model: 'challenge_submissions',
      key: 'id'
    },
    comment: 'Reference to the winning submission (if applicable)'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'User receiving the reward'
  },
  rewardType: {
    type: DataTypes.ENUM('winner', 'runner_up', 'participation', 'voting', 'admin_bonus'),
    allowNull: false,
    field: 'reward_type',
    comment: 'Type of reward being given'
  },
  creditAmount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'credit_amount',
    comment: 'Number of credits awarded'
  },
  badgeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'badge_id',
    references: {
      model: 'badges',
      key: 'id'
    },
    comment: 'Badge awarded (if applicable)'
  },
  rank: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Final ranking in the challenge'
  },
  status: {
    type: DataTypes.ENUM('pending', 'awarded', 'failed', 'cancelled'),
    defaultValue: 'pending',
    comment: 'Status of the reward distribution'
  },
  awardedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'awarded_at',
    comment: 'When the reward was actually awarded'
  },
  transactionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'transaction_id',
    // Temporarily removed reference until credit_transactions table exists
    // references: {
    //   model: 'credit_transactions',
    //   key: 'id'
    // },
    comment: 'Reference to the credit transaction'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional reward metadata'
  }
}, {
  timestamps: true,
  tableName: 'challenge_rewards',
  underscored: true,
  indexes: [
    {
      fields: ['challenge_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['reward_type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['rank']
    }
  ]
});

// Define associations (commented out for testing)
// ChallengeReward.associate = (models) => {
//   ChallengeReward.belongsTo(models.Challenge, {
//     foreignKey: 'challengeId',
//     as: 'challenge'
//   });
//   
//   ChallengeReward.belongsTo(models.ChallengeSubmission, {
//     foreignKey: 'submissionId',
//     as: 'submission'
//   });
//   
//   ChallengeReward.belongsTo(models.User, {
//     foreignKey: 'userId',
//     as: 'user'
//   });
//   
//   ChallengeReward.belongsTo(models.Badge, {
//     foreignKey: 'badgeId',
//     as: 'badge'
//   });
//   
//   ChallengeReward.belongsTo(models.CreditTransaction, {
//     foreignKey: 'transactionId',
//     as: 'transaction'
//   });
// };

module.exports = ChallengeReward; 