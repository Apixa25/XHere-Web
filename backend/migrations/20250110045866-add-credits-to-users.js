'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add credits column to Users table
    await queryInterface.addColumn('Users', 'credits', {
      type: Sequelize.INTEGER,
      defaultValue: 100,
      allowNull: false
    });

    // Update existing users to have 100 credits
    await queryInterface.sequelize.query(`
      UPDATE "Users" 
      SET credits = 100 
      WHERE credits IS NULL
    `);

    console.log('✅ Added credits column to Users table');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove credits column from Users table
    await queryInterface.removeColumn('Users', 'credits');
    console.log('✅ Removed credits column from Users table');
  }
}; 