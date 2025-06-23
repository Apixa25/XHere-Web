// Debug script to check database configuration
require('dotenv').config();

console.log('=== DATABASE DEBUG INFO ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);

const config = require('./config/config');
console.log('Config:', JSON.stringify(config, null, 2));

const sequelize = require('./config/database');
console.log('Sequelize config:', sequelize.config);

console.log('=== END DEBUG INFO ==='); 