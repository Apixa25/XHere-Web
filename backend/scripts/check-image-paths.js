require('dotenv').config();
const Location = require('../models/Location');
const User = require('../models/User');
const sequelize = require('../config/database');
const fs = require('fs');
const path = require('path');

async function checkImagePaths() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    console.log('\n🔍 Checking Locations with Media...');
    const locations = await Location.findAll();
    
    let locationsWithMedia = 0;
    let totalMediaFiles = 0;
    let missingFiles = 0;
    
    for (const location of locations) {
      const mediaUrls = location.content?.mediaUrls || [];
      if (mediaUrls.length > 0) {
        locationsWithMedia++;
        console.log(`\n📍 Location ID: ${location.id}`);
        console.log(`   Text: ${location.content?.text?.substring(0, 50)}...`);
        console.log(`   Media URLs: ${mediaUrls.length}`);
        
        for (let i = 0; i < mediaUrls.length; i++) {
          const mediaUrl = mediaUrls[i];
          const mediaType = location.content?.mediaTypes?.[i];
          totalMediaFiles++;
          
          console.log(`   📁 Media ${i + 1}: ${mediaUrl} (${mediaType})`);
          
          // Check if file exists
          const filePath = path.join(__dirname, '..', mediaUrl);
          if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            console.log(`   ✅ File exists: ${(stats.size / 1024).toFixed(2)} KB`);
          } else {
            console.log(`   ❌ File missing: ${filePath}`);
            missingFiles++;
          }
        }
      }
    }

    console.log('\n🔍 Checking User Profile Pictures...');
    const users = await User.findAll();
    
    let usersWithPictures = 0;
    let missingProfilePictures = 0;
    
    for (const user of users) {
      const pictureUrl = user.profile?.pictureUrl;
      if (pictureUrl) {
        usersWithPictures++;
        console.log(`\n👤 User: ${user.email}`);
        console.log(`   Profile Picture: ${pictureUrl}`);
        
        // Check if file exists
        const filePath = path.join(__dirname, '..', pictureUrl);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          console.log(`   ✅ File exists: ${(stats.size / 1024).toFixed(2)} KB`);
        } else {
          console.log(`   ❌ File missing: ${filePath}`);
          missingProfilePictures++;
        }
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log(`Total locations: ${locations.length}`);
    console.log(`Locations with media: ${locationsWithMedia}`);
    console.log(`Total media files: ${totalMediaFiles}`);
    console.log(`Missing media files: ${missingFiles}`);
    console.log(`Users with profile pictures: ${usersWithPictures}`);
    console.log(`Missing profile pictures: ${missingProfilePictures}`);

    // Check uploads directory
    console.log('\n📁 Checking uploads directory...');
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const uploadsStats = fs.statSync(uploadsDir);
      console.log(`✅ Uploads directory exists`);
      console.log(`   Size: ${(uploadsStats.size / 1024).toFixed(2)} KB`);
      
      // List contents
      const listFiles = (dir, prefix = '') => {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
          const itemPath = path.join(dir, item);
          const stats = fs.statSync(itemPath);
          if (stats.isDirectory()) {
            console.log(`${prefix}📁 ${item}/`);
            listFiles(itemPath, prefix + '  ');
          } else {
            console.log(`${prefix}📄 ${item} (${(stats.size / 1024).toFixed(2)} KB)`);
          }
        });
      };
      
      listFiles(uploadsDir);
    } else {
      console.log('❌ Uploads directory does not exist!');
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkImagePaths(); 