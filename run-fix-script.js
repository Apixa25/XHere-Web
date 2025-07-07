const fetch = require('node-fetch');

async function runFixScript() {
  try {
    console.log('🔧 Running location status fix via admin endpoint...');
    
    // You'll need to get a valid admin token
    const adminToken = process.env.ADMIN_TOKEN || 'YOUR_ADMIN_TOKEN_HERE';
    
    if (adminToken === 'YOUR_ADMIN_TOKEN_HERE') {
      console.log('❌ Please set ADMIN_TOKEN environment variable or update the script with a valid admin token');
      console.log('💡 You can get a token by logging in as an admin user and copying the JWT token');
      return;
    }

    const response = await fetch('http://localhost:3000/api/admin/fix-location-statuses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Fix completed successfully!');
      console.log('📊 Results:', JSON.stringify(result, null, 2));
    } else {
      const error = await response.text();
      console.error('❌ Fix failed:', error);
    }

  } catch (error) {
    console.error('❌ Error running fix script:', error.message);
  }
}

runFixScript(); 