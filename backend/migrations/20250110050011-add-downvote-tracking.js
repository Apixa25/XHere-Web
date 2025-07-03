'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new downvote tracking fields to Users table
    await queryInterface.addColumn('Users', 'totalDownvotesReceived', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Total downvotes received across all user locations'
    });

    await queryInterface.addColumn('Users', 'downvotedLocationsCount', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Number of locations that have received downvotes'
    });

    await queryInterface.addColumn('Users', 'lastDownvoteDate', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Date of the most recent downvote received'
    });

    await queryInterface.addColumn('Users', 'downvotePenaltyLevel', {
      type: Sequelize.ENUM('none', 'warning', 'restricted', 'suspended', 'banned'),
      defaultValue: 'none',
      allowNull: false,
      comment: 'Current penalty level based on downvote history'
    });

    await queryInterface.addColumn('Users', 'penaltyExpiresAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When the current penalty expires'
    });

    await queryInterface.addColumn('Users', 'downvoteHistory', {
      type: Sequelize.JSONB,
      defaultValue: [],
      allowNull: false,
      comment: 'History of downvote events and penalties'
    });

    // Add indexes for better performance
    await queryInterface.addIndex('Users', ['downvotePenaltyLevel']);
    await queryInterface.addIndex('Users', ['totalDownvotesReceived']);
    await queryInterface.addIndex('Users', ['penaltyExpiresAt']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('Users', ['downvotePenaltyLevel']);
    await queryInterface.removeIndex('Users', ['totalDownvotesReceived']);
    await queryInterface.removeIndex('Users', ['penaltyExpiresAt']);

    // Remove columns
    await queryInterface.removeColumn('Users', 'downvoteHistory');
    await queryInterface.removeColumn('Users', 'penaltyExpiresAt');
    await queryInterface.removeColumn('Users', 'downvotePenaltyLevel');
    await queryInterface.removeColumn('Users', 'lastDownvoteDate');
    await queryInterface.removeColumn('Users', 'downvotedLocationsCount');
    await queryInterface.removeColumn('Users', 'totalDownvotesReceived');
  }
}; 