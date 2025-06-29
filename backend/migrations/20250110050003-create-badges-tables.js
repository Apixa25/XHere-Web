'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create badges table
    await queryInterface.createTable('badges', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      criteria: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Badge earning criteria'
      },
      icon_url: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create user_badges table
    await queryInterface.createTable('user_badges', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      badge_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'badges',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      awarded_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint to user_badges
    await queryInterface.addConstraint('user_badges', {
      fields: ['user_id', 'badge_id'],
      type: 'unique',
      name: 'user_badges_user_id_badge_id_unique'
    });

    // Add indexes for performance
    await queryInterface.addIndex('user_badges', ['user_id']);
    await queryInterface.addIndex('user_badges', ['badge_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_badges');
    await queryInterface.dropTable('badges');
  }
}; 