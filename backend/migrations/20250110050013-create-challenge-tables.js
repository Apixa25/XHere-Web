'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if challenges table already exists
    const tableExists = await queryInterface.showAllTables();
    const challengesExists = tableExists.includes('challenges');
    
    if (!challengesExists) {
      // Create challenges table
      await queryInterface.createTable('challenges', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        title: {
          type: Sequelize.STRING(200),
          allowNull: false,
          comment: 'Challenge title (e.g., "Find Hidden Gems")'
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: false,
          comment: 'Detailed challenge description and instructions'
        },
        type: {
          type: Sequelize.ENUM('weekly', 'monthly', 'special'),
          defaultValue: 'weekly',
          comment: 'Challenge frequency type'
        },
        status: {
          type: Sequelize.ENUM('draft', 'active', 'voting', 'completed', 'cancelled'),
          defaultValue: 'draft',
          comment: 'Current challenge status'
        },
        start_date: {
          type: Sequelize.DATE,
          allowNull: false,
          comment: 'Challenge start date'
        },
        end_date: {
          type: Sequelize.DATE,
          allowNull: false,
          comment: 'Challenge end date'
        },
        voting_end_date: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Voting period end date'
        },
        criteria: {
          type: Sequelize.JSONB,
          allowNull: false,
          comment: 'Challenge criteria (location types, keywords, etc.)'
        },
        rewards: {
          type: Sequelize.JSONB,
          allowNull: false,
          comment: 'Reward structure for winners'
        },
        max_submissions: {
          type: Sequelize.INTEGER,
          defaultValue: 1000,
          comment: 'Maximum number of submissions allowed'
        },
        min_votes_required: {
          type: Sequelize.INTEGER,
          defaultValue: 5,
          comment: 'Minimum votes required for a submission to be considered'
        },
        created_by: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          comment: 'Admin who created the challenge'
        },
        featured: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: 'Whether this challenge is featured on the homepage'
        },
        metadata: {
          type: Sequelize.JSONB,
          defaultValue: {},
          comment: 'Additional challenge metadata'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    }

    const challengeSubmissionsExists = tableExists.includes('challenge_submissions');
    if (!challengeSubmissionsExists) {
      // Create challenge_submissions table
      await queryInterface.createTable('challenge_submissions', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        challenge_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'challenges',
            key: 'id'
          },
          comment: 'Reference to the challenge'
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          comment: 'User who submitted the location'
        },
        location_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'locations',
            key: 'id'
          },
          comment: 'Location submitted for the challenge'
        },
        submission_text: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'User\'s explanation of why this location fits the challenge'
        },
        status: {
          type: Sequelize.ENUM('pending', 'approved', 'rejected', 'winner', 'runner_up'),
          defaultValue: 'pending',
          comment: 'Submission status'
        },
        admin_notes: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Admin notes about the submission'
        },
        vote_count: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          comment: 'Total number of votes received'
        },
        upvotes: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          comment: 'Number of upvotes'
        },
        downvotes: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          comment: 'Number of downvotes'
        },
        score: {
          type: Sequelize.DECIMAL(10, 2),
          defaultValue: 0.00,
          comment: 'Calculated score based on votes and criteria match'
        },
        rank: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Final ranking in the challenge'
        },
        reward_amount: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          comment: 'Credits awarded for this submission'
        },
        metadata: {
          type: Sequelize.JSONB,
          defaultValue: {},
          comment: 'Additional submission metadata'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    }

    const challengeVotesExists = tableExists.includes('challenge_votes');
    if (!challengeVotesExists) {
      // Create challenge_votes table
      await queryInterface.createTable('challenge_votes', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        submission_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'challenge_submissions',
            key: 'id'
          },
          comment: 'Reference to the challenge submission'
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          comment: 'User who cast the vote'
        },
        vote_type: {
          type: Sequelize.ENUM('upvote', 'downvote'),
          allowNull: false,
          comment: 'Type of vote cast'
        },
        vote_weight: {
          type: Sequelize.INTEGER,
          defaultValue: 1,
          comment: 'Weight of the vote (can be adjusted based on user reputation)'
        },
        reason: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Optional reason for the vote'
        },
        is_valid: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          comment: 'Whether this vote is valid (not flagged for abuse)'
        },
        metadata: {
          type: Sequelize.JSONB,
          defaultValue: {},
          comment: 'Additional vote metadata'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    }

    const challengeRewardsExists = tableExists.includes('challenge_rewards');
    if (!challengeRewardsExists) {
      // Create challenge_rewards table
      await queryInterface.createTable('challenge_rewards', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        challenge_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'challenges',
            key: 'id'
          },
          comment: 'Reference to the challenge'
        },
        submission_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'challenge_submissions',
            key: 'id'
          },
          comment: 'Reference to the winning submission (if applicable)'
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          comment: 'User receiving the reward'
        },
        reward_type: {
          type: Sequelize.ENUM('winner', 'runner_up', 'participation', 'voting', 'admin_bonus'),
          allowNull: false,
          comment: 'Type of reward being given'
        },
        credit_amount: {
          type: Sequelize.INTEGER,
          allowNull: false,
          comment: 'Number of credits awarded'
        },
        badge_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'badges',
            key: 'id'
          },
          comment: 'Badge awarded (if applicable)'
        },
        rank: {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'Final ranking in the challenge'
        },
        status: {
          type: Sequelize.ENUM('pending', 'awarded', 'failed', 'cancelled'),
          defaultValue: 'pending',
          comment: 'Status of the reward distribution'
        },
        awarded_at: {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When the reward was actually awarded'
        },
        transaction_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'credit_transactions',
            key: 'id'
          },
          comment: 'Reference to the credit transaction'
        },
        metadata: {
          type: Sequelize.JSONB,
          defaultValue: {},
          comment: 'Additional reward metadata'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    }

    // Add indexes only if they don't exist
    try {
      await queryInterface.addIndex('challenges', ['status']);
    } catch (error) {
      console.log('Index challenges_status already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('challenges', ['start_date']);
    } catch (error) {
      console.log('Index challenges_start_date already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('challenges', ['end_date']);
    } catch (error) {
      console.log('Index challenges_end_date already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('challenges', ['type']);
    } catch (error) {
      console.log('Index challenges_type already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('challenges', ['featured']);
    } catch (error) {
      console.log('Index challenges_featured already exists, skipping...');
    }

    try {
      await queryInterface.addIndex('challenge_submissions', ['challenge_id']);
    } catch (error) {
      console.log('Index challenge_submissions_challenge_id already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('challenge_submissions', ['user_id']);
    } catch (error) {
      console.log('Index challenge_submissions_user_id already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('challenge_submissions', ['location_id']);
    } catch (error) {
      console.log('Index challenge_submissions_location_id already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('challenge_submissions', ['status']);
    } catch (error) {
      console.log('Index challenge_submissions_status already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('challenge_submissions', ['score']);
    } catch (error) {
      console.log('Index challenge_submissions_score already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('challenge_submissions', ['rank']);
    } catch (error) {
      console.log('Index challenge_submissions_rank already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('challenge_submissions', ['challenge_id', 'user_id', 'location_id'], {
        unique: true,
        name: 'unique_submission_per_user_location'
      });
    } catch (error) {
      console.log('Index unique_submission_per_user_location already exists, skipping...');
    }

    try {
      await queryInterface.addIndex('challenge_votes', ['submission_id']);
    } catch (error) {
      console.log('Index challenge_votes_submission_id already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('challenge_votes', ['user_id']);
    } catch (error) {
      console.log('Index challenge_votes_user_id already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('challenge_votes', ['vote_type']);
    } catch (error) {
      console.log('Index challenge_votes_vote_type already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('challenge_votes', ['is_valid']);
    } catch (error) {
      console.log('Index challenge_votes_is_valid already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('challenge_votes', ['submission_id', 'user_id'], {
        unique: true,
        name: 'unique_vote_per_user_submission'
      });
    } catch (error) {
      console.log('Index unique_vote_per_user_submission already exists, skipping...');
    }

    try {
      await queryInterface.addIndex('challenge_rewards', ['challenge_id']);
    } catch (error) {
      console.log('Index challenge_rewards_challenge_id already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('challenge_rewards', ['user_id']);
    } catch (error) {
      console.log('Index challenge_rewards_user_id already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('challenge_rewards', ['reward_type']);
    } catch (error) {
      console.log('Index challenge_rewards_reward_type already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('challenge_rewards', ['status']);
    } catch (error) {
      console.log('Index challenge_rewards_status already exists, skipping...');
    }
    
    try {
      await queryInterface.addIndex('challenge_rewards', ['rank']);
    } catch (error) {
      console.log('Index challenge_rewards_rank already exists, skipping...');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order
    await queryInterface.dropTable('challenge_rewards');
    await queryInterface.dropTable('challenge_votes');
    await queryInterface.dropTable('challenge_submissions');
    await queryInterface.dropTable('challenges');
  }
}; 