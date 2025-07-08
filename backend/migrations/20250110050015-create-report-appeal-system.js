'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Create LocationReports table
      await queryInterface.createTable('LocationReports', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        locationId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'Locations',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        reporterId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'Users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        reportType: {
          type: Sequelize.ENUM('spam', 'inappropriate', 'duplicate', 'fake', 'offensive', 'other'),
          allowNull: false
        },
        reason: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        evidence: {
          type: Sequelize.JSONB,
          defaultValue: [],
          allowNull: false
        },
        status: {
          type: Sequelize.ENUM('pending', 'under_review', 'resolved', 'dismissed'),
          defaultValue: 'pending',
          allowNull: false
        },
        moderatorId: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'Users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        moderatorNotes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        resolution: {
          type: Sequelize.ENUM('location_removed', 'location_flagged', 'warning_issued', 'no_action', 'user_suspended'),
          allowNull: true
        },
        resolvedAt: {
          type: Sequelize.DATE,
          allowNull: true
        },
        priority: {
          type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
          defaultValue: 'medium',
          allowNull: false
        },
        reportCount: {
          type: Sequelize.INTEGER,
          defaultValue: 1,
          allowNull: false
        },
        isAnonymous: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        },
        contactEmail: {
          type: Sequelize.STRING,
          allowNull: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      });

      // Create LocationAppeals table
      await queryInterface.createTable('LocationAppeals', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        locationId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'Locations',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        appellantId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'Users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        originalReportId: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'LocationReports',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        appealReason: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        evidence: {
          type: Sequelize.JSONB,
          defaultValue: [],
          allowNull: false
        },
        status: {
          type: Sequelize.ENUM('pending', 'under_review', 'approved', 'rejected'),
          defaultValue: 'pending',
          allowNull: false
        },
        reviewerId: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'Users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        reviewerNotes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        reviewedAt: {
          type: Sequelize.DATE,
          allowNull: true
        },
        decision: {
          type: Sequelize.ENUM('location_restored', 'location_remains_removed', 'partial_restoration', 'compensation_granted'),
          allowNull: true
        },
        compensationAmount: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          allowNull: false
        },
        priority: {
          type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
          defaultValue: 'medium',
          allowNull: false
        },
        appealCount: {
          type: Sequelize.INTEGER,
          defaultValue: 1,
          allowNull: false
        },
        isUrgent: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        },
        contactEmail: {
          type: Sequelize.STRING,
          allowNull: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      });

      // Create indexes for LocationReports
      await queryInterface.addIndex('LocationReports', ['locationId']);
      await queryInterface.addIndex('LocationReports', ['reporterId']);
      await queryInterface.addIndex('LocationReports', ['status']);
      await queryInterface.addIndex('LocationReports', ['reportType']);
      await queryInterface.addIndex('LocationReports', ['priority']);
      await queryInterface.addIndex('LocationReports', ['createdAt']);

      // Create indexes for LocationAppeals
      await queryInterface.addIndex('LocationAppeals', ['locationId']);
      await queryInterface.addIndex('LocationAppeals', ['appellantId']);
      await queryInterface.addIndex('LocationAppeals', ['status']);
      await queryInterface.addIndex('LocationAppeals', ['priority']);
      await queryInterface.addIndex('LocationAppeals', ['createdAt']);
      await queryInterface.addIndex('LocationAppeals', ['isUrgent']);

      console.log('✅ Created LocationReports and LocationAppeals tables with indexes');
    } catch (error) {
      console.error('❌ Error creating report and appeal tables:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Drop tables in reverse order
      await queryInterface.dropTable('LocationAppeals');
      await queryInterface.dropTable('LocationReports');
      
      // Drop ENUM types
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_LocationReports_reportType";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_LocationReports_status";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_LocationReports_resolution";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_LocationReports_priority";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_LocationAppeals_status";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_LocationAppeals_decision";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_LocationAppeals_priority";');
      
      console.log('✅ Dropped LocationReports and LocationAppeals tables');
    } catch (error) {
      console.error('❌ Error dropping report and appeal tables:', error);
      throw error;
    }
  }
}; 