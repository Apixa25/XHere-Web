'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create LocationOwnership table
    await queryInterface.createTable('LocationOwnerships', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      locationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Locations', key: 'id' },
        onDelete: 'CASCADE'
      },
      ownerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE'
      },
      currentPrice: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 100
      },
      purchaseCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      isOfficial: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create LocationOwnershipHistory table
    await queryInterface.createTable('LocationOwnershipHistories', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      locationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Locations', key: 'id' },
        onDelete: 'CASCADE'
      },
      buyerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE'
      },
      pricePaid: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      purchasedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('LocationOwnershipHistories');
    await queryInterface.dropTable('LocationOwnerships');
  }
}; 