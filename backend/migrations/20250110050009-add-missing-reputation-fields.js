'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if trustLevel column exists, if not add it
    try {
      await queryInterface.addColumn('Users', 'trustLevel', {
        type: Sequelize.ENUM('new', 'trusted', 'verified', 'moderator'),
        defaultValue: 'new',
        allowNull: false
      });
      console.log('✅ Added trustLevel column to Users table');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ trustLevel column already exists');
      } else {
        throw error;
      }
    }

    // Check if reputationScore column exists, if not add it
    try {
      await queryInterface.addColumn('Users', 'reputationScore', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      });
      console.log('✅ Added reputationScore column to Users table');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ reputationScore column already exists');
      } else {
        throw error;
      }
    }

    // Check if qualityLocationsCount column exists, if not add it
    try {
      await queryInterface.addColumn('Users', 'qualityLocationsCount', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      });
      console.log('✅ Added qualityLocationsCount column to Users table');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ qualityLocationsCount column already exists');
      } else {
        throw error;
      }
    }

    // Check if totalLocationsCount column exists, if not add it
    try {
      await queryInterface.addColumn('Users', 'totalLocationsCount', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      });
      console.log('✅ Added totalLocationsCount column to Users table');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ totalLocationsCount column already exists');
      } else {
        throw error;
      }
    }

    // Check if averageLocationRating column exists, if not add it
    try {
      await queryInterface.addColumn('Users', 'averageLocationRating', {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 0.00,
        allowNull: false
      });
      console.log('✅ Added averageLocationRating column to Users table');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ averageLocationRating column already exists');
      } else {
        throw error;
      }
    }

    // Check if lastReputationUpdate column exists, if not add it
    try {
      await queryInterface.addColumn('Users', 'lastReputationUpdate', {
        type: Sequelize.DATE,
        allowNull: true
      });
      console.log('✅ Added lastReputationUpdate column to Users table');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ lastReputationUpdate column already exists');
      } else {
        throw error;
      }
    }

    // Check if reputationHistory column exists, if not add it
    try {
      await queryInterface.addColumn('Users', 'reputationHistory', {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: false
      });
      console.log('✅ Added reputationHistory column to Users table');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ reputationHistory column already exists');
      } else {
        throw error;
      }
    }

    console.log('✅ Reputation system fields check completed');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove all reputation fields
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