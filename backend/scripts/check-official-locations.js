const { Location } = require('../models');

async function checkOfficialLocations() {
  try {
    console.log('🔍 Checking for official locations in database...');
    
    const officialLocations = await Location.findAll({
      where: { isOfficial: true },
      attributes: ['id', 'content', 'isOfficial', 'officialOwnerId', 'officializedAt']
    });
    
    console.log(`Found ${officialLocations.length} official locations:`);
    officialLocations.forEach(loc => {
      console.log(`- ID: ${loc.id}, Text: ${loc.content?.text}, Official: ${loc.isOfficial}, Owner: ${loc.officialOwnerId}, Date: ${loc.officializedAt}`);
    });
    
    const totalLocations = await Location.count();
    console.log(`Total locations: ${totalLocations}`);
    console.log(`Official percentage: ${((officialLocations.length / totalLocations) * 100).toFixed(2)}%`);
    
  } catch (error) {
    console.error('Error checking official locations:', error);
  }
}

checkOfficialLocations(); 