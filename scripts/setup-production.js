#!/usr/bin/env node

/**
 * XHere.world Production Setup Script
 * This script helps configure and test your production deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 XHere.world Production Setup Script');
console.log('=====================================\n');

// Check if we're in the right directory
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: Please run this script from the project root directory');
  process.exit(1);
}

console.log('✅ Project structure verified\n');

// Environment variables template
const envTemplate = {
  backend: {
    NODE_ENV: 'production',
    JWT_SECRET: 'your-super-secret-jwt-key-here',
    GOOGLE_CLIENT_ID: 'your-google-oauth-client-id',
    GOOGLE_CLIENT_SECRET: 'your-google-oauth-client-secret',
    GOOGLE_MAPS_API_KEY: 'your-google-maps-api-key'
  },
  frontend: {
    REACT_APP_API_URL: 'https://api.xhere.world',
    REACT_APP_GOOGLE_MAPS_API_KEY: 'your-google-maps-api-key',
    REACT_APP_GOOGLE_CLIENT_ID: 'your-google-oauth-client-id',
    REACT_APP_GOOGLE_MAPS_MAP_ID: 'your-google-maps-map-id',
    REACT_APP_USE_ADVANCED_MARKER: 'true'
  }
};

console.log('📋 Required Environment Variables:');
console.log('==================================\n');

console.log('🔧 Backend (Railway):');
Object.entries(envTemplate.backend).forEach(([key, value]) => {
  console.log(`   ${key}=${value}`);
});

console.log('\n🌐 Frontend (Railway):');
Object.entries(envTemplate.frontend).forEach(([key, value]) => {
  console.log(`   ${key}=${value}`);
});

console.log('\n🌍 DNS Configuration (GoDaddy):');
console.log('   Type: CNAME');
console.log('   Name: api');
console.log('   Value: [your-backend-railway-url]');
console.log('   TTL: 600');
console.log('');
console.log('   Type: CNAME');
console.log('   Name: @ (or leave blank)');
console.log('   Value: [your-frontend-railway-url]');
console.log('   TTL: 600');

console.log('\n🔍 Testing Checklist:');
console.log('===================');
console.log('□ Railway backend service deployed');
console.log('□ Railway PostgreSQL database added');
console.log('□ Railway frontend service deployed');
console.log('□ Environment variables configured');
console.log('□ DNS records updated in GoDaddy');
console.log('□ Google Cloud API keys configured');
console.log('□ Database migrations run');
console.log('□ Test user registration');
console.log('□ Test location creation');
console.log('□ Test map functionality');

console.log('\n💰 Estimated Monthly Costs:');
console.log('==========================');
console.log('• Railway Backend: $5/month');
console.log('• Railway Database: $5/month');
console.log('• Railway Frontend: Free');
console.log('• Total: ~$10/month');

console.log('\n📞 Next Steps:');
console.log('==============');
console.log('1. Follow the DEPLOYMENT_GUIDE.md');
console.log('2. Set up Railway account and deploy services');
console.log('3. Configure DNS in GoDaddy');
console.log('4. Set up Google Cloud APIs');
console.log('5. Test all functionality');
console.log('6. Monitor performance and costs');

console.log('\n🎉 Good luck with your XHere.world deployment! 🚀\n'); 