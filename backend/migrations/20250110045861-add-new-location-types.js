'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new values to the ENUM type for locationType
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Locations_locationType" ADD VALUE IF NOT EXISTS 'event';
      ALTER TYPE "enum_Locations_locationType" ADD VALUE IF NOT EXISTS 'farmers_market';
      ALTER TYPE "enum_Locations_locationType" ADD VALUE IF NOT EXISTS 'food_truck';
      ALTER TYPE "enum_Locations_locationType" ADD VALUE IF NOT EXISTS 'church';
      ALTER TYPE "enum_Locations_locationType" ADD VALUE IF NOT EXISTS 'historical';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Note: PostgreSQL does not support removing values from ENUM types easily.
    // This down migration is left intentionally empty.
  }
}; 