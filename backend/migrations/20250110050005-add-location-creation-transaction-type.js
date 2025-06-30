'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add 'location_creation' to the transactionType enum
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_CreditTransactions_transactionType" ADD VALUE 'location_creation';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Note: PostgreSQL doesn't support removing enum values easily
    // This would require recreating the enum type
    console.log('Warning: Cannot easily remove enum value in PostgreSQL');
  }
}; 