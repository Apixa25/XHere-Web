'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create credit transactions table
    await queryInterface.createTable('CreditTransactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      transactionType: {
        type: Sequelize.ENUM('purchase', 'spend', 'refund', 'bonus', 'transfer'),
        allowNull: false
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Amount in credits (positive for gain, negative for loss)'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      stripePaymentIntentId: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Stripe payment intent ID for purchases'
      },
      stripeAmount: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Amount in cents paid to Stripe'
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'cancelled'),
        defaultValue: 'completed'
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
        comment: 'Additional transaction metadata'
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

    // Create indexes for better performance
    await queryInterface.addIndex('CreditTransactions', ['userId']);
    await queryInterface.addIndex('CreditTransactions', ['transactionType']);
    await queryInterface.addIndex('CreditTransactions', ['createdAt']);
    await queryInterface.addIndex('CreditTransactions', ['stripePaymentIntentId']);

    // Create user credit stats table for analytics
    await queryInterface.createTable('UserCreditStats', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      totalCreditsPurchased: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Total credits ever purchased'
      },
      totalCreditsSpent: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Total credits ever spent'
      },
      totalAmountSpent: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Total amount spent in cents'
      },
      firstPurchaseDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lastPurchaseDate: {
        type: Sequelize.DATE,
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

    // Add index for user credit stats
    await queryInterface.addIndex('UserCreditStats', ['userId']);

    // Update existing users to have credit stats
    await queryInterface.sequelize.query(`
      INSERT INTO "UserCreditStats" ("userId", "totalCreditsPurchased", "createdAt", "updatedAt")
      SELECT id, credits, NOW(), NOW()
      FROM "Users"
      WHERE credits > 0
      ON CONFLICT ("userId") DO NOTHING
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('UserCreditStats');
    await queryInterface.dropTable('CreditTransactions');
  }
}; 