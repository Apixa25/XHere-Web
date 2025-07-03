'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'trustLevel', {
      type: Sequelize.ENUM('new', 'trusted', 'verified', 'moderator'),
      defaultValue: 'new',
      allowNull: false
    });

    await queryInterface.addColumn('Users', 'reputationScore', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    await queryInterface.addColumn('Users', 'qualityLocationsCount', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    await queryInterface.addColumn('Users', 'totalLocationsCount', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    await queryInterface.addColumn('Users', 'averageLocationRating', {
      type: Sequelize.DECIMAL(3, 2),
      defaultValue: 0.00,
      allowNull: false
    });

    await queryInterface.addColumn('Users', 'lastReputationUpdate', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('Users', 'reputationHistory', {
      type: Sequelize.JSONB,
      defaultValue: [],
      allowNull: false
    });

    console.log('✅ Added reputation system fields to Users table');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'trustLevel');
    await queryInterface.removeColumn('Users', 'reputationScore');
    await queryInterface.removeColumn('Users', 'qualityLocationsCount');
    await queryInterface.removeColumn('Users', 'totalLocationsCount');
    await queryInterface.removeColumn('Users', 'averageLocationRating');
    await queryInterface.removeColumn('Users', 'lastReputationUpdate');
    await queryInterface.removeColumn('Users', 'reputationHistory');

    // Remove the ENUM type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Users_trustLevel";');

    console.log('✅ Removed reputation system fields from Users table');
  }
}; 