'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add 'credit_placement' to the transactionType enum
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_CreditTransactions_transactionType" ADD VALUE 'credit_placement';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Note: PostgreSQL doesn't support removing enum values easily
    // This would require recreating the enum type
    console.log('Warning: Cannot easily remove enum value in PostgreSQL');
  }
}; 