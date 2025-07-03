'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if requiresApproval column exists, if not add it
      await queryInterface.addColumn('Locations', 'requiresApproval', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether this location requires moderator approval'
      });
      console.log('✅ Added requiresApproval column to Locations table');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ requiresApproval column already exists');
      } else {
        throw error;
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('Locations', 'requiresApproval');
      console.log('✅ Removed requiresApproval column from Locations table');
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log('ℹ️ requiresApproval column does not exist');
      } else {
        throw error;
      }
    }
  }
}; 