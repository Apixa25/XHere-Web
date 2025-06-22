'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Locations', 'locationType', {
      type: Sequelize.ENUM('general', 'yard_sale', 'crime', 'point_of_interest'),
      defaultValue: 'general',
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Locations', 'locationType');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Locations_locationType";');
  }
}; 