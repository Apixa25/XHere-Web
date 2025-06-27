const sequelize = require('../config/database');
const Location = require('../models/Location');

async function testKeywordSearch() {
  try {
    console.log('🧪 Testing keyword search functionality...');
    
    // First, let's see what locations exist
    const allLocations = await Location.findAll({
      limit: 5,
      attributes: ['id', 'keywords', 'content']
    });
    
    console.log('📍 Found locations:', allLocations.length);
    allLocations.forEach(loc => {
      console.log(`- Location ${loc.id}: keywords =`, loc.keywords);
    });
    
    // Test keyword search
    const searchKeywords = ['family'];
    const searchQuery = `keywords ?| ARRAY['${searchKeywords.join("','")}']`;
    
    console.log('🔍 Testing search query:', searchQuery);
    
    const searchResults = await Location.findAll({
      where: sequelize.literal(searchQuery),
      limit: 10
    });
    
    console.log('✅ Search results:', searchResults.length);
    searchResults.forEach(loc => {
      console.log(`- Found location ${loc.id} with keywords:`, loc.keywords);
    });
    
  } catch (error) {
    console.error('❌ Error testing keyword search:', error);
  } finally {
    await sequelize.close();
  }
}

testKeywordSearch(); 