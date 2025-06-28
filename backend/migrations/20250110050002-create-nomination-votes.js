'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('NominationVotes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nominationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'LocationNominations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      voterId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      voteType: {
        type: Sequelize.ENUM('upvote', 'downvote'),
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('NominationVotes', ['nominationId']);
    await queryInterface.addIndex('NominationVotes', ['voterId']);
    await queryInterface.addIndex('NominationVotes', ['nominationId', 'voterId'], { unique: true });
    await queryInterface.addIndex('NominationVotes', ['voteType']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('NominationVotes');
  }
}; 