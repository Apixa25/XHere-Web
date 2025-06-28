'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('LocationNominations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      locationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Locations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      nominatorId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'expired'),
        defaultValue: 'pending',
        allowNull: false
      },
      votesRequired: {
        type: Sequelize.INTEGER,
        defaultValue: 3,
        allowNull: false
      },
      currentVotes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      creatorResponse: {
        type: Sequelize.ENUM('pending', 'accepted', 'rejected'),
        defaultValue: 'pending',
        allowNull: false
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP + INTERVAL \'7 days\'')
      },
      creditsSpent: {
        type: Sequelize.INTEGER,
        defaultValue: 5,
        allowNull: false
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true
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
    await queryInterface.addIndex('LocationNominations', ['locationId']);
    await queryInterface.addIndex('LocationNominations', ['nominatorId']);
    await queryInterface.addIndex('LocationNominations', ['status']);
    await queryInterface.addIndex('LocationNominations', ['expiresAt']);
    await queryInterface.addIndex('LocationNominations', ['locationId', 'status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('LocationNominations');
  }
}; 