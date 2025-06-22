'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('LocationComments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      text: {
        type: Sequelize.TEXT,
        allowNull: false
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
      authorId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      parentCommentId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'LocationComments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      upvotes: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      downvotes: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      totalPoints: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      voters: {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: false
      },
      isAnonymous: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      mediaUrls: {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: false
      },
      mediaTypes: {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: false
      },
      verificationStatus: {
        type: Sequelize.ENUM('unverified', 'pending', 'verified'),
        defaultValue: 'unverified'
      },
      isEdited: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      editedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      pointsHistory: {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('LocationComments', ['locationId']);
    await queryInterface.addIndex('LocationComments', ['authorId']);
    await queryInterface.addIndex('LocationComments', ['parentCommentId']);
    await queryInterface.addIndex('LocationComments', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('LocationComments');
  }
}; 