const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Challenge = sequelize.define('Challenge', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Challenge title (e.g., "Find Hidden Gems")'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Detailed challenge description and instructions'
  },
  type: {
    type: DataTypes.ENUM('weekly', 'monthly', 'special'),
    defaultValue: 'weekly',
    comment: 'Challenge frequency type'
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'voting', 'completed', 'cancelled'),
    defaultValue: 'draft',
    comment: 'Current challenge status'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'start_date',
    comment: 'Challenge start date'
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'end_date',
    comment: 'Challenge end date'
  },
  votingEndDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'voting_end_date',
    comment: 'Voting period end date'
  },
  criteria: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: 'Challenge criteria (location types, keywords, etc.)'
  },
  rewards: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: 'Reward structure for winners'
  },
  maxSubmissions: {
    type: DataTypes.INTEGER,
    defaultValue: 1000,
    field: 'max_submissions',
    comment: 'Maximum number of submissions allowed'
  },
  minVotesRequired: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    field: 'min_votes_required',
    comment: 'Minimum votes required for a submission to be considered'
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'created_by',
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'Admin who created the challenge'
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this challenge is featured on the homepage'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional challenge metadata'
  }
}, {
  timestamps: true,
  tableName: 'challenges',
  underscored: true,
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['start_date']
    },
    {
      fields: ['end_date']
    },
    {
      fields: ['type']
    },
    {
      fields: ['featured']
    }
  ]
});

module.exports = Challenge; 