const { Challenge, ChallengeSubmission, ChallengeVote, ChallengeReward, User, Location, Badge, CreditTransaction } = require('../models');
const { Op } = require('sequelize');
const creditService = require('./creditService');

class ChallengeService {
  /**
   * Create a new challenge
   */
  async createChallenge(challengeData, adminUserId) {
    try {
      const challenge = await Challenge.create({
        ...challengeData,
        createdBy: adminUserId
      });
      
      console.log('🎯 Challenge created:', challenge.title);
      return challenge;
    } catch (error) {
      console.error('❌ Error creating challenge:', error);
      throw error;
    }
  }

  /**
   * Get active challenges
   */
  async getActiveChallenges() {
    try {
      const challenges = await Challenge.findAll({
        where: {
          status: {
            [Op.in]: ['active', 'voting']
          }
        },
        // Temporarily remove associations to debug
        // include: [
        //   {
        //     model: User,
        //     as: 'creator',
        //     attributes: ['email', 'profile']
        //   }
        // ],
        order: [['createdAt', 'DESC']]
      });
      
      return challenges;
    } catch (error) {
      console.error('❌ Error fetching active challenges:', error);
      throw error;
    }
  }

  /**
   * Get challenge by ID with submissions
   */
  async getChallengeById(challengeId, includeSubmissions = false) {
    try {
      // Temporarily remove associations to debug
      const challenge = await Challenge.findByPk(challengeId);
      
      if (!challenge) {
        throw new Error('Challenge not found');
      }
      
      // If includeSubmissions is requested, fetch them separately
      if (includeSubmissions) {
        const submissions = await ChallengeSubmission.findAll({
          where: { challengeId },
          order: [['score', 'DESC'], ['createdAt', 'ASC']]
        });
        
        // Add submissions to the challenge object
        challenge.dataValues.submissions = submissions;
      }
      
      return challenge;
    } catch (error) {
      console.error('❌ Error fetching challenge:', error);
      throw error;
    }
  }

  /**
   * Submit a location for a challenge
   */
  async submitLocation(challengeId, userId, locationId, submissionText) {
    try {
      // Check if challenge is active
      const challenge = await Challenge.findByPk(challengeId);
      if (!challenge || challenge.status !== 'active') {
        throw new Error('Challenge is not active for submissions');
      }

      // Check if user already submitted this location for this challenge
      const existingSubmission = await ChallengeSubmission.findOne({
        where: {
          challengeId,
          userId,
          locationId
        }
      });

      if (existingSubmission) {
        throw new Error('You have already submitted this location for this challenge');
      }

      // Check submission limit
      const submissionCount = await ChallengeSubmission.count({
        where: { challengeId }
      });

      if (submissionCount >= challenge.maxSubmissions) {
        throw new Error('Challenge submission limit reached');
      }

      // Create submission
      const submission = await ChallengeSubmission.create({
        challengeId,
        userId,
        locationId,
        submissionText
      });

      console.log('📝 Challenge submission created:', submission.id);
      return submission;
    } catch (error) {
      console.error('❌ Error submitting location:', error);
      throw error;
    }
  }

  /**
   * Vote on a challenge submission
   */
  async voteOnSubmission(submissionId, userId, voteType, reason = null) {
    try {
      // Check if submission exists and challenge is in voting phase
      const submission = await ChallengeSubmission.findByPk(submissionId, {
        include: [{
          model: Challenge,
          as: 'challenge'
        }]
      });

      if (!submission) {
        throw new Error('Submission not found');
      }

      if (submission.challenge.status !== 'voting') {
        throw new Error('Challenge is not in voting phase');
      }

      // Check if user already voted on this submission
      const existingVote = await ChallengeVote.findOne({
        where: {
          submissionId,
          userId
        }
      });

      if (existingVote) {
        // Update existing vote
        await existingVote.update({
          voteType,
          reason
        });
      } else {
        // Create new vote
        await ChallengeVote.create({
          submissionId,
          userId,
          voteType,
          reason
        });
      }

      // Update submission vote counts
      await this.updateSubmissionVoteCounts(submissionId);

      console.log('🗳️ Vote recorded:', voteType, 'on submission', submissionId);
      return true;
    } catch (error) {
      console.error('❌ Error voting on submission:', error);
      throw error;
    }
  }

  /**
   * Update submission vote counts
   */
  async updateSubmissionVoteCounts(submissionId) {
    try {
      const votes = await ChallengeVote.findAll({
        where: {
          submissionId,
          isValid: true
        }
      });

      const upvotes = votes.filter(v => v.voteType === 'upvote').length;
      const downvotes = votes.filter(v => v.voteType === 'downvote').length;
      const totalVotes = upvotes + downvotes;
      
      // Calculate score (upvotes - downvotes)
      const score = upvotes - downvotes;

      await ChallengeSubmission.update({
        voteCount: totalVotes,
        upvotes,
        downvotes,
        score
      }, {
        where: { id: submissionId }
      });

      console.log('📊 Vote counts updated for submission:', submissionId);
    } catch (error) {
      console.error('❌ Error updating vote counts:', error);
      throw error;
    }
  }

  /**
   * End challenge and calculate winners
   */
  async endChallenge(challengeId) {
    try {
      const challenge = await Challenge.findByPk(challengeId);
      if (!challenge) {
        throw new Error('Challenge not found');
      }

      // Get all submissions with minimum votes
      const submissions = await ChallengeSubmission.findAll({
        where: {
          challengeId,
          voteCount: {
            [Op.gte]: challenge.minVotesRequired
          }
        },
        include: [
          {
            model: User,
            as: 'user'
          },
          {
            model: Location,
            as: 'location'
          }
        ],
        order: [['score', 'DESC'], ['createdAt', 'ASC']]
      });

      // Rank submissions
      for (let i = 0; i < submissions.length; i++) {
        await submissions[i].update({ rank: i + 1 });
      }

      // Update challenge status
      await challenge.update({ status: 'completed' });

      // Distribute rewards
      await this.distributeRewards(challengeId, submissions);

      console.log('🏆 Challenge ended and rewards distributed:', challenge.title);
      return submissions;
    } catch (error) {
      console.error('❌ Error ending challenge:', error);
      throw error;
    }
  }

  /**
   * Distribute rewards to challenge winners
   */
  async distributeRewards(challengeId, submissions) {
    try {
      const challenge = await Challenge.findByPk(challengeId);
      const rewards = challenge.rewards;

      // Award prizes to winners
      for (let i = 0; i < submissions.length && i < rewards.winners.length; i++) {
        const submission = submissions[i];
        const reward = rewards.winners[i];

        // Create reward record
        const challengeReward = await ChallengeReward.create({
          challengeId,
          submissionId: submission.id,
          userId: submission.userId,
          rewardType: i === 0 ? 'winner' : 'runner_up',
          creditAmount: reward.credits,
          badgeId: reward.badgeId,
          rank: submission.rank,
          status: 'pending'
        });

        // Award credits
        if (reward.credits > 0) {
          const transaction = await creditService.addCredits(
            submission.userId,
            reward.credits,
            'challenge_reward',
            `Challenge reward: ${challenge.title} - ${i === 0 ? 'Winner' : 'Runner Up'}`
          );

          await challengeReward.update({
            status: 'awarded',
            awardedAt: new Date(),
            transactionId: transaction.id
          });
        }

        // Award badge if specified
        if (reward.badgeId) {
          // Add badge logic here
          console.log('🏅 Badge awarded:', reward.badgeId);
        }

        // Update submission status
        await submission.update({
          status: i === 0 ? 'winner' : 'runner_up',
          rewardAmount: reward.credits
        });
      }

      // Award participation credits
      if (rewards.participation && rewards.participation.credits > 0) {
        const allParticipants = await ChallengeSubmission.findAll({
          where: { challengeId },
          attributes: ['userId'],
          group: ['userId']
        });

        for (const participant of allParticipants) {
          await ChallengeReward.create({
            challengeId,
            userId: participant.userId,
            rewardType: 'participation',
            creditAmount: rewards.participation.credits,
            status: 'pending'
          });

          await creditService.addCredits(
            participant.userId,
            rewards.participation.credits,
            'challenge_participation',
            `Participation reward: ${challenge.title}`
          );
        }
      }

      console.log('💰 Rewards distributed for challenge:', challenge.title);
    } catch (error) {
      console.error('❌ Error distributing rewards:', error);
      throw error;
    }
  }

  /**
   * Get user's challenge submissions
   */
  async getUserSubmissions(userId, challengeId = null) {
    try {
      const where = { userId };
      if (challengeId) {
        where.challengeId = challengeId;
      }

      const submissions = await ChallengeSubmission.findAll({
        where,
        // Temporarily remove associations to debug
        // include: [
        //   {
        //     model: Challenge,
        //     as: 'challenge'
        //   },
        //   {
        //     model: Location,
        //     as: 'location'
        //   }
        // ],
        order: [['createdAt', 'DESC']]
      });

      return submissions;
    } catch (error) {
      console.error('❌ Error fetching user submissions:', error);
      throw error;
    }
  }

  /**
   * Get challenge leaderboard
   */
  async getChallengeLeaderboard(challengeId) {
    try {
      const submissions = await ChallengeSubmission.findAll({
        where: {
          challengeId,
          voteCount: {
            [Op.gte]: 1 // At least one vote
          }
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['email', 'profile']
          },
          {
            model: Location,
            as: 'location',
            attributes: ['id', 'content', 'locationType']
          }
        ],
        order: [['score', 'DESC'], ['voteCount', 'DESC'], ['createdAt', 'ASC']]
      });

      return submissions;
    } catch (error) {
      console.error('❌ Error fetching leaderboard:', error);
      throw error;
    }
  }

  /**
   * Create a sample weekly challenge
   */
  async createSampleChallenge(adminUserId) {
    const challengeData = {
      title: "Find Hidden Gems",
      description: "Discover and share the most amazing hidden spots in your area! This week, we're looking for unique, lesser-known locations that deserve recognition. Think secret gardens, hidden viewpoints, local favorites, or quirky spots that most people don't know about.",
      type: "weekly",
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      votingEndDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
      criteria: {
        locationTypes: ["restaurant", "cafe", "park", "viewpoint", "landmark", "shop"],
        keywords: ["hidden", "secret", "local", "unique", "amazing", "beautiful"],
        minUpvotes: 3,
        maxDistance: 50 // miles
      },
      rewards: {
        winners: [
          {
            credits: 500,
            badgeId: null,
            description: "🏆 1st Place - Hidden Gem Master"
          },
          {
            credits: 250,
            badgeId: null,
            description: "🥈 2nd Place - Gem Hunter"
          },
          {
            credits: 100,
            badgeId: null,
            description: "🥉 3rd Place - Explorer"
          }
        ],
        participation: {
          credits: 25,
          description: "Participation reward"
        }
      },
      maxSubmissions: 100,
      minVotesRequired: 5,
      featured: true
    };

    return await this.createChallenge(challengeData, adminUserId);
  }
}

module.exports = new ChallengeService(); 