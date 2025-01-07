require('dotenv').config();
const { Sequelize } = require('sequelize');

async function checkDatabases() {
  try {
    // First connect to postgres database to list all databases
    const adminDb = new Sequelize('postgres', process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'postgres',
      logging: false
    });

    console.log('Connected to postgres database');

    // Get list of all databases
    const [databases] = await adminDb.query(`
      SELECT datname 
      FROM pg_database 
      WHERE datistemplate = false;
    `);

    console.log('\nAvailable databases:', databases.map(db => db.datname));

    // Check each database for locations table
    for (const db of databases) {
      const dbName = db.datname;
      console.log(`\n\nChecking database: ${dbName}`);
      
      const testDb = new Sequelize(dbName, process.env.DB_USER, process.env.DB_PASSWORD, {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        logging: false
      });

      try {
        // Check if Locations table exists
        const [tables] = await testDb.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public';
        `);

        console.log(`Tables in ${dbName}:`, tables.map(t => t.table_name));

        // If Locations table exists, count records
        if (tables.some(t => t.table_name.toLowerCase() === 'locations')) {
          const [result] = await testDb.query('SELECT COUNT(*) FROM "Locations"');
          console.log(`Number of locations in ${dbName}:`, result[0].count);

          // If there are locations, show a sample
          if (result[0].count > 0) {
            const [locations] = await testDb.query('SELECT * FROM "Locations" LIMIT 3');
            console.log(`\nSample locations from ${dbName}:`, 
              locations.map(loc => ({
                id: loc.id,
                creatorId: loc.creatorId,
                createdAt: loc.createdAt
              }))
            );
          }
        }

      } catch (error) {
        console.log(`Error checking ${dbName}:`, error.message);
      } finally {
        await testDb.close();
      }
    }

    await adminDb.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDatabases(); 