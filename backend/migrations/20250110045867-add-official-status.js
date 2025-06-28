'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Locations', 'isOfficial', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    await queryInterface.addColumn('Locations', 'officialBoundary', {
      type: Sequelize.GEOMETRY('POINT'),
      allowNull: true,
      comment: 'Center point of the 150-foot official boundary'
    });

    await queryInterface.addColumn('Locations', 'officialOwnerId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      comment: 'User who made this location official'
    });

    await queryInterface.addColumn('Locations', 'officializedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When the location was made official'
    });

    // Add index for efficient official location queries
    await queryInterface.addIndex('Locations', ['isOfficial']);
    await queryInterface.addIndex('Locations', ['officialOwnerId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Locations', ['isOfficial']);
    await queryInterface.removeIndex('Locations', ['officialOwnerId']);
    
    await queryInterface.removeColumn('Locations', 'officializedAt');
    await queryInterface.removeColumn('Locations', 'officialOwnerId');
    await queryInterface.removeColumn('Locations', 'officialBoundary');
    await queryInterface.removeColumn('Locations', 'isOfficial');
  }
}; 