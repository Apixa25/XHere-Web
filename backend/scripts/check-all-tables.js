require('dotenv').config();
const { Sequelize } = require('sequelize');

async function checkAllTables() {
  try {
    const sequelize = new Sequelize('location_app', process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'postgres',
      logging: false
    });

    console.log('Connected to location_app database');

    // Check both cases of tables
    const queries = [
      'SELECT COUNT(*) FROM "Locations"',
      'SELECT COUNT(*) FROM locations',
      'SELECT COUNT(*) FROM "Users"',
      'SELECT COUNT(*) FROM users'
    ];

    for (const query of queries) {
      try {
        const [result] = await sequelize.query(query);
        console.log(`\nResults for ${query}:`);
        console.log(result);
      } catch (error) {
        console.log(`Error running "${query}":`, error.message);
      }
    }

    // Check table structures
    const tableQueries = [
      '"Locations"',
      'locations',
      '"Users"',
      'users'
    ];

    for (const table of tableQueries) {
      try {
        const [columns] = await sequelize.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = ${table}
        `);
        console.log(`\nColumns in ${table}:`);
        console.log(columns);
      } catch (error) {
        console.log(`Error checking structure of ${table}:`, error.message);
      }
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAllTables(); 