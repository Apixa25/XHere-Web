'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Rename 'point_of_interest' to 'interesting' in the ENUM and update existing rows
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Locations_locationType" ADD VALUE IF NOT EXISTS 'interesting';
      UPDATE "Locations" SET "locationType" = 'interesting' WHERE "locationType" = 'point_of_interest';
    `);
    // Add 'for_sale' to the ENUM
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Locations_locationType" ADD VALUE IF NOT EXISTS 'for_sale';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // No easy way to remove ENUM values or revert the rename in Postgres
    // This down migration is intentionally left empty
  }
}; 