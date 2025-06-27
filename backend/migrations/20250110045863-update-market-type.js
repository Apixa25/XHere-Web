'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add 'market' to the ENUM and update existing rows
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Locations_locationType" ADD VALUE IF NOT EXISTS 'market';
      UPDATE "Locations" SET "locationType" = 'market' WHERE "locationType" = 'farmers_market';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // No easy way to remove ENUM values or revert the rename in Postgres
    // This down migration is intentionally left empty.
  }
}; 