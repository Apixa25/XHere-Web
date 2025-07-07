console.log('Starting simple test...');

try {
  const { sequelize } = require('./config/database');
  console.log('Database config loaded');
  
  sequelize.authenticate()
    .then(() => {
      console.log('Database connection successful');
      process.exit(0);
    })
    .catch(err => {
      console.error('Database connection failed:', err.message);
      process.exit(1);
    });
} catch (error) {
  console.error('Error loading database config:', error.message);
  process.exit(1);
} 