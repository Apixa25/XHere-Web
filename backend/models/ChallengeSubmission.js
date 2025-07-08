const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChallengeSubmission = sequelize.define('ChallengeSubmission', {
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
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'User who submitted the location'
  },
  locationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'location_id',
    references: {
      model: 'Locations',
      key: 'id'
    },
    comment: 'Location submitted for the challenge'
  },
  submissionText: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'submission_text',
    comment: 'User\'s explanation of why this location fits the challenge'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'winner', 'runner_up'),
    defaultValue: 'pending',
    comment: 'Submission status'
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'admin_notes',
    comment: 'Admin notes about the submission'
  },
  voteCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'vote_count',
    comment: 'Total number of votes received'
  },
  upvotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of upvotes'
  },
  downvotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of downvotes'
  },
  score: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Calculated score based on votes and criteria match'
  },
  rank: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Final ranking in the challenge'
  },
  rewardAmount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'reward_amount',
    comment: 'Credits awarded for this submission'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional submission metadata'
  }
}, {
  timestamps: true,
  tableName: 'challenge_submissions',
  underscored: true,
  indexes: [
    {
      fields: ['challenge_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['location_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['score']
    },
    {
      fields: ['rank']
    },
    {
      unique: true,
      fields: ['challenge_id', 'user_id', 'location_id'],
      name: 'unique_submission_per_user_location'
    }
  ]
});

// Define associations
ChallengeSubmission.associate = (models) => {
  ChallengeSubmission.belongsTo(models.Challenge, {
    foreignKey: 'challengeId',
    as: 'challenge'
  });
  
  ChallengeSubmission.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  ChallengeSubmission.belongsTo(models.Location, {
    foreignKey: 'locationId',
    as: 'location'
  });
  
  ChallengeSubmission.hasMany(models.ChallengeVote, {
    foreignKey: 'submissionId',
    as: 'votes'
  });
};

module.exports = ChallengeSubmission; 