'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Locations', 'locationStatus', {
      type: Sequelize.ENUM('pending', 'verified', 'flagged', 'removed'),
      defaultValue: 'pending',
      allowNull: false
    });

    await queryInterface.addColumn('Locations', 'statusUpdatedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When the location status was last updated'
    });

    await queryInterface.addColumn('Locations', 'statusReason', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Reason for status change (e.g., "5+ positive ratings", "5+ negative ratings")'
    });

    // Add index for status queries
    await queryInterface.addIndex('Locations', ['locationStatus']);
    await queryInterface.addIndex('Locations', ['locationStatus', 'locationType']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Locations', 'statusReason');
    await queryInterface.removeColumn('Locations', 'statusUpdatedAt');
    await queryInterface.removeColumn('Locations', 'locationStatus');
    
    // Remove the ENUM type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Locations_locationStatus";');
  }
}; 