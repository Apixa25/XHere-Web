require('dotenv').config();
const Location = require('../models/Location');
const User = require('../models/User');
const sequelize = require('../config/database');
const fs = require('fs');
const path = require('path');

async function fixImagePaths() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Get all files in uploads directory
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const allFiles = [];
    
    const scanDirectory = (dir, prefix = '') => {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);
        if (stats.isDirectory()) {
          scanDirectory(itemPath, prefix + item + '/');
        } else {
          allFiles.push(prefix + item);
        }
      });
    };
    
    if (fs.existsSync(uploadsDir)) {
      scanDirectory(uploadsDir);
      console.log(`📁 Found ${allFiles.length} files in uploads directory`);
    }

    // Fix location media paths
    console.log('\n🔧 Fixing location media paths...');
    const locations = await Location.findAll();
    let fixedLocations = 0;
    
    for (const location of locations) {
      const mediaUrls = location.content?.mediaUrls || [];
      let needsUpdate = false;
      const updatedMediaUrls = [];
      
      for (const mediaUrl of mediaUrls) {
        // Extract filename from path (remove 'uploads/' prefix)
        const filename = mediaUrl.replace('uploads/', '');
        
        // Check if file exists with this exact name
        if (allFiles.includes(filename)) {
          updatedMediaUrls.push(mediaUrl); // Keep as is
        } else {
          // Try to find a matching file by looking for similar patterns
          const matchingFile = allFiles.find(file => {
            // Check if it's a similar timestamp-based file
            const fileWithoutExt = file.replace(/\.[^/.]+$/, '');
            const filenameWithoutExt = filename.replace(/\.[^/.]+$/, '');
            
            // If both are numeric (timestamp-based), they might match
            if (/^\d+$/.test(fileWithoutExt) && /^\d+$/.test(filenameWithoutExt)) {
              return true;
            }
            
            // Check if they have similar patterns
            return file.includes(filenameWithoutExt) || filenameWithoutExt.includes(file);
          });
          
          if (matchingFile) {
            const newPath = `uploads/${matchingFile}`;
            updatedMediaUrls.push(newPath);
            console.log(`  🔄 Fixed: ${mediaUrl} → ${newPath}`);
            needsUpdate = true;
          } else {
            console.log(`  ❌ No match found for: ${mediaUrl}`);
            // Keep the original path but mark as missing
            updatedMediaUrls.push(mediaUrl);
          }
        }
      }
      
      if (needsUpdate) {
        location.content = {
          ...location.content,
          mediaUrls: updatedMediaUrls
        };
        await location.save();
        fixedLocations++;
        console.log(`  ✅ Updated location ${location.id}`);
      }
    }

    // Fix user profile picture paths
    console.log('\n🔧 Fixing user profile picture paths...');
    const users = await User.findAll();
    let fixedUsers = 0;
    
    for (const user of users) {
      const pictureUrl = user.profile?.pictureUrl;
      if (pictureUrl) {
        const filename = pictureUrl.replace('uploads/', '');
        
        if (!allFiles.includes(filename)) {
          // Look for profile picture files
          const matchingFile = allFiles.find(file => {
            return file.includes('profile-') && file.includes(filename.replace('profile-pictures/', ''));
          });
          
          if (matchingFile) {
            const newPath = `uploads/${matchingFile}`;
            user.profile = {
              ...user.profile,
              pictureUrl: newPath
            };
            await user.save();
            fixedUsers++;
            console.log(`  🔄 Fixed profile picture: ${pictureUrl} → ${newPath}`);
          } else {
            console.log(`  ❌ No match found for profile picture: ${pictureUrl}`);
          }
        }
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log(`Total files in uploads: ${allFiles.length}`);
    console.log(`Locations fixed: ${fixedLocations}`);
    console.log(`Users fixed: ${fixedUsers}`);
    console.log('\n✅ Image path fix completed!');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixImagePaths(); 