'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if googleId column already exists
    const tableInfo = await queryInterface.describeTable('Users');
    
    if (!tableInfo.googleId) {
      await queryInterface.addColumn('Users', 'googleId', {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'googleId');
  }
}; 