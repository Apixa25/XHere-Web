'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Users', 'averageLocationRating', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Users', 'averageLocationRating', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0.00
    });
  }
}; 