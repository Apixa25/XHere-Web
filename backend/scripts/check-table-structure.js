require('dotenv').config();
const { Sequelize } = require('sequelize');

async function checkTableStructure() {
  try {
    const sequelize = new Sequelize('location_app', process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'postgres',
      logging: false
    });

    console.log('Connected to location_app database');

    // Check structure of active tables
    const tableQueries = [
      {
        name: '"Locations"',
        query: `
          SELECT 
            column_name, 
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = 'Locations'
          ORDER BY ordinal_position;
        `
      },
      {
        name: '"Users"',
        query: `
          SELECT 
            column_name, 
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = 'Users'
          ORDER BY ordinal_position;
        `
      }
    ];

    for (const table of tableQueries) {
      try {
        console.log(`\n=== Structure of ${table.name} ===`);
        const [columns] = await sequelize.query(table.query);
        columns.forEach(col => {
          console.log(`${col.column_name}:`);
          console.log(`  Type: ${col.data_type}`);
          console.log(`  Nullable: ${col.is_nullable}`);
          console.log(`  Default: ${col.column_default || 'none'}`);
          console.log('---');
        });
      } catch (error) {
        console.log(`Error checking structure of ${table.name}:`, error.message);
      }
    }

    // Clean up unused tables
    console.log('\nChecking for unused tables...');
    const dropQueries = [
      'DROP TABLE IF EXISTS locations',
      'DROP TABLE IF EXISTS users'
    ];

    for (const query of dropQueries) {
      try {
        await sequelize.query(query);
        console.log(`Successfully executed: ${query}`);
      } catch (error) {
        console.log(`Error executing ${query}:`, error.message);
      }
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTableStructure(); 