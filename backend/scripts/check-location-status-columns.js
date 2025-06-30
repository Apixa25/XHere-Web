const Location = require('../models/Location');
const sequelize = require('../config/database');

async function checkLocationStatusColumns() {
  try {
    console.log('🔍 Checking Location table structure...\n');

    // Get table description
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'Locations' 
      AND column_name IN ('locationStatus', 'statusUpdatedAt', 'statusReason')
      ORDER BY column_name;
    `);

    console.log('📊 Current Location Status Columns:');
    console.log('=====================================');
    
    if (results.length === 0) {
      console.log('❌ No location status columns found');
    } else {
      results.forEach(col => {
        console.log(`✅ ${col.column_name}:`);
        console.log(`   Type: ${col.data_type}`);
        console.log(`   Nullable: ${col.is_nullable}`);
        console.log(`   Default: ${col.column_default || 'NULL'}`);
        console.log('');
      });
    }

    // Check if we can query the Location model
    console.log('🧪 Testing Location model...');
    try {
      const sampleLocation = await Location.findOne({
        attributes: ['id', 'locationStatus', 'statusUpdatedAt', 'statusReason']
      });
      
      if (sampleLocation) {
        console.log('✅ Location model can access status columns');
        console.log(`Sample location status: ${sampleLocation.locationStatus || 'NULL'}`);
      } else {
        console.log('⚠️ No locations found in database');
      }
    } catch (modelError) {
      console.log('❌ Location model error:', modelError.message);
    }

  } catch (error) {
    console.error('❌ Error checking columns:', error);
  } finally {
    await sequelize.close();
  }
}

checkLocationStatusColumns(); 